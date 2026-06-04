<template>
  <div class="print-template-thumb" :class="{ 'is-empty': !hasItems }">
    <div v-if="hasItems" ref="stageRef" class="thumb-stage">
      <div
        v-for="item in previewItems"
        :key="item.id"
        class="thumb-item"
        :class="`thumb-item--${item.type}`"
        :style="itemStyle(item)"
      />
    </div>
    <div v-else class="thumb-placeholder">
      <el-icon :size="36"><Printer /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue';
import { Printer } from '@element-plus/icons-vue';
import type { PrintTemplate, PrintTemplateItem } from '@/components/print-designer';
import { createBlankTemplate } from '@/components/print-designer';
import { getLineOrientation } from '@/components/print-designer/utils/lineItems';
import { localGetPrintTemplate } from '@/utils/printTemplateStorage';
import { printTemplateAdapter } from '@/config/printTemplate';
import type { PrintTemplateVo } from '@/api/wms/printTemplate';

const props = defineProps<{
  templateCode?: string;
  row?: PrintTemplateVo | null;
}>();

const stageRef = ref<HTMLElement | null>(null);
const scale = ref(0.35);

const template = computed<PrintTemplate>(() => {
  if (props.row?.templateContent) {
    const raw = props.row.templateContent;
    const decoded = printTemplateAdapter.decodeTemplateContent(raw as unknown);
    if (decoded && typeof decoded === 'object') return decoded as PrintTemplate;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as PrintTemplate;
      } catch {
        /* fall through */
      }
    }
    if (typeof raw === 'object') return raw as PrintTemplate;
  }
  const code = props.templateCode?.trim();
  if (code) {
    const vo = localGetPrintTemplate(code);
    if (vo?.templateContent) {
      const raw = vo.templateContent;
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw) as PrintTemplate;
        } catch {
          /* fall through */
        }
      } else if (typeof raw === 'object') {
        return raw as PrintTemplate;
      }
    }
  }
  return createBlankTemplate();
});

const previewItems = computed(() => (template.value.tempItems || []).slice(0, 24));

const hasItems = computed(() => previewItems.value.length > 0);

function itemStyle(item: PrintTemplateItem) {
  const s = scale.value;
  const stroke = item.style?.BorderColor || '#303133';
  const orient = getLineOrientation(item);
  const base: Record<string, string> = {
    left: `${item.left * s}px`,
    top: `${item.top * s}px`,
    width: `${Math.max(item.width * s, 4)}px`,
    height: `${Math.max(item.height * s, 3)}px`
  };
  if (orient === 'h') {
    const h = Math.max(item.style?.LineWidth ?? 1, 1) * s;
    return {
      ...base,
      height: `${Math.max(h, 1)}px`,
      background: stroke,
      border: 'none'
    };
  }
  if (orient === 'v') {
    const w = Math.max(item.style?.LineWidth ?? 1, 1) * s;
    return {
      ...base,
      width: `${Math.max(w, 1)}px`,
      background: stroke,
      border: 'none'
    };
  }
  return base;
}

function updateScale() {
  const el = stageRef.value;
  if (!el) return;
  const tw = template.value.width || 380;
  const th = template.value.height || 228;
  const pad = 8;
  const sw = (el.clientWidth - pad * 2) / tw;
  const sh = (el.clientHeight - pad * 2) / th;
  scale.value = Math.min(sw, sh, 0.5);
}

watch([() => props.templateCode, () => props.row, previewItems], () => {
  void nextTick(updateScale);
});

onMounted(() => {
  void nextTick(updateScale);
});
</script>

<style scoped lang="scss">
.print-template-thumb {
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.thumb-stage {
  position: relative;
  width: 100%;
  height: 100%;
  background: #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
}
.thumb-item {
  position: absolute;
  border-radius: 1px;
  background: rgba(64, 158, 255, 0.35);
  pointer-events: none;
}
.thumb-item--braid-table {
  background: rgba(103, 194, 58, 0.4);
}
.thumb-item--bar-code {
  background: repeating-linear-gradient(90deg, #303133 0 2px, transparent 2px 4px);
}
.thumb-item--braid-image {
  background: rgba(144, 147, 153, 0.45);
}
.thumb-placeholder {
  color: var(--el-text-color-placeholder);
  display: flex;
  align-items: center;
  justify-content: center;
}
.is-empty .thumb-placeholder {
  opacity: 0.85;
}
</style>
