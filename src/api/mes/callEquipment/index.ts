import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { CallEquipmentVO, CallEquipmentForm, CallEquipmentQuery } from '@/api/mes/callEquipment/types';

/**
 * 查询异常呼叫设备列表
 * @param query
 * @returns {*}
 */

export const listCallEquipment = (query?: CallEquipmentQuery): AxiosPromise<CallEquipmentVO[]> => {
  return request({
    url: '/mes/callEquipment/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询异常呼叫设备详细
 * @param id
 */
export const getCallEquipment = (id: string | number): AxiosPromise<CallEquipmentVO> => {
  return request({
    url: '/mes/callEquipment/' + id,
    method: 'get'
  });
};

/**
 * 新增异常呼叫设备
 * @param data
 */
export const addCallEquipment = (data: CallEquipmentForm) => {
  return request({
    url: '/mes/callEquipment',
    method: 'post',
    data: data
  });
};

/**
 * 修改异常呼叫设备
 * @param data
 */
export const updateCallEquipment = (data: CallEquipmentForm) => {
  return request({
    url: '/mes/callEquipment',
    method: 'put',
    data: data
  });
};

/**
 * 删除异常呼叫设备
 * @param id
 */
export const delCallEquipment = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/callEquipment/' + id,
    method: 'delete'
  });
};
