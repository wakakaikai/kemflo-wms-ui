export interface RecordQuery extends PageQuery {
  worksheetId?: string | number;
}

export interface RecordVO extends BaseEntity {
  id?: string | number;
  worksheetId?: string | number;
  version?: number;
  recordDataJson?: string;
}

export interface RecordForm {
  id?: string | number | undefined;
  worksheetId?: string | number;
  version?: number;
  recordDataJson?: string;
}
