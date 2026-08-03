import { PageQuery } from '@/api/types';

export interface AutoDefinitionQuery extends PageQuery {
  automationCode?: string;
  automationName?: string;
  triggerType?: string;
  status?: string;
}

export interface AutoDefinitionVo {
  id: number | string;
  automationCode: string;
  automationName: string;
  categoryId: number;
  categoryName?: string;
  description: string;
  triggerType: string;
  status: string;
  currentVersion: number;
  enabled: number;
  createTime: Date;
  updateTime: Date;
}

export interface AutoDefinitionForm {
  id?: number | string;
  automationCode: string;
  automationName: string;
  categoryId?: number;
  description?: string;
  triggerType?: string;
  status?: string;
  enabled?: number;
  remark?: string;
}
