import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { AutoEventOutboxQuery, AutoEventOutboxVo } from '@/api/automation/eventOutbox/types';

export const listEventOutbox = (query: AutoEventOutboxQuery): AxiosPromise<AutoEventOutboxVo[]> => {
  return request({ url: '/automation/eventOutbox/list', method: 'get', params: query });
};

export const getEventOutbox = (id: number | string): AxiosPromise<AutoEventOutboxVo> => {
  return request({ url: '/automation/eventOutbox/' + id, method: 'get' });
};

export const redeliverEventOutbox = (id: number | string) => {
  return request({ url: `/automation/eventOutbox/${id}/redeliver`, method: 'post' });
};
