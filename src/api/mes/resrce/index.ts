import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ResrceVO, ResrceForm, ResrceQuery } from '@/api/mes/resrce/types';

/**
 * 查询资源列表
 * @param query
 * @returns {*}
 */

export const listResrce = (query?: ResrceQuery): AxiosPromise<ResrceVO[]> => {
  return request({
    url: '/mes/resrce/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询资源详细
 * @param id
 */
export const getResrce = (id: string | number): AxiosPromise<ResrceVO> => {
  return request({
    url: '/mes/resrce/' + id,
    method: 'get'
  });
};

/**
 * 新增资源
 * @param data
 */
export const addResrce = (data: ResrceForm) => {
  return request({
    url: '/mes/resrce',
    method: 'post',
    data: data
  });
};

/**
 * 修改资源
 * @param data
 */
export const updateResrce = (data: ResrceForm) => {
  return request({
    url: '/mes/resrce',
    method: 'put',
    data: data
  });
};

/**
 * 删除资源
 * @param id
 */
export const delResrce = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/resrce/' + id,
    method: 'delete'
  });
};
