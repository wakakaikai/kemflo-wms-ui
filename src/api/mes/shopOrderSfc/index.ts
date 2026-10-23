import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ShopOrderSfcVO, ShopOrderSfcForm, ShopOrderSfcQuery } from '@/api/mes/shopOrderSfc/types';

/**
 * 查询工单下达的条码列表
 * @param query
 * @returns {*}
 */

export const listShopOrderSfc = (query?: ShopOrderSfcQuery): AxiosPromise<ShopOrderSfcVO[]> => {
  return request({
    url: '/mes/shopOrderSfc/list',
    method: 'get',
    params: query
  });
};

/**
 * 分页查询工单下达的条码。页码和每页条数同时放在查询参数里，避免后端按默认条数返回。
 */
export const pageShopOrderSfc = (data?: ShopOrderSfcQuery) => {
  return request({
    url: '/mes/shopOrderSfc/page',
    method: 'post',
    params: {
      pageNum: data?.pageNum,
      pageSize: data?.pageSize
    },
    data
  }).then((res: any) => {
    const nested = res?.data;
    const rows = Array.isArray(res?.rows)
      ? res.rows
      : Array.isArray(nested?.rows)
        ? nested.rows
        : Array.isArray(nested?.records)
          ? nested.records
          : [];
    const totalValue = res?.total ?? nested?.total;
    const total = totalValue == null || totalValue === '' ? rows.length : Number(totalValue);
    return { ...res, rows, total };
  });
};

/**
 * 查询工单下达的条码详细
 * @param id
 */
export const getShopOrderSfc = (id: string | number): AxiosPromise<ShopOrderSfcVO> => {
  return request({
    url: '/mes/shopOrderSfc/' + id,
    method: 'get'
  });
};

/**
 * 新增工单下达的条码
 * @param data
 */
export const addShopOrderSfc = (data: ShopOrderSfcForm) => {
  return request({
    url: '/mes/shopOrderSfc',
    method: 'post',
    data: data
  });
};

/**
 * 修改工单下达的条码
 * @param data
 */
export const updateShopOrderSfc = (data: ShopOrderSfcForm) => {
  return request({
    url: '/mes/shopOrderSfc',
    method: 'put',
    data: data
  });
};

/**
 * 删除工单下达的条码
 * @param id
 */
export const delShopOrderSfc = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/shopOrderSfc/' + id,
    method: 'delete'
  });
};
