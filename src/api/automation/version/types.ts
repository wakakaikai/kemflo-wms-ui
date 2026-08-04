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
  publishStatus: string;
  publishBy?: string;
  publishTime?: string;
  checksum?: string;
  createTime?: string;
}

export interface AutoVersionForm {
  id?: number | string;
  definitionId?: number | string;
  designJson?: string;
  runtimeJson?: string;
}
