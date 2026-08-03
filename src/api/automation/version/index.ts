import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { AutoVersionQuery, AutoVersionVo } from '@/api/automation/version/types';

export const listVersion = (query: AutoVersionQuery): AxiosPromise<AutoVersionVo[]> => {
  return request({ url: '/automation/version/list', method: 'get', params: query });
};

export const getVersion = (id: number | string): AxiosPromise<AutoVersionVo> => {
  return request({ url: '/automation/version/' + id, method: 'get' });
};
