import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { SupplierVO, SupplierForm, SupplierQuery } from '@/api/wms/supplier/types';

/**
 * 查询供应商档案列表
 * @param query
 * @returns {*}
 */

export const listSupplier = (query?: SupplierQuery): AxiosPromise<SupplierVO[]> => {
  return request({
    url: '/wms/supplier/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询供应商档案详细
 * @param id
 */
export const getSupplier = (id: string | number): AxiosPromise<SupplierVO> => {
  return request({
    url: '/wms/supplier/' + id,
    method: 'get'
  });
};

/**
 * 新增供应商档案
 * @param data
 */
export const addSupplier = (data: SupplierForm) => {
  return request({
    url: '/wms/supplier',
    method: 'post',
    data: data
  });
};

/**
 * 修改供应商档案
 * @param data
 */
export const updateSupplier = (data: SupplierForm) => {
  return request({
    url: '/wms/supplier',
    method: 'put',
    data: data
  });
};

/**
 * 删除供应商档案
 * @param id
 */
export const delSupplier = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/supplier/' + id,
    method: 'delete'
  });
};
