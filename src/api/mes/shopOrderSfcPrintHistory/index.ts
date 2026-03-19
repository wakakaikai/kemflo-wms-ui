import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ShopOrderSfcPrintHistoryVO, ShopOrderSfcPrintHistoryForm, ShopOrderSfcPrintHistoryQuery } from '@/api/mes/shopOrderSfcPrintHistory/types';

/**
 * 查询工单条码打印历史列表
 * @param query
 * @returns {*}
 */

export const listShopOrderSfcPrintHistory = (query?: ShopOrderSfcPrintHistoryQuery): AxiosPromise<ShopOrderSfcPrintHistoryVO[]> => {
  return request({
    url: '/mes/shopOrderSfcPrintHistory/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工单条码打印历史详细
 * @param id
 */
export const getShopOrderSfcPrintHistory = (id: string | number): AxiosPromise<ShopOrderSfcPrintHistoryVO> => {
  return request({
    url: '/mes/shopOrderSfcPrintHistory/' + id,
    method: 'get'
  });
};

/**
 * 新增工单条码打印历史
 * @param data
 */
export const addShopOrderSfcPrintHistory = (data: ShopOrderSfcPrintHistoryForm) => {
  return request({
    url: '/mes/shopOrderSfcPrintHistory',
    method: 'post',
    data: data
  });
};

/**
 * 修改工单条码打印历史
 * @param data
 */
export const updateShopOrderSfcPrintHistory = (data: ShopOrderSfcPrintHistoryForm) => {
  return request({
    url: '/mes/shopOrderSfcPrintHistory',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单条码打印历史
 * @param id
 */
export const delShopOrderSfcPrintHistory = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/shopOrderSfcPrintHistory/' + id,
    method: 'delete'
  });
};

/**
 * 保存工单条码打印历史
 * @param data
 */
export const savePrintHistory = (data: any) => {
  return request({
    url: '/mes/shopOrderSfcPrintHistory/savePrintHistory',
    method: 'post',
    data: data
  });
};
