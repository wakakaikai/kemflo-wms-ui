import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ShopOrderSfcVO, ShopOrderSfcForm, ShopOrderSfcQuery } from '@/api/mes/shopOrderSfc/types';

/**
 * 查询工单下达的条码列表
 * @param query
 * @returns {*}
 */

export const listShopOrderSfc = (query?: ShopOrderSfcQuery): AxiosPromise<ShopOrderSfcVO[]> => {
  return request({
    url: '/mes/shopOrderSfc/list',
    method: 'get',
    params: query
  });
};

/**
 * 新增工单下达的条码
 * @param data
 * @returns {*}
 */
export const pageShopOrderSfc = (data: any): AxiosPromise<ShopOrderSfcVO[]> => {
  return request({
    url: '/mes/shopOrderSfc/page',
    method: 'post',
    data: data
  });
};

/**
 * 查询工单下达的条码详细
 * @param id
 */
export const getShopOrderSfc = (id: string | number): AxiosPromise<ShopOrderSfcVO> => {
  return request({
    url: '/mes/shopOrderSfc/' + id,
    method: 'get'
  });
};

/**
 * 新增工单下达的条码
 * @param data
 */
export const addShopOrderSfc = (data: ShopOrderSfcForm) => {
  return request({
    url: '/mes/shopOrderSfc',
    method: 'post',
    data: data
  });
};

/**
 * 修改工单下达的条码
 * @param data
 */
export const updateShopOrderSfc = (data: ShopOrderSfcForm) => {
  return request({
    url: '/mes/shopOrderSfc',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单下达的条码
 * @param id
 */
export const delShopOrderSfc = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/shopOrderSfc/' + id,
    method: 'delete'
  });
};
