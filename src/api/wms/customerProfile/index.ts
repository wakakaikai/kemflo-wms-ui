import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { CustomerProfileVO, CustomerProfileForm, CustomerProfileQuery } from '@/api/wms/customerProfile/types';
import { ShippingCustomerNoticeVO } from '@/api/wms/shippingCustomerNotice/types';

/**
 * 查询客户档案列表
 * @param query
 * @returns {*}
 */

export const listCustomerProfile = (query?: CustomerProfileQuery): AxiosPromise<CustomerProfileVO[]> => {
  return request({
    url: '/wms/customerProfile/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询客户档案详细
 * @param id 主键拼接字符串(公司-客户代码)
 */
export const getCustomerProfile = (id: string | number): AxiosPromise<CustomerProfileVO> => {
  return request({
    url: '/wms/customerProfile/' + id,
    method: 'get'
  });
};

/**
 * 新增客户档案
 * @param data
 */
export const addCustomerProfile = (data: CustomerProfileForm) => {
  return request({
    url: '/wms/customerProfile',
    method: 'post',
    data: data
  });
};

/**
 * 修改客户档案
 * @param data
 */
export const updateCustomerProfile = (data: CustomerProfileForm) => {
  return request({
    url: '/wms/customerProfile',
    method: 'put',
    data: data
  });
};

/**
 * 删除客户档案
 * @param bukrs
 */
export const delCustomerProfile = (ids: string | number | Array<CustomerProfileForm>) => {
  return request({
    url: '/wms/customerProfile/' + ids,
    method: 'delete'
  });
};
