import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ResourceTypeVO, ResourceTypeForm, ResourceTypeQuery } from '@/api/mes/resourceType/types';

/**
 * 查询资源类型列表
 * @param query
 * @returns {*}
 */

export const listResourceType = (query?: ResourceTypeQuery): AxiosPromise<ResourceTypeVO[]> => {
  return request({
    url: '/mes/resourceType/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询资源类型列表
 * @param query
 * @returns {*}
 */

export const pageResourceType = (query?: ResourceTypeQuery): AxiosPromise<ResourceTypeVO[]> => {
  return request({
    url: '/mes/resourceType/page',
    method: 'get',
    params: query
  });
};

/**
 * 查询工作岗位列表
 * @param query
 * @returns {*}
 */

export const queryWorkStationList = (query?: ResourceTypeQuery): AxiosPromise<ResourceTypeVO[]> => {
  return request({
    url: '/mes/resourceType/workStation',
    method: 'get',
    params: query
  });
};


/**
 * 查询资源类型详细
 * @param id
 */
export const getResourceType = (id: string | number): AxiosPromise<ResourceTypeVO> => {
  return request({
    url: '/mes/resourceType/' + id,
    method: 'get'
  });
};

/**
 * 新增资源类型
 * @param data
 */
export const addResourceType = (data: ResourceTypeForm) => {
  return request({
    url: '/mes/resourceType',
    method: 'post',
    data: data
  });
};

/**
 * 修改资源类型
 * @param data
 */
export const updateResourceType = (data: ResourceTypeForm) => {
  return request({
    url: '/mes/resourceType',
    method: 'put',
    data: data
  });
};

/**
 * 删除资源类型
 * @param id
 */
export const delResourceType = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/resourceType/' + id,
    method: 'delete'
  });
};
