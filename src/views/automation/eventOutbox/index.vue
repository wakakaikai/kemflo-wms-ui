<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="事件类型" prop="eventType">
              <el-input v-model="queryParams.eventType" placeholder="请输入事件类型" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="业务类型" prop="businessType">
              <el-input v-model="queryParams.businessType" placeholder="请输入业务类型" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="消费状态" clearable style="width: 140px">
                <el-option label="待消费" value="PENDING" />
                <el-option label="消费中" value="CONSUMING" />
                <el-option label="已消费" value="CONSUMED" />
                <el-option label="失败" value="FAILED" />
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
            <el-button type="primary" plain icon="Refresh" @click="handleBatchRedeliver">批量重新投递</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" :data="eventOutboxList" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="事件ID" prop="eventId" min-width="160" />
        <el-table-column label="事件类型" prop="eventType" min-width="140" />
        <el-table-column label="业务类型" align="center" width="120" prop="businessType" />
        <el-table-column label="业务ID" prop="businessId" min-width="140" show-overflow-tooltip />
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">
            <dict-tag :options="auto_outbox_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="重试次数" align="center" width="80" prop="retryCount" />
        <el-table-column label="下次重试" align="center" width="170" prop="nextRetryTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.nextRetryTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="消费时间" align="center" width="170" prop="consumeTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.consumeTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" width="170" prop="createTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" align="center" label="操作" width="120">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === 'FAILED' || scope.row.status === 'PENDING'"
              link type="primary" icon="Refresh"
              @click="handleRedeliver(scope.row)"
            >重新投递</el-button>
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

<script setup name="AutomationEventOutbox" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs } from 'vue';
import { ElFormInstance } from 'element-plus';
import { listEventOutbox, redeliverEventOutbox } from '@/api/automation/eventOutbox';
import { AutoEventOutboxQuery, AutoEventOutboxVo } from '@/api/automation/eventOutbox/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { auto_outbox_status } = toRefs<any>(proxy?.useDict('auto_outbox_status'));

const eventOutboxList = ref<AutoEventOutboxVo[]>([]);
const total = ref(0);
const loading = ref(true);
const showSearch = ref(true);
const selectedIds = ref<(number | string)[]>([]);

const queryFormRef = ref<ElFormInstance>();

const data = reactive<PageData<{}, AutoEventOutboxQuery>>({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    eventType: undefined,
    businessType: undefined,
    status: undefined,
  },
  rules: {},
});

const { queryParams } = toRefs(data);

/** 查询事件记录列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listEventOutbox(queryParams.value);
    eventOutboxList.value = res.data.rows ?? res.data;
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
const handleSelectionChange = (selection: AutoEventOutboxVo[]) => {
  selectedIds.value = selection.map(s => s.id);
};

/** 重新投递 */
const handleRedeliver = async (row: AutoEventOutboxVo) => {
  await proxy?.$modal.confirm('确认重新投递该事件?');
  await redeliverEventOutbox(row.id);
  proxy?.$modal.msgSuccess('已触发重新投递');
  await getList();
};

/** 批量重新投递 */
const handleBatchRedeliver = async () => {
  if (selectedIds.value.length === 0) {
    proxy?.$modal.msgWarning('请先选择要重新投递的事件');
    return;
  }
  await proxy?.$modal.confirm('确认重新投递选中的 ' + selectedIds.value.length + ' 个事件?');
  for (const id of selectedIds.value) {
    await redeliverEventOutbox(id);
  }
  proxy?.$modal.msgSuccess('批量重新投递成功');
  await getList();
};

onMounted(() => {
  getList();
});
</script>