import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ShopOrderReportAbnormalTimeVO, ShopOrderReportAbnormalTimeForm, ShopOrderReportAbnormalTimeQuery } from '@/api/mes/shopOrderReportAbnormalTime/types';

/**
 * 查询工单报工异常时间明细列表
 * @param query
 * @returns {*}
 */

export const listShopOrderReportAbnormalTime = (query?: ShopOrderReportAbnormalTimeQuery): AxiosPromise<ShopOrderReportAbnormalTimeVO[]> => {
  return request({
    url: '/mes/shopOrderReportAbnormalTime/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工单报工异常时间明细详细
 * @param id
 */
export const getShopOrderReportAbnormalTime = (id: string | number): AxiosPromise<ShopOrderReportAbnormalTimeVO> => {
  return request({
    url: '/mes/shopOrderReportAbnormalTime/' + id,
    method: 'get'
  });
};

/**
 * 新增工单报工异常时间明细
 * @param data
 */
export const addShopOrderReportAbnormalTime = (data: ShopOrderReportAbnormalTimeForm) => {
  return request({
    url: '/mes/shopOrderReportAbnormalTime',
    method: 'post',
    data: data
  });
};

/**
 * 修改工单报工异常时间明细
 * @param data
 */
export const updateShopOrderReportAbnormalTime = (data: ShopOrderReportAbnormalTimeForm) => {
  return request({
    url: '/mes/shopOrderReportAbnormalTime',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单报工异常时间明细
 * @param id
 */
export const delShopOrderReportAbnormalTime = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/shopOrderReportAbnormalTime/' + id,
    method: 'delete'
  });
};
