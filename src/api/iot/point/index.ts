import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PointVO, PointForm, PointQuery } from './types';

export const listPoint = (query?: PointQuery): AxiosPromise<PointVO[]> => {
  return request({ url: '/iot/point/list', method: 'get', params: query });
};

export const getPoint = (id: string | number): AxiosPromise<PointVO> => {
  return request({ url: '/iot/point/' + id, method: 'get' });
};

export const addPoint = (data: PointForm) => {
  return request({ url: '/iot/point', method: 'post', data });
};

export const updatePoint = (data: PointForm) => {
  return request({ url: '/iot/point', method: 'put', data });
};

export const delPoint = (id: string | number | Array<string | number>) => {
  return request({ url: '/iot/point/' + id, method: 'delete' });
};
