import request from '@/utils/request';
import type { AxiosPromise } from 'axios';
import type {
  WorkCenterEmployeeBindingVO,
  WorkPanelCompleteForm,
  WorkPanelCompletePrepareForm,
  WorkPanelCompletePrepareVO,
  WorkPanelDataVO,
  WorkPanelEmployeeForm,
  WorkPanelEmployeeFavoriteForm,
  WorkPanelEmployeeFavoriteVO,
  WorkPanelEmployeeOnlineStatusVO,
  WorkPanelProductionShiftVO,
  WorkPanelRouterStepVO,
  WorkPanelStartForm
} from '@/api/mes/workpanel/types';
import type { ShopOrderReportVO } from '@/api/mes/shopOrderReport/types';

export const replaceSfcComponent = (data: any) => {
  return request('/yst/mes-service/mng/sfcAssembly/custom/replaceComponent', {
    method: 'post',
    data
  });
};

export const disassemblyComponent = (data: any) => {
  return request('/yst/mes-service/api/replaceSfcAssembly/disassemblyComponent', {
    method: 'post',
    data
  });
};

export const querySfcQueueInfo = (data: any) => {
  return request({
    url: '/mes/sfc/queue',
    method: 'post',
    data
  });
};

export const querySfcProcessList = (data: any) => {
  return request({
    url: '/mes/sfc/process',
    method: 'post',
    data
  });
};

export const querySfcBomComponentList = (data: any) => {
  return request({
    url: '/mes/sfc/bomComponent/list',
    method: 'post',
    data
  });
};

export const querySfcShopOrderBomComponentList = (data: any) => {
  return request({
    url: '/mes/sfc/shopOrderBomComponent/list',
    method: 'post',
    data
  });
};

export const validateSfcBomComponent = (data: any) => {
  return request({
    url: '/mes/sfc/bomComponent/validate',
    method: 'post',
    data
  });
};

export const saveSfcBomComponent = (data: any) => {
  return request({
    url: '/mes/sfc/bomComponent/save',
    method: 'post',
    data
  });
};

export const replaceSfcBomComponent = (data: any) => {
  return request({
    url: '/mes/sfc/bomComponent/replace',
    method: 'post',
    data
  });
};

export const queryDataCollectionBySfc = (data: any) => {
  return request({
    url: '/mes/dataCollection/sfc',
    method: 'post',
    data
  });
};

export const queryDataCollectionByShopOrder = (data: any) => {
  return request({
    url: '/mes/dataCollection/getDataCollectionByShopOrder',
    method: 'post',
    data
  });
};

export const saveShopOrderWeightNoSn = (data: any) => {
  return request({
    url: '/mes/dataCollection/saveShopOrderWeightNoSn',
    method: 'post',
    data
  });
};

export const getShopOrderWeightNoSnInfo = (data: any) => {
  return request({
    url: '/mes/dataCollection/getShopOrderWeightNoSnInfo',
    method: 'post',
    data
  });
};

export const getSfcWeightByOperation = (data: any) => {
  return request({
    url: '/mes/dataCollection/getSfcWeightByOperation',
    method: 'post',
    data
  });
};

export const sendMesWebSocket = (data: any) => {
  return request({
    url: '/mes/abnormalCall/send',
    method: 'post',
    data
  });
};

export const dataCollectPassSfc = (data: any) => {
  return request({
    url: '/mes/dataCollection/passSfc',
    method: 'post',
    data
  });
};

export const getProductionShiftList = (): AxiosPromise<WorkPanelProductionShiftVO[]> => {
  return request({
    url: '/mes/workpanel/shift-list',
    method: 'get'
  });
};

export const getWorkPanelData = (params: {
  workCenter?: string;
  resrce?: string;
  shopOrder?: string;
  reportId?: string | number;
}): AxiosPromise<WorkPanelDataVO> => {
  return request({
    url: '/mes/workpanel/data',
    method: 'get',
    params
  });
};

export const getShopOrderRouterStep = (shopOrder: string): AxiosPromise<WorkPanelRouterStepVO[]> => {
  return request({
    url: '/mes/workpanel/router-step',
    method: 'get',
    params: { shopOrder }
  });
};

export const startWork = (data: WorkPanelStartForm): AxiosPromise<ShopOrderReportVO> => {
  return request({
    url: '/mes/workpanel/start',
    method: 'post',
    data
  });
};

export const deleteEmployeeFavorite = (id: string | number) => {
  return request({
    url: `/mes/workpanel/employee/favorite/${id}`,
    method: 'delete'
  });
};

export const saveEmployeeFavorite = (data: WorkPanelEmployeeFavoriteForm): AxiosPromise<WorkPanelEmployeeFavoriteVO> => {
  return request({
    url: '/mes/workpanel/employee/favorite',
    method: 'post',
    data
  });
};

export const listEmployeeFavorite = (type = 1): AxiosPromise<WorkPanelEmployeeFavoriteVO[]> => {
  return request({
    url: '/mes/workpanel/employee/favorite/list',
    method: 'get',
    params: { type }
  });
};

export const prepareCompleteWork = (data: WorkPanelCompletePrepareForm): AxiosPromise<WorkPanelCompletePrepareVO> => {
  return request({
    url: '/mes/workpanel/complete/prepare',
    method: 'post',
    data
  });
};

export const completeWork = (data: WorkPanelCompleteForm): AxiosPromise<ShopOrderReportVO> => {
  return request({
    url: '/mes/workpanel/complete',
    method: 'post',
    data
  });
};

export const cancelWorkReport = (reportId: string | number): AxiosPromise<ShopOrderReportVO> => {
  return request({
    url: `/mes/workpanel/cancel/${reportId}`,
    method: 'post'
  });
};

export const checkEmployeeOnlineStatus = (data: WorkPanelEmployeeForm): AxiosPromise<WorkPanelEmployeeOnlineStatusVO> => {
  return request({
    url: '/mes/workpanel/employee/online/check',
    method: 'post',
    data
  });
};

export const employeeOnline = (data: WorkPanelEmployeeForm): AxiosPromise<WorkCenterEmployeeBindingVO> => {
  return request({
    url: '/mes/workpanel/employee/online',
    method: 'post',
    data
  });
};

export const employeeOffline = (data: WorkPanelEmployeeForm): AxiosPromise<WorkCenterEmployeeBindingVO[]> => {
  return request({
    url: '/mes/workpanel/employee/offline',
    method: 'post',
    data
  });
};
