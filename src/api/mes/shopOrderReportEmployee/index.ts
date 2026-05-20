import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ShopOrderReportEmployeeVO, ShopOrderReportEmployeeForm, ShopOrderReportEmployeeQuery } from '@/api/mes/shopOrderReportEmployee/types';

/**
 * 查询工单报工员工在线明细列表
 * @param query
 * @returns {*}
 */

export const listShopOrderReportEmployee = (query?: ShopOrderReportEmployeeQuery): AxiosPromise<ShopOrderReportEmployeeVO[]> => {
  return request({
    url: '/mes/shopOrderReportEmployee/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工单报工员工在线明细详细
 * @param id
 */
export const getShopOrderReportEmployee = (id: string | number): AxiosPromise<ShopOrderReportEmployeeVO> => {
  return request({
    url: '/mes/shopOrderReportEmployee/' + id,
    method: 'get'
  });
};

/**
 * 新增工单报工员工在线明细
 * @param data
 */
export const addShopOrderReportEmployee = (data: ShopOrderReportEmployeeForm) => {
  return request({
    url: '/mes/shopOrderReportEmployee',
    method: 'post',
    data: data
  });
};

/**
 * 修改工单报工员工在线明细
 * @param data
 */
export const updateShopOrderReportEmployee = (data: ShopOrderReportEmployeeForm) => {
  return request({
    url: '/mes/shopOrderReportEmployee',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单报工员工在线明细
 * @param id
 */
export const delShopOrderReportEmployee = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/shopOrderReportEmployee/' + id,
    method: 'delete'
  });
};
