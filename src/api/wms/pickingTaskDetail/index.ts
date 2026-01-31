import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PickingTaskDetailVO, PickingTaskDetailForm, PickingTaskDetailQuery } from '@/api/wms/pickingTaskDetail/types';

/**
 * 查询拣货任务明细列表
 * @param query
 * @returns {*}
 */

export const listPickingTaskDetail = (query?: PickingTaskDetailQuery): AxiosPromise<PickingTaskDetailVO[]> => {
  return request({
    url: '/wms/pickingTaskDetail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询拣货任务明细详细
 * @param id
 */
export const getPickingTaskDetail = (id: string | number): AxiosPromise<PickingTaskDetailVO> => {
  return request({
    url: '/wms/pickingTaskDetail/' + id,
    method: 'get'
  });
};

/**
 * 新增拣货任务明细
 * @param data
 */
export const addPickingTaskDetail = (data: PickingTaskDetailForm) => {
  return request({
    url: '/wms/pickingTaskDetail',
    method: 'post',
    data: data
  });
};

/**
 * 修改拣货任务明细
 * @param data
 */
export const updatePickingTaskDetail = (data: PickingTaskDetailForm) => {
  return request({
    url: '/wms/pickingTaskDetail',
    method: 'put',
    data: data
  });
};

/**
 * 删除拣货任务明细
 * @param id
 */
export const delPickingTaskDetail = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/pickingTaskDetail/' + id,
    method: 'delete'
  });
};
