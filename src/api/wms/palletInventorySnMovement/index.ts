import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PalletInventorySnMovementVO, PalletInventorySnMovementForm, PalletInventorySnMovementQuery } from '@/api/wms/palletInventorySnMovement/types';

/**
 * 查询栈板SN库存移动记录列表
 * @param query
 * @returns {*}
 */

export const listPalletInventorySnMovement = (query?: PalletInventorySnMovementQuery): AxiosPromise<PalletInventorySnMovementVO[]> => {
  return request({
    url: '/wms/palletInventorySnMovement/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询栈板SN库存移动记录详细
 * @param id
 */
export const getPalletInventorySnMovement = (id: string | number): AxiosPromise<PalletInventorySnMovementVO> => {
  return request({
    url: '/wms/palletInventorySnMovement/' + id,
    method: 'get'
  });
};

/**
 * 新增栈板SN库存移动记录
 * @param data
 */
export const addPalletInventorySnMovement = (data: PalletInventorySnMovementForm) => {
  return request({
    url: '/wms/palletInventorySnMovement',
    method: 'post',
    data: data
  });
};

/**
 * 修改栈板SN库存移动记录
 * @param data
 */
export const updatePalletInventorySnMovement = (data: PalletInventorySnMovementForm) => {
  return request({
    url: '/wms/palletInventorySnMovement',
    method: 'put',
    data: data
  });
};

/**
 * 删除栈板SN库存移动记录
 * @param id
 */
export const delPalletInventorySnMovement = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/palletInventorySnMovement/' + id,
    method: 'delete'
  });
};
