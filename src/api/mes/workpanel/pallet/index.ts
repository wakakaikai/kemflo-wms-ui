import request from '@/utils/request';
import type { AxiosPromise } from 'axios';
import type {
  WorkPanelItemPalletVO,
  WorkPanelPalletBindResultVO,
  WorkPanelPalletExportForm,
  WorkPanelPalletGenerateForm,
  WorkPanelPalletGenerateResultVO,
  WorkPanelPalletSnBindForm,
  WorkPanelPalletSnCheckVO,
  WorkPanelPalletSnListForm,
  WorkPanelPalletSnRow,
  WorkPanelPalletSnUnbindForm,
  WorkPanelItemPalletQuery,
  WorkPanelPalletSnValidateForm
} from '@/api/mes/workpanel/pallet/types';

/** 分页查询栈板类型产品配置（type 默认 2） */
export const pageWorkPanelItemPallet = (query: WorkPanelItemPalletQuery) => {
  return request({
    url: '/mes/itemPallet/list',
    method: 'get',
    params: query,
    headers: { isShowError: false }
  });
};

/** 查询栈板信息 */
export const getWorkPanelPalletInfo = (palletNo: string) => {
  return request({
    url: '/mes/pallet/get',
    method: 'get',
    params: { palletNo },
    headers: { isShowError: false }
  });
};

/** 检查栈板号状态 */
export const checkWorkPanelPalletNo = (data: WorkPanelPalletSnValidateForm): AxiosPromise<unknown> => {
  return request({
    url: '/mes/palletSn/checkPalletNo',
    method: 'post',
    data,
    headers: { isShowError: false }
  });
};

/** 检查 SN 状态 */
export const checkWorkPanelSn = (data: WorkPanelPalletSnValidateForm): AxiosPromise<WorkPanelPalletSnCheckVO> => {
  return request({
    url: '/mes/palletSn/checkSn',
    method: 'post',
    data,
    headers: { isShowError: false }
  });
};

/** 栈板绑定 SN（useType=1，指定栈板号） */
export const bindWorkPanelBoxSn = (data: WorkPanelPalletSnBindForm): AxiosPromise<WorkPanelPalletBindResultVO> => {
  return request({
    url: '/mes/palletSn/bindBoxSn',
    method: 'post',
    data,
    headers: { isShowError: false }
  });
};

/** 栈板绑定 SN（自动分配栈板号 / 工单） */
export const bindWorkPanelPalletSn = (data: WorkPanelPalletSnBindForm): AxiosPromise<WorkPanelPalletBindResultVO> => {
  return request({
    url: '/mes/palletSn/bind',
    method: 'post',
    data,
    headers: { isShowError: false }
  });
};

/** 查询栈板绑定 SN 列表 */
export const listWorkPanelPalletSn = (data: WorkPanelPalletSnListForm): AxiosPromise<WorkPanelPalletSnRow[]> => {
  return request({
    url: '/mes/palletSn/get',
    method: 'post',
    data,
    headers: { isShowError: false }
  });
};

/** 栈板解绑 SN */
export const unbindWorkPanelPalletSn = (data: WorkPanelPalletSnUnbindForm): AxiosPromise<unknown> => {
  return request({
    url: '/mes/palletSn/unBindBoxSn',
    method: 'post',
    data,
    headers: { isShowError: false }
  });
};

/** 生成栈板/外箱条码 */
export const generateWorkPanelPallet = (data: WorkPanelPalletGenerateForm): AxiosPromise<WorkPanelPalletGenerateResultVO> => {
  return request({
    url: '/mes/pallet/generate',
    method: 'post',
    data,
    headers: { isShowError: false }
  });
};

/** 导出栈板/外箱条码 Excel（待后端实现） */
export const exportWorkPanelPalletExcel = (data: WorkPanelPalletExportForm) => {
  return request({
    url: '/mes/pallet/exportExcel',
    method: 'post',
    data,
    responseType: 'blob',
    headers: { isShowError: false }
  });
};
