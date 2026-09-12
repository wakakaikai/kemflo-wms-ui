import request from '@/utils/request';

/**
 * 查询工单工序信息
 * @param data
 * @returns {*}
 */

export const listWorkOrderProcess = (query?: any) => {
  return request({
    url: '/wms/report/workOrder/process/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工单汇总信息
 * @param data
 * @returns {*}
 */
export const listWorkOrderSummary = (data?: any) => {
  return request({
    url: '/wms/report/workOrder/summary/list',
    method: 'post',
    data: data,
    timeout: 180000
  });
};

/**
 * 依客户订单查询工单号
 * @param query
 */
export const listGanttTaskList = (query?: any) => {
  return request({
    url: '/wms/report/workOrder/ganttTask/list',
    method: 'get',
    params: query
  });
};

/**
 * 工单报工信息
 * @param query
 */
export const listWorkOrderReport = (query?: any) => {
  return request({
    url: '/wms/report/workOrder/report/list',
    method: 'get',
    params: query
  });
};
