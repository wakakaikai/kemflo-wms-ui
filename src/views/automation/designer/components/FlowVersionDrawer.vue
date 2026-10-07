<template>
  <el-drawer :model-value="visible" title="版本记录" size="430px" append-to-body @close="$emit('close')">
    <div class="version-toolbar">
      <div>
        <strong>流程版本</strong>
        <p>预览历史设计，或恢复为当前草稿。</p>
      </div>
      <el-button text :loading="loading" @click="$emit('refresh')">
        <el-icon><Refresh /></el-icon>
      </el-button>
    </div>

    <div v-loading="loading" class="version-list">
      <article v-for="item in versions" :key="item.id" class="version-card">
        <div class="version-main">
          <div class="version-heading">
            <strong>v{{ item.version }}</strong>
            <el-tag :type="item.publishStatus === 'PUBLISHED' ? 'success' : 'info'" size="small" effect="light">
              {{ item.publishStatus === 'PUBLISHED' ? '已发布' : '草稿' }}
            </el-tag>
            <span v-if="item.version === currentVersion" class="current-mark">当前发布</span>
          </div>
          <p>{{ formatDate(item.publishTime || item.createTime) }}</p>
          <small v-if="item.checksum">校验和 {{ item.checksum.slice(0, 10) }}</small>
        </div>
        <div class="version-actions">
          <el-button link type="primary" @click="$emit('preview', item)">预览</el-button>
          <el-button link type="warning" @click="$emit('restore', item)">恢复</el-button>
        </div>
      </article>
      <el-empty v-if="!loading && !versions.length" description="暂无版本记录" :image-size="80" />
    </div>

    <el-pagination
      v-if="total > pageSize"
      class="version-pagination"
      background
      layout="prev, pager, next"
      :total="total"
      :page-size="pageSize"
      :current-page="pageNum"
      @current-change="$emit('page-change', $event)"
    />
  </el-drawer>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue';
import type { AutoVersionVo } from '@/api/automation/version/types';

defineProps<{
  visible: boolean;
  loading: boolean;
  versions: AutoVersionVo[];
  total: number;
  pageNum: number;
  pageSize: number;
  currentVersion?: number;
}>();

defineEmits<{
  close: [];
  refresh: [];
  preview: [version: AutoVersionVo];
  restore: [version: AutoVersionVo];
  'page-change': [page: number];
}>();

function formatDate(value?: string) {
  if (!value) return '尚未发布';
  return new Date(value).toLocaleString();
}
</script>

<style scoped>
.version-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin: -4px 0 18px;
  padding: 12px 14px;
  border: 1px solid #e8eef5;
  border-radius: 10px;
  background: #f8fafc;
}
.version-toolbar strong { color: #172033; font-size: 14px; }
.version-toolbar p { margin: 4px 0 0; color: #7a8798; font-size: 12px; }
.version-list { min-height: 160px; }
.version-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  padding: 14px;
  border: 1px solid #e7ebf0;
  border-radius: 10px;
  background: #fff;
  transition: border-color .2s, box-shadow .2s;
}
.version-card:hover { border-color: #b8d4ff; box-shadow: 0 4px 16px rgb(15 23 42 / 6%); }
.version-main { flex: 1; min-width: 0; }
.version-heading { display: flex; align-items: center; gap: 8px; }
.version-heading strong { color: #172033; font-size: 15px; }
.current-mark { color: #1677ff; font-size: 11px; }
.version-main p { margin: 7px 0 3px; color: #64748b; font-size: 12px; }
.version-main small { color: #a0a8b5; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.version-actions { display: flex; flex-direction: column; align-items: flex-end; }
.version-pagination { justify-content: center; margin-top: 18px; }
</style>
