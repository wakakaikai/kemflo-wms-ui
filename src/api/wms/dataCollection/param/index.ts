import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ScCollectParamVO, ScCollectParamForm, ScCollectParamQuery } from './types';

export const listScCollectParam = (query?: ScCollectParamQuery): AxiosPromise<ScCollectParamVO[]> => {
  return request({
    url: '/wms/dataCollection/param/list',
    method: 'get',
    params: query
  });
};

export const getScCollectParam = (id: string | number): AxiosPromise<ScCollectParamVO> => {
  return request({
    url: '/wms/dataCollection/param/' + id,
    method: 'get'
  });
};

export const addScCollectParam = (data: ScCollectParamForm) => {
  return request({
    url: '/wms/dataCollection/param',
    method: 'post',
    data: data
  });
};

export const updateScCollectParam = (data: ScCollectParamForm) => {
  return request({
    url: '/wms/dataCollection/param',
    method: 'put',
    data: data
  });
};

export const delScCollectParam = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/dataCollection/param/' + id,
    method: 'delete'
  });
};
