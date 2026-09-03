export interface SfcFixedSfcVO {
  id: string | number;
  sfc?: string;
  fixedSfc?: string;
  remark?: string;
  creator?: string;
  createTime?: string;
  updater?: string;
  modifyTime?: string;
}

export interface SfcFixedSfcForm extends BaseEntity {
  id?: string | number;
  sfc?: string;
  fixedSfc?: string;
  remark?: string;
}

export interface SfcFixedSfcQuery extends PageQuery {
  sfc?: string;
  fixedSfc?: string;
  params?: any;
}
