import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PalletSnVO, PalletSnForm, PalletSnQuery } from '@/api/mes/palletSn/types';

/**
 * 查询栈板SN列表
 * @param query
 * @returns {*}
 */

export const listPalletSn = (query?: PalletSnQuery): AxiosPromise<PalletSnVO[]> => {
  return request({
    url: '/mes/palletSn/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询栈板SN详细
 * @param id
 */
export const getPalletSn = (id: string | number): AxiosPromise<PalletSnVO> => {
  return request({
    url: '/mes/palletSn/' + id,
    method: 'get'
  });
};

/**
 * 新增栈板SN
 * @param data
 */
export const addPalletSn = (data: PalletSnForm) => {
  return request({
    url: '/mes/palletSn',
    method: 'post',
    data: data
  });
};

/**
 * 修改栈板SN
 * @param data
 */
export const updatePalletSn = (data: PalletSnForm) => {
  return request({
    url: '/mes/palletSn',
    method: 'put',
    data: data
  });
};

/**
 * 删除栈板SN
 * @param id
 */
export const delPalletSn = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/palletSn/' + id,
    method: 'delete'
  });
};
