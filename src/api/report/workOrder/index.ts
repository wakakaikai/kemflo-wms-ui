import request from '@/utils/request';

/**
 * 查询工单工序信息
 * @param data
 * @returns {*}
 */

export const listWorkOrderProcess = (query?: any) => {
  return request({
    url: '/wms/scada/listWorkOrderProcess',
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
    url: '/wms/scada/listWorkOrderSummary',
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
    url: '/wms/scada/listGanttTaskList',
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
    url: '/wms/scada/listWorkOrderReport',
    method: 'get',
    params: query
  });
};
