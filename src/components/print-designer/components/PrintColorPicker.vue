<template>
  <el-popover
    v-model:visible="panelOpen"
    placement="bottom-start"
    :width="228"
    trigger="click"
    :disabled="disabled"
    popper-class="pd-color-popper"
  >
    <template #reference>
      <button
        type="button"
        class="pd-color-trigger"
        :class="{ 'pd-color-trigger--compact': effectiveCompact }"
        :disabled="disabled"
        @click.stop
      >
        <template v-if="effectiveCompact">
          <svg
            v-if="compactIcon === 'pencil'"
            class="pd-color-trigger__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.83H5v-.92l9.06-9.06.92.92L5.92 20.08zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
            />
          </svg>
          <svg
            v-else-if="compactIcon === 'font'"
            class="pd-color-trigger__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M5.5 17h2.27l1.05-3h6.36l1.05 3h2.27L13.25 4h-2.5L5.5 17zm4.05-5L12 6.04 14.45 12h-4.9z"
            />
          </svg>
          <svg
            v-else
            class="pd-color-trigger__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38L3.44 8.94c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"
            />
          </svg>
          <span
            class="pd-color-trigger__bar"
            :class="{ 'is-transparent': isTransparentValue }"
            :style="triggerSwatchStyle"
          />
        </template>
        <template v-else>
          <span class="pd-color-trigger__swatch" :class="{ 'is-transparent': isTransparentValue }" :style="triggerSwatchStyle" />
          <span class="pd-color-trigger__hex">{{ triggerHexLabel }}</span>
        </template>
      </button>
    </template>

    <div class="pd-color-panel">
      <button
        v-if="showTransparent"
        type="button"
        class="pd-color-transparent-btn"
        :class="{ active: isTransparentValue }"
        @click="pickTransparent"
      >
        <span class="pd-color-transparent-btn__swatch" />
        {{ t('printDesigner.colorPicker.transparent') }}
      </button>
      <div class="pd-color-grid" :style="{ gridTemplateColumns: `repeat(${PRINT_COLOR_GRID_COLS}, 1fr)` }">
        <button
          v-for="(color, idx) in PRINT_COLOR_SWATCHES"
          :key="idx"
          type="button"
          class="pd-color-cell"
          :class="{ active: !isTransparentValue && isSameColor(color, modelValue) }"
          :style="{ background: color }"
          :title="color"
          @click="pick(color)"
        />
      </div>
      <el-input
        v-model="hexDraft"
        class="pd-color-hex-input"
        size="small"
        :placeholder="t('printDesigner.colorPicker.hexPlaceholder')"
        :disabled="disabled"
        @change="commitHex"
        @keyup.enter="commitHex"
      />
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  PRINT_COLOR_GRID_COLS,
  PRINT_COLOR_SWATCHES,
  PRINT_COLOR_TRANSPARENT
} from '../const/printColorPalette';

const { t } = useI18n();

const modelValue = defineModel<string>({ default: '#000000' });

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    /** Compact mode: icon + thin color bar (no hex). */
    compact?: boolean;
    showTransparent?: boolean;
    /** Compact icon: 'pencil' (default) / 'font' (A) / 'highlight' (paint bucket) */
    compactIcon?: 'pencil' | 'font' | 'highlight';
  }>(),
  {
    disabled: false,
    compact: false,
    showTransparent: false,
    compactIcon: 'pencil'
  }
);

const effectiveCompact = computed(() => props.compact || props.compactIcon !== 'pencil');

const panelOpen = ref(false);
const hexDraft = ref('');

const isTransparentValue = computed(() => {
  const v = (modelValue.value || '').trim().toLowerCase();
  return v === '' || v === PRINT_COLOR_TRANSPARENT;
});

function normalizeHex(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  if (s.toLowerCase() === PRINT_COLOR_TRANSPARENT) return PRINT_COLOR_TRANSPARENT;
  if (!s.startsWith('#')) s = `#${s}`;
  if (/^#[0-9a-f]{3}$/i.test(s)) {
    const h = s.slice(1);
    s = `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();
  return null;
}

function isSameColor(a: string, b: string | undefined): boolean {
  const na = normalizeHex(a);
  const nb = normalizeHex(b || '');
  return !!na && na === nb;
}

const triggerHexLabel = computed(() => {
  if (isTransparentValue.value) return PRINT_COLOR_TRANSPARENT;
  return normalizeHex(modelValue.value || '') || '#000000';
});

const triggerSwatchStyle = computed(() => {
  if (isTransparentValue.value) return {};
  const c = normalizeHex(modelValue.value || '') || '#303133';
  return { background: c };
});

function syncHexDraftFromModel() {
  hexDraft.value = triggerHexLabel.value;
}

function pick(color: string) {
  const n = normalizeHex(color);
  if (!n || n === PRINT_COLOR_TRANSPARENT) return;
  modelValue.value = n;
  hexDraft.value = n;
  panelOpen.value = false;
}

function pickTransparent() {
  modelValue.value = PRINT_COLOR_TRANSPARENT;
  hexDraft.value = PRINT_COLOR_TRANSPARENT;
  panelOpen.value = false;
}

function commitHex() {
  const n = normalizeHex(hexDraft.value);
  if (!n) {
    syncHexDraftFromModel();
    return;
  }
  if (props.showTransparent && n === PRINT_COLOR_TRANSPARENT) {
    modelValue.value = PRINT_COLOR_TRANSPARENT;
  } else if (n !== PRINT_COLOR_TRANSPARENT) {
    modelValue.value = n;
  }
  hexDraft.value = triggerHexLabel.value;
  panelOpen.value = false;
}

watch(
  () => modelValue.value,
  () => syncHexDraftFromModel(),
  { immediate: true }
);

watch(panelOpen, (open) => {
  if (open) syncHexDraftFromModel();
});
</script>

<style scoped lang="scss">
.pd-color-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 200px;
  padding: 4px 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-fill-color-blank);
  cursor: pointer;
  transition: border-color 0.15s;
  &:hover:not(:disabled) {
    border-color: var(--el-color-primary);
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}
.pd-color-trigger__swatch {
  width: 22px;
  height: 16px;
  border-radius: 2px;
  border: 1px solid rgb(0 0 0 / 12%);
  flex-shrink: 0;
  &.is-transparent {
    background:
      linear-gradient(45deg, #ccc 25%, transparent 25%),
      linear-gradient(-45deg, #ccc 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ccc 75%),
      linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 8px 8px;
    background-position:
      0 0,
      0 4px,
      4px -4px,
      -4px 0;
    background-color: #fff;
  }
}
.pd-color-trigger__hex {
  font-size: 12px;
  font-family: Consolas, Monaco, monospace;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pd-color-trigger--compact {
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 40px;
  max-width: none;
  padding: 4px 6px;
  border: none;
  border-radius: 2px;
  background: transparent;
  &:hover:not(:disabled) {
    background: var(--el-fill-color-light);
  }
}
.pd-color-trigger__icon {
  width: 18px;
  height: 18px;
  color: var(--el-text-color-regular);
  display: block;
}
.pd-color-trigger__bar {
  display: block;
  width: 28px;
  height: 4px;
  border-radius: 1px;
  border: 1px solid rgb(0 0 0 / 15%);
  &.is-transparent {
    background:
      linear-gradient(45deg, #ccc 25%, transparent 25%),
      linear-gradient(-45deg, #ccc 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ccc 75%),
      linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 4px 4px;
    background-color: #fff;
  }
}
.pd-color-panel {
  padding: 2px 0 0;
}
.pd-color-grid {
  display: grid;
  gap: 3px;
  margin-bottom: 8px;
}
.pd-color-cell {
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid rgb(0 0 0 / 10%);
  border-radius: 2px;
  cursor: pointer;
  box-sizing: border-box;
  &:hover {
    transform: scale(1.08);
    z-index: 1;
    box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
  }
  &.active {
    box-shadow: 0 0 0 2px var(--el-color-primary);
  }
}
.pd-color-transparent-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin-bottom: 8px;
  padding: 4px 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-fill-color-blank);
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  &.active {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
}
.pd-color-transparent-btn__swatch {
  width: 18px;
  height: 14px;
  border: 1px solid rgb(0 0 0 / 12%);
  border-radius: 2px;
  background:
    linear-gradient(45deg, #bbb 25%, transparent 25%),
    linear-gradient(-45deg, #bbb 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #bbb 75%),
    linear-gradient(-45deg, transparent 75%, #bbb 75%);
  background-size: 6px 6px;
  background-position:
    0 0,
    0 3px,
    3px -3px,
    -3px 0;
  background-color: #fff;
}
.pd-color-hex-input {
  width: 100%;
  :deep(.el-input__inner) {
    font-family: Consolas, Monaco, monospace;
    font-size: 12px;
  }
}
</style>

<style lang="scss">
.pd-color-popper.el-popover {
  padding: 10px !important;
}
</style>
