<template>
  <div class="kit-rate-indicator">
    <el-progress :percentage="kitRatePercentage" :stroke-width="16" :color="progressColor" :show-text="true" :format="formatProgress" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  material: any;
}

const props = defineProps<Props>();

// 计算齐套率
const kitRate = computed(() => {
  const material = props.material;

  if (!material.availableQty && material.availableQty !== 0) {
    return 0;
  }

  if (!material.componentQty || material.componentQty === 0) {
    return 1;
  }

  return Math.min(material.availableQty / material.componentQty, 1);
});

// 齐套率百分比
const kitRatePercentage = computed(() => {
  return Math.round(kitRate.value * 100);
});

// 进度条颜色
const progressColor = computed(() => {
  if (kitRatePercentage.value >= 100) return '#67c23a';
  if (kitRatePercentage.value >= 70) return '#e6a23c';
  return '#f56c6c';
});

// 格式化进度文本
const formatProgress = (percentage: number) => {
  const material = props.material;
  if (!material.availableQty && material.availableQty !== 0) {
    return '未检查';
  }

  const available = material.availableQty || 0;
  const required = material.componentQty;

  if (percentage === 100) {
    return '充足';
  }

  return `${percentage}% (${available}/${required})`;
};
</script>

<style scoped>
.kit-rate-indicator {
  min-width: 100px;
}
</style>
