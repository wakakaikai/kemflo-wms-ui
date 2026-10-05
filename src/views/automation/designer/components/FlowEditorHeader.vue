<template>
  <header class="flow-editor-header">
    <div class="title-area">
      <span class="flow-mark">
        <el-icon><Share /></el-icon>
      </span>
      <h1 class="flow-title" :title="title">{{ title }}</h1>
      <span v-if="dirty" class="dirty-dot" title="有未保存的修改" />
      <el-tag v-if="statusLabel" :type="statusType" size="small" effect="light">{{ statusLabel }}</el-tag>
      <button class="icon-action" title="修改流程名称" @click="$emit('rename')">
        <el-icon><EditPen /></el-icon>
      </button>
    </div>

    <div class="header-actions">
      <el-badge :value="issueCount" :hidden="issueCount === 0" type="danger">
        <el-button class="action-btn" @click="$emit('validate')">
          <el-icon><List /></el-icon>
          问题
        </el-button>
      </el-badge>
      <el-button class="action-btn" @click="$emit('debug')">
        <el-icon><VideoPlay /></el-icon>
        调试
      </el-button>
      <el-button class="publish-btn" :loading="publishing" @click="$emit('publish')">
        <el-icon><Upload /></el-icon>
        发布
      </el-button>
      <el-button type="primary" class="save-btn" :loading="saving" @click="$emit('save')">
        <el-icon><DocumentChecked /></el-icon>
        保存
      </el-button>
      <button class="close-action" title="关闭" @click="$emit('close')">
        <el-icon><Close /></el-icon>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Close, DocumentChecked, EditPen, List, Share, Upload, VideoPlay } from '@element-plus/icons-vue';

const props = defineProps<{
  title: string;
  issueCount?: number;
  saving?: boolean;
  publishing?: boolean;
  status?: string;
  dirty?: boolean;
}>();

const statusLabel = computed(
  () =>
    ({
      DRAFT: '草稿',
      PUBLISHED: '已发布',
      DISABLED: '已停用',
      ARCHIVED: '已归档'
    })[props.status || ''] || ''
);

const statusType = computed(
  () =>
    (({
      PUBLISHED: 'success',
      DISABLED: 'warning',
      ARCHIVED: 'danger'
    })[props.status || ''] || 'info') as 'success' | 'warning' | 'danger' | 'info'
);

defineEmits<{
  rename: [];
  validate: [];
  debug: [];
  publish: [];
  save: [];
  close: [];
}>();
</script>

<style scoped>
.flow-editor-header {
  height: 52px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px 0 20px;
  border-bottom: 1px solid #edf0f3;
  background: #fff;
  box-sizing: border-box;
}
.title-area {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.flow-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: #5f8ff7;
  flex: 0 0 auto;
}
.flow-title {
  margin: 0;
  max-width: 480px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #111827;
  font-size: 15px;
  font-weight: 700;
  line-height: 22px;
}
.dirty-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #fa8c16;
  box-shadow: 0 0 0 3px #fff7e6;
}
.icon-action,
.close-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
}
.icon-action:hover,
.close-action:hover {
  background: #f3f4f6;
  color: #111827;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}
.header-actions :deep(.action-btn) {
  height: 32px;
  border-radius: 4px;
  padding: 0 14px;
  border-color: #dcdfe6;
  color: #4b5563;
  background: #fff;
}
.header-actions :deep(.action-btn:hover) {
  color: #1677ff;
  border-color: #b3d4ff;
  background: #f5f9ff;
}
.header-actions :deep(.publish-btn) {
  height: 32px;
  border-radius: 4px;
  padding: 0 14px;
  border-color: #cbd5e1;
  color: #334155;
  background: #fff;
}
.header-actions :deep(.publish-btn:hover),
.header-actions :deep(.publish-btn:focus) {
  color: #1677ff;
  border-color: #91caff;
  background: #f0f7ff;
}
.header-actions :deep(.save-btn) {
  height: 32px;
  border-radius: 4px;
  padding: 0 16px;
  background: #00b38a;
  border-color: #00b38a;
}
.header-actions :deep(.save-btn:hover),
.header-actions :deep(.save-btn:focus) {
  background: #00a07c;
  border-color: #00a07c;
}
</style>
