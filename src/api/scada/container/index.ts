import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ContainerDiffQuery, ContainerDiffVO, ContainerMovementVO } from './types';
import { InventoryDetailQuery, InventoryDetailVO } from '@/api/wms/inventoryDetail/types';

/**
 * 查询容器库存明细
 */
export const listContainerInventory = (query?: InventoryDetailQuery): AxiosPromise<InventoryDetailVO[]> => {
  return request({
    url: '/wms/scada/container/inventory/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询容器进出差异
 */
export const listContainerDiff = (query?: ContainerDiffQuery): AxiosPromise<ContainerDiffVO[]> => {
  return request({
    url: '/wms/scada/container/diff',
    method: 'get',
    params: query
  });
};

/**
 * 查询容器移动明细
 */
export const listContainerMovement = (query?: ContainerDiffQuery): AxiosPromise<ContainerMovementVO[]> => {
  return request({
    url: '/wms/scada/container/movement/list',
    method: 'get',
    params: query
  });
};
