import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { DeliveryOrderVO, DeliveryOrderForm, DeliveryOrderQuery } from '@/api/wms/deliveryOrder/types';

/**
 * 查询STO交货单列表
 * @param query
 * @returns {*}
 */

export const listDeliveryOrder = (query?: DeliveryOrderQuery): AxiosPromise<DeliveryOrderVO[]> => {
  return request({
    url: '/wms/deliveryOrder/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询STO交货单详细
 * @param id
 */
export const getDeliveryOrder = (id: string | number): AxiosPromise<DeliveryOrderVO> => {
  return request({
    url: '/wms/deliveryOrder/' + id,
    method: 'get'
  });
};

/**
 * 新增STO交货单
 * @param data
 */
export const addDeliveryOrder = (data: DeliveryOrderForm) => {
  return request({
    url: '/wms/deliveryOrder',
    method: 'post',
    data: data
  });
};

/**
 * 修改STO交货单
 * @param data
 */
export const updateDeliveryOrder = (data: DeliveryOrderForm) => {
  return request({
    url: '/wms/deliveryOrder',
    method: 'put',
    data: data
  });
};

/**
 * 删除STO交货单
 * @param id
 */
export const delDeliveryOrder = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/deliveryOrder/' + id,
    method: 'delete'
  });
};
