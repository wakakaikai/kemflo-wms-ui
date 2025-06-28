import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { RecCheckDetailVO, RecCheckDetailForm, RecCheckDetailQuery } from '@/api/wms/recCheckDetail/types';

/**
 * 查询收货检验单详细列表
 * @param query
 * @returns {*}
 */

export const listRecCheckDetail = (query?: RecCheckDetailQuery): AxiosPromise<RecCheckDetailVO[]> => {
  return request({
    url: '/wms/recCheckDetail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询收货检验单详细详细
 * @param id
 */
export const getRecCheckDetail = (id: string | number): AxiosPromise<RecCheckDetailVO> => {
  return request({
    url: '/wms/recCheckDetail/' + id,
    method: 'get'
  });
};

/**
 * 新增收货检验单详细
 * @param data
 */
export const addRecCheckDetail = (data: RecCheckDetailForm) => {
  return request({
    url: '/wms/recCheckDetail',
    method: 'post',
    data: data
  });
};

/**
 * 修改收货检验单详细
 * @param data
 */
export const updateRecCheckDetail = (data: RecCheckDetailForm) => {
  return request({
    url: '/wms/recCheckDetail',
    method: 'put',
    data: data
  });
};

/**
 * 删除收货检验单详细
 * @param id
 */
export const delRecCheckDetail = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/recCheckDetail/' + id,
    method: 'delete'
  });
};
