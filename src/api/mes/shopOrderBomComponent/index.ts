import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ShopOrderBomComponentVO, ShopOrderBomComponentForm, ShopOrderBomComponentQuery } from '@/api/mes/shopOrderBomComponent/types';

/**
 * 查询工单BOM组件列表
 * @param query
 * @returns {*}
 */

export const listShopOrderBomComponent = (query?: ShopOrderBomComponentQuery): AxiosPromise<ShopOrderBomComponentVO[]> => {
  return request({
    url: '/mes/shopOrderBomComponent/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工单BOM组件详细
 * @param id
 */
export const getShopOrderBomComponent = (id: string | number): AxiosPromise<ShopOrderBomComponentVO> => {
  return request({
    url: '/mes/shopOrderBomComponent/' + id,
    method: 'get'
  });
};

/**
 * 新增工单BOM组件
 * @param data
 */
export const addShopOrderBomComponent = (data: ShopOrderBomComponentForm) => {
  return request({
    url: '/mes/shopOrderBomComponent',
    method: 'post',
    data: data
  });
};

/**
 * 修改工单BOM组件
 * @param data
 */
export const updateShopOrderBomComponent = (data: ShopOrderBomComponentForm) => {
  return request({
    url: '/mes/shopOrderBomComponent',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单BOM组件
 * @param id
 */
export const delShopOrderBomComponent = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/shopOrderBomComponent/' + id,
    method: 'delete'
  });
};

/**
 * 批量新增工单BOM组件
 * @param data
 */
export const addBatchShopOrderBomComponent = (data: any) => {
  return request({
    url: '/mes/shopOrderBomComponent/batch',
    method: 'post',
    data: data
  });
};
