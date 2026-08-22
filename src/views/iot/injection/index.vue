<template>
  <div class="injection-page">
    <header class="page-header">
      <div class="header-left">
        <button class="icon-button" type="button" title="返回设备" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
        </button>
        <div class="title-group">
          <span>Injection Data Acquisition</span>
          <h1>射出设备数采看板</h1>
        </div>
      </div>

      <div class="header-actions">
        <label class="device-picker">
          <span>设备</span>
          <el-select v-model="selectedDeviceId" filterable placeholder="请选择设备" @change="onDeviceChange">
            <el-option v-for="item in deviceOptions" :key="toIdStr(item.id)" :label="item.deviceCode || item.deviceName" :value="toIdStr(item.id)">
              <div class="option-row">
                <b>{{ item.deviceCode }}</b>
                <small>{{ item.deviceName }}</small>
              </div>
            </el-option>
          </el-select>
        </label>
        <button class="text-button primary" type="button" :disabled="loading || reading" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          <span>刷新</span>
        </button>
        <button class="icon-button" type="button" title="全屏" @click="toggleFullscreen">
          <el-icon><FullScreen /></el-icon>
        </button>
      </div>
    </header>

    <main class="page-body" v-loading="loading">
      <aside class="sidebar">
        <section class="device-card">
          <div class="device-status">
            <span class="signal" :class="{ on: isOnline(currentDevice) }"></span>
            <span>{{ isOnline(currentDevice) ? '在线' : '未刷新' }}</span>
          </div>
          <strong>{{ currentDevice?.deviceCode || '--' }}</strong>
          <p>{{ currentDevice?.deviceName || '请选择射出设备' }}</p>
        </section>

        <section class="mode-tabs">
          <button v-for="item in modeOptions" :key="item.value" type="button" :class="{ active: activeMode === item.value }" @click="activeMode = item.value">
            {{ item.label }}
          </button>
        </section>

        <section class="category-panel">
          <div class="panel-title">参数类别</div>
          <button v-for="item in visibleCategories" :key="item" type="button" :class="{ active: activeCategory === item }" @click="activeCategory = item">
            <span>{{ item }}</span>
            <b>{{ categoryCount(item) }}</b>
          </button>
        </section>
      </aside>

      <section class="content">
        <div class="content-head">
          <div>
            <span class="breadcrumb">{{ currentDevice?.deviceCode || '设备' }} / {{ activeModeLabel }}</span>
            <h2>{{ activeCategory }}参数</h2>
          </div>
          <div class="summary">
            <div>
              <span>参数总数</span>
              <strong>{{ modeCardCount }}</strong>
            </div>
            <div>
              <span>当前类别</span>
              <strong>{{ displayCards.length }}</strong>
            </div>
            <div class="warn">
              <span>异常/报警</span>
              <strong>{{ warnCount }}</strong>
            </div>
          </div>
        </div>

        <div v-if="!selectedDeviceId" class="empty-state">
          <el-icon><Monitor /></el-icon>
          <span>请选择射出设备</span>
        </div>

        <div v-else-if="displayCards.length" class="metric-grid">
          <article v-for="card in displayCards" :key="card.id" class="metric-card" :class="{ alarm: card.warn, active: card.active && card.kind === 'indicator' }">
            <div class="metric-card__head">
              <span>{{ card.kind === 'indicator' ? '状态信号' : '采集值' }}</span>
            </div>

            <div v-if="card.kind === 'indicator'" class="indicator-value">
              <span class="flat-signal" :class="{ on: card.active, alarm: card.warn }"></span>
              <strong>{{ card.active ? 'ON' : 'OFF' }}</strong>
            </div>
            <div v-else class="number-value">
              <strong :title="card.value">{{ card.value }}</strong>
              <span v-if="card.unit">{{ card.unit }}</span>
            </div>

            <div class="metric-name" :title="card.name">{{ card.name }}</div>
          </article>
        </div>

        <div v-else class="empty-state">
          <el-icon><WarningFilled /></el-icon>
          <span>当前类别暂无参数</span>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup name="IotInjectionDisplay" lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, FullScreen, Monitor, Refresh, WarningFilled } from '@element-plus/icons-vue';
import { listDevice, readDevicePoints, readDeviceTcpPoints, type PointReadItem } from '@/api/iot/device';
import { listPoint } from '@/api/iot/point';
import type { DeviceVO } from '@/api/iot/device/types';
import type { PointVO } from '@/api/iot/point/types';

type DisplayMode = 'current' | 'setting';
type CardKind = 'metric' | 'indicator';

interface DisplayCard {
  id: string;
  name: string;
  value: string;
  unit: string;
  category: string;
  setting: boolean;
  kind: CardKind;
  sortText: string;
  active: boolean;
  warn: boolean;
  quality?: string;
}

const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const modeOptions: Array<{ label: string; value: DisplayMode }> = [
  { label: '状态显示值参数', value: 'current' },
  { label: '设定值参数', value: 'setting' }
];

const currentCategories = ['状态', '合模', '射胶', '温度', '储料', '开模', '顶出', '其他'];
const settingCategories = ['合模', '射胶', '温度', '保压', '储料', '开模', '座台', '顶出', '其他'];

const ORDER_PATTERNS: Record<DisplayMode, Record<string, RegExp[]>> = {
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

const deviceOptions = ref<DeviceVO[]>([]);
const pointList = ref<PointVO[]>([]);
const selectedDeviceId = ref('');
const activeMode = ref<DisplayMode>('current');
const activeCategory = ref('状态');
const loading = ref(false);
const reading = ref(false);
const lastRefreshTime = ref<Date | null>(null);
let refreshTimer: number | undefined;

const currentDevice = computed(() => deviceOptions.value.find((item) => toIdStr(item.id) === selectedDeviceId.value) || null);
const activeModeLabel = computed(() => modeOptions.find((item) => item.value === activeMode.value)?.label || '');
const visibleCategories = computed(() => (activeMode.value === 'current' ? currentCategories : settingCategories));
const lastRefreshText = computed(() => (lastRefreshTime.value ? formatTime(lastRefreshTime.value) : '未刷新'));

const normalizedCards = computed<DisplayCard[]>(() => pointList.value.map(toDisplayCard));
const modeCards = computed(() => normalizedCards.value.filter((card) => card.setting === (activeMode.value === 'setting')));
const displayCards = computed(() => modeCards.value.filter((card) => card.category === activeCategory.value).sort((a, b) => sortCards(a, b)));
const modeCardCount = computed(() => modeCards.value.length);
const warnCount = computed(() => modeCards.value.filter((card) => card.warn).length);

watch(activeMode, () => {
  activeCategory.value = visibleCategories.value[0];
  nextTick(ensureCategoryHasCards);
});

watch(
  () => route.query.deviceId,
  (id) => {
    const nextId = Array.isArray(id) ? id[0] : id;
    if (nextId && nextId !== selectedDeviceId.value) {
      selectedDeviceId.value = String(nextId);
      loadPoints();
    }
  }
);

const toIdStr = (id?: string | number | null) => (id == null || id === '' ? '' : String(id));
const isOnline = (row?: DeviceVO | null) => String(row?.onlineStatus ?? '0') === '1';
const categoryCount = (category: string) => modeCards.value.filter((card) => card.category === category).length;

const isTcpClient = (protocol?: string) => {
  const value = (protocol || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
  return value === 'tcp-client' || value === 'tcpclient' || value === 'tcp';
};

const goBack = () => router.push('/iot/device');

const onDeviceChange = () => {
  router.replace({ path: route.path, query: selectedDeviceId.value ? { deviceId: selectedDeviceId.value } : {} });
  loadPoints();
};

const loadDevices = async () => {
  const res = await listDevice({ pageNum: 1, pageSize: 500 });
  deviceOptions.value = ((res as any).rows ?? []) as DeviceVO[];
  const routeDeviceId = Array.isArray(route.query.deviceId) ? route.query.deviceId[0] : route.query.deviceId;
  selectedDeviceId.value = String(routeDeviceId || deviceOptions.value[0]?.id || '');
};

const loadPoints = async () => {
  if (!selectedDeviceId.value) {
    pointList.value = [];
    return;
  }
  loading.value = true;
  try {
    const res = await listPoint({ deviceId: selectedDeviceId.value, pageNum: 1, pageSize: 1000 });
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
  const device = currentDevice.value;
  if (!device) return;
  reading.value = true;
  try {
    const res = isTcpClient(device.protocol) ? await readDeviceTcpPoints(device.id) : await readDevicePoints(device.id);
    const rows = (isTcpClient(device.protocol) ? res.data?.points : res.data) || [];
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
  const name = point.pointName || point.pointCode;
  const source = `${point.pointCode || ''} ${point.pointName || ''} ${point.tagAddress || ''}`.toLowerCase();
  const setting = isSettingPoint(source);
  const category = resolveCategory(source, setting);
  const kind = isIndicatorPoint(point, source) ? 'indicator' : 'metric';
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

const formatTime = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const toggleFullscreen = async () => {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void>;
    webkitFullscreenElement?: Element;
  };
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
  const fullscreenElement = document.fullscreenElement || doc.webkitFullscreenElement;
  if (fullscreenElement) {
    await (document.exitFullscreen?.() || doc.webkitExitFullscreen?.());
  } else {
    await (el.requestFullscreen?.() || el.webkitRequestFullscreen?.());
  }
};

onMounted(async () => {
  await loadDevices();
  await loadPoints();
  refreshTimer = window.setInterval(() => {
    readCurrentValues().then(() => {
      lastRefreshTime.value = new Date();
    });
  }, 30000);
});

onBeforeUnmount(() => {
  if (refreshTimer) window.clearInterval(refreshTimer);
});
</script>

<style scoped lang="scss">
.injection-page {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #e7edf7;
  background:
    linear-gradient(rgba(128, 156, 196, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(128, 156, 196, 0.055) 1px, transparent 1px),
    radial-gradient(circle at 22% 0, rgba(45, 121, 255, 0.2), transparent 32%),
    radial-gradient(circle at 86% 12%, rgba(37, 214, 170, 0.13), transparent 30%),
    #08111f;
  background-size:
    40px 40px,
    40px 40px,
    auto,
    auto,
    auto;
  font-family: Inter, 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 76px;
  padding: 0 24px;
  border-bottom: 1px solid rgba(134, 157, 190, 0.18);
  background: rgba(8, 15, 28, 0.9);
  backdrop-filter: blur(16px);
}

.header-left,
.header-actions {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 14px;
}

.title-group {
  min-width: 0;

  span {
    display: block;
    margin-bottom: 4px;
    color: #32d6ff;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    overflow: hidden;
    color: #ffffff;
    font-size: 26px;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.device-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 8px 0 14px;
  border: 1px solid rgba(134, 157, 190, 0.24);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.07);

  > span {
    color: #9aabc2;
    font-size: 13px;
    font-weight: 800;
  }

  :deep(.el-select) {
    width: 210px;
  }
}

.option-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;

  small {
    color: #7a8798;
  }
}

.icon-button,
.text-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  border: 1px solid rgba(134, 157, 190, 0.26);
  border-radius: 8px;
  color: #d9e5f5;
  background: rgba(255, 255, 255, 0.07);
  cursor: pointer;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background 0.16s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: rgba(59, 216, 255, 0.7);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.58;
  }
}

.icon-button {
  width: 42px;
}

.text-button {
  gap: 8px;
  padding: 0 16px;
  font-weight: 800;

  &.primary {
    border-color: rgba(45, 218, 178, 0.42);
    color: #06251d;
    background: linear-gradient(135deg, #32e3b8, #35c9ff);
  }
}

.page-body {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  flex: 1;
  min-height: 0;
  gap: 18px;
  padding: 18px;
}

.sidebar,
.content {
  min-height: 0;
  border: 1px solid rgba(134, 157, 190, 0.2);
  border-radius: 12px;
  background: rgba(10, 20, 35, 0.82);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 20px 56px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(16px);
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  overflow: visible;
}

.device-card {
  padding: 16px;
  border: 1px solid rgba(134, 157, 190, 0.22);
  border-radius: 10px;
  background:
    linear-gradient(135deg, rgba(50, 115, 255, 0.15), rgba(38, 213, 170, 0.08)),
    rgba(255, 255, 255, 0.045);

  strong {
    display: block;
    margin: 14px 0 6px;
    overflow: hidden;
    color: #fff;
    font-size: 26px;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p {
    margin: 0;
    overflow: hidden;
    color: #99aac1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.device-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  color: #c8d5e7;
  background: rgba(255, 255, 255, 0.08);
  font-size: 13px;
  font-weight: 800;
}

.signal,
.flat-signal {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #69778a;
  box-shadow: 0 0 0 4px rgba(105, 119, 138, 0.12);

  &.on {
    background: #38e79b;
    box-shadow:
      0 0 0 4px rgba(56, 231, 155, 0.12),
      0 0 18px rgba(56, 231, 155, 0.72);
  }

  &.alarm {
    background: #ff5f5f;
    box-shadow:
      0 0 0 4px rgba(255, 95, 95, 0.12),
      0 0 18px rgba(255, 95, 95, 0.72);
  }
}

.flat-signal {
  width: 16px;
  height: 16px;
}

.mode-tabs {
  display: grid;
  gap: 8px;

  button {
    height: 44px;
    border: 1px solid rgba(134, 157, 190, 0.22);
    border-radius: 8px;
    color: #acbbce;
    text-align: left;
    font-weight: 800;
    background: rgba(255, 255, 255, 0.045);
    cursor: pointer;
    padding: 0 14px;

    &.active {
      border-color: rgba(51, 214, 255, 0.5);
      color: #fff;
      background: linear-gradient(135deg, rgba(45, 120, 255, 0.28), rgba(45, 218, 178, 0.14));
    }
  }
}

.category-panel {
  display: grid;
  flex: 1;
  min-height: auto;
  align-content: start;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  overflow: visible;

  .panel-title {
    grid-column: 1 / -1;
    margin: 2px 0 6px;
    color: #7f90a7;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 40px;
    min-width: 0;
    border: 1px solid transparent;
    border-radius: 8px;
    color: #a9b8cb;
    background: transparent;
    cursor: pointer;
    padding: 0 12px;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    b {
      min-width: 28px;
      padding: 3px 8px;
      border-radius: 999px;
      color: #8fa0b6;
      text-align: center;
      background: rgba(255, 255, 255, 0.07);
    }

    &.active {
      border-color: rgba(45, 218, 178, 0.34);
      color: #fff;
      background: rgba(45, 218, 178, 0.12);

      b {
        color: #061f19;
        background: #3be3b9;
      }
    }
  }
}

.content {
  display: flex;
  flex-direction: column;
  padding: 18px;
  overflow: hidden;
}

.content-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(134, 157, 190, 0.15);

  .breadcrumb {
    color: #32d6ff;
    font-size: 13px;
    font-weight: 900;
  }

  h2 {
    margin: 8px 0 0;
    color: #fff;
    font-size: 30px;
    line-height: 1.1;
  }
}

.summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(116px, 1fr));
  gap: 10px;
  min-width: 410px;

  div {
    padding: 12px 14px;
    border: 1px solid rgba(134, 157, 190, 0.2);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.055);
  }

  span {
    display: block;
    margin-bottom: 6px;
    color: #8394aa;
    font-size: 12px;
  }

  strong {
    color: #fff;
    font-size: 24px;
    line-height: 1;
  }

  .warn strong {
    color: #ffcf5c;
  }
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(238px, 1fr));
  gap: 14px;
  align-content: start;
  min-height: 0;
  margin-top: 18px;
  overflow-y: auto;
  padding-right: 4px;
}

.metric-card {
  display: flex;
  min-height: 148px;
  flex-direction: column;
  border: 1px solid rgba(134, 157, 190, 0.2);
  border-top: 3px solid #32d6ff;
  border-radius: 8px;
  background: rgba(17, 29, 46, 0.92);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045);

  &.active {
    border-top-color: #3be3b9;
    background: linear-gradient(180deg, rgba(45, 218, 178, 0.12), rgba(17, 29, 46, 0.92));
  }

  &.alarm {
    border-color: rgba(255, 199, 86, 0.46);
    border-top-color: #ffcf5c;
  }
}

.metric-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 14px 4px;

  span {
    color: #8ea0b8;
    font-size: 12px;
    font-weight: 900;
  }

  em {
    font-style: normal;
  }
}

.indicator-value,
.number-value {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  padding: 8px 14px;
}

.indicator-value {
  gap: 12px;

  strong {
    color: #d7e4f4;
    font-size: 30px;
    line-height: 1;
  }
}

.number-value {
  gap: 8px;

  strong {
    min-width: 0;
    overflow: hidden;
    color: #fff;
    font-size: clamp(25px, 2.7vw, 40px);
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    align-self: flex-end;
    margin-bottom: 5px;
    color: #93a5be;
    font-size: 13px;
    font-weight: 900;
  }
}

.metric-name {
  min-height: 34px;
  padding: 8px 14px 12px;
  overflow: hidden;
  border-top: 1px solid rgba(134, 157, 190, 0.1);
  color: #c6d3e4;
  font-size: 14px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 260px;
  color: #8da0ba;
  font-size: 18px;

  .el-icon {
    color: #32d6ff;
    font-size: 34px;
  }
}

:deep(.el-select__wrapper) {
  min-height: 34px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: none;
}

:deep(.el-loading-mask) {
  background-color: rgba(5, 9, 17, 0.58);
  backdrop-filter: blur(3px);
}

:deep(.el-loading-spinner .path) {
  stroke: #32d6ff;
}

@media (max-width: 1100px) {
  .page-body {
    grid-template-columns: 280px minmax(0, 1fr);
  }

  .summary {
    min-width: 360px;
  }
}

@media (max-width: 860px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
    height: auto;
    gap: 12px;
    padding: 12px;
  }

  .header-actions {
    flex-wrap: wrap;
  }

  .page-body {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .category-panel {
    flex-direction: row;
    overflow-x: auto;

    .panel-title {
      display: none;
    }

    button {
      min-width: 96px;
    }
  }

  .content-head {
    flex-direction: column;
  }

  .summary {
    min-width: 0;
  }
}
</style>
