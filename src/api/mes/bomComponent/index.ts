import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { BomComponentVO, BomComponentForm, BomComponentQuery } from '@/api/mes/bomComponent/types';

/**
 * 查询物料清单组件列表
 * @param query
 * @returns {*}
 */

export const listBomComponent = (query?: BomComponentQuery): AxiosPromise<BomComponentVO[]> => {
  return request({
    url: '/mes/bomComponent/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询物料清单组件详细
 * @param id
 */
export const getBomComponent = (id: string | number): AxiosPromise<BomComponentVO> => {
  return request({
    url: '/mes/bomComponent/' + id,
    method: 'get'
  });
};

/**
 * 新增物料清单组件
 * @param data
 */
export const addBomComponent = (data: BomComponentForm) => {
  return request({
    url: '/mes/bomComponent',
    method: 'post',
    data: data
  });
};

/**
 * 修改物料清单组件
 * @param data
 */
export const updateBomComponent = (data: BomComponentForm) => {
  return request({
    url: '/mes/bomComponent',
    method: 'put',
    data: data
  });
};

/**
 * 删除物料清单组件
 * @param id
 */
export const delBomComponent = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/bomComponent/' + id,
    method: 'delete'
  });
};
