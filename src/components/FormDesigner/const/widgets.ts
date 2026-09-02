import type { WidgetCategory, WidgetOption } from '../types';

export const WIDGET_CATEGORY_ORDER: WidgetCategory[] = ['basic', 'advanced', 'layout'];

export const WIDGET_CATEGORY_LABEL: Record<WidgetCategory, string> = {
  basic: '基础字段',
  advanced: '高级字段',
  layout: '布局字段'
};

export const WIDGET_OPTIONS: WidgetOption[] = [
  { type: 'input', label: '单行文本', category: 'basic', icon: 'EditPen' },
  { type: 'textarea', label: '多行文本', category: 'basic', icon: 'Document' },
  { type: 'number', label: '数字', category: 'basic', icon: 'Odometer' },
  { type: 'integer', label: '整数', category: 'basic', icon: 'Odometer' },
  { type: 'money', label: '金额', category: 'basic', icon: 'Money' },
  { type: 'radio', label: '单选框组', category: 'basic', icon: 'CircleCheck' },
  { type: 'checkbox', label: '多选框组', category: 'basic', icon: 'Finished' },
  { type: 'time', label: '时间选择器', category: 'basic', icon: 'Clock' },
  { type: 'date', label: '日期选择器', category: 'basic', icon: 'Calendar' },
  { type: 'rate', label: '评分', category: 'basic', icon: 'Star' },
  { type: 'color', label: '颜色选择器', category: 'basic', icon: 'Brush' },
  { type: 'select', label: '下拉选择框', category: 'basic', icon: 'ArrowDown' },
  { type: 'switch', label: '开关', category: 'basic', icon: 'SwitchButton' },
  { type: 'slider', label: '滑块', category: 'basic', icon: 'Minus' },
  { type: 'phone', label: '手机', category: 'advanced', icon: 'Iphone' },
  { type: 'email', label: '邮箱', category: 'advanced', icon: 'Message' },
  { type: 'image', label: '图片上传', category: 'advanced', icon: 'Picture' },
  { type: 'upload', label: '文件上传', category: 'advanced', icon: 'Upload' },
  { type: 'editor', label: '编辑器', category: 'advanced', icon: 'Edit' },
  { type: 'markdown', label: 'Markdown', category: 'advanced', icon: 'Memo' },
  { type: 'button', label: '按钮', category: 'advanced', icon: 'Pointer' },
  { type: 'staticText', label: '文本', category: 'advanced', icon: 'Document' },
  { type: 'divider', label: '分隔符', category: 'advanced', icon: 'Minus' },
  { type: 'cascader', label: '省市级联动', category: 'advanced', icon: 'Connection' },
  { type: 'map', label: '地图', category: 'advanced', icon: 'MapLocation' },
  { type: 'location', label: '定位', category: 'advanced', icon: 'Location' },
  { type: 'uppercaseMoney', label: '大写金额', category: 'advanced', icon: 'Coin' },
  { type: 'barcode', label: '条码', category: 'advanced', icon: 'CollectionTag' },
  { type: 'textGroup', label: '文本组合', category: 'advanced', icon: 'Files' },
  { type: 'autoNumber', label: '自动编号', category: 'advanced', icon: 'DocumentAdd' },
  { type: 'formula', label: '公式', category: 'advanced', icon: 'MagicStick' },
  { type: 'signature', label: '手写签名', category: 'advanced', icon: 'EditPen' },
  { type: 'ocr', label: '文本识别', category: 'advanced', icon: 'Crop' },
  { type: 'grid', label: '栅格布局', category: 'layout', icon: 'Grid' },
  { type: 'card', label: '卡片', category: 'layout', icon: 'Postcard' },
  { type: 'tabs', label: 'Tabs', category: 'layout', icon: 'Menu' }
];

export const DEFAULT_OPTIONS = [
  { label: '选项1', value: '1' },
  { label: '选项2', value: '2' },
  { label: '选项3', value: '3' }
];
