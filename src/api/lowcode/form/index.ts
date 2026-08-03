import request from '@/utils/request';
import { FormForm, FormQuery, FormVO } from './types';
import { AxiosPromise } from 'axios';

/**
 * 查询表单列表
 * @param query 查询参数
 * @returns
 */
export function listForm(query?: FormQuery): AxiosPromise<FormVO[]> {
  return request({
    url: '/lowcode/form/list',
    method: 'get',
    params: query
  });
}

/**
 * 查询表单详细
 * @param id 表单id
 * @returns
 */
export function getForm(id: string | number): AxiosPromise<FormVO> {
  return request({
    url: '/lowcode/form/' + id,
    method: 'get'
  });
}

/**
 * 新增表单
 * @param data 表单数据
 * @returns
 */
export function addForm(data: FormForm) {
  return request({
    url: '/lowcode/form',
    method: 'post',
    data: data
  });
}

/**
 * 修改表单
 * @param data 表单数据
 * @returns
 */
export function updateForm(data: FormForm) {
  return request({
    url: '/lowcode/form',
    method: 'put',
    data: data
  });
}

/**
 * 删除表单
 * @param id 表单id
 * @returns
 */
export function delForm(id: string | number | Array<string | number>) {
  return request({
    url: '/lowcode/form/' + id,
    method: 'delete'
  });
}
