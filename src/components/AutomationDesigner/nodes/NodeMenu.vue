<template>
  <el-dropdown trigger="click" placement="bottom-end" popper-class="flow-node-menu-popper" @command="onCommand" @click.stop>
    <button class="node-menu-btn" title="更多" @click.stop @mousedown.stop>
      <el-icon><MoreFilled /></el-icon>
    </button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="edit-meta">
          <span class="menu-item-inner">
            <el-icon><EditPen /></el-icon>
            <span>设计</span>
          </span>
        </el-dropdown-item>
        <el-dropdown-item command="rename">
          <span class="menu-item-inner">
            <el-icon><Edit /></el-icon>
            <span>修改名称</span>
          </span>
        </el-dropdown-item>
        <el-dropdown-item v-if="showCopy" command="copy" divided>
          <span class="menu-item-inner">
            <el-icon><CopyDocument /></el-icon>
            <span>复制</span>
          </span>
        </el-dropdown-item>
        <el-dropdown-item v-if="showDelete" command="delete">
          <span class="menu-item-inner danger-text">
            <el-icon><Delete /></el-icon>
            <span>删除</span>
          </span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { CopyDocument, Delete, Edit, EditPen, MoreFilled } from '@element-plus/icons-vue';

withDefaults(defineProps<{
  light?: boolean;
  showCopy?: boolean;
  showDelete?: boolean;
}>(), {
  light: false,
  showCopy: true,
  showDelete: true,
});

const emit = defineEmits<{
  command: [cmd: string];
}>();

function onCommand(cmd: string) {
  emit('command', cmd);
}
</script>

<style scoped>
.node-menu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
}
.node-menu-btn:hover {
  background: #f3f4f6;
  color: #111827;
}
.menu-item-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.danger-text {
  color: #ef4444;
}
</style>

<style>
.flow-node-menu-popper .el-dropdown-menu__item {
  min-width: 132px;
  padding: 8px 14px;
}
</style>
