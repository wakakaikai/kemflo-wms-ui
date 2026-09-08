import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PurchaseOrderVO, PurchaseOrderForm, PurchaseOrderQuery, PurchaseOrderReturnBatchForm } from '@/api/wms/purchaseOrder/types';

/**
 * 查询采购订单列表
 * @param query
 * @returns {*}
 */

export const listPurchaseOrder = (query?: PurchaseOrderQuery): AxiosPromise<PurchaseOrderVO[]> => {
  return request({
    url: '/wms/purchaseOrder/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询采购订单详细
 * @param id
 */
export const getPurchaseOrder = (id: string | number): AxiosPromise<PurchaseOrderVO> => {
  return request({
    url: '/wms/purchaseOrder/' + id,
    method: 'get'
  });
};

/**
 * 新增采购订单
 * @param data
 */
export const addPurchaseOrder = (data: PurchaseOrderForm) => {
  return request({
    url: '/wms/purchaseOrder',
    method: 'post',
    data: data
  });
};

/**
 * 修改采购订单
 * @param data
 */
export const updatePurchaseOrder = (data: PurchaseOrderForm) => {
  return request({
    url: '/wms/purchaseOrder',
    method: 'put',
    data: data
  });
};

/**
 * 删除采购订单
 * @param id
 */
export const delPurchaseOrder = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/purchaseOrder/' + id,
    method: 'delete'
  });
};

/** 采购入库 */
export function addPurchaseInbound(data: any) {
  return request({
    url: '/wms/purchaseOrder/inbound',
    method: 'post',
    data: data
  });
}

/** 采购件退货 */
export const returnPurchaseInventory = (data: PurchaseOrderReturnBatchForm) => {
  return request({
    url: '/wms/purchaseOrder/return',
    method: 'post',
    data: data
  });
};

/** 委外发料（541） */
export const subcontractIssue = (data: any) => {
  return request({
    url: '/wms/purchaseOrder/subcontractIssue',
    method: 'post',
    data: data
  });
};
