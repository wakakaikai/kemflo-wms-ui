import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { WarehouseVO, WarehouseForm, WarehouseQuery } from '@/api/wms/warehouse/types';

/**
 * 查询仓库列表
 * @param query
 * @returns {*}
 */

export const pageWarehouse = (query?: WarehouseQuery): AxiosPromise<WarehouseVO[]> => {
  return request({
    url: '/wms/warehouse/page',
    method: 'get',
    params: query
  });
};

/**
 * 查询仓位信息列表
 * @param query
 * @returns {*}
 */
export const listWarehouse = (query?: any): AxiosPromise<WarehouseVO[]> => {
  return request({
    url: '/wms/warehouse/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询仓库详细
 * @param id
 */
export const getWarehouse = (id: string | number): AxiosPromise<WarehouseVO> => {
  return request({
    url: '/wms/warehouse/' + id,
    method: 'get'
  });
};

/**
 * 新增仓库
 * @param data
 */
export const addWarehouse = (data: WarehouseForm) => {
  return request({
    url: '/wms/warehouse',
    method: 'post',
    data: data
  });
};

/**
 * 修改仓库
 * @param data
 */
export const updateWarehouse = (data: WarehouseForm) => {
  return request({
    url: '/wms/warehouse',
    method: 'put',
    data: data
  });
};

/**
 * 删除仓库
 * @param id
 */
export const delWarehouse = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/warehouse/' + id,
    method: 'delete'
  });
};
