import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ShopOrderSfcReprintAuthorizeHistoryVO, ShopOrderSfcReprintAuthorizeHistoryForm, ShopOrderSfcReprintAuthorizeHistoryQuery } from '@/api/mes/shopOrderSfcReprintAuthorizeHistory/types';

/**
 * 查询工单条码补打授权历史列表
 * @param query
 * @returns {*}
 */

export const listShopOrderSfcReprintAuthorizeHistory = (query?: ShopOrderSfcReprintAuthorizeHistoryQuery): AxiosPromise<ShopOrderSfcReprintAuthorizeHistoryVO[]> => {
  return request({
    url: '/mes/shopOrderSfcReprintAuthorizeHistory/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工单条码补打授权历史详细
 * @param id
 */
export const getShopOrderSfcReprintAuthorizeHistory = (id: string | number): AxiosPromise<ShopOrderSfcReprintAuthorizeHistoryVO> => {
  return request({
    url: '/mes/shopOrderSfcReprintAuthorizeHistory/' + id,
    method: 'get'
  });
};

/**
 * 新增工单条码补打授权历史
 * @param data
 */
export const addShopOrderSfcReprintAuthorizeHistory = (data: ShopOrderSfcReprintAuthorizeHistoryForm) => {
  return request({
    url: '/mes/shopOrderSfcReprintAuthorizeHistory',
    method: 'post',
    data: data
  });
};

/**
 * 修改工单条码补打授权历史
 * @param data
 */
export const updateShopOrderSfcReprintAuthorizeHistory = (data: ShopOrderSfcReprintAuthorizeHistoryForm) => {
  return request({
    url: '/mes/shopOrderSfcReprintAuthorizeHistory',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单条码补打授权历史
 * @param id
 */
export const delShopOrderSfcReprintAuthorizeHistory = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/shopOrderSfcReprintAuthorizeHistory/' + id,
    method: 'delete'
  });
};

/**
 * 新增工单条码补打印次数
 * @param data
 */
export const addPrintCount = (data: any) => {
  return request({
    url: '/mes/shopOrderSfcReprintAuthorizeHistory/addPrintCount',
    method: 'post',
    data: data
  });
};
