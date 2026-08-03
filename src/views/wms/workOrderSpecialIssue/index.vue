<template>
  <div class="p-2 special-issue-page">
    <el-card shadow="never" class="page-card">
      <template #header>
        <div class="page-header">
          <div>
            <h2 class="title">特殊工单领料</h2>
            <p class="subtitle">ZP92-拆解工单 / ZP93-粉碎工单 261 领料：领料行加入清单后，点击「查库存」自行选择库位，确认后生成备料计划</p>
          </div>
        </div>
      </template>

      <!-- 模式切换 -->
      <div class="mode-selector">
        <el-tabs v-model="issueMode">
          <el-tab-pane label="ZP92-拆解工单（加载 BOM）" name="ZP92" />
          <el-tab-pane label="ZP93-粉碎工单（手动添加）" name="ZP93" />
        </el-tabs>
      </div>

      <ZP92IssuePanel v-if="issueMode === 'ZP92'" />
      <ZP93IssuePanel v-else />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ZP92IssuePanel from './components/zp92-issue-panel.vue';
import ZP93IssuePanel from './components/zp93-issue-panel.vue';

const issueMode = ref<'ZP92' | 'ZP93'>('ZP93');
</script>

<style scoped>
.special-issue-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.page-header .title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.page-header .subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.mode-selector {
  margin-bottom: 16px;
}
</style>
