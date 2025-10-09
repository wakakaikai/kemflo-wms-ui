import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { InventoryVO, InventoryForm, InventoryQuery } from '@/api/wms/inventory/types';

/**
 * 查询库存记录列表
 * @param query
 * @returns {*}
 */

export const listInventory = (query?: InventoryQuery): AxiosPromise<InventoryVO[]> => {
  return request({
    url: '/wms/inventory/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询库存记录详细
 * @param id
 */
export const getInventory = (id: string | number): AxiosPromise<InventoryVO> => {
  return request({
    url: '/wms/inventory/' + id,
    method: 'get'
  });
};

/**
 * 新增库存记录
 * @param data
 */
export const addInventory = (data: InventoryForm) => {
  return request({
    url: '/wms/inventory',
    method: 'post',
    data: data
  });
};

/**
 * 修改库存记录
 * @param data
 */
export const updateInventory = (data: InventoryForm) => {
  return request({
    url: '/wms/inventory',
    method: 'put',
    data: data
  });
};

/**
 * 删除库存记录
 * @param id
 */
export const delInventory = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/inventory/' + id,
    method: 'delete'
  });
};
