<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="任务类型" prop="taskType">
              <el-select v-model="queryParams.taskType" placeholder="任务类型" clearable style="width: 160px">
                <el-option label="节点执行" value="NODE_EXECUTION" />
                <el-option label="集成调用" value="INTEGRATION" />
                <el-option label="设备命令" value="DEVICE_COMMAND" />
                <el-option label="定时触发" value="SCHEDULED" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="任务状态" clearable style="width: 140px">
                <el-option label="待执行" value="PENDING" />
                <el-option label="运行中" value="RUNNING" />
                <el-option label="成功" value="SUCCESS" />
                <el-option label="失败" value="FAILED" />
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
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Refresh" @click="handleBatchRetry">批量重试</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" :data="taskList" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="实例ID" prop="instanceId" min-width="100" />
        <el-table-column label="任务类型" align="center" width="120" prop="taskType" />
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">
            <dict-tag :options="auto_task_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="优先级" align="center" width="70" prop="priority" />
        <el-table-column label="重试次数" align="center" width="100">
          <template #default="scope">
            <span>{{ scope.row.retryCount || 0 }} / {{ scope.row.maxRetryCount || 3 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最后错误" prop="lastError" min-width="200" show-overflow-tooltip />
        <el-table-column label="创建时间" align="center" width="170" prop="createTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" align="center" width="170" prop="updateTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.updateTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" align="center" label="操作" width="120">
          <template #default="scope">
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
  </div>
</template>

<script setup name="AutomationTask" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs } from 'vue';
import { ElFormInstance } from 'element-plus';
import { listTask, retryTask } from '@/api/automation/task';
import { AutoTaskQuery, AutoTaskVo } from '@/api/automation/task/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { auto_task_status } = toRefs<any>(proxy?.useDict('auto_task_status'));

const taskList = ref<AutoTaskVo[]>([]);
const total = ref(0);
const loading = ref(true);
const showSearch = ref(true);
const selectedIds = ref<(number | string)[]>([]);

const queryFormRef = ref<ElFormInstance>();

const data = reactive<PageData<{}, AutoTaskQuery>>({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    status: 'FAILED',
    taskType: undefined,
  },
  rules: {},
});

const { queryParams } = toRefs(data);

/** 查询任务列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listTask(queryParams.value);
    taskList.value = res.data.rows ?? res.data;
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

/** 多选 */
const handleSelectionChange = (selection: AutoTaskVo[]) => {
  selectedIds.value = selection.map(s => s.id);
};

/** 重试 */
const handleRetry = async (row: AutoTaskVo) => {
  await proxy?.$modal.confirm('确认重试该任务?');
  await retryTask(row.id);
  proxy?.$modal.msgSuccess('已触发重试');
  await getList();
};

/** 批量重试 */
const handleBatchRetry = async () => {
  if (selectedIds.value.length === 0) {
    proxy?.$modal.msgWarning('请先选择要重试的任务');
    return;
  }
  await proxy?.$modal.confirm('确认重试选中的 ' + selectedIds.value.length + ' 个任务?');
  for (const id of selectedIds.value) {
    await retryTask(id);
  }
  proxy?.$modal.msgSuccess('批量重试成功');
  await getList();
};

onMounted(() => {
  getList();
});
</script>