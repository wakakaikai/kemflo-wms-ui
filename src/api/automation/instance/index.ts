import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { AutoInstanceQuery, AutoInstanceVo } from '@/api/automation/instance/types';

export const listInstance = (query: AutoInstanceQuery): AxiosPromise<AutoInstanceVo[]> => {
  return request({ url: '/automation/instance/list', method: 'get', params: query });
};

export const getInstance = (id: number | string): AxiosPromise<AutoInstanceVo> => {
  return request({ url: '/automation/instance/' + id, method: 'get' });
};

export const terminateInstance = (id: number | string) => {
  return request({ url: `/automation/instance/${id}/terminate`, method: 'post' });
};
