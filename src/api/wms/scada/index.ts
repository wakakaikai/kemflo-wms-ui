import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PackingVO, PackingForm, PackingQuery, PackingExtVO } from '@/api/wms/packing/types';

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
