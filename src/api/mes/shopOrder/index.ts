import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ShopOrderVO, ShopOrderForm, ShopOrderQuery, SfcPreviewVO, ImmediateShopOrderQuery, ImmediateShopOrderVO, ImmediateOperationQuery, ImmediateOperationVO, ImmediateSfcQuery, ImmediateSfcVO } from '@/api/mes/shopOrder/types';

/**
 * 查询工单档案列表
 * @param query
 * @returns {*}
 */

export const listShopOrder = (query?: any) => {
  return request({
    url: '/mes/shopOrder/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询生产实时报表工单列表
 */
export const listImmediateShopOrder = (data?: ImmediateShopOrderQuery): AxiosPromise<ImmediateShopOrderVO[]> => {
  return request({
    url: '/wms/report/immediate/shopOrder',
    method: 'post',
    params: {
      pageNum: data?.pageNum,
      pageSize: data?.pageSize
    },
    data
  });
};

/**
 * 查询生产实时报表工序列表
 */
export const listImmediateOperation = (data: ImmediateOperationQuery): AxiosPromise<ImmediateOperationVO[]> => {
  return request({
    url: '/wms/report/immediate/operation',
    method: 'post',
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize
    },
    data
  });
};

/**
 * 查询生产实时报表条码列表
 */
export const listImmediateSfc = (data: ImmediateSfcQuery): AxiosPromise<ImmediateSfcVO[]> => {
  return request({
    url: '/wms/report/immediate/sfc',
    method: 'post',
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize
    },
    data
  });
};

/**
 * 查询工单档案详细
 * @param id
 */
export const getShopOrder = (id: string | number): AxiosPromise<ShopOrderVO> => {
  return request({
    url: '/mes/shopOrder/' + id,
    method: 'get'
  });
};

/**
 * 新增工单档案
 * @param data
 */
export const addShopOrder = (data: ShopOrderForm) => {
  return request({
    url: '/mes/shopOrder',
    method: 'post',
    data: data
  });
};

/**
 * 工单下达
 * @param data
 */
export const releaseShopOrderSfc = (data: SfcPreviewVO) => {
  return request({
    url: '/mes/shopOrder/release',
    method: 'post',
    data: data
  });
};

/**
 * 修改工单档案
 * @param data
 */
export const updateShopOrder = (data: ShopOrderForm) => {
  return request({
    url: '/mes/shopOrder',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单档案
 * @param id
 */
export const delShopOrder = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/shopOrder/' + id,
    method: 'delete'
  });
};
