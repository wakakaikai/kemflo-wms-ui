import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { InventoryDetailVO, InventoryDetailForm } from '@/api/wms/inventoryDetail/types';

/**
 * 查询容器列表
 * @param query
 */
export const listContainerInOut = (query?: any): AxiosPromise<InventoryDetailVO[]> => {
  return request({
    url: '/wms/inventoryDetail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询库存明细记录详细
 * @param id
 */
export const getInventoryDetail = (id: string | number): AxiosPromise<InventoryDetailVO> => {
  return request({
    url: '/wms/inventoryDetail/' + id,
    method: 'get'
  });
};

/**
 * 容器入库
 * @param data
 */
export const containerInbound = (data: InventoryDetailForm) => {
  return request({
    url: '/wms/inventoryDetail/container/inbound',
    method: 'post',
    data: data
  });
};

/**
 * 容器出库
 * @param data
 */
export const containerOutbound = (data: InventoryDetailForm) => {
  return request({
    url: '/wms/inventoryDetail/container/outbound',
    method: 'put',
    data: data
  });
};