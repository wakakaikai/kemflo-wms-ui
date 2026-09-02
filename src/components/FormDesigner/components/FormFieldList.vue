<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-row :gutter="16" class="field-row">
    <template v-for="widget in widgets" :key="widget.id">
      <el-col v-if="!isHidden(widget)" :span="getColSpan(widget)">
        <template v-if="widget.type === 'divider'">
          <el-divider :content-position="(widget.props?.contentPosition as any) || 'center'">
            {{ widget.props?.dividerText || widget.label }}
          </el-divider>
        </template>

        <template v-else-if="widget.type === 'button'">
          <el-form-item>
            <el-button :type="(widget.props?.buttonType as any) || 'primary'" :disabled="isDisabled(widget)">
              {{ widget.props?.buttonText || widget.label }}
            </el-button>
          </el-form-item>
        </template>

        <template v-else-if="widget.type === 'grid'">
          <el-row :gutter="16">
            <el-col v-for="child in widget.children || []" :key="child.id" :span="getGridChildSpan(widget, child)">
              <FormFieldList :widgets="[child]" :model="model" :design-mode="designMode" ignore-span />
            </el-col>
          </el-row>
        </template>

        <template v-else-if="widget.type === 'card'">
          <el-card shadow="never" class="mb-3">
            <template #header>{{ widget.label }}</template>
            <FormFieldList :widgets="widget.children || []" :model="model" :design-mode="designMode" />
          </el-card>
        </template>

        <template v-else-if="widget.type === 'tabs'">
          <el-tabs>
            <el-tab-pane v-for="pane in widget.children || []" :key="pane.id" :label="pane.label">
              <FormFieldList :widgets="pane.children || []" :model="model" :design-mode="designMode" />
            </el-tab-pane>
          </el-tabs>
        </template>

        <el-form-item v-else :label="getWidgetLabel(widget)" :prop="widget.field" :required="widget.required" class="form-widget-item">
          <el-input v-if="['input', 'phone', 'email'].includes(widget.type)" v-model="model[widget.field]" :type="getInputType(widget)" :placeholder="widget.placeholder" :disabled="isDisabled(widget)" :readonly="isReadonly(widget)" clearable />
          <el-input v-else-if="widget.type === 'textarea'" v-model="model[widget.field]" type="textarea" :rows="3" :placeholder="widget.placeholder" :disabled="isDisabled(widget)" :readonly="isReadonly(widget)" />
          <div v-else-if="['editor', 'markdown'].includes(widget.type) && designMode" class="form-rich-preview" v-html="richPreview(widget)" />
          <Editor
            v-else-if="['editor', 'markdown'].includes(widget.type)"
            :model-value="String(model[widget.field] ?? '')"
            :height="Number(widget.props?.height ?? 220)"
            :min-height="160"
            :read-only="isDisabled(widget) || isReadonly(widget)"
            @update:model-value="model[widget.field] = $event"
          />
          <el-input-number v-else-if="['number', 'integer', 'money'].includes(widget.type)" v-model="model[widget.field]" :precision="getNumberPrecision(widget)" :disabled="isDisabled(widget) || isReadonly(widget)" controls-position="right" style="width: 100%" />

          <el-radio-group v-else-if="widget.type === 'radio'" v-model="model[widget.field]" :disabled="isDisabled(widget) || isReadonly(widget)">
            <el-radio v-for="opt in widget.options || []" :key="String(opt.value)" :value="opt.value">{{ opt.label }}</el-radio>
          </el-radio-group>
          <el-checkbox-group v-else-if="widget.type === 'checkbox'" v-model="model[widget.field]" :disabled="isDisabled(widget) || isReadonly(widget)">
            <el-checkbox v-for="opt in widget.options || []" :key="String(opt.value)" :value="opt.value">{{ opt.label }}</el-checkbox>
          </el-checkbox-group>
          <el-select v-else-if="widget.type === 'select'" v-model="model[widget.field]" :disabled="isDisabled(widget) || isReadonly(widget)" clearable style="width: 100%">
            <el-option v-for="opt in widget.options || []" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
          </el-select>

          <el-switch v-else-if="widget.type === 'switch'" v-model="model[widget.field]" :disabled="isDisabled(widget) || isReadonly(widget)" />
          <el-slider v-else-if="widget.type === 'slider'" v-model="model[widget.field]" :min="Number(widget.props?.min ?? 0)" :max="Number(widget.props?.max ?? 100)" :step="Number(widget.props?.step ?? 1)" :disabled="isDisabled(widget) || isReadonly(widget)" show-input />
          <el-rate v-else-if="widget.type === 'rate'" v-model="model[widget.field]" :max="Number(widget.props?.max ?? 5)" :disabled="isDisabled(widget) || isReadonly(widget)" />
          <el-color-picker v-else-if="widget.type === 'color'" v-model="model[widget.field]" :disabled="isDisabled(widget) || isReadonly(widget)" />
          <el-date-picker v-else-if="widget.type === 'date'" v-model="model[widget.field]" type="date" value-format="YYYY-MM-DD" :disabled="isDisabled(widget) || isReadonly(widget)" style="width: 100%" />
          <el-date-picker v-else-if="widget.type === 'datetime'" v-model="model[widget.field]" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" :disabled="isDisabled(widget) || isReadonly(widget)" style="width: 100%" />
          <el-time-picker v-else-if="widget.type === 'time'" v-model="model[widget.field]" value-format="HH:mm:ss" :disabled="isDisabled(widget) || isReadonly(widget)" style="width: 100%" />

          <ImageUpload v-else-if="widget.type === 'image'" v-model="model[widget.field]" :limit="Number(widget.props?.limit ?? 3)" :file-size="Number(widget.props?.fileSize ?? 5)" :is-show-tip="false" :disabled="isDisabled(widget) || isReadonly(widget)" />
          <FileUpload v-else-if="widget.type === 'upload'" v-model="model[widget.field]" :limit="Number(widget.props?.limit ?? 3)" :file-size="Number(widget.props?.fileSize ?? 20)" :is-show-tip="false" :disabled="isDisabled(widget) || isReadonly(widget)" />
          <el-cascader v-else-if="widget.type === 'cascader'" v-model="model[widget.field]" :options="(widget.props?.cascaderOptions as any) || []" :separator="String(widget.props?.separator || ' / ')" :disabled="isDisabled(widget) || isReadonly(widget)" clearable style="width: 100%" />

          <div v-else-if="widget.type === 'staticText'" class="form-static-text" v-html="String(widget.props?.text || widget.defaultValue || widget.label || '')" />
          <el-input v-else-if="['uppercaseMoney', 'barcode', 'textGroup', 'autoNumber', 'formula'].includes(widget.type)" v-model="model[widget.field]" :placeholder="widget.placeholder" :disabled="isDisabled(widget)" :readonly="isReadonly(widget) || Boolean(widget.props?.readonly)" clearable>
            <template v-if="widget.type === 'autoNumber'" #prepend>{{ widget.props?.prefix || 'NO' }}</template>
          </el-input>
          <div v-else-if="widget.type === 'map'" class="form-map-placeholder" :style="{ height: `${Number(widget.props?.height ?? 180)}px` }">
            <el-icon><MapLocation /></el-icon>
            <span>地图位置</span>
          </div>
          <el-input v-else-if="widget.type === 'location'" v-model="model[widget.field]" :placeholder="widget.placeholder" :disabled="isDisabled(widget)" readonly>
            <template #append>
              <el-button>{{ widget.props?.buttonText || '获取定位' }}</el-button>
            </template>
          </el-input>
          <SignatureInput v-else-if="widget.type === 'signature'" v-model="model[widget.field]" :button-text="String(widget.props?.buttonText || '添加签名')" :disabled="isDisabled(widget) || isReadonly(widget)" />
          <OcrInput v-else-if="widget.type === 'ocr'" v-model="model[widget.field]" :button-text="String(widget.props?.buttonText || '识别文本')" :disabled="isDisabled(widget)" :readonly="isReadonly(widget)" />
        </el-form-item>
      </el-col>
    </template>
  </el-row>
</template>

<script setup lang="ts">
import { MapLocation } from '@element-plus/icons-vue';
import FileUpload from '@/components/FileUpload/index.vue';
import ImageUpload from '@/components/ImageUpload/index.vue';
import Editor from '@/components/Editor/index.vue';
import FormFieldList from './FormFieldList.vue';
import OcrInput from './OcrInput.vue';
import SignatureInput from './SignatureInput.vue';
import type { FormWidget } from '../types';

defineOptions({ name: 'FormFieldList' });

const props = defineProps<{
  widgets: FormWidget[];
  model: Record<string, any>;
  designMode?: boolean;
  ignoreSpan?: boolean;
}>();

function getColSpan(widget: FormWidget) {
  if (props.designMode || props.ignoreSpan) return 24;
  return Math.min(Math.max(Number(widget.span || 24), 1), 24);
}

function getGridChildSpan(parent: FormWidget, child: FormWidget) {
  if (child.span) return Math.min(Math.max(Number(child.span), 1), 24);
  const cols = Math.min(Math.max(Number(parent.props?.cols || 2), 1), 4);
  return Math.floor(24 / cols);
}

function getInputType(widget: FormWidget) {
  if (widget.type === 'email') return 'email';
  if (widget.type === 'phone') return 'tel';
  return 'text';
}

function getNumberPrecision(widget: FormWidget) {
  if (widget.type === 'integer') return 0;
  if (widget.type === 'money') return 2;
  return undefined;
}

function isHidden(widget: FormWidget) {
  return Boolean(widget.props?.hidden);
}

function isDisabled(widget: FormWidget) {
  return Boolean(widget.props?.disabled);
}

function isReadonly(widget: FormWidget) {
  return Boolean(widget.props?.readonly);
}

function getWidgetLabel(widget: FormWidget) {
  return widget.props?.hideTitle ? '' : widget.label;
}

function richPreview(widget: FormWidget) {
  const html = String(props.model[widget.field] || widget.defaultValue || '');
  return html || `<span class="rich-placeholder">${widget.placeholder || '富文本'}</span>`;
}
</script>

<style scoped>
.mb-3 {
  margin-bottom: 12px;
}
.field-row {
  width: 100%;
}
.form-widget-item {
  width: 100%;
}
.form-widget-item :deep(.el-form-item__content) {
  width: 100%;
}
.form-static-text {
  min-height: 32px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}
.form-static-text :deep(p) {
  margin: 0 0 8px;
}
.form-rich-preview {
  min-height: 72px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-regular);
  line-height: 1.6;
}
.form-rich-preview :deep(.rich-placeholder) {
  color: var(--el-text-color-placeholder);
}
.form-map-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
}
</style>
