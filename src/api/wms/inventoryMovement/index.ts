import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { InventoryMovementVO, InventoryMovementForm, InventoryMovementQuery } from '@/api/wms/inventoryMovement/types';

/**
 * 查询库存移动记录列表
 * @param query
 * @returns {*}
 */

export const listInventoryMovement = (query?: InventoryMovementQuery): AxiosPromise<InventoryMovementVO[]> => {
  return request({
    url: '/wms/inventoryMovement/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询库存移动记录详细
 * @param id
 */
export const getInventoryMovement = (id: string | number): AxiosPromise<InventoryMovementVO> => {
  return request({
    url: '/wms/inventoryMovement/' + id,
    method: 'get'
  });
};

/**
 * 新增库存移动记录
 * @param data
 */
export const addInventoryMovement = (data: InventoryMovementForm) => {
  return request({
    url: '/wms/inventoryMovement',
    method: 'post',
    data: data
  });
};

/**
 * 修改库存移动记录
 * @param data
 */
export const updateInventoryMovement = (data: InventoryMovementForm) => {
  return request({
    url: '/wms/inventoryMovement',
    method: 'put',
    data: data
  });
};

/**
 * 删除库存移动记录
 * @param id
 */
export const delInventoryMovement = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/inventoryMovement/' + id,
    method: 'delete'
  });
};
