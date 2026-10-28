import request from '@/utils/request';
import { tansParams } from '@/utils/ruoyi';
import type {
  MesShopOrderReportDataReportQuery,
  MesShopOrderReportDetailQuery
} from '@/api/report/mesShopOrderReportData/types';
import type { ShopOrderReportAbnormalTimeVO } from '@/api/mes/shopOrderReportAbnormalTime/types';
import type { ShopOrderReportEmployeeVO } from '@/api/mes/shopOrderReportEmployee/types';
import type { ShopOrderReportVO } from '@/api/mes/shopOrderReport/types';

/** 分页查询报工记录 */
export const listMesShopOrderReportDataReport = (data: MesShopOrderReportDataReportQuery) => {
  const { pageNum = 1, pageSize = 10, ...body } = data;
  const query = tansParams({ pageNum, pageSize });
  return request({
    url: `/wms/report/shopOrderReport/list${query ? `?${query.slice(0, -1)}` : ''}`,
    method: 'post',
    data: body
  });
};

/** 按报工 ID 查询员工上线明细（全量） */
export const listMesShopOrderReportDataEmployee = (data: MesShopOrderReportDetailQuery) => {
  return request({
    url: '/wms/report/shopOrderReport/employee/list',
    method: 'post',
    data
  });
};

/** 按报工 ID 查询报工异常明细（全量） */
export const listMesShopOrderReportDataAbnormalTime = (data: MesShopOrderReportDetailQuery) => {
  return request({
    url: '/wms/report/shopOrderReport/abnormalTime/list',
    method: 'post',
    data
  });
};

export type { ShopOrderReportVO, ShopOrderReportEmployeeVO, ShopOrderReportAbnormalTimeVO };
