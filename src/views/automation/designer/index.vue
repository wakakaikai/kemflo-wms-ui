<template>
  <div class="designer-page">
    <!-- 钉钉风格顶部标签栏 -->
    <div class="designer-tabs">
      <button v-for="tab in tabs" :key="tab.key" :class="['tab-btn', { active: activeTab === tab.key }]" @click="activeTab = tab.key">
        {{ tab.label }}
      </button>
    </div>

    <!-- 流程设计 -->
    <div v-show="activeTab === 'flow'" class="tab-content">
      <AutomationDesigner :definition-id="definitionId" @saved="handleSaved" @published="handlePublished" />
    </div>

    <!-- 配置 -->
    <div v-show="activeTab === 'config'" class="tab-content config-content">
      <el-card shadow="never" class="config-card">
        <template #header><span class="card-title">基本设置</span></template>
        <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" size="default">
          <el-form-item label="自动化编码" prop="automationCode">
            <el-input v-model="form.automationCode" placeholder="请输入自动化编码，保存后不可修改" :disabled="!!definitionId" />
          </el-form-item>
          <el-form-item label="自动化名称" prop="automationName">
            <el-input v-model="form.automationName" placeholder="请输入自动化名称" />
          </el-form-item>
          <el-form-item label="触发类型" prop="triggerType">
            <el-select v-model="form.triggerType" placeholder="请选择触发类型" style="width: 100%">
              <el-option label="手工触发" value="MANUAL_TRIGGER" />
              <el-option label="定时触发" value="CRON_TRIGGER" />
              <el-option label="Webhook触发" value="WEBHOOK_TRIGGER" />
              <el-option label="数据触发" value="DATA_TRIGGER" />
              <el-option label="消息触发" value="MESSAGE_TRIGGER" />
              <el-option label="设备触发" value="DEVICE_PROPERTY_TRIGGER" />
            </el-select>
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入流程描述" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="configLoading" @click="saveConfig">{{ definitionId ? '保存配置' : '创建流程' }}</el-button>
            <el-button @click="goBack">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 历史 -->
    <div v-show="activeTab === 'history'" class="tab-content history-content">
      <el-card shadow="never" class="history-card">
        <template #header><span class="card-title">版本历史</span></template>
        <el-table v-loading="historyLoading" :data="historyList" border stripe>
          <el-table-column label="版本号" align="center" width="100">
            <template #default="scope">v{{ scope.row.version }}</template>
          </el-table-column>
          <el-table-column label="发布状态" align="center" width="120">
            <template #default="scope">
              <el-tag :type="scope.row.publishStatus === 'PUBLISHED' ? 'success' : 'info'" size="small">
                {{ scope.row.publishStatus === 'PUBLISHED' ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="发布时间" width="180">
            <template #default="scope">{{ scope.row.publishTime || '-' }}</template>
          </el-table-column>
          <el-table-column label="创建时间" width="180">
            <template #default="scope">{{ scope.row.createTime || '-' }}</template>
          </el-table-column>
        </el-table>
        <pagination v-show="historyTotal > 0" v-model:page="historyQuery.pageNum" v-model:limit="historyQuery.pageSize" :total="historyTotal" @pagination="loadHistory" />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AutomationDesigner from '@/components/AutomationDesigner/index.vue';
import { ElMessage, FormInstance } from 'element-plus';
import { getDefinition, addDefinition, updateDefinition } from '@/api/automation/definition';
import { AutoDefinitionForm } from '@/api/automation/definition/types';
import { listVersion } from '@/api/automation/version';
import { AutoVersionVo } from '@/api/automation/version/types';

const route = useRoute();
const router = useRouter();

const definitionId = ref<string | undefined>(route.params.definitionId ? String(route.params.definitionId) : undefined);
const activeTab = ref('flow');
const configLoading = ref(false);
const historyLoading = ref(false);
const historyTotal = ref(0);
const historyList = ref<AutoVersionVo[]>([]);

const formRef = ref<FormInstance>();

const tabs = [
  { key: 'flow', label: '流程' },
  { key: 'config', label: '配置' },
  { key: 'history', label: '历史' }
];

const form = reactive<AutoDefinitionForm>({
  automationCode: undefined,
  automationName: undefined,
  triggerType: undefined,
  description: undefined,
  remark: undefined
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

onMounted(() => {
  if (definitionId.value) {
    loadDefinition();
  }
});

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
      ElMessage.success('流程已创建');
      activeTab.value = 'flow';
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
    historyList.value = (res.data as any).rows ?? res.data;
    historyTotal.value = (res.data as any).total ?? historyList.value.length;
  } finally {
    historyLoading.value = false;
  }
}

const handleSaved = (_designData: any) => {
  ElMessage.success('设计已保存');
};

const handlePublished = () => {
  ElMessage.success('发布成功');
};

const goBack = () => router.push({ path: '/automation/definition' });
</script>

<style scoped>
.designer-page {
  height: calc(100vh - 88px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f0f2f5;
}
.designer-tabs {
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 16px;
  flex-shrink: 0;
  height: 44px;
}
.tab-btn {
  display: inline-flex;
  align-items: center;
  height: 44px;
  padding: 0 20px;
  border: none;
  background: transparent;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}
.tab-btn:hover {
  color: #1677ff;
  background: #f5f7fa;
}
.tab-btn.active {
  color: #1677ff;
  font-weight: 600;
}
.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 8px;
  right: 8px;
  height: 2px;
  background: #1677ff;
  border-radius: 2px 2px 0 0;
}
.tab-content {
  flex: 1;
  overflow: hidden;
}
.config-content {
  overflow-y: auto;
  padding: 24px;
}
.config-card {
  max-width: 720px;
  margin: 0 auto;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
}
.history-content {
  overflow-y: auto;
  padding: 24px;
}
.history-card {
  max-width: 900px;
  margin: 0 auto;
}
</style>
