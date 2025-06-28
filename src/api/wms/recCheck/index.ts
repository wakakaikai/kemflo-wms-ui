import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { RecCheckVO, RecCheckForm, RecCheckQuery } from '@/api/wms/recCheck/types';

/**
 * 查询收货检验单列表
 * @param query
 * @returns {*}
 */

export const listRecCheck = (query?: RecCheckQuery): AxiosPromise<RecCheckVO[]> => {
  return request({
    url: '/wms/recCheck/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询收货检验单详细
 * @param id
 */
export const getRecCheck = (id: string | number): AxiosPromise<RecCheckVO> => {
  return request({
    url: '/wms/recCheck/' + id,
    method: 'get'
  });
};

/**
 * 新增收货检验单
 * @param data
 */
export const addRecCheck = (data: RecCheckForm) => {
  return request({
    url: '/wms/recCheck',
    method: 'post',
    data: data
  });
};

/**
 * 修改收货检验单
 * @param data
 */
export const updateRecCheck = (data: RecCheckForm) => {
  return request({
    url: '/wms/recCheck',
    method: 'put',
    data: data
  });
};

/**
 * 删除收货检验单
 * @param id
 */
export const delRecCheck = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/recCheck/' + id,
    method: 'delete'
  });
};
