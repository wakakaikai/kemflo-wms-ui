import request from '@/utils/request';
import type { AxiosPromise } from 'axios';
import type { QmsMaterialExceptionQuery, QmsMaterialExceptionVO } from './types';

/** 分页查询物料异常归档。 */
export function listMaterialException(query: QmsMaterialExceptionQuery): AxiosPromise<QmsMaterialExceptionVO[]> {
  return request({
    url: '/qms/materialException/list',
    method: 'get',
    params: query
  });
}

/** 查询物料异常归档详情。 */
export function getMaterialException(id: string | number): AxiosPromise<QmsMaterialExceptionVO> {
  return request({
    url: `/qms/materialException/${id}`,
    method: 'get'
  });
}
