<template>
  <div class="p-2">
    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" align="middle">
          <el-col :span="12">
            <span class="text-md font-bold">设备影子</span>
            <span v-if="route.query.deviceName" class="ml-2 text-gray-400">- {{ route.query.deviceName }}</span>
          </el-col>
          <el-col :span="12" class="text-right">
            <el-button icon="Back" @click="goBack">返回</el-button>
          </el-col>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="shadowList" border>
        <el-table-column label="设备名称" prop="deviceName" min-width="160" />
        <el-table-column label="版本号" align="center" width="80" prop="version" />
        <el-table-column label="属性数据" min-width="280">
          <template #default="scope">
            <span>{{ truncateJson(scope.row.propertiesJson) }}</span>
            <el-button v-if="scope.row.propertiesJson" link type="primary" @click="openJson('属性数据', scope.row.propertiesJson)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="最后上报" align="center" width="170" prop="lastReportTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.lastReportTime) }}</span>
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

<script setup name="IotDeviceShadow" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref } from 'vue';
import { listDeviceShadow } from '@/api/iot/deviceShadow';
import { DeviceShadowQuery, DeviceShadowVO } from '@/api/iot/deviceShadow/types';
import { useRoute, useRouter } from 'vue-router';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();

const shadowList = ref<DeviceShadowVO[]>([]);
const total = ref(0);
const loading = ref(true);

const jsonVisible = ref(false);
const jsonTitle = ref('');
const jsonContent = ref('');

const queryParams = reactive<DeviceShadowQuery>({
  pageNum: 1,
  pageSize: 10,
  deviceId: route.query.deviceId as string || undefined,
});

const formatJson = (str?: string) => {
  if (!str) return '';
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
};

const truncateJson = (raw?: string, maxLen = 60) => {
  if (!raw) return '-';
  const s = raw.replace(/\s+/g, ' ');
  return s.length > maxLen ? s.slice(0, maxLen) + '...' : s;
};

const openJson = (title: string, raw?: string) => {
  jsonTitle.value = title;
  jsonContent.value = formatJson(raw);
  jsonVisible.value = true;
};

const getList = async () => {
  loading.value = true;
  try {
    const res = await listDeviceShadow(queryParams);
    shadowList.value = (res as any).rows ?? [];
    total.value = (res as any).total ?? 0;
  } finally { loading.value = false; }
};

const goBack = () => router.push({ path: '/iot/device' });

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
