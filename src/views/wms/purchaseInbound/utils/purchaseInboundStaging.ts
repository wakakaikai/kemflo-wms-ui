import { kemfloWmsDB } from '@/utils/indexedDB';

const REGISTRY_KEY = '__purchaseInboundHoldRegistry__';
const HOLD_KEY_PREFIX = 'wms:purchaseInbound:hold:';

/** 持有数据上限；超出时删除最早暂存 */
export const PURCHASE_INBOUND_STAGING_MAX = 20;

/** 旧版 localStorage 键，首次打开时迁移到 IndexedDB */
const LEGACY_REGISTRY_KEY = 'wms:purchaseInbound:hold:registry';

export interface PurchaseInboundStagingPayload {
  receiveType: '1';
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

export interface PurchaseInboundStagingSummary {
  storageKey: string;
  supplierCode: string;
  supplierName: string;
  postingDate: string;
  lineCount: number;
  savedAt: number;
}

let legacyMigrationDone = false;

export function normalizeStagingPostingDate(postingDate?: string | null): string {
  const raw = String(postingDate ?? '').trim();
  if (raw) {
    return raw.length >= 10 ? raw.slice(0, 10) : raw;
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildPurchaseInboundStagingKey(supplierCode: string, postingDate: string) {
  const vendor = String(supplierCode ?? '')
    .trim()
    .toUpperCase();
  const date = normalizeStagingPostingDate(postingDate);
  return `${HOLD_KEY_PREFIX}${vendor}:${date}`;
}

async function readRegistry(): Promise<PurchaseInboundStagingSummary[]> {
  await migrateLegacyLocalStorageIfNeeded();
  const list = await kemfloWmsDB.get<PurchaseInboundStagingSummary[]>(REGISTRY_KEY);
  return Array.isArray(list) ? list : [];
}

async function writeRegistry(list: PurchaseInboundStagingSummary[]) {
  await kemfloWmsDB.set(REGISTRY_KEY, list);
}

async function enforceStagingLimit(registry: PurchaseInboundStagingSummary[]): Promise<PurchaseInboundStagingSummary[]> {
  if (registry.length <= PURCHASE_INBOUND_STAGING_MAX) {
    return registry;
  }
  const oldestFirst = [...registry].sort((a, b) => a.savedAt - b.savedAt);
  const removeCount = oldestFirst.length - PURCHASE_INBOUND_STAGING_MAX;
  const toRemove = oldestFirst.slice(0, removeCount);
  await Promise.all(toRemove.map((item) => kemfloWmsDB.remove(item.storageKey)));
  const removeKeys = new Set(toRemove.map((item) => item.storageKey));
  return registry.filter((item) => !removeKeys.has(item.storageKey));
}

async function migrateLegacyLocalStorageIfNeeded() {
  if (legacyMigrationDone || typeof localStorage === 'undefined') {
    return;
  }
  legacyMigrationDone = true;
  try {
    const raw = localStorage.getItem(LEGACY_REGISTRY_KEY);
    if (!raw) {
      return;
    }
    const registry = JSON.parse(raw) as PurchaseInboundStagingSummary[];
    if (!Array.isArray(registry) || registry.length === 0) {
      localStorage.removeItem(LEGACY_REGISTRY_KEY);
      return;
    }
    const existing = await kemfloWmsDB.get<PurchaseInboundStagingSummary[]>(REGISTRY_KEY);
    if (existing?.length) {
      localStorage.removeItem(LEGACY_REGISTRY_KEY);
      registry.forEach((item) => localStorage.removeItem(item.storageKey));
      return;
    }
    for (const item of registry) {
      const payloadRaw = localStorage.getItem(item.storageKey);
      if (payloadRaw) {
        await kemfloWmsDB.set(item.storageKey, JSON.parse(payloadRaw));
        localStorage.removeItem(item.storageKey);
      }
    }
    await writeRegistry(await enforceStagingLimit(registry));
    localStorage.removeItem(LEGACY_REGISTRY_KEY);
  } catch {
    // ignore broken legacy data
  }
}

export function resolveInboundStagingSupplier(inboundList: any[]) {
  const codes = [...new Set(inboundList.map((row) => String(row.supplierCode ?? '').trim()).filter(Boolean))];
  if (codes.length !== 1) {
    return null;
  }
  const supplierCode = codes[0];
  const matched = inboundList.find((row) => String(row.supplierCode ?? '').trim() === supplierCode);
  return {
    supplierCode,
    supplierName: String(matched?.supplierName ?? '').trim()
  };
}

export async function listPurchaseInboundStagings(): Promise<PurchaseInboundStagingSummary[]> {
  const list = await readRegistry();
  return list.sort((a, b) => b.savedAt - a.savedAt);
}

export async function savePurchaseInboundStaging(payload: Omit<PurchaseInboundStagingPayload, 'savedAt'>, supplierCode: string, supplierName: string): Promise<PurchaseInboundStagingSummary> {
  const postingDate = normalizeStagingPostingDate(payload.fixedInboundForm.postingDate);
  const storageKey = buildPurchaseInboundStagingKey(supplierCode, postingDate);
  const saved: PurchaseInboundStagingPayload = {
    ...payload,
    fixedInboundForm: { ...payload.fixedInboundForm, postingDate },
    inboundList: JSON.parse(JSON.stringify(payload.inboundList)),
    savedAt: Date.now()
  };
  await kemfloWmsDB.set(storageKey, saved);

  const summary: PurchaseInboundStagingSummary = {
    storageKey,
    supplierCode,
    supplierName,
    postingDate,
    lineCount: payload.inboundList.length,
    savedAt: saved.savedAt
  };
  const registry = (await readRegistry()).filter((item) => item.storageKey !== storageKey);
  registry.push(summary);
  await writeRegistry(await enforceStagingLimit(registry));
  return summary;
}

export async function loadPurchaseInboundStaging(storageKey: string): Promise<PurchaseInboundStagingPayload | null> {
  await migrateLegacyLocalStorageIfNeeded();
  const payload = await kemfloWmsDB.get<PurchaseInboundStagingPayload>(storageKey);
  return payload ?? null;
}

export async function removePurchaseInboundStaging(storageKey: string) {
  await kemfloWmsDB.remove(storageKey);
  await writeRegistry((await readRegistry()).filter((item) => item.storageKey !== storageKey));
}
