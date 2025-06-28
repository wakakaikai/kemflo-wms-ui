import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { WorkCenterVO, WorkCenterForm, WorkCenterQuery } from '@/api/mes/workCenter/types';

/**
 * 查询工作中心档案列表
 * @param query
 * @returns {*}
 */

export const listWorkCenter = (query?: WorkCenterQuery): AxiosPromise<WorkCenterVO[]> => {
  return request({
    url: '/mes/workCenter/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工作中心档案详细
 * @param id
 */
export const getWorkCenter = (id: string | number): AxiosPromise<WorkCenterVO> => {
  return request({
    url: '/mes/workCenter/' + id,
    method: 'get'
  });
};

/**
 * 新增工作中心档案
 * @param data
 */
export const addWorkCenter = (data: WorkCenterForm) => {
  return request({
    url: '/mes/workCenter',
    method: 'post',
    data: data
  });
};

/**
 * 修改工作中心档案
 * @param data
 */
export const updateWorkCenter = (data: WorkCenterForm) => {
  return request({
    url: '/mes/workCenter',
    method: 'put',
    data: data
  });
};

/**
 * 删除工作中心档案
 * @param id
 */
export const delWorkCenter = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/workCenter/' + id,
    method: 'delete'
  });
};
