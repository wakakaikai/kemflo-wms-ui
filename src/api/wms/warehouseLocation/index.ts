import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { WarehouseLocationVO, WarehouseLocationForm, WarehouseLocationQuery } from '@/api/wms/warehouseLocation/types';
/**
 * 查询仓位信息列表
 * @param query
 * @returns {*}
 */

export const pageWarehouseLocation = (query?: WarehouseLocationQuery): AxiosPromise<WarehouseLocationVO[]> => {
  return request({
    url: '/wms/warehouseLocation/page',
    method: 'get',
    params: query
  });
};


/**
 * 查询仓位信息详细
 * @param id
 */
export const getWarehouseLocation = (id: string | number): AxiosPromise<WarehouseLocationVO> => {
  return request({
    url: '/wms/warehouseLocation/' + id,
    method: 'get'
  });
};

/**
 * 新增仓位信息
 * @param data
 */
export const addWarehouseLocation = (data: WarehouseLocationForm) => {
  return request({
    url: '/wms/warehouseLocation',
    method: 'post',
    data: data
  });
};

/**
 * 修改仓位信息
 * @param data
 */
export const updateWarehouseLocation = (data: WarehouseLocationForm) => {
  return request({
    url: '/wms/warehouseLocation',
    method: 'put',
    data: data
  });
};

/**
 * 删除仓位信息
 * @param id
 */
export const delWarehouseLocation = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/warehouseLocation/' + id,
    method: 'delete'
  });
};
