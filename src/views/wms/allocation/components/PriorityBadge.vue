<template>
  <el-tag :type="priorityType" :effect="effect" :size="size" class="priority-badge">
    <slot>
      {{ priorityText }}
    </slot>
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  priority: number;
  effect?: 'dark' | 'light' | 'plain';
  size?: 'small' | 'default' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  effect: 'light',
  size: 'small'
});

const priorityType = computed(() => {
  if (props.priority >= 9) return 'danger';
  if (props.priority >= 7) return 'warning';
  if (props.priority >= 5) return 'info';
  if (props.priority >= 3) return 'primary';
  return 'success';
});

const priorityText = computed(() => {
  return `P${props.priority}`;
});
</script>

<style scoped>
.priority-badge {
  font-weight: bold;
  min-width: 36px;
  text-align: center;
}
</style>
