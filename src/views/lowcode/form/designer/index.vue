<template>
  <div class="form-designer-page">
    <header class="designer-header">
      <div class="header-left">
        <h1>{{ formMeta.formName || '表单设计器' }}</h1>
      </div>
      <el-tabs v-model="activeMode" class="designer-mode">
        <el-tab-pane label="设计表单" name="design" />
        <el-tab-pane label="表单设置" name="settings" />
      </el-tabs>
      <div class="header-actions">
        <el-button link type="primary" icon="Clock">历史</el-button>
        <el-button link type="primary" icon="MagicStick">AI字段建议</el-button>
        <el-button link type="primary" icon="Operation" @click="quickLayoutVisible = true">快速布局</el-button>
        <el-button link type="primary" icon="View" @click="previewVisible = true">预览</el-button>
        <el-button link type="primary" icon="DocumentChecked" :loading="saving" @click="handleSave">保存</el-button>
        <el-button link type="danger" icon="Close" @click="goBack">关闭</el-button>
      </div>
    </header>

    <main class="designer-main">
      <FormDesigner v-show="activeMode === 'design'" ref="designerRef" v-model="schemaJson" />
      <div v-show="activeMode === 'settings'" class="setting-placeholder">
        <el-empty description="表单设置请在右侧表单属性中配置" />
      </div>
    </main>

    <el-dialog v-model="previewVisible" title="表单预览" width="720px" append-to-body destroy-on-close>
      <div :class="['preview-wrap', previewDeviceClass]">
        <FormRenderer :schema="previewSchema" />
      </div>
    </el-dialog>

    <QuickLayoutDialog v-model="quickLayoutVisible" @apply="handleQuickLayout" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { FormDesigner, FormRenderer, parseSchema } from '@/components/FormDesigner';
import QuickLayoutDialog from '@/components/FormDesigner/components/QuickLayoutDialog.vue';
import { getForm, saveFormDesign } from '@/api/lowcode/form';
import type { FormVO } from '@/api/lowcode/form/types';

const route = useRoute();
const router = useRouter();
const formId = computed(() => String(route.params.formId || ''));
const designerRef = ref<InstanceType<typeof FormDesigner>>();
const saving = ref(false);
const previewVisible = ref(false);
const quickLayoutVisible = ref(false);
const activeMode = ref('design');
const schemaJson = ref('');
const formMeta = ref<FormVO>({});

const previewSchema = computed(() => parseSchema(schemaJson.value));
const previewDeviceClass = computed(() => {
  const deviceRef = designerRef.value?.deviceType as { value?: string } | string | undefined;
  const device = typeof deviceRef === 'string' ? deviceRef : deviceRef?.value || 'adaptive';
  return device === 'mobile' ? 'preview-mobile' : device === 'desktop' ? 'preview-desktop' : 'preview-adaptive';
});

async function loadForm() {
  if (!formId.value) {
    ElMessage.error('缺少表单 ID');
    return;
  }
  try {
    const res = await getForm(formId.value);
    formMeta.value = res.data;
    schemaJson.value = res.data.formConfigJson || '';
    designerRef.value?.resetSchema(schemaJson.value);
  } catch {
    ElMessage.error('加载表单失败，请检查权限或后端服务');
  }
}

async function handleSave() {
  if (!formId.value) return;
  saving.value = true;
  try {
    await saveFormDesign({ id: formId.value, formConfigJson: schemaJson.value || JSON.stringify(parseSchema()) });
    ElMessage.success('保存成功');
  } finally {
    saving.value = false;
  }
}

function handleQuickLayout(spans: number[]) {
  designerRef.value?.applyQuickLayout(spans);
  ElMessage.success('已应用快速布局');
}

function goBack() {
  router.push('/lowcode/form');
}

onMounted(loadForm);
</script>

<style scoped lang="scss">
.form-designer-page {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}
.designer-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 46px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-light);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  h1 {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: #303133;
  }
}
.designer-mode {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
}
.designer-mode :deep(.el-tabs__header) {
  margin: 0;
}
.designer-mode :deep(.el-tabs__nav-wrap::after) {
  display: none;
}
.designer-mode :deep(.el-tabs__item) {
  height: 46px;
  line-height: 46px;
  font-size: 13px;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}
.header-actions :deep(.el-button) {
  padding: 0 4px;
  font-size: 13px;
}
.designer-main {
  flex: 1;
  min-height: 0;
}
.setting-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
.preview-wrap {
  padding: 8px;
}
.preview-mobile {
  max-width: 375px;
  margin: 0 auto;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  padding: 12px;
}
.preview-desktop {
  max-width: 960px;
  margin: 0 auto;
}
</style>
