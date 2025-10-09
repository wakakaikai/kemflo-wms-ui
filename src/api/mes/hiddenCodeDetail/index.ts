import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { HiddenCodeDetailVO, HiddenCodeDetailForm, HiddenCodeDetailQuery } from '@/api/mes/hiddenCodeDetail/types';

/**
 * 查询隐码变量详情对照列表
 * @param query
 * @returns {*}
 */

export const listHiddenCodeDetail = (query?: HiddenCodeDetailQuery): AxiosPromise<HiddenCodeDetailVO[]> => {
  return request({
    url: '/mes/hiddenCodeDetail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询隐码变量详情对照详细
 * @param id
 */
export const getHiddenCodeDetail = (id: string | number): AxiosPromise<HiddenCodeDetailVO> => {
  return request({
    url: '/mes/hiddenCodeDetail/' + id,
    method: 'get'
  });
};

/**
 * 新增隐码变量详情对照
 * @param data
 */
export const addHiddenCodeDetail = (data: HiddenCodeDetailForm) => {
  return request({
    url: '/mes/hiddenCodeDetail',
    method: 'post',
    data: data
  });
};

/**
 * 修改隐码变量详情对照
 * @param data
 */
export const updateHiddenCodeDetail = (data: HiddenCodeDetailForm) => {
  return request({
    url: '/mes/hiddenCodeDetail',
    method: 'put',
    data: data
  });
};

/**
 * 删除隐码变量详情对照
 * @param id
 */
export const delHiddenCodeDetail = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/hiddenCodeDetail/' + id,
    method: 'delete'
  });
};
