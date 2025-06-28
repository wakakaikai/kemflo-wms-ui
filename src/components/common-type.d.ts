/*
 * @Descripttion:  公共类型提取
 * @version:
 * @Author: Kevin
 * @Date: 2023-08-18 10:18:52
 * @LastEditors: Kevin
 * @LastEditTime: 2023-08-18 10:26:38
 */

// 搜索字段
export type SearchField<T> = {
  name: T;
  label: string;
  type: string;
};

// 分页参数
export type PaginationParams = {
  pageNum: number;
  pageSize: number;
};

// 工作中心对象
export type WorkCenterObj = {
  workCenter: string;
  workCenterDesc: string;
};

// 工单对象
export type ShopOrderObj = {
  shopOrder: string;
  shopOrderDesc: string;
};

// 物料对象
export type ItemObj = {
  item: string;
  itemDesc: string;
  itemRevision: string;
};

export type ResourceObj = {
  resource: string;
  resourceDesc: string;
};

export type OperationObj = {
  operation: string;
  operationDesc: string;
};
