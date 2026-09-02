<template>
  <div class="injection-page">
    <header class="page-header">
      <div class="header-left">
        <button class="icon-button" type="button" title="返回设备" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
        </button>
        <div class="title-group">
          <span>Injection Data Acquisition</span>
          <h1>数采看板</h1>
          <small v-if="activeViewLabel">视图：{{ activeViewLabel }}</small>
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
        <button class="text-button primary" type="button" :disabled="loadingDevices || refreshing" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          <span>刷新</span>
        </button>
        <button class="icon-button" type="button" title="全屏" @click="toggleFullscreen">
          <el-icon><FullScreen /></el-icon>
        </button>
      </div>
    </header>

    <component
      :is="activeViewComponent"
      ref="viewRef"
      :key="`${selectedDeviceId}-${activeViewKey}`"
      :device-id="selectedDeviceId"
      :device="currentDevice"
    />
  </div>
</template>

<script setup name="IotInjectionDisplay" lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, FullScreen, Refresh } from '@element-plus/icons-vue';
import { listDevice } from '@/api/iot/device';
import type { DeviceVO } from '@/api/iot/device/types';
import {
  DEFAULT_INJECTION_VIEW,
  getInjectionViewLabel,
  resolveInjectionViewComponent
} from './views/registry';

const route = useRoute();
const router = useRouter();

const deviceOptions = ref<DeviceVO[]>([]);
const selectedDeviceId = ref('');
const loadingDevices = ref(false);
const refreshing = ref(false);
const viewRef = ref<{ refresh?: () => Promise<void> }>();

const currentDevice = computed(() => deviceOptions.value.find((item) => toIdStr(item.id) === selectedDeviceId.value) || null);
const activeViewKey = computed(() => String(currentDevice.value?.displayView || DEFAULT_INJECTION_VIEW).trim().toLowerCase() || DEFAULT_INJECTION_VIEW);
const activeViewComponent = computed(() => resolveInjectionViewComponent(activeViewKey.value));
const activeViewLabel = computed(() => getInjectionViewLabel(activeViewKey.value));

watch(
  () => route.query.deviceId,
  (id) => {
    const nextId = Array.isArray(id) ? id[0] : id;
    if (nextId && nextId !== selectedDeviceId.value) {
      selectedDeviceId.value = String(nextId);
    }
  }
);

const toIdStr = (id?: string | number | null) => (id == null || id === '' ? '' : String(id));

const goBack = () => router.push('/iot/device');

const onDeviceChange = () => {
  router.replace({ path: route.path, query: selectedDeviceId.value ? { deviceId: selectedDeviceId.value } : {} });
};

const loadDevices = async () => {
  loadingDevices.value = true;
  try {
    const res = await listDevice({ pageNum: 1, pageSize: 500 });
    deviceOptions.value = ((res as any).rows ?? []) as DeviceVO[];
    const routeDeviceId = Array.isArray(route.query.deviceId) ? route.query.deviceId[0] : route.query.deviceId;
    selectedDeviceId.value = String(routeDeviceId || deviceOptions.value[0]?.id || '');
  } finally {
    loadingDevices.value = false;
  }
};

const refreshData = async () => {
  refreshing.value = true;
  try {
    await viewRef.value?.refresh?.();
  } finally {
    refreshing.value = false;
  }
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

  small {
    display: block;
    margin-top: 4px;
    color: #8ea0b8;
    font-size: 12px;
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
}
</style>
