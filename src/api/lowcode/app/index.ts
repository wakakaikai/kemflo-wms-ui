import request from '@/utils/request';
import { AppForm, AppQuery, AppVO } from './types';
import { AxiosPromise } from 'axios';

/**
 * 查询应用列表
 * @param query 查询参数
 * @returns
 */
export function listApp(query?: AppQuery): AxiosPromise<AppVO[]> {
  return request({
    url: '/lowcode/app/list',
    method: 'get',
    params: query
  });
}

/**
 * 查询应用详细
 * @param id 应用id
 * @returns
 */
export function getApp(id: string | number): AxiosPromise<AppVO> {
  return request({
    url: '/lowcode/app/' + id,
    method: 'get'
  });
}

/**
 * 新增应用
 * @param data 表单数据
 * @returns
 */
export function addApp(data: AppForm) {
  return request({
    url: '/lowcode/app',
    method: 'post',
    data: data
  });
}

/**
 * 修改应用
 * @param data 表单数据
 * @returns
 */
export function updateApp(data: AppForm) {
  return request({
    url: '/lowcode/app',
    method: 'put',
    data: data
  });
}

/**
 * 删除应用
 * @param id 应用id
 * @returns
 */
export function delApp(id: string | number | Array<string | number>) {
  return request({
    url: '/lowcode/app/' + id,
    method: 'delete'
  });
}
