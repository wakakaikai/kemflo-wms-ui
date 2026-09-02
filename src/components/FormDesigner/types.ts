export type WidgetCategory = 'basic' | 'advanced' | 'layout';

export interface WidgetOption {
  type: string;
  label: string;
  category: WidgetCategory;
  icon?: string;
  defaultProps?: Record<string, unknown>;
}

export interface FormProps {
  labelWidth: number;
  labelPosition: 'left' | 'right' | 'top';
  size: 'large' | 'default' | 'small';
  themeColor: string;
  gutter: number;
}

export interface FormWidget {
  id: string;
  type: string;
  label: string;
  field: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  span?: number;
  options?: Array<{ label: string; value: string | number }>;
  props?: Record<string, unknown>;
  children?: FormWidget[];
}

export interface FormSchema {
  formProps: FormProps;
  widgets: FormWidget[];
}

export const FORM_WIDGET_DRAG_MIME = 'application/x-form-designer-widget';
export const FORM_FIELD_DRAG_MIME = 'application/x-form-designer-field';

export const DEFAULT_FORM_PROPS: FormProps = {
  labelWidth: 100,
  labelPosition: 'top',
  size: 'default',
  themeColor: '#409EFF',
  gutter: 16
};
