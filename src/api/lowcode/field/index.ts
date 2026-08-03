import request from '@/utils/request';
import { FieldForm, FieldQuery, FieldVO } from './types';
import { AxiosPromise } from 'axios';

/**
 * 查询字段列表
 * @param query 查询参数
 * @returns
 */
export function listField(query?: FieldQuery): AxiosPromise<FieldVO[]> {
  return request({
    url: '/lowcode/field/list',
    method: 'get',
    params: query
  });
}

/**
 * 查询字段详细
 * @param id 字段id
 * @returns
 */
export function getField(id: string | number): AxiosPromise<FieldVO> {
  return request({
    url: '/lowcode/field/' + id,
    method: 'get'
  });
}

/**
 * 新增字段
 * @param data 表单数据
 * @returns
 */
export function addField(data: FieldForm) {
  return request({
    url: '/lowcode/field',
    method: 'post',
    data: data
  });
}

/**
 * 修改字段
 * @param data 表单数据
 * @returns
 */
export function updateField(data: FieldForm) {
  return request({
    url: '/lowcode/field',
    method: 'put',
    data: data
  });
}

/**
 * 删除字段
 * @param id 字段id
 * @returns
 */
export function delField(id: string | number | Array<string | number>) {
  return request({
    url: '/lowcode/field/' + id,
    method: 'delete'
  });
}
