import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { WorkOrderVO, WorkOrderForm, WorkOrderQuery } from '@/api/wms/workOrder/types';

/**
 * 查询工单信息列表
 * @param query
 * @returns {*}
 */

export const listWorkOrder = (query?: WorkOrderQuery): AxiosPromise<WorkOrderVO[]> => {
  return request({
    url: '/wms/workOrder/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工单信息详细
 * @param id
 */
export const getWorkOrder = (id: string | number): AxiosPromise<WorkOrderVO> => {
  return request({
    url: '/wms/workOrder/' + id,
    method: 'get'
  });
};

/**
 * 新增工单信息
 * @param data
 */
export const addWorkOrder = (data: WorkOrderForm) => {
  return request({
    url: '/wms/workOrder',
    method: 'post',
    data: data
  });
};

/**
 * 修改工单信息
 * @param data
 */
export const updateWorkOrder = (data: WorkOrderForm) => {
  return request({
    url: '/wms/workOrder',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单信息
 * @param id
 */
export const delWorkOrder = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/workOrder/' + id,
    method: 'delete'
  });
};
