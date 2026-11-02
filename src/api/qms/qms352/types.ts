/**
 * QMS-352 附件上传记录，仅保存在当前页面。
 */
export interface Qms352AttachmentRecord {
  uid: string;
  fileName: string;
  fileModule: string;
  attachmentId: string;
  raw: unknown;
  uploadTime: string;
}

/**
 * Excel 业务数据类型。
 */
export type Qms352ExcelBizType = 'receiveAndStart' | 'receiveCompleted' | 'materialException';
