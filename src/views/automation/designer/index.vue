<template>
  <div class="flow-editor-page">
    <FlowEditorHeader
      :title="form.automationName || '未命名流程'"
      :issue-count="issueCount"
      :saving="saving"
      @rename="renameFlow"
      @validate="handleValidate"
      @debug="handleRun"
      @save="handleSave"
      @close="goBack"
    />

    <main class="flow-editor-canvas">
      <AutomationDesigner
        ref="designerRef"
        :key="definitionId || 'new'"
        :definition-id="definitionId"
        :automation-name="form.automationName"
        external-toolbar
        @saved="handleSaved"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import AutomationDesigner from '@/components/AutomationDesigner/index.vue';
import FlowEditorHeader from './components/FlowEditorHeader.vue';
import { useFlowDesignerPage } from './composables/useFlowDesignerPage';

const {
  definitionId,
  designerRef,
  saving,
  issueCount,
  form,
  renameFlow,
  handleSave,
  handleValidate,
  handleRun,
  handleSaved,
  goBack,
} = useFlowDesignerPage();
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
</style>
