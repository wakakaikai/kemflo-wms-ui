<template>
  <div class="kit-rate-indicator">
    <el-progress
      :text-inside="true"
      :stroke-width="20"
      :percentage="displayPercentage"
      :status="progressStatus"
      :format="formatProgress"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { calcRowKitRate } from '@/api/wms/allocation/index';

interface Props {
  material: any;
}

const props = defineProps<Props>();

/** 库存是否尚未检查 */
const isUnchecked = computed(() => {
  const material = props.material;
  const available = material?.effectiveAvailableQty ?? material?.availableQty;
  return available === undefined || available === null;
});

/** 行级齐套率（0~1） */
const kitRate = computed(() => {
  if (isUnchecked.value) {
    return 0;
  }
  return calcRowKitRate(props.material);
});

/** 齐套率整数百分比 */
const kitRatePercentage = computed(() => Math.round(kitRate.value * 100));

/** 进度条展示用百分比 */
const displayPercentage = computed(() => (isUnchecked.value ? 0 : kitRatePercentage.value));

/** 进度条状态色（成功/警告/异常） */
const progressStatus = computed(() => {
  if (isUnchecked.value) {
    return undefined;
  }
  if (kitRatePercentage.value >= 100) {
    return 'success';
  }
  if (kitRatePercentage.value >= 80) {
    return 'warning';
  }
  return 'exception';
});

/** 格式化进度条内文案 */
const formatProgress = () => {
  if (isUnchecked.value) {
    return '未检查';
  }
  return `${kitRatePercentage.value}%`;
};
</script>

<style scoped>
.kit-rate-indicator {
  min-width: 88px;
}

.kit-rate-indicator :deep(.el-progress-bar__innerText) {
  font-size: 12px;
}
</style>
