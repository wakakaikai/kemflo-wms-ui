<template>
  <span class="trace-status-tag" :class="status === 'PASS' ? 'is-pass' : 'is-fail'">{{ label ?? status }}</span>
</template>

<script setup lang="ts">
defineProps<{
  status?: string;
  label?: string;
}>();
</script>

<style scoped lang="scss">
.trace-status-tag {
  display: inline-block;
  padding: 0 9px;
  height: 22px;
  line-height: 20px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid;
  white-space: nowrap;
  vertical-align: middle;
}

.is-pass {
  color: #fff;
  background-color: #67c23a;
  border-color: #67c23a;
}

.is-fail {
  color: #fff;
  background-color: #f56c6c;
  border-color: #f56c6c;
}
</style>
