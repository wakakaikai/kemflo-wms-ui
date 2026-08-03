import request from '@/utils/request';
import { ConnectionForm, ConnectionQuery, ConnectionVO } from './types';
import { AxiosPromise } from 'axios';

// 查询连接配置列表
export function listConnection(query: ConnectionQuery): AxiosPromise<ConnectionVO[]> {
  return request({
    url: '/integration/connection/list',
    method: 'get',
    params: query
  });
}

// 查询连接配置详细
export function getConnection(connectionId: string | number): AxiosPromise<ConnectionVO> {
  return request({
    url: '/integration/connection/' + connectionId,
    method: 'get'
  });
}

// 新增连接配置
export function addConnection(data: ConnectionForm) {
  return request({
    url: '/integration/connection',
    method: 'post',
    data: data
  });
}

// 修改连接配置
export function updateConnection(data: ConnectionForm) {
  return request({
    url: '/integration/connection',
    method: 'put',
    data: data
  });
}

// 删除连接配置
export function delConnection(connectionId: string | number | Array<string | number>) {
  return request({
    url: '/integration/connection/' + connectionId,
    method: 'delete'
  });
}
