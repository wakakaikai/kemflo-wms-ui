export interface RecordIndexQuery extends PageQuery {
  worksheetId?: string | number;
  fieldCode?: string;
  fieldValue?: string;
  recordId?: string | number;
}

export interface RecordIndexVO extends BaseEntity {
  id?: string | number;
  worksheetId?: string | number;
  fieldCode?: string;
  fieldValue?: string;
  recordId?: string | number;
}

export interface RecordIndexForm {
  id?: string | number | undefined;
  worksheetId?: string | number;
  fieldCode?: string;
  fieldValue?: string;
  recordId?: string | number;
}
