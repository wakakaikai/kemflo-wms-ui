import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { StorageAreaVO, StorageAreaForm, StorageAreaQuery } from '@/api/wms/storageArea/types';

/**
 * 查询库区列表
 * @param query
 * @returns {*}
 */

export const listStorageArea = (query?: StorageAreaQuery): AxiosPromise<StorageAreaVO[]> => {
  return request({
    url: '/wms/storageArea/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询库区详细
 * @param id
 */
export const getStorageArea = (id: string | number): AxiosPromise<StorageAreaVO> => {
  return request({
    url: '/wms/storageArea/' + id,
    method: 'get'
  });
};

/**
 * 新增库区
 * @param data
 */
export const addStorageArea = (data: StorageAreaForm) => {
  return request({
    url: '/wms/storageArea',
    method: 'post',
    data: data
  });
};

/**
 * 修改库区
 * @param data
 */
export const updateStorageArea = (data: StorageAreaForm) => {
  return request({
    url: '/wms/storageArea',
    method: 'put',
    data: data
  });
};

/**
 * 删除库区
 * @param id
 */
export const delStorageArea = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/storageArea/' + id,
    method: 'delete'
  });
};
