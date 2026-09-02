import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch, type ComputedRef, type Ref } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import { readDevicePoints, readDeviceTcpPoints, type PointReadItem } from '@/api/iot/device';
import { listPoint } from '@/api/iot/point';
import type { DeviceVO } from '@/api/iot/device/types';
import type { PointVO } from '@/api/iot/point/types';

export type DisplayMode = 'current' | 'setting';
export type CardKind = 'metric' | 'indicator';

export interface DisplayCard {
  id: string;
  name: string;
  value: string;
  unit: string;
  category: string;
  setting: boolean;
  kind: CardKind;
  sortText: string;
  displayOrder?: number;
  active: boolean;
  warn: boolean;
  quality?: string;
}

export const modeOptions: Array<{ label: string; value: DisplayMode }> = [
  { label: '状态显示值参数', value: 'current' },
  { label: '设定值参数', value: 'setting' }
];

export const currentCategories = ['状态', '合模', '射胶', '温度', '储料', '开模', '顶出', '其他'];
export const settingCategories = ['合模', '射胶', '温度', '保压', '储料', '开模', '座台', '顶出', '其他'];

export const ORDER_PATTERNS: Record<DisplayMode, Record<string, RegExp[]>> = {
  current: {
    状态: [
      /生产数|production/,
      /模穴|模数|mold.*qty|cavity/,
      /总生产模数.*实际|总生产.*实际|total.*good/,
      /总生产不良品.*实际|不良.*实际|ng|bad/,
      /生产周期|周期时间|cycle/,
      /待机/,
      /生产中|运行/,
      /手动模式|手动/,
      /半自动模式|半自动/,
      /全自动模式|全自动/,
      /报警/,
      /调试|校正/,
      /马达启动/,
      /电热启动|加热/,
      /控制器开机/,
      /锁模状态/,
      /开模状态/
    ],
    合模: [/开锁模实际位置|开模.*实际位置/, /锁模.*实际吨数|吨数/, /锁模动作时间/],
    射胶: [/射胶.*实际位置/, /射胶.*终点.*实际/, /射出动作时间|射胶动作时间/],
    温度: [/t1|温度\s*1|温度t1/i, /t2|温度\s*2|温度t2/i, /t3|温度\s*3|温度t3/i, /t4|温度\s*4|温度t4/i, /t5|温度\s*5|温度t5/i, /t6|温度\s*6|温度t6/i, /t7|温度\s*7|温度t7/i, /当前油温|油温/, /射咀温度|喷嘴温度|nozzle/],
    储料: [/熔胶动作时间|储料动作时间/],
    开模: [/开模.*实际位置/, /开模动作时间/],
    顶出: [/顶针.*实际位置|顶出.*实际位置/, /顶针.*终点|顶出.*终点/, /顶出动作时间|顶针动作时间/]
  },
  setting: {
    合模: [/压力.*1|第1段.*压力/, /压力.*2|第2段.*压力/, /压力.*3|第3段.*压力/, /低压.*压力/, /确认.*压力/, /速度.*1|第1段.*速度/, /速度.*2|第2段.*速度/, /速度.*3|第3段.*速度/, /低压.*速度/, /确认.*速度/, /位置.*1|第1段.*位置/, /位置.*2|第2段.*位置/, /位置.*3|第3段.*位置/, /低压.*位置/, /确认.*位置/],
    射胶: [/压力.*1|第1段.*压力/, /压力.*2|第2段.*压力/, /压力.*3|第3段.*压力/, /压力.*4|第4段.*压力/, /压力.*5|第5段.*压力/, /速度.*1|第1段.*速度/, /速度.*2|第2段.*速度/, /速度.*3|第3段.*速度/, /速度.*4|第4段.*速度/, /速度.*5|第5段.*速度/, /位置.*1|第1段.*位置/, /位置.*2|第2段.*位置/, /位置.*3|第3段.*位置/, /位置.*4|第4段.*位置/, /位置.*5|第5段.*位置/],
    开模: [/压力.*1|第1段.*压力/, /压力.*2|第2段.*压力/, /压力.*3|第3段.*压力/, /压力.*4|第4段.*压力/, /压力.*5|第5段.*压力/, /速度.*1|第1段.*速度/, /速度.*2|第2段.*速度/, /速度.*3|第3段.*速度/, /速度.*4|第4段.*速度/, /速度.*5|第5段.*速度/, /位置.*1|第1段.*位置/, /位置.*2|第2段.*位置/, /位置.*3|第3段.*位置/, /位置.*4|第4段.*位置/, /位置.*5|第5段.*位置/],
    保压: [/压力.*1|第1段.*压力/, /压力.*2|第2段.*压力/, /压力.*3|第3段.*压力/, /压力.*4|第4段.*压力/, /压力.*5|第5段.*压力/, /速度.*1|第1段.*速度/, /速度.*2|第2段.*速度/, /速度.*3|第3段.*速度/, /速度.*4|第4段.*速度/, /速度.*5|第5段.*速度/, /时间.*1|第1段.*时间/, /时间.*2|第2段.*时间/, /时间.*3|第3段.*时间/, /时间.*4|第4段.*时间/, /时间.*5|第5段.*时间/],
    温度: [/t1|温度\s*1|温度t1/i, /t2|温度\s*2|温度t2/i, /t3|温度\s*3|温度t3/i, /t4|温度\s*4|温度t4/i, /t5|温度\s*5|温度t5/i, /t6|温度\s*6|温度t6/i, /t7|温度\s*7|温度t7/i, /油温/, /射咀|喷嘴|nozzle/],
    储料: [/熔胶.*时间|储料.*时间/, /背压/, /速度/, /位置/],
    顶出: [/压力/, /速度/, /位置/, /时间/],
    座台: [/压力/, /速度/, /位置/, /时间/]
  }
};

export function useInjectionDisplay(deviceId: Ref<string>, device: ComputedRef<DeviceVO | null>) {
  const { proxy } = getCurrentInstance() as ComponentInternalInstance;

  const pointList = ref<PointVO[]>([]);
  const activeMode = ref<DisplayMode>('current');
  const activeCategory = ref('状态');
  const loading = ref(false);
  const reading = ref(false);
  const lastRefreshTime = ref<Date | null>(null);
  let refreshTimer: number | undefined;

  const activeModeLabel = computed(() => modeOptions.find((item) => item.value === activeMode.value)?.label || '');
  const visibleCategories = computed(() => {
    const base = activeMode.value === 'current' ? currentCategories : settingCategories;
    const configured = modeCards.value.map((card) => card.category).filter(Boolean);
    return Array.from(new Set([...base, ...configured]));
  });

  const normalizedCards = computed<DisplayCard[]>(() => pointList.value.filter(isDisplayPoint).map(toDisplayCard));
  const allDisplayCards = computed(() =>
    [...normalizedCards.value].sort((a, b) => {
      const aOrder = Number.isFinite(Number(a.displayOrder)) ? Number(a.displayOrder) : 100000;
      const bOrder = Number.isFinite(Number(b.displayOrder)) ? Number(b.displayOrder) : 100000;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.name.localeCompare(b.name, 'zh-Hans-CN');
    })
  );
  const cardCategories = computed(() => {
    const categories = allDisplayCards.value.map((card) => card.category).filter(Boolean);
    return ['全部', ...Array.from(new Set(categories))];
  });
  const modeCards = computed(() => normalizedCards.value.filter((card) => card.setting === (activeMode.value === 'setting')));
  const displayCards = computed(() => modeCards.value.filter((card) => card.category === activeCategory.value).sort((a, b) => sortCards(a, b)));
  const modeCardCount = computed(() => modeCards.value.length);
  const warnCount = computed(() => modeCards.value.filter((card) => card.warn).length);

  watch(activeMode, () => {
    activeCategory.value = visibleCategories.value[0];
    nextTick(ensureCategoryHasCards);
  });

  watch(deviceId, () => {
    activeMode.value = 'current';
    activeCategory.value = '状态';
    loadPoints();
  });

  const toIdStr = (id?: string | number | null) => (id == null || id === '' ? '' : String(id));
  const isOnline = (row?: DeviceVO | null) => String(row?.onlineStatus ?? '0') === '1';
  const categoryCount = (category: string) => modeCards.value.filter((card) => card.category === category).length;
  const normalizeConfig = (value?: string | null) => String(value || '').trim();
  const isDisplayPoint = (point: PointVO) => normalizeConfig(point.displayEnabled) !== '0';

  const isTcpClient = (protocol?: string) => {
    const value = (protocol || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
    return value === 'tcp-client' || value === 'tcpclient' || value === 'tcp';
  };

  const loadPoints = async () => {
    if (!deviceId.value) {
      pointList.value = [];
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
    lastRefreshTime.value = new Date();
    await nextTick();
    ensureCategoryHasCards();
  };

  const readCurrentValues = async () => {
    const current = device.value;
    if (!current) return;
    reading.value = true;
    try {
      const res = isTcpClient(current.protocol) ? await readDeviceTcpPoints(current.id) : await readDevicePoints(current.id);
      const rows = (isTcpClient(current.protocol) ? res.data?.points : res.data) || [];
      mergeReadRows(rows as PointReadItem[]);
    } catch {
      proxy?.$modal?.msgWarning?.('读取实时值失败，已显示最近一次采集值');
    } finally {
      reading.value = false;
    }
  };

  const refreshData = async () => {
    await loadPoints();
  };

  const mergeReadRows = (rows: PointReadItem[]) => {
    if (!rows?.length) return;
    const byCode = new Map(rows.map((row) => [row.pointCode, row]));
    pointList.value = pointList.value.map((point) => {
      const hit = byCode.get(point.pointCode);
      if (!hit) return point;
      return {
        ...point,
        currentValue: stringifyValue(hit.value),
        quality: hit.quality || point.quality,
        collectTime: new Date().toISOString()
      };
    });
  };

  const stringifyValue = (value: unknown) => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
  };

  const ensureCategoryHasCards = () => {
    if (displayCards.value.length) return;
    const firstCategory = visibleCategories.value.find((category) => categoryCount(category) > 0);
    activeCategory.value = firstCategory || visibleCategories.value[0];
  };

  const toDisplayCard = (point: PointVO): DisplayCard => {
    const name = normalizeConfig(point.displayName) || point.pointName || point.pointCode;
    const source = `${point.pointCode || ''} ${point.pointName || ''} ${point.tagAddress || ''}`.toLowerCase();
    const configuredMode = normalizeConfig(point.displayMode).toLowerCase();
    const setting = configuredMode === 'setting' ? true : configuredMode === 'current' ? false : isSettingPoint(source);
    const category = normalizeConfig(point.displayCategory) || resolveCategory(source, setting);
    const configuredType = normalizeConfig(point.displayType).toLowerCase();
    const kind = configuredType === 'indicator' ? 'indicator' : configuredType === 'metric' ? 'metric' : isIndicatorPoint(point, source) ? 'indicator' : 'metric';
    const active = isActiveValue(point.currentValue);
    const warn = source.includes('alarm') || source.includes('报警') || String(point.quality || '').toUpperCase() === 'BAD';

    return {
      id: toIdStr(point.id),
      name,
      value: formatValue(point.currentValue),
      unit: point.unit || inferUnit(source),
      category,
      setting,
      kind,
      sortText: source,
      displayOrder: Number.isFinite(Number(point.displayOrder)) ? Number(point.displayOrder) : undefined,
      active,
      warn,
      quality: point.quality
    };
  };

  const isSettingPoint = (source: string) => /设定|设置|目标|参数|set|setting|target|sv/.test(source);

  const resolveCategory = (source: string, setting: boolean) => {
    if (/合模|锁模|clamp|lock/.test(source)) return '合模';
    if (/射胶|射出|注射|inject|injection/.test(source)) return '射胶';
    if (/温度|油温|temp|temperature|t\d/.test(source)) return '温度';
    if (/保压|hold|holding/.test(source)) return '保压';
    if (/储料|熔胶|螺杆|charge|plastic|store/.test(source)) return '储料';
    if (/开模|open/.test(source)) return '开模';
    if (/座台|射台|carriage|nozzle/.test(source)) return '座台';
    if (/顶出|顶针|eject/.test(source)) return '顶出';
    if (!setting && /状态|status|mode|模式|生产|报警|待机|运行|启动|手动|自动/.test(source)) return '状态';
    return '其他';
  };

  const isIndicatorPoint = (point: PointVO, source: string) => {
    const value = String(point.currentValue ?? '').trim();
    if ((point.dataType || '').toUpperCase() === 'BOOL') return true;
    return /状态|status|报警|模式|启动|待机|运行|自动|手动/.test(source) && /^(0|1|true|false|on|off|yes|no)$/i.test(value);
  };

  const isActiveValue = (value: unknown) => {
    const text = String(value ?? '').trim().toLowerCase();
    return text === '1' || text === 'true' || text === 'on' || text === 'yes' || text === '运行' || text === '生产中';
  };

  const formatValue = (value: unknown) => {
    if (value == null || value === '') return '--';
    const text = String(value).trim();
    const num = Number(text);
    if (!Number.isFinite(num)) return text;
    if (Number.isInteger(num)) return String(num);
    return num.toFixed(2).replace(/\.?0+$/, '');
  };

  const inferUnit = (source: string) => {
    if (/温度|temp|temperature|t\d/.test(source)) return '°C';
    if (/压力|pressure|press/.test(source)) return 'bar';
    if (/速度|speed/.test(source)) return '%';
    if (/位置|行程|position|stroke/.test(source)) return 'mm';
    if (/时间|周期|time|cycle/.test(source)) return 's';
    if (/吨|ton/.test(source)) return 'TON';
    return '';
  };

  const sortCards = (a: DisplayCard, b: DisplayCard) => {
    const aConfigured = Number.isFinite(Number(a.displayOrder)) ? Number(a.displayOrder) : undefined;
    const bConfigured = Number.isFinite(Number(b.displayOrder)) ? Number(b.displayOrder) : undefined;
    if (aConfigured !== undefined || bConfigured !== undefined) {
      return (aConfigured ?? 100000) - (bConfigured ?? 100000);
    }
    const aOrder = resolveDisplayOrder(a);
    const bOrder = resolveDisplayOrder(b);
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name, 'zh-Hans-CN');
  };

  const resolveDisplayOrder = (card: DisplayCard) => {
    const patterns = ORDER_PATTERNS[activeMode.value]?.[card.category] || [];
    const hit = patterns.findIndex((pattern) => pattern.test(card.sortText));
    return hit >= 0 ? hit : 1000;
  };

  onMounted(() => {
    loadPoints();
    refreshTimer = window.setInterval(() => {
      readCurrentValues().then(() => {
        lastRefreshTime.value = new Date();
      });
    }, 30000);
  });

  onBeforeUnmount(() => {
    if (refreshTimer) window.clearInterval(refreshTimer);
  });

  return {
    pointList,
    activeMode,
    activeCategory,
    loading,
    reading,
    lastRefreshTime,
    activeModeLabel,
    visibleCategories,
    displayCards,
    allDisplayCards,
    cardCategories,
    modeCardCount,
    warnCount,
    isOnline,
    categoryCount,
    loadPoints,
    refreshData,
    readCurrentValues
  };
}
