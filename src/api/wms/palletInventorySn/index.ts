import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PalletInventorySnVO, PalletInventorySnForm, PalletInventorySnQuery } from '@/api/wms/palletInventorySn/types';

/**
 * 查询栈板SN库存明细列表
 * @param query
 * @returns {*}
 */

export const listPalletInventorySn = (query?: PalletInventorySnQuery): AxiosPromise<PalletInventorySnVO[]> => {
  return request({
    url: '/wms/palletInventorySn/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询栈板SN库存明细详细
 * @param id
 */
export const getPalletInventorySn = (id: string | number): AxiosPromise<PalletInventorySnVO> => {
  return request({
    url: '/wms/palletInventorySn/' + id,
    method: 'get'
  });
};

/**
 * 新增栈板SN库存明细
 * @param data
 */
export const addPalletInventorySn = (data: PalletInventorySnForm) => {
  return request({
    url: '/wms/palletInventorySn',
    method: 'post',
    data: data
  });
};

/**
 * 修改栈板SN库存明细
 * @param data
 */
export const updatePalletInventorySn = (data: PalletInventorySnForm) => {
  return request({
    url: '/wms/palletInventorySn',
    method: 'put',
    data: data
  });
};

/**
 * 删除栈板SN库存明细
 * @param id
 */
export const delPalletInventorySn = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/palletInventorySn/' + id,
    method: 'delete'
  });
};
