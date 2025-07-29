import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { HrDeptRoleVO, HrDeptRoleForm, HrDeptRoleQuery } from '@/api/system/hrDeptRole/types';

/**
 * 查询HR部门角色同步列表
 * @param query
 * @returns {*}
 */

export const listHrDeptRole = (query?: HrDeptRoleQuery): AxiosPromise<HrDeptRoleVO[]> => {
  return request({
    url: '/system/hrDeptRole/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询HR部门角色同步详细
 * @param id
 */
export const getHrDeptRole = (id: string | number): AxiosPromise<HrDeptRoleVO> => {
  return request({
    url: '/system/hrDeptRole/' + id,
    method: 'get'
  });
};

/**
 * 新增HR部门角色同步
 * @param data
 */
export const addHrDeptRole = (data: HrDeptRoleForm) => {
  return request({
    url: '/system/hrDeptRole',
    method: 'post',
    data: data
  });
};

/**
 * 修改HR部门角色同步
 * @param data
 */
export const updateHrDeptRole = (data: HrDeptRoleForm) => {
  return request({
    url: '/system/hrDeptRole',
    method: 'put',
    data: data
  });
};

/**
 * 删除HR部门角色同步
 * @param id
 */
export const delHrDeptRole = (id: string | number | Array<string | number>) => {
  return request({
    url: '/system/hrDeptRole/' + id,
    method: 'delete'
  });
};
