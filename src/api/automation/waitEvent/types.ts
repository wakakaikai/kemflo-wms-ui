import { PageQuery } from '@/api/types';

export interface AutoWaitEventQuery extends PageQuery {
  instanceId?: number | string;
  waitType?: string;
  status?: string;
}

export interface AutoWaitEventVo {
  id: number | string;
  instanceId: number | string;
  nodeExecutionId?: number | string;
  waitType: string;
  waitKey: string;
  status: string;
  expireTime?: string;
  resumeTime?: string;
  createTime?: string;
}
