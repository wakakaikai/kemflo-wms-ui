<template>
  <div class="pd-border-panel" :class="{ 'pd-border-panel--simple': simple }">
    <template v-if="!simple">
      <div class="pd-border-presets" :style="presetGridStyle">
        <template v-for="(preset, idx) in presetSlots" :key="idx">
          <button
            v-if="preset"
            type="button"
            class="pd-border-preset-btn"
            :class="{ active: borderPreset === preset }"
            :title="t(`printDesigner.borderPanel.presets.${preset}`)"
            @click="borderPreset = preset"
          >
            <span class="pd-border-preset-icon" :class="`pd-border-preset-icon--${preset}`" />
          </button>
          <span v-else class="pd-border-preset-placeholder" />
        </template>
      </div>
      <div class="pd-border-divider" />
    </template>

    <div class="pd-border-side">
      <div class="pd-border-side__color">
        <PrintColorPicker v-model="borderColor" compact />
      </div>
      <div class="pd-border-side__lines">
        <el-dropdown
          trigger="click"
          placement="bottom-end"
          :teleported="false"
          popper-class="pd-line-style-dropdown"
          @command="lineStyle = $event"
        >
          <button
            type="button"
            class="pd-line-style-trigger"
            :title="currentLineStyleOption?.label"
          >
            <span class="pd-line-style-trigger-icon">
              <span
                v-for="(_, i) in 3"
                :key="i"
                class="pd-line-style-preview"
                :class="`pd-line-style-preview--${currentLineStyleOption?.key ?? 'solid'}`"
              />
            </span>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="opt in lineStyleOptions"
                :key="opt.value"
                :command="opt.value"
                :class="{ 'is-active': lineStyle === opt.value }"
              >
                <span class="pd-line-style-item">
                  <span class="pd-line-style-preview" :class="`pd-line-style-preview--${opt.key}`" />
                  <span class="pd-line-style-label">{{ opt.label }}</span>
                </span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-input-number
          v-if="!simple"
          v-model="lineWidth"
          class="pd-line-width-input"
          :min="1"
          :max="12"
          :step="1"
          controls-position="right"
          size="small"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { BorderPreset } from '../types';
import { BOX_BORDER_PRESETS, TABLE_BORDER_PRESETS } from '../utils/itemBorderStyle';
import PrintColorPicker from './PrintColorPicker.vue';

const { t } = useI18n();

const borderPreset = defineModel<BorderPreset>('borderPreset', { default: 'none' });
const borderColor = defineModel<string>('borderColor', { default: '#303133' });
const lineStyle = defineModel<number>('lineStyle', { default: 0 });
const lineWidth = defineModel<number>('lineWidth', { default: 1 });

const props = withDefaults(
  defineProps<{
    tableMode?: boolean;
    /** Simple mode: only show color + line style (no preset grid, no width input). */
    simple?: boolean;
  }>(),
  { tableMode: false, simple: false }
);

const presetGridStyle = {
  gridTemplateColumns: 'repeat(5, 24px)',
  gridTemplateRows: 'repeat(2, 24px)'
};

/** ?????7 ??? 5??2 ????��??? 3 ?????? */
const BOX_PRESET_SLOTS: (BorderPreset | null)[] = [
  'all',
  'outer',
  'left',
  'top',
  'right',
  'bottom',
  'none',
  null,
  null,
  null
];

const presetSlots = computed(() =>
  props.tableMode ? [...TABLE_BORDER_PRESETS] : BOX_PRESET_SLOTS
);

const lineStyleOptions = computed(() => [
  { value: 0, key: 'solid', label: t('printDesigner.canvas.lineStyleSolid') },
  { value: 1, key: 'dash', label: t('printDesigner.canvas.lineStyleDash') },
  { value: 2, key: 'dot', label: t('printDesigner.canvas.lineStyleDot') }
]);

const currentLineStyleOption = computed(
  () => lineStyleOptions.value.find((opt) => opt.value === lineStyle.value) ?? lineStyleOptions.value[0]
);
</script>

<style scoped lang="scss">
.pd-border-panel {
  display: inline-flex;
  align-items: stretch;
  gap: 0;
  padding: 6px 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 6%);
}
.pd-border-presets {
  display: grid;
  gap: 2px;
  flex-shrink: 0;
}
.pd-border-preset-placeholder {
  width: 24px;
  height: 24px;
  display: block;
}
.pd-border-divider {
  width: 1px;
  margin: 2px 8px;
  background: var(--el-border-color);
  flex-shrink: 0;
}
.pd-border-preset-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 2px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: var(--el-fill-color-light);
  }
  &.active {
    background: var(--el-fill-color);
    box-shadow: inset 0 0 0 1px var(--el-border-color);
  }
}
.pd-border-preset-icon {
  display: block;
  width: 16px;
  height: 12px;
  box-sizing: border-box;
  border: 1px solid #606266;
  position: relative;
}
.pd-border-preset-icon--none {
  border: 1px dashed #c0c4cc;
  background: #fff;
}
.pd-border-preset-icon--all {
  border-width: 2px;
  border-color: #303133;
}
.pd-border-preset-icon--outer {
  border-width: 2px;
  border-color: #303133;
}
.pd-border-preset-icon--inner::before,
.pd-border-preset-icon--inner::after {
  content: '';
  position: absolute;
  background: #303133;
}
.pd-border-preset-icon--inner::before {
  left: 50%;
  top: 1px;
  bottom: 1px;
  width: 1px;
  transform: translateX(-50%);
}
.pd-border-preset-icon--inner::after {
  top: 50%;
  left: 1px;
  right: 1px;
  height: 1px;
  transform: translateY(-50%);
}
.pd-border-preset-icon--innerH::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 1px;
  right: 1px;
  height: 2px;
  background: #303133;
  transform: translateY(-50%);
}
.pd-border-preset-icon--innerV::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 1px;
  bottom: 1px;
  width: 2px;
  background: #303133;
  transform: translateX(-50%);
}
.pd-border-preset-icon--left {
  border-left-width: 2px;
  border-left-color: #303133;
}
.pd-border-preset-icon--top {
  border-top-width: 2px;
  border-top-color: #303133;
}
.pd-border-preset-icon--right {
  border-right-width: 2px;
  border-right-color: #303133;
}
.pd-border-preset-icon--bottom {
  border-bottom-width: 2px;
  border-bottom-color: #303133;
}
.pd-border-side {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0;
}
.pd-border-panel--simple {
  padding: 4px 6px;
}
.pd-border-panel--simple .pd-border-side {
  flex-direction: row;
  align-items: center;
  gap: 6px;
}
.pd-border-panel--simple .pd-border-side__lines {
  flex-direction: row;
  align-items: center;
}
.pd-border-side__color {
  display: flex;
  justify-content: center;
}
.pd-border-side__lines {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.pd-line-style-trigger {
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 2px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  &:hover {
    background: var(--el-fill-color-light);
  }
  &:focus-visible {
    box-shadow: inset 0 0 0 1px var(--el-border-color);
  }
}
.pd-line-style-trigger-icon {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  width: 16px;
  height: 12px;
}
.pd-line-style-trigger-icon .pd-line-style-preview {
  width: 100%;
  border-top-width: 1px;
}
.pd-line-style-preview {
  display: block;
  width: 100%;
  height: 0;
  border-top: 2px solid #303133;
}
.pd-line-style-preview--dash {
  border-top-style: dashed;
}
.pd-line-style-preview--dot {
  border-top-style: dotted;
}
.pd-line-width-input {
  width: 52px;
  margin-top: 2px;
}
.pd-line-width-input :deep(.el-input__wrapper) {
  padding-left: 4px;
  padding-right: 4px;
}
</style>

<style lang="scss">
.pd-line-style-dropdown {
  .el-dropdown-menu__item {
    padding: 4px 10px;
    line-height: 1;
    &.is-active {
      background: var(--el-fill-color);
      color: var(--el-color-primary);
    }
  }
  .pd-line-style-item {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 96px;
  }
  .pd-line-style-item .pd-line-style-preview {
    width: 56px;
    flex-shrink: 0;
  }
  .pd-line-style-label {
    font-size: 12px;
    color: var(--el-text-color-regular);
  }
}
</style>
