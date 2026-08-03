import request from '@/utils/request';
import { ExecutionLogQuery, ExecutionLogVO } from './types';
import { AxiosPromise } from 'axios';

// 查询执行日志列表
export function listExecutionLog(query: ExecutionLogQuery): AxiosPromise<ExecutionLogVO[]> {
  return request({
    url: '/integration/executionLog/list',
    method: 'get',
    params: query
  });
}

// 查询执行日志详细
export function getExecutionLog(executionId: string | number): AxiosPromise<ExecutionLogVO> {
  return request({
    url: '/integration/executionLog/' + executionId,
    method: 'get'
  });
}
