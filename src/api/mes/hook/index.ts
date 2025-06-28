import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { HookVO, HookForm, HookQuery } from '@/api/mes/hook/types';

/**
 * 查询Hook关联列表
 * @param query
 * @returns {*}
 */

export const listHook = (query?: HookQuery): AxiosPromise<HookVO[]> => {
  return request({
    url: '/mes/hook/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询Hook关联详细
 * @param id
 */
export const getHook = (id: string | number): AxiosPromise<HookVO> => {
  return request({
    url: '/mes/hook/' + id,
    method: 'get'
  });
};

/**
 * 新增Hook关联
 * @param data
 */
export const addHook = (data: HookForm) => {
  return request({
    url: '/mes/hook',
    method: 'post',
    data: data
  });
};

/**
 * 修改Hook关联
 * @param data
 */
export const updateHook = (data: HookForm) => {
  return request({
    url: '/mes/hook',
    method: 'put',
    data: data
  });
};

/**
 * 删除Hook关联
 * @param id
 */
export const delHook = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/hook/' + id,
    method: 'delete'
  });
};
