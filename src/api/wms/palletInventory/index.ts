import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PalletInventoryVO, PalletInventoryForm, PalletInventoryQuery } from '@/api/wms/palletInventory/types';

/**
 * 查询栈板库存明细列表
 * @param query
 * @returns {*}
 */

export const listPalletInventory = (query?: PalletInventoryQuery): AxiosPromise<PalletInventoryVO[]> => {
  return request({
    url: '/wms/palletInventory/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询栈板库存明细详细
 * @param id
 */
export const getPalletInventory = (id: string | number): AxiosPromise<PalletInventoryVO> => {
  return request({
    url: '/wms/palletInventory/' + id,
    method: 'get'
  });
};

/**
 * 新增栈板库存明细
 * @param data
 */
export const addPalletInventory = (data: PalletInventoryForm) => {
  return request({
    url: '/wms/palletInventory',
    method: 'post',
    data: data
  });
};

/**
 * 修改栈板库存明细
 * @param data
 */
export const updatePalletInventory = (data: PalletInventoryForm) => {
  return request({
    url: '/wms/palletInventory',
    method: 'put',
    data: data
  });
};

/**
 * 删除栈板库存明细
 * @param id
 */
export const delPalletInventory = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/palletInventory/' + id,
    method: 'delete'
  });
};
