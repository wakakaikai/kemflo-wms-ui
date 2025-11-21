import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { CustomerVO, CustomerForm, CustomerQuery } from '@/api/wms/customer/types';

/**
 * 查询客户档案列表
 * @param query
 * @returns {*}
 */

export const listCustomer = (query?: CustomerQuery): AxiosPromise<CustomerVO[]> => {
  return request({
    url: '/wms/customer/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询客户档案详细
 * @param id
 */
export const getCustomer = (id: string | number): AxiosPromise<CustomerVO> => {
  return request({
    url: '/wms/customer/' + id,
    method: 'get'
  });
};

/**
 * 新增客户档案
 * @param data
 */
export const addCustomer = (data: CustomerForm) => {
  return request({
    url: '/wms/customer',
    method: 'post',
    data: data
  });
};

/**
 * 修改客户档案
 * @param data
 */
export const updateCustomer = (data: CustomerForm) => {
  return request({
    url: '/wms/customer',
    method: 'put',
    data: data
  });
};

/**
 * 删除客户档案
 * @param id
 */
export const delCustomer = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/customer/' + id,
    method: 'delete'
  });
};
