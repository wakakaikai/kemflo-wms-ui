<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="等待类型" prop="waitType">
              <el-select v-model="queryParams.waitType" placeholder="等待类型" clearable style="width: 160px">
                <el-option label="审批" value="APPROVAL" />
                <el-option label="设备响应" value="DEVICE_RESPONSE" />
                <el-option label="消息" value="MESSAGE" />
                <el-option label="定时" value="SCHEDULE" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="等待状态" clearable style="width: 140px">
                <el-option label="等待中" value="WAITING" />
                <el-option label="已恢复" value="RESUMED" />
                <el-option label="已超时" value="TIMEOUT" />
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
        <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
      </template>

      <el-table v-loading="loading" :data="waitEventList" border>
        <el-table-column label="实例ID" prop="instanceId" min-width="100" />
        <el-table-column label="等待类型" align="center" width="120" prop="waitType" />
        <el-table-column label="等待键" prop="waitKey" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">
            <dict-tag :options="auto_wait_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="过期时间" align="center" width="170" prop="expireTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.expireTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" width="170" prop="createTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" align="center" label="操作" width="180">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === 'WAITING'"
              link type="success" icon="CircleCheck"
              @click="handleComplete(scope.row)"
            >完成</el-button>
            <el-button
              v-if="scope.row.status === 'WAITING'"
              link type="danger" icon="CircleClose"
              @click="handleCancel(scope.row)"
            >取消</el-button>
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

<script setup name="AutomationWaitEvent" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs } from 'vue';
import { ElFormInstance } from 'element-plus';
import { listWaitEvent, completeWaitEvent, cancelWaitEvent } from '@/api/automation/waitEvent';
import { AutoWaitEventQuery, AutoWaitEventVo } from '@/api/automation/waitEvent/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { auto_wait_status } = toRefs<any>(proxy?.useDict('auto_wait_status'));

const waitEventList = ref<AutoWaitEventVo[]>([]);
const total = ref(0);
const loading = ref(true);
const showSearch = ref(true);

const queryFormRef = ref<ElFormInstance>();

const data = reactive<PageData<{}, AutoWaitEventQuery>>({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    waitType: undefined,
    status: undefined,
  },
  rules: {},
});

const { queryParams } = toRefs(data);

/** 查询等待事件列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listWaitEvent(queryParams.value);
    waitEventList.value = res.data.rows ?? res.data;
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

/** 完成 */
const handleComplete = async (row: AutoWaitEventVo) => {
  await proxy?.$modal.confirm('确认完成该等待事件?');
  await completeWaitEvent(row.id);
  proxy?.$modal.msgSuccess('已完成');
  await getList();
};

/** 取消 */
const handleCancel = async (row: AutoWaitEventVo) => {
  await proxy?.$modal.confirm('确认取消该等待事件?');
  await cancelWaitEvent(row.id);
  proxy?.$modal.msgSuccess('已取消');
  await getList();
};

onMounted(() => {
  getList();
});
</script>