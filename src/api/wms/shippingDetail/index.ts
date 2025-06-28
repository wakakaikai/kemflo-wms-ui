import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ShippingDetailVO, ShippingDetailForm, ShippingDetailQuery } from '@/api/wms/shippingDetail/types';

/**
 * 查询出货明细列表
 * @param query
 * @returns {*}
 */

export const listShippingDetail = (query?: ShippingDetailQuery): AxiosPromise<ShippingDetailVO[]> => {
  return request({
    url: '/wms/shippingDetail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询出货明细详细
 * @param id
 */
export const getShippingDetail = (id: string | number): AxiosPromise<ShippingDetailVO> => {
  return request({
    url: '/wms/shippingDetail/' + id,
    method: 'get'
  });
};

/**
 * 新增出货明细
 * @param data
 */
export const addShippingDetail = (data: ShippingDetailForm) => {
  return request({
    url: '/wms/shippingDetail',
    method: 'post',
    data: data
  });
};

/**
 * 修改出货明细
 * @param data
 */
export const updateShippingDetail = (data: ShippingDetailForm) => {
  return request({
    url: '/wms/shippingDetail',
    method: 'put',
    data: data
  });
};

/**
 * 删除出货明细
 * @param id
 */
export const delShippingDetail = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/shippingDetail/' + id,
    method: 'delete'
  });
};
