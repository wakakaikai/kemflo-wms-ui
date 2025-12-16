import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { InventoryDetailVO, InventoryDetailForm, InventoryDetailQuery } from '@/api/wms/inventoryDetail/types';

/**
 * 查询库存明细记录列表
 * @param query
 * @returns {*}
 */

export const listInventoryDiff = (query?: InventoryDetailQuery): AxiosPromise<InventoryDetailVO[]> => {
  return request({
    url: '/wms/inventory/difference',
    method: 'get',
    params: query
  });
};
