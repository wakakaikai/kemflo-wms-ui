import request from '@/utils/request';
import { MesProductDataForm } from '@/api/report/mesProductData/types';

/**
 * 查询工单工序信息
 * @param data
 * @returns {*}
 */

export const listWorkOrderProcess = (data?: any) => {
  return request({
    url: '/wms/scada/listWorkOrderProcess',
    method: 'post',
    data: data
  });
};

/**
 * 查询Mes巡检数据
 * @param data
 * @returns {*}
 */
export const listWorkOrderSummary = (data: MesProductDataForm) => {
  return request({
    url: '/mes/scada/inspection/list',
    method: 'post',
    data: data,
    timeout: 180000
  });
};

/**
 * 查询Mes巡检数据
 * @param data
 * @returns {*}
 */
export const listWorkOrderReport = (data: MesProductDataForm) => {
  return request({
    url: '/mes/scada/inspection/list',
    method: 'post',
    data: data,
    timeout: 180000
  });
};

/**
 * 查询Mes巡检数据
 * @param data
 * @returns {*}
 */
export const listCustomerOrder = (data: MesProductDataForm) => {
  return request({
    url: '/mes/scada/inspection/list',
    method: 'post',
    data: data,
    timeout: 180000
  });
};
