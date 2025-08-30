import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PackingDetailSnVO, PackingDetailSnForm, PackingDetailSnQuery } from '@/api/wms/packingDetailSn/types';

/**
 * 查询打包产品条码明细列表
 * @param query
 * @returns {*}
 */

export const listPackingDetailSn = (query?: PackingDetailSnQuery): AxiosPromise<PackingDetailSnVO[]> => {
  return request({
    url: '/wms/packingDetailSn/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询打包产品条码明细详细
 * @param id
 */
export const getPackingDetailSn = (id: string | number): AxiosPromise<PackingDetailSnVO> => {
  return request({
    url: '/wms/packingDetailSn/' + id,
    method: 'get'
  });
};

/**
 * 新增打包产品条码明细
 * @param data
 */
export const addPackingDetailSn = (data: PackingDetailSnForm) => {
  return request({
    url: '/wms/packingDetailSn',
    method: 'post',
    data: data
  });
};

/**
 * 修改打包产品条码明细
 * @param data
 */
export const updatePackingDetailSn = (data: PackingDetailSnForm) => {
  return request({
    url: '/wms/packingDetailSn',
    method: 'put',
    data: data
  });
};

/**
 * 删除打包产品条码明细
 * @param id
 */
export const delPackingDetailSn = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/packingDetailSn/' + id,
    method: 'delete'
  });
};
