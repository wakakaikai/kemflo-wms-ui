<template>
  <div class="p-2">
    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" align="middle">
          <el-col :span="12">
            <span class="text-md font-bold">设备点位</span>
            <span v-if="route.query.deviceName" class="ml-2 text-gray-400">- {{ route.query.deviceName }}</span>
          </el-col>
          <el-col :span="12" class="text-right">
            <el-button icon="Back" @click="goBack">返回</el-button>
          </el-col>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="pointList" border>
        <el-table-column label="设备ID" prop="deviceId" min-width="100" />
        <el-table-column label="点位ID" prop="pointId" min-width="100" />
        <el-table-column label="当前值" prop="currentValue" min-width="120" />
        <el-table-column label="质量" align="center" width="100" prop="quality" />
        <el-table-column label="采集时间" align="center" width="170" prop="collectTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.collectTime) }}</span>
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

<script setup name="IotDevicePoint" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs } from 'vue';
import { listDevicePoint } from '@/api/iot/devicePoint';
import { DevicePointQuery, DevicePointVO } from '@/api/iot/devicePoint/types';
import { useRoute, useRouter } from 'vue-router';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();

const pointList = ref<DevicePointVO[]>([]);
const total = ref(0);
const loading = ref(true);

const data = reactive<PageData<{}, DevicePointQuery>>({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deviceId: route.query.deviceId as string || undefined,
  },
  rules: {},
});

const { queryParams } = toRefs(data);

const getList = async () => {
  loading.value = true;
  try {
    const res = await listDevicePoint(queryParams.value);
    pointList.value = res.data.rows ?? res.data;
    total.value = res.data.total ?? res.data.length;
  } finally { loading.value = false; }
};

const goBack = () => router.push({ path: '/iot/device' });

onMounted(() => { getList(); });
</script>