export interface WorksheetQuery extends PageQuery {
  appId?: string | number;
  tableName?: string;
  displayName?: string;
  status?: string;
}

export interface WorksheetVO extends BaseEntity {
  id?: string | number;
  appId?: string | number;
  appName?: string;
  tableName?: string;
  displayName?: string;
  description?: string;
  status?: string;
}

export interface WorksheetForm {
  id?: string | number | undefined;
  appId?: string | number;
  tableName?: string;
  displayName?: string;
  description?: string;
  status?: string;
}
