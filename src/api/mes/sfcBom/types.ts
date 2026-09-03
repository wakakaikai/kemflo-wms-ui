export interface SfcBomVO {
  id: string | number;
  sfcBo?: string;
  bomBo?: string;
  remark?: string;
}

export interface SfcBomForm extends BaseEntity {
  id?: string | number;
  sfcBo?: string;
  bomBo?: string;
  remark?: string;
}

export interface SfcBomQuery extends PageQuery {
  sfcBo?: string;
  bomBo?: string;
  params?: any;
}
