<template>
  <div class="p-2" v-loading="pageLoading">
    <el-card shadow="never" class="mb-[10px]">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <el-button icon="Back" @click="goBack">返回</el-button>
            <span class="text-base font-medium">{{ device?.deviceCode }} - {{ device?.deviceName }}</span>
            <dict-tag v-if="device" :options="sc_collect_protocol" :value="device.protocolCode" />
            <dict-tag v-if="device" :options="scCollectStatusOptions" :value="device.status" />
          </div>
          <div class="flex items-center gap-2">
            <el-button type="primary" plain icon="Connection" @click="handleTest" v-hasPermi="['wms:scCollectDevice:query']">测试连接</el-button>
            <el-button type="success" plain icon="Edit" @click="handleEditDevice" v-hasPermi="['wms:scCollectDevice:edit']">编辑设备</el-button>
          </div>
        </div>
      </template>

      <el-descriptions v-if="device" :column="4" border>
        <el-descriptions-item label="设备编码">{{ device.deviceCode }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ device.deviceName }}</el-descriptions-item>
        <el-descriptions-item label="主机">{{ device.host || '-' }}</el-descriptions-item>
        <el-descriptions-item label="端口">{{ device.port ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="采集频率">{{ device.collectInterval ?? '-' }} ms</el-descriptions-item>
        <el-descriptions-item label="连接超时">{{ device.connectTimeout ?? '-' }} ms</el-descriptions-item>
        <el-descriptions-item label="重连间隔">{{ device.reconnectInterval ?? '-' }} ms</el-descriptions-item>
        <el-descriptions-item label="传输层">{{ device.transportCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="连接串" :span="2">{{ device.connectionUrl || '-' }}</el-descriptions-item>
        <el-descriptions-item label="连接参数" :span="2">{{ device.connectionParams || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="4">{{ device.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="采集参数" name="param">
          <DeviceParamPanel v-if="deviceId" ref="paramPanelRef" :device-id="deviceId" @changed="onParamChanged" />
        </el-tab-pane>
        <el-tab-pane label="结果映射" name="mapping">
          <DeviceMappingPanel v-if="deviceId" ref="mappingPanelRef" :device-id="deviceId" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog title="修改采集设备" v-model="deviceDialog.visible" width="760px" append-to-body>
      <el-form ref="deviceFormRef" :model="deviceForm" :rules="deviceRules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备编码" prop="deviceCode">
              <el-input v-model="deviceForm.deviceCode" placeholder="请输入设备编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备名称" prop="deviceName">
              <el-input v-model="deviceForm.deviceName" placeholder="请输入设备名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="协议" prop="protocolCode">
              <el-select v-model="deviceForm.protocolCode" placeholder="PLC4X协议编码" class="w-full">
                <el-option v-for="dict in sc_collect_protocol" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="传输层" prop="transportCode">
              <el-input v-model="deviceForm.transportCode" placeholder="tcp/udp/serial，可空" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主机" prop="host">
              <el-input v-model="deviceForm.host" placeholder="IP/主机名/串口名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="端口" prop="port">
              <el-input-number v-model="deviceForm.port" :min="1" :max="65535" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="采集频率(ms)" prop="collectInterval">
              <el-input-number v-model="deviceForm.collectInterval" :min="100" :step="100" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="连接超时(ms)" prop="connectTimeout">
              <el-input-number v-model="deviceForm.connectTimeout" :min="500" :step="500" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重连间隔(ms)" prop="reconnectInterval">
              <el-input-number v-model="deviceForm.reconnectInterval" :min="1000" :step="1000" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="deviceForm.status">
                <el-radio v-for="dict in scCollectStatusOptions" :key="dict.value" :value="Number(dict.value)">{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="连接参数JSON" prop="connectionParams">
              <el-input v-model="deviceForm.connectionParams" type="textarea" :rows="2" placeholder='如 {"rack":0,"slot":1}' />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="完整连接串" prop="connectionUrl">
              <el-input v-model="deviceForm.connectionUrl" placeholder="优先使用，如 s7://10.0.0.1?rack=0&slot=1" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="deviceForm.remark" type="textarea" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitDeviceForm">确 定</el-button>
          <el-button @click="deviceDialog.visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ScCollectDeviceDetail" lang="ts">
import { getScCollectDevice, updateScCollectDevice, testScCollectDeviceConnection } from '@/api/wms/dataCollection/device';
import { ScCollectDeviceVO, ScCollectDeviceForm } from '@/api/wms/dataCollection/device/types';
import DeviceParamPanel from './components/DeviceParamPanel.vue';
import DeviceMappingPanel from './components/DeviceMappingPanel.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const { sc_collect_protocol } = toRefs<any>(proxy?.useDict('sc_collect_protocol'));

const scCollectStatusOptions = [
  { label: '启用', value: '1', elTagType: 'success' },
  { label: '停用', value: '0', elTagType: 'danger' }
];

const deviceId = computed(() => route.params.deviceId as string);
const device = ref<ScCollectDeviceVO>();
const pageLoading = ref(false);
const buttonLoading = ref(false);
const activeTab = ref((route.query.tab as string) || 'param');
const paramPanelRef = ref<InstanceType<typeof DeviceParamPanel>>();
const mappingPanelRef = ref<InstanceType<typeof DeviceMappingPanel>>();
const deviceFormRef = ref<ElFormInstance>();
const deviceDialog = reactive<DialogOption>({ visible: false, title: '' });
const deviceForm = ref<ScCollectDeviceForm>({});
const deviceRules = {
  deviceCode: [{ required: true, message: '设备编码不能为空', trigger: 'blur' }],
  deviceName: [{ required: true, message: '设备名称不能为空', trigger: 'blur' }],
  protocolCode: [{ required: true, message: '协议不能为空', trigger: 'change' }]
};

const loadDevice = async () => {
  if (!deviceId.value) return;
  pageLoading.value = true;
  try {
    const res = await getScCollectDevice(deviceId.value);
    device.value = res.data;
  } finally {
    pageLoading.value = false;
  }
};

const goBack = () => {
  proxy?.$tab.closeOpenPage({ path: '/dataCollection/device' });
};

const handleTest = async () => {
  await testScCollectDeviceConnection(deviceId.value);
  proxy?.$modal.msgSuccess('连接成功');
};

const handleEditDevice = () => {
  deviceForm.value = { ...device.value };
  deviceDialog.visible = true;
};

const submitDeviceForm = () => {
  deviceFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    buttonLoading.value = true;
    try {
      await updateScCollectDevice(deviceForm.value);
      proxy?.$modal.msgSuccess('操作成功');
      deviceDialog.visible = false;
      await loadDevice();
    } finally {
      buttonLoading.value = false;
    }
  });
};

const onParamChanged = () => {
  mappingPanelRef.value?.loadParamOptions?.();
};

watch(
  () => route.query.tab,
  (tab) => {
    if (tab === 'param' || tab === 'mapping') {
      activeTab.value = tab;
    }
  }
);

onMounted(() => {
  loadDevice();
});
</script>
