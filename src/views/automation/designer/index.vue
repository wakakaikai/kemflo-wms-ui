<template>
  <div class="flow-editor-page">
    <FlowEditorHeader
      :title="form.automationName || '未命名流程'"
      :issue-count="issueCount"
      :saving="saving"
      :publishing="publishing"
      :status="form.status"
      :dirty="dirty"
      :current-version="form.currentVersion"
      :last-saved-at="lastSavedAt"
      @rename="renameFlow"
      @history="openHistory"
      @validate="handleValidate"
      @debug="handleRun"
      @publish="handlePublish"
      @save="handleSave"
      @close="goBack"
    />

    <div class="flow-context-bar">
      <span class="context-code">{{ form.automationCode || 'FLOW' }}</span>
      <span class="context-separator" />
      <span>拖入节点或点击节点右侧 + 编排流程</span>
      <span class="context-shortcut">Ctrl / ⌘ + S 保存</span>
    </div>

    <main class="flow-editor-canvas">
      <AutomationDesigner ref="designerRef" :key="definitionId || 'new'" :definition-id="definitionId" :automation-name="form.automationName" external-toolbar @saved="handleSaved" @published="handlePublished" @issues="handleIssues" @dirty-change="handleDirtyChange" />
    </main>

    <el-drawer v-model="issuesVisible" title="流程问题" size="380px" append-to-body>
      <div class="issue-summary" :class="{ passed: !issues.length }">
        <el-icon><CircleCheck v-if="!issues.length" /><WarningFilled v-else /></el-icon>
        <span>{{ issues.length ? `发现 ${issues.length} 个需要关注的问题` : '编辑器与服务端校验均已通过' }}</span>
      </div>
      <div v-if="issues.length" class="issue-list">
        <button v-for="issue in issues" :key="issue.id" type="button" class="issue-item" :class="`is-${issue.level}`" @click="locateIssue(issue.nodeId)">
          <span class="issue-icon">
            <el-icon><WarningFilled /></el-icon>
          </span>
          <span class="issue-content">
            <strong>{{ issue.title }}</strong>
            <small>{{ issue.description }}</small>
            <em>{{ issue.source === 'server' ? '服务端校验' : '编辑器校验' }}</em>
          </span>
          <el-icon v-if="issue.nodeId" class="issue-locate"><Location /></el-icon>
        </button>
      </div>
      <el-empty v-else description="未发现流程问题" :image-size="96" />
    </el-drawer>

    <FlowVersionDrawer
      :visible="historyVisible"
      :loading="historyLoading"
      :versions="historyList"
      :total="historyTotal"
      :page-num="historyQuery.pageNum"
      :page-size="historyQuery.pageSize"
      :current-version="form.currentVersion"
      @close="historyVisible = false"
      @refresh="loadHistory"
      @page-change="changeHistoryPage"
      @preview="previewHistoryVersion"
      @restore="restoreHistoryVersion"
    />

    <el-dialog
      v-model="previewVisible"
      class="version-preview-dialog"
      :title="`版本预览 · v${previewVersion?.version || ''}`"
      width="92vw"
      top="4vh"
      append-to-body
      destroy-on-close
    >
      <div class="version-preview-canvas">
        <AutomationDesigner
          v-if="previewVersion"
          :definition-id="definitionId"
          :version-id="previewVersion.id"
          readonly
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import AutomationDesigner from '@/components/AutomationDesigner/index.vue';
import { CircleCheck, Location, WarningFilled } from '@element-plus/icons-vue';
import FlowEditorHeader from './components/FlowEditorHeader.vue';
import FlowVersionDrawer from './components/FlowVersionDrawer.vue';
import { useFlowDesignerPage } from './composables/useFlowDesignerPage';

const {
  definitionId, designerRef, saving, publishing, issueCount, issues, issuesVisible, dirty, lastSavedAt, form,
  historyVisible, historyLoading, historyTotal, historyList, historyQuery, previewVisible, previewVersion,
  renameFlow, handleSave, handleValidate, handleRun, handlePublish, handleSaved, handlePublished,
  handleIssues, handleDirtyChange, loadHistory, openHistory, changeHistoryPage, previewHistoryVersion,
  restoreHistoryVersion, goBack
} = useFlowDesignerPage();

function locateIssue(nodeId?: string) {
  if (!nodeId) return;
  designerRef.value?.focusNode(nodeId);
}
</script>

<style scoped>
.flow-editor-page {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f6f7;
}
.flow-editor-canvas {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.flow-context-bar {
  height: 34px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  border-bottom: 1px solid #e7ebf0;
  background: #fbfcfe;
  color: #7a8798;
  font-size: 12px;
}
.context-code {
  max-width: 260px;
  overflow: hidden;
  color: #334155;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.context-separator { width: 1px; height: 14px; background: #dce2e9; }
.context-shortcut { margin-left: auto; color: #9aa4b2; }
.issue-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding: 11px 12px;
  border-radius: 8px;
  background: #fff7ed;
  color: #c2410c;
  font-size: 13px;
}
.issue-summary.passed { background: #ecfdf5; color: #047857; }
.issue-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.issue-item {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  text-align: left;
  cursor: default;
}
.issue-item:has(.issue-locate) {
  cursor: pointer;
}
.issue-item:has(.issue-locate):hover {
  border-color: #93c5fd;
  background: #f8fbff;
}
.issue-icon {
  display: inline-flex;
  margin-top: 1px;
  color: #e6a23c;
}
.issue-item.is-error .issue-icon {
  color: #f56c6c;
}
.issue-content {
  flex: 1;
  min-width: 0;
}
.issue-content strong,
.issue-content small {
  display: block;
}
.issue-content em {
  display: block;
  margin-top: 5px;
  color: #a0a8b5;
  font-size: 11px;
  font-style: normal;
}
.issue-content strong {
  font-size: 14px;
  line-height: 20px;
}
.issue-content small {
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
  line-height: 18px;
}
.issue-locate {
  margin-top: 2px;
  color: #1677ff;
}
.version-preview-canvas { height: 78vh; overflow: hidden; border: 1px solid #e5eaf0; border-radius: 8px; }
:global(.version-preview-dialog .el-dialog__body) { padding: 8px 16px 16px; }
</style>
