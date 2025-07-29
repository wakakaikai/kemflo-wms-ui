import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PackingVO, PackingForm, PackingQuery, PackingExtVO } from '@/api/wms/packing/types';

/**
 * 查询打包记录列表
 * @param query
 * @returns {*}
 */

export const listPacking = (query?: PackingQuery): AxiosPromise<PackingVO[]> => {
  return request({
    url: '/wms/packing/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询打包及明细记录列表
 * @param query
 * @returns {*}
 */

export const listPackingAndDetail = (query?: PackingQuery): AxiosPromise<PackingVO[]> => {
  return request({
    url: '/wms/packing/packingDetail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询打包记录详细
 * @param id
 */
export const getPacking = (id: string | number): AxiosPromise<PackingVO> => {
  return request({
    url: '/wms/packing/' + id,
    method: 'get'
  });
};

/**
 * 新增打包记录
 * @param data
 */
export const addPacking = (data: PackingForm) => {
  return request({
    url: '/wms/packing',
    method: 'post',
    data: data
  });
};

/**
 * 修改打包记录
 * @param data
 */
export const updatePacking = (data: PackingForm) => {
  return request({
    url: '/wms/packing',
    method: 'put',
    data: data
  });
};

/**
 * 删除打包记录
 * @param id
 */
export const delPacking = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/packing/' + id,
    method: 'delete'
  });
};

/**
 * 保存栈板送仓记录
 * @param data
 */
export const inBoundPending = (data: PackingForm) => {
  return request({
    url: '/wms/packing/inbound/pending',
    method: 'put',
    data: data
  });
};

/**
 * 保存栈板退回记录
 * @param data
 */
export const rejectPacking = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/packing/reject/' + id,
    method: 'put'
  });
};

/**
 * 保存栈板接收记录
 * @param data
 */
export const receivePacking = (data: PackingExtVO) => {
  return request({
    url: '/wms/packing/receive',
    method: 'put',
    data: data
  });
};
