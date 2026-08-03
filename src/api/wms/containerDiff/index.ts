import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ContainerDiffVO, ContainerDiffQuery } from '@/api/wms/containerDiff/types';

/**
 * 查询容器进出差异列表
 * @param query
 */
export const listContainerDiff = (query?: ContainerDiffQuery): AxiosPromise<ContainerDiffVO[]> => {
  return request({
    url: '/wms/inventoryMovement/container/diff',
    method: 'get',
    params: query
  });
};
