import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PurchaseOrderDetailVO, PurchaseOrderDetailForm, PurchaseOrderDetailQuery } from '@/api/wms/purchaseOrderDetail/types';

/**
 * 查询采购订单明细列表
 * @param query
 * @returns {*}
 */

export const listPurchaseOrderDetail = (query?: PurchaseOrderDetailQuery): AxiosPromise<PurchaseOrderDetailVO[]> => {
  return request({
    url: '/wms/purchaseOrderDetail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询采购订单明细详细
 * @param id
 */
export const getPurchaseOrderDetail = (id: string | number): AxiosPromise<PurchaseOrderDetailVO> => {
  return request({
    url: '/wms/purchaseOrderDetail/' + id,
    method: 'get'
  });
};

/**
 * 新增采购订单明细
 * @param data
 */
export const addPurchaseOrderDetail = (data: PurchaseOrderDetailForm) => {
  return request({
    url: '/wms/purchaseOrderDetail',
    method: 'post',
    data: data
  });
};

/**
 * 修改采购订单明细
 * @param data
 */
export const updatePurchaseOrderDetail = (data: PurchaseOrderDetailForm) => {
  return request({
    url: '/wms/purchaseOrderDetail',
    method: 'put',
    data: data
  });
};

/**
 * 删除采购订单明细
 * @param id
 */
export const delPurchaseOrderDetail = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/purchaseOrderDetail/' + id,
    method: 'delete'
  });
};


// 新增采购入库
export function addPurchaseInbound(data: any) {
  return request({
    url: '/wms/purchaseOrderDetail/inbound',
    method: 'post',
    data: data
  });
}
