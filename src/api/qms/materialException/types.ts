export interface QmsMaterialExceptionFile {
  ossId: string | number;
  fileName: string;
  originalName: string;
  fileSuffix: string;
  url: string;
  externalFileId?: string;
}

export interface QmsMaterialExceptionVO extends BaseEntity {
  id: string | number;
  flowNumber?: string;
  inspectionNumber?: string;
  occurrenceLocation?: string;
  oemFactoryCode?: string;
  oemFactoryName?: string;
  purchaseOrder?: string;
  batchNumber?: string;
  supplierCode?: string;
  supplierName?: string;
  materialNumber?: string;
  materialName?: string;
  specModel?: string;
  occurrenceDate?: string;
  sampleQty?: number;
  unqualifiedQty?: number;
  unqualifiedRate?: number;
  defectCategory?: string;
  failPhenomenon?: string;
  vendorAttachmentIds?: string;
  vendorEightDReportId?: string | number;
  attachmentIds?: string;
  eightDReportId?: string | number;
  verificationRemarks?: string;
  endTime?: string;
  pushStatus?: string;
  pushMessage?: string;
  pushTime?: string;
  remark?: string;
  attachments?: QmsMaterialExceptionFile[];
  eightDReport?: QmsMaterialExceptionFile;
}

export interface QmsMaterialExceptionQuery extends PageQuery {
  flowNumber?: string;
  inspectionNumber?: string;
  occurrenceLocation?: string;
  oemFactoryCode?: string;
  purchaseOrder?: string;
  batchNumber?: string;
  supplierCode?: string;
  supplierName?: string;
  materialNumber?: string;
  materialName?: string;
  defectCategory?: string;
  pushStatus?: string;
  params?: Record<string, unknown>;
}
