export interface RouterVO {
  id: string | number;
  handle: string;
  router: string;
  routerType: string;
  description: string;
  status: string;
  revision: string;
  currentRevision: string;
  hasBeenReleased: string;
  remark: string;
  entryRouterStepBo: string;
  routerContent: string;
  extFieldsVOList?: ExtFieldRow[];
  createTime?: string;
  creator?: string;
  modifyTime?: string;
  updater?: string;
}

export interface RouterQuery extends PageQuery {
  router?: string;
  revision?: string;
  description?: string;
  routerType?: string;
  status?: string;
}

export interface ExtFieldRow {
  id?: string | number;
  attribute?: string;
  attributeDesc?: string;
  fieldType?: string;
  fieldTypeDesc?: string;
  required?: string;
  value?: string;
  remark?: string;
}

export interface RouterStepSave {
  id?: string | number;
  sequence?: number | string;
  startStep?: boolean | string;
  endStep?: boolean | string;
  isReportingStep?: boolean | string;
  reportingStep?: string;
  reportingCenterRef?: string;
  stepId?: string;
  stepType?: string;
  operationRef?: string;
}

export interface RouterNextStepSave {
  routerStepId?: string;
  nextStepId?: string;
  sequence?: number | string;
}

export interface RouterForm extends BaseEntity {
  id?: string | number;
  handle?: string;
  router?: string;
  routerType?: string;
  description?: string;
  status?: string;
  revision?: string;
  currentRevision?: string | boolean;
  hasBeenReleased?: string;
  remark?: string;
  entryRouterStepBo?: string;
  entryRouterStepId?: string;
  routerContent?: string;
  routerStepSaveVOList?: RouterStepSave[];
  routerNextStepSaveVOList?: RouterNextStepSave[];
  extFieldsSaveVOList?: ExtFieldRow[];
}
