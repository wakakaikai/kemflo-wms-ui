import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { UserCollectionsVO, UserCollectionsForm, UserCollectionsQuery } from '@/api/wms/userCollections/types';

/**
 * 查询用户收藏列表
 * @param query
 * @returns {*}
 */

export const listUserCollections = (query?: UserCollectionsQuery): AxiosPromise<UserCollectionsVO[]> => {
  return request({
    url: '/wms/userCollections/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询用户收藏详细
 * @param id
 */
export const getUserCollections = (id: string | number): AxiosPromise<UserCollectionsVO> => {
  return request({
    url: '/wms/userCollections/' + id,
    method: 'get'
  });
};

/**
 * 新增用户收藏
 * @param data
 */
export const addUserCollections = (data: UserCollectionsForm) => {
  return request({
    url: '/wms/userCollections',
    method: 'post',
    data: data
  });
};

/**
 * 修改用户收藏
 * @param data
 */
export const updateUserCollections = (data: UserCollectionsForm) => {
  return request({
    url: '/wms/userCollections',
    method: 'put',
    data: data
  });
};

/**
 * 删除用户收藏
 * @param id
 */
export const delUserCollections = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/userCollections/' + id,
    method: 'delete'
  });
};
