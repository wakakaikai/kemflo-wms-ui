import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { CostCenterMoveTypeVO, CostCenterMoveTypeForm, CostCenterMoveTypeQuery } from '@/api/wms/costCenterMoveType/types';

/**
 * 查询成本中心移动类型列表
 * @param query
 * @returns {*}
 */

export const listCostCenterMoveType = (query?: CostCenterMoveTypeQuery): AxiosPromise<CostCenterMoveTypeVO[]> => {
  return request({
    url: '/wms/costCenterMoveType/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询成本中心移动类型详细
 * @param id
 */
export const getCostCenterMoveType = (id: string | number): AxiosPromise<CostCenterMoveTypeVO> => {
  return request({
    url: '/wms/costCenterMoveType/' + id,
    method: 'get'
  });
};

/**
 * 新增成本中心移动类型
 * @param data
 */
export const addCostCenterMoveType = (data: CostCenterMoveTypeForm) => {
  return request({
    url: '/wms/costCenterMoveType',
    method: 'post',
    data: data
  });
};

/**
 * 修改成本中心移动类型
 * @param data
 */
export const updateCostCenterMoveType = (data: CostCenterMoveTypeForm) => {
  return request({
    url: '/wms/costCenterMoveType',
    method: 'put',
    data: data
  });
};

/**
 * 删除成本中心移动类型
 * @param id
 */
export const delCostCenterMoveType = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/costCenterMoveType/' + id,
    method: 'delete'
  });
};
