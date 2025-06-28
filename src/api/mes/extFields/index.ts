import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ExtFieldsVO, ExtFieldsForm, ExtFieldsQuery } from '@/api/mes/extFields/types';

/**
 * 查询主数据扩展字段列表
 * @param query
 * @returns {*}
 */

export const listExtFields = (query?: ExtFieldsQuery): AxiosPromise<ExtFieldsVO[]> => {
  return request({
    url: '/mes/extFields/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询主数据扩展字段详细
 * @param id
 */
export const getExtFields = (id: string | number): AxiosPromise<ExtFieldsVO> => {
  return request({
    url: '/mes/extFields/' + id,
    method: 'get'
  });
};

/**
 * 新增主数据扩展字段
 * @param data
 */
export const addExtFields = (data: ExtFieldsForm) => {
  return request({
    url: '/mes/extFields',
    method: 'post',
    data: data
  });
};

/**
 * 修改主数据扩展字段
 * @param data
 */
export const updateExtFields = (data: ExtFieldsForm) => {
  return request({
    url: '/mes/extFields',
    method: 'put',
    data: data
  });
};

/**
 * 删除主数据扩展字段
 * @param id
 */
export const delExtFields = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/extFields/' + id,
    method: 'delete'
  });
};
