import request from '@/utils/request';
import type {
  AllocationRequest,
  AllocationPlanVO,
  AllocationDetailVO,
  AllocationPlanDetailVO,
  EmergencyAllocationRequest
} from '@/api/wms/allocation/types';

/** 生成单一分配方案 */
export function generateAllocation(data: AllocationRequest) {
  return request({
    url: '/wms/allocation/generate',
    method: 'post',
    data
  });
}

/** 生成多种分配方案 */
export function generateMultiplePlans(data: AllocationRequest) {
  return request({
    url: '/wms/allocation/generateMultiplePlans',
    method: 'post',
    data
  });
}

/** 获取方案详情 */
export function getPlanDetail(planId: number | string) {
  return request({
    url: `/wms/allocation/planDetail/${planId}`,
    method: 'get'
  });
}

/** 确认分配方案 */
export function confirmAllocationPlan(planId: number | string, operator: string) {
  return request({
    url: `/wms/allocation/confirmPlan/${planId}`,
    method: 'put',
    params: { operator }
  });
}

/** 执行分配方案 */
export function executeAllocationPlan(planId: number | string, operator: string) {
  return request({
    url: `/wms/allocation/executePlan/${planId}`,
    method: 'post',
    params: { operator }
  });
}

/** 执行前检查 */
export function preCheckExecution(data: Record<string, unknown>) {
  return request({
    url: '/wms/allocation/preCheckExecution',
    method: 'post',
    data
  });
}

/** 紧急插单 */
export function handleEmergencyOrder(data: EmergencyAllocationRequest) {
  return request({
    url: '/wms/allocation/handleEmergencyOrder',
    method: 'post',
    data
  });
}

/** 检查物料库存 */
export function checkMaterialInventory(workOrderNo: string, materialCodes?: string[]) {
  return request({
    url: `/wms/allocation/checkInventory/${workOrderNo}`,
    method: 'get',
    params: { materialCodes }
  });
}

/** 方案对比 */
export function comparePlans(planIds: (number | string)[]) {
  return request({
    url: '/wms/allocation/comparePlans',
    method: 'post',
    data: planIds
  });
}

/** 发料单预览 */
export function getMaterialIssuePreview(issueId: number | string) {
  return request({
    url: '/wms/allocation/materialIssuePreview',
    method: 'post',
    data: { issueId, includeBatchDetails: true, includeLocationDetails: true, includeMaterialDetails: true }
  });
}

import { listWorkOrder } from '@/api/wms/workOrder';
import { listWorkOrderBom } from '@/api/wms/workOrderBom';

/** 兼容旧页面：获取方案明细列表 */
export async function getPlanDetailList(planId: number | string) {
  const res = await getPlanDetail(planId);
  if (res.data?.allocationDetails) {
    return { ...res, data: res.data.allocationDetails };
  }
  return res;
}

/** 兼容：生成分配（多方案走 generateMultiplePlans） */
export function generateAllocationCompat(data: AllocationRequest) {
  if (data.generateMultiple !== false) {
    return generateMultiplePlans(data);
  }
  return generateAllocation(data);
}

/** 兼容旧方法名 */
export const confirmAllocation = confirmAllocationPlan;
export const executeAllocation = executeAllocationPlan;
export const handleEmergency = handleEmergencyOrder;

export function getMaterialInventory(materialCode: string) {
  return request({
    url: `/wms/allocation/materialInventory/${materialCode}`,
    method: 'get'
  });
}

export function getMaterialLocations(materialCode: string) {
  return getMaterialInventory(materialCode);
}

export function getMaterialBatches(materialCode: string) {
  return getMaterialInventory(materialCode);
}

export function getWorkOrderBom(workOrderNo: string) {
  return listWorkOrderBom({ workOrderNo, pageNum: 1, pageSize: 500 } as any).then((res: any) => ({
    ...res,
    data: res.rows || []
  }));
}

export function getWorkOrderByNo(workOrderNo: string) {
  return listWorkOrder({ workOrderNo, pageNum: 1, pageSize: 1 } as any).then((res: any) => {
    const row = res.rows?.[0] || res.data?.[0];
    return { ...res, data: row };
  });
}

/** 紧急插单影响分析（复用可行性检查） */
export function analyzeEmergencyImpact(data: { workOrderNo: string; emergencyLevel?: number }) {
  return request({
    url: `/wms/allocation/checkInsertFeasibility/${data.workOrderNo}`,
    method: 'post',
    data: []
  }).then((res: any) => ({
    ...res,
    data: {
      feasible: res.data?.feasible ?? true,
      impactLevel: data.emergencyLevel && data.emergencyLevel >= 3 ? '高' : data.emergencyLevel === 2 ? '中' : '低',
      messages: res.data?.messages || res.data?.reasons || [],
      summary: res.data?.message || '影响分析完成'
    }
  }));
}

const AllocationApi = {
  generateAllocation: generateAllocationCompat,
  generateMultiplePlans,
  getPlanDetail: getPlanDetailList,
  confirmAllocation: confirmAllocationPlan,
  executeAllocation: executeAllocationPlan,
  preCheckExecution,
  handleEmergency: handleEmergencyOrder,
  checkMaterialInventory,
  comparePlans,
  getMaterialIssuePreview,
  getMaterialInventory,
  getMaterialLocations,
  getMaterialBatches,
  getWorkOrderBom,
  getWorkOrderByNo,
  analyzeEmergencyImpact
};

export default AllocationApi;

export type { AllocationPlanDetailVO, AllocationDetailVO, AllocationPlanVO };
