import request from '@/utils/request';
import type { AxiosPromise } from 'axios';
import type { PurchaseLine, SupplierDeliveryOrder } from './types';

const baseUrl = '/wms/supplierDeliveryOrder';

export const listSupplierDeliveryOrder = (params: any): AxiosPromise<SupplierDeliveryOrder[]> =>
  request({ url: `${baseUrl}/list`, method: 'get', params });

export const getSupplierDeliveryOrder = (id: string | number): AxiosPromise<SupplierDeliveryOrder> =>
  request({ url: `${baseUrl}/${id}`, method: 'get' });

export const getSupplierDeliveryOrderByCode = (code: string): AxiosPromise<SupplierDeliveryOrder> =>
  request({ url: `${baseUrl}/code/${encodeURIComponent(code)}`, method: 'get' });

export const listAuthorizedPurchaseLines = (params: any): AxiosPromise<PurchaseLine[]> =>
  request({ url: `${baseUrl}/purchase-lines`, method: 'get', params });

export const addSupplierDeliveryOrder = (data: SupplierDeliveryOrder) =>
  request({ url: baseUrl, method: 'post', data });

export const updateSupplierDeliveryOrder = (data: SupplierDeliveryOrder) =>
  request({ url: baseUrl, method: 'put', data });

export const submitSupplierDeliveryOrder = (id: string | number) =>
  request({ url: `${baseUrl}/${id}/submit`, method: 'post' });

export const cancelSupplierDeliveryOrder = (id: string | number) =>
  request({ url: `${baseUrl}/${id}/cancel`, method: 'post' });

export const deleteSupplierDeliveryOrder = (id: string | number) =>
  request({ url: `${baseUrl}/${id}`, method: 'delete' });

export const scanSupplierDeliveryInbound = (data: { code: string; locationCode: string; postingDate?: string }) =>
  request({ url: `${baseUrl}/scan-inbound`, method: 'post', data });

export const batchScanSupplierDeliveryInbound = (lines: Array<{ code: string; locationCode: string; postingDate?: string }>) =>
  request({ url: `${baseUrl}/batch-scan-inbound`, method: 'post', data: { lines } });

export const recordSupplierLabelPrint = (detailIds: Array<string | number>) =>
  request({ url: `${baseUrl}/print-record`, method: 'post', data: detailIds });
