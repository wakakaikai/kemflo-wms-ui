import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ItemBomComponentVO, ItemBomComponentForm, ItemBomComponentQuery } from '@/api/mes/itemBomComponent/types';

/**
 * 查询物料BOM组件列表
 * @param query
 * @returns {*}
 */

export const listItemBomComponent = (query?: ItemBomComponentQuery): AxiosPromise<ItemBomComponentVO[]> => {
  return request({
    url: '/mes/itemBomComponent/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询物料BOM组件详细
 * @param id
 */
export const getItemBomComponent = (id: string | number): AxiosPromise<ItemBomComponentVO> => {
  return request({
    url: '/mes/itemBomComponent/' + id,
    method: 'get'
  });
};

/**
 * 新增物料BOM组件
 * @param data
 */
export const addItemBomComponent = (data: ItemBomComponentForm) => {
  return request({
    url: '/mes/itemBomComponent',
    method: 'post',
    data: data
  });
};

/**
 * 批量新增物料BOM组件
 * @param data
 */
export const addBatchItemBomComponent = (data: any) => {
  return request({
    url: '/mes/itemBomComponent/batch',
    method: 'post',
    data: data
  });
};

/**
 * 修改物料BOM组件
 * @param data
 */
export const updateItemBomComponent = (data: ItemBomComponentForm) => {
  return request({
    url: '/mes/itemBomComponent',
    method: 'put',
    data: data
  });
};

/**
 * 删除物料BOM组件
 * @param id
 */
export const delItemBomComponent = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/itemBomComponent/' + id,
    method: 'delete'
  });
};
