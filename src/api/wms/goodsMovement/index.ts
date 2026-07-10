import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import type { GoodsMovementCheckResult, GoodsMovementDisplayQuery, GoodsMovementLineVO, GoodsMovementPostForm, GoodsMovementPostResult } from './types';

/**
 * 显示物料凭证（按凭证号查询行项目）
 */
export const displayGoodsMovement = (query: GoodsMovementDisplayQuery): AxiosPromise<GoodsMovementLineVO[]> => {
  return request({
    url: '/wms/goodsMovement/display',
    method: 'get',
    params: query
  });
};

/**
 * 检查货物移动数据
 */
export const checkGoodsMovement = (data: GoodsMovementPostForm): AxiosPromise<GoodsMovementCheckResult> => {
  return request({
    url: '/wms/goodsMovement/check',
    method: 'post',
    data
  });
};

/**
 * 过账货物移动
 */
export const postGoodsMovement = (data: GoodsMovementPostForm): AxiosPromise<GoodsMovementPostResult> => {
  return request({
    url: '/wms/goodsMovement/post',
    method: 'post',
    data
  });
};
