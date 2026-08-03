import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { AutoTaskQuery, AutoTaskVo } from '@/api/automation/task/types';

export const listTask = (query: AutoTaskQuery): AxiosPromise<AutoTaskVo[]> => {
  return request({ url: '/automation/task/list', method: 'get', params: query });
};

export const retryTask = (id: number | string) => {
  return request({ url: `/automation/task/${id}/retry`, method: 'post' });
};
