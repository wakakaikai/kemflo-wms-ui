import request from '@/utils/request';
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

// 查询条码数据采集项目
export const queryDataCollectionBySfc = (data: any) => {
  return request({
    url: '/mes/dataCollection/dcGroup/sfc',
    method: 'post',
    data
  });
};

// 查询工单数据采集项目
export const queryDataCollectionByShopOrder = (data: any) => {
  return request({
    url: '/mes/dataCollection/getDataCollectionByShopOrder',
    method: 'post',
    data
  });
};

// 保存无条码称重
export const saveShopOrderWeightNoSn = (data: any) => {
  return request({
    url: '/mes/dataCollection/saveShopOrderWeightNoSn',
    method: 'post',
    data
  });
};

// 查询无条码称重
export const getShopOrderWeightNoSnInfo = (data: any) => {
  return request({
    url: '/mes/dataCollection/getShopOrderWeightNoSnInfo',
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
