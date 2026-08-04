import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { DeviceEventVO, DeviceEventForm, DeviceEventQuery } from '@/api/iot/deviceEvent/types';

export const listDeviceEvent = (query?: DeviceEventQuery): AxiosPromise<DeviceEventVO[]> => {
  return request({ url: '/iot/deviceEvent/list', method: 'get', params: query });
};

export const getDeviceEvent = (id: string | number): AxiosPromise<DeviceEventVO> => {
  return request({ url: '/iot/deviceEvent/' + id, method: 'get' });
};

export const addDeviceEvent = (data: DeviceEventForm) => {
  return request({ url: '/iot/deviceEvent', method: 'post', data });
};

export const updateDeviceEvent = (data: DeviceEventForm) => {
  return request({ url: '/iot/deviceEvent', method: 'put', data });
};

export const delDeviceEvent = (id: string | number | Array<string | number>) => {
  return request({ url: '/iot/deviceEvent/' + id, method: 'delete' });
};
