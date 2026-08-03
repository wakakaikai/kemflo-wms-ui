export interface FormQuery extends PageQuery {
  worksheetId?: string | number;
  formCode?: string;
  formName?: string;
  status?: string;
}

export interface FormVO extends BaseEntity {
  id?: string | number;
  worksheetId?: string | number;
  worksheetName?: string;
  formCode?: string;
  formName?: string;
  formConfigJson?: string;
  status?: string;
}

export interface FormForm {
  id?: string | number | undefined;
  worksheetId?: string | number;
  formCode?: string;
  formName?: string;
  formConfigJson?: string;
  status?: string;
}
