<template>
  <div class="flow-editor-page">
    <FlowEditorHeader :title="form.automationName || '未命名流程'" :issue-count="issueCount" :saving="saving" :publishing="publishing" :status="form.status" :dirty="dirty" @rename="renameFlow" @validate="handleValidate" @debug="handleRun" @publish="handlePublish" @save="handleSave" @close="goBack" />

    <main class="flow-editor-canvas">
      <AutomationDesigner ref="designerRef" :key="definitionId || 'new'" :definition-id="definitionId" :automation-name="form.automationName" external-toolbar @saved="handleSaved" @published="handlePublished" @issues="handleIssues" @dirty-change="handleDirtyChange" />
    </main>

    <el-drawer v-model="issuesVisible" title="流程问题" size="380px" append-to-body>
      <div v-if="issues.length" class="issue-list">
        <button v-for="issue in issues" :key="issue.id" type="button" class="issue-item" :class="`is-${issue.level}`" @click="locateIssue(issue.nodeId)">
          <span class="issue-icon">
            <el-icon><WarningFilled /></el-icon>
          </span>
          <span class="issue-content">
            <strong>{{ issue.title }}</strong>
            <small>{{ issue.description }}</small>
          </span>
          <el-icon v-if="issue.nodeId" class="issue-locate"><Location /></el-icon>
        </button>
      </div>
      <el-empty v-else description="未发现流程问题" :image-size="96" />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import AutomationDesigner from '@/components/AutomationDesigner/index.vue';
import { Location, WarningFilled } from '@element-plus/icons-vue';
import FlowEditorHeader from './components/FlowEditorHeader.vue';
import { useFlowDesignerPage } from './composables/useFlowDesignerPage';

const { definitionId, designerRef, saving, publishing, issueCount, issues, issuesVisible, dirty, form, renameFlow, handleSave, handleValidate, handleRun, handlePublish, handleSaved, handlePublished, handleIssues, handleDirtyChange, goBack } = useFlowDesignerPage();

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
</style>
