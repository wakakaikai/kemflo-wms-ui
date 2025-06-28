import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ShopOrderVO } from '@/api/mes/shopOrder/types';
import * as url from 'node:url';

// 作业执行公用
export const executeOperation = (url: string, data: any) => {
  return request(`/yst/mes-service${url}`, {
    method: 'post',
    data
  });
};

export const findPodConfig = (data: object) => {
  return request('/yst/mes-service/mng/pod/findPodConfig', {
    method: 'post',
    data
  });
};

// 工单下达
export const releaseShopOrder = (data: any) => {
  return request('/yst/mes-service/api/shopOrder/releaseShopOrder', {
    method: 'post',
    data
  });
};

// 产品过站
export const startSfc = (data: any) => {
  return request('/yst/mes-service/api/sfcStart/startSfc', {
    method: 'post',
    data
  });
};

export const scanCode = (data: any) => {
  return request('/yst/mes-service/mng/pod/scanCode', {
    method: 'post',
    data
  });
};

export const findSfcInWorkList = (data: any) => {
  return request('/yst/mes-service/api/sfc/findSfcInWorkList', {
    method: 'post',
    data
  });
};
// 获取需要触发的按钮id
export const getScanCodeOperation = (data: any) => {
  return request('/yst/mes-service/mng/pod/scanCode', {
    method: 'post',
    data
  });
};
// 获取需要触发的按钮id
export const getNoReportStartRecord = (data: any) => {
  return request('/yst/mes-service/api/shopOrderStartRecord/queryNoReportStartRecord', {
    method: 'post',
    data
  });
};
// 查询有作业记录无开工记录的条码信息
export const getNoStartRecordActivityLogList = (data: any) => {
  return request('/yst/mes-service/api/shopOrderStartRecord/queryNoStartRecordActivityLog', {
    method: 'post',
    timeout: 30000,
    data
  });
};
//栈板打印信息查询
export const getPallet = (palletNo: any) => {
  return request(`/yst/mes-service/custom/pallet/get?palletNo=${palletNo}`, {
    method: 'get'
  });
};

// 校验SN状态
export const checkSnStatus = (item: any, sfc: any) => {
  return request(`/yst/mes-service/custom/palletSn/check?item=${item}&sfc=${sfc}`, {
    method: 'get'
  });
};

//栈板绑定SN条码
export const bindPalletSn = (data: any) => {
  return request('/yst/mes-service/custom/palletSn/bind', {
    method: 'post',
    data
  });
};
// 获取产品栈板数量
export const getItemPallet = () => {
  return request(`/yst/mes-service/custom/itemPallet/get`, {
    method: 'get'
  });
};
// 检查栈板状态
export const checkPalletNo = (data: any) => {
  return request('/yst/mes-service/custom/palletSn/checkPalletNo', {
    method: 'post',
    data
  });
};
// 检查栈板状态
export const checkSn = (data: any) => {
  return request('/yst/mes-service/custom/palletSn/checkSn', {
    method: 'post',
    data
  });
};

// 栈板绑定SN条码
export const bindBoxSn = (data: any) => {
  return request('/yst/mes-service/custom/palletSn/bindBoxSn', {
    method: 'post',
    data
  });
};

// 生成栈板号
export const generatePallet = (data: any) => {
  return request('/yst/mes-service/custom/pallet/generate', {
    method: 'post',
    data
  });
};

// 导出Excel
export const exportPalletExcel = (data: any) => {
  return request('/yst/mes-service/custom/pallet/exportExcel', {
    method: 'post',
    data,
    responseType: 'blob'
  });
};
// 通过栈板号查询栈板绑定信息
export const getPalletSnList = (data: any) => {
  return request('/yst/mes-service/custom/palletSn/get', {
    method: 'post',
    data
  });
};
// 栈板解绑SN条码
export const unBindPalletSn = (data: any) => {
  return request('/yst/mes-service/custom/palletSn/unBindBoxSn', {
    method: 'post',
    data
  });
};

// 获取物料table
export const getMaterial = (data: any) => {
  return request('/yst/mes-service/mng/item/page', {
    method: 'POST',
    data
  });
};
// 获取工作中心
export const getWorkCenter = (data: any) => {
  return request('/yst/mes-service/mng/workCenter/page/lastWorkCenter', {
    method: 'POST',
    data
  });
};
// 获取顶层工作中心
export const getTopWorkCenter = () => {
  return request('/yst/mes-service/mng/workCenter/topWc', {
    method: 'GET'
  });
};
// 获取工作中心
export const getResource = (data: any) => {
  return request('/yst/mes-service/mng/resourceSetup/findAvailableResource', {
    method: 'POST',
    data
  });
};

// 班次
export const getProductionShift = (data: any) => {
  return request('/yst/mes-service/mng/productionShiftCustom/page', {
    method: 'POST',
    data
  });
};

// 获取工单
// url默认是之前写死参数，现在可以动态传入
export const getShopOrder = (data: any, url = '/yst/mes-service/mng/resourceSetup/findResourceShopOrder') => {
  return request(url, {
    method: 'POST',
    data
  });
};

// 获取开工登记工单
export const getStartRecord = (data: any) => {
  return request('/yst/mes-service/api/shopOrderStartRecord/findAllRecordShopOrder', {
    method: 'POST',
    data
  });
};

// 获取开工登记组装报工工单
export const getAssemblyReportStartRecord = (data: any) => {
  return request('/yst/mes-service/api/shopOrderStartRecord/findAllRecordAssemblyReportShopOrder', {
    method: 'POST',
    data
  });
};

export const getWorkCenterStartRecordShopOrder = (data: any) => {
  return request('/yst/mes-service/mng/productionKanban/v2/findWorkCenterRecordShopOrder', {
    method: 'POST',
    data
  });
};

// 获取工序列表
export const getOperation = (data: any) => {
  return request('/yst/mes-service/mng/operation/page', {
    method: 'POST',
    data
  });
};
// 获取工单的工序列表
export const getOrderOperation = (data: any) => {
  return request('/yst/mes-service/mng/productionKanban/v2/findShopOrderOperation', {
    method: 'POST',
    data
  });
};

// 查询工作中心下的工单
export const queryLastWorkCenterShopOrderDetailPage = (data: any) => {
  return request('/yst/mes-service/api/shopOrderCustom/queryLastWorkCenterShopOrderDetailPage', {
    method: 'POST',
    data
  });
};

// 查询资源下工单
export const queryeResourceShopOrderList = (data: any) => {
  return request('/yst/mes-service/custom/shopOrder/queryResourceShopOrderList', {
    method: 'POST',
    data
  });
};
// 查询异常工时列表
export const queryShopOrderReportAbnormalTimePage = (data: any) => {
  return request('/yst/mes-service/api/workCenterAbnormalTimeRecord/queryShopOrderReportAbnormalTimePage', {
    method: 'post',
    data
  });
};

// 获取不合格代码
// url默认是之前写死参数，现在可以动态传入
export const getNcCodeList = (data: any, url = '/yst/mes-service/mng/ncCode/page') => {
  return request(url, {
    method: 'POST',
    data
  });
};

// 查询组装报工功能工单上绑定的员工信息
export const getEmpOnline = (data: { [key: string]: any }) => {
  return request('/yst/mes-service/api/shopOrderEmployeeBinding/queryBindingEmployeeInfoForAssemblyReport', {
    method: 'post',
    data
  });
};
export const queryListForAssembly = (data: { [key: string]: any }) => {
  return request('/yst/mes-service/api/shopOrderAbnormalTimeRecord/queryListForAssembly', {
    method: 'post',
    data
  });
};
// 导出excel
export const exportExcel = (data: any) => {
  return request('/yst/mes-service/api/shopOrder/exportExcel', {
    method: 'post',
    data,
    responseType: 'blob'
  });
};

// 获取工单信息
export const getShopOrderByResource = (data: any) => {
  return request('/yst/mes-service/api/resourceSetup/getShopOrderByResource', {
    method: 'post',
    data
  });
};

/**
 * @descripttion: 工单条码预览
 * @param {object} data
 * @return {*}
 */
export const getShopOrderSfcPreview = (data: { [key: string]: any }) => {
  return request('/yst/mes-service/api/shopOrderCustom/getShopOrderSfcPreview', {
    method: 'post',
    data
  });
};

// 分页查询步骤
export const getStepsList = (data: any) => {
  return request('/yst/mes-service/mng/SfcTrackable/page/process', {
    method: 'post',
    data
  });
};

// 查询条码组件信息
export const getComponentList = (data: any) => {
  return request('/yst/mes-service/mng/sfcAssembly/custom/queryComponentList', {
    method: 'post',
    data
  });
};
// 校验装配组件
export const validateAssembleComponents = (data: any) => {
  return request('/yst/mes-service/mng/sfcAssembly/custom/validateAssembleComponents', {
    method: 'post',
    data
  });
};

// 批量装配组件
export const batchAssembleComponents = (data: any) => {
  return request('/yst/mes-service/mng/sfcAssembly/custom/batchAssembleComponents', {
    method: 'post',
    data
  });
};
// 关键件-替换
export const replaceSfcComponent = (data: any) => {
  return request('/yst/mes-service/mng/sfcAssembly/custom/replaceComponent', {
    method: 'post',
    data
  });
};
// 关键件-拆解
export const disassemblyComponent = (data: any) => {
  return request('/yst/mes-service/api/replaceSfcAssembly/disassemblyComponent', {
    method: 'post',
    data
  });
};

// 查询条码详情及排队情况
export const querySfcQueueInfo = (data: any) => {
  return request({
    url: '/mes/sfc/queue',
    method: 'post',
    data
  });
};
// 查询条码工艺路线及步骤
export const querySfcProcessList = (data: any) => {
  return request({
    url: '/mes/sfc/process',
    method: 'post',
    data
  });
};
// 查询条码工序组装信息
export const querySfcBomComponentList = (data: any) => {
  return request({
    url: '/mes/sfc/bomComponent/list',
    method: 'post',
    data
  });
};

// 校验组件是否满足组装
export const validateSfcBomComponent = (data: any) => {
  return request({
    url: '/mes/sfc/bomComponent/validate',
    method: 'post',
    data
  });
};

// 保存关键件
export const saveSfcBomComponent = (data: any) => {
  return request({
    url: '/mes/sfc/bomComponent/save',
    method: 'post',
    data
  });
};

// 替换关键件
export const replaceSfcBomComponent = (data: any) => {
  return request({
    url: '/mes/sfc/bomComponent/replace',
    method: 'post',
    data
  });
};

// 发送消息
export const sendMesWebSocket = (data: any) => {
  return request({
    url: '/mes/abnormalCall/send',
    method: 'post',
    data
  });
};
