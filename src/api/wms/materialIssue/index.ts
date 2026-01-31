import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { MaterialIssueVO, MaterialIssueForm, MaterialIssueQuery } from '@/api/wms/materialIssue/types';

/**
 * 查询发料记录列表
 * @param query
 * @returns {*}
 */

export const listMaterialIssue = (query?: MaterialIssueQuery): AxiosPromise<MaterialIssueVO[]> => {
  return request({
    url: '/wms/materialIssue/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询发料记录详细
 * @param id
 */
export const getMaterialIssue = (id: string | number): AxiosPromise<MaterialIssueVO> => {
  return request({
    url: '/wms/materialIssue/' + id,
    method: 'get'
  });
};

/**
 * 新增发料记录
 * @param data
 */
export const addMaterialIssue = (data: MaterialIssueForm) => {
  return request({
    url: '/wms/materialIssue',
    method: 'post',
    data: data
  });
};

/**
 * 修改发料记录
 * @param data
 */
export const updateMaterialIssue = (data: MaterialIssueForm) => {
  return request({
    url: '/wms/materialIssue',
    method: 'put',
    data: data
  });
};

/**
 * 删除发料记录
 * @param id
 */
export const delMaterialIssue = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/materialIssue/' + id,
    method: 'delete'
  });
};
