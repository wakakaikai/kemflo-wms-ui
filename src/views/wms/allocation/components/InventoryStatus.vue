<!-- views/allocation/components/InventoryStatus.vue -->
<template>
  <div class="inventory-status">
    <el-tooltip :content="tooltipText" placement="top">
      <el-tag :type="statusType" size="small" :effect="effect">
        {{ statusText }}
      </el-tag>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  material: any;
  effect?: 'dark' | 'light' | 'plain';
}

const props = withDefaults(defineProps<Props>(), {
  effect: 'light'
});

// 计算库存状态
const inventoryStatus = computed(() => {
  const material = props.material;

  if (!material.availableQty && material.availableQty !== 0) {
    return 'UNKNOWN';
  }

  if (material.availableQty >= material.componentQty) {
    return 'SUFFICIENT';
  } else if (material.availableQty > 0) {
    return 'PARTIAL';
  } else {
    return 'SHORTAGE';
  }
});

// 状态文本
const statusText = computed(() => {
  const statusMap = {
    'UNKNOWN': '未检查',
    'SUFFICIENT': '充足',
    'PARTIAL': '部分',
    'SHORTAGE': '缺料'
  };
  return statusMap[inventoryStatus.value];
});

// 状态标签类型
const statusType = computed(() => {
  const typeMap = {
    'UNKNOWN': 'info',
    'SUFFICIENT': 'success',
    'PARTIAL': 'warning',
    'SHORTAGE': 'danger'
  };
  return typeMap[inventoryStatus.value];
});

// 提示文本
const tooltipText = computed(() => {
  const material = props.material;
  if (inventoryStatus.value === 'UNKNOWN') {
    return '库存未检查';
  }

  const required = material.componentQty;
  const available = material.availableQty || 0;
  const shortage = required - available;

  if (inventoryStatus.value === 'SUFFICIENT') {
    return `库存充足 (${available}/${required})`;
  } else if (inventoryStatus.value === 'PARTIAL') {
    return `部分缺料 (${available}/${required}，缺${shortage})`;
  } else {
    return `完全缺料 (可用: ${available}，需求: ${required})`;
  }
});
</script>

<style scoped>
.inventory-status {
  display: inline-block;
}
</style>
