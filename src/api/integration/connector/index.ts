import request from '@/utils/request';
import { ConnectorForm, ConnectorQuery, ConnectorVO } from './types';
import { AxiosPromise } from 'axios';

// 查询连接器列表
export function listConnector(query: ConnectorQuery): AxiosPromise<ConnectorVO[]> {
  return request({
    url: '/integration/connector/list',
    method: 'get',
    params: query
  });
}

// 查询连接器详细
export function getConnector(connectorId: string | number): AxiosPromise<ConnectorVO> {
  return request({
    url: '/integration/connector/' + connectorId,
    method: 'get'
  });
}

// 新增连接器
export function addConnector(data: ConnectorForm) {
  return request({
    url: '/integration/connector',
    method: 'post',
    data: data
  });
}

// 修改连接器
export function updateConnector(data: ConnectorForm) {
  return request({
    url: '/integration/connector',
    method: 'put',
    data: data
  });
}

// 删除连接器
export function delConnector(connectorId: string | number | Array<string | number>) {
  return request({
    url: '/integration/connector/' + connectorId,
    method: 'delete'
  });
}
