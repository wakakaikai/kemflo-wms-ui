import request from '@/utils/request';
import type { AxiosPromise } from 'axios';
import { bindOutboundPalletSilent } from './bindRequest';
import type { PalletOutboundBindForm, PalletOutboundBindQuery, PalletOutboundBindVO } from './types';

export const listPalletOutboundBind = (params?: PalletOutboundBindQuery): AxiosPromise<PalletOutboundBindVO[]> =>
  request({ url: '/wms/palletOutboundBind/list', method: 'get', params });

export const getPalletOutboundBind = (id: string | number): AxiosPromise<PalletOutboundBindVO> =>
  request({ url: `/wms/palletOutboundBind/${id}`, method: 'get' });

export const addPalletOutboundBind = (data: PalletOutboundBindForm): AxiosPromise<PalletOutboundBindVO> =>
  request({
    url: '/wms/palletOutboundBind',
    method: 'post',
    // shippingNo 不属于新增表单，只允许后端 GeneratorSnUtils 生成。
    data: {
      destWarehouseCode: data.destWarehouseCode,
      destWarehouseName: data.destWarehouseName,
      sourceType: data.sourceType,
      remark: data.remark
    }
  });

export const bindOutboundPallet = bindOutboundPalletSilent;

export const removeOutboundPallet = (id: string | number, palletNo: string): AxiosPromise<PalletOutboundBindVO> =>
  request({ url: `/wms/palletOutboundBind/${id}/pallet`, method: 'delete', params: { palletNo } });

export const confirmPalletOutboundBind = (
  id: string | number,
  destWarehouseCode?: string,
  destWarehouseName?: string
): AxiosPromise<PalletOutboundBindVO> =>
  request({
    url: `/wms/palletOutboundBind/confirm/${id}`,
    method: 'put',
    data: { destWarehouseCode, destWarehouseName }
  });

export const updatePalletOutboundBindDestWarehouse = (
  id: string | number,
  destWarehouseCode: string,
  destWarehouseName: string
): AxiosPromise<PalletOutboundBindVO> =>
  request({
    url: `/wms/palletOutboundBind/${id}/destWarehouse`,
    method: 'put',
    data: { destWarehouseCode, destWarehouseName }
  });

export const delPalletOutboundBind = (ids: string | number | Array<string | number>) =>
  request({ url: `/wms/palletOutboundBind/${ids}`, method: 'delete' });
