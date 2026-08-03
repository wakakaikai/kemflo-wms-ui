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
  status: string;
  triggerType: string;
  startTime?: Date;
  endTime?: Date;
  durationMs?: number;
  errorMessage?: string;
  createTime: Date;
  updateTime: Date;
}

export interface AutoInstanceForm {
  id?: number | string;
  definitionId?: number | string;
  triggerType?: string;
}
