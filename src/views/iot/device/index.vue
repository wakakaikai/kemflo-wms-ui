<template>
  <div class="p-2 device-page">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover" class="search-card">
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

    <el-card shadow="hover" class="list-card">
      <template #header>
        <div class="list-toolbar">
          <div class="toolbar-left">
            <el-button v-hasPermi="['iot:device:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
            <el-button v-hasPermi="['iot:device:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
            <span class="toolbar-stat">共 {{ total }} 台设备</span>
            <span class="toolbar-stat online">在线 {{ pageOnlineCount }}</span>
            <span class="toolbar-stat offline">离线 {{ pageOfflineCount }}</span>
          </div>
          <div class="toolbar-right">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button value="card">卡片</el-radio-button>
              <el-radio-button value="table">表格</el-radio-button>
            </el-radio-group>
            <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
          </div>
        </div>
      </template>

      <div v-loading="loading">
        <div v-if="viewMode === 'card'" class="device-card-grid">
          <div
            v-for="row in deviceList"
            :key="row.id"
            class="device-card"
            :class="{ online: isOnline(row), selected: isCardSelected(row.id) }"
          >
            <div class="device-card__top">
              <el-checkbox
                :model-value="isCardSelected(row.id)"
                @change="(val: CheckboxValueType) => toggleCardSelect(row, !!val)"
                @click.stop
              />
              <div class="device-avatar" :class="{ online: isOnline(row) }">
                <el-icon><Monitor /></el-icon>
              </div>
              <div class="device-main">
                <div class="device-name" :title="row.deviceName">{{ row.deviceName }}</div>
                <code class="device-code">{{ row.deviceCode }}</code>
              </div>
              <div class="device-status">
                <span class="online-dot" :class="{ on: isOnline(row) }" />
                <dict-tag :options="IOT_ONLINE_STATUS_OPTIONS" :value="row.onlineStatus" />
              </div>
            </div>

            <div class="device-card__meta">
              <div class="meta-row">
                <span class="meta-label">协议</span>
                <el-tag size="small" effect="plain" type="primary">{{ protocolLabel(row.protocol) }}</el-tag>
              </div>
              <div class="meta-row">
                <span class="meta-label">地址</span>
                <span class="meta-value mono" :title="formatEndpoint(row)">{{ formatEndpoint(row) }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">位置</span>
                <span class="meta-value" :title="row.deviceLocation || ''">{{ row.deviceLocation || '—' }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">频率</span>
                <span class="meta-value">{{ row.collectInterval != null ? `${row.collectInterval} ms` : '—' }}</span>
              </div>
            </div>

            <div class="device-card__footer">
              <dict-tag :options="sys_normal_disable" :value="row.status" />
              <div class="device-card__actions">
                <el-tooltip content="测试连接" placement="top" effect="dark" :show-after="200">
                  <el-button
                    v-hasPermi="['iot:device:query']"
                    link
                    type="primary"
                    icon="Connection"
                    :loading="actionId === row.id && actionType === 'test'"
                    @click="handleTest(row)"
                  />
                </el-tooltip>
                <el-tooltip content="读取采集" placement="top" effect="dark" :show-after="200">
                  <el-button
                    v-hasPermi="['iot:device:query']"
                    link
                    type="success"
                    icon="DataLine"
                    :loading="actionId === row.id && actionType === 'read'"
                    @click="handleRead(row)"
                  />
                </el-tooltip>
                <el-tooltip :content="isTcpClientRow(row) ? '命令配置（非 Modbus 寄存器）' : '点位配置'" placement="top" effect="dark" :show-after="200">
                  <el-button v-hasPermi="['iot:point:list']" link type="primary" icon="Coin" @click="goPoints(row)" />
                </el-tooltip>
                <el-tooltip content="编辑设备" placement="top" effect="dark" :show-after="200">
                  <el-button v-hasPermi="['iot:device:edit']" link type="primary" icon="Edit" @click="handleUpdate(row)" />
                </el-tooltip>
                <el-tooltip content="删除设备" placement="top" effect="dark" :show-after="200">
                  <el-button v-hasPermi="['iot:device:remove']" link type="danger" icon="Delete" @click="handleDelete(row)" />
                </el-tooltip>
              </div>
            </div>
          </div>
          <el-empty v-if="!deviceList.length" description="暂无采集设备" />
        </div>

        <el-table
          v-else
          :data="deviceList"
          border
          stripe
          class="device-table"
          @selection-change="handleSelectionChange"
        >
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
          <el-table-column label="操作" fixed="right" align="center" width="200">
            <template #default="scope">
              <div class="device-ops">
                <el-tooltip content="测试连接" placement="top" effect="dark" :show-after="200">
                  <el-button
                    v-hasPermi="['iot:device:query']"
                    link
                    type="primary"
                    icon="Connection"
                    :loading="actionId === scope.row.id && actionType === 'test'"
                    @click="handleTest(scope.row)"
                  />
                </el-tooltip>
                <el-tooltip content="读取采集" placement="top" effect="dark" :show-after="200">
                  <el-button
                    v-hasPermi="['iot:device:query']"
                    link
                    type="success"
                    icon="DataLine"
                    :loading="actionId === scope.row.id && actionType === 'read'"
                    @click="handleRead(scope.row)"
                  />
                </el-tooltip>
                <el-tooltip :content="isTcpClientRow(scope.row) ? '命令配置（非 Modbus 寄存器）' : '点位配置'" placement="top" effect="dark" :show-after="200">
                  <el-button v-hasPermi="['iot:point:list']" link type="primary" icon="Coin" @click="goPoints(scope.row)" />
                </el-tooltip>
                <el-tooltip content="编辑设备" placement="top" effect="dark" :show-after="200">
                  <el-button v-hasPermi="['iot:device:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
                </el-tooltip>
                <el-tooltip content="删除设备" placement="top" effect="dark" :show-after="200">
                  <el-button v-hasPermi="['iot:device:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)" />
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="820px" destroy-on-close append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-alert
          v-if="isTcpClient"
          class="mb-3"
          type="info"
          :closable="false"
          show-icon
          title="TCP Client 模式"
          description="与 Modbus TCP 不同：本模式连接设备 TCP Server，用命令报文交互。保活命令/频率在下方配置；命令点位可选（不是寄存器地址）。连接状态由测试连接或采集结果更新。"
        />
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
              <el-select v-model="form.protocol" style="width: 100%" @change="onProtocolChange">
                <el-option v-for="item in IOT_PROTOCOL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="传输链路" prop="transportCode">
              <el-select
                v-model="form.transportCode"
                :clearable="!isTcpClient"
                :disabled="isTcpClient"
                placeholder="请选择传输链路"
                style="width: 100%"
                @change="onTransportChange"
              >
                <el-option v-for="item in IOT_TRANSPORT_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="isSerialLink ? '串口名' : '主机'" prop="host">
              <el-input v-model="form.host" :placeholder="hostPlaceholder" />
            </el-form-item>
          </el-col>
          <el-col v-if="!isSerialLink" :span="12">
            <el-form-item label="端口" prop="port">
              <el-input-number v-model="form.port" :min="1" :max="65535" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="isTcpClient ? '采集频率(ms)' : '采集频率(ms)'" prop="collectInterval">
              <el-input-number v-model="form.collectInterval" :min="100" :step="100" controls-position="right" style="width: 100%" />
              <div v-if="isTcpClient" class="form-tip">业务命令轮询间隔（有命令点位时）</div>
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

          <template v-if="isTcpClient">
            <el-col :span="24">
              <div class="form-section-title">TCP 保活（按品牌协议填写，与 Modbus 无关）</div>
            </el-col>
            <el-col :span="8">
              <el-form-item label="启用心跳">
                <el-switch v-model="tcpHeartbeat.heartbeatEnable" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="保活频率(ms)">
                <el-input-number
                  v-model="tcpHeartbeat.heartbeatInterval"
                  :min="1000"
                  :step="1000"
                  :disabled="!tcpHeartbeat.heartbeatEnable"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="等待应答">
                <el-switch v-model="tcpHeartbeat.heartbeatWaitReply" :disabled="!tcpHeartbeat.heartbeatEnable" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="保活命令">
                <el-input
                  v-model="tcpHeartbeat.heartbeat"
                  :disabled="!tcpHeartbeat.heartbeatEnable"
                  placeholder='按品牌填写，例 {"Heart":"Ask"} 或 text:PING\r\n 或 hex:FF01...'
                />
                <div class="form-tip">连接后按保活频率发送；每次业务读写前也会先发一次。不填则不发。</div>
              </el-form-item>
            </el-col>
            <el-col v-if="form.id" :span="12">
              <el-form-item label="连接状态">
                <dict-tag :options="IOT_ONLINE_STATUS_OPTIONS" :value="formOnlineStatus" />
                <span v-if="formLastOnlineTime" class="form-tip inline">最近在线 {{ formLastOnlineTime }}</span>
              </el-form-item>
            </el-col>
          </template>

          <el-col :span="24">
            <el-form-item :label="isTcpClient ? '帧参数JSON' : '连接参数JSON'" prop="connectionParamsJson">
              <el-input
                v-model="form.connectionParamsJson"
                type="textarea"
                :rows="isTcpClient || isSerialLink ? 5 : 2"
                :placeholder="connectionParamsPlaceholder"
              />
              <div v-if="isTcpClient" class="form-tip">编码/拆包等高级参数；保活请用上方表单，提交时自动写入 JSON。</div>
            </el-form-item>
          </el-col>
          <el-col v-if="!isTcpClient" :span="24">
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

    <IotReadCollectDialog
      v-model:visible="readDialog.visible"
      :title="readDialog.title"
      :rows="readDialog.rows"
      :refreshing="actionType === 'read'"
      @refresh="refreshRead"
    />
  </div>
</template>

<script setup name="IotDevice" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, computed, reactive, ref, toRefs, onMounted } from 'vue';
import type { CheckboxValueType, ElFormInstance } from 'element-plus';
import { Monitor } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { listDevice, getDevice, addDevice, updateDevice, delDevice, testDeviceConnection, readDevicePoints, PointReadItem } from '@/api/iot/device';
import { DeviceForm, DeviceQuery, DeviceVO } from '@/api/iot/device/types';
import {
  IOT_PROTOCOL_OPTIONS,
  IOT_TRANSPORT_OPTIONS,
  IOT_ONLINE_STATUS_OPTIONS,
  IOT_TCP_CLIENT_PARAMS_EXAMPLE,
  IOT_SERIAL_PARAMS_EXAMPLE,
  normalizeProtocolValue,
  normalizeTransportValue,
  isTcpTransport,
  isSerialTransport,
  isTcpClientProtocol,
  createDefaultTcpHeartbeat,
  parseTcpHeartbeat,
  mergeTcpHeartbeat,
  type TcpClientHeartbeatForm
} from '@/views/iot/options';
import IotReadCollectDialog from '@/views/iot/components/IotReadCollectDialog.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const router = useRouter();
const { sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_normal_disable'));

const deviceList = ref<DeviceVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const viewMode = ref<'card' | 'table'>('card');
const total = ref(0);
const ids = ref<Array<string | number>>([]);
const multiple = ref(true);
const actionId = ref<string | number>();
const actionType = ref<'test' | 'read'>();
const tcpHeartbeat = reactive<TcpClientHeartbeatForm>(createDefaultTcpHeartbeat());
const formOnlineStatus = ref<string>('0');
const formLastOnlineTime = ref<string>('');

const dialog = reactive<DialogOption>({ visible: false, title: '' });
const readDialog = reactive({
  visible: false,
  title: '采集结果',
  deviceId: undefined as string | number | undefined,
  rows: [] as PointReadItem[]
});
const pageOnlineCount = computed(() => deviceList.value.filter((d) => isOnline(d)).length);
const pageOfflineCount = computed(() => deviceList.value.length - pageOnlineCount.value);

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

const isOnline = (row: DeviceVO) => String(row.onlineStatus) === '1';

const protocolLabel = (protocol?: string) =>
  IOT_PROTOCOL_OPTIONS.find((item) => item.value === protocol)?.label || protocol || '—';

const isTcpClientRow = (row: DeviceVO) => isTcpClientProtocol(row.protocol, row.transportCode);

const isTcpClient = computed(() => isTcpClientProtocol(form.value.protocol, form.value.transportCode));
const isSerialLink = computed(() => isSerialTransport(form.value.transportCode));
const hostPlaceholder = computed(() => {
  if (isSerialLink.value) return '如 COM3 或 /dev/ttyUSB0';
  if (isTcpClient.value) return '设备 TCP Server IP';
  return 'IP/主机名';
});
const connectionParamsPlaceholder = computed(() => {
  if (isSerialLink.value) {
    return form.value.transportCode === 'SERIAL_RS485'
      ? IOT_SERIAL_PARAMS_EXAMPLE.replace('"rs485": false', '"rs485": true')
      : IOT_SERIAL_PARAMS_EXAMPLE;
  }
  if (isTcpClient.value) return IOT_TCP_CLIENT_PARAMS_EXAMPLE;
  return '如 {"unit-identifier":1}；点位字节序/显示格式请在点位中配置';
});

const syncTcpHeartbeatFromForm = () => {
  Object.assign(tcpHeartbeat, parseTcpHeartbeat(form.value.connectionParamsJson));
};

const applyTcpHeartbeatToForm = () => {
  if (!isTcpClient.value) return;
  form.value.connectionParamsJson = mergeTcpHeartbeat(form.value.connectionParamsJson, tcpHeartbeat);
};

const onProtocolChange = (value?: string) => {
  const protocol = normalizeProtocolValue(value);
  form.value.protocol = protocol;
  if (protocol === 'tcp-client') {
    form.value.transportCode = 'TCP_CLIENT';
    form.value.connectionUrl = undefined;
    if (!form.value.port) form.value.port = 9000;
    if (!form.value.connectionParamsJson) {
      form.value.connectionParamsJson = IOT_TCP_CLIENT_PARAMS_EXAMPLE;
    }
    syncTcpHeartbeatFromForm();
  } else if (protocol === 'modbus-rtu' && !form.value.transportCode) {
    form.value.transportCode = 'SERIAL_RS485';
    if (!form.value.connectionParamsJson) {
      form.value.connectionParamsJson = IOT_SERIAL_PARAMS_EXAMPLE.replace('"rs485": false', '"rs485": true');
    }
  } else if (protocol === 'modbus-tcp') {
    if (isTcpTransport(form.value.transportCode)) {
      form.value.transportCode = undefined;
    }
    if (!form.value.port) form.value.port = 502;
  }
};

const onTransportChange = (value?: string) => {
  const transport = normalizeTransportValue(value);
  form.value.transportCode = transport || undefined;
  if (isTcpTransport(transport)) {
    if (normalizeProtocolValue(form.value.protocol) !== 'tcp-client' && !form.value.protocol) {
      form.value.protocol = 'tcp-client';
    }
    form.value.connectionUrl = undefined;
    if (!form.value.port) form.value.port = 9000;
    if (!form.value.connectionParamsJson) {
      form.value.connectionParamsJson = IOT_TCP_CLIENT_PARAMS_EXAMPLE;
    }
    syncTcpHeartbeatFromForm();
  } else if (isSerialTransport(transport)) {
    form.value.port = undefined;
    form.value.connectionUrl = undefined;
    if (!form.value.connectionParamsJson) {
      form.value.connectionParamsJson =
        transport === 'SERIAL_RS485'
          ? IOT_SERIAL_PARAMS_EXAMPLE.replace('"rs485": false', '"rs485": true')
          : IOT_SERIAL_PARAMS_EXAMPLE;
    }
  }
};

const formatEndpoint = (row: DeviceVO) => {
  if (row.host && row.port) return `${row.host}:${row.port}`;
  if (row.host) return row.host;
  if (row.connectionUrl) return row.connectionUrl;
  return '—';
};

const isCardSelected = (id: string | number) => ids.value.includes(id);

const toggleCardSelect = (row: DeviceVO, checked: boolean) => {
  if (checked) {
    if (!ids.value.includes(row.id)) ids.value = [...ids.value, row.id];
  } else {
    ids.value = ids.value.filter((id) => id !== row.id);
  }
  multiple.value = !ids.value.length;
};

const getList = async () => {
  loading.value = true;
  try {
    const res = await listDevice(queryParams.value);
    deviceList.value = (res as any).rows ?? [];
    total.value = (res as any).total ?? 0;
    ids.value = [];
    multiple.value = true;
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
  Object.assign(tcpHeartbeat, createDefaultTcpHeartbeat());
  formOnlineStatus.value = '0';
  formLastOnlineTime.value = '';
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
  if (form.value.protocol) form.value.protocol = normalizeProtocolValue(form.value.protocol);
  if (form.value.transportCode) form.value.transportCode = normalizeTransportValue(form.value.transportCode);
  formOnlineStatus.value = String(res.data?.onlineStatus ?? '0');
  formLastOnlineTime.value = res.data?.lastOnlineTime || '';
  syncTcpHeartbeatFromForm();
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
    if (form.value.transportCode) form.value.transportCode = normalizeTransportValue(form.value.transportCode);
    if (isTcpClient.value) {
      if (tcpHeartbeat.heartbeatEnable && !tcpHeartbeat.heartbeat?.trim()) {
        proxy?.$modal.msgError('已启用心跳，请填写保活命令');
        return;
      }
      applyTcpHeartbeatToForm();
      form.value.transportCode = 'TCP_CLIENT';
      form.value.connectionUrl = undefined;
    }
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

<style scoped lang="scss">
.device-page {
  .form-section-title {
    margin: 4px 0 12px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    background: var(--el-fill-color-light);
    border-radius: 6px;
  }

  .form-tip {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--el-text-color-secondary);

    &.inline {
      margin-top: 0;
      margin-left: 8px;
    }
  }

  .search-card {
    :deep(.el-card__body) {
      padding-bottom: 2px;
    }
  }

  .list-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .toolbar-stat {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 12px;
    line-height: 20px;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);

    &.online {
      color: var(--el-color-success);
      background: var(--el-color-success-light-9);
      border-color: var(--el-color-success-light-7);
    }

    &.offline {
      color: var(--el-text-color-secondary);
      background: var(--el-fill-color);
    }
  }
}

.device-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
  min-height: 140px;
}

.device-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 210px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
  }

  &.online {
    background: linear-gradient(180deg, var(--el-color-success-light-9) 0%, var(--el-bg-color) 48%);
  }

  &.selected {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
  }

  &__top {
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    align-items: center;
    gap: 10px;
  }

  &__meta {
    display: grid;
    gap: 10px;
    flex: 1;
    padding: 12px 14px;
    border-radius: 10px;
    background: var(--el-fill-color-lighter);
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: auto;
  }

  &__actions {
    display: inline-flex;
    align-items: center;
    gap: 2px;

    :deep(.el-button.is-link) {
      padding: 6px;
    }

    :deep(.el-icon) {
      font-size: 16px;
    }
  }
}

.device-avatar {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  font-size: 20px;

  &.online {
    color: var(--el-color-success);
    background: var(--el-color-success-light-8);
  }
}

.device-main {
  min-width: 0;
}

.device-name {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.device-code {
  display: inline-block;
  margin-top: 4px;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.device-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);

  &.on {
    background: var(--el-color-success);
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.55);
    animation: pulse-online 1.6s ease-out infinite;
  }
}

@keyframes pulse-online {
  0% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.45);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(103, 194, 58, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0);
  }
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.meta-label {
  flex: 0 0 36px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.meta-value {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 12px;
  }
}

.device-ops {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 2px;
}

.device-table {
  :deep(.el-table__header th) {
    background: var(--el-fill-color-light);
  }
}
</style>

