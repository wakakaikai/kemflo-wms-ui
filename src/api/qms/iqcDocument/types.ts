export interface QmsIqcDocumentMeasureVO {
  serialNumber?: number;
  label?: string;
  measureValue?: string;
  measureResult?: string;
}

export interface QmsIqcDocumentRegularVO {
  id?: string | number;
  serialNumber?: number;
  inspectionItem?: string;
  inspectionType?: string;
  inspectionResult?: string;
  inspectionQty?: number;
  unqualifiedQty?: number;
}

export interface QmsIqcDocumentDimVO {
  id?: string | number;
  serialNumber?: number;
  measureItem?: string;
  standardValue?: string;
  upperLimit?: string;
  lowerLimit?: string;
  criticalFlag?: string;
  inspectionResult?: string;
  measurements?: QmsIqcDocumentMeasureVO[];
}

export interface QmsIqcDocumentVO extends BaseEntity {
  id: string | number;
  docPhase?: string;
  dataSource?: string;
  sourceBillNo?: string;
  sourceUniqueKey?: string;
  materialNumber?: string;
  materialName?: string;
  supplierName?: string;
  supplierCode?: string;
  incomingQty?: number;
  oemFactoryCode?: string;
  oemFactoryName?: string;
  inspectionNumber?: string;
  inspectionTime?: string;
  iqcResult?: string;
  exemptFlag?: string;
  sampleQty?: number;
  qualifiedSampleQty?: number;
  unqualifiedSampleQty?: number;
  pushStatus?: string;
  pushMessage?: string;
  pushTime?: string;
  remark?: string;
}

export interface QmsIqcDocumentDetailVO extends QmsIqcDocumentVO {
  regularItems?: QmsIqcDocumentRegularVO[];
  dimItems?: QmsIqcDocumentDimVO[];
}

export interface QmsIqcDocumentQuery extends PageQuery {
  docPhase?: string;
  inspectionNumber?: string;
  sourceUniqueKey?: string;
  sourceBillNo?: string;
  oemFactoryCode?: string;
  supplierCode?: string;
  supplierName?: string;
  materialNumber?: string;
  materialName?: string;
  iqcResult?: string;
  pushStatus?: string;
  dataSource?: string;
  params?: Record<string, unknown>;
}
