import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ScCollectDeviceVO, ScCollectDeviceForm, ScCollectDeviceQuery } from './types';

export const listScCollectDevice = (query?: ScCollectDeviceQuery): AxiosPromise<ScCollectDeviceVO[]> => {
  return request({
    url: '/wms/dataCollection/device/list',
    method: 'get',
    params: query
  });
};

export const getScCollectDevice = (id: string | number): AxiosPromise<ScCollectDeviceVO> => {
  return request({
    url: '/wms/dataCollection/device/' + id,
    method: 'get'
  });
};

export const addScCollectDevice = (data: ScCollectDeviceForm) => {
  return request({
    url: '/wms/dataCollection/device',
    method: 'post',
    data: data
  });
};

export const updateScCollectDevice = (data: ScCollectDeviceForm) => {
  return request({
    url: '/wms/dataCollection/device',
    method: 'put',
    data: data
  });
};

export const delScCollectDevice = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/dataCollection/device/' + id,
    method: 'delete'
  });
};

export const testScCollectDeviceConnection = (id: string | number): AxiosPromise<boolean> => {
  return request({
    url: '/wms/dataCollection/device/testConnection/' + id,
    method: 'post'
  });
};

export const readScCollectDeviceParams = (id: string | number): AxiosPromise<Record<string, any>> => {
  return request({
    url: '/wms/dataCollection/device/read/' + id,
    method: 'get'
  });
};
