import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { LineWarehouseUserVO, LineWarehouseUserForm, LineWarehouseUserQuery } from '@/api/wms/lineWarehouseUser/types';

/**
 * 查询线边仓负责人配置列表
 * @param query
 * @returns {*}
 */

export const listLineWarehouseUser = (query?: LineWarehouseUserQuery): AxiosPromise<LineWarehouseUserVO[]> => {
  return request({
    url: '/wms/lineWarehouseUser/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询线边仓负责人配置详细
 * @param id
 */
export const getLineWarehouseUser = (id: string | number): AxiosPromise<LineWarehouseUserVO> => {
  return request({
    url: '/wms/lineWarehouseUser/' + id,
    method: 'get'
  });
};

/**
 * 新增线边仓负责人配置
 * @param data
 */
export const addLineWarehouseUser = (data: LineWarehouseUserForm) => {
  return request({
    url: '/wms/lineWarehouseUser',
    method: 'post',
    data: data
  });
};

/**
 * 修改线边仓负责人配置
 * @param data
 */
export const updateLineWarehouseUser = (data: LineWarehouseUserForm) => {
  return request({
    url: '/wms/lineWarehouseUser',
    method: 'put',
    data: data
  });
};

/**
 * 删除线边仓负责人配置
 * @param id
 */
export const delLineWarehouseUser = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/lineWarehouseUser/' + id,
    method: 'delete'
  });
};
