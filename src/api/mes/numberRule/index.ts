import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { NumberRuleVO, NumberRuleForm, NumberRuleQuery } from '@/api/mes/numberRule/types';

/**
 * 查询编号规则定义明细列表
 * @param query
 * @returns {*}
 */

export const listNumberRule = (query?: NumberRuleQuery): AxiosPromise<NumberRuleVO[]> => {
  return request({
    url: '/mes/numberRule/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询编号规则定义明细详细
 * @param id
 */
export const getNumberRule = (id: string | number): AxiosPromise<NumberRuleVO> => {
  return request({
    url: '/mes/numberRule/' + id,
    method: 'get'
  });
};

/**
 * 新增编号规则定义明细
 * @param data
 */
export const addNumberRule = (data: NumberRuleForm) => {
  return request({
    url: '/mes/numberRule',
    method: 'post',
    data: data
  });
};

/**
 * 修改编号规则定义明细
 * @param data
 */
export const updateNumberRule = (data: NumberRuleForm) => {
  return request({
    url: '/mes/numberRule',
    method: 'put',
    data: data
  });
};

/**
 * 删除编号规则定义明细
 * @param id
 */
export const delNumberRule = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/numberRule/' + id,
    method: 'delete'
  });
};
