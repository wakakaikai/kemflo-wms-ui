import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { AutoNodeExecutionQuery, AutoNodeExecutionVo } from '@/api/automation/nodeExecution/types';

export const listNodeExecution = (query: AutoNodeExecutionQuery): AxiosPromise<AutoNodeExecutionVo[]> => {
  return request({ url: '/automation/nodeExecution/list', method: 'get', params: query });
};

export const retryNodeExecution = (id: number | string) => {
  return request({ url: `/automation/nodeExecution/${id}/retry`, method: 'post' });
};
