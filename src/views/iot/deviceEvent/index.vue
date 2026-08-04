<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="事件类型" prop="eventType">
              <el-input v-model="queryParams.eventType" placeholder="请输入事件类型" clearable @keyup.enter="handleQuery" />
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
            <span class="text-md font-bold">设备事件</span>
            <span v-if="route.query.deviceName" class="ml-2 text-gray-400">- {{ route.query.deviceName }}</span>
          </el-col>
          <el-col :span="12" class="text-right">
            <el-button icon="Back" @click="goBack">返回</el-button>
            <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
          </el-col>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="eventList" border>
        <el-table-column label="设备名称" prop="deviceName" min-width="160" />
        <el-table-column label="事件类型" prop="eventType" min-width="160" />
        <el-table-column label="事件数据" min-width="200">
          <template #default="scope">
            <span>{{ previewJson(scope.row.eventDataJson) }}</span>
            <el-button v-if="scope.row.eventDataJson" link type="primary" @click="openJson('事件数据', scope.row.eventDataJson)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="事件时间" align="center" width="170" prop="eventTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.eventTime) }}</span>
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

<script setup name="IotDeviceEvent" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs } from 'vue';
import { ElFormInstance } from 'element-plus';
import { listDeviceEvent } from '@/api/iot/deviceEvent';
import { DeviceEventQuery, DeviceEventVO } from '@/api/iot/deviceEvent/types';
import { useRoute, useRouter } from 'vue-router';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();

const eventList = ref<DeviceEventVO[]>([]);
const total = ref(0);
const loading = ref(true);
const showSearch = ref(true);
const queryFormRef = ref<ElFormInstance>();

const jsonVisible = ref(false);
const jsonTitle = ref('');
const jsonContent = ref('');

const data = reactive<PageData<{}, DeviceEventQuery>>({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deviceId: route.query.deviceId as string || undefined,
    eventType: undefined,
  },
  rules: {},
});

const { queryParams } = toRefs(data);

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
    const res = await listDeviceEvent(queryParams.value);
    eventList.value = (res as any).rows ?? [];
    total.value = (res as any).total ?? 0;
  } finally { loading.value = false; }
};

const handleQuery = () => { queryParams.value.pageNum = 1; getList(); };
const resetQuery = () => { queryFormRef.value?.resetFields(); handleQuery(); };
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
