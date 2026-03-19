import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { SalesOrderVO, SalesOrderForm, SalesOrderQuery } from '@/api/wms/salesOrder/types';

/**
 * 查询销售订单列表
 * @param query
 * @returns {*}
 */

export const listSalesOrder = (query?: SalesOrderQuery): AxiosPromise<SalesOrderVO[]> => {
  return request({
    url: '/wms/salesOrder/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询销售订单详细
 * @param id
 */
export const getSalesOrder = (id: string | number): AxiosPromise<SalesOrderVO> => {
  return request({
    url: '/wms/salesOrder/' + id,
    method: 'get'
  });
};

/**
 * 新增销售订单
 * @param data
 */
export const addSalesOrder = (data: SalesOrderForm) => {
  return request({
    url: '/wms/salesOrder',
    method: 'post',
    data: data
  });
};

/**
 * 修改销售订单
 * @param data
 */
export const updateSalesOrder = (data: SalesOrderForm) => {
  return request({
    url: '/wms/salesOrder',
    method: 'put',
    data: data
  });
};

/**
 * 删除销售订单
 * @param id
 */
export const delSalesOrder = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/salesOrder/' + id,
    method: 'delete'
  });
};
