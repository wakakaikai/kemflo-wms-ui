<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item v-if="!routeDeviceId" label="设备" prop="deviceId">
              <el-select v-model="queryParams.deviceId" clearable filterable style="width: 200px" @change="handleQuery">
                <el-option v-for="item in deviceOptions" :key="item.id" :label="item.deviceName" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="点位编码" prop="pointCode">
              <el-input v-model="queryParams.pointCode" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="点位名称" prop="pointName">
              <el-input v-model="queryParams.pointName" clearable @keyup.enter="handleQuery" />
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
            <span class="font-bold">采集点位</span>
            <span v-if="headerDeviceName" class="ml-2 text-gray-400">- {{ headerDeviceName }}</span>
          </el-col>
          <el-col :span="12" class="text-right">
            <el-button v-hasPermi="['iot:point:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
            <el-button v-hasPermi="['iot:point:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
            <el-button v-if="routeDeviceId" icon="Back" @click="router.push('/iot/device')">返回</el-button>
            <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
          </el-col>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="pointList" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column v-if="!routeDeviceId" label="设备" prop="deviceName" min-width="120" />
        <el-table-column label="点位编码" prop="pointCode" min-width="120" />
        <el-table-column label="点位名称" prop="pointName" min-width="120" />
        <el-table-column label="点位地址" prop="tagAddress" min-width="180" show-overflow-tooltip />
        <el-table-column label="类型" align="center" width="90">
          <template #default="scope">
            <dict-tag :options="IOT_DATA_TYPE_OPTIONS" :value="scope.row.dataType" />
          </template>
        </el-table-column>
        <el-table-column label="读写" align="center" width="80">
          <template #default="scope">
            <dict-tag :options="IOT_READ_WRITE_OPTIONS" :value="scope.row.rwMode" />
          </template>
        </el-table-column>
        <el-table-column label="当前值" prop="currentValue" min-width="100" />
        <el-table-column label="质量" align="center" width="100">
          <template #default="scope">
            <dict-tag :options="IOT_QUALITY_OPTIONS" :value="scope.row.quality" />
          </template>
        </el-table-column>
        <el-table-column label="采集时间" align="center" width="170">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.collectTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="160" align="center">
          <template #default="scope">
            <el-button v-hasPermi="['iot:point:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button v-hasPermi="['iot:point:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="640px" destroy-on-close append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item v-if="!routeDeviceId" label="设备" prop="deviceId">
          <el-select v-model="form.deviceId" filterable style="width: 100%">
            <el-option v-for="item in deviceOptions" :key="item.id" :label="item.deviceName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="点位编码" prop="pointCode">
          <el-input v-model="form.pointCode" placeholder="如 temperature" />
        </el-form-item>
        <el-form-item label="点位名称" prop="pointName">
          <el-input v-model="form.pointName" />
        </el-form-item>
        <el-form-item label="点位地址" prop="tagAddress">
          <el-input v-model="form.tagAddress" placeholder="PLC4X地址，如 holding-register:1" />
        </el-form-item>
        <el-form-item label="数据类型" prop="dataType">
          <el-select v-model="form.dataType" style="width: 100%">
            <el-option v-for="item in IOT_DATA_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="读写" prop="rwMode">
          <el-select v-model="form.rwMode" style="width: 100%">
            <el-option v-for="item in IOT_READ_WRITE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="缩放" prop="scaleFactor">
              <el-input-number v-model="form.scaleFactor" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="偏移" prop="offsetValue">
              <el-input-number v-model="form.offsetValue" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="form.unit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number v-model="form.sortOrder" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm">确定</el-button>
        <el-button @click="dialog.visible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="IotPoint" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs, computed, onMounted } from 'vue';
import { ElFormInstance } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import { listPoint, getPoint, addPoint, updatePoint, delPoint } from '@/api/iot/point';
import { PointForm, PointQuery, PointVO } from '@/api/iot/point/types';
import { listDevice } from '@/api/iot/device';
import { DeviceVO } from '@/api/iot/device/types';
import { IOT_DATA_TYPE_OPTIONS, IOT_READ_WRITE_OPTIONS, IOT_QUALITY_OPTIONS } from '@/views/iot/options';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();

const routeDeviceId = computed(() => route.query.deviceId as string | undefined);
const headerDeviceName = computed(() => (route.query.deviceName as string) || '');

const pointList = ref<PointVO[]>([]);
const deviceOptions = ref<DeviceVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const ids = ref<Array<string | number>>([]);
const multiple = ref(true);

const dialog = reactive<DialogOption>({ visible: false, title: '' });
const queryFormRef = ref<ElFormInstance>();
const formRef = ref<ElFormInstance>();

const initForm: PointForm = {
  deviceId: route.query.deviceId ? Number(route.query.deviceId) || route.query.deviceId : undefined,
  pointCode: undefined,
  pointName: undefined,
  tagAddress: undefined,
  dataType: 'FLOAT',
  unit: undefined,
  rwMode: 'R',
  scaleFactor: 1,
  offsetValue: 0,
  sortOrder: 0,
  status: '0'
};

const data = reactive<PageData<PointForm, PointQuery>>({
  form: { ...initForm },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deviceId: (route.query.deviceId as string) || undefined,
    pointCode: undefined,
    pointName: undefined
  },
  rules: {
    deviceId: [{ required: true, message: '设备不能为空', trigger: 'change' }],
    pointCode: [{ required: true, message: '点位编码不能为空', trigger: 'blur' }],
    pointName: [{ required: true, message: '点位名称不能为空', trigger: 'blur' }],
    tagAddress: [{ required: true, message: '点位地址不能为空', trigger: 'blur' }]
  }
});
const { queryParams, form, rules } = toRefs(data);

const loadDevices = async () => {
  const res = await listDevice({ pageNum: 1, pageSize: 200 });
  deviceOptions.value = (res as any).rows ?? [];
};

const getList = async () => {
  loading.value = true;
  try {
    const res = await listPoint(queryParams.value);
    pointList.value = (res as any).rows ?? [];
    total.value = (res as any).total ?? 0;
  } finally {
    loading.value = false;
  }
};

const handleSelectionChange = (selection: PointVO[]) => {
  ids.value = selection.map((i) => i.id);
  multiple.value = !selection.length;
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  if (routeDeviceId.value) queryParams.value.deviceId = routeDeviceId.value;
  handleQuery();
};

const reset = () => {
  form.value = {
    ...initForm,
    deviceId: routeDeviceId.value ? Number(routeDeviceId.value) || routeDeviceId.value : queryParams.value.deviceId
  };
  formRef.value?.resetFields();
};

const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '新增点位';
};

const handleUpdate = async (row: PointVO) => {
  reset();
  const res = await getPoint(row.id);
  form.value = res.data;
  dialog.visible = true;
  dialog.title = '修改点位';
};

const submitForm = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    if (!form.value.deviceId) form.value.deviceId = routeDeviceId.value || queryParams.value.deviceId;
    form.value.id ? await updatePoint(form.value) : await addPoint(form.value);
    proxy?.$modal.msgSuccess('操作成功');
    dialog.visible = false;
    await getList();
  });
};

const handleDelete = async (row?: PointVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('确认删除选中点位？');
  await delPoint(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

onMounted(async () => {
  if (!routeDeviceId.value) await loadDevices();
  await getList();
});
</script>
