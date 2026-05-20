import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import {
  MaterialIssueVO,
  MaterialIssueForm,
  MaterialIssueQuery,
  MaterialIssueWithDetailsVO,
  MaterialIssueReceiverDTO,
  ConfirmIssueDetailsRequest,
  ConfirmIssueDetailsResult,
  CompleteIssueResult,
  EmergencyIssueRequest,
  CancelIssueRequest,
  SapSyncResult
} from '@/api/wms/materialIssue/types';

export const listMaterialIssue = (query?: MaterialIssueQuery): AxiosPromise<MaterialIssueVO[]> => {
  return request({
    url: '/wms/materialIssue/list',
    method: 'get',
    params: query
  });
};

export const getMaterialIssue = (id: string | number) => {
  return request({
    url: '/wms/materialIssue/' + id,
    method: 'get'
  });
};

export const getMaterialIssueDetail = (id: string | number): AxiosPromise<MaterialIssueWithDetailsVO> => {
  return request({
    url: `/wms/materialIssue/${id}/detail`,
    method: 'get'
  });
};

export const listMaterialIssueByWorkOrder = (workOrderNo: string) => {
  return request({
    url: `/wms/materialIssue/byWorkOrder/${workOrderNo}`,
    method: 'get'
  });
};

export const getMaterialIssueByPlan = (planId: string | number) => {
  return request({
    url: `/wms/materialIssue/byPlan/${planId}`,
    method: 'get'
  });
};

export const createMaterialIssueFromPlan = (planId: string | number) => {
  return request({
    url: `/wms/materialIssue/createFromPlan/${planId}`,
    method: 'post'
  });
};

export const createMaterialIssueFromWorkOrder = (data: EmergencyIssueRequest) => {
  return request({
    url: '/wms/materialIssue/createFromWorkOrder',
    method: 'post',
    data
  });
};

export const assignMaterialIssueReceiver = (id: string | number, data: MaterialIssueReceiverDTO) => {
  return request({
    url: `/wms/materialIssue/${id}/receiver`,
    method: 'put',
    data
  });
};

export const startMaterialIssue = (id: string | number) => {
  return request({
    url: `/wms/materialIssue/${id}/start`,
    method: 'post'
  });
};

export const confirmMaterialIssueDetails = (id: string | number, data: ConfirmIssueDetailsRequest) => {
  return request({
    url: `/wms/materialIssue/${id}/confirmDetails`,
    method: 'post',
    data
  });
};

export const completeMaterialIssue = (id: string | number, allowShortIssue = false) => {
  return request({
    url: `/wms/materialIssue/${id}/complete`,
    method: 'post',
    params: { allowShortIssue }
  });
};

export const cancelMaterialIssue = (id: string | number, data?: CancelIssueRequest) => {
  return request({
    url: `/wms/materialIssue/${id}/cancel`,
    method: 'post',
    data
  });
};

export const syncMaterialIssueSap = (id: string | number) => {
  return request({
    url: `/wms/materialIssue/${id}/syncSap`,
    method: 'post'
  });
};

export const confirmMaterialIssueDetailLine = (detailId: string | number, issuedQuantity: number, remark?: string) => {
  return request({
    url: `/wms/materialIssueDetail/${detailId}/confirm`,
    method: 'post',
    params: { issuedQuantity, remark }
  });
};

export const reverseMaterialIssueDetailLine = (detailId: string | number) => {
  return request({
    url: `/wms/materialIssueDetail/${detailId}/reverse`,
    method: 'post'
  });
};

export const addMaterialIssue = (data: MaterialIssueForm) => {
  return request({
    url: '/wms/materialIssue',
    method: 'post',
    data
  });
};

export const updateMaterialIssue = (data: MaterialIssueForm) => {
  return request({
    url: '/wms/materialIssue',
    method: 'put',
    data
  });
};

export const delMaterialIssue = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/materialIssue/' + id,
    method: 'delete'
  });
};
