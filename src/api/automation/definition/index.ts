import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { AutoDefinitionQuery, AutoDefinitionVo, AutoDefinitionForm } from '@/api/automation/definition/types';

export const listDefinition = (query: AutoDefinitionQuery): AxiosPromise<AutoDefinitionVo[]> => {
  return request({ url: '/automation/definition/list', method: 'get', params: query });
};

export const getDefinition = (id: number | string): AxiosPromise<AutoDefinitionVo> => {
  return request({ url: '/automation/definition/' + id, method: 'get' });
};

export const addDefinition = (data: AutoDefinitionForm) => {
  return request({ url: '/automation/definition', method: 'post', data });
};

export const updateDefinition = (data: AutoDefinitionForm) => {
  return request({ url: '/automation/definition', method: 'put', data });
};

export const delDefinition = (id: number | string | Array<number | string>) => {
  return request({ url: '/automation/definition/' + id, method: 'delete' });
};

export const publishDefinition = (id: number | string) => {
  return request({ url: `/automation/definition/${id}/publish`, method: 'post' });
};

export const disableDefinition = (id: number | string) => {
  return request({ url: `/automation/definition/${id}/disable`, method: 'post' });
};

export const archiveDefinition = (id: number | string) => {
  return request({ url: `/automation/definition/${id}/archive`, method: 'post' });
};
