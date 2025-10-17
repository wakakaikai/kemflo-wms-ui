import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { BatchVO, BatchForm, BatchQuery } from '@/api/wms/batch/types';

/**
 * 查询批次列表
 * @param query
 * @returns {*}
 */

export const listBatch = (query?: BatchQuery): AxiosPromise<BatchVO[]> => {
  return request({
    url: '/wms/batch/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询批次详细
 * @param id
 */
export const getBatch = (id: string | number): AxiosPromise<BatchVO> => {
  return request({
    url: '/wms/batch/' + id,
    method: 'get'
  });
};

/**
 * 新增批次
 * @param data
 */
export const addBatch = (data: BatchForm) => {
  return request({
    url: '/wms/batch',
    method: 'post',
    data: data
  });
};

/**
 * 修改批次
 * @param data
 */
export const updateBatch = (data: BatchForm) => {
  return request({
    url: '/wms/batch',
    method: 'put',
    data: data
  });
};

/**
 * 删除批次
 * @param id
 */
export const delBatch = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/batch/' + id,
    method: 'delete'
  });
};
