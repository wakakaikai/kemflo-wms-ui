import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ShippingNoticeVO, ShippingNoticeForm, ShippingNoticeQuery } from '@/api/wms/shippingNotice/types';

/**
 * 查询出货通知列表
 * @param query
 * @returns {*}
 */

export const listShippingNotice = (query?: ShippingNoticeQuery): AxiosPromise<ShippingNoticeVO[]> => {
  return request({
    url: '/wms/shippingNotice/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询出货通知列表
 * @param query
 * @returns {*}
 */

export const listCustomerShippingNotice = (query?: ShippingNoticeQuery): AxiosPromise<ShippingNoticeVO[]> => {
  return request({
    url: '/wms/shippingNotice/customer/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询出货通知详细
 * @param id
 */
export const getShippingNotice = (id: string | number): AxiosPromise<ShippingNoticeVO> => {
  return request({
    url: '/wms/shippingNotice/' + id,
    method: 'get'
  });
};

/**
 * 新增出货通知
 * @param data
 */
export const addShippingNotice = (data: ShippingNoticeForm) => {
  return request({
    url: '/wms/shippingNotice/add',
    method: 'post',
    data: data
  });
};

/**
 * 修改出货通知
 * @param data
 */
export const updateShippingNotice = (data: ShippingNoticeForm) => {
  return request({
    url: '/wms/shippingNotice/edit',
    method: 'put',
    data: data
  });
};

/**
 * 批量修改出货通知
 * @param data
 */
export const updateBatchShippingNotice = (data?: any): AxiosPromise<ShippingNoticeForm[]> => {
  return request({
    url: '/wms/shippingNotice/editBatch',
    method: 'put',
    data: data
  });
};

/**
 * 删除出货通知
 * @param id
 */
export const delShippingNotice = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/shippingNotice/' + id,
    method: 'delete'
  });
};
