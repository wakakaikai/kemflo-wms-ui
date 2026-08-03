import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ConnectionVO, ConnectionForm, ConnectionQuery } from '@/api/iot/connection/types';

/**
 * 查询连接配置列表
 * @param query
 * @returns {*}
 */
export const listConnection = (query?: ConnectionQuery): AxiosPromise<ConnectionVO[]> => {
  return request({
    url: '/iot/connection/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询连接配置详细
 * @param id
 */
export const getConnection = (id: string | number): AxiosPromise<ConnectionVO> => {
  return request({
    url: '/iot/connection/' + id,
    method: 'get'
  });
};

/**
 * 新增连接配置
 * @param data
 */
export const addConnection = (data: ConnectionForm) => {
  return request({
    url: '/iot/connection',
    method: 'post',
    data: data
  });
};

/**
 * 修改连接配置
 * @param data
 */
export const updateConnection = (data: ConnectionForm) => {
  return request({
    url: '/iot/connection',
    method: 'put',
    data: data
  });
};

/**
 * 删除连接配置
 * @param id
 */
export const delConnection = (id: string | number | Array<string | number>) => {
  return request({
    url: '/iot/connection/' + id,
    method: 'delete'
  });
};
