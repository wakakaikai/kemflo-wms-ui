import { PageQuery } from '@/api/types';

export interface AutoTaskQuery extends PageQuery {
  instanceId?: number | string;
  status?: string;
}

export interface AutoTaskVo {
  id: number | string;
  instanceId: number | string;
  taskType: string;
  status: string;
  priority: number;
  retryCount: number;
  maxRetryCount: number;
  lastError?: string;
  createTime: Date;
  updateTime: Date;
}
