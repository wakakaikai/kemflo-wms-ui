import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { SfcVO, SfcForm, SfcQuery } from '@/api/mes/sfc/types';

/**
 * 查询产品条码列表
 * @param query
 * @returns {*}
 */

export const listSfc = (query?: SfcQuery): AxiosPromise<SfcVO[]> => {
  return request({
    url: '/mes/sfc/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询产品条码详细
 * @param id
 */
export const getSfc = (id: string | number): AxiosPromise<SfcVO> => {
  return request({
    url: '/mes/sfc/' + id,
    method: 'get'
  });
};

/**
 * 新增产品条码
 * @param data
 */
export const addSfc = (data: SfcForm) => {
  return request({
    url: '/mes/sfc',
    method: 'post',
    data: data
  });
};

/**
 * 修改产品条码
 * @param data
 */
export const updateSfc = (data: SfcForm) => {
  return request({
    url: '/mes/sfc',
    method: 'put',
    data: data
  });
};

/**
 * 删除产品条码
 * @param id
 */
export const delSfc = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/sfc/' + id,
    method: 'delete'
  });
};

/**
 * 查询产品条码列表
 * @param query
 * @returns {*}
 */

export const getBoxOrPalletSn = (query?: SfcQuery): any => {
  return request({
    url: '/mes/sfc/getBoxOrPalletSn',
    method: 'get',
    params: query
  });
};
