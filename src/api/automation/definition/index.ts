import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { AutoDefinitionQuery, AutoDefinitionVo, AutoDefinitionForm } from '@/api/automation/definition/types';

export const listDefinition = (query: AutoDefinitionQuery): AxiosPromise<AutoDefinitionVo[]> => {
  return request({ url: '/automation/definition/list', method: 'get', params: query });
};

export const getDefinition = (id: number | string): AxiosPromise<AutoDefinitionVo> => {
  return request({ url: '/automation/definition/' + id, method: 'get' });
};

export const getDefinitionDesign = (id: number | string): AxiosPromise<{ designJson?: string }> => {
  return request({ url: `/automation/definition/${id}/design`, method: 'post' });
};

export const saveDefinitionDesign = (id: number | string, designJson: string): AxiosPromise<number | string> => {
  return request({ url: `/automation/definition/${id}/design`, method: 'put', data: { designJson } });
};

export const addDefinition = (data: AutoDefinitionForm): AxiosPromise<AutoDefinitionVo> => {
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

export const enableDefinition = (id: number | string) => {
  return request({ url: `/automation/definition/${id}/enable`, method: 'post' });
};

export const disableDefinition = (id: number | string) => {
  return request({ url: `/automation/definition/${id}/disable`, method: 'post' });
};

export const updateDefinitionEnabled = (id: number | string, enabled: number) => {
  return request({ url: `/automation/definition/${id}/enabled/${enabled}`, method: 'post' });
};

export const archiveDefinition = (id: number | string) => {
  return request({ url: `/automation/definition/${id}/archive`, method: 'post' });
};
