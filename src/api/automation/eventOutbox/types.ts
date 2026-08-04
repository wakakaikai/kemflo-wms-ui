import { PageQuery } from '@/api/types';

export interface AutoEventOutboxQuery extends PageQuery {
  eventType?: string;
  businessType?: string;
  status?: string;
}

export interface AutoEventOutboxVo {
  id: number | string;
  eventId: string;
  eventType: string;
  businessType?: string;
  businessId?: string;
  status: string;
  retryCount?: number;
  nextRetryTime?: string;
  consumeTime?: string;
  createTime?: string;
}
