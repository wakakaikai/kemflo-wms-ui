import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { WmsUnitVO, WmsUnitForm, WmsUnitQuery } from '@/api/wms/wmsUnit/types';

/**
 * 查询计量单位列表
 * @param query
 * @returns {*}
 */

export const listWmsUnit = (query?: WmsUnitQuery): AxiosPromise<WmsUnitVO[]> => {
  return request({
    url: '/wms/wmsUnit/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询计量单位详细
 * @param id
 */
export const getWmsUnit = (id: string | number): AxiosPromise<WmsUnitVO> => {
  return request({
    url: '/wms/wmsUnit/' + id,
    method: 'get'
  });
};

/**
 * 新增计量单位
 * @param data
 */
export const addWmsUnit = (data: WmsUnitForm) => {
  return request({
    url: '/wms/wmsUnit',
    method: 'post',
    data: data
  });
};

/**
 * 修改计量单位
 * @param data
 */
export const updateWmsUnit = (data: WmsUnitForm) => {
  return request({
    url: '/wms/wmsUnit',
    method: 'put',
    data: data
  });
};

/**
 * 删除计量单位
 * @param id
 */
export const delWmsUnit = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/wmsUnit/' + id,
    method: 'delete'
  });
};
