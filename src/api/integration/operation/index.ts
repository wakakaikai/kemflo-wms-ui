import request from '@/utils/request';
import { OperationForm, OperationQuery, OperationVO } from './types';
import { AxiosPromise } from 'axios';

// 查询操作列表
export function listOperation(query: OperationQuery): AxiosPromise<OperationVO[]> {
  return request({
    url: '/integration/operation/list',
    method: 'get',
    params: query
  });
}

// 查询操作详细
export function getOperation(operationId: string | number): AxiosPromise<OperationVO> {
  return request({
    url: '/integration/operation/' + operationId,
    method: 'get'
  });
}

// 新增操作
export function addOperation(data: OperationForm) {
  return request({
    url: '/integration/operation',
    method: 'post',
    data: data
  });
}

// 修改操作
export function updateOperation(data: OperationForm) {
  return request({
    url: '/integration/operation',
    method: 'put',
    data: data
  });
}

// 删除操作
export function delOperation(operationId: string | number | Array<string | number>) {
  return request({
    url: '/integration/operation/' + operationId,
    method: 'delete'
  });
}
