export interface QmsInspectionTemplateListItem {
  id: string;
  templateName?: string;
  factoryCode?: string;
  matchType?: string;
  materialNumber?: string;
  subdivisionMaterialNumbers?: string;
  materialType?: string;
  exemptFlag?: string;
  exemptFlagName?: string;
  useRule?: string;
  useRuleName?: string;
  notifyUserNames?: string;
  formNumber?: string;
  versionNumber?: number;
  creatorName?: string;
  creationTime?: string;
  groupId?: string;
}

export interface QmsInspectionTemplateQuery extends PageQuery {
  templateName?: string;
  factoryCode?: string;
  matchType?: string;
  materialNumber?: string;
  materialType?: string;
  exemptFlag?: string;
  useRule?: string;
}

export interface QmsInspectionTemplate {
  id?: string;
  creationTime?: string;
  creator?: string;
  updateTime?: string;
  updater?: string;
  templateName?: string;
  factoryCode?: string;
  matchType?: string;
  materialNumber?: string;
  subdivisionMaterialNumbers?: string;
  materialName?: string;
  materialType?: string;
  exemptFlag?: string;
  useRule?: string;
  formNumber?: string;
  dimensionStandardFileId?: string;
  inspectionStandardFileIds?: string;
  drawingFileIds?: string;
  approvalFileIds?: string;
  samplePhotoIds?: string;
  notifyUserIds?: string;
  notifyUserNames?: string;
  groupId?: string;
  extAttrs?: unknown;
}

export interface QmsInspectionTemplateRule {
  id?: string;
  serialNumber?: number;
  conversionRule?: string;
  conversionRuleName?: string;
  inspectionDegreeSource?: string;
  inspectionDegreeTarget?: string;
  lastHowManyBatch?: number;
  conditionalHowManyBatch?: number;
  conditional?: string;
}

export interface QmsInspectionTemplateItem {
  id?: string;
  templateId?: string;
  serialNumber?: number;
  inspectionType?: string;
  inspectionItem?: string;
  inspectionRequirement?: string;
  inspectionMethod?: string;
  inspectionCycle?: string;
  samplingPlan?: string;
  aqlLevel?: string;
  inspectionLevel?: string;
  sampleQty?: number;
  ac?: number;
}

export interface QmsInspectionTemplateChangeRecord {
  id?: string;
  groupId?: string;
  businessId?: string;
  versionNumber?: number;
  changeDate?: string;
  releaseTime?: string;
  changeUserId?: string;
  changeUserName?: string;
  changeDescription?: string;
  currentLatestVersion?: string;
  currentReleaseVersion?: string;
  remark?: string;
}

export interface QmsInspectionTemplateDetail {
  template?: QmsInspectionTemplate;
  materialList?: Record<string, unknown>[];
  ruleList?: QmsInspectionTemplateRule[];
  itemList?: QmsInspectionTemplateItem[];
  changeRecordList?: QmsInspectionTemplateChangeRecord[];
}
