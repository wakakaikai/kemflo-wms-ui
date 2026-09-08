export interface PurchaseOrderVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 采购订单号
   */
  poNumber: string;

  /**
   * 凭证类型
   */
  docType: string;

  /**
   * 采购组
   */
  purchasingGroup: string;

  /**
   * 采购组织
   */
  purchasingOrg: string;

  /**
   * 供应商代码
   */
  supplierCode: string;

  /**
   * 供应商名称
   */
  supplierName?: string;

  /**
   * 备注
   */
  remark: string;
}

export interface PurchaseOrderForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 采购订单号
   */
  poNumber?: string;

  /**
   * 凭证类型
   */
  docType?: string;

  /**
   * 采购组
   */
  purchasingGroup?: string;

  /**
   * 采购组织
   */
  purchasingOrg?: string;

  /**
   * 供应商代码
   */
  supplierCode?: string;

  /**
   * 供应商名称
   */
  supplierName?: string;

  /**
   * 备注
   */
  remark?: string;
}

export interface PurchaseOrderQuery extends PageQuery {
  /**
   * 采购订单号
   */
  poNumber?: string;

  /**
   * 凭证类型
   */
  docType?: string;

  /**
   * 采购组
   */
  purchasingGroup?: string;

  /**
   * 采购组织
   */
  purchasingOrg?: string;

  /**
   * 供应商代码
   */
  supplierCode?: string;

  /**
   * 供应商名称
   */
  supplierName?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}

/** 采购件退货行 */
export interface PurchaseOrderReturnBo {
  /** 移动记录ID */
  id?: string | number;
  /** 移动类型（102/122/161 等） */
  moveType?: string;
  /** 物料编码 */
  itemCode?: string;
  /** 物料名称 */
  itemName?: string;
  /** 批次号 */
  batchCode?: string;
  /** 库存类型 */
  inventoryType?: string;
  /** 退货数量 */
  returnQuantity?: number;
  /** PO单位 */
  poUnit?: string;
  /** 采购单项次 */
  poItemNo?: string;
  /** 库存数量 */
  inventoryQuantity?: number | string;
  /** 库存基本单位 */
  inventoryUnit?: string;
  /** 换算比例 */
  conversionRatio?: number;
  /** 单据类型 */
  sourceDocType?: string;
  /** 单据编号（采购单号） */
  sourceDocCode?: string;
  /** 特殊库存标识 */
  specialInventoryFlag?: string;
  /** 业务伙伴 */
  businessCode?: string;
  /** 业务伙伴名称 */
  businessName?: string;
  /** SAP凭证年度（参考凭证会计年度 LFBJA） */
  sapMaterialDocYear?: number | string;
  /** SAP物料凭证号（参考凭证的凭证号 LFBNR） */
  sapMaterialOrderNo?: string;
  /** SAP物料文件项次（参考凭证项目 LFPOS） */
  sapMaterialItem?: string;
  /** 目标库位编码 */
  targetLocationCode?: string;
  /** 交货单 */
  lfsnr?: string;
  /** 抬头文本 */
  bktxt?: string;
  /** 过账日期 */
  postingDate?: string;
  /** 备注 */
  remark?: string;
}

/** 采购件退货提交 */
export interface PurchaseOrderReturnBatchForm {
  /** 1-退货 2-冲销 */
  returnType?: number;
  /** 交货单号 */
  lfsnr?: string;
  /** 抬头文本 */
  bktxt?: string;
  /** 过账日期 */
  postingDate?: string;
  /** 退货明细行 */
  purchaseOrderReturnBoList: PurchaseOrderReturnBo[];
}
