import { v4 as uuidv4 } from 'uuid';
import type { FormSchema, FormWidget, WidgetOption } from '../types';
import { DEFAULT_FORM_PROPS } from '../types';
import { DEFAULT_OPTIONS } from '../const/widgets';

export function createEmptySchema(): FormSchema {
  return {
    formProps: { ...DEFAULT_FORM_PROPS },
    widgets: []
  };
}

export function parseSchema(json?: string | null): FormSchema {
  if (!json) return createEmptySchema();
  try {
    const parsed = JSON.parse(json) as FormSchema;
    return {
      formProps: { ...DEFAULT_FORM_PROPS, ...(parsed.formProps || {}) },
      widgets: Array.isArray(parsed.widgets) ? parsed.widgets : []
    };
  } catch {
    return createEmptySchema();
  }
}

export function serializeSchema(schema: FormSchema): string {
  return JSON.stringify(schema);
}

function nextField(type: string): string {
  return `${type}_${uuidv4().replace(/-/g, '').slice(0, 8)}`;
}

export function createWidgetFromOption(option: WidgetOption): FormWidget {
  const base: FormWidget = {
    id: uuidv4(),
    type: option.type,
    label: option.label,
    field: nextField(option.type),
    span: 24,
    placeholder: `请输入${option.label}`,
    required: false,
    props: { ...(option.defaultProps || {}) }
  };

  if (['radio', 'checkbox', 'select'].includes(option.type)) {
    base.options = DEFAULT_OPTIONS.map((item) => ({ ...item }));
  }
  if (option.type === 'switch') {
    base.defaultValue = false;
  }
  if (option.type === 'checkbox') {
    base.defaultValue = [];
  }
  if (option.type === 'slider') {
    base.props = { min: 0, max: 100, step: 1, showInput: true };
  }
  if (option.type === 'rate') {
    base.props = { max: 5 };
  }
  if (option.type === 'image') {
    base.props = { limit: 3, accept: 'image/*', listType: 'picture-card' };
  }
  if (option.type === 'editor') {
    base.props = { rows: 6 };
  }
  if (option.type === 'markdown') {
    base.placeholder = '请输入 Markdown 内容';
    base.props = { rows: 6 };
  }
  if (option.type === 'staticText') {
    base.field = nextField('text');
    base.defaultValue = '说明文本';
    base.props = { text: '说明文本' };
  }
  if (option.type === 'cascader') {
    base.defaultValue = [];
    base.props = {
      separator: ' / ',
      cascaderOptions: [
        { label: '江苏省', value: 'jiangsu', children: [{ label: '苏州市', value: 'suzhou' }] },
        { label: '浙江省', value: 'zhejiang', children: [{ label: '杭州市', value: 'hangzhou' }] },
        { label: '广东省', value: 'guangdong', children: [{ label: '深圳市', value: 'shenzhen' }] }
      ]
    };
  }
  if (option.type === 'map') {
    base.props = { mapType: 'amap', height: 180 };
  }
  if (option.type === 'location') {
    base.props = { buttonText: '获取定位' };
  }
  if (option.type === 'uppercaseMoney') {
    base.props = { sourceField: '', readonly: true };
  }
  if (option.type === 'barcode') {
    base.props = { format: 'CODE128' };
  }
  if (option.type === 'textGroup') {
    base.props = { template: '{字段1}-{字段2}' };
  }
  if (option.type === 'autoNumber') {
    base.defaultValue = '';
    base.props = { prefix: 'NO', length: 6, readonly: true };
  }
  if (option.type === 'formula') {
    base.props = { expression: '' };
  }
  if (option.type === 'signature') {
    base.props = { buttonText: '添加签名' };
  }
  if (option.type === 'ocr') {
    base.label = '文本识别';
    base.props = { buttonText: '识别增值税发票', ocrType: 'vat_invoice' };
  }
  if (option.type === 'grid') {
    base.children = [];
    base.props = { cols: 2 };
  }
  if (option.type === 'card') {
    base.label = '卡片标题';
    base.children = [];
  }
  if (option.type === 'tabs') {
    base.label = '标签页';
    base.children = [
      { id: uuidv4(), type: 'tabPane', label: 'Tab1', field: nextField('tab'), children: [] },
      { id: uuidv4(), type: 'tabPane', label: 'Tab2', field: nextField('tab'), children: [] }
    ];
  }
  if (option.type === 'button') {
    base.field = nextField('btn');
    base.props = { buttonType: 'primary', buttonText: '按钮' };
  }
  if (option.type === 'divider') {
    base.field = nextField('divider');
    base.props = { contentPosition: 'center', dividerText: '分割线' };
  }
  if (option.type === 'upload') {
    base.props = { limit: 3, accept: '*' };
  }

  return base;
}

export function cloneWidget(widget: FormWidget): FormWidget {
  const cloned = JSON.parse(JSON.stringify(widget)) as FormWidget;
  cloned.id = uuidv4();
  cloned.field = nextField(widget.type);
  if (cloned.children?.length) {
    cloned.children = cloned.children.map((child) => cloneWidget(child));
  }
  return cloned;
}

export function findWidget(widgets: FormWidget[], id: string): FormWidget | null {
  for (const widget of widgets) {
    if (widget.id === id) return widget;
    if (widget.children?.length) {
      const found = findWidget(widget.children, id);
      if (found) return found;
    }
  }
  return null;
}

export interface WidgetContext {
  parent: FormWidget | null;
  list: FormWidget[];
  index: number;
  widget: FormWidget;
}

export function findWidgetContext(widgets: FormWidget[], id: string, parent: FormWidget | null = null): WidgetContext | null {
  const index = widgets.findIndex((item) => item.id === id);
  if (index >= 0) {
    return { parent, list: widgets, index, widget: widgets[index] };
  }
  for (const widget of widgets) {
    if (widget.children?.length) {
      const found = findWidgetContext(widget.children, id, widget);
      if (found) return found;
    }
  }
  return null;
}

export function isContainerType(type?: string) {
  return type === 'grid' || type === 'card' || type === 'tabPane';
}

export function containsWidget(widget: FormWidget, id: string): boolean {
  if (widget.id === id) return true;
  return Boolean(widget.children?.some((child) => containsWidget(child, id)));
}

export function getContainerList(widget: FormWidget): FormWidget[] | null {
  if (widget.type === 'tabs') {
    const pane = widget.children?.[0];
    if (!pane) return null;
    if (!pane.children) pane.children = [];
    return pane.children;
  }
  if (!isContainerType(widget.type)) return null;
  if (!widget.children) widget.children = [];
  return widget.children;
}

export function insertWidget(list: FormWidget[], widget: FormWidget, index?: number) {
  const at = index == null ? list.length : Math.min(Math.max(index, 0), list.length);
  list.splice(at, 0, widget);
}

export function moveWidget(widgets: FormWidget[], sourceId: string, destParentId: string | undefined, destIndex?: number): boolean {
  if (sourceId === destParentId) return false;
  const srcCtx = findWidgetContext(widgets, sourceId);
  if (!srcCtx) return false;

  let destList = widgets;
  let destParent: FormWidget | null = null;
  if (destParentId) {
    destParent = findWidget(widgets, destParentId);
    if (!destParent) return false;
    if (containsWidget(srcCtx.widget, destParentId)) return false;
    const list = getContainerList(destParent);
    if (!list) return false;
    destList = list;
  }

  const [item] = srcCtx.list.splice(srcCtx.index, 1);
  let index = destIndex;
  if (index != null && srcCtx.list === destList && srcCtx.index < index) {
    index -= 1;
  }
  insertWidget(destList, item, index);
  if (destParent?.type === 'grid' && item.span === 24) {
    const cols = Math.min(Math.max(Number(destParent.props?.cols || 2), 1), 4);
    item.span = Math.floor(24 / cols);
  }
  return true;
}

export function applyLayoutSpans(list: FormWidget[], spans: number[]) {
  if (!spans.length) return;
  list.forEach((widget, index) => {
    if (widget.type === 'tabPane') return;
    widget.span = spans[index % spans.length];
  });
}

export function removeWidget(widgets: FormWidget[], id: string): boolean {
  const index = widgets.findIndex((item) => item.id === id);
  if (index >= 0) {
    widgets.splice(index, 1);
    return true;
  }
  for (const widget of widgets) {
    if (widget.children?.length && removeWidget(widget.children, id)) {
      return true;
    }
  }
  return false;
}
