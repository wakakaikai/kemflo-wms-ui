import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ShippingCustomerNoticeVO, ShippingCustomerNoticeForm, ShippingCustomerNoticeQuery } from '@/api/wms/shippingCustomerNotice/types';

/**
 * 查询客户出货通知列表
 * @param query
 * @returns {*}
 */

export const listShippingCustomerNotice = (query?: ShippingCustomerNoticeQuery): AxiosPromise<ShippingCustomerNoticeVO[]> => {
  return request({
    url: '/wms/shippingCustomerNotice/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询客户出货通知详细
 * @param id
 */
export const getShippingCustomerNotice = (id: string | number): AxiosPromise<ShippingCustomerNoticeVO> => {
  return request({
    url: '/wms/shippingCustomerNotice/' + id,
    method: 'get'
  });
};

/**
 * 新增客户出货通知
 * @param data
 */
export const addShippingCustomerNotice = (data: ShippingCustomerNoticeForm) => {
  return request({
    url: '/wms/shippingCustomerNotice',
    method: 'post',
    data: data
  });
};

/**
 * 修改客户出货通知
 * @param data
 */
export const updateShippingCustomerNotice = (data: ShippingCustomerNoticeForm) => {
  return request({
    url: '/wms/shippingCustomerNotice',
    method: 'put',
    data: data
  });
};

/**
 * 删除客户出货通知
 * @param id
 */
export const delShippingCustomerNotice = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/shippingCustomerNotice/' + id,
    method: 'delete'
  });
};
