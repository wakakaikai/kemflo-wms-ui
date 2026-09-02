import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, watch, type ComputedRef, type Ref } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import { readDevicePoints, readDeviceTcpPoints, type PointReadItem } from '@/api/iot/device';
import { listPoint } from '@/api/iot/point';
import type { DeviceVO } from '@/api/iot/device/types';
import type { PointVO } from '@/api/iot/point/types';

export interface RoFilmRecord {
  id: string;
  time: string;
  date: string;
  seq: string;
  productModel: string;
  partNo: string;
  startKpa: string;
  endKpa: string;
  diffKpa: string;
  collectTime?: string;
}

type RoFilmField = 'time' | 'date' | 'seq' | 'productModel' | 'partNo' | 'startKpa' | 'endKpa' | 'diffKpa';

const COLUMN_ALIASES: Record<RoFilmField, string[]> = {
  time: ['时间', 'time'],
  date: ['日期', 'date'],
  seq: ['置入序', '序号', 'seq', 'index'],
  productModel: ['产品型号', '型号', 'productmodel', 'model'],
  partNo: ['料号', 'partno', 'part', 'material'],
  startKpa: ['开始值kpa', '开始值', 'startkpa', 'start'],
  endKpa: ['最终值kpa', '最终值', 'endkpa', 'end', '结束值kpa'],
  diffKpa: ['压差值kpa', '压差值', '压差', 'diffkpa', 'diff']
};

const normalizeKey = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-./]+/g, '');

const formatNumber = (value: unknown) => {
  if (value == null || value === '') return '';
  const num = Number(String(value).trim());
  if (!Number.isFinite(num)) return String(value).trim();
  return num.toFixed(1).replace(/\.0$/, '');
};

const formatTime = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const formatDate = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${String(date.getFullYear()).slice(-2)}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
};

const formatWeekday = (date: Date) => {
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
};

const resolveField = (point: PointVO): RoFilmField | undefined => {
  const category = normalizeKey(point.displayCategory);
  const code = normalizeKey(point.pointCode);
  const name = normalizeKey(point.displayName || point.pointName);
  const source = `${category} ${code} ${name}`;
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES) as Array<[RoFilmField, string[]]>) {
    if (aliases.some((alias) => category === normalizeKey(alias) || source.includes(normalizeKey(alias)))) {
      return field;
    }
  }
  return undefined;
};

const resolveRowKey = (point: PointVO) => {
  const order = Number(point.displayOrder);
  if (Number.isFinite(order) && order > 0) {
    return String(Math.floor(order));
  }
  return '1';
};

const buildRecordFromPoints = (points: PointVO[], rowKey: string, fallbackTime?: Date): RoFilmRecord | null => {
  const rowPoints = points.filter((point) => resolveRowKey(point) === rowKey);
  if (!rowPoints.length) return null;

  const record: RoFilmRecord = {
    id: rowKey,
    time: '',
    date: '',
    seq: rowKey,
    productModel: '',
    partNo: '',
    startKpa: '',
    endKpa: '',
    diffKpa: ''
  };

  rowPoints.forEach((point) => {
    const field = resolveField(point);
    if (!field) return;
    record[field] = String(point.currentValue ?? '').trim();
  });

  const now = fallbackTime || new Date();
  if (!record.time) record.time = formatTime(now);
  if (!record.date) record.date = formatDate(now);

  const start = Number(record.startKpa);
  const end = Number(record.endKpa);
  if (!record.diffKpa && Number.isFinite(start) && Number.isFinite(end)) {
    record.diffKpa = formatNumber(end - start);
  }

  record.startKpa = formatNumber(record.startKpa);
  record.endKpa = formatNumber(record.endKpa);
  record.diffKpa = formatNumber(record.diffKpa);

  const hasValue = [record.productModel, record.partNo, record.startKpa, record.endKpa, record.diffKpa].some(Boolean);
  if (!hasValue) return null;

  const latestCollect = rowPoints
    .map((point) => point.collectTime)
    .filter(Boolean)
    .sort()
    .pop();
  record.collectTime = latestCollect;
  record.id = `${rowKey}-${record.time}-${record.date}-${record.seq}`;
  return record;
};

const parseJsonRecords = (points: PointVO[]): RoFilmRecord[] => {
  const rows: RoFilmRecord[] = [];
  points.forEach((point) => {
    const raw = String(point.currentValue || '').trim();
    if (!raw.startsWith('[') && !raw.startsWith('{')) return;
    try {
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      list.forEach((item, index) => {
        if (!item || typeof item !== 'object') return;
        const obj = item as Record<string, unknown>;
        rows.push({
          id: `${point.pointCode}-${index}-${obj.time || obj.时间 || index}`,
          time: String(obj.time ?? obj.时间 ?? ''),
          date: String(obj.date ?? obj.日期 ?? ''),
          seq: String(obj.seq ?? obj.置入序 ?? obj.index ?? index + 1),
          productModel: String(obj.productModel ?? obj.产品型号 ?? obj.model ?? ''),
          partNo: String(obj.partNo ?? obj.料号 ?? obj.material ?? ''),
          startKpa: formatNumber(obj.startKpa ?? obj.开始值Kpa ?? obj.开始值),
          endKpa: formatNumber(obj.endKpa ?? obj.最终值Kpa ?? obj.最终值),
          diffKpa: formatNumber(obj.diffKpa ?? obj.压差值Kpa ?? obj.压差值)
        });
      });
    } catch {
      // ignore invalid json payload
    }
  });
  return rows.filter((row) => row.time || row.partNo || row.startKpa);
};

export function useRoFilmDisplay(deviceId: Ref<string>, device: ComputedRef<DeviceVO | null>) {
  const { proxy } = getCurrentInstance() as ComponentInternalInstance;

  const pointList = ref<PointVO[]>([]);
  const recordHistory = ref<RoFilmRecord[]>([]);
  const loading = ref(false);
  const reading = ref(false);
  const clock = ref(new Date());
  let refreshTimer: number | undefined;
  let clockTimer: number | undefined;

  const isTcpClient = (protocol?: string) => {
    const value = (protocol || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
    return value === 'tcp-client' || value === 'tcpclient' || value === 'tcp';
  };

  const clockText = computed(() => {
    const date = clock.value;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${formatWeekday(date)} ${formatTime(date)}`;
  });

  const visiblePoints = computed(() => pointList.value.filter((point) => String(point.displayEnabled ?? '1') !== '0'));

  const liveRecords = computed(() => {
    const jsonRows = parseJsonRecords(visiblePoints.value);
    if (jsonRows.length) return jsonRows;

    const rowKeys = Array.from(new Set(visiblePoints.value.map(resolveRowKey)));
    return rowKeys
      .map((rowKey) => buildRecordFromPoints(visiblePoints.value, rowKey))
      .filter((row): row is RoFilmRecord => !!row);
  });

  const tableRecords = computed(() => {
    const merged = new Map<string, RoFilmRecord>();
    [...recordHistory.value, ...liveRecords.value].forEach((row) => merged.set(row.id, row));
    return Array.from(merged.values()).sort((a, b) => {
      const aTime = `${a.date} ${a.time}`;
      const bTime = `${b.date} ${b.time}`;
      return bTime.localeCompare(aTime, 'zh-Hans-CN');
    });
  });

  const mergeReadRows = (rows: PointReadItem[]) => {
    if (!rows?.length) return;
    const byCode = new Map(rows.map((row) => [row.pointCode, row]));
    pointList.value = pointList.value.map((point) => {
      const hit = byCode.get(point.pointCode);
      if (!hit) return point;
      return {
        ...point,
        currentValue: hit.value == null ? '' : String(hit.value),
        quality: hit.quality || point.quality,
        collectTime: new Date().toISOString()
      };
    });
  };

  const appendLiveRecords = () => {
    const next = [...recordHistory.value];
    liveRecords.value.forEach((row) => {
      if (!next.some((item) => item.id === row.id)) {
        next.unshift(row);
      }
    });
    recordHistory.value = next.slice(0, 500);
  };

  const readCurrentValues = async () => {
    const current = device.value;
    if (!current) return;
    reading.value = true;
    try {
      const res = isTcpClient(current.protocol) ? await readDeviceTcpPoints(current.id) : await readDevicePoints(current.id);
      const rows = (isTcpClient(current.protocol) ? res.data?.points : res.data) || [];
      mergeReadRows(rows as PointReadItem[]);
      appendLiveRecords();
    } catch {
      proxy?.$modal?.msgWarning?.('读取实时值失败，已显示最近一次采集值');
    } finally {
      reading.value = false;
    }
  };

  const loadPoints = async () => {
    if (!deviceId.value) {
      pointList.value = [];
      recordHistory.value = [];
      return;
    }
    loading.value = true;
    try {
      const res = await listPoint({ deviceId: deviceId.value, pageNum: 1, pageSize: 1000 });
      pointList.value = ((res as any).rows ?? []) as PointVO[];
    } finally {
      loading.value = false;
    }
    await readCurrentValues();
  };

  const refreshData = async () => {
    await loadPoints();
  };

  watch(deviceId, () => {
    recordHistory.value = [];
    loadPoints();
  });

  onMounted(() => {
    loadPoints();
    clockTimer = window.setInterval(() => {
      clock.value = new Date();
    }, 1000);
    refreshTimer = window.setInterval(() => {
      readCurrentValues();
    }, 30000);
  });

  onBeforeUnmount(() => {
    if (refreshTimer) window.clearInterval(refreshTimer);
    if (clockTimer) window.clearInterval(clockTimer);
  });

  return {
    loading,
    reading,
    clockText,
    tableRecords,
    refreshData
  };
}
