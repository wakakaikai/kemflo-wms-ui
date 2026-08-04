import { PageQuery } from '@/api/types';

export interface AutoTaskQuery extends PageQuery {
  instanceId?: number | string;
  taskType?: string;
  status?: string;
}

export interface AutoTaskVo {
  id: number | string;
  instanceId: number | string;
  nodeExecutionId?: number | string;
  taskType: string;
  status: string;
  priority?: number;
  executeTime?: string;
  lockedBy?: string;
  lockedTime?: string;
  retryCount?: number;
  maxRetryCount?: number;
  lastError?: string;
  createTime?: string;
}
