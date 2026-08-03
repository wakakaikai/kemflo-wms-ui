export interface AppQuery extends PageQuery {
  appCode?: string;
  appName?: string;
  status?: string;
}

export interface AppVO extends BaseEntity {
  id?: string | number;
  appCode?: string;
  appName?: string;
  description?: string;
  status?: string;
}

export interface AppForm {
  id?: string | number | undefined;
  appCode?: string;
  appName?: string;
  description?: string;
  status?: string;
}
