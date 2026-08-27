import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ShopOrderReportVO, ShopOrderReportForm, ShopOrderReportQuery, ShopOrderReportEmployeeDurationQuery, ShopOrderReportEmployeeDurationSummaryVO, ShopOrderReportEmployeeDurationDetailVO, ShopOrderReportEmployeeDurationDuplicateVO } from '@/api/mes/shopOrderReport/types';

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

/**
 * 查询报工成功员工上线每日汇总
 */
export const listEmployeeDurationSummary = (data: ShopOrderReportEmployeeDurationQuery): AxiosPromise<ShopOrderReportEmployeeDurationSummaryVO[]> => {
  return request({
    url: '/mes/shopOrderReport/employeeDuration/summary',
    method: 'post',
    data
  });
};

/**
 * 查询报工成功员工上线明细
 */
export const listEmployeeDurationDetail = (data: ShopOrderReportEmployeeDurationQuery): AxiosPromise<ShopOrderReportEmployeeDurationDetailVO[]> => {
  return request({
    url: '/mes/shopOrderReport/employeeDuration/detail',
    method: 'post',
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize
    },
    data
  });
};

/**
 * 查询报工成功员工每日重复上线统计
 */
export const listEmployeeDurationDuplicate = (data: ShopOrderReportEmployeeDurationQuery): AxiosPromise<ShopOrderReportEmployeeDurationDuplicateVO[]> => {
  return request({
    url: '/mes/shopOrderReport/employeeDuration/duplicate',
    method: 'post',
    data
  });
};
