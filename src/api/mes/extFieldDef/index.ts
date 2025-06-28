import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ExtFieldDefVO, ExtFieldDefForm, ExtFieldDefQuery } from '@/api/mes/extFieldDef/types';

/**
 * 查询主数据扩展字段定义列表
 * @param query
 * @returns {*}
 */

export const listExtFieldDef = (query?: ExtFieldDefQuery): AxiosPromise<ExtFieldDefVO[]> => {
  return request({
    url: '/mes/extFieldDef/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询主数据扩展字段定义详细
 * @param id
 */
export const getExtFieldDef = (id: string | number): AxiosPromise<ExtFieldDefVO> => {
  return request({
    url: '/mes/extFieldDef/' + id,
    method: 'get'
  });
};

/**
 * 新增主数据扩展字段定义
 * @param data
 */
export const addExtFieldDef = (data: ExtFieldDefForm) => {
  return request({
    url: '/mes/extFieldDef',
    method: 'post',
    data: data
  });
};

/**
 * 修改主数据扩展字段定义
 * @param data
 */
export const updateExtFieldDef = (data: ExtFieldDefForm) => {
  return request({
    url: '/mes/extFieldDef',
    method: 'put',
    data: data
  });
};

/**
 * 删除主数据扩展字段定义
 * @param id
 */
export const delExtFieldDef = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/extFieldDef/' + id,
    method: 'delete'
  });
};
