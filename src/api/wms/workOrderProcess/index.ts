import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { WorkOrderProcessVO, WorkOrderProcessForm, WorkOrderProcessQuery } from '@/api/wms/workOrderProcess/types';

/**
 * 查询工单工序列表
 * @param query
 * @returns {*}
 */

export const listWorkOrderProcess = (query?: WorkOrderProcessQuery): AxiosPromise<WorkOrderProcessVO[]> => {
  return request({
    url: '/wms/workOrderProcess/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工单工序详细
 * @param id
 */
export const getWorkOrderProcess = (id: string | number): AxiosPromise<WorkOrderProcessVO> => {
  return request({
    url: '/wms/workOrderProcess/' + id,
    method: 'get'
  });
};

/**
 * 新增工单工序
 * @param data
 */
export const addWorkOrderProcess = (data: WorkOrderProcessForm) => {
  return request({
    url: '/wms/workOrderProcess',
    method: 'post',
    data: data
  });
};

/**
 * 修改工单工序
 * @param data
 */
export const updateWorkOrderProcess = (data: WorkOrderProcessForm) => {
  return request({
    url: '/wms/workOrderProcess',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单工序
 * @param id
 */
export const delWorkOrderProcess = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/workOrderProcess/' + id,
    method: 'delete'
  });
};
