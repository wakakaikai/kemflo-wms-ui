import request from '@/utils/request';
import { RecordForm, RecordQuery, RecordVO } from './types';
import { AxiosPromise } from 'axios';

/**
 * 查询记录列表
 * @param query 查询参数
 * @returns
 */
export function listRecord(query?: RecordQuery): AxiosPromise<RecordVO[]> {
  return request({
    url: '/lowcode/record/list',
    method: 'get',
    params: query
  });
}

/**
 * 查询记录详细
 * @param id 记录id
 * @returns
 */
export function getRecord(id: string | number): AxiosPromise<RecordVO> {
  return request({
    url: '/lowcode/record/' + id,
    method: 'get'
  });
}

/**
 * 新增记录
 * @param data 表单数据
 * @returns
 */
export function addRecord(data: RecordForm) {
  return request({
    url: '/lowcode/record',
    method: 'post',
    data: data
  });
}

/**
 * 修改记录
 * @param data 表单数据
 * @returns
 */
export function updateRecord(data: RecordForm) {
  return request({
    url: '/lowcode/record',
    method: 'put',
    data: data
  });
}

/**
 * 删除记录
 * @param id 记录id
 * @returns
 */
export function delRecord(id: string | number | Array<string | number>) {
  return request({
    url: '/lowcode/record/' + id,
    method: 'delete'
  });
}
