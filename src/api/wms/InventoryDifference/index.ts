import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { InventoryDiffVO, InventoryDiffQuery } from '@/api/wms/InventoryDifference/types';

/**
 * 查询库存差异列表
 * @param query
 * @returns {*}
 */
export const listInventoryDiff = (query?: InventoryDiffQuery): AxiosPromise<InventoryDiffVO[]> => {
  return request({
    url: '/wms/inventory/difference',
    method: 'get',
    params: query
  });
};
