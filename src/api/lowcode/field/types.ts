export interface FieldQuery extends PageQuery {
  worksheetId?: string | number;
  fieldCode?: string;
  fieldName?: string;
  fieldType?: string;
}

export interface FieldVO extends BaseEntity {
  id?: string | number;
  worksheetId?: string | number;
  fieldCode?: string;
  fieldName?: string;
  fieldType?: string;
  required?: number;
  defaultValue?: string;
  maxLength?: number;
  sortOrder?: number;
}

export interface FieldForm {
  id?: string | number | undefined;
  worksheetId?: string | number;
  fieldCode?: string;
  fieldName?: string;
  fieldType?: string;
  required?: number;
  defaultValue?: string;
  maxLength?: number;
  sortOrder?: number;
}
