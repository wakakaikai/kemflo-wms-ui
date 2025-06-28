import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ReceiptOrderDetailVO, ReceiptOrderDetailForm, ReceiptOrderDetailQuery } from '@/api/wms/receiptOrderDetail/types';

/**
 * 查询入库单详情列表
 * @param query
 * @returns {*}
 */

export const listReceiptOrderDetail = (query?: ReceiptOrderDetailQuery): AxiosPromise<ReceiptOrderDetailVO[]> => {
  return request({
    url: '/wms/receiptOrderDetail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询入库单详情详细
 * @param id
 */
export const getReceiptOrderDetail = (id: string | number): AxiosPromise<ReceiptOrderDetailVO> => {
  return request({
    url: '/wms/receiptOrderDetail/' + id,
    method: 'get'
  });
};

/**
 * 新增入库单详情
 * @param data
 */
export const addReceiptOrderDetail = (data: ReceiptOrderDetailForm) => {
  return request({
    url: '/wms/receiptOrderDetail',
    method: 'post',
    data: data
  });
};

/**
 * 修改入库单详情
 * @param data
 */
export const updateReceiptOrderDetail = (data: ReceiptOrderDetailForm) => {
  return request({
    url: '/wms/receiptOrderDetail',
    method: 'put',
    data: data
  });
};

/**
 * 删除入库单详情
 * @param id
 */
export const delReceiptOrderDetail = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/receiptOrderDetail/' + id,
    method: 'delete'
  });
};
