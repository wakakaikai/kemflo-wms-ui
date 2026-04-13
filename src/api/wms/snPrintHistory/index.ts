import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { SnPrintHistoryVO, SnPrintHistoryForm, SnPrintHistoryQuery } from '@/api/wms/snPrintHistory/types';

/**
 * 查询SN打印历史列表
 * @param query
 * @returns {*}
 */

export const listSnPrintHistory = (query?: SnPrintHistoryQuery): AxiosPromise<SnPrintHistoryVO[]> => {
  return request({
    url: '/wms/snPrintHistory/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询SN打印历史详细
 * @param id
 */
export const getSnPrintHistory = (id: string | number): AxiosPromise<SnPrintHistoryVO> => {
  return request({
    url: '/wms/snPrintHistory/' + id,
    method: 'get'
  });
};

/**
 * 新增SN打印历史
 * @param data
 */
export const addSnPrintHistory = (data: SnPrintHistoryForm) => {
  return request({
    url: '/wms/snPrintHistory',
    method: 'post',
    data: data
  });
};

/**
 * 修改SN打印历史
 * @param data
 */
export const updateSnPrintHistory = (data: SnPrintHistoryForm) => {
  return request({
    url: '/wms/snPrintHistory',
    method: 'put',
    data: data
  });
};

/**
 * 删除SN打印历史
 * @param id
 */
export const delSnPrintHistory = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/snPrintHistory/' + id,
    method: 'delete'
  });
};
