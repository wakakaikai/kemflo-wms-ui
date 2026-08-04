<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    destroy-on-close
    append-to-body
    fullscreen
    class="version-flow-preview-dialog"
    @closed="handleClosed"
  >
    <div class="preview-body">
      <AutomationDesigner
        v-if="visible && versionId"
        :key="String(versionId)"
        :version-id="versionId"
        readonly
      />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import AutomationDesigner from '@/components/AutomationDesigner/index.vue';

const visible = ref(false);
const versionId = ref<string | number>();
const versionNo = ref<number | string>();

const dialogTitle = computed(() => {
  return versionNo.value !== undefined && versionNo.value !== null
    ? `历史流程编排预览 - v${versionNo.value}`
    : '历史流程编排预览';
});

function open(payload: { id: string | number; version?: number | string }) {
  versionId.value = payload.id;
  versionNo.value = payload.version;
  visible.value = true;
}

function handleClosed() {
  versionId.value = undefined;
  versionNo.value = undefined;
}

defineExpose({ open });
</script>

<style scoped>
.preview-body {
  height: calc(100vh - 56px);
  overflow: hidden;
}
</style>

<style>
.version-flow-preview-dialog .el-dialog__body {
  padding: 0;
  height: calc(100vh - 56px);
  overflow: hidden;
}
.version-flow-preview-dialog .el-dialog__header {
  margin-right: 0;
  padding: 12px 16px;
  border-bottom: 1px solid #e8eaed;
}
</style>
