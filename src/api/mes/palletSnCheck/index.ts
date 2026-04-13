import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PalletSnCheckVO, PalletSnCheckForm, PalletSnCheckQuery } from '@/api/mes/palletSnCheck/types';

/**
 * 查询栈板SN核对结果列表
 * @param query
 * @returns {*}
 */

export const listPalletSnCheck = (query?: PalletSnCheckQuery): AxiosPromise<PalletSnCheckVO[]> => {
  return request({
    url: '/mes/palletSnCheck/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询栈板SN核对结果详细
 * @param id
 */
export const getPalletSnCheck = (id: string | number): AxiosPromise<PalletSnCheckVO> => {
  return request({
    url: '/mes/palletSnCheck/' + id,
    method: 'get'
  });
};

/**
 * 新增栈板SN核对结果
 * @param data
 */
export const addPalletSnCheck = (data: PalletSnCheckForm) => {
  return request({
    url: '/mes/palletSnCheck',
    method: 'post',
    data: data
  });
};

/**
 * 修改栈板SN核对结果
 * @param data
 */
export const updatePalletSnCheck = (data: PalletSnCheckForm) => {
  return request({
    url: '/mes/palletSnCheck',
    method: 'put',
    data: data
  });
};

/**
 * 删除栈板SN核对结果
 * @param id
 */
export const delPalletSnCheck = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/palletSnCheck/' + id,
    method: 'delete'
  });
};
