<template>
  <div class="p-2">
    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" align="middle">
          <el-col :span="12">
            <span class="text-md font-bold">命令执行日志</span>
            <span class="ml-2 text-gray-400">- 命令ID: {{ route.query.commandId }}</span>
          </el-col>
          <el-col :span="12" class="text-right">
            <el-button icon="Back" @click="goBack">返回</el-button>
          </el-col>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="logList" border>
        <el-table-column label="状态" align="center" width="100" prop="status" />
        <el-table-column label="请求" prop="requestJson" min-width="200" show-overflow-tooltip />
        <el-table-column label="响应" prop="responseJson" min-width="200" show-overflow-tooltip />
        <el-table-column label="耗时(ms)" align="center" width="90" prop="durationMs" />
        <el-table-column label="错误信息" prop="errorMessage" min-width="180" show-overflow-tooltip />
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

<script setup name="IotDeviceCommandLog" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref } from 'vue';
import { DeviceCommandLogQuery, DeviceCommandLogVO } from '@/api/iot/deviceCommandLog/types';
import { useRoute, useRouter } from 'vue-router';
import request from '@/utils/request';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();

const logList = ref<DeviceCommandLogVO[]>([]);
const total = ref(0);
const loading = ref(true);

const queryParams = reactive<DeviceCommandLogQuery>({
  pageNum: 1,
  pageSize: 10,
  commandId: route.query.commandId as string || undefined,
});

const getList = async () => {
  loading.value = true;
  try {
    const res = await request({ url: '/iot/deviceCommandLog/list', method: 'get', params: queryParams });
    logList.value = res.data.rows ?? res.data;
    total.value = res.data.total ?? res.data.length;
  } finally { loading.value = false; }
};

const goBack = () => router.push({ path: '/iot/deviceCommand', query: { deviceId: route.query.deviceId } });

onMounted(() => { getList(); });
</script>