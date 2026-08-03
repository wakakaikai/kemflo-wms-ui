import request from '@/utils/request';
import { RecordIndexForm, RecordIndexQuery, RecordIndexVO } from './types';
import { AxiosPromise } from 'axios';

/**
 * 查询记录索引列表
 * @param query 查询参数
 * @returns
 */
export function listRecordIndex(query?: RecordIndexQuery): AxiosPromise<RecordIndexVO[]> {
  return request({
    url: '/lowcode/recordIndex/list',
    method: 'get',
    params: query
  });
}

/**
 * 查询记录索引详细
 * @param id 索引id
 * @returns
 */
export function getRecordIndex(id: string | number): AxiosPromise<RecordIndexVO> {
  return request({
    url: '/lowcode/recordIndex/' + id,
    method: 'get'
  });
}

/**
 * 新增记录索引
 * @param data 表单数据
 * @returns
 */
export function addRecordIndex(data: RecordIndexForm) {
  return request({
    url: '/lowcode/recordIndex',
    method: 'post',
    data: data
  });
}

/**
 * 修改记录索引
 * @param data 表单数据
 * @returns
 */
export function updateRecordIndex(data: RecordIndexForm) {
  return request({
    url: '/lowcode/recordIndex',
    method: 'put',
    data: data
  });
}

/**
 * 删除记录索引
 * @param id 索引id
 * @returns
 */
export function delRecordIndex(id: string | number | Array<string | number>) {
  return request({
    url: '/lowcode/recordIndex/' + id,
    method: 'delete'
  });
}
