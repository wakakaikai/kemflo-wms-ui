import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ShopOrderVO, ShopOrderForm, ShopOrderQuery } from '@/api/mes/shopOrder/types';

/**
 * 查询工单档案列表
 * @param query
 * @returns {*}
 */

export const listShopOrder = (query?: ShopOrderQuery): AxiosPromise<ShopOrderVO[]> => {
  return request({
    url: '/mes/shopOrder/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工单档案详细
 * @param id
 */
export const getShopOrder = (id: string | number): AxiosPromise<ShopOrderVO> => {
  return request({
    url: '/mes/shopOrder/' + id,
    method: 'get'
  });
};

/**
 * 新增工单档案
 * @param data
 */
export const addShopOrder = (data: ShopOrderForm) => {
  return request({
    url: '/mes/shopOrder',
    method: 'post',
    data: data
  });
};

/**
 * 修改工单档案
 * @param data
 */
export const updateShopOrder = (data: ShopOrderForm) => {
  return request({
    url: '/mes/shopOrder',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单档案
 * @param id
 */
export const delShopOrder = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/shopOrder/' + id,
    method: 'delete'
  });
};
