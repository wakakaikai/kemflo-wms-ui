import type { WorkOrderPrepLocationRecVO } from '@/api/wms/workOrderPrepLocationRec/types';

export interface WorkOrderPrepDemandLineVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 备料需求ID
   */
  demandId: string | number;

  /**
   * 备料需求单号
   */
  demandNo: string;

  /**
   * 工单号
   */
  workOrderNo: string;

  /**
   * 预留单号(关联BOM行)
   */
  reserveNo: string;

  /**
   * 预留单项次(关联BOM行)
   */
  reserveItemNo: string;

  /**
   * 物料编码
   */
  materialCode: string;

  /**
   * 物料名称
   */
  materialName: string;

  /**
   * 原始需求数量
   */
  componentQty: number;

  /**
   * 已发料数量
   */
  issuedQty: number;

  /**
   * 待发需求数量
   */
  pendingQty: number;

  /**
   * 本次备料/发料数量
   */
  issueQty: number;

  /**
   * 可用库存数量
   */
  availableQty: number;

  /**
   * 缺料数量
   */
  shortageQty: number;

  /**
   * 缺料特殊库存标识(N-正常,E-销售订单等)
   */
  specialInventoryFlag: string;

  /**
   * 销售订单号
   */
  salesOrderNo: string;

  /**
   * 销售订单项次
   */
  salesOrderItem: string;

  /**
   * 该行齐套率(0~1)
   */
  kitRate: number;

  /**
   * 发料单位
   */
  unit: string;

  /**
   * 库存单位
   */
  inventoryUnit: string;

  /**
   * 换算比例
   */
  conversionRatio: number;

  /**
   * 同工单同物料BOM行数(>1表示重复需求)
   */
  materialLineCount: number;

  /**
   * 是否纳入本次备料
   */
  selectedFlag: number;

  /**
   * 备注
   */
  remark: string;

  /**
   * 库位拣货明细
   */
  locationRecs?: WorkOrderPrepLocationRecVO[];

}

export interface WorkOrderPrepDemandLineForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 备料需求ID
   */
  demandId?: string | number;

  /**
   * 备料需求单号
   */
  demandNo?: string;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 预留单号(关联BOM行)
   */
  reserveNo?: string;

  /**
   * 预留单项次(关联BOM行)
   */
  reserveItemNo?: string;

  /**
   * 物料编码
   */
  materialCode?: string;

  /**
   * 物料名称
   */
  materialName?: string;

  /**
   * 原始需求数量
   */
  componentQty?: number;

  /**
   * 已发料数量
   */
  issuedQty?: number;

  /**
   * 待发需求数量
   */
  pendingQty?: number;

  /**
   * 本次备料/发料数量
   */
  issueQty?: number;

  /**
   * 可用库存数量
   */
  availableQty?: number;

  /**
   * 缺料数量
   */
  shortageQty?: number;

  /**
   * 缺料特殊库存标识(N-正常,E-销售订单等)
   */
  specialInventoryFlag?: string;

  /**
   * 销售订单号
   */
  salesOrderNo?: string;

  /**
   * 销售订单项次
   */
  salesOrderItem?: string;

  /**
   * 该行齐套率(0~1)
   */
  kitRate?: number;

  /**
   * 发料单位
   */
  unit?: string;

  /**
   * 库存单位
   */
  inventoryUnit?: string;

  /**
   * 换算比例
   */
  conversionRatio?: number;

  /**
   * 同工单同物料BOM行数(>1表示重复需求)
   */
  materialLineCount?: number;

  /**
   * 是否纳入本次备料
   */
  selectedFlag?: number;

  /**
   * 备注
   */
  remark?: string;

}

export interface WorkOrderPrepDemandLineQuery extends PageQuery {

  /**
   * 备料需求ID
   */
  demandId?: string | number;

  /**
   * 备料需求单号
   */
  demandNo?: string;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 工单号列表（批量查询）
   */
  workOrderNoList?: string[];

  /**
   * 工单号批量录入展示字符串
   */
  workOrderNoStr?: string;

  /**
   * 预留单号(关联BOM行)
   */
  reserveNo?: string;

  /**
   * 预留单项次(关联BOM行)
   */
  reserveItemNo?: string;

  /**
   * 物料编码
   */
  materialCode?: string;

  /**
   * 物料名称
   */
  materialName?: string;

  /**
   * 原始需求数量
   */
  componentQty?: number;

  /**
   * 已发料数量
   */
  issuedQty?: number;

  /**
   * 待发需求数量
   */
  pendingQty?: number;

  /**
   * 本次备料/发料数量
   */
  issueQty?: number;

  /**
   * 可用库存数量
   */
  availableQty?: number;

  /**
   * 缺料数量
   */
  shortageQty?: number;

  /**
   * 缺料特殊库存标识(N-正常,E-销售订单等)
   */
  specialInventoryFlag?: string;

  /**
   * 销售订单号
   */
  salesOrderNo?: string;

  /**
   * 销售订单项次
   */
  salesOrderItem?: string;

  /**
   * 该行齐套率(0~1)
   */
  kitRate?: number;

  /**
   * 发料单位
   */
  unit?: string;

  /**
   * 库存单位
   */
  inventoryUnit?: string;

  /**
   * 换算比例
   */
  conversionRatio?: number;

  /**
   * 同工单同物料BOM行数(>1表示重复需求)
   */
  materialLineCount?: number;

  /**
   * 是否纳入本次备料
   */
  selectedFlag?: number;

    /**
     * 日期范围参数
     */
    params?: any;
}



