<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="设备编码" prop="deviceCode">
              <el-input v-model="queryParams.deviceCode" placeholder="请输入设备编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="设备名称" prop="deviceName">
              <el-input v-model="queryParams.deviceName" placeholder="请输入设备名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="协议" prop="protocolCode">
              <el-select v-model="queryParams.protocolCode" placeholder="请选择协议" clearable>
                <el-option v-for="dict in sc_collect_protocol" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="主机" prop="host">
              <el-input v-model="queryParams.host" placeholder="IP/主机名" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
                <el-option v-for="dict in scCollectStatusOptions" :key="dict.value" :label="dict.label" :value="Number(dict.value)" />
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

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:scCollectDevice:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:scCollectDevice:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:scCollectDevice:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:scCollectDevice:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="deviceList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="设备编码" align="center" prop="deviceCode" min-width="110">
          <template #default="scope">
            <el-button link type="primary" @click="goDetail(scope.row)">{{ scope.row.deviceCode }}</el-button>
          </template>
        </el-table-column>
        <el-table-column label="设备名称" align="center" prop="deviceName" min-width="120" />
        <el-table-column label="协议" align="center" prop="protocolCode" width="120">
          <template #default="scope">
            <dict-tag :options="sc_collect_protocol" :value="scope.row.protocolCode" />
          </template>
        </el-table-column>
        <el-table-column label="主机" align="center" prop="host" min-width="120" />
        <el-table-column label="端口" align="center" prop="port" width="80" />
        <el-table-column label="采集频率(ms)" align="center" prop="collectInterval" width="110" />
        <el-table-column label="状态" align="center" prop="status" width="80">
          <template #default="scope">
            <dict-tag :options="scCollectStatusOptions" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="参数配置" placement="top">
              <el-button link type="primary" icon="Setting" @click="goDetail(scope.row)" v-hasPermi="['wms:scCollectDevice:query']"></el-button>
            </el-tooltip>
            <el-tooltip content="测试连接" placement="top">
              <el-button link type="primary" icon="Connection" @click="handleTest(scope.row)" v-hasPermi="['wms:scCollectDevice:query']"></el-button>
            </el-tooltip>
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:scCollectDevice:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:scCollectDevice:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <el-dialog :title="dialog.title" v-model="dialog.visible" width="760px" append-to-body>
      <el-form ref="deviceFormRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备编码" prop="deviceCode">
              <el-input v-model="form.deviceCode" placeholder="请输入设备编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备名称" prop="deviceName">
              <el-input v-model="form.deviceName" placeholder="请输入设备名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="协议" prop="protocolCode">
              <el-select v-model="form.protocolCode" placeholder="PLC4X协议编码" class="w-full">
                <el-option v-for="dict in sc_collect_protocol" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="传输层" prop="transportCode">
              <el-input v-model="form.transportCode" placeholder="tcp/udp/serial，可空" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主机" prop="host">
              <el-input v-model="form.host" placeholder="IP/主机名/串口名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="端口" prop="port">
              <el-input-number v-model="form.port" :min="1" :max="65535" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="采集频率(ms)" prop="collectInterval">
              <el-input-number v-model="form.collectInterval" :min="100" :step="100" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="连接超时(ms)" prop="connectTimeout">
              <el-input-number v-model="form.connectTimeout" :min="500" :step="500" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重连间隔(ms)" prop="reconnectInterval">
              <el-input-number v-model="form.reconnectInterval" :min="1000" :step="1000" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in scCollectStatusOptions" :key="dict.value" :value="Number(dict.value)">{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="连接参数JSON" prop="connectionParams">
              <el-input v-model="form.connectionParams" type="textarea" :rows="2" placeholder='如 {"rack":0,"slot":1}' />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="完整连接串" prop="connectionUrl">
              <el-input v-model="form.connectionUrl" placeholder="优先使用，如 s7://10.0.0.1?rack=0&slot=1" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ScCollectDevice" lang="ts">
import { listScCollectDevice, getScCollectDevice, delScCollectDevice, addScCollectDevice, updateScCollectDevice, testScCollectDeviceConnection } from '@/api/wms/dataCollection/device';
import { ScCollectDeviceVO, ScCollectDeviceQuery, ScCollectDeviceForm } from '@/api/wms/dataCollection/device/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sc_collect_protocol } = toRefs<any>(proxy?.useDict('sc_collect_protocol'));

/** 状态：0-停用 1-启用（与后端一致，勿用 sys_normal_disable） */
const scCollectStatusOptions = [
  { label: '启用', value: '1', elTagType: 'success' },
  { label: '停用', value: '0', elTagType: 'danger' }
];

const deviceList = ref<ScCollectDeviceVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const deviceFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({ visible: false, title: '' });

const initFormData: ScCollectDeviceForm = {
  id: undefined,
  deviceCode: undefined,
  deviceName: undefined,
  protocolCode: 'modbus-tcp',
  transportCode: undefined,
  host: undefined,
  port: 502,
  connectionParams: undefined,
  connectionUrl: undefined,
  collectInterval: 1000,
  connectTimeout: 3000,
  reconnectInterval: 5000,
  status: 1,
  remark: undefined
};

const data = reactive<PageData<ScCollectDeviceForm, ScCollectDeviceQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deviceCode: undefined,
    deviceName: undefined,
    protocolCode: undefined,
    host: undefined,
    status: undefined,
    params: {}
  },
  rules: {
    deviceCode: [{ required: true, message: '设备编码不能为空', trigger: 'blur' }],
    deviceName: [{ required: true, message: '设备名称不能为空', trigger: 'blur' }],
    protocolCode: [{ required: true, message: '协议不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const getList = async () => {
  loading.value = true;
  const res = await listScCollectDevice(queryParams.value);
  deviceList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = { ...initFormData };
  deviceFormRef.value?.resetFields();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: ScCollectDeviceVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加采集设备';
};

const handleUpdate = async (row?: ScCollectDeviceVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getScCollectDevice(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改采集设备';
};

const submitForm = () => {
  deviceFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateScCollectDevice(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addScCollectDevice(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

const handleDelete = async (row?: ScCollectDeviceVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除选中的采集设备？');
  await delScCollectDevice(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

const handleTest = async (row: ScCollectDeviceVO) => {
  await testScCollectDeviceConnection(row.id);
  proxy?.$modal.msgSuccess('连接成功');
};

const router = useRouter();
const goDetail = (row: ScCollectDeviceVO) => {
  router.push({
    name: 'ScCollectDeviceDetail',
    params: { deviceId: row.id }
  });
};

const handleExport = () => {
  proxy?.download('wms/dataCollection/device/export', { ...queryParams.value }, `scCollectDevice_${new Date().getTime()}.xlsx`);
};

onMounted(() => {
  getList();
});
</script>
