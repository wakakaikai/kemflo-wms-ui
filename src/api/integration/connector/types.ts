export interface ConnectorVO extends BaseEntity {
  connectorId: number | string;
  connectorCode: string;
  connectorName: string;
  connectorType: string;
  icon: string;
  description: string;
  version: string;
  status: string;
}

export interface ConnectorForm {
  connectorId: number | string | undefined;
  connectorCode: string;
  connectorName: string;
  connectorType: string;
  icon: string;
  description: string;
  version: string;
  status: string;
}

export interface ConnectorQuery extends PageQuery {
  connectorCode: string;
  connectorName: string;
  connectorType: string;
  status: string;
}
