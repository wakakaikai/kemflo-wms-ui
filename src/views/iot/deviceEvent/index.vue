<template>
  <div class="p-2">
    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" align="middle">
          <el-col :span="12">
            <span class="text-md font-bold">设备事件</span>
            <span v-if="route.query.deviceName" class="ml-2 text-gray-400">- {{ route.query.deviceName }}</span>
          </el-col>
          <el-col :span="12" class="text-right">
            <el-button icon="Back" @click="goBack">返回</el-button>
          </el-col>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="eventList" border>
        <el-table-column label="设备ID" prop="deviceId" min-width="100" />
        <el-table-column label="事件类型" prop="eventType" min-width="160" />
        <el-table-column label="事件数据" prop="eventDataJson" min-width="200" show-overflow-tooltip />
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
  </div>
</template>

<script setup name="IotDeviceEvent" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref } from 'vue';
import { DeviceEventQuery, DeviceEventVO } from '@/api/iot/deviceEvent/types';
import { useRoute, useRouter } from 'vue-router';
import request from '@/utils/request';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();

const eventList = ref<DeviceEventVO[]>([]);
const total = ref(0);
const loading = ref(true);

const queryParams = reactive<DeviceEventQuery>({
  pageNum: 1,
  pageSize: 10,
  deviceId: route.query.deviceId as string || undefined,
});

const getList = async () => {
  loading.value = true;
  try {
    const res = await request({ url: '/iot/deviceEvent/list', method: 'get', params: queryParams });
    eventList.value = res.data.rows ?? res.data;
    total.value = res.data.total ?? res.data.length;
  } finally { loading.value = false; }
};

const goBack = () => router.push({ path: '/iot/device' });

onMounted(() => { getList(); });
</script>