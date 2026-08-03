<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="连接ID" prop="connectionId">
              <el-input v-model="queryParams.connectionId" placeholder="连接ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="执行状态" clearable style="width: 140px">
                <el-option label="成功" value="SUCCESS" />
                <el-option label="失败" value="FAILED" />
                <el-option label="超时" value="TIMEOUT" />
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
        <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
      </template>

      <el-table v-loading="loading" :data="logList" border>
        <el-table-column label="执行ID" prop="executionId" min-width="100" />
        <el-table-column label="连接ID" prop="connectionId" min-width="100" />
        <el-table-column label="操作ID" prop="operationId" min-width="100" />
        <el-table-column label="状态" align="center" width="90">
          <template #default="scope">
            <dict-tag :options="int_execution_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="请求内容" prop="requestJson" min-width="200" show-overflow-tooltip />
        <el-table-column label="响应内容" prop="responseJson" min-width="200" show-overflow-tooltip />
        <el-table-column label="耗时(ms)" align="center" width="90" prop="durationMs" />
        <el-table-column label="错误信息" prop="errorMessage" min-width="180" show-overflow-tooltip />
        <el-table-column label="创建时间" align="center" width="170" prop="createTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" align="center" label="操作" width="80">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleDetail(scope.row)">详情</el-button>
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

    <el-dialog v-model="detailDialog.visible" title="执行日志详情" destroy-on-close append-to-body width="800px">
      <el-tabs type="border-card">
        <el-tab-pane label="请求">
          <el-input v-model="detailRequest" type="textarea" :rows="15" readonly />
        </el-tab-pane>
        <el-tab-pane label="响应">
          <el-input v-model="detailResponse" type="textarea" :rows="15" readonly />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="IntegrationExecutionLog" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs } from 'vue';
import { ElFormInstance } from 'element-plus';
import { listExecutionLog, getExecutionLog } from '@/api/integration/executionLog';
import { ExecutionLogQuery, ExecutionLogVO } from '@/api/integration/executionLog/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { int_execution_status } = toRefs<any>(proxy?.useDict('int_execution_status'));

const logList = ref<ExecutionLogVO[]>([]);
const total = ref(0);
const loading = ref(true);
const showSearch = ref(true);

const detailDialog = reactive<DialogOption>({ visible: false, title: '' });
const detailRequest = ref('');
const detailResponse = ref('');
const queryFormRef = ref<ElFormInstance>();

const data = reactive<PageData<{}, ExecutionLogQuery>>({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    connectionId: undefined,
    operationId: undefined,
    status: undefined,
  },
  rules: {},
});

const { queryParams } = toRefs(data);

const getList = async () => {
  loading.value = true;
  try {
    const res = await listExecutionLog(queryParams.value);
    logList.value = res.data.rows ?? res.data;
    total.value = res.data.total ?? res.data.length;
  } finally { loading.value = false; }
};

const handleQuery = () => { queryParams.value.pageNum = 1; getList(); };
const resetQuery = () => { queryFormRef.value?.resetFields(); handleQuery(); };

const handleDetail = async (row: ExecutionLogVO) => {
  const res = await getExecutionLog(row.executionId);
  detailRequest.value = res.data.requestJson
    ? JSON.stringify(JSON.parse(res.data.requestJson), null, 2)
    : '无请求数据';
  detailResponse.value = res.data.responseJson
    ? JSON.stringify(JSON.parse(res.data.responseJson), null, 2)
    : '无响应数据';
  detailDialog.visible = true;
};

onMounted(() => { getList(); });
</script>