import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ItemVO, ItemForm, ItemQuery } from '@/api/wms/item/types';

/**
 * 查询物料列表
 * @param query
 * @returns {*}
 */

export const listItem = (query?: ItemQuery): AxiosPromise<ItemVO[]> => {
  return request({
    url: '/wms/item/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询物料详细
 * @param id
 */
export const getItem = (id: string | number): AxiosPromise<ItemVO> => {
  return request({
    url: '/wms/item/' + id,
    method: 'get'
  });
};

/**
 * 新增物料
 * @param data
 */
export const addItem = (data: ItemForm) => {
  return request({
    url: '/wms/item',
    method: 'post',
    data: data
  });
};

/**
 * 修改物料
 * @param data
 */
export const updateItem = (data: ItemForm) => {
  return request({
    url: '/wms/item',
    method: 'put',
    data: data
  });
};

/**
 * 删除物料
 * @param id
 */
export const delItem = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/item/' + id,
    method: 'delete'
  });
};
