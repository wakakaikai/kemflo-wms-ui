import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PalletInventoryMovementVO, PalletInventoryMovementForm, PalletInventoryMovementQuery } from '@/api/wms/palletInventoryMovement/types';

/**
 * 查询栈板库存移动记录列表
 * @param query
 * @returns {*}
 */

export const listPalletInventoryMovement = (query?: PalletInventoryMovementQuery): AxiosPromise<PalletInventoryMovementVO[]> => {
  return request({
    url: '/wms/palletInventoryMovement/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询栈板库存移动记录详细
 * @param id
 */
export const getPalletInventoryMovement = (id: string | number): AxiosPromise<PalletInventoryMovementVO> => {
  return request({
    url: '/wms/palletInventoryMovement/' + id,
    method: 'get'
  });
};

/**
 * 新增栈板库存移动记录
 * @param data
 */
export const addPalletInventoryMovement = (data: PalletInventoryMovementForm) => {
  return request({
    url: '/wms/palletInventoryMovement',
    method: 'post',
    data: data
  });
};

/**
 * 修改栈板库存移动记录
 * @param data
 */
export const updatePalletInventoryMovement = (data: PalletInventoryMovementForm) => {
  return request({
    url: '/wms/palletInventoryMovement',
    method: 'put',
    data: data
  });
};

/**
 * 删除栈板库存移动记录
 * @param id
 */
export const delPalletInventoryMovement = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/palletInventoryMovement/' + id,
    method: 'delete'
  });
};
