<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="property-panel">
    <el-tabs v-model="activeTab" stretch class="property-tabs">
      <el-tab-pane label="字段属性" name="field">
        <template v-if="widget">
          <div class="field-head">
            <div class="field-title">
              <el-icon><EditPen /></el-icon>
              <span>{{ widget.label }}</span>
            </div>
            <el-button circle plain icon="Link" />
          </div>
          <el-form size="small" class="property-form" label-position="top">
            <el-form-item>
              <template #label>
                <div class="label-row">
                  <span>标题</span>
                  <el-checkbox v-model="hideTitle">隐藏标题</el-checkbox>
                </div>
              </template>
              <el-input v-model="widget.label" />
            </el-form-item>
            <el-form-item label="字段名">
              <el-input v-model="widget.field" />
            </el-form-item>
            <el-form-item label="CSS类名">
              <el-input v-model="cssClass" />
            </el-form-item>
            <el-form-item label="数据绑定Key">
              <el-input v-model="dataKey" />
            </el-form-item>
            <el-form-item v-if="showPlaceholder" label="占位提示">
              <el-input v-model="widget.placeholder" />
            </el-form-item>
            <el-form-item v-if="widget.type === 'staticText'" label="文本内容">
              <el-input :model-value="plainText(staticText)" readonly placeholder="点击右侧图标编辑富文本">
                <template #append>
                  <el-button :icon="EditPen" @click="openDefaultEditor" />
                </template>
              </el-input>
            </el-form-item>
            <el-form-item v-if="showDefaultValue" label="默认值">
              <el-switch v-if="widget.type === 'switch'" v-model="switchDefault" />
              <el-input-number v-else-if="isNumberType" v-model="numberDefault" controls-position="right" style="width: 100%" />
              <el-select v-else-if="hasOptions && widget.type !== 'checkbox'" v-model="selectDefault" clearable style="width: 100%">
                <el-option v-for="opt in widget.options || []" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
              </el-select>
              <el-input v-else-if="usesRichDefault" :model-value="plainText(textDefault)" readonly placeholder="点击右侧图标编辑富文本">
                <template #append>
                  <el-button :icon="EditPen" @click="openDefaultEditor" />
                </template>
              </el-input>
              <el-input v-else v-model="textDefault" placeholder="请输入默认值">
                <template #append>
                  <el-button :icon="EditPen" @click="openDefaultEditor" />
                </template>
              </el-input>
            </el-form-item>
            <el-form-item v-if="widget.type === 'formula'" label="公式">
              <el-input v-model="formulaExpression" placeholder="例如：price * qty" />
            </el-form-item>
            <el-form-item v-if="widget.type === 'ocr'" label="识别类型">
              <el-select v-model="ocrType">
                <el-option label="增值税发票" value="vat_invoice" />
                <el-option label="通用文字" value="general" />
                <el-option label="二维码/条码" value="code" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="widget.type === 'ocr'" label="按钮文字">
              <el-input v-model="ocrButtonText" />
            </el-form-item>
            <el-form-item v-if="showRequired" label="必填">
              <el-switch v-model="widget.required" />
            </el-form-item>
            <el-form-item label="操作属性">
              <div class="check-list">
                <el-checkbox v-model="disabled">禁用</el-checkbox>
                <el-checkbox v-model="hidden">隐藏</el-checkbox>
                <el-checkbox v-model="readonly">只读</el-checkbox>
              </div>
            </el-form-item>
            <el-form-item v-if="widget.type !== 'tabPane'" label="字段宽度">
              <div class="span-btns">
                <button v-for="opt in spanOptions" :key="opt.value" type="button" :class="{ active: widgetSpan === opt.value }" @click="widgetSpan = opt.value">
                  {{ opt.label }}
                </button>
              </div>
            </el-form-item>
            <el-form-item v-if="widget.type === 'grid'" label="列数">
              <el-input-number v-model="gridCols" :min="1" :max="4" />
            </el-form-item>
            <el-form-item v-if="widget.type === 'tabs'" label="标签页">
              <div class="option-list">
                <div v-for="(pane, idx) in widget.children || []" :key="pane.id" class="option-row pane-row">
                  <el-input v-model="pane.label" placeholder="标签名称" />
                  <el-button link type="danger" icon="Delete" :disabled="(widget.children || []).length <= 1" @click="removePane(idx)" />
                </div>
                <el-button type="primary" link icon="Plus" @click="addPane">添加标签</el-button>
              </div>
            </el-form-item>
            <el-form-item v-if="widget.type === 'button'" label="按钮文字">
              <el-input v-model="buttonText" />
            </el-form-item>
            <el-form-item v-if="widget.type === 'button'" label="按钮类型">
              <el-select v-model="buttonType">
                <el-option label="主要" value="primary" />
                <el-option label="成功" value="success" />
                <el-option label="警告" value="warning" />
                <el-option label="危险" value="danger" />
                <el-option label="默认" value="default" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="widget.type === 'divider'" label="分割线文字">
              <el-input v-model="dividerText" />
            </el-form-item>
            <el-form-item v-if="hasOptions" label="选项">
              <div class="option-list">
                <div v-for="(opt, idx) in widget.options || []" :key="idx" class="option-row">
                  <el-input v-model="opt.label" placeholder="标签" />
                  <el-input v-model="opt.value" placeholder="值" />
                  <el-button link type="danger" icon="Delete" @click="removeOption(idx)" />
                </div>
                <el-button type="primary" link icon="Plus" @click="addOption">添加选项</el-button>
              </div>
            </el-form-item>
            <el-form-item label="字段说明">
              <el-input v-model="fieldHelp" type="textarea" :rows="3" placeholder="请输入字段说明" />
            </el-form-item>
          </el-form>
        </template>
        <el-empty v-else description="请选择画布中的字段" />
      </el-tab-pane>

      <el-tab-pane label="表单属性" name="form">
        <el-form size="small" class="property-form" label-position="top">
          <el-form-item label="标签宽度">
            <el-input-number v-model="localFormProps.labelWidth" :min="60" :max="240" />
          </el-form-item>
          <el-form-item label="标签位置">
            <el-radio-group v-model="localFormProps.labelPosition">
              <el-radio-button value="left">左</el-radio-button>
              <el-radio-button value="right">右</el-radio-button>
              <el-radio-button value="top">上</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="组件尺寸">
            <el-radio-group v-model="localFormProps.size">
              <el-radio-button value="large">大</el-radio-button>
              <el-radio-button value="default">中</el-radio-button>
              <el-radio-button value="small">小</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="栅格间距">
            <el-input-number v-model="localFormProps.gutter" :min="0" :max="48" />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="调试配置" name="debug">
        <el-form size="small" class="property-form" label-position="top">
          <el-form-item label="主题色">
            <el-color-picker v-model="localFormProps.themeColor" />
          </el-form-item>
          <el-form-item label="预览设备">
            <el-radio-group v-model="deviceType">
              <el-radio-button value="adaptive">自适应</el-radio-button>
              <el-radio-button value="desktop">PC</el-radio-button>
              <el-radio-button value="mobile">手机</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="defaultEditorVisible" :title="defaultEditorTitle" width="720px" append-to-body destroy-on-close class="default-value-dialog">
      <Editor v-if="usesRichDefault || widget?.type === 'staticText'" v-model="defaultEditorDraft" :height="280" :min-height="220" />
      <el-input v-else v-model="defaultEditorDraft" type="textarea" :rows="12" placeholder="请输入默认值" />
      <template #footer>
        <el-button @click="defaultEditorVisible = false">取消</el-button>
        <el-button type="primary" @click="applyDefaultEditor">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { v4 as uuidv4 } from 'uuid';
import { computed, ref } from 'vue';
import { EditPen } from '@element-plus/icons-vue';
import Editor from '@/components/Editor/index.vue';
import type { FormProps, FormWidget } from '../types';

const props = defineProps<{
  widget: FormWidget | null;
  formProps: FormProps;
}>();

const deviceType = defineModel<string>('deviceType', { default: 'adaptive' });
const activeTab = ref('field');
const localFormProps = computed(() => props.formProps);
const spanOptions = [
  { label: '1/4', value: 6 },
  { label: '1/3', value: 8 },
  { label: '1/2', value: 12 },
  { label: '2/3', value: 16 },
  { label: '3/4', value: 18 },
  { label: '整行', value: 24 }
];

const showPlaceholder = computed(() => props.widget && !['divider', 'button', 'grid', 'card', 'tabs', 'staticText'].includes(props.widget.type));
const showRequired = computed(() => showPlaceholder.value);
const hasOptions = computed(() => props.widget && ['radio', 'checkbox', 'select'].includes(props.widget.type));
const showDefaultValue = computed(() => props.widget && !['divider', 'button', 'grid', 'card', 'tabs', 'tabPane', 'staticText'].includes(props.widget.type));
const usesRichDefault = computed(() => ['editor', 'markdown'].includes(props.widget?.type || ''));
const isNumberType = computed(() => ['number', 'integer', 'money'].includes(props.widget?.type || ''));
const defaultEditorVisible = ref(false);
const defaultEditorDraft = ref('');
const defaultEditorTitle = computed(() => (usesRichDefault.value || props.widget?.type === 'staticText' ? '编辑富文本' : '编辑默认值'));

function plainText(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function openDefaultEditor() {
  if (props.widget?.type === 'staticText') {
    defaultEditorDraft.value = staticText.value;
  } else {
    defaultEditorDraft.value = textDefault.value;
  }
  defaultEditorVisible.value = true;
}

function applyDefaultEditor() {
  if (props.widget?.type === 'staticText') {
    staticText.value = defaultEditorDraft.value;
  } else {
    textDefault.value = defaultEditorDraft.value;
  }
  defaultEditorVisible.value = false;
}

function updateWidgetProps(value: Record<string, unknown>) {
  if (!props.widget) return;
  props.widget.props = { ...(props.widget.props || {}), ...value };
}

const widgetSpan = computed({
  get: () => Number(props.widget?.span || 24),
  set: (value: number) => {
    if (props.widget) props.widget.span = value;
  }
});

const cssClass = computed({
  get: () => String(props.widget?.props?.className || ''),
  set: (value: string) => updateWidgetProps({ className: value })
});

const dataKey = computed({
  get: () => String(props.widget?.props?.dataKey || props.widget?.field || ''),
  set: (value: string) => updateWidgetProps({ dataKey: value })
});

const disabled = computed({
  get: () => Boolean(props.widget?.props?.disabled),
  set: (value: boolean) => updateWidgetProps({ disabled: value })
});

const hidden = computed({
  get: () => Boolean(props.widget?.props?.hidden),
  set: (value: boolean) => updateWidgetProps({ hidden: value })
});

const hideTitle = computed({
  get: () => Boolean(props.widget?.props?.hideTitle),
  set: (value: boolean) => updateWidgetProps({ hideTitle: value })
});

const readonly = computed({
  get: () => Boolean(props.widget?.props?.readonly),
  set: (value: boolean) => updateWidgetProps({ readonly: value })
});

const fieldHelp = computed({
  get: () => String(props.widget?.props?.help || ''),
  set: (value: string) => updateWidgetProps({ help: value })
});

const staticText = computed({
  get: () => String(props.widget?.props?.text || props.widget?.defaultValue || ''),
  set: (value: string) => {
    if (!props.widget) return;
    props.widget.defaultValue = value;
    updateWidgetProps({ text: value });
  }
});

const textDefault = computed({
  get: () => {
    const value = props.widget?.defaultValue;
    if (value == null) return '';
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  },
  set: (value: string) => {
    if (!props.widget) return;
    props.widget.defaultValue = value;
  }
});

const switchDefault = computed({
  get: () => Boolean(props.widget?.defaultValue),
  set: (value: boolean) => {
    if (props.widget) props.widget.defaultValue = value;
  }
});

const numberDefault = computed({
  get: () => {
    const value = Number(props.widget?.defaultValue);
    return Number.isFinite(value) ? value : undefined;
  },
  set: (value: number | undefined) => {
    if (props.widget) props.widget.defaultValue = value;
  }
});

const selectDefault = computed({
  get: () => props.widget?.defaultValue as string | number | undefined,
  set: (value: string | number | undefined) => {
    if (props.widget) props.widget.defaultValue = value;
  }
});

const formulaExpression = computed({
  get: () => String(props.widget?.props?.expression || ''),
  set: (value: string) => updateWidgetProps({ expression: value })
});

const ocrType = computed({
  get: () => String(props.widget?.props?.ocrType || 'vat_invoice'),
  set: (value: string) => updateWidgetProps({ ocrType: value })
});

const ocrButtonText = computed({
  get: () => String(props.widget?.props?.buttonText || '识别文本'),
  set: (value: string) => updateWidgetProps({ buttonText: value })
});

const gridCols = computed({
  get: () => Number(props.widget?.props?.cols || 2),
  set: (value: number) => {
    updateWidgetProps({ cols: value });
  }
});

const buttonText = computed({
  get: () => String(props.widget?.props?.buttonText || '按钮'),
  set: (value: string) => {
    updateWidgetProps({ buttonText: value });
  }
});

const buttonType = computed({
  get: () => String(props.widget?.props?.buttonType || 'primary'),
  set: (value: string) => {
    updateWidgetProps({ buttonType: value });
  }
});

const dividerText = computed({
  get: () => String(props.widget?.props?.dividerText || props.widget?.label || ''),
  set: (value: string) => {
    updateWidgetProps({ dividerText: value });
  }
});

function addOption() {
  if (!props.widget) return;
  if (!props.widget.options) props.widget.options = [];
  props.widget.options.push({ label: `选项${props.widget.options.length + 1}`, value: String(props.widget.options.length + 1) });
}

function removeOption(index: number) {
  props.widget?.options?.splice(index, 1);
}

function addPane() {
  if (!props.widget || props.widget.type !== 'tabs') return;
  if (!props.widget.children) props.widget.children = [];
  const n = props.widget.children.length + 1;
  props.widget.children.push({
    id: uuidv4(),
    type: 'tabPane',
    label: `Tab${n}`,
    field: `tab_${uuidv4().replace(/-/g, '').slice(0, 8)}`,
    children: []
  });
}

function removePane(index: number) {
  props.widget?.children?.splice(index, 1);
}
</script>

<style scoped>
.property-panel {
  height: 100%;
  padding: 0 0 14px;
  overflow: auto;
  background: #fff;
}
.property-panel :deep(.property-tabs > .el-tabs__header) {
  margin: 0 0 12px;
  padding: 0 8px;
}
.property-panel :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: #dcdfe6;
}
.property-panel :deep(.el-tabs__nav-next),
.property-panel :deep(.el-tabs__nav-prev) {
  display: none;
}
.property-panel :deep(.el-tabs__nav-wrap.is-scrollable) {
  padding: 0;
}
.property-panel :deep(.el-tabs__item) {
  flex: 1;
  height: 42px;
  padding: 0 4px;
  line-height: 42px;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  text-align: left;
  justify-content: flex-start;
}
.property-panel :deep(.el-tabs__item.is-active) {
  font-weight: 600;
  color: var(--el-color-primary);
}
.property-form {
  padding: 0 12px;
  text-align: left;
}
.property-panel :deep(.el-form-item) {
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}
.property-panel :deep(.el-form-item__label) {
  width: 100% !important;
  padding: 0 0 6px;
  color: #303133;
  font-weight: 400;
  line-height: 20px;
  text-align: left;
  justify-content: flex-start;
}
.property-panel :deep(.el-form-item__content) {
  min-width: 0;
  margin-left: 0 !important;
  justify-content: flex-start;
}
.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}
.property-panel :deep(.el-input__wrapper),
.property-panel :deep(.el-textarea__inner) {
  border-radius: 2px;
}
.field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 2px 12px 14px;
}
.field-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
  font-size: 15px;
  font-weight: 700;
}
.field-title .el-icon {
  color: #606266;
}
.option-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.option-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 6px;
}
.pane-row {
  grid-template-columns: 1fr auto;
}
.check-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  justify-content: flex-start;
}
.span-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
  justify-content: flex-start;
}
.span-btns button {
  flex: 0 0 calc(33.33% - 4px);
  height: 28px;
  padding: 0 4px;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  background: #fff;
  color: #606266;
  font-size: 12px;
  line-height: 26px;
  cursor: pointer;
  text-align: center;
}
.span-btns button.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: #fff;
}
</style>
