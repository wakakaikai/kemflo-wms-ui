// api/allocation.ts
import axios from '@/utils/request';
import type { AllocationRequest, AllocationPlanVO, AllocationDetailVO, WorkOrderVO, ExecuteRequest } from '@/types/allocation';

export class AllocationApi {
  // 生成分配方案
  static generateAllocation(data: AllocationRequest): Promise<ApiResponse<AllocationPlanVO[]>> {
    return axios.post('/wms/allocation/generate', data);
  }

  // 确认分配方案
  static confirmAllocation(planId: number, operator: string): Promise<ApiResponse<void>> {
    return axios.post(`/wms/allocation/confirm/${planId}`, null, {
      params: { operator }
    });
  }

  // 执行分配方案
  static executeAllocation(planId: number, operator: string): Promise<ApiResponse<any>> {
    return axios.post(`/wms/allocation/execute/${planId}`, null, {
      params: { operator }
    });
  }

  // 获取方案详情
  static getPlanDetail(planId: number): Promise<ApiResponse<AllocationDetailVO[]>> {
    return axios.get(`/wms/allocation/plan/${planId}`);
  }

  // 紧急插单
  static handleEmergency(request: EmergencyAllocationRequest): Promise<ApiResponse<AllocationPlanVO>> {
    return axios.post('/wms/allocation/emergency', request);
  }

  // 获取待发料工单
  static getPendingWorkOrders(params?: any): Promise<ApiResponse<WorkOrderVO[]>> {
    return axios.get('/wms/work-order/pending', { params });
  }

  // 获取工单BOM
  static getWorkOrderBom(workOrderNo: string): Promise<ApiResponse<any[]>> {
    return axios.get(`/wms/work-order/bom/${workOrderNo}`);
  }
}

export default AllocationApi;
