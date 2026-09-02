<template>
  <div class="widget-actions">
    <el-tooltip content="复制" placement="top">
      <el-button circle type="primary" plain icon="CopyDocument" @click.stop="emit('copy')" />
    </el-tooltip>
    <el-tooltip content="删除" placement="top">
      <el-button circle type="danger" plain icon="Delete" @click.stop="emit('remove')" />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ copy: []; remove: [] }>();
</script>

<style scoped>
.widget-actions {
  position: absolute;
  right: 8px;
  bottom: 6px;
  display: flex;
  gap: 8px;
  padding: 0;
  z-index: 2;
}
.widget-actions :deep(.el-button) {
  width: 34px;
  height: 34px;
  margin: 0;
  border-width: 1px;
  background: #fff;
  box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
}
</style>
