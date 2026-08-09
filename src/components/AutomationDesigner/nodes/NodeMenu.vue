<template>
  <el-dropdown
    trigger="click"
    placement="bottom-end"
    popper-class="md-node-menu-popper"
    @command="onCommand"
    @click.stop
  >
    <button
      class="md-node-menu-btn"
      :class="{ light }"
      title="更多"
      @click.stop
      @mousedown.stop
    >···</button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="rename">
          <span class="menu-item-inner">
            <el-icon><EditPen /></el-icon>
            <span>修改名称</span>
          </span>
        </el-dropdown-item>
        <el-dropdown-item command="edit-meta">
          <span class="menu-item-inner">
            <el-icon><InfoFilled /></el-icon>
            <span>编辑节点别名和说明</span>
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
import { EditPen, InfoFilled, CopyDocument, Delete } from '@element-plus/icons-vue';

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
.md-node-menu-btn {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  line-height: 1;
  padding: 0;
}
.md-node-menu-btn.light {
  background: transparent;
  color: #8c8c8c;
}
.md-node-menu-btn:hover {
  background: rgba(255, 255, 255, 0.28);
}
.md-node-menu-btn.light:hover {
  background: #f5f5f5;
  color: #595959;
}
.menu-item-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.danger-text {
  color: #ff4d4f;
}
</style>

<style>
.md-node-menu-popper .el-dropdown-menu__item {
  min-width: 180px;
  padding: 8px 16px;
}
</style>
