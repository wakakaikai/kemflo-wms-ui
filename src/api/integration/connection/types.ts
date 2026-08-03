export interface ConnectionVO extends BaseEntity {
  connectionId: number | string;
  connectorId: number | string;
  connectionName: string;
  configJson: string;
  credentialId: number | string;
  status: string;
}

export interface ConnectionForm {
  connectionId: number | string | undefined;
  connectorId: number | string | undefined;
  connectionName: string;
  configJson: string;
  credentialId: number | string | undefined;
  status: string;
}

export interface ConnectionQuery extends PageQuery {
  connectorId: number | string | undefined;
  connectionName: string;
  status: string;
}
