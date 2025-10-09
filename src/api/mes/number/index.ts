import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { NumberVO, NumberForm, NumberQuery } from '@/api/mes/number/types';

/**
 * 查询编号规则定义主表列表
 * @param query
 * @returns {*}
 */

export const listNumber = (query?: NumberQuery): AxiosPromise<NumberVO[]> => {
  return request({
    url: '/mes/number/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询编号规则定义主表详细
 * @param id
 */
export const getNumber = (id: string | number): AxiosPromise<NumberVO> => {
  return request({
    url: '/mes/number/' + id,
    method: 'get'
  });
};

/**
 * 新增编号规则定义主表
 * @param data
 */
export const addNumber = (data: NumberForm) => {
  return request({
    url: '/mes/number',
    method: 'post',
    data: data
  });
};

/**
 * 修改编号规则定义主表
 * @param data
 */
export const updateNumber = (data: NumberForm) => {
  return request({
    url: '/mes/number',
    method: 'put',
    data: data
  });
};

/**
 * 删除编号规则定义主表
 * @param id
 */
export const delNumber = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/number/' + id,
    method: 'delete'
  });
};
