import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { SalesOrderDetailVO, SalesOrderDetailForm, SalesOrderDetailQuery } from '@/api/wms/salesOrderDetail/types';

/**
 * 查询销售订单明细列表
 * @param query
 * @returns {*}
 */

export const listSalesOrderDetail = (query?: SalesOrderDetailQuery): AxiosPromise<SalesOrderDetailVO[]> => {
  return request({
    url: '/wms/salesOrderDetail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询销售订单明细详细
 * @param id
 */
export const getSalesOrderDetail = (id: string | number): AxiosPromise<SalesOrderDetailVO> => {
  return request({
    url: '/wms/salesOrderDetail/' + id,
    method: 'get'
  });
};

/**
 * 新增销售订单明细
 * @param data
 */
export const addSalesOrderDetail = (data: SalesOrderDetailForm) => {
  return request({
    url: '/wms/salesOrderDetail',
    method: 'post',
    data: data
  });
};

/**
 * 修改销售订单明细
 * @param data
 */
export const updateSalesOrderDetail = (data: SalesOrderDetailForm) => {
  return request({
    url: '/wms/salesOrderDetail',
    method: 'put',
    data: data
  });
};

/**
 * 删除销售订单明细
 * @param id
 */
export const delSalesOrderDetail = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/salesOrderDetail/' + id,
    method: 'delete'
  });
};
