import { PageQuery } from '@/api/types';

export interface AutoEventOutboxQuery extends PageQuery {
  eventType?: string;
  businessType?: string;
  status?: string;
}

export interface AutoEventOutboxVo {
  eventId: number | string;
  eventType: string;
  businessType: string;
  businessId: string;
  status: string;
  retryCount: number;
  nextRetryTime?: Date;
  consumeTime?: Date;
  createTime: Date;
  updateTime: Date;
}
