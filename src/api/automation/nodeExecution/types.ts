import { PageQuery } from '@/api/types';

export interface AutoNodeExecutionQuery extends PageQuery {
  instanceId?: number | string;
  nodeType?: string;
  status?: string;
}

export interface AutoNodeExecutionVo {
  id: number | string;
  instanceId: number | string;
  nodeId?: string;
  nodeName?: string;
  nodeType?: string;
  executionNo?: number;
  status: string;
  retryCount?: number;
  startTime?: string;
  endTime?: string;
  durationMs?: number;
  errorCode?: string;
  errorMessage?: string;
  createTime?: string;
}
