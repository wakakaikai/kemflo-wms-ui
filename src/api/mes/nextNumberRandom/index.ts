import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { NextNumberRandomVO, NextNumberRandomForm, NextNumberRandomQuery } from '@/api/mes/nextNumberRandom/types';

/**
 * 查询编号规则随机数列表
 * @param query
 * @returns {*}
 */

export const listNextNumberRandom = (query?: NextNumberRandomQuery): AxiosPromise<NextNumberRandomVO[]> => {
  return request({
    url: '/mes/nextNumberRandom/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询编号规则随机数详细
 * @param id
 */
export const getNextNumberRandom = (id: string | number): AxiosPromise<NextNumberRandomVO> => {
  return request({
    url: '/mes/nextNumberRandom/' + id,
    method: 'get'
  });
};

/**
 * 新增编号规则随机数
 * @param data
 */
export const addNextNumberRandom = (data: NextNumberRandomForm) => {
  return request({
    url: '/mes/nextNumberRandom',
    method: 'post',
    data: data
  });
};

/**
 * 修改编号规则随机数
 * @param data
 */
export const updateNextNumberRandom = (data: NextNumberRandomForm) => {
  return request({
    url: '/mes/nextNumberRandom',
    method: 'put',
    data: data
  });
};

/**
 * 删除编号规则随机数
 * @param id
 */
export const delNextNumberRandom = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/nextNumberRandom/' + id,
    method: 'delete'
  });
};
