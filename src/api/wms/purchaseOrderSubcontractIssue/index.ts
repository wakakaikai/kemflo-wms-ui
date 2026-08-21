import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PurchaseOrderBomVO, PurchaseOrderBomQuery, PurchaseOrderSubcontractIssueBatchForm } from './types';

/** 分页查询采购订单聚合计划行BOM */
export const queryPoItemBomPageList = (query?: PurchaseOrderBomQuery): AxiosPromise<PurchaseOrderBomVO[]> => {
  return request({
    url: '/wms/purchaseOrderBom/queryPoItemBomPageList',
    method: 'get',
    params: query
  });
};

/** 委外发料（541） */
export const subcontractIssue = (data: PurchaseOrderSubcontractIssueBatchForm) => {
  return request({
    url: '/wms/purchaseOrder/subcontractIssue',
    method: 'post',
    data
  });
};
