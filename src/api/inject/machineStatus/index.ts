import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import type { MachineStatusDashboardVO, MachineStatusQuery } from './types';

export const getMachineNames = (): AxiosPromise<string[]> => {
  return request({
    url: '/inject/machine-status/machines',
    method: 'get'
  });
};

export const getMachineStatusDashboard = (query: MachineStatusQuery): AxiosPromise<MachineStatusDashboardVO> => {
  return request({
    url: '/inject/machine-status/dashboard',
    method: 'get',
    params: query
  });
};
