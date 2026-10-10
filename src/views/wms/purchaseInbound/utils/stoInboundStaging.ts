import { kemfloWmsDB } from '@/utils/indexedDB';

const REGISTRY_KEY = '__stoInboundHoldRegistry__';
const HOLD_KEY_PREFIX = 'wms:stoInbound:hold:';
const STO_INBOUND_STAGING_MAX = 20;

export interface StoInboundStagingPayload {
  receiveType: '2';
  inboundMode: 'fixed' | 'multiple';
  fixedInboundForm: {
    locationCode: string;
    lfsnr: string;
    bktxt: string;
    postingDate: string | null;
  };
  inboundList: any[];
  savedAt: number;
}

export interface StoInboundStagingSummary {
  storageKey: string;
  deliveryOrderNo: string;
  postingDate: string;
  lineCount: number;
  savedAt: number;
}

export function normalizeStoStagingPostingDate(postingDate?: string | null): string {
  const raw = String(postingDate ?? '').trim();
  if (raw) return raw.length >= 10 ? raw.slice(0, 10) : raw;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function resolveStoStagingDeliveryOrder(inboundList: any[]): string | null {
  const deliveryOrderNos = [...new Set((inboundList || []).map((row) => String(row.deliveryOrderNo ?? '').trim()).filter(Boolean))];
  return deliveryOrderNos.length === 1 ? deliveryOrderNos[0]! : null;
}

export function buildStoInboundStagingKey(deliveryOrderNo: string, postingDate: string) {
  const deliveryNo = String(deliveryOrderNo ?? '')
    .trim()
    .toUpperCase();
  return `${HOLD_KEY_PREFIX}${deliveryNo}:${normalizeStoStagingPostingDate(postingDate)}`;
}

async function readRegistry(): Promise<StoInboundStagingSummary[]> {
  const list = await kemfloWmsDB.get<StoInboundStagingSummary[]>(REGISTRY_KEY);
  return Array.isArray(list) ? list : [];
}

async function writeRegistry(list: StoInboundStagingSummary[]) {
  await kemfloWmsDB.set(REGISTRY_KEY, list);
}

async function enforceStagingLimit(registry: StoInboundStagingSummary[]) {
  if (registry.length <= STO_INBOUND_STAGING_MAX) return registry;
  const oldestFirst = [...registry].sort((a, b) => a.savedAt - b.savedAt);
  const toRemove = oldestFirst.slice(0, oldestFirst.length - STO_INBOUND_STAGING_MAX);
  await Promise.all(toRemove.map((item) => kemfloWmsDB.remove(item.storageKey)));
  const removeKeys = new Set(toRemove.map((item) => item.storageKey));
  return registry.filter((item) => !removeKeys.has(item.storageKey));
}

export async function listStoInboundStagings(): Promise<StoInboundStagingSummary[]> {
  return (await readRegistry()).sort((a, b) => b.savedAt - a.savedAt);
}

export async function saveStoInboundStaging(payload: Omit<StoInboundStagingPayload, 'savedAt'>, deliveryOrderNo: string): Promise<StoInboundStagingSummary> {
  const postingDate = normalizeStoStagingPostingDate(payload.fixedInboundForm.postingDate);
  const storageKey = buildStoInboundStagingKey(deliveryOrderNo, postingDate);
  const saved: StoInboundStagingPayload = {
    ...payload,
    fixedInboundForm: { ...payload.fixedInboundForm, postingDate },
    inboundList: JSON.parse(JSON.stringify(payload.inboundList)),
    savedAt: Date.now()
  };
  await kemfloWmsDB.set(storageKey, saved);

  const summary: StoInboundStagingSummary = {
    storageKey,
    deliveryOrderNo,
    postingDate,
    lineCount: payload.inboundList.length,
    savedAt: saved.savedAt
  };
  const registry = (await readRegistry()).filter((item) => item.storageKey !== storageKey);
  registry.push(summary);
  await writeRegistry(await enforceStagingLimit(registry));
  return summary;
}

export async function loadStoInboundStaging(storageKey: string): Promise<StoInboundStagingPayload | null> {
  return (await kemfloWmsDB.get<StoInboundStagingPayload>(storageKey)) ?? null;
}

export async function removeStoInboundStaging(storageKey: string) {
  await kemfloWmsDB.remove(storageKey);
  await writeRegistry((await readRegistry()).filter((item) => item.storageKey !== storageKey));
}
