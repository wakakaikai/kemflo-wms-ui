<template>
  <div class="fulfillment-panel">
    <div v-for="item in items" :key="item.key" class="fulfill-item">
      <div class="fulfill-icon">
        <img :src="item.iconImg" alt="" class="fulfill-icon-img" />
      </div>
      <div class="fulfill-main">
        <div class="fulfill-label">{{ item.label }}</div>
        <div class="fulfill-value" :class="item.theme">{{ item.value }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ShortageFulfillmentSimulationResult } from '@/api/scada/shortageTask';
import iconGreen from '@/assets/images/scada/shortageTask/hub/green.png';
import iconOrange from '@/assets/images/scada/shortageTask/hub/orange.png';
import iconNone from '@/assets/icons/svg/shortageMaterial.svg';

const props = defineProps<{
  summary: ShortageFulfillmentSimulationResult['summary'] | null;
}>();

const items = computed(() => {
  const s = props.summary;
  return [
    {
      key: 'full',
      label: '库存完全满足',
      value: s?.fullLineCount ?? 0,
      theme: 'theme-green',
      iconImg: iconGreen
    },
    {
      key: 'partial',
      label: '部分满足',
      value: s?.partialLineCount ?? 0,
      theme: 'theme-orange',
      iconImg: iconOrange
    },
    {
      key: 'none',
      label: '无法满足',
      value: s?.noneLineCount ?? 0,
      theme: 'theme-red',
      iconImg: iconNone
    }
  ];
});
</script>

<style scoped lang="scss">
.fulfillment-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 4px 2px;
}

.fulfill-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  padding: 8px 6px;
  border-radius: 4px;
  border: 1px solid rgba(25, 186, 139, 0.17);
  background: rgba(255, 255, 255, 0.03);
  text-align: center;
}

.fulfill-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(0, 20, 40, 0.45);
}

.fulfill-icon-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.theme-green {
  color: #69db7c;
}

.theme-orange {
  color: #ffb347;
}

.theme-red {
  color: #ff8787;
}

.fulfill-main {
  width: 100%;
  min-width: 0;
}

.fulfill-label {
  font-size: 12px;
  color: rgba(198, 224, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fulfill-value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  font-family: Consolas, 'Courier New', monospace;
}
</style>
