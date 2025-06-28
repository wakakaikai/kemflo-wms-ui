import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { WarehouseTemplateVO, WarehouseTemplateForm, WarehouseTemplateQuery } from '@/api/wms/warehouseTemplate/types';

/**
 * 查询仓库模板列表
 * @param query
 * @returns {*}
 */

export const listWarehouseTemplate = (query?: WarehouseTemplateQuery): AxiosPromise<WarehouseTemplateVO[]> => {
  return request({
    url: '/wms/warehouseTemplate/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询仓库模板详细
 * @param id
 */
export const getWarehouseTemplate = (id: string | number): AxiosPromise<WarehouseTemplateVO> => {
  return request({
    url: '/wms/warehouseTemplate/' + id,
    method: 'get'
  });
};

/**
 * 新增仓库模板
 * @param data
 */
export const addWarehouseTemplate = (data: WarehouseTemplateForm) => {
  return request({
    url: '/wms/warehouseTemplate',
    method: 'post',
    data: data
  });
};

/**
 * 修改仓库模板
 * @param data
 */
export const updateWarehouseTemplate = (data: WarehouseTemplateForm) => {
  return request({
    url: '/wms/warehouseTemplate',
    method: 'put',
    data: data
  });
};

/**
 * 删除仓库模板
 * @param id
 */
export const delWarehouseTemplate = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/warehouseTemplate/' + id,
    method: 'delete'
  });
};
