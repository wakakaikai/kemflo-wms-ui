/**
 * 特殊工单入库 API 接口
 * 支持工单类型：ZP81-重工、ZP82-打样、ZP83-RMA返修、ZP91-研发工单、ZP92-拆解工单、ZP93-粉碎工单、ZP94-采购重工工单、ZP99-其他料号工单
 */
import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import type { SpecialReceiveQuery, SpecialReceiveForm, SpecialReceiveVO, SpecialReceiveItem, ReceiveLineItem, SpecialWorkOrderType, SpecialReceiveMoveType, WORK_ORDER_MOVE_TYPES, WORK_ORDER_TYPE_REMARKS } from './types';

/**
 * 提交特殊工单入库（直接调后端入库接口）
 */
export function submitWorkOrderSpecialReceive(data: {
  bktxt?: string;
  workOrderInOutBoundList: Array<{
    workOrderNo: string;
    workOrderType?: string;
    moveType?: string;
    materialCode: string;
    materialName?: string;
    quantity: number;
    unit?: string;
    batchCode?: string;
    locationCode: string;
    warehouseCode?: string;
    areaCode?: string;
    specialInventoryFlag?: string;
    businessCode?: string;
    businessName?: string;
    remark?: string;
  }>;
}): AxiosPromise<string> {
  return request({
    url: '/wms/workOrder/inbound',
    method: 'post',
    data
  });
}

// 导出类型供页面使用
export type { SpecialReceiveQuery, SpecialReceiveForm, SpecialReceiveVO, SpecialReceiveItem, ReceiveLineItem, SpecialWorkOrderType, SpecialReceiveMoveType };

export { WORK_ORDER_MOVE_TYPES, WORK_ORDER_TYPE_REMARKS };
