import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { DeliveryOrderDetailVO, DeliveryOrderDetailForm, DeliveryOrderDetailQuery } from '@/api/wms/deliveryOrderDetail/types';

/**
 * 查询STO交货单明细列表
 * @param query
 * @returns {*}
 */

export const listDeliveryOrderDetail = (query?: DeliveryOrderDetailQuery): AxiosPromise<DeliveryOrderDetailVO[]> => {
  return request({
    url: '/wms/deliveryOrderDetail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询STO交货单明细详细
 * @param id
 */
export const getDeliveryOrderDetail = (id: string | number): AxiosPromise<DeliveryOrderDetailVO> => {
  return request({
    url: '/wms/deliveryOrderDetail/' + id,
    method: 'get'
  });
};

/**
 * 新增STO交货单明细
 * @param data
 */
export const addDeliveryOrderDetail = (data: DeliveryOrderDetailForm) => {
  return request({
    url: '/wms/deliveryOrderDetail',
    method: 'post',
    data: data
  });
};

/**
 * 修改STO交货单明细
 * @param data
 */
export const updateDeliveryOrderDetail = (data: DeliveryOrderDetailForm) => {
  return request({
    url: '/wms/deliveryOrderDetail',
    method: 'put',
    data: data
  });
};

/**
 * 删除STO交货单明细
 * @param id
 */
export const delDeliveryOrderDetail = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/deliveryOrderDetail/' + id,
    method: 'delete'
  });
};
