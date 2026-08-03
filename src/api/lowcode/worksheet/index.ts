import request from '@/utils/request';
import { WorksheetForm, WorksheetQuery, WorksheetVO } from './types';
import { AxiosPromise } from 'axios';

/**
 * 查询工作表列表
 * @param query 查询参数
 * @returns
 */
export function listWorksheet(query?: WorksheetQuery): AxiosPromise<WorksheetVO[]> {
  return request({
    url: '/lowcode/worksheet/list',
    method: 'get',
    params: query
  });
}

/**
 * 查询工作表详细
 * @param id 工作表id
 * @returns
 */
export function getWorksheet(id: string | number): AxiosPromise<WorksheetVO> {
  return request({
    url: '/lowcode/worksheet/' + id,
    method: 'get'
  });
}

/**
 * 新增工作表
 * @param data 表单数据
 * @returns
 */
export function addWorksheet(data: WorksheetForm) {
  return request({
    url: '/lowcode/worksheet',
    method: 'post',
    data: data
  });
}

/**
 * 修改工作表
 * @param data 表单数据
 * @returns
 */
export function updateWorksheet(data: WorksheetForm) {
  return request({
    url: '/lowcode/worksheet',
    method: 'put',
    data: data
  });
}

/**
 * 删除工作表
 * @param id 工作表id
 * @returns
 */
export function delWorksheet(id: string | number | Array<string | number>) {
  return request({
    url: '/lowcode/worksheet/' + id,
    method: 'delete'
  });
}
