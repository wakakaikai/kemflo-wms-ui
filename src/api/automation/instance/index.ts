import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { AutoInstanceQuery, AutoInstanceVo, AutoInstanceStartBo, AutoInstanceTraceVo } from '@/api/automation/instance/types';

export const listInstance = (query: AutoInstanceQuery): AxiosPromise<AutoInstanceVo[]> => {
  return request({ url: '/automation/instance/list', method: 'get', params: query });
};

export const getInstance = (id: number | string): AxiosPromise<AutoInstanceVo> => {
  return request({ url: '/automation/instance/' + id, method: 'get' });
};

export const startInstance = (data: AutoInstanceStartBo): AxiosPromise<number | string> => {
  return request({ url: '/automation/instance/start', method: 'post', data });
};

export const getInstanceNodes = (id: number | string): AxiosPromise<AutoInstanceTraceVo> => {
  return request({ url: `/automation/instance/${id}/nodes`, method: 'get' });
};

export const terminateInstance = (id: number | string) => {
  return request({ url: `/automation/instance/${id}/terminate`, method: 'post' });
};
