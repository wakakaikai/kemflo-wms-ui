import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ShopOrderReportVO, ShopOrderReportForm, ShopOrderReportQuery, ShopOrderReportEmployeeDurationQuery, ShopOrderReportEmployeeDurationSummaryVO, ShopOrderReportEmployeeDurationDetailVO, ShopOrderReportEmployeeDurationDuplicateVO, ShopOrderReportEmployeeDurationChartVO, ImmediateShopOrderQuery, ImmediateShopOrderVO, ImmediateOperationQuery, ImmediateOperationVO, ImmediateSfcQuery, ImmediateSfcVO } from '@/api/mes/shopOrderReport/types';

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
 * 查询生产实时报表工单列表
 */
export const listImmediateShopOrder = (data?: ImmediateShopOrderQuery): AxiosPromise<ImmediateShopOrderVO[]> => {
  return request({
    url: '/wms/report/immediate/shopOrder',
    method: 'post',
    params: {
      pageNum: data?.pageNum,
      pageSize: data?.pageSize
    },
    data
  });
};

/**
 * 查询生产实时报表工序列表
 */
export const listImmediateOperation = (data: ImmediateOperationQuery): AxiosPromise<ImmediateOperationVO[]> => {
  return request({
    url: '/wms/report/immediate/operation',
    method: 'post',
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize
    },
    data
  });
};

/**
 * 查询生产实时报表条码列表
 */
export const listImmediateSfc = (data: ImmediateSfcQuery): AxiosPromise<ImmediateSfcVO[]> => {
  return request({
    url: '/wms/report/immediate/sfc',
    method: 'post',
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize
    },
    data
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
    url: '/wms/report/employeeDuration/summary',
    method: 'post',
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize
    },
    data
  });
};

/**
 * 查询报工成功员工在线时长图表数据
 */
export const getEmployeeDurationChart = (data: ShopOrderReportEmployeeDurationQuery): AxiosPromise<ShopOrderReportEmployeeDurationChartVO> => {
  return request({
    url: '/wms/report/employeeDuration/chart',
    method: 'post',
    data
  });
};

/**
 * 查询报工成功员工上线明细
 */
export const listEmployeeDurationDetail = (data: ShopOrderReportEmployeeDurationQuery): AxiosPromise<ShopOrderReportEmployeeDurationDetailVO[]> => {
  return request({
    url: '/wms/report/employeeDuration/detail',
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
    url: '/wms/report/employeeDuration/duplicate',
    method: 'post',
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize
    },
    data
  });
};
