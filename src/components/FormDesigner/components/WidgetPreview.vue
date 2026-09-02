<template>
  <div class="widget-preview" :class="{ 'is-layout': isLayout }">
    <template v-if="isLayout">
      <template v-if="widget.type === 'divider'">
        <el-divider :content-position="(widget.props?.contentPosition as any) || 'center'">
          {{ widget.props?.dividerText || widget.label }}
        </el-divider>
      </template>
      <template v-else-if="widget.type === 'button'">
        <el-button :type="(widget.props?.buttonType as any) || 'primary'" disabled>
          {{ widget.props?.buttonText || widget.label }}
        </el-button>
      </template>
      <template v-else-if="widget.type === 'grid'">
        <el-row
          :gutter="gutter"
          class="layout-drop-zone"
          :class="{ 'is-drop-target': dropTargetId === widget.id }"
          @dragover.prevent.stop="onZoneDragOver(widget.id, $event)"
          @drop.stop="emit('containerDrop', widget.id, $event)"
        >
          <el-col v-for="(child, childIndex) in widget.children || []" :key="child.id" :span="getChildSpan(widget, child)">
            <slot name="child" :widget="child" :parent-id="widget.id" :index="childIndex" />
          </el-col>
          <el-col v-if="!(widget.children || []).length" :span="24">
            <div class="layout-placeholder">从左侧或画布拖拽字段到栅格</div>
          </el-col>
        </el-row>
      </template>
      <template v-else-if="widget.type === 'card'">
        <el-card shadow="never" class="layout-card">
          <template #header>{{ widget.label }}</template>
          <div
            class="layout-drop-zone"
            :class="{ 'is-drop-target': dropTargetId === widget.id }"
            @dragover.prevent.stop="onZoneDragOver(widget.id, $event)"
            @drop.stop="emit('containerDrop', widget.id, $event)"
          >
            <el-row :gutter="gutter">
              <el-col v-for="(child, childIndex) in widget.children || []" :key="child.id" :span="Math.min(Math.max(Number(child.span || 24), 1), 24)">
                <slot name="child" :widget="child" :parent-id="widget.id" :index="childIndex" />
              </el-col>
              <el-col v-if="!(widget.children || []).length" :span="24">
                <div class="layout-placeholder">从左侧或画布拖拽字段到卡片</div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </template>
      <template v-else-if="widget.type === 'tabs'">
        <el-tabs v-model="activePane">
          <el-tab-pane v-for="pane in widget.children || []" :key="pane.id" :label="pane.label" :name="pane.id">
            <div
              class="layout-drop-zone"
              :class="{ 'is-drop-target': dropTargetId === pane.id }"
              @dragover.prevent.stop="onZoneDragOver(pane.id, $event)"
              @drop.stop="emit('containerDrop', pane.id, $event)"
            >
              <el-row :gutter="gutter">
                <el-col v-for="(child, childIndex) in pane.children || []" :key="child.id" :span="Math.min(Math.max(Number(child.span || 24), 1), 24)">
                  <slot name="child" :widget="child" :parent-id="pane.id" :index="childIndex" />
                </el-col>
                <el-col v-if="!(pane.children || []).length" :span="24">
                  <div class="layout-placeholder">从左侧或画布拖拽字段到 {{ pane.label }}</div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>
        </el-tabs>
      </template>
    </template>
    <el-form v-else :label-width="labelWidth" :label-position="labelPosition" disabled>
      <FormFieldList :widgets="[widget]" :model="previewModel" design-mode />
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import FormFieldList from './FormFieldList.vue';
import type { FormWidget } from '../types';

const props = defineProps<{
  widget: FormWidget;
  labelWidth?: string;
  labelPosition?: 'left' | 'right' | 'top';
  gutter?: number;
  dropTargetId?: string;
}>();

const emit = defineEmits<{
  containerDrop: [targetId: string, event: DragEvent];
  containerDragOver: [targetId: string];
}>();

function onZoneDragOver(targetId: string, event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = event.dataTransfer.effectAllowed === 'move' ? 'move' : 'copy';
  }
  emit('containerDragOver', targetId);
}

const previewModel = reactive<Record<string, unknown>>({});
const isLayout = computed(() => ['grid', 'card', 'tabs', 'divider', 'button'].includes(props.widget.type));
const activePane = ref('');

function getChildSpan(parent: FormWidget, child: FormWidget) {
  if (child.span) return Math.min(Math.max(Number(child.span), 1), 24);
  const cols = Math.min(Math.max(Number(parent.props?.cols || 2), 1), 4);
  return Math.floor(24 / cols);
}

watch(
  () => props.widget.children?.map((item) => item.id).join(','),
  () => {
    const panes = props.widget.children || [];
    if (!panes.length) {
      activePane.value = '';
      return;
    }
    if (!panes.some((pane) => pane.id === activePane.value)) {
      activePane.value = panes[0].id;
    }
  },
  { immediate: true }
);

watch(
  () => props.widget,
  (widget) => {
    if (widget.field) {
      previewModel[widget.field] = widget.defaultValue ?? '';
    }
  },
  { immediate: true, deep: true }
);
</script>

<style scoped>
.widget-preview {
  width: 100%;
}
.widget-preview :deep(.el-form) {
  width: 100%;
}
.widget-preview :deep(.el-form-item) {
  width: 100%;
  margin-bottom: 8px;
}
.widget-preview :deep(.el-form-item__content) {
  width: 100%;
}
.layout-drop-zone {
  width: 100%;
  min-height: 52px;
}
.layout-drop-zone.is-drop-target {
  outline: 1px dashed #409eff;
  outline-offset: 2px;
  background: rgb(64 158 255 / 6%);
}
.layout-placeholder {
  min-height: 52px;
  border: 1px dashed #aeb6c3;
  border-radius: 0;
  padding: 16px;
  background: #fff;
  text-align: center;
  color: #909399;
  font-size: 12px;
}
.layout-card {
  margin-bottom: 8px;
  border-radius: 2px;
  box-shadow: 0 2px 10px rgb(0 0 0 / 5%);
}
.layout-card :deep(.el-card__header) {
  padding: 14px 20px;
  color: #303133;
  font-size: 14px;
}
.layout-card :deep(.el-card__body) {
  padding: 18px 20px;
}
.widget-preview :deep(.el-tabs__header) {
  margin-bottom: 14px;
}
.widget-preview :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: #dcdfe6;
}
.widget-preview :deep(.el-tabs__item) {
  height: 38px;
  line-height: 38px;
  font-size: 14px;
}
</style>
