import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { OperationVO, OperationForm, OperationQuery } from '@/api/mes/operation/types';

/**
 * 查询工序列表
 * @param query
 * @returns {*}
 */

export const listOperation = (query?: OperationQuery): AxiosPromise<OperationVO[]> => {
  return request({
    url: '/mes/operation/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工序详细
 * @param id
 */
export const getOperation = (id: string | number): AxiosPromise<OperationVO> => {
  return request({
    url: '/mes/operation/' + id,
    method: 'get'
  });
};

/**
 * 新增工序
 * @param data
 */
export const addOperation = (data: OperationForm) => {
  return request({
    url: '/mes/operation',
    method: 'post',
    data: data
  });
};

/**
 * 修改工序
 * @param data
 */
export const updateOperation = (data: OperationForm) => {
  return request({
    url: '/mes/operation',
    method: 'put',
    data: data
  });
};

/**
 * 删除工序
 * @param id
 */
export const delOperation = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/operation/' + id,
    method: 'delete'
  });
};
