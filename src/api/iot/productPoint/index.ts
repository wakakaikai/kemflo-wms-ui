import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ProductPointVO, ProductPointForm, ProductPointQuery } from '@/api/iot/productPoint/types';

/**
 * 查询产品物模型列表
 * @param query
 * @returns {*}
 */
export const listProductPoint = (query?: ProductPointQuery): AxiosPromise<ProductPointVO[]> => {
  return request({
    url: '/iot/productPoint/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询产品物模型详细
 * @param id
 */
export const getProductPoint = (id: string | number): AxiosPromise<ProductPointVO> => {
  return request({
    url: '/iot/productPoint/' + id,
    method: 'get'
  });
};

/**
 * 新增产品物模型
 * @param data
 */
export const addProductPoint = (data: ProductPointForm) => {
  return request({
    url: '/iot/productPoint',
    method: 'post',
    data: data
  });
};

/**
 * 修改产品物模型
 * @param data
 */
export const updateProductPoint = (data: ProductPointForm) => {
  return request({
    url: '/iot/productPoint',
    method: 'put',
    data: data
  });
};

/**
 * 删除产品物模型
 * @param id
 */
export const delProductPoint = (id: string | number | Array<string | number>) => {
  return request({
    url: '/iot/productPoint/' + id,
    method: 'delete'
  });
};
