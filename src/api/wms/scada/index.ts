import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PackingQuery, PackingVO } from '@/api/wms/packing/types';

/**
 * 查询打包记录列表
 * @param query
 * @returns {*}
 */

export const packingScada = (query?: PackingQuery): AxiosPromise<PackingVO[]> => {
  return request({
    url: '/wms/scada/packing',
    method: 'get',
    params: query
  });
};

/**
 * 查询库存周转区待拣货列表
 * @param data
 * @returns {*}
 */

export const queryPendingPickingList = (data: any) => {
  return request({
    url: '/wms/scada/pendingPicking/list',
    method: 'post',
    data: data
  });
};
