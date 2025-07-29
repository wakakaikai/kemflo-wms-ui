import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PackingDetailVO, PackingDetailForm, PackingDetailQuery } from '@/api/wms/packingDetail/types';

/**
 * 查询打包明细列表
 * @param query
 * @returns {*}
 */

export const listPackingDetail = (query?: PackingDetailQuery): AxiosPromise<PackingDetailVO[]> => {
  return request({
    url: '/wms/packingDetail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询打包明细详细
 * @param id
 */
export const getPackingDetail = (id: string | number): AxiosPromise<PackingDetailVO> => {
  return request({
    url: '/wms/packingDetail/' + id,
    method: 'get'
  });
};

/**
 * 新增打包明细
 * @param data
 */
export const addPackingDetail = (data: PackingDetailForm) => {
  return request({
    url: '/wms/packingDetail',
    method: 'post',
    data: data
  });
};

/**
 * 修改打包明细
 * @param data
 */
export const updatePackingDetail = (data: PackingDetailForm) => {
  return request({
    url: '/wms/packingDetail',
    method: 'put',
    data: data
  });
};

/**
 * 删除打包明细
 * @param id
 */
export const delPackingDetail = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/packingDetail/' + id,
    method: 'delete'
  });
};

/**
 * 根据工单号查询已打包数量
 * @param workOrderNo
 */
export const getWorkOrderPackedQty = (workOrderNo: string | number | Array<string | number>) => {
  return request({
    url: '/wms/packingDetail/getWorkOrderPackedQty/' + workOrderNo,
    method: 'get'
  });
};
