import { PageQuery } from '@/api/types';

export interface AutoVersionQuery extends PageQuery {
  definitionId?: number | string;
  version?: number;
  publishStatus?: string;
}

export interface AutoVersionVo {
  id: number | string;
  definitionId: number | string;
  version: number;
  runtimeJson?: string;
  publishStatus: string;
  publishTime?: Date;
  checksum?: string;
  createTime: Date;
}

export interface AutoVersionForm {
  id?: number | string;
  definitionId?: number | string;
  runtimeJson?: string;
}
