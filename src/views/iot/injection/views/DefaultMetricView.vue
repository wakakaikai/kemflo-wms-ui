<template>
  <main class="metric-page" v-loading="loading">
    <header class="metric-header">
      <div class="device-brief">
        <div class="device-brief__title">
          <strong>{{ device?.deviceCode || '--' }}</strong>
          <span>{{ device?.deviceName || '请选择设备' }}</span>
        </div>
        <div class="device-brief__status" :class="{ online: isOnline(device) }">
          <span class="status-dot" />
          {{ isOnline(device) ? '在线' : '离线' }}
        </div>
      </div>
      <div class="metric-stats">
        <div class="stat-chip">
          <span>属性总数</span>
          <strong>{{ allDisplayCards.length }}</strong>
        </div>
        <div class="stat-chip warn">
          <span>异常</span>
          <strong>{{ warnCountAll }}</strong>
        </div>
      </div>
    </header>

    <div v-if="cardCategories.length > 1" class="category-bar">
      <button
        v-for="item in cardCategories"
        :key="item"
        type="button"
        :class="{ active: activeCategory === item }"
        @click="activeCategory = item"
      >
        {{ item }}
        <b v-if="item !== '全部'">{{ categoryCardCount(item) }}</b>
      </button>
    </div>

    <div v-if="!deviceId" class="empty-state">
      <el-icon><Monitor /></el-icon>
      <span>请选择设备</span>
    </div>

    <div v-else-if="filteredCards.length" class="metric-grid">
      <article
        v-for="card in filteredCards"
        :key="card.id"
        class="metric-card"
        :class="[`tone-${categoryTone(card.category)}`, { alarm: card.warn, active: card.active && card.kind === 'indicator' }]"
      >
        <div class="metric-card__top">
          <span class="metric-card__category">{{ card.category || '其他' }}</span>
          <span class="metric-card__badge" :class="{ warn: card.warn }">{{ card.warn ? '异常' : card.kind === 'indicator' ? '状态' : '数值' }}</span>
        </div>

        <div v-if="card.kind === 'indicator'" class="metric-card__indicator">
          <span class="indicator-pill" :class="{ on: card.active, alarm: card.warn }">
            {{ card.active ? 'ON' : 'OFF' }}
          </span>
        </div>
        <div v-else class="metric-card__value">
          <strong :title="card.value">{{ card.value }}</strong>
          <em v-if="card.unit">{{ card.unit }}</em>
        </div>

        <div class="metric-card__name" :title="card.name">{{ card.name }}</div>
      </article>
    </div>

    <div v-else class="empty-state">
      <el-icon><WarningFilled /></el-icon>
      <span>暂无可展示属性，请在点位配置中开启「是否显示」</span>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { Monitor, WarningFilled } from '@element-plus/icons-vue';
import type { DeviceVO } from '@/api/iot/device/types';
import { useInjectionDisplay } from '../composables/useInjectionDisplay';

const props = defineProps<{
  deviceId: string;
  device: DeviceVO | null;
}>();

const deviceIdRef = toRef(props, 'deviceId');
const deviceRef = computed(() => props.device);
const activeCategory = ref('全部');

const { loading, allDisplayCards, cardCategories, isOnline, refreshData } = useInjectionDisplay(deviceIdRef, deviceRef);

const warnCountAll = computed(() => allDisplayCards.value.filter((card) => card.warn).length);

const filteredCards = computed(() => {
  if (activeCategory.value === '全部') return allDisplayCards.value;
  return allDisplayCards.value.filter((card) => card.category === activeCategory.value);
});

const categoryCardCount = (category: string) => allDisplayCards.value.filter((card) => card.category === category).length;

const categoryTone = (category?: string) => {
  const map: Record<string, string> = {
    状态: 'blue',
    合模: 'cyan',
    射胶: 'orange',
    温度: 'red',
    保压: 'purple',
    储料: 'green',
    开模: 'teal',
    座台: 'indigo',
    顶出: 'amber',
    其他: 'slate'
  };
  return map[category || '其他'] || 'slate';
};

defineExpose({
  refresh: refreshData
});
</script>

<style scoped lang="scss">
.metric-page {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  overflow: hidden;
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border: 1px solid rgba(134, 157, 190, 0.22);
  border-radius: 12px;
  background:
    linear-gradient(135deg, rgba(45, 120, 255, 0.16), rgba(45, 218, 178, 0.08)),
    rgba(10, 20, 35, 0.82);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.device-brief {
  min-width: 0;

  &__title {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 10px;

    strong {
      color: #fff;
      font-size: 24px;
      line-height: 1.1;
    }

    span {
      overflow: hidden;
      color: #9db0c9;
      font-size: 14px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding: 4px 10px;
    border-radius: 999px;
    color: #9db0c9;
    font-size: 13px;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.06);

    &.online {
      color: #7ee787;
      background: rgba(56, 231, 155, 0.12);
    }
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #69778a;

  .online & {
    background: #38e79b;
    box-shadow: 0 0 10px rgba(56, 231, 155, 0.8);
  }
}

.metric-stats {
  display: flex;
  gap: 10px;
}

.stat-chip {
  min-width: 92px;
  padding: 10px 14px;
  border: 1px solid rgba(134, 157, 190, 0.18);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);

  span {
    display: block;
    margin-bottom: 4px;
    color: #8394aa;
    font-size: 12px;
  }

  strong {
    color: #fff;
    font-size: 22px;
    line-height: 1;
  }

  &.warn strong {
    color: #ffcf5c;
  }
}

.category-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 34px;
    padding: 0 14px;
    border: 1px solid rgba(134, 157, 190, 0.18);
    border-radius: 999px;
    color: #a9b8cb;
    font-size: 13px;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.04);
    cursor: pointer;
    transition: all 0.15s ease;

    b {
      min-width: 18px;
      padding: 0 6px;
      border-radius: 999px;
      color: #8fa0b6;
      font-size: 12px;
      background: rgba(255, 255, 255, 0.08);
    }

    &.active {
      border-color: rgba(50, 214, 255, 0.45);
      color: #fff;
      background: rgba(50, 214, 255, 0.12);

      b {
        color: #062028;
        background: #32d6ff;
      }
    }
  }
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
  align-content: start;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.metric-card {
  position: relative;
  display: flex;
  min-height: 156px;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(134, 157, 190, 0.18);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02)),
    rgba(17, 29, 46, 0.92);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 10px 28px rgba(0, 0, 0, 0.18);
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;

  &::before {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 3px;
    background: var(--accent, #32d6ff);
    content: '';
  }

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(134, 157, 190, 0.32);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 16px 34px rgba(0, 0, 0, 0.24);
  }

  &.alarm {
    border-color: rgba(255, 199, 86, 0.42);
  }

  &.tone-blue {
    --accent: #60a5fa;
  }
  &.tone-cyan {
    --accent: #22d3ee;
  }
  &.tone-orange {
    --accent: #fb923c;
  }
  &.tone-red {
    --accent: #f87171;
  }
  &.tone-purple {
    --accent: #a78bfa;
  }
  &.tone-green {
    --accent: #4ade80;
  }
  &.tone-teal {
    --accent: #2dd4bf;
  }
  &.tone-indigo {
    --accent: #818cf8;
  }
  &.tone-amber {
    --accent: #fbbf24;
  }
  &.tone-slate {
    --accent: #94a3b8;
  }
}

.metric-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 14px 14px 8px;
}

.metric-card__category {
  overflow: hidden;
  color: #8ea0b8;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-card__badge {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  color: #7ee787;
  font-size: 11px;
  font-weight: 700;
  background: rgba(56, 231, 155, 0.12);

  &.warn {
    color: #ffcf5c;
    background: rgba(255, 199, 86, 0.14);
  }
}

.metric-card__indicator,
.metric-card__value {
  display: flex;
  flex: 1;
  align-items: center;
  min-height: 64px;
  padding: 0 14px;
}

.metric-card__indicator {
  justify-content: flex-start;
}

.indicator-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 36px;
  padding: 0 16px;
  border-radius: 999px;
  color: #94a3b8;
  font-size: 18px;
  font-weight: 800;
  background: rgba(148, 163, 184, 0.14);

  &.on {
    color: #052e1a;
    background: linear-gradient(135deg, #34d399, #22c55e);
    box-shadow: 0 0 18px rgba(34, 197, 94, 0.35);
  }

  &.alarm {
    color: #451a03;
    background: linear-gradient(135deg, #fcd34d, #f59e0b);
  }
}

.metric-card__value {
  gap: 8px;

  strong {
    min-width: 0;
    overflow: hidden;
    color: #fff;
    font-size: clamp(28px, 3vw, 38px);
    font-variant-numeric: tabular-nums;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  em {
    align-self: flex-end;
    margin-bottom: 4px;
    color: #93a5be;
    font-size: 14px;
    font-style: normal;
    font-weight: 700;
  }
}

.metric-card__name {
  padding: 10px 14px 14px;
  overflow: hidden;
  border-top: 1px solid rgba(134, 157, 190, 0.1);
  color: #c6d3e4;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 240px;
  color: #8da0ba;
  font-size: 16px;

  .el-icon {
    color: #32d6ff;
    font-size: 30px;
  }
}

:deep(.el-loading-mask) {
  background-color: rgba(5, 9, 17, 0.58);
}

@media (max-width: 860px) {
  .metric-header {
    flex-direction: column;
    align-items: stretch;
  }

  .metric-stats {
    justify-content: flex-start;
  }
}
</style>
