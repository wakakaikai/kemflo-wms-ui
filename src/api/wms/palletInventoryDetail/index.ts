import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PalletInventoryDetailVO, PalletInventoryDetailForm, PalletInventoryDetailQuery } from '@/api/wms/palletInventoryDetail/types';

/**
 * 查询栈板物料库存明细列表
 * @param query
 * @returns {*}
 */

export const pagePalletInventoryDetail = (query?: PalletInventoryDetailQuery): AxiosPromise<PalletInventoryDetailVO[]> => {
  return request({
    url: '/wms/palletInventoryDetail/page',
    method: 'get',
    params: query
  });
};
/**
 * 查询栈板物料库存明细列表
 * @param query
 * @returns {*}
 */

export const listPalletInventoryDetail = (query?: PalletInventoryDetailQuery): AxiosPromise<PalletInventoryDetailVO[]> => {
  return request({
    url: '/wms/palletInventoryDetail/list',
    method: 'get',
    params: query
  });
};


/**
 * 查询栈板物料库存明细详细
 * @param id
 */
export const getPalletInventoryDetail = (id: string | number): AxiosPromise<PalletInventoryDetailVO> => {
  return request({
    url: '/wms/palletInventoryDetail/' + id,
    method: 'get'
  });
};

/**
 * 新增栈板物料库存明细
 * @param data
 */
export const addPalletInventoryDetail = (data: PalletInventoryDetailForm) => {
  return request({
    url: '/wms/palletInventoryDetail',
    method: 'post',
    data: data
  });
};

/**
 * 修改栈板物料库存明细
 * @param data
 */
export const updatePalletInventoryDetail = (data: PalletInventoryDetailForm) => {
  return request({
    url: '/wms/palletInventoryDetail',
    method: 'put',
    data: data
  });
};

/**
 * 删除栈板物料库存明细
 * @param id
 */
export const delPalletInventoryDetail = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/palletInventoryDetail/' + id,
    method: 'delete'
  });
};
