import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { AutoWaitEventQuery, AutoWaitEventVo } from '@/api/automation/waitEvent/types';

export const listWaitEvent = (query: AutoWaitEventQuery): AxiosPromise<AutoWaitEventVo[]> => {
  return request({ url: '/automation/waitEvent/list', method: 'get', params: query });
};

export const getWaitEvent = (id: number | string): AxiosPromise<AutoWaitEventVo> => {
  return request({ url: '/automation/waitEvent/' + id, method: 'get' });
};

export const completeWaitEvent = (id: number | string) => {
  return request({ url: `/automation/waitEvent/${id}/complete`, method: 'post' });
};

export const cancelWaitEvent = (id: number | string) => {
  return request({ url: `/automation/waitEvent/${id}/cancel`, method: 'post' });
};
