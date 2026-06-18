<!-- views/allocation/components/InventoryStatus.vue -->
<template>
  <div class="inventory-status">
    <el-tooltip :content="tooltipText" placement="top">
      <span class="status-dot" :class="`status-${inventoryStatus.toLowerCase()}`" />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getOrderRequiredQty, resolveRowAvailableQty, resolveRowInventoryStatus } from '@/api/wms/allocation/index';

interface Props {
  material: any;
}

const props = defineProps<Props>();

/** 解析物料库存状态枚举 */
const inventoryStatus = computed(() => resolveRowInventoryStatus(props.material));

/** 库存状态中文文案 */
const statusText = computed(() => {
  const statusMap = {
    UNKNOWN: '未检查',
    SUFFICIENT: '充足',
    PARTIAL: '部分缺料',
    SHORTAGE: '缺料'
  };
  return statusMap[inventoryStatus.value];
});

/** 悬停提示：可用量与需求量对比 */
const tooltipText = computed(() => {
  const material = props.material;
  if (inventoryStatus.value === 'UNKNOWN') {
    return '库存未检查';
  }

  const required = getOrderRequiredQty(material);
  const available = resolveRowAvailableQty(material) ?? 0;
  const shortage = required - available;

  if (inventoryStatus.value === 'SUFFICIENT') {
    return `${statusText.value} (${available}/${required})`;
  }
  if (inventoryStatus.value === 'PARTIAL') {
    return `${statusText.value} (${available}/${required}，缺${shortage})`;
  }
  return `${statusText.value} (可用: ${available}，需求: ${required})`;
});
</script>

<style scoped>
.inventory-status {
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.status-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-unknown {
  background: #c0c4cc;
}

.status-sufficient {
  background: #67c23a;
  box-shadow: 0 0 6px rgba(103, 194, 58, 0.65);
}

.status-partial {
  background: #e6a23c;
  box-shadow: 0 0 6px rgba(230, 162, 60, 0.65);
}

.status-shortage {
  background: #f56c6c;
  box-shadow: 0 0 6px rgba(245, 108, 108, 0.65);
}
</style>
