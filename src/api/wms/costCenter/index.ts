import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { CostCenterVO, CostCenterForm, CostCenterQuery } from '@/api/wms/costCenter/types';

/**
 * 查询成本中心列表
 * @param query
 * @returns {*}
 */

export const listCostCenter = (query?: CostCenterQuery): AxiosPromise<CostCenterVO[]> => {
  return request({
    url: '/wms/costCenter/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询成本中心详细
 * @param id
 */
export const getCostCenter = (id: string | number): AxiosPromise<CostCenterVO> => {
  return request({
    url: '/wms/costCenter/' + id,
    method: 'get'
  });
};

/**
 * 新增成本中心
 * @param data
 */
export const addCostCenter = (data: CostCenterForm) => {
  return request({
    url: '/wms/costCenter',
    method: 'post',
    data: data
  });
};

/**
 * 修改成本中心
 * @param data
 */
export const updateCostCenter = (data: CostCenterForm) => {
  return request({
    url: '/wms/costCenter',
    method: 'put',
    data: data
  });
};

/**
 * 删除成本中心
 * @param id
 */
export const delCostCenter = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/costCenter/' + id,
    method: 'delete'
  });
};
