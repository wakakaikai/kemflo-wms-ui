import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PalletVO, PalletForm, PalletQuery } from '@/api/wms/pallet/types';
/**
 * 查询栈板信息列表
 * @param query
 * @returns {*}
 */

export const pagePallet = (query?: PalletQuery): AxiosPromise<PalletVO[]> => {
  return request({
    url: '/wms/pallet/page',
    method: 'get',
    params: query
  });
};

/**
 * 查询栈板信息列表
 * @param query
 * @returns {*}
 */

export const pagePalletInventory = (query?: PalletQuery): AxiosPromise<PalletVO[]> => {
  return request({
    url: '/wms/pallet/inventory/page',
    method: 'get',
    params: query
  });
};
/**
 * 查询栈板信息列表
 * @param query
 * @returns {*}
 */

export const listPallet = (query?: PalletQuery): AxiosPromise<PalletVO[]> => {
  return request({
    url: '/wms/pallet/list',
    method: 'get',
    params: query
  });
};

export const listPalletInventory = (query?: PalletQuery): AxiosPromise<PalletVO[]> => {
  return request({
    url: '/wms/pallet/inventory/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询栈板信息详细
 * @param id
 */
export const getPallet = (id: string | number): AxiosPromise<PalletVO> => {
  return request({
    url: '/wms/pallet/' + id,
    method: 'get'
  });
};

/**
 * 新增栈板信息
 * @param data
 */
export const addPallet = (data: PalletForm) => {
  return request({
    url: '/wms/pallet',
    method: 'post',
    data: data
  });
};

/**
 * 修改栈板信息
 * @param data
 */
export const updatePallet = (data: PalletForm) => {
  return request({
    url: '/wms/pallet',
    method: 'put',
    data: data
  });
};

/**
 * 删除栈板信息
 * @param id
 */
export const delPallet = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/pallet/' + id,
    method: 'delete'
  });
};

/**
 * 清空栈板信息
 * @param id
 */
export const emptyPallet = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/pallet/empty/' + id,
    method: 'put'
  });
};

