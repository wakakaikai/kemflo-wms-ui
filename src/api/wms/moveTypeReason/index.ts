import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { MoveTypeReasonVO, MoveTypeReasonForm, MoveTypeReasonQuery } from '@/api/wms/moveTypeReason/types';

/**
 * 查询移动原因列表
 * @param query
 * @returns {*}
 */

export const listMoveTypeReason = (query?: MoveTypeReasonQuery): AxiosPromise<MoveTypeReasonVO[]> => {
  return request({
    url: '/wms/moveTypeReason/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询移动原因详细
 * @param id
 */
export const getMoveTypeReason = (id: string | number): AxiosPromise<MoveTypeReasonVO> => {
  return request({
    url: '/wms/moveTypeReason/' + id,
    method: 'get'
  });
};

/**
 * 新增移动原因
 * @param data
 */
export const addMoveTypeReason = (data: MoveTypeReasonForm) => {
  return request({
    url: '/wms/moveTypeReason',
    method: 'post',
    data: data
  });
};

/**
 * 修改移动原因
 * @param data
 */
export const updateMoveTypeReason = (data: MoveTypeReasonForm) => {
  return request({
    url: '/wms/moveTypeReason',
    method: 'put',
    data: data
  });
};

/**
 * 删除移动原因
 * @param id
 */
export const delMoveTypeReason = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/moveTypeReason/' + id,
    method: 'delete'
  });
};
