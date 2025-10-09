import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { HiddenCodeVO, HiddenCodeForm, HiddenCodeQuery } from '@/api/mes/hiddenCode/types';

/**
 * 查询隐码变量对照列表
 * @param query
 * @returns {*}
 */

export const listHiddenCode = (query?: HiddenCodeQuery): AxiosPromise<HiddenCodeVO[]> => {
  return request({
    url: '/mes/hiddenCode/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询隐码变量对照详细
 * @param id
 */
export const getHiddenCode = (id: string | number): AxiosPromise<HiddenCodeVO> => {
  return request({
    url: '/mes/hiddenCode/' + id,
    method: 'get'
  });
};

/**
 * 新增隐码变量对照
 * @param data
 */
export const addHiddenCode = (data: HiddenCodeForm) => {
  return request({
    url: '/mes/hiddenCode',
    method: 'post',
    data: data
  });
};

/**
 * 修改隐码变量对照
 * @param data
 */
export const updateHiddenCode = (data: HiddenCodeForm) => {
  return request({
    url: '/mes/hiddenCode',
    method: 'put',
    data: data
  });
};

/**
 * 删除隐码变量对照
 * @param id
 */
export const delHiddenCode = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/hiddenCode/' + id,
    method: 'delete'
  });
};
