<template>
  <div class="designer-page">
    <!-- 顶栏 -->
    <header class="designer-header">
      <div class="header-left">
        <button class="back-btn" title="返回列表" @click="goBack">
          <el-icon :size="16"><ArrowLeft /></el-icon>
        </button>
        <div class="header-title-block">
          <h1 class="flow-name">{{ form.automationName || '未命名流程' }}</h1>
          <span class="flow-meta">
            <el-tag v-if="definitionId" size="small" type="info" effect="plain">草稿</el-tag>
            <el-tag v-else size="small" type="warning" effect="plain">新建</el-tag>
            <span v-if="form.automationCode" class="flow-code">{{ form.automationCode }}</span>
          </span>
        </div>
      </div>

      <nav class="header-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-btn', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          <el-icon :size="14"><component :is="tab.icon" /></el-icon>
          {{ tab.label }}
        </button>
      </nav>

      <div class="header-right">
        <el-button v-if="activeTab === 'config'" type="primary" :loading="configLoading" @click="saveConfig">
          {{ definitionId ? '保存配置' : '创建流程' }}
        </el-button>
      </div>
    </header>

    <!-- 流程设计：用 v-if 保证进入编排页时重新挂载并拉取设计 -->
    <div v-if="activeTab === 'flow'" class="tab-content">
      <AutomationDesigner
        :key="definitionId || 'new'"
        :definition-id="definitionId"
        :automation-name="form.automationName"
        @saved="handleSaved"
        @published="handlePublished"
      />
    </div>

    <!-- 配置 -->
    <div v-show="activeTab === 'config'" class="tab-content config-content">
      <div class="config-panel">
        <div class="config-section">
          <h3 class="section-heading">基本设置</h3>
          <p class="section-desc">配置流程的编码、名称与触发方式</p>
          <el-form :model="form" :rules="rules" ref="formRef" label-position="top" size="default" class="config-form">
            <div class="form-grid">
              <el-form-item label="自动化编码" prop="automationCode">
                <el-input v-model="form.automationCode" placeholder="保存后不可修改" :disabled="!!definitionId" />
              </el-form-item>
              <el-form-item label="自动化名称" prop="automationName">
                <el-input v-model="form.automationName" placeholder="请输入自动化名称" />
              </el-form-item>
              <el-form-item label="触发类型" prop="triggerType" class="span-2">
                <el-select v-model="form.triggerType" placeholder="请选择触发类型" style="width: 100%">
                  <el-option label="手工触发" value="MANUAL_TRIGGER" />
                  <el-option label="定时触发" value="CRON_TRIGGER" />
                  <el-option label="Webhook触发" value="WEBHOOK_TRIGGER" />
                  <el-option label="数据触发" value="DATA_TRIGGER" />
                  <el-option label="消息触发" value="MESSAGE_TRIGGER" />
                  <el-option label="设备触发" value="DEVICE_PROPERTY_TRIGGER" />
                </el-select>
              </el-form-item>
              <el-form-item label="描述" class="span-2">
                <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入流程描述" />
              </el-form-item>
            </div>
          </el-form>
        </div>
      </div>
    </div>

    <!-- 历史 -->
    <div v-show="activeTab === 'history'" class="tab-content history-content">
      <div class="history-panel">
        <div class="config-section">
          <h3 class="section-heading">版本历史</h3>
          <p class="section-desc">查看流程的发布记录与版本变更</p>
          <el-table v-loading="historyLoading" :data="historyList" class="history-table" stripe>
            <el-table-column label="版本号" align="center" width="100">
              <template #default="scope">
                <el-button link type="primary" @click="handlePreviewVersion(scope.row)">
                  <span class="version-badge">v{{ scope.row.version }}</span>
                </el-button>
              </template>
            </el-table-column>
            <el-table-column label="发布状态" align="center" width="120">
              <template #default="scope">
                <el-tag :type="scope.row.publishStatus === 'PUBLISHED' ? 'success' : 'info'" size="small" effect="light">
                  {{ scope.row.publishStatus === 'PUBLISHED' ? '已发布' : '草稿' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="发布时间" min-width="180">
              <template #default="scope">{{ scope.row.publishTime || '-' }}</template>
            </el-table-column>
            <el-table-column label="创建时间" min-width="180">
              <template #default="scope">{{ scope.row.createTime || '-' }}</template>
            </el-table-column>
            <el-table-column fixed="right" align="center" label="操作" width="140">
              <template #default="scope">
                <el-button link type="primary" icon="View" @click="handlePreviewVersion(scope.row)">查看编排</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="historyTotal > 0"
            v-model:page="historyQuery.pageNum"
            v-model:limit="historyQuery.pageSize"
            :total="historyTotal"
            @pagination="loadHistory"
          />
        </div>
      </div>
    </div>

    <VersionFlowPreview ref="versionPreviewRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, markRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Share, Setting, Clock } from '@element-plus/icons-vue';
import AutomationDesigner from '@/components/AutomationDesigner/index.vue';
import VersionFlowPreview from '@/views/automation/components/VersionFlowPreview.vue';
import { ElMessage, FormInstance } from 'element-plus';
import { getDefinition, addDefinition, updateDefinition } from '@/api/automation/definition';
import { AutoDefinitionForm } from '@/api/automation/definition/types';
import { listVersion } from '@/api/automation/version';
import { AutoVersionVo } from '@/api/automation/version/types';

const route = useRoute();
const router = useRouter();

const definitionId = ref<string | undefined>(
  route.params.definitionId ? String(route.params.definitionId) : undefined
);
const activeTab = ref(definitionId.value ? 'flow' : 'config');
const configLoading = ref(false);
const historyLoading = ref(false);
const historyTotal = ref(0);
const historyList = ref<AutoVersionVo[]>([]);
const versionPreviewRef = ref<InstanceType<typeof VersionFlowPreview>>();

const formRef = ref<FormInstance>();

const tabs = [
  { key: 'flow', label: '流程编排', icon: markRaw(Share) },
  { key: 'config', label: '基本设置', icon: markRaw(Setting) },
  { key: 'history', label: '版本历史', icon: markRaw(Clock) }
];

const form = reactive<AutoDefinitionForm>({
  automationCode: undefined,
  automationName: undefined,
  triggerType: undefined,
  description: undefined
});

const rules: Record<string, any> = {
  automationCode: [{ required: true, message: '自动化编码不能为空', trigger: 'blur' }],
  automationName: [{ required: true, message: '自动化名称不能为空', trigger: 'blur' }],
  triggerType: [{ required: true, message: '请选择触发类型', trigger: 'change' }]
};

const historyQuery = reactive({
  pageNum: 1,
  pageSize: 10,
  definitionId: definitionId.value
});

function syncDefinitionIdFromRoute() {
  const id = route.params.definitionId ? String(route.params.definitionId) : undefined;
  if (id !== definitionId.value) {
    definitionId.value = id;
    historyQuery.definitionId = id;
  }
}

onMounted(() => {
  syncDefinitionIdFromRoute();
  if (definitionId.value) {
    loadDefinition();
  }
});

watch(
  () => route.params.definitionId,
  () => {
    syncDefinitionIdFromRoute();
    if (definitionId.value) {
      loadDefinition();
    }
  }
);

watch(activeTab, (tab) => {
  if (tab === 'history' && definitionId.value) {
    loadHistory();
  }
});

async function loadDefinition() {
  if (!definitionId.value) return;
  try {
    const res = await getDefinition(definitionId.value);
    Object.assign(form, res.data);
  } catch {
    /* ignore */
  }
}

async function saveConfig() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  configLoading.value = true;
  try {
    if (definitionId.value) {
      await updateDefinition({ ...form, id: definitionId.value });
      ElMessage.success('配置已保存');
    } else {
      const res = await addDefinition(form);
      definitionId.value = String(res.data.id);
      historyQuery.definitionId = definitionId.value;
      ElMessage.success('流程已创建');
      activeTab.value = 'flow';
      router.replace({ name: 'AutomationDesigner', params: { definitionId: definitionId.value } });
    }
  } catch {
    ElMessage.error('保存失败');
  } finally {
    configLoading.value = false;
  }
}

async function loadHistory() {
  if (!definitionId.value) return;
  historyLoading.value = true;
  try {
    const res = await listVersion({ definitionId: definitionId.value, pageNum: historyQuery.pageNum, pageSize: historyQuery.pageSize } as any);
    historyList.value = (res as any).rows ?? [];
    historyTotal.value = (res as any).total ?? 0;
  } finally {
    historyLoading.value = false;
  }
}

const handleSaved = (_designData: any) => {
  // 设计器内部已提示成功
};

const handlePublished = () => {
  if (activeTab.value === 'history') {
    loadHistory();
  }
};

const handlePreviewVersion = (row: AutoVersionVo) => {
  versionPreviewRef.value?.open({ id: row.id, version: row.version });
};

const goBack = () => router.push({ path: '/automation/definition' });
</script>

<style scoped>
.designer-page {
  height: calc(100vh - 88px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f7fa;
}

/* ---- Header ---- */
.designer-header {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 52px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e8eaed;
  flex-shrink: 0;
  z-index: 20;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e8eaed;
  border-radius: 8px;
  background: #fff;
  color: #4e5969;
  cursor: pointer;
  transition: all 0.15s;
}
.back-btn:hover {
  border-color: #5f95ff;
  color: #5f95ff;
  background: #f0f5ff;
}
.header-title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.flow-name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #141414;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}
.flow-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}
.flow-code {
  font-size: 11px;
  color: #8c8c8c;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
}

.header-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
}
.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 13px;
  color: #8c8c8c;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn:hover {
  color: #5f95ff;
  background: #f0f5ff;
}
.tab-btn.active {
  color: #1d39c4;
  background: #f0f5ff;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  justify-content: flex-end;
}

/* ---- Content ---- */
.tab-content {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}
.config-content,
.history-content {
  overflow-y: auto;
  padding: 32px 24px;
  background: #f5f7fa;
}
.config-panel,
.history-panel {
  max-width: 800px;
  margin: 0 auto;
}
.config-section {
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 12px;
  padding: 28px 32px;
}
.section-heading {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: #141414;
}
.section-desc {
  margin: 0 0 24px;
  font-size: 13px;
  color: #8c8c8c;
}
.config-form :deep(.el-form-item__label) {
  font-size: 13px;
  color: #4e5969;
  font-weight: 500;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 20px;
}
.form-grid .span-2 {
  grid-column: 1 / -1;
}
.version-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 10px;
  border-radius: 6px;
  background: #f0f5ff;
  color: #1d39c4;
  font-size: 12px;
  font-weight: 600;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
}
.history-table {
  border-radius: 8px;
  overflow: hidden;
}
.history-table :deep(.el-table__header th) {
  background: #fafafa;
  color: #4e5969;
  font-weight: 600;
}
</style>
