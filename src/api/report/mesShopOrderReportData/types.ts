import type { ShopOrderReportAbnormalTimeQuery } from '@/api/mes/shopOrderReportAbnormalTime/types';
import type { ShopOrderReportEmployeeQuery } from '@/api/mes/shopOrderReportEmployee/types';
import type { ShopOrderReportQuery } from '@/api/mes/shopOrderReport/types';

/** 报工记录报表 — 主表查询 */
export type MesShopOrderReportDataReportQuery = ShopOrderReportQuery;

/** 报工记录报表 — 员工上线明细查询 */
export type MesShopOrderReportDataEmployeeQuery = ShopOrderReportEmployeeQuery;

/** 报工记录报表 — 报工异常明细查询 */
export type MesShopOrderReportDataAbnormalTimeQuery = ShopOrderReportAbnormalTimeQuery;

/** 按报工 ID 查询员工上线 / 异常明细 */
export interface MesShopOrderReportDetailQuery {
  reportId: string | number;
}

/** 页面共享筛选（各 Tab 分页独立） */
export interface MesShopOrderReportDataPageQuery {
  shopOrder?: string;
  workCenter?: string;
  status?: number;
  employeeId?: string;
  reportPageNum: number;
  reportPageSize: number;
  employeePageNum: number;
  employeePageSize: number;
  abnormalPageNum: number;
  abnormalPageSize: number;
}
