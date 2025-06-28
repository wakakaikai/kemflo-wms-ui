import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { AttachedVO, AttachedForm, AttachedQuery } from '@/api/mes/attached/types';

/**
 * 查询附加项明细列表
 * @param query
 * @returns {*}
 */

export const listAttached = (query?: AttachedQuery): AxiosPromise<AttachedVO[]> => {
  return request({
    url: '/mes/attached/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询附加项明细详细
 * @param id
 */
export const getAttached = (id: string | number): AxiosPromise<AttachedVO> => {
  return request({
    url: '/mes/attached/' + id,
    method: 'get'
  });
};

/**
 * 新增附加项明细
 * @param data
 */
export const addAttached = (data: AttachedForm) => {
  return request({
    url: '/mes/attached',
    method: 'post',
    data: data
  });
};

/**
 * 修改附加项明细
 * @param data
 */
export const updateAttached = (data: AttachedForm) => {
  return request({
    url: '/mes/attached',
    method: 'put',
    data: data
  });
};

/**
 * 删除附加项明细
 * @param id
 */
export const delAttached = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/attached/' + id,
    method: 'delete'
  });
};
