import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { InventoryDetailVO, InventoryDetailForm, InventoryDetailQuery, InventoryTransferForm, InventoryCancelForm, InventoryCancelBatchOptions } from '@/api/wms/inventoryDetail/types';

/**
 * 查询库存明细记录列表
 * @param query
 * @returns {*}
 */

export const listInventoryDetail = (query?: InventoryDetailQuery): AxiosPromise<InventoryDetailVO[]> => {
  return request({
    url: '/wms/inventoryDetail/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询库存明细记录详细
 * @param id
 */
export const getInventoryDetail = (id: string | number): AxiosPromise<InventoryDetailVO> => {
  return request({
    url: '/wms/inventoryDetail/' + id,
    method: 'get'
  });
};

/**
 * 新增库存明细记录
 * @param data
 */
export const addInventoryDetail = (data: InventoryDetailForm) => {
  return request({
    url: '/wms/inventoryDetail',
    method: 'post',
    data: data
  });
};

/**
 * 盘亏库存明细记录
 * @param data
 */
export const subtractInventoryDetail = (data: InventoryDetailForm) => {
  return request({
    url: '/wms/inventoryDetail/subtract',
    method: 'put',
    data: data
  });
};

/**
 * 容器入库
 * @param data
 */
export const containerInbound = (data: InventoryDetailForm) => {
  return request({
    url: '/wms/inventoryDetail/container/inbound',
    method: 'post',
    data: data
  });
};

/**
 * 容器出库
 * @param data
 */
export const containerOutbound = (data: InventoryDetailForm) => {
  return request({
    url: '/wms/inventoryDetail/container/outbound',
    method: 'put',
    data: data
  });
};

/**
 * 修改库存明细记录
 * @param data
 */
export const updateInventoryDetail = (data: InventoryDetailForm) => {
  return request({
    url: '/wms/inventoryDetail',
    method: 'put',
    data: data
  });
};

/**
 * 删除库存明细记录
 * @param id
 */
export const delInventoryDetail = (id: string | number | Array<string | number>) => {
  return request({
    url: '/wms/inventoryDetail/' + id,
    method: 'delete'
  });
};

/**
 * 库存移转记录
 * @param data
 */
export const transferInventory = (data: InventoryTransferForm) => {
  return request({
    url: '/wms/inventoryDetail/transfer',
    method: 'post',
    data: data
  });
};

/**
 * 栈板库存退货
 * @param data
 */
/**
 * 栈板库存退货（已迁移至 /wms/palletInventory/return，保留兼容导出）
 */
export { returnPalletInventory } from '@/api/wms/palletInventory';

/**
 * 采购件退货（已迁移至 /wms/purchaseOrder/return，保留兼容导出）
 */
export { returnPurchaseInventory } from '@/api/wms/purchaseOrder';

/** 库存移动冲销（SAP 物料凭证冲销） */
export const cancelInventoryMovement = (data: InventoryCancelForm) => {
  return request({
    url: '/wms/inventoryDetail/reverse',
    method: 'post',
    data: data
  });
};

function formatCancelPostingDate(postingDate?: string | null): string | undefined {
  if (!postingDate) {
    return undefined;
  }
  return postingDate.includes(' ') ? postingDate : `${postingDate} 00:00:00`;
}

function resolveCancelBktxt(bktxt?: string | null): string | undefined {
  const value = bktxt?.trim();
  return value || undefined;
}

function resolveCancelLfsnr(lfsnr?: string | null): string | undefined {
  const value = lfsnr?.trim();
  return value || undefined;
}

/** 按物料凭证号冲销；可传 sapMaterialItems 指定项次，不传则冲销全部未冲销项次 */
export function buildInventoryCancelPayloadByVoucher(sapMaterialOrderNo: string, options: InventoryCancelBatchOptions = {}): InventoryCancelForm {
  const voucherNo = sapMaterialOrderNo.trim();
  const sapMaterialItems = (options.sapMaterialItems || []).map((item) => String(item ?? '').trim()).filter(Boolean);

  return {
    sapMaterialOrderNo: voucherNo,
    sapMaterialDocYear: options.sapMaterialDocYear,
    sapMaterialItems: sapMaterialItems.length > 0 ? sapMaterialItems : undefined,
    mtsnr: resolveCancelBktxt(options.mtsnr),
    lfsnr: resolveCancelLfsnr(options.lfsnr),
    bktxt: resolveCancelBktxt(options.bktxt),
    postingDate: formatCancelPostingDate(options.postingDate)
  };
}
