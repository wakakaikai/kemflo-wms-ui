import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { WorkOrderProcessEquipmentVO, WorkOrderProcessEquipmentForm, WorkOrderProcessEquipmentQuery } from '@/api/wms/workOrderProcessEquipment/types';

/**
 * 查询工单工序设备列表
 * @param query
 * @returns {*}
 */

export const listWorkOrderProcessEquipment = (query?: WorkOrderProcessEquipmentQuery): AxiosPromise<WorkOrderProcessEquipmentVO[]> => {
  return request({
    url: '/wms/workOrderProcessEquipment/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工单工序设备详细
 * @param id
 */
export const getWorkOrderProcessEquipment = (id: string | number): AxiosPromise<WorkOrderProcessEquipmentVO> => {
  return request({
    url: '/wms/workOrderProcessEquipment/' + id,
    method: 'get'
  });
};

/**
 * 新增工单工序设备
 * @param data
 */
export const addWorkOrderProcessEquipment = (data: WorkOrderProcessEquipmentForm) => {
  return request({
    url: '/wms/workOrderProcessEquipment',
    method: 'post',
    data: data
  });
};

/**
 * 修改工单工序设备
 * @param data
 */
export const updateWorkOrderProcessEquipment = (data: WorkOrderProcessEquipmentForm) => {
  return request({
    url: '/wms/workOrderProcessEquipment',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单工序设备
 * @param id
 */
export const delWorkOrderProcessEquipment = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/workOrderProcessEquipment/' + id,
    method: 'delete'
  });
};
