import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { MaterialIssueDetailVO, MaterialIssueDetailForm, MaterialIssueDetailQuery } from '@/api/wms/materialIssueDetail/types';

/**
 * 查询发料明细列表
 * @param query
 * @returns {*}
 */

export const listMaterialIssueDetail = (query?: MaterialIssueDetailQuery): AxiosPromise<MaterialIssueDetailVO[]> => {
  return request({
    url: '/wms/materialIssueDetail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询发料明细详细
 * @param id
 */
export const getMaterialIssueDetail = (id: string | number): AxiosPromise<MaterialIssueDetailVO> => {
  return request({
    url: '/wms/materialIssueDetail/' + id,
    method: 'get'
  });
};

/**
 * 新增发料明细
 * @param data
 */
export const addMaterialIssueDetail = (data: MaterialIssueDetailForm) => {
  return request({
    url: '/wms/materialIssueDetail',
    method: 'post',
    data: data
  });
};

/**
 * 修改发料明细
 * @param data
 */
export const updateMaterialIssueDetail = (data: MaterialIssueDetailForm) => {
  return request({
    url: '/wms/materialIssueDetail',
    method: 'put',
    data: data
  });
};

/**
 * 删除发料明细
 * @param id
 */
export const delMaterialIssueDetail = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/materialIssueDetail/' + id,
    method: 'delete'
  });
};
