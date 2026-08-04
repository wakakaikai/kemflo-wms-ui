import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { DeviceCommandVO, DeviceCommandForm, DeviceCommandQuery } from '@/api/iot/deviceCommand/types';

export const listDeviceCommand = (query?: DeviceCommandQuery): AxiosPromise<DeviceCommandVO[]> => {
  return request({ url: '/iot/deviceCommand/list', method: 'get', params: query });
};

export const getDeviceCommand = (id: string | number): AxiosPromise<DeviceCommandVO> => {
  return request({ url: '/iot/deviceCommand/' + id, method: 'get' });
};

export const addDeviceCommand = (data: DeviceCommandForm) => {
  return request({ url: '/iot/deviceCommand', method: 'post', data });
};

export const updateDeviceCommand = (data: DeviceCommandForm) => {
  return request({ url: '/iot/deviceCommand', method: 'put', data });
};

export const delDeviceCommand = (id: string | number | Array<string | number>) => {
  return request({ url: '/iot/deviceCommand/' + id, method: 'delete' });
};
