import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ShopOrderReportVO, ShopOrderReportForm, ShopOrderReportQuery } from '@/api/mes/shopOrderReport/types';

/**
 * 查询工单开工完工-APP列表
 * @param query
 * @returns {*}
 */

export const listShopOrderReport = (query?: ShopOrderReportQuery): AxiosPromise<ShopOrderReportVO[]> => {
  return request({
    url: '/mes/shopOrderReport/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工单开工完工-APP详细
 * @param id
 */
export const getShopOrderReport = (id: string | number): AxiosPromise<ShopOrderReportVO> => {
  return request({
    url: '/mes/shopOrderReport/' + id,
    method: 'get'
  });
};

/**
 * 新增工单开工完工-APP
 * @param data
 */
export const addShopOrderReport = (data: ShopOrderReportForm) => {
  return request({
    url: '/mes/shopOrderReport',
    method: 'post',
    data: data
  });
};

/**
 * 修改工单开工完工-APP
 * @param data
 */
export const updateShopOrderReport = (data: ShopOrderReportForm) => {
  return request({
    url: '/mes/shopOrderReport',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单开工完工-APP
 * @param id
 */
export const delShopOrderReport = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/shopOrderReport/' + id,
    method: 'delete'
  });
};
