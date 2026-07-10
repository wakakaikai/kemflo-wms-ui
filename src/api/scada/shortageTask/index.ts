import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import type { InventoryCheckResultVO } from '@/api/wms/allocation/types';
import type { InventoryTotalQuery, InventoryVO } from '@/api/wms/inventory/types';
import {
  LINE_STATUS_OPTIONS,
  lineStatusBadgeColor,
  fetchAllShortageLines,
  listShortageTaskDetail,
  loadShortageFulfillmentSimulation,
  normalizeShortageTaskLineListResponse,
  computeZeroStockShortageRateFromCheckInventory,
  computeRepeatMaterialRateFromCheckInventory
} from '@/api/wms/shortageTask';
import type {
  ShortageFulfillmentLineResult,
  ShortageFulfillmentSimulationOptions,
  ShortageFulfillmentSimulationResult,
  ShortageTaskLineVO,
  ShortageTaskQuery
} from '@/api/wms/shortageTask/types';

export type {
  ShortageFulfillmentLineResult,
  ShortageFulfillmentSimulationOptions,
  ShortageFulfillmentSimulationResult,
  ShortageTaskLineVO,
  ShortageTaskQuery
};

export {
  LINE_STATUS_OPTIONS,
  lineStatusBadgeColor,
  fetchAllShortageLines,
  listShortageTaskDetail,
  normalizeShortageTaskLineListResponse,
  computeZeroStockShortageRateFromCheckInventory,
  computeRepeatMaterialRateFromCheckInventory
};

/** SCADA 缺料看板：缺料物料排名项 */
export interface ShortageMaterialRankItem {
  rank: number;
  materialCode: string;
  materialName: string;
  qty: number;
  pct: number;
}

function toRankQty(value?: number | string | null) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** 按物料编码累加缺料数量后降序排名 */
export function aggregateShortageMaterialRank(
  lines: ShortageTaskLineVO[],
  limit = 5
): ShortageMaterialRankItem[] {
  const map = new Map<string, { materialCode: string; materialName: string; qty: number }>();

  for (const line of lines) {
    const code = String(line.materialCode || '').trim();
    if (!code) continue;

    const qty = toRankQty(line.shortageQty);
    if (qty <= 0) continue;

    const bucket = map.get(code);
    if (bucket) {
      bucket.qty += qty;
      if (line.materialName) {
        bucket.materialName = String(line.materialName);
      }
    } else {
      map.set(code, {
        materialCode: code,
        materialName: String(line.materialName || code),
        qty
      });
    }
  }

  const sorted = [...map.values()].sort((a, b) => {
    if (b.qty !== a.qty) return b.qty - a.qty;
    return a.materialCode.localeCompare(b.materialCode, 'zh-CN');
  });

  const top = sorted.slice(0, limit);
  const maxQty = top[0]?.qty || 1;

  return top.map((item, index) => ({
    rank: index + 1,
    materialCode: item.materialCode,
    materialName: item.materialName,
    qty: item.qty,
    pct: Math.max(8, Math.round((item.qty / maxQty) * 100))
  }));
}

/** SCADA 缺料看板：按物料检查库存推荐（不传工单号） */
export interface ScadaInventoryCheckRequest {
  materialCodes: string[];
  /** 缺料行数按物料编码统计（用于重复物料占比） */
  materialShortageLineCounts?: Record<string, number>;
}

/** SCADA 缺料看板：按物料检查库存推荐 */
export function checkScadaShortageInventory(data: ScadaInventoryCheckRequest) {
  return request<InventoryCheckResultVO>({
    url: '/wms/scada/shortageTask/checkInventory',
    method: 'post',
    data
  });
}

/** SCADA 缺料看板：按料号汇总实时库存 */
export function totalInventoryByItemCodes(data: InventoryTotalQuery): AxiosPromise<InventoryVO[]> {
  return request({
    url: '/wms/scada/shortageTask/totalByItemCodes',
    method: 'post',
    data
  });
}

/** SCADA 缺料看板：库存满足分析（使用 SCADA checkInventory 接口，仅传物料号） */
export function loadScadaShortageFulfillmentSimulation(
  options: Omit<ShortageFulfillmentSimulationOptions, 'checkInventoryApi' | 'checkInventoryGroupBy'>
): Promise<ShortageFulfillmentSimulationResult> {
  return loadShortageFulfillmentSimulation({
    ...options,
    checkInventoryApi: checkScadaShortageInventory,
    checkInventoryGroupBy: 'material'
  });
}

export interface ScadaShortageBoardData {
  lines: ShortageTaskLineVO[];
  fulfillment: ShortageFulfillmentSimulationResult;
}

/** SCADA 缺料看板：一次拉取缺料明细并完成库存满足分析 */
export async function loadScadaShortageBoardData(
  query?: ShortageTaskQuery
): Promise<ScadaShortageBoardData> {
  const lines = await fetchAllShortageLines(query);
  const fulfillment = await loadScadaShortageFulfillmentSimulation({ lines, query });
  return { lines, fulfillment };
}
