<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="实例编号" prop="instanceNo">
              <el-input v-model="queryParams.instanceNo" placeholder="请输入实例编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="触发类型" prop="triggerType">
              <el-select v-model="queryParams.triggerType" placeholder="触发类型" clearable>
                <el-option label="手工触发" value="MANUAL_TRIGGER" />
                <el-option label="定时触发" value="CRON_TRIGGER" />
                <el-option label="Webhook触发" value="WEBHOOK_TRIGGER" />
                <el-option label="数据触发" value="DATA_TRIGGER" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="实例状态" clearable>
                <el-option label="已创建" value="CREATED" />
                <el-option label="运行中" value="RUNNING" />
                <el-option label="等待中" value="WAITING" />
                <el-option label="成功" value="SUCCESS" />
                <el-option label="失败" value="FAILED" />
                <el-option label="已取消" value="CANCELLED" />
                <el-option label="已终止" value="TERMINATED" />
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
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button type="warning" plain icon="CircleClose" @click="handleBatchTerminate">批量终止</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" :data="instanceList" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="实例编号" prop="instanceNo" min-width="160" />
        <el-table-column label="流程定义" prop="definitionName" min-width="160" />
        <el-table-column label="触发类型" align="center" width="120">
          <template #default="scope">
            <dict-tag :options="triggerTypeOptions" :value="scope.row.triggerType" />
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">
            <dict-tag :options="instanceStatusOptions" :value="scope.row.status" />
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
        <el-table-column fixed="right" align="center" label="操作" width="180">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleDetail(scope.row)">详情</el-button>
            <el-button link type="primary" icon="Tickets" @click="handleNodeLogs(scope.row)">节点日志</el-button>
            <el-button
              v-if="scope.row.status === 'RUNNING' || scope.row.status === 'WAITING'"
              link type="danger" icon="CircleClose"
              @click="handleTerminate(scope.row)"
            >终止</el-button>
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

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialog.visible" title="实例详情" destroy-on-close append-to-body width="780px">
      <el-descriptions :column="2" border v-if="currentInstance">
        <el-descriptions-item label="实例编号">{{ currentInstance.instanceNo }}</el-descriptions-item>
        <el-descriptions-item label="流程定义">{{ currentInstance.definitionName }}</el-descriptions-item>
        <el-descriptions-item label="触发类型">{{ currentInstance.triggerType }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <dict-tag :options="instanceStatusOptions" :value="currentInstance.status" />
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ proxy?.parseTime(currentInstance.startTime) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ proxy?.parseTime(currentInstance.endTime) }}</el-descriptions-item>
        <el-descriptions-item label="耗时(ms)">{{ currentInstance.durationMs }}</el-descriptions-item>
        <el-descriptions-item label="当前节点">{{ currentInstance.currentNodeId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="错误信息" :span="2">{{ currentInstance.errorMessage || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div class="mt-4" v-if="traceNodes.length">
        <div class="mb-2 font-medium">节点执行状态</div>
        <el-table :data="traceNodes" border size="small">
          <el-table-column label="节点ID" prop="nodeId" min-width="140" show-overflow-tooltip />
          <el-table-column label="名称" prop="nodeName" min-width="100" />
          <el-table-column label="类型" prop="nodeType" width="110" />
          <el-table-column label="状态" prop="status" width="100" align="center">
            <template #default="scope">
              <el-tag size="small" :type="nodeStatusTag(scope.row.status)">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="耗时(ms)" prop="durationMs" width="90" align="center" />
          <el-table-column label="错误" prop="errorMessage" min-width="140" show-overflow-tooltip />
        </el-table>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="AutomationInstance" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs, computed, onMounted } from 'vue';
import { FormInstance } from 'element-plus';
import { listInstance, getInstance, terminateInstance, getInstanceNodes } from '@/api/automation/instance';
import { AutoInstanceQuery, AutoInstanceVo, AutoInstanceNodeStatus } from '@/api/automation/instance/types';
import { useRouter } from 'vue-router';
import {
  AUTO_INSTANCE_STATUS_OPTIONS, AUTO_TRIGGER_TYPE_OPTIONS, resolveDictOptions
} from '@/views/automation/options';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const router = useRouter();
const { auto_instance_status, auto_trigger_type } = toRefs<any>(proxy?.useDict('auto_instance_status', 'auto_trigger_type'));
const instanceStatusOptions = computed(() => resolveDictOptions(auto_instance_status.value, AUTO_INSTANCE_STATUS_OPTIONS));
const triggerTypeOptions = computed(() => resolveDictOptions(auto_trigger_type.value, AUTO_TRIGGER_TYPE_OPTIONS));

const instanceList = ref<AutoInstanceVo[]>([]);
const total = ref(0);
const loading = ref(true);
const showSearch = ref(true);
const selectedIds = ref<(number | string)[]>([]);
const currentInstance = ref<AutoInstanceVo | null>(null);
const traceNodes = ref<AutoInstanceNodeStatus[]>([]);

const detailDialog = reactive<DialogOption>({ visible: false, title: '' });
const queryFormRef = ref<FormInstance>();

const data = reactive<PageData<{}, AutoInstanceQuery>>({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    instanceNo: undefined,
    status: undefined,
    triggerType: undefined,
  },
  rules: {},
});

const { queryParams } = toRefs(data);

/** 查询实例列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listInstance(queryParams.value);
    instanceList.value = (res as any).rows ?? [];
    total.value = (res as any).total ?? 0;
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

/** 多选 */
const handleSelectionChange = (selection: AutoInstanceVo[]) => {
  selectedIds.value = selection.map(s => s.id);
};

/** 详情 */
const handleDetail = async (row: AutoInstanceVo) => {
  const res = await getInstance(row.id);
  currentInstance.value = res.data;
  try {
    const trace = await getInstanceNodes(row.id);
    traceNodes.value = trace.data?.nodes || [];
  } catch {
    traceNodes.value = [];
  }
  detailDialog.visible = true;
};

const nodeStatusTag = (status?: string) => {
  if (status === 'SUCCESS') return 'success';
  if (status === 'FAILED') return 'danger';
  if (status === 'RUNNING') return 'primary';
  if (status === 'SKIPPED') return 'info';
  return 'warning';
};

/** 节点日志 */
const handleNodeLogs = (row: AutoInstanceVo) => {
  router.push({ path: '/automation/nodeExecution', query: { instanceId: row.id, instanceNo: row.instanceNo } });
};

/** 终止 */
const handleTerminate = async (row: AutoInstanceVo) => {
  await proxy?.$modal.confirm('确认终止实例"' + row.instanceNo + '"?');
  await terminateInstance(row.id);
  proxy?.$modal.msgSuccess('已终止');
  await getList();
};

/** 批量终止 */
const handleBatchTerminate = async () => {
  if (selectedIds.value.length === 0) {
    proxy?.$modal.msgWarning('请先选择要终止的实例');
    return;
  }
  await proxy?.$modal.confirm('确认终止选中的 ' + selectedIds.value.length + ' 个实例?');
  for (const id of selectedIds.value) {
    await terminateInstance(id);
  }
  proxy?.$modal.msgSuccess('批量终止成功');
  await getList();
};

onMounted(() => {
  getList();
});
</script>
