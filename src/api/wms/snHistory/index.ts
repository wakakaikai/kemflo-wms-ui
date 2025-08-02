import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { SnHistoryVO, SnHistoryForm, SnHistoryQuery } from '@/api/wms/snHistory/types';

/**
 * 查询条码历史记录列表
 * @param query
 * @returns {*}
 */

export const listSnHistory = (query?: SnHistoryQuery): AxiosPromise<SnHistoryVO[]> => {
  return request({
    url: '/wms/snHistory/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询条码历史记录详细
 * @param id
 */
export const getSnHistory = (id: string | number): AxiosPromise<SnHistoryVO> => {
  return request({
    url: '/wms/snHistory/' + id,
    method: 'get'
  });
};

/**
 * 新增条码历史记录
 * @param data
 */
export const addSnHistory = (data: SnHistoryForm) => {
  return request({
    url: '/wms/snHistory',
    method: 'post',
    data: data
  });
};

/**
 * 修改条码历史记录
 * @param data
 */
export const updateSnHistory = (data: SnHistoryForm) => {
  return request({
    url: '/wms/snHistory',
    method: 'put',
    data: data
  });
};

/**
 * 删除条码历史记录
 * @param id
 */
export const delSnHistory = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/snHistory/' + id,
    method: 'delete'
  });
};
