import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ContainerFooterVO, ContainerInventorySummaryVO, ContainerOverviewVO, ContainerPartnerTurnoverVO, ContainerRegionVO, ContainerScadaQuery, ContainerTrendVO, ContainerDiffQuery, ContainerDiffVO, ContainerMovementVO } from './types';
import { InventoryDetailQuery, InventoryDetailVO } from '@/api/wms/inventoryDetail/types';

export const getContainerOverview = (query?: ContainerScadaQuery): AxiosPromise<ContainerOverviewVO> => {
  return request({
    url: '/wms/scada/container/overview',
    method: 'get',
    params: query
  });
};

export const getContainerTrend = (query?: ContainerScadaQuery): AxiosPromise<ContainerTrendVO[]> => {
  return request({
    url: '/wms/scada/container/trend',
    method: 'get',
    params: query
  });
};

export const getContainerInventorySummary = (query?: ContainerScadaQuery): AxiosPromise<ContainerInventorySummaryVO[]> => {
  return request({
    url: '/wms/scada/container/inventory/summary',
    method: 'get',
    params: query
  });
};

export const getContainerRegionDistribution = (query?: ContainerScadaQuery): AxiosPromise<ContainerRegionVO[]> => {
  return request({
    url: '/wms/scada/container/region/distribution',
    method: 'get',
    params: query
  });
};

export const getContainerFooter = (query?: ContainerScadaQuery): AxiosPromise<ContainerFooterVO> => {
  return request({
    url: '/wms/scada/container/footer',
    method: 'get',
    params: query
  });
};

export const listContainerPartnerTurnover = (query?: ContainerScadaQuery): AxiosPromise<ContainerPartnerTurnoverVO[]> => {
  return request({
    url: '/wms/scada/container/partner/turnover',
    method: 'get',
    params: query
  });
};

export const listContainerInventory = (query?: InventoryDetailQuery): AxiosPromise<{ rows: InventoryDetailVO[]; total: number }> => {
  return request({
    url: '/wms/scada/container/inventory/list',
    method: 'get',
    params: query
  });
};

export const listContainerDiff = (query?: ContainerDiffQuery): AxiosPromise<{ rows: ContainerDiffVO[]; total: number }> => {
  return request({
    url: '/wms/scada/container/diff',
    method: 'get',
    params: query
  });
};

export const listContainerMovement = (query?: ContainerDiffQuery): AxiosPromise<{ rows: ContainerMovementVO[]; total: number }> => {
  return request({
    url: '/wms/scada/container/movement/list',
    method: 'get',
    params: query
  });
};
