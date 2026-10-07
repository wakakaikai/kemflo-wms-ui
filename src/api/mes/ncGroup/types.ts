export interface NcGroupVO {
  id: string | number;
  handle?: string;
  ncGroup?: string;
  description?: string;
  validAtAllOperations?: string;
  priority?: number;
  remark?: string;
  ncCodeBoList?: string[];
  creator?: string;
  createTime?: string;
  updater?: string;
  modifyTime?: string;
}

export interface NcGroupForm {
  id?: string | number;
  ncGroup: string;
  description: string;
  validAtAllOperations: string;
  priority: number;
  remark: string;
  ncCodeBoList: string[];
}

export interface NcGroupQuery extends PageQuery {
  ncGroup?: string;
  description?: string;
  validAtAllOperations?: string;
}

export interface NcGroupMemberVO {
  id: string | number;
  ncGroupBo: string;
  ncCodeBo: string;
  sequence?: number;
  remark?: string;
}

export interface NcGroupMemberForm {
  ncGroupBo: string;
  ncCodeBo: string;
  sequence?: number;
}

export interface NcGroupMemberQuery extends Partial<PageQuery> {
  ncGroupBo?: string;
  ncCodeBo?: string;
}
