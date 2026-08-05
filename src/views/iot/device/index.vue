<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="设备编码" prop="deviceCode">
              <el-input v-model="queryParams.deviceCode" placeholder="设备编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="设备名称" prop="deviceName">
              <el-input v-model="queryParams.deviceName" placeholder="设备名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="协议" prop="protocol">
              <el-select v-model="queryParams.protocol" placeholder="协议" clearable style="width: 150px">
                <el-option v-for="item in IOT_PROTOCOL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="在线" prop="onlineStatus">
              <el-select v-model="queryParams.onlineStatus" placeholder="在线状态" clearable style="width: 120px">
                <el-option v-for="item in IOT_ONLINE_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
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
            <el-button v-hasPermi="['iot:device:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['iot:device:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" :data="deviceList" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="设备编码" prop="deviceCode" min-width="130" />
        <el-table-column label="设备名称" prop="deviceName" min-width="140" />
        <el-table-column label="协议" align="center" width="120">
          <template #default="scope">
            <dict-tag :options="IOT_PROTOCOL_OPTIONS" :value="scope.row.protocol" />
          </template>
        </el-table-column>
        <el-table-column label="主机" prop="host" min-width="130" />
        <el-table-column label="端口" prop="port" width="80" align="center" />
        <el-table-column label="在线" align="center" width="90">
          <template #default="scope">
            <dict-tag :options="IOT_ONLINE_STATUS_OPTIONS" :value="scope.row.onlineStatus" />
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="90">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" align="center" width="280">
          <template #default="scope">
            <el-tooltip content="测试连接" placement="top">
              <el-button
                v-hasPermi="['iot:device:query']"
                link
                type="primary"
                icon="Connection"
                :loading="actionId === scope.row.id && actionType === 'test'"
                @click="handleTest(scope.row)"
              />
            </el-tooltip>
            <el-tooltip content="读取采集" placement="top">
              <el-button
                v-hasPermi="['iot:device:query']"
                link
                type="success"
                icon="Download"
                :loading="actionId === scope.row.id && actionType === 'read'"
                @click="handleRead(scope.row)"
              />
            </el-tooltip>
            <el-button v-hasPermi="['iot:point:list']" link type="primary" icon="Coin" @click="goPoints(scope.row)">点位</el-button>
            <el-button v-hasPermi="['iot:device:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button v-hasPermi="['iot:device:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="780px" destroy-on-close append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="设备编码" prop="deviceCode">
              <el-input v-model="form.deviceCode" :disabled="!!form.id" placeholder="唯一编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备名称" prop="deviceName">
              <el-input v-model="form.deviceName" placeholder="设备名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="协议" prop="protocol">
              <el-select v-model="form.protocol" style="width: 100%">
                <el-option v-for="item in IOT_PROTOCOL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="传输层" prop="transportCode">
              <el-select v-model="form.transportCode" clearable placeholder="可空" style="width: 100%">
                <el-option v-for="item in IOT_TRANSPORT_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主机" prop="host">
              <el-input v-model="form.host" placeholder="IP/主机名/串口" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="端口" prop="port">
              <el-input-number v-model="form.port" :min="1" :max="65535" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="采集频率(ms)" prop="collectInterval">
              <el-input-number v-model="form.collectInterval" :min="100" :step="100" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="超时(ms)" prop="connectTimeout">
              <el-input-number v-model="form.connectTimeout" :min="500" :step="500" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="重连(ms)" prop="reconnectInterval">
              <el-input-number v-model="form.reconnectInterval" :min="1000" :step="1000" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="连接参数JSON" prop="connectionParamsJson">
              <el-input v-model="form.connectionParamsJson" type="textarea" :rows="2" placeholder='如 {"rack":0,"slot":1}' />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="完整连接串" prop="connectionUrl">
              <el-input v-model="form.connectionUrl" placeholder="优先，如 modbus-tcp://192.168.1.1:502 或 s7://10.0.0.1?rack=0&slot=1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="位置" prop="deviceLocation">
              <el-input v-model="form.deviceLocation" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm">确定</el-button>
        <el-button @click="dialog.visible = false">取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="readDialog.visible" :title="readDialog.title" width="860px" destroy-on-close append-to-body>
      <el-empty v-if="!readDialog.rows.length" description="暂无点位数据，请先配置点位" />
      <el-table v-else :data="readDialog.rows" border max-height="480">
        <el-table-column label="点位编码" prop="pointCode" min-width="130" />
        <el-table-column label="名称" prop="pointName" min-width="100" />
        <el-table-column label="实际地址" prop="normalizedAddress" min-width="200" show-overflow-tooltip />
        <el-table-column label="采集值" min-width="120">
          <template #default="scope">
            {{ scope.row.success ? (scope.row.value == null ? '-' : String(scope.row.value)) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="结果" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.success ? 'success' : 'danger'" size="small">
              {{ scope.row.success ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="失败原因" prop="error" min-width="220" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button type="primary" icon="Refresh" :loading="actionType === 'read'" @click="refreshRead">重新采集</el-button>
        <el-button @click="readDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="IotDevice" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs, onMounted } from 'vue';
import { ElFormInstance } from 'element-plus';
import { useRouter } from 'vue-router';
import { listDevice, getDevice, addDevice, updateDevice, delDevice, testDeviceConnection, readDevicePoints, PointReadItem } from '@/api/iot/device';
import { DeviceForm, DeviceQuery, DeviceVO } from '@/api/iot/device/types';
import {
  IOT_PROTOCOL_OPTIONS,
  IOT_TRANSPORT_OPTIONS,
  IOT_ONLINE_STATUS_OPTIONS,
  normalizeProtocolValue
} from '@/views/iot/options';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const router = useRouter();
const { sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_normal_disable'));

const deviceList = ref<DeviceVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const ids = ref<Array<string | number>>([]);
const multiple = ref(true);
const actionId = ref<string | number>();
const actionType = ref<'test' | 'read'>();

const dialog = reactive<DialogOption>({ visible: false, title: '' });
const readDialog = reactive({
  visible: false,
  title: '采集结果',
  deviceId: undefined as string | number | undefined,
  rows: [] as PointReadItem[]
});
const queryFormRef = ref<ElFormInstance>();
const formRef = ref<ElFormInstance>();

const initForm: DeviceForm = {
  deviceCode: undefined,
  deviceName: undefined,
  protocol: 'modbus-tcp',
  transportCode: undefined,
  host: undefined,
  port: 502,
  connectionUrl: undefined,
  connectionParamsJson: undefined,
  collectInterval: 1000,
  connectTimeout: 3000,
  reconnectInterval: 5000,
  deviceLocation: undefined,
  status: '0'
};

const data = reactive<PageData<DeviceForm, DeviceQuery>>({
  form: { ...initForm },
  queryParams: { pageNum: 1, pageSize: 10, deviceCode: undefined, deviceName: undefined, protocol: undefined, onlineStatus: undefined, status: undefined },
  rules: {
    deviceCode: [{ required: true, message: '设备编码不能为空', trigger: 'blur' }],
    deviceName: [{ required: true, message: '设备名称不能为空', trigger: 'blur' }],
    protocol: [{ required: true, message: '协议不能为空', trigger: 'change' }],
    host: [
      {
        validator: (_r, _v, cb) => {
          if (!form.value.host && !form.value.connectionUrl) cb(new Error('主机与连接串不能同时为空'));
          else cb();
        },
        trigger: 'blur'
      }
    ]
  }
});
const { queryParams, form, rules } = toRefs(data);

const getList = async () => {
  loading.value = true;
  try {
    const res = await listDevice(queryParams.value);
    deviceList.value = (res as any).rows ?? [];
    total.value = (res as any).total ?? 0;
  } finally {
    loading.value = false;
  }
};

const handleSelectionChange = (selection: DeviceVO[]) => {
  ids.value = selection.map((i) => i.id);
  multiple.value = !selection.length;
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const reset = () => {
  form.value = { ...initForm };
  formRef.value?.resetFields();
};

const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '新增采集设备';
};

const handleUpdate = async (row: DeviceVO) => {
  reset();
  const res = await getDevice(row.id);
  form.value = res.data;
  dialog.visible = true;
  dialog.title = '修改采集设备';
};

const goPoints = (row: DeviceVO) => {
  router.push({ path: '/iot/point', query: { deviceId: String(row.id), deviceName: row.deviceName } });
};

const handleTest = async (row: DeviceVO) => {
  actionId.value = row.id;
  actionType.value = 'test';
  try {
    const res = await testDeviceConnection(row.id);
    res.data ? proxy?.$modal.msgSuccess('连接成功') : proxy?.$modal.msgError('连接失败');
    await getList();
  } finally {
    actionId.value = undefined;
    actionType.value = undefined;
  }
};

const fillReadRows = (rows: PointReadItem[]) => {
  readDialog.rows = rows || [];
};

const handleRead = async (row: DeviceVO) => {
  actionId.value = row.id;
  actionType.value = 'read';
  try {
    const res = await readDevicePoints(row.id);
    readDialog.deviceId = row.id;
    readDialog.title = `采集结果 - ${row.deviceCode}`;
    fillReadRows((res.data || []) as PointReadItem[]);
    readDialog.visible = true;
    await getList();
  } finally {
    actionId.value = undefined;
    actionType.value = undefined;
  }
};

const refreshRead = async () => {
  if (!readDialog.deviceId) return;
  actionType.value = 'read';
  try {
    const res = await readDevicePoints(readDialog.deviceId);
    fillReadRows((res.data || []) as PointReadItem[]);
    proxy?.$modal.msgSuccess('重新采集完成');
    await getList();
  } finally {
    actionType.value = undefined;
  }
};

const submitForm = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    if (form.value.protocol) form.value.protocol = normalizeProtocolValue(form.value.protocol);
    form.value.id ? await updateDevice(form.value) : await addDevice(form.value);
    proxy?.$modal.msgSuccess('操作成功');
    dialog.visible = false;
    await getList();
  });
};

const handleDelete = async (row?: DeviceVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('确认删除选中设备及其点位？');
  await delDevice(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

onMounted(getList);
</script>
