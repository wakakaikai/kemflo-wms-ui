export interface ReceiptOrderVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 入库单号
   */
  receiptOrderNo: string;

  /**
   * 入库类型：1: 采购入库 2：生产入库 3：其他入库
   */
  receiptOrderType: number;

  /**
   * 订单号
   */
  orderNo: string;

  /**
   * 供应商
   */
  supplierId: string | number;

  /**
   * 入库状态 1：未发货 2：在途（已发货未入库）3：部分入库 4：入库完成  5：作废 
   */
  receiptOrderStatus: number;

  /**
   * 批次号
   */
  batchNo: string;

  /**
   * 备注
   */
  remark: string;

}

export interface ReceiptOrderForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 入库单号
   */
  receiptOrderNo?: string;

  /**
   * 入库类型：1: 采购入库 2：生产入库 3：其他入库
   */
  receiptOrderType?: number;

  /**
   * 订单号
   */
  orderNo?: string;

  /**
   * 供应商
   */
  supplierId?: string | number;

  /**
   * 入库状态 1：未发货 2：在途（已发货未入库）3：部分入库 4：入库完成  5：作废 
   */
  receiptOrderStatus?: number;

  /**
   * 批次号
   */
  batchNo?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface ReceiptOrderQuery extends PageQuery {

  /**
   * 入库单号
   */
  receiptOrderNo?: string;

  /**
   * 入库类型：1: 采购入库 2：生产入库 3：其他入库
   */
  receiptOrderType?: number;

  /**
   * 订单号
   */
  orderNo?: string;

  /**
   * 供应商
   */
  supplierId?: string | number;

  /**
   * 入库状态 1：未发货 2：在途（已发货未入库）3：部分入库 4：入库完成  5：作废 
   */
  receiptOrderStatus?: number;

  /**
   * 批次号
   */
  batchNo?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



