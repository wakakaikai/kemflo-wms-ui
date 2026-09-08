import { ShippingDetailVO } from '@/api/wms/shippingDetail/types';

export interface ShippingDetailScadaQuery {
  customerCode?: string;
  item?: string;
  shopOrder?: string;
  status?: number;
  topLimit?: number;
  pageNum?: number;
  pageSize?: number;
  dateTimeRange?: string[];
}

export interface ShippingDetailOverviewVO {
  todayScanQty?: number;
  yesterdayScanQty?: number;
  scanQtyChangeRate?: number;
  todayCustomerCount?: number;
  yesterdayCustomerCount?: number;
  customerChangeRate?: number;
  todayOrderCount?: number;
  yesterdayOrderCount?: number;
  orderChangeRate?: number;
  todayItemCount?: number;
  yesterdayItemCount?: number;
  itemChangeRate?: number;
}

export interface ShippingDetailHourlyTrendVO {
  hourLabel?: string;
  hour?: number;
  normalQty?: number;
  abnormalQty?: number;
}

export interface ShippingDetailStatusRatioVO {
  status?: number;
  statusName?: string;
  qty?: number;
  percent?: number;
}

export interface ShippingDetailTopCustomerVO {
  customerCode?: string;
  customerName?: string;
  qty?: number;
}

export interface ShippingDetailFooterVO {
  customerTotal?: number;
  todayVehicleCount?: number;
  todayBoxQty?: number;
  todayShopOrderCount?: number;
}

export type ShippingDetailRowVO = ShippingDetailVO;
