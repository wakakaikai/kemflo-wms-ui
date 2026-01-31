import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { WorkOrderScadaPrintHistoryVO, WorkOrderScadaPrintHistoryForm, WorkOrderScadaPrintHistoryQuery } from '@/api/wms/workOrderScadaPrintHistory/types';

/**
 * 查询工单看板卡打印历史列表
 * @param query
 * @returns {*}
 */

export const listWorkOrderScadaPrintHistory = (query?: WorkOrderScadaPrintHistoryQuery): AxiosPromise<WorkOrderScadaPrintHistoryVO[]> => {
  return request({
    url: '/wms/workOrderScadaPrintHistory/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工单看板卡打印历史详细
 * @param id
 */
export const getWorkOrderScadaPrintHistory = (id: string | number): AxiosPromise<WorkOrderScadaPrintHistoryVO> => {
  return request({
    url: '/wms/workOrderScadaPrintHistory/' + id,
    method: 'get'
  });
};

/**
 * 新增工单看板卡打印历史
 * @param data
 */
export const addWorkOrderScadaPrintHistory = (data: WorkOrderScadaPrintHistoryForm) => {
  return request({
    url: '/wms/workOrderScadaPrintHistory',
    method: 'post',
    data: data
  });
};

/**
 * 批量新增工单看板卡打印历史
 * @param data
 */
export const addBatchWorkOrderScadaPrintHistory = (data: WorkOrderScadaPrintHistoryForm) => {
  return request({
    url: '/wms/workOrderScadaPrintHistory/addBatch',
    method: 'post',
    data: data
  });
};



/**
 * 修改工单看板卡打印历史
 * @param data
 */
export const updateWorkOrderScadaPrintHistory = (data: WorkOrderScadaPrintHistoryForm) => {
  return request({
    url: '/wms/workOrderScadaPrintHistory',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单看板卡打印历史
 * @param id
 */
export const delWorkOrderScadaPrintHistory = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/workOrderScadaPrintHistory/' + id,
    method: 'delete'
  });
};
