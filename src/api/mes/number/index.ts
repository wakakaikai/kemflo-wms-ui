import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { NumberVO, NumberForm, NumberQuery, NumberDetailForm, NumberDetailVO, NumberObjectOption } from '@/api/mes/number/types';

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

export const getNumberDetail = (id: string | number): AxiosPromise<NumberDetailVO> => {
  return request({
    url: '/mes/number/' + id,
    method: 'get'
  });
};

export const listNumberObject = (query: { definedBy?: string; keyword?: string }): AxiosPromise<NumberObjectOption[]> => {
  return request({
    url: '/mes/number/object/list',
    method: 'get',
    params: query
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

export const addNumberDetail = (data: NumberDetailForm) => {
  return request({
    url: '/mes/number',
    method: 'post',
    data
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

export const updateNumberDetail = (data: NumberDetailForm) => {
  return request({
    url: '/mes/number',
    method: 'put',
    data
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
