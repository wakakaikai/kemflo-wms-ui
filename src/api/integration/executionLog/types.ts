export interface ExecutionLogVO extends BaseEntity {
  executionId: number | string;
  connectionId: number | string;
  operationId: number | string;
  requestJson: string;
  responseJson: string;
  status: string;
  durationMs: number;
  errorMessage: string;
}

export interface ExecutionLogQuery extends PageQuery {
  connectionId: number | string | undefined;
  operationId: number | string | undefined;
  status: string;
}
