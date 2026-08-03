<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="节点类型" prop="nodeType">
              <el-select v-model="queryParams.nodeType" placeholder="节点类型" clearable style="width: 160px">
                <el-option label="条件判断" value="CONDITION" />
                <el-option label="数据查询" value="DATA_QUERY" />
                <el-option label="数据新增" value="DATA_CREATE" />
                <el-option label="HTTP调用" value="HTTP_CALL" />
                <el-option label="设备读取" value="DEVICE_READ" />
                <el-option label="审批发起" value="APPROVAL_START" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="执行状态" clearable style="width: 140px">
                <el-option label="待执行" value="PENDING" />
                <el-option label="运行中" value="RUNNING" />
                <el-option label="等待中" value="WAITING" />
                <el-option label="成功" value="SUCCESS" />
                <el-option label="失败" value="FAILED" />
                <el-option label="已跳过" value="SKIPPED" />
                <el-option label="已取消" value="CANCELLED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" align="middle">
          <el-col :span="12">
            <span class="text-md font-bold">节点执行日志</span>
            <span v-if="route.query.instanceNo" class="ml-2 text-gray-400">- 实例: {{ route.query.instanceNo }}</span>
          </el-col>
          <el-col :span="12" class="text-right">
            <el-button icon="Back" @click="goBack">返回</el-button>
            <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
          </el-col>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="nodeExecutionList" border>
        <el-table-column label="节点名称" prop="nodeName" min-width="150" />
        <el-table-column label="节点类型" align="center" width="120" prop="nodeType" />
        <el-table-column label="执行次数" align="center" width="80" prop="retryCount">
          <template #default="scope">
            <span>{{ scope.row.retryCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">
            <dict-tag :options="auto_node_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="开始时间" align="center" width="170" prop="startTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.startTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="结束时间" align="center" width="170" prop="endTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.endTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="耗时(ms)" align="center" width="100" prop="durationMs" />
        <el-table-column label="错误信息" prop="errorMessage" min-width="180" show-overflow-tooltip />
        <el-table-column label="创建时间" align="center" width="170" prop="createTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" align="center" label="操作" width="160">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleViewIO(scope.row)">查看I/O</el-button>
            <el-button
              v-if="scope.row.status === 'FAILED'"
              link type="primary" icon="Refresh"
              @click="handleRetry(scope.row)"
            >重试</el-button>
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

    <!-- 查看输入输出对话框 -->
    <el-dialog v-model="ioDialog.visible" title="节点输入/输出" destroy-on-close append-to-body width="800px">
      <el-tabs type="border-card">
        <el-tab-pane label="输入">
          <el-input v-model="ioContent.input" type="textarea" :rows="15" readonly placeholder="无输入数据" />
        </el-tab-pane>
        <el-tab-pane label="输出">
          <el-input v-model="ioContent.output" type="textarea" :rows="15" readonly placeholder="无输出数据" />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="ioDialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="AutomationNodeExecution" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs } from 'vue';
import { ElFormInstance } from 'element-plus';
import { listNodeExecution, retryNodeExecution } from '@/api/automation/nodeExecution';
import { AutoNodeExecutionQuery, AutoNodeExecutionVo } from '@/api/automation/nodeExecution/types';
import { useRoute, useRouter } from 'vue-router';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();
const { auto_node_status } = toRefs<any>(proxy?.useDict('auto_node_status'));

const nodeExecutionList = ref<AutoNodeExecutionVo[]>([]);
const total = ref(0);
const loading = ref(true);
const showSearch = ref(true);

const ioDialog = reactive<DialogOption>({ visible: false, title: '' });
const ioContent = reactive({ input: '', output: '' });
const queryFormRef = ref<ElFormInstance>();

const data = reactive<PageData<{}, AutoNodeExecutionQuery>>({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    instanceId: route.query.instanceId as string || undefined,
    nodeType: undefined,
    status: undefined,
  },
  rules: {},
});

const { queryParams } = toRefs(data);

/** 查询节点执行列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listNodeExecution(queryParams.value);
    nodeExecutionList.value = res.data.rows ?? res.data;
    total.value = res.data.total ?? res.data.length;
  } finally { loading.value = false; }
};

/** 搜索 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 返回 */
const goBack = () => {
  router.push({ path: '/automation/instance' });
};

/** 查看输入输出 */
const handleViewIO = async (row: AutoNodeExecutionVo) => {
  ioContent.input = row.inputData
    ? JSON.stringify(JSON.parse(row.inputData), null, 2)
    : '无输入数据';
  ioContent.output = row.outputData
    ? JSON.stringify(JSON.parse(row.outputData), null, 2)
    : '无输出数据';
  ioDialog.title = '节点: ' + row.nodeName;
  ioDialog.visible = true;
};

/** 重试 */
const handleRetry = async (row: AutoNodeExecutionVo) => {
  await proxy?.$modal.confirm('确认重试节点"' + row.nodeName + '"?');
  await retryNodeExecution(row.id);
  proxy?.$modal.msgSuccess('已触发重试');
  await getList();
};

onMounted(() => {
  getList();
});
</script>