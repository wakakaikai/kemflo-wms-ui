import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ProductTraceQuery, ProductTraceVO } from '@/api/mes/trace/types';

/**
 * ????
 * @param query ????
 */
export const traceSfc = (query: ProductTraceQuery): AxiosPromise<ProductTraceVO[]> => {
  return request({
    url: '/wms/report/productTrace/tranceSfc',
    method: 'post',
    data: query
  });
};
