import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { AllocationPlanVO, AllocationPlanForm, AllocationPlanQuery } from '@/api/wms/allocationPlan/types';

/**
 * 查询分配方案列表
 * @param query
 * @returns {*}
 */

export const listAllocationPlan = (query?: AllocationPlanQuery): AxiosPromise<AllocationPlanVO[]> => {
  return request({
    url: '/wms/allocationPlan/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询分配方案详细
 * @param id
 */
export const getAllocationPlan = (id: string | number): AxiosPromise<AllocationPlanVO> => {
  return request({
    url: '/wms/allocationPlan/' + id,
    method: 'get'
  });
};

/**
 * 新增分配方案
 * @param data
 */
export const addAllocationPlan = (data: AllocationPlanForm) => {
  return request({
    url: '/wms/allocationPlan',
    method: 'post',
    data: data
  });
};

/**
 * 修改分配方案
 * @param data
 */
export const updateAllocationPlan = (data: AllocationPlanForm) => {
  return request({
    url: '/wms/allocationPlan',
    method: 'put',
    data: data
  });
};

/**
 * 删除分配方案
 * @param id
 */
export const delAllocationPlan = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/allocationPlan/' + id,
    method: 'delete'
  });
};
