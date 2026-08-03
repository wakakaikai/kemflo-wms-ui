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
        <el-table-column label="版本号" align="center" width="100" prop="version" />
        <el-table-column label="发布状态" align="center" width="120">
          <template #default="scope">
            <dict-tag :options="auto_publish_status" :value="scope.row.publishStatus" />
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
        <el-table-column label="备注" prop="remark" min-width="150" show-overflow-tooltip />
        <el-table-column fixed="right" align="center" label="操作" width="200">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleViewRuntime(scope.row)">查看运行定义</el-button>
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
  </div>
</template>

<script setup name="AutomationVersion" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs } from 'vue';
import { ElFormInstance } from 'element-plus';
import { listVersion, getVersion } from '@/api/automation/version';
import { AutoVersionQuery, AutoVersionVo } from '@/api/automation/version/types';
import { useRoute, useRouter } from 'vue-router';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();
const { auto_publish_status } = toRefs<any>(proxy?.useDict('auto_publish_status'));

const versionList = ref<AutoVersionVo[]>([]);
const total = ref(0);
const loading = ref(true);

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
    versionList.value = res.data.rows ?? res.data;
    total.value = res.data.total ?? res.data.length;
  } finally { loading.value = false; }
};

/** 返回 */
const goBack = () => {
  router.push({ path: '/automation/definition' });
};

/** 查看运行定义 */
const handleViewRuntime = async (row: AutoVersionVo) => {
  const res = await getVersion(row.id);
  runtimeJsonContent.value = res.data.runtimeJson
    ? JSON.stringify(JSON.parse(res.data.runtimeJson), null, 2)
    : '暂无运行定义数据';
  viewDialog.title = '运行定义 - 版本 ' + row.version;
  viewDialog.visible = true;
};

/** 导出 */
const handleExport = async (row: AutoVersionVo) => {
  const res = await getVersion(row.id);
  const dataStr = JSON.stringify({ version: res.data, runtimeJson: res.data.runtimeJson }, null, 2);
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