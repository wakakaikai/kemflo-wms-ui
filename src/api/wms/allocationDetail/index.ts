import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { AllocationDetailVO, AllocationDetailForm, AllocationDetailQuery } from '@/api/wms/allocationDetail/types';

/**
 * 查询分配明细列表
 * @param query
 * @returns {*}
 */

export const listAllocationDetail = (query?: AllocationDetailQuery): AxiosPromise<AllocationDetailVO[]> => {
  return request({
    url: '/wms/allocationDetail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询分配明细详细
 * @param id
 */
export const getAllocationDetail = (id: string | number): AxiosPromise<AllocationDetailVO> => {
  return request({
    url: '/wms/allocationDetail/' + id,
    method: 'get'
  });
};

/**
 * 新增分配明细
 * @param data
 */
export const addAllocationDetail = (data: AllocationDetailForm) => {
  return request({
    url: '/wms/allocationDetail',
    method: 'post',
    data: data
  });
};

/**
 * 修改分配明细
 * @param data
 */
export const updateAllocationDetail = (data: AllocationDetailForm) => {
  return request({
    url: '/wms/allocationDetail',
    method: 'put',
    data: data
  });
};

/**
 * 删除分配明细
 * @param id
 */
export const delAllocationDetail = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/allocationDetail/' + id,
    method: 'delete'
  });
};
