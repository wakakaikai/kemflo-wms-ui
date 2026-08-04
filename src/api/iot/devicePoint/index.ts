import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { DevicePointVO, DevicePointForm, DevicePointQuery } from '@/api/iot/devicePoint/types';

export const listDevicePoint = (query?: DevicePointQuery): AxiosPromise<DevicePointVO[]> => {
  return request({ url: '/iot/devicePoint/list', method: 'get', params: query });
};

export const getDevicePoint = (id: string | number): AxiosPromise<DevicePointVO> => {
  return request({ url: '/iot/devicePoint/' + id, method: 'get' });
};

export const addDevicePoint = (data: DevicePointForm) => {
  return request({ url: '/iot/devicePoint', method: 'post', data });
};

export const updateDevicePoint = (data: DevicePointForm) => {
  return request({ url: '/iot/devicePoint', method: 'put', data });
};

export const delDevicePoint = (id: string | number | Array<string | number>) => {
  return request({ url: '/iot/devicePoint/' + id, method: 'delete' });
};
