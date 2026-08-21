/**
 * 特殊工单入库接口类型定义
 * 支持工单类型：ZP81-重工、ZP82-打样、ZP83-RMA返修、ZP91-研发工单、ZP92-拆解工单、ZP93-粉碎工单、ZP94-采购重工工单、ZP99-其他料号工单
 * 移动类型：101-入库、102-取消入库、261-发料、262-退料、531-次品入库、532-次品退料
 */

import type { PageQuery } from '@/api/types';

// 工单类型枚举
export enum SpecialWorkOrderType {
  ZP81 = 'ZP81', // 重工
  ZP82 = 'ZP82', // 打样
  ZP83 = 'ZP83', // RMA返修
  ZP91 = 'ZP91', // 研发工单
  ZP92 = 'ZP92', // 拆解工单
  ZP93 = 'ZP93', // 粉碎工单
  ZP94 = 'ZP94', // 采购重工工单
  ZP99 = 'ZP99'  // 其他料号工单
}

// 移动类型枚举
export enum SpecialReceiveMoveType {
  ISSUE = '261',      // 发料
  RETURN = '262',     // 退料
  RECEIPT = '101',    // 入库
  CANCEL_RECEIPT = '102', // 取消入库
  SUB_RECEIPT = '531', // 次品入库
  SUB_RETURN = '532'   // 次品退料
}

// 移动类型标签映射
export const MOVE_TYPE_LABELS: Record<string, string> = {
  [SpecialReceiveMoveType.ISSUE]: '发料',
  [SpecialReceiveMoveType.RETURN]: '退料',
  [SpecialReceiveMoveType.RECEIPT]: '入库',
  [SpecialReceiveMoveType.CANCEL_RECEIPT]: '取消入库',
  [SpecialReceiveMoveType.SUB_RECEIPT]: '次品入库',
  [SpecialReceiveMoveType.SUB_RETURN]: '次品退料'
};

// 工单类型标签映射
export const WORK_ORDER_TYPE_LABELS: Record<string, string> = {
  [SpecialWorkOrderType.ZP81]: 'ZP81-重工',
  [SpecialWorkOrderType.ZP82]: 'ZP82-打样',
  [SpecialWorkOrderType.ZP83]: 'ZP83-RMA返修',
  [SpecialWorkOrderType.ZP91]: 'ZP91-研发工单',
  [SpecialWorkOrderType.ZP92]: 'ZP92-拆解工单',
  [SpecialWorkOrderType.ZP93]: 'ZP93-粉碎工单',
  [SpecialWorkOrderType.ZP94]: 'ZP94-采购重工工单',
  [SpecialWorkOrderType.ZP99]: 'ZP99-其他料号工单'
};

// 工单类型与支持的移动类型映射
export const WORK_ORDER_MOVE_TYPES: Record<string, SpecialReceiveMoveType[]> = {
  [SpecialWorkOrderType.ZP81]: [SpecialReceiveMoveType.ISSUE, SpecialReceiveMoveType.RETURN, SpecialReceiveMoveType.RECEIPT, SpecialReceiveMoveType.CANCEL_RECEIPT],
  [SpecialWorkOrderType.ZP82]: [SpecialReceiveMoveType.ISSUE, SpecialReceiveMoveType.RETURN, SpecialReceiveMoveType.RECEIPT, SpecialReceiveMoveType.CANCEL_RECEIPT],
  [SpecialWorkOrderType.ZP83]: [SpecialReceiveMoveType.ISSUE, SpecialReceiveMoveType.RETURN, SpecialReceiveMoveType.RETURN, SpecialReceiveMoveType.ISSUE], // 261领料 262成品入库
  [SpecialWorkOrderType.ZP91]: [SpecialReceiveMoveType.ISSUE, SpecialReceiveMoveType.RETURN],
  [SpecialWorkOrderType.ZP92]: [SpecialReceiveMoveType.ISSUE, SpecialReceiveMoveType.RETURN, SpecialReceiveMoveType.RETURN, SpecialReceiveMoveType.ISSUE], // 261领料 262入库
  [SpecialWorkOrderType.ZP93]: [SpecialReceiveMoveType.ISSUE, SpecialReceiveMoveType.RETURN, SpecialReceiveMoveType.SUB_RECEIPT, SpecialReceiveMoveType.SUB_RETURN],
  [SpecialWorkOrderType.ZP94]: [SpecialReceiveMoveType.ISSUE, SpecialReceiveMoveType.RETURN, SpecialReceiveMoveType.RETURN, SpecialReceiveMoveType.ISSUE], // 维修材料及成品
  [SpecialWorkOrderType.ZP99]: [SpecialReceiveMoveType.ISSUE, SpecialReceiveMoveType.RETURN, SpecialReceiveMoveType.SUB_RECEIPT, SpecialReceiveMoveType.SUB_RETURN]
};

// 工单类型备注映射
export const WORK_ORDER_TYPE_REMARKS: Record<string, string> = {
  [SpecialWorkOrderType.ZP81]: '同常规工单',
  [SpecialWorkOrderType.ZP82]: '同常规工单',
  [SpecialWorkOrderType.ZP83]: '维修材料及成品 BOM 261领料 262成品入库',
  [SpecialWorkOrderType.ZP91]: 'BOM 261领料 样品不入库',
  [SpecialWorkOrderType.ZP92]: 'BOM 261领料 262入库 工单+料号',
  [SpecialWorkOrderType.ZP93]: '261领料 工单+料号 531入库工单指定的次料料号',
  [SpecialWorkOrderType.ZP94]: '维修材料及成品 BOM 261领料 262成品入库',
  [SpecialWorkOrderType.ZP99]: ''
};

// 特殊工单入库查询参数
export interface SpecialReceiveQuery extends PageQuery {
  workOrderNo?: string;
  workOrderType?: string;
  moveType?: string;
  materialCode?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// 特殊工单入库明细行
export interface SpecialReceiveItem {
  id?: string | number;
  workOrderNo?: string;
  workOrderType?: string;
  moveType?: string;
  moveTypeLabel?: string;
  materialCode?: string;
  materialDesc?: string;
  materialSpec?: string;
  unit?: string;
  planQty?: number;      // 计划数量
  actualQty?: number;    // 实际数量
  moveQty?: number;      // 移动数量
  warehouseCode?: string;
  warehouseName?: string;
  locationCode?: string;
  batchCode?: string;
  specialInventoryFlag?: string;
  businessCode?: string;
  businessName?: string;
  remark?: string;
  status?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

// 特殊工单入库表单
export interface SpecialReceiveForm {
  id?: string | number;
  workOrderNo?: string;
  workOrderType?: string;
  moveType?: string;
  items?: SpecialReceiveItem[];
  remark?: string;
  operator?: string;
  operationTime?: string;
}

// 特殊工单入库视图对象
export interface SpecialReceiveVO extends SpecialReceiveForm {
  id: string | number;
  status: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

// 入库明细行（用于列表展示和编辑）
export interface ReceiveLineItem {
  id?: string | number;
  lineNo?: number;
  materialCode?: string;
  materialDesc?: string;
  materialSpec?: string;
  unit?: string;
  planQty?: number;
  moveQty?: number;
  actualQty?: number;
  warehouseCode?: string;
  warehouseName?: string;
  locationCode?: string;
  locationName?: string;
  batchCode?: string;
  specialInventoryFlag?: string;
  specialInventoryFlagLabel?: string;
  businessCode?: string;
  businessName?: string;
  remark?: string;
  _editing?: boolean;
}

// 入库单据状态
export enum ReceiveStatus {
  DRAFT = 'DRAFT',       // 草稿
  SUBMITTED = 'SUBMITTED', // 已提交
  COMPLETED = 'COMPLETED', // 已完成
  CANCELLED = 'CANCELLED'  // 已取消
}

// 入库单据状态标签
export const RECEIVE_STATUS_LABELS: Record<string, string> = {
  [ReceiveStatus.DRAFT]: '草稿',
  [ReceiveStatus.SUBMITTED]: '已提交',
  [ReceiveStatus.COMPLETED]: '已完成',
  [ReceiveStatus.CANCELLED]: '已取消'
};

// 获取工单类型支持的移动类型
export function getMoveTypesByWorkOrderType(workOrderType: string): SpecialReceiveMoveType[] {
  return WORK_ORDER_MOVE_TYPES[workOrderType] || [];
}

// 获取移动类型标签
export function getMoveTypeLabel(moveType: string): string {
  return MOVE_TYPE_LABELS[moveType] || moveType;
}

// 获取工单类型标签
export function getWorkOrderTypeLabel(workOrderType: string): string {
  return WORK_ORDER_TYPE_LABELS[workOrderType] || workOrderType;
}

// 获取工单类型备注
export function getWorkOrderTypeRemark(workOrderType: string): string {
  return WORK_ORDER_TYPE_REMARKS[workOrderType] || '';
}

// 判断移动类型是否为入库类
export function isReceiptMoveType(moveType: string): boolean {
  return moveType === SpecialReceiveMoveType.RECEIPT || moveType === SpecialReceiveMoveType.SUB_RECEIPT;
}

// 判断移动类型是否为出库类
export function isIssueMoveType(moveType: string): boolean {
  return moveType === SpecialReceiveMoveType.ISSUE || moveType === SpecialReceiveMoveType.SUB_RETURN;
}

// 判断移动类型是否为退料类
export function isReturnMoveType(moveType: string): boolean {
  return moveType === SpecialReceiveMoveType.RETURN;
}

// 判断移动类型是否为取消入库类
export function isCancelReceiptMoveType(moveType: string): boolean {
  return moveType === SpecialReceiveMoveType.CANCEL_RECEIPT;
}