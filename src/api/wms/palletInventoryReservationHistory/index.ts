import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PalletInventoryReservationHistoryVO, PalletInventoryReservationHistoryForm, PalletInventoryReservationHistoryQuery } from '@/api/wms/palletInventoryReservationHistory/types';

/**
 * 查询栈板库存预约记录列表
 * @param query
 * @returns {*}
 */

export const listPalletInventoryReservationHistory = (query?: PalletInventoryReservationHistoryQuery): AxiosPromise<PalletInventoryReservationHistoryVO[]> => {
  return request({
    url: '/wms/palletInventoryReservationHistory/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询栈板库存预约记录详细
 * @param id
 */
export const getPalletInventoryReservationHistory = (id: string | number): AxiosPromise<PalletInventoryReservationHistoryVO> => {
  return request({
    url: '/wms/palletInventoryReservationHistory/' + id,
    method: 'get'
  });
};

/**
 * 新增栈板库存预约记录
 * @param data
 */
export const addPalletInventoryReservationHistory = (data: PalletInventoryReservationHistoryForm) => {
  return request({
    url: '/wms/palletInventoryReservationHistory',
    method: 'post',
    data: data
  });
};

/**
 * 修改栈板库存预约记录
 * @param data
 */
export const updatePalletInventoryReservationHistory = (data: PalletInventoryReservationHistoryForm) => {
  return request({
    url: '/wms/palletInventoryReservationHistory',
    method: 'put',
    data: data
  });
};

/**
 * 删除栈板库存预约记录
 * @param id
 */
export const delPalletInventoryReservationHistory = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/palletInventoryReservationHistory/' + id,
    method: 'delete'
  });
};

/**
 * 新增栈板库存预约记录
 * @param data
 */
export const addBatchPalletInventoryReservationHistory = (data: any) => {
  return request({
    url: '/wms/palletInventoryReservationHistory/addBatch',
    method: 'post',
    data: data
  });
};

/**
 * 新增栈板库存预约记录
 * @param data
 */
export const confirmReceiptPalletInventoryReservationHistory = (data: any) => {
  return request({
    url: '/wms/palletInventoryReservationHistory/confirmReceipt',
    method: 'post',
    data: data
  });
};

