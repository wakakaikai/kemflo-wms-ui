import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { WorkOrderBomVO, WorkOrderBomForm, WorkOrderBomQuery } from '@/api/wms/workOrderBom/types';

/**
 * 查询工单BOM列表
 * @param query
 * @returns {*}
 */

export const listWorkOrderBom = (query?: WorkOrderBomQuery): AxiosPromise<WorkOrderBomVO[]> => {
  return request({
    url: '/wms/workOrderBom/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工单BOM详细
 * @param id
 */
export const getWorkOrderBom = (id: string | number): AxiosPromise<WorkOrderBomVO> => {
  return request({
    url: '/wms/workOrderBom/' + id,
    method: 'get'
  });
};

/**
 * 新增工单BOM
 * @param data
 */
export const addWorkOrderBom = (data: WorkOrderBomForm) => {
  return request({
    url: '/wms/workOrderBom',
    method: 'post',
    data: data
  });
};

/**
 * 修改工单BOM
 * @param data
 */
export const updateWorkOrderBom = (data: WorkOrderBomForm) => {
  return request({
    url: '/wms/workOrderBom',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单BOM
 * @param id
 */
export const delWorkOrderBom = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/workOrderBom/' + id,
    method: 'delete'
  });
};
