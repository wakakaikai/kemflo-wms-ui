/** TCP Client 采集值解析（安规类 JSON / 普通 JSON / 字符串） */

export interface SafetyTestDetailItem {
  testItem: string;
  testValue: string;
  testStatus: string;
}

export interface SafetyTestPayload {
  barcode: string;
  testStatus: string;
  datetimeCreated?: string;
  workcenterCode?: string;
  groupCode?: string;
  id?: string;
  details: SafetyTestDetailItem[];
  raw: Record<string, any>;
  rawText: string;
}

export function isPassStatus(status?: string): boolean {
  const s = String(status || '')
    .trim()
    .toUpperCase();
  return s === 'PASS' || s === 'OK' || s === 'SUCCESS' || s === '良' || s === '合格';
}

export function formatCollectValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function asObject(value: unknown): Record<string, any> | null {
  if (value == null) return null;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text.startsWith('{') && !text.startsWith('[')) return null;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, any>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function pick(obj: Record<string, any>, keys: string[]): any {
  for (const key of keys) {
    if (obj[key] != null && obj[key] !== '') return obj[key];
    const found = Object.keys(obj).find((k) => k.toLowerCase() === key.toLowerCase());
    if (found && obj[found] != null && obj[found] !== '') return obj[found];
  }
  return undefined;
}

/** 识别安规/测试设备推送的结构化报文 */
export function parseSafetyTestPayload(value: unknown): SafetyTestPayload | null {
  const obj = asObject(value);
  if (!obj) return null;

  const detailRaw = pick(obj, ['SFC_DEVICE_TEST_DETAIL', 'TEST_DETAIL', 'details', 'ITEMS']);
  const hasDetail = Array.isArray(detailRaw);
  const hasBarcode = pick(obj, ['BARCODE', 'barcode', 'SFC', 'sfc']) != null;
  const hasStatus = pick(obj, ['TEST_STATUS', 'testStatus', 'STATUS', 'status']) != null;
  if (!hasDetail && !(hasBarcode && hasStatus)) {
    return null;
  }

  const details: SafetyTestDetailItem[] = (hasDetail ? detailRaw : []).map((item: any) => ({
    testItem: String(pick(item, ['TEST_ITEM', 'testItem', 'ITEM', 'name']) ?? ''),
    testValue: String(pick(item, ['TEST_VALUE', 'testValue', 'VALUE', 'value']) ?? ''),
    testStatus: String(pick(item, ['TEST_STATUS', 'testStatus', 'STATUS', 'result']) ?? '')
  }));

  return {
    barcode: String(pick(obj, ['BARCODE', 'barcode', 'SFC', 'sfc']) ?? ''),
    testStatus: String(pick(obj, ['TEST_STATUS', 'testStatus', 'STATUS', 'status']) ?? ''),
    datetimeCreated: pick(obj, ['DATETIME_CREATED', 'datetimeCreated', 'CREATE_TIME', 'createTime']),
    workcenterCode: pick(obj, ['WORKCENTER_CODE', 'workcenterCode', 'WORK_CENTER']),
    groupCode: pick(obj, ['Group_Code', 'GROUP_CODE', 'groupCode']),
    id: pick(obj, ['id', 'ID']) != null ? String(pick(obj, ['id', 'ID'])) : undefined,
    details,
    raw: obj,
    rawText: formatCollectValue(obj)
  };
}

export function isStructuredJsonValue(value: unknown): boolean {
  return !!asObject(value) || (typeof value === 'string' && value.trim().startsWith('{'));
}
