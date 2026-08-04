import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { DeviceShadowVO, DeviceShadowForm, DeviceShadowQuery } from '@/api/iot/deviceShadow/types';

export const listDeviceShadow = (query?: DeviceShadowQuery): AxiosPromise<DeviceShadowVO[]> => {
  return request({ url: '/iot/deviceShadow/list', method: 'get', params: query });
};

export const getDeviceShadow = (id: string | number): AxiosPromise<DeviceShadowVO> => {
  return request({ url: '/iot/deviceShadow/' + id, method: 'get' });
};

export const addDeviceShadow = (data: DeviceShadowForm) => {
  return request({ url: '/iot/deviceShadow', method: 'post', data });
};

export const updateDeviceShadow = (data: DeviceShadowForm) => {
  return request({ url: '/iot/deviceShadow', method: 'put', data });
};

export const delDeviceShadow = (id: string | number | Array<string | number>) => {
  return request({ url: '/iot/deviceShadow/' + id, method: 'delete' });
};
