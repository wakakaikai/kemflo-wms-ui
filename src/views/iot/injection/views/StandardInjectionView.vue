<template>
  <main class="page-body" v-loading="loading">
    <aside class="sidebar">
      <section class="device-card">
        <div class="device-status">
          <span class="signal" :class="{ on: isOnline(device) }"></span>
          <span>{{ isOnline(device) ? '在线' : '未刷新' }}</span>
        </div>
        <strong>{{ device?.deviceCode || '--' }}</strong>
        <p>{{ device?.deviceName || '请选择射出设备' }}</p>
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
          <span class="breadcrumb">{{ device?.deviceCode || '设备' }} / {{ activeModeLabel }}</span>
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

      <div v-if="!deviceId" class="empty-state">
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
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue';
import { Monitor, WarningFilled } from '@element-plus/icons-vue';
import type { DeviceVO } from '@/api/iot/device/types';
import { modeOptions, useInjectionDisplay } from '../composables/useInjectionDisplay';

const props = defineProps<{
  deviceId: string;
  device: DeviceVO | null;
}>();

const deviceIdRef = toRef(props, 'deviceId');
const deviceRef = computed(() => props.device);

const {
  activeMode,
  activeCategory,
  loading,
  activeModeLabel,
  visibleCategories,
  displayCards,
  modeCardCount,
  warnCount,
  isOnline,
  categoryCount,
  refreshData
} = useInjectionDisplay(deviceIdRef, deviceRef);

defineExpose({
  refresh: refreshData
});
</script>

<style scoped lang="scss">
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

@media (max-width: 1100px) {
  .page-body {
    grid-template-columns: 280px minmax(0, 1fr);
  }

  .summary {
    min-width: 360px;
  }
}

@media (max-width: 860px) {
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
