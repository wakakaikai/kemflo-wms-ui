import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import type {
  ShippingDetailFooterVO,
  ShippingDetailHourlyTrendVO,
  ShippingDetailOverviewVO,
  ShippingDetailRowVO,
  ShippingDetailScadaQuery,
  ShippingDetailStatusRatioVO,
  ShippingDetailTopCustomerVO
} from './types';

export const getShippingDetailOverview = (query?: ShippingDetailScadaQuery): AxiosPromise<ShippingDetailOverviewVO> => {
  return request({
    url: '/wms/scada/shippingDetail/overview',
    method: 'get',
    params: query
  });
};

export const getShippingDetailHourlyTrend = (query?: ShippingDetailScadaQuery): AxiosPromise<ShippingDetailHourlyTrendVO[]> => {
  return request({
    url: '/wms/scada/shippingDetail/hourlyTrend',
    method: 'get',
    params: query
  });
};

export const getShippingDetailStatusRatio = (query?: ShippingDetailScadaQuery): AxiosPromise<ShippingDetailStatusRatioVO[]> => {
  return request({
    url: '/wms/scada/shippingDetail/statusRatio',
    method: 'get',
    params: query
  });
};

export const getShippingDetailTopCustomers = (query?: ShippingDetailScadaQuery): AxiosPromise<ShippingDetailTopCustomerVO[]> => {
  return request({
    url: '/wms/scada/shippingDetail/topCustomers',
    method: 'get',
    params: query
  });
};

export const getShippingDetailFooter = (query?: ShippingDetailScadaQuery): AxiosPromise<ShippingDetailFooterVO> => {
  return request({
    url: '/wms/scada/shippingDetail/footer',
    method: 'get',
    params: query
  });
};

export const listShippingDetailScada = (
  query?: ShippingDetailScadaQuery
): AxiosPromise<{ rows: ShippingDetailRowVO[]; total: number }> => {
  return request({
    url: '/wms/scada/shippingDetail/list',
    method: 'get',
    params: query
  });
};
