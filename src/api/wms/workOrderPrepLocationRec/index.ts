import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { WorkOrderPrepLocationRecVO, WorkOrderPrepLocationRecForm, WorkOrderPrepLocationRecQuery } from '@/api/wms/workOrderPrepLocationRec/types';

/**
 * 查询工单备料库位明细列表
 * @param query
 * @returns {*}
 */

export const listWorkOrderPrepLocationRec = (query?: WorkOrderPrepLocationRecQuery): AxiosPromise<WorkOrderPrepLocationRecVO[]> => {
  return request({
    url: '/wms/workOrderPrepLocationRec/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工单备料库位明细详细
 * @param id
 */
export const getWorkOrderPrepLocationRec = (id: string | number): AxiosPromise<WorkOrderPrepLocationRecVO> => {
  return request({
    url: '/wms/workOrderPrepLocationRec/' + id,
    method: 'get'
  });
};

/**
 * 新增工单备料库位明细
 * @param data
 */
export const addWorkOrderPrepLocationRec = (data: WorkOrderPrepLocationRecForm) => {
  return request({
    url: '/wms/workOrderPrepLocationRec',
    method: 'post',
    data: data
  });
};

/**
 * 修改工单备料库位明细
 * @param data
 */
export const updateWorkOrderPrepLocationRec = (data: WorkOrderPrepLocationRecForm) => {
  return request({
    url: '/wms/workOrderPrepLocationRec',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单备料库位明细
 * @param id
 */
export const delWorkOrderPrepLocationRec = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/workOrderPrepLocationRec/' + id,
    method: 'delete'
  });
};
