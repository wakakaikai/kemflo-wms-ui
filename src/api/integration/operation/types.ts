export interface OperationVO extends BaseEntity {
  operationId: number | string;
  connectorId: number | string;
  operationCode: string;
  operationName: string;
  httpMethod: string;
  httpPath: string;
  requestSchemaJson: string;
  responseSchemaJson: string;
  inputMappingJson: string;
  outputMappingJson: string;
  status: string;
}

export interface OperationForm {
  operationId: number | string | undefined;
  connectorId: number | string | undefined;
  operationCode: string;
  operationName: string;
  httpMethod: string;
  httpPath: string;
  requestSchemaJson: string;
  responseSchemaJson: string;
  inputMappingJson: string;
  outputMappingJson: string;
  status: string;
}

export interface OperationQuery extends PageQuery {
  connectorId: number | string | undefined;
  operationCode: string;
  operationName: string;
  status: string;
}
