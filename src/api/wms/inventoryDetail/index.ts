import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { InventoryDetailVO, InventoryDetailForm, InventoryDetailQuery } from '@/api/wms/inventoryDetail/types';

/**
 * 查询库存明细记录列表
 * @param query
 * @returns {*}
 */

export const listInventoryDetail = (query?: InventoryDetailQuery): AxiosPromise<InventoryDetailVO[]> => {
  return request({
    url: '/wms/inventoryDetail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询库存明细记录详细
 * @param id
 */
export const getInventoryDetail = (id: string | number): AxiosPromise<InventoryDetailVO> => {
  return request({
    url: '/wms/inventoryDetail/' + id,
    method: 'get'
  });
};

/**
 * 新增库存明细记录
 * @param data
 */
export const addInventoryDetail = (data: InventoryDetailForm) => {
  return request({
    url: '/wms/inventoryDetail',
    method: 'post',
    data: data
  });
};

/**
 * 盘亏库存明细记录
 * @param data
 */
export const subtractInventoryDetail = (data: InventoryDetailForm) => {
  return request({
    url: '/wms/inventoryDetail/subtract',
    method: 'put',
    data: data
  });
};

/**
 * 修改库存明细记录
 * @param data
 */
export const updateInventoryDetail = (data: InventoryDetailForm) => {
  return request({
    url: '/wms/inventoryDetail',
    method: 'put',
    data: data
  });
};

/**
 * 删除库存明细记录
 * @param id
 */
export const delInventoryDetail = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/inventoryDetail/' + id,
    method: 'delete'
  });
};

/**
 * 库存移转记录
 * @param data
 */
export const transferInventory = (data: any) => {
  return request({
    url: '/wms/inventoryDetail/transfer',
    method: 'post',
    data: data
  });
};
