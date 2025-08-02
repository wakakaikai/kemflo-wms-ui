import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { WorkOrderSnVO, WorkOrderSnForm, WorkOrderSnQuery } from '@/api/wms/workOrderSn/types';

/**
 * 查询工单条码列表
 * @param query
 * @returns {*}
 */

export const listWorkOrderSn = (query?: WorkOrderSnQuery): AxiosPromise<WorkOrderSnVO[]> => {
  return request({
    url: '/wms/workOrderSn/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工单条码详细
 * @param id
 */
export const getWorkOrderSn = (id: string | number): AxiosPromise<WorkOrderSnVO> => {
  return request({
    url: '/wms/workOrderSn/' + id,
    method: 'get'
  });
};

/**
 * 生成单条码
 * @param data
 */
export const generateWorkOrderSn = (data: WorkOrderSnForm) => {
  return request({
    url: '/wms/workOrderSn/generate',
    method: 'post',
    data: data
  });
};

/**
 * 新增工单条码
 * @param data
 */
export const addWorkOrderSn = (data: WorkOrderSnForm) => {
  return request({
    url: '/wms/workOrderSn',
    method: 'post',
    data: data
  });
};

/**
 * 修改工单条码
 * @param data
 */
export const updateWorkOrderSn = (data: WorkOrderSnForm) => {
  return request({
    url: '/wms/workOrderSn',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单条码
 * @param id
 */
export const delWorkOrderSn = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/workOrderSn/' + id,
    method: 'delete'
  });
};
