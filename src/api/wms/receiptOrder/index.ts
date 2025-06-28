import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ReceiptOrderVO, ReceiptOrderForm, ReceiptOrderQuery } from '@/api/wms/receiptOrder/types';

/**
 * 查询入库单列表
 * @param query
 * @returns {*}
 */

export const listReceiptOrder = (query?: ReceiptOrderQuery): AxiosPromise<ReceiptOrderVO[]> => {
  return request({
    url: '/wms/receiptOrder/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询入库单详细
 * @param id
 */
export const getReceiptOrder = (id: string | number): AxiosPromise<ReceiptOrderVO> => {
  return request({
    url: '/wms/receiptOrder/' + id,
    method: 'get'
  });
};

/**
 * 新增入库单
 * @param data
 */
export const addReceiptOrder = (data: ReceiptOrderForm) => {
  return request({
    url: '/wms/receiptOrder',
    method: 'post',
    data: data
  });
};

/**
 * 修改入库单
 * @param data
 */
export const updateReceiptOrder = (data: ReceiptOrderForm) => {
  return request({
    url: '/wms/receiptOrder',
    method: 'put',
    data: data
  });
};

/**
 * 删除入库单
 * @param id
 */
export const delReceiptOrder = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/receiptOrder/' + id,
    method: 'delete'
  });
};
