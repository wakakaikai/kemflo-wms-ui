import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { StorageLocationVO, StorageLocationForm, StorageLocationQuery } from '@/api/wms/storageLocation/types';

/**
 * 查询库位列表
 * @param query
 * @returns {*}
 */

export const listStorageLocation = (query?: StorageLocationQuery): AxiosPromise<StorageLocationVO[]> => {
  return request({
    url: '/wms/storageLocation/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询库位详细
 * @param id
 */
export const getStorageLocation = (id: string | number): AxiosPromise<StorageLocationVO> => {
  return request({
    url: '/wms/storageLocation/' + id,
    method: 'get'
  });
};

/**
 * 新增库位
 * @param data
 */
export const addStorageLocation = (data: StorageLocationForm) => {
  return request({
    url: '/wms/storageLocation',
    method: 'post',
    data: data
  });
};

/**
 * 修改库位
 * @param data
 */
export const updateStorageLocation = (data: StorageLocationForm) => {
  return request({
    url: '/wms/storageLocation',
    method: 'put',
    data: data
  });
};

/**
 * 删除库位
 * @param id
 */
export const delStorageLocation = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/storageLocation/' + id,
    method: 'delete'
  });
};

/**
 * 通过库位码查询仓位信息
 * @param query
 * @returns {*}
 */
export const getWarehouseByLocationCode = (query?: any): AxiosPromise<StorageLocationVO[]> => {
  return request({
    url: '/wms/storageLocation/getWarehouseByLocationCode',
    method: 'get',
    params: query
  });
};

/**
 * 通过库位码查询仓位信息
 * @param query
 * @returns {*}
 */
export const getStorageLocationPage = (query?: any): AxiosPromise<StorageLocationVO[]> => {
  return request({
    url: '/wms/storageLocation/getStorageLocationPage',
    method: 'get',
    params: query
  });
};
