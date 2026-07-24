import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { WorkOrderPrepDemandLineVO, WorkOrderPrepDemandLineForm, WorkOrderPrepDemandLineQuery } from '@/api/wms/workOrderPrepDemandLine/types';

/**
 * 查询工单备料需求明细列表
 * @param query
 * @returns {*}
 */

export const listWorkOrderPrepDemandLine = (query?: WorkOrderPrepDemandLineQuery): AxiosPromise<WorkOrderPrepDemandLineVO[]> => {
  return request({
    url: '/wms/workOrderPrepDemandLine/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工单备料需求明细详细
 * @param id
 */
export const getWorkOrderPrepDemandLine = (id: string | number): AxiosPromise<WorkOrderPrepDemandLineVO> => {
  return request({
    url: '/wms/workOrderPrepDemandLine/' + id,
    method: 'get'
  });
};

/**
 * 新增工单备料需求明细
 * @param data
 */
export const addWorkOrderPrepDemandLine = (data: WorkOrderPrepDemandLineForm) => {
  return request({
    url: '/wms/workOrderPrepDemandLine',
    method: 'post',
    data: data
  });
};

/**
 * 修改工单备料需求明细
 * @param data
 */
export const updateWorkOrderPrepDemandLine = (data: WorkOrderPrepDemandLineForm) => {
  return request({
    url: '/wms/workOrderPrepDemandLine',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单备料需求明细
 * @param id
 */
export const delWorkOrderPrepDemandLine = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/workOrderPrepDemandLine/' + id,
    method: 'delete'
  });
};
