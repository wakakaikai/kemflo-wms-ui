import { PageQuery } from '@/api/types';

export interface AutoInstanceQuery extends PageQuery {
  instanceNo?: string;
  status?: string;
  triggerType?: string;
  definitionId?: number | string;
}

export interface AutoInstanceVo {
  id: number | string;
  instanceNo: string;
  definitionId: number | string;
  definitionName?: string;
  definitionVersion?: number;
  businessType?: string;
  businessId?: string;
  status: string;
  triggerType: string;
  currentNodeId?: string;
  startTime?: string;
  endTime?: string;
  durationMs?: number;
  errorCode?: string;
  errorMessage?: string;
  createTime?: string;
}
