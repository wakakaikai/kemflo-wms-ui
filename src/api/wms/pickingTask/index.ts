import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PickingTaskVO, PickingTaskForm, PickingTaskQuery } from '@/api/wms/pickingTask/types';

/**
 * 查询拣货任务列表
 * @param query
 * @returns {*}
 */

export const listPickingTask = (query?: PickingTaskQuery): AxiosPromise<PickingTaskVO[]> => {
  return request({
    url: '/wms/pickingTask/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询拣货任务详细
 * @param id
 */
export const getPickingTask = (id: string | number): AxiosPromise<PickingTaskVO> => {
  return request({
    url: '/wms/pickingTask/' + id,
    method: 'get'
  });
};

/**
 * 新增拣货任务
 * @param data
 */
export const addPickingTask = (data: PickingTaskForm) => {
  return request({
    url: '/wms/pickingTask',
    method: 'post',
    data: data
  });
};

/**
 * 修改拣货任务
 * @param data
 */
export const updatePickingTask = (data: PickingTaskForm) => {
  return request({
    url: '/wms/pickingTask',
    method: 'put',
    data: data
  });
};

/**
 * 删除拣货任务
 * @param id
 */
export const delPickingTask = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/pickingTask/' + id,
    method: 'delete'
  });
};
