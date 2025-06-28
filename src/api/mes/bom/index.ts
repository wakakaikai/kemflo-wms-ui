import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { BomVO, BomForm, BomQuery } from '@/api/mes/bom/types';

/**
 * 查询物料清单列表
 * @param query
 * @returns {*}
 */

export const listBom = (query?: BomQuery): AxiosPromise<BomVO[]> => {
  return request({
    url: '/mes/bom/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询物料清单详细
 * @param id
 */
export const getBom = (id: string | number): AxiosPromise<BomVO> => {
  return request({
    url: '/mes/bom/' + id,
    method: 'get'
  });
};

/**
 * 新增物料清单
 * @param data
 */
export const addBom = (data: BomForm) => {
  return request({
    url: '/mes/bom',
    method: 'post',
    data: data
  });
};

/**
 * 修改物料清单
 * @param data
 */
export const updateBom = (data: BomForm) => {
  return request({
    url: '/mes/bom',
    method: 'put',
    data: data
  });
};

/**
 * 删除物料清单
 * @param id
 */
export const delBom = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/bom/' + id,
    method: 'delete'
  });
};
