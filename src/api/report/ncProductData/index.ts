import request from '@/utils/request';
import type { NcReportQuery, NcReportPage, NcReportOption } from './types';

export const listNcProductData = (query: NcReportQuery & { pageNum: number; pageSize: number }): Promise<NcReportPage> => request<unknown, NcReportPage>({ url: '/wms/report/ncProductData/list', method: 'get', params: query });

export const listNcReportItems = (keyword: string): Promise<{ data: NcReportOption[] }> => request<unknown, { data: NcReportOption[] }>({ url: '/wms/report/ncProductData/options/items', method: 'get', params: { keyword } });

export const listNcReportWorkCenters = (keyword: string): Promise<{ data: NcReportOption[] }> => request<unknown, { data: NcReportOption[] }>({ url: '/wms/report/ncProductData/options/work-centers', method: 'get', params: { keyword } });
