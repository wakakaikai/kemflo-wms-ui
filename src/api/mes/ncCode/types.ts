export interface NcCodeVO {
  id: string | number;
  handle?: string;
  ncCode?: string;
  description?: string;
  status?: string;
  ncCategory?: string;
  ncType?: string;
  ncSeverityThreshold?: number;
  ncDataTypeBo?: string;
  maxNcLimit?: number;
  priority?: number;
  canBePrimaryCode?: string;
  closureRequired?: string;
  autoClosePrimary?: string;
  secondaryReqdForClose?: string;
  remark?: string;
}

export interface NcCodeForm extends BaseEntity {
  id?: string | number;
  handle?: string;
  ncCode?: string;
  description?: string;
  status?: string;
  ncCategory?: string;
  ncType?: string;
  ncSeverityThreshold?: number;
  ncDataTypeBo?: string;
  maxNcLimit?: number;
  priority?: number;
  canBePrimaryCode?: string;
  closureRequired?: string;
  autoClosePrimary?: string;
  secondaryReqdForClose?: string;
  remark?: string;
}

export interface NcCodeQuery extends PageQuery {
  handle?: string;
  ncCode?: string;
  description?: string;
  status?: string;
  ncCategory?: string;
  ncType?: string;
  params?: any;
}
