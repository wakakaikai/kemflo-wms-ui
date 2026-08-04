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
        <el-table-column label="状态" align="center" width="110">
          <template #default="scope">
            <dict-tag :options="commandStatusOptions" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="请求" min-width="180">
          <template #default="scope">
            <span>{{ previewJson(scope.row.requestJson) }}</span>
            <el-button v-if="scope.row.requestJson" link type="primary" @click="openJson('请求数据', scope.row.requestJson)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="响应" min-width="180">
          <template #default="scope">
            <span>{{ previewJson(scope.row.responseJson) }}</span>
            <el-button v-if="scope.row.responseJson" link type="primary" @click="openJson('响应数据', scope.row.responseJson)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="耗时(ms)" align="center" width="90" prop="durationMs" />
        <el-table-column label="错误信息" prop="errorMessage" min-width="180" show-overflow-tooltip />
        <el-table-column label="创建时间" align="center" width="170" prop="createTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.createTime) }}</span>
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

    <el-dialog v-model="jsonVisible" :title="jsonTitle" destroy-on-close append-to-body width="700px">
      <pre class="json-pre">{{ jsonContent }}</pre>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="jsonVisible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="IotDeviceCommandLog" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, computed, reactive, ref, toRefs } from 'vue';
import { listDeviceCommandLog } from '@/api/iot/deviceCommandLog';
import { DeviceCommandLogQuery, DeviceCommandLogVO } from '@/api/iot/deviceCommandLog/types';
import { IOT_COMMAND_STATUS_OPTIONS, resolveDictOptions } from '@/views/iot/options';
import { useRoute, useRouter } from 'vue-router';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();
const { iot_command_status } = toRefs<any>(proxy?.useDict('iot_command_status'));
const commandStatusOptions = computed(() => resolveDictOptions(iot_command_status.value, IOT_COMMAND_STATUS_OPTIONS));

const logList = ref<DeviceCommandLogVO[]>([]);
const total = ref(0);
const loading = ref(true);

const jsonVisible = ref(false);
const jsonTitle = ref('');
const jsonContent = ref('');

const queryParams = reactive<DeviceCommandLogQuery>({
  pageNum: 1,
  pageSize: 10,
  commandId: route.query.commandId as string || undefined,
});

const previewJson = (raw?: string, maxLen = 50) => {
  if (!raw) return '-';
  const s = raw.replace(/\s+/g, ' ');
  return s.length > maxLen ? s.slice(0, maxLen) + '...' : s;
};

const openJson = (title: string, raw?: string) => {
  jsonTitle.value = title;
  try { jsonContent.value = raw ? JSON.stringify(JSON.parse(raw), null, 2) : ''; }
  catch { jsonContent.value = raw || ''; }
  jsonVisible.value = true;
};

const getList = async () => {
  loading.value = true;
  try {
    const res = await listDeviceCommandLog(queryParams);
    logList.value = (res as any).rows ?? [];
    total.value = (res as any).total ?? 0;
  } finally { loading.value = false; }
};

const goBack = () => {
  router.push({
    path: '/iot/deviceCommand',
    query: {
      deviceId: route.query.deviceId,
      deviceName: route.query.deviceName,
    },
  });
};

onMounted(() => { getList(); });
</script>

<style scoped>
.json-pre {
  margin: 0;
  max-height: 500px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  font-size: 13px;
}
</style>
