<template>
  <div class="p-2">
    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" align="middle">
          <el-col :span="12">
            <span class="text-md font-bold">流程版本管理</span>
            <span v-if="route.query.automationName" class="ml-2 text-gray-400">- {{ route.query.automationName }}</span>
          </el-col>
          <el-col :span="12" class="text-right">
            <el-button icon="Back" @click="goBack">返回</el-button>
          </el-col>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="versionList" border>
        <el-table-column label="版本号" align="center" width="100">
          <template #default="scope">
            <el-button link type="primary" @click="handleViewFlow(scope.row)">v{{ scope.row.version }}</el-button>
          </template>
        </el-table-column>
        <el-table-column label="发布状态" align="center" width="120">
          <template #default="scope">
            <dict-tag :options="publishStatusOptions" :value="scope.row.publishStatus" />
          </template>
        </el-table-column>
        <el-table-column label="发布人" align="center" width="150" prop="publishBy" />
        <el-table-column label="发布时间" align="center" width="170" prop="publishTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.publishTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="校验摘要" prop="checksum" min-width="200" show-overflow-tooltip />
        <el-table-column label="创建时间" align="center" width="170" prop="createTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" align="center" label="操作" width="320">
          <template #default="scope">
            <el-button link type="primary" icon="Share" @click="handleViewFlow(scope.row)">查看编排</el-button>
            <el-button link type="primary" icon="View" @click="handleViewRuntime(scope.row)">运行定义</el-button>
            <el-button
              v-if="scope.row.publishStatus === 'DRAFT'"
              link type="success" icon="Upload"
              @click="handlePublish(scope.row)"
            >发布</el-button>
            <el-button link type="primary" icon="Download" @click="handleExport(scope.row)">导出</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <!-- 查看运行定义对话框 -->
    <el-dialog v-model="viewDialog.visible" title="运行定义 JSON" destroy-on-close append-to-body width="800px">
      <el-input v-model="runtimeJsonContent" type="textarea" :rows="20" readonly />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="viewDialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>

    <VersionFlowPreview ref="versionPreviewRef" />
  </div>
</template>

<script setup name="AutomationVersion" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs, computed } from 'vue';
import { ElFormInstance } from 'element-plus';
import { listVersion, getVersion, getRuntimeJson, publishVersion } from '@/api/automation/version';
import { AutoVersionQuery, AutoVersionVo } from '@/api/automation/version/types';
import { useRoute, useRouter } from 'vue-router';
import { AUTO_PUBLISH_STATUS_OPTIONS, resolveDictOptions } from '@/views/automation/options';
import VersionFlowPreview from '@/views/automation/components/VersionFlowPreview.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();
const { auto_publish_status } = toRefs<any>(proxy?.useDict('auto_publish_status'));
const publishStatusOptions = computed(() => resolveDictOptions(auto_publish_status.value, AUTO_PUBLISH_STATUS_OPTIONS));

const versionList = ref<AutoVersionVo[]>([]);
const total = ref(0);
const loading = ref(true);
const versionPreviewRef = ref<InstanceType<typeof VersionFlowPreview>>();

const viewDialog = reactive<DialogOption>({ visible: false, title: '' });
const runtimeJsonContent = ref('');

const data = reactive<PageData<{}, AutoVersionQuery>>({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    definitionId: route.query.definitionId as string || undefined,
    publishStatus: undefined,
  },
  rules: {},
});

const { queryParams } = toRefs(data);

/** 查询版本列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listVersion(queryParams.value);
    versionList.value = (res as any).rows ?? [];
    total.value = (res as any).total ?? 0;
  } finally { loading.value = false; }
};

/** 返回 */
const goBack = () => {
  router.push({ path: '/automation/definition' });
};

/** 查看历史编排 */
const handleViewFlow = (row: AutoVersionVo) => {
  versionPreviewRef.value?.open({ id: row.id, version: row.version });
};

/** 查看运行定义 */
const handleViewRuntime = async (row: AutoVersionVo) => {
  const res = await getRuntimeJson(row.id);
  runtimeJsonContent.value = formatJsonContent(res.data);
  viewDialog.title = '运行定义 - 版本 ' + row.version;
  viewDialog.visible = true;
};

function formatJsonContent(content: unknown): string {
  if (content == null || content === '') {
    return '暂无运行定义数据（请先在设计器保存流程，且需包含触发节点与至少一个业务节点）';
  }
  if (typeof content === 'string') {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content);
  }
}

/** 发布版本 */
const handlePublish = async (row: AutoVersionVo) => {
  await proxy?.$modal.confirm('确认发布版本 v' + row.version + '?');
  await publishVersion(row.id);
  proxy?.$modal.msgSuccess('发布成功');
  await getList();
};

/** 导出 */
const handleExport = async (row: AutoVersionVo) => {
  const [versionRes, runtimeRes] = await Promise.all([getVersion(row.id), getRuntimeJson(row.id)]);
  const dataStr = JSON.stringify({ version: versionRes.data, runtimeJson: runtimeRes.data }, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `version-${row.definitionId}-v${row.version}.json`;
  a.click();
  URL.revokeObjectURL(url);
  proxy?.$modal.msgSuccess('导出成功');
};

onMounted(() => {
  getList();
});
</script>