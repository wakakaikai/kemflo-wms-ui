import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PalletVO, PalletForm, PalletQuery } from '@/api/mes/pallet/types';

/**
 * 查询MES栈板列表
 * @param query
 * @returns {*}
 */

export const listPallet = (query?: PalletQuery): AxiosPromise<PalletVO[]> => {
  return request({
    url: '/mes/pallet/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询MES栈板详细
 * @param id
 */
export const getPallet = (id: string | number): AxiosPromise<PalletVO> => {
  return request({
    url: '/mes/pallet/' + id,
    method: 'get'
  });
};

/**
 * 新增MES栈板
 * @param data
 */
export const addPallet = (data: PalletForm) => {
  return request({
    url: '/mes/pallet',
    method: 'post',
    data: data
  });
};

/**
 * 修改MES栈板
 * @param data
 */
export const updatePallet = (data: PalletForm) => {
  return request({
    url: '/mes/pallet',
    method: 'put',
    data: data
  });
};

/**
 * 删除MES栈板
 * @param id
 */
export const delPallet = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/pallet/' + id,
    method: 'delete'
  });
};
