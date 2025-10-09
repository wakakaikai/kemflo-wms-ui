import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { NumberMaskVO, NumberMaskForm, NumberMaskQuery } from '@/api/mes/numberMask/types';

/**
 * 查询编号规则掩码对照列表
 * @param query
 * @returns {*}
 */

export const listNumberMask = (query?: NumberMaskQuery): AxiosPromise<NumberMaskVO[]> => {
  return request({
    url: '/mes/numberMask/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询编号规则掩码对照详细
 * @param id
 */
export const getNumberMask = (id: string | number): AxiosPromise<NumberMaskVO> => {
  return request({
    url: '/mes/numberMask/' + id,
    method: 'get'
  });
};

/**
 * 新增编号规则掩码对照
 * @param data
 */
export const addNumberMask = (data: NumberMaskForm) => {
  return request({
    url: '/mes/numberMask',
    method: 'post',
    data: data
  });
};

/**
 * 修改编号规则掩码对照
 * @param data
 */
export const updateNumberMask = (data: NumberMaskForm) => {
  return request({
    url: '/mes/numberMask',
    method: 'put',
    data: data
  });
};

/**
 * 删除编号规则掩码对照
 * @param id
 */
export const delNumberMask = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/numberMask/' + id,
    method: 'delete'
  });
};
