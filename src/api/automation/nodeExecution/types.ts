import { PageQuery } from '@/api/types';

export interface AutoNodeExecutionQuery extends PageQuery {
  instanceId?: number | string;
  nodeType?: string;
  status?: string;
}

export interface AutoNodeExecutionVo {
  id: number | string;
  instanceId: number | string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: string;
  retryCount: number;
  startTime?: Date;
  endTime?: Date;
  durationMs?: number;
  inputData?: string;
  outputData?: string;
  errorMessage?: string;
  createTime: Date;
  updateTime: Date;
}
