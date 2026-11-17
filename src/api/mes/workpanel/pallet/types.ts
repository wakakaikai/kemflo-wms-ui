/** 作业面板栈板产品分页查询 */
export interface WorkPanelItemPalletQuery {
  pageNum?: number;
  pageSize?: number;
  /** 物料编码（精确匹配） */
  item?: string;
  type?: number;
}

/** 产品栈板配置（作业面板） */
export interface WorkPanelItemPalletVO {
  item: string;
  description?: string;
  palletNum?: number;
  ean?: string;
  sku?: string;
  productId?: string;
}

/** SN 校验结果 */
export interface WorkPanelPalletSnCheckVO {
  shopOrderBo?: string;
  actualCompDate?: string;
  sfc?: string;
}

/** 栈板绑定行 */
export interface WorkPanelPalletSnRow {
  sfc: string;
  sequence?: number;
  snProductTime?: string;
  palletNo?: string;
  modifyTime?: string;
}

/** 栈板绑定请求 */
export interface WorkPanelPalletSnBindForm {
  palletNo?: string;
  shopOrderBo?: string;
  useType?: number;
  item?: string;
  palletSnList?: WorkPanelPalletSnRow[];
}

/** 栈板号 / SN 校验 */
export interface WorkPanelPalletSnValidateForm {
  palletNo?: string;
  sfc?: string;
  item?: string;
  useType?: number;
  palletSnList?: WorkPanelPalletSnRow[];
}

/** 栈板 SN 列表查询 */
export interface WorkPanelPalletSnListForm {
  palletNo?: string;
  sfc?: string;
}

/** 栈板解绑 */
export interface WorkPanelPalletSnUnbindForm {
  palletNo?: string;
  sfc?: string;
}

/** 绑定结果 */
export interface WorkPanelPalletBindResultVO {
  palletNo?: string;
}

/** 条码下达 */
export interface WorkPanelPalletGenerateForm {
  qty?: number;
  item?: string;
  palletLevel?: number;
}

export interface WorkPanelPalletGenerateResultVO {
  batchId?: string;
}

/** 导出下达条码 */
export interface WorkPanelPalletExportColumn {
  field: string;
  title: string;
}

export interface WorkPanelPalletExportForm {
  batchId?: string;
  item?: string;
  exportColumn?: WorkPanelPalletExportColumn[];
}
