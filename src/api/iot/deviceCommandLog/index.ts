import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { DeviceCommandLogVO, DeviceCommandLogQuery } from '@/api/iot/deviceCommandLog/types';

export const listDeviceCommandLog = (query?: DeviceCommandLogQuery): AxiosPromise<DeviceCommandLogVO[]> => {
  return request({ url: '/iot/deviceCommandLog/list', method: 'get', params: query });
};

export const getDeviceCommandLog = (id: string | number): AxiosPromise<DeviceCommandLogVO> => {
  return request({ url: '/iot/deviceCommandLog/' + id, method: 'get' });
};

export const delDeviceCommandLog = (id: string | number | Array<string | number>) => {
  return request({ url: '/iot/deviceCommandLog/' + id, method: 'delete' });
};
