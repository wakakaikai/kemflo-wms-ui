import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { DevicePointVO, DevicePointQuery } from '@/api/iot/devicePoint/types';

/**
 * 查询设备点位列表
 * @param query
 * @returns {*}
 */
export const listDevicePoint = (query?: DevicePointQuery): AxiosPromise<DevicePointVO[]> => {
  return request({
    url: '/iot/devicePoint/list',
    method: 'get',
    params: query
  });
};
