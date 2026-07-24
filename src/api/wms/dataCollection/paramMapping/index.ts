import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ScCollectParamMappingVO, ScCollectParamMappingForm, ScCollectParamMappingQuery } from './types';

export const listScCollectParamMapping = (query?: ScCollectParamMappingQuery): AxiosPromise<ScCollectParamMappingVO[]> => {
  return request({
    url: '/wms/dataCollection/paramMapping/list',
    method: 'get',
    params: query
  });
};

export const getScCollectParamMapping = (id: string | number): AxiosPromise<ScCollectParamMappingVO> => {
  return request({
    url: '/wms/dataCollection/paramMapping/' + id,
    method: 'get'
  });
};

export const addScCollectParamMapping = (data: ScCollectParamMappingForm) => {
  return request({
    url: '/wms/dataCollection/paramMapping',
    method: 'post',
    data: data
  });
};

export const updateScCollectParamMapping = (data: ScCollectParamMappingForm) => {
  return request({
    url: '/wms/dataCollection/paramMapping',
    method: 'put',
    data: data
  });
};

export const delScCollectParamMapping = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/dataCollection/paramMapping/' + id,
    method: 'delete'
  });
};
