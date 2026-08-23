import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { DeviceVO, DeviceForm, DeviceQuery, DeviceCopyForm } from './types';

export const listDevice = (query?: DeviceQuery): AxiosPromise<DeviceVO[]> => {
  return request({ url: '/iot/device/list', method: 'get', params: query });
};

export const getDevice = (id: string | number): AxiosPromise<DeviceVO> => {
  return request({ url: '/iot/device/' + id, method: 'get' });
};

export const addDevice = (data: DeviceForm) => {
  return request({ url: '/iot/device', method: 'post', data });
};

export const updateDevice = (data: DeviceForm) => {
  return request({ url: '/iot/device', method: 'put', data });
};

export const copyDevice = (data: DeviceCopyForm): AxiosPromise<DeviceVO> => {
  return request({ url: '/iot/device/copy', method: 'post', data });
};

export const delDevice = (id: string | number | Array<string | number>) => {
  return request({ url: '/iot/device/' + id, method: 'delete' });
};

export const testDeviceConnection = (id: string | number): AxiosPromise<boolean> => {
  return request({ url: '/iot/device/testConnection/' + id, method: 'post' });
};

export const readDevicePoints = (id: string | number): AxiosPromise<PointReadItem[]> => {
  return request({ url: '/iot/device/read/' + id, method: 'get' });
};

/** TCP Client：整帧 JSON + 映射点位 */
export const readDeviceTcpPoints = (id: string | number): AxiosPromise<TcpCollectResult> => {
  return request({ url: '/iot/device/readTcp/' + id, method: 'get' });
};

export interface PointReadItem {
  pointCode: string;
  pointName?: string;
  tagAddress?: string;
  normalizedAddress?: string;
  rawRegisters?: string;
  byteOrderUsed?: string;
  value?: any;
  success?: boolean;
  error?: string;
  quality?: string;
  /** 前端附加：用于数值 × 系数 */
  dataType?: string;
  scaleFactor?: number;
}

export interface TcpCollectResult {
  rawPayload?: any;
  points?: PointReadItem[];
}
