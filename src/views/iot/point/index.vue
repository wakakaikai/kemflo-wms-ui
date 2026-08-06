<template>
  <div class="p-2 point-page">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover" class="search-card">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item v-if="!routeDeviceId" label="设备" prop="deviceId">
              <el-select
                v-model="queryParams.deviceId"
                clearable
                filterable
                placeholder="全部设备"
                style="width: 200px"
                @change="handleQuery"
              >
                <el-option
                  v-for="item in deviceOptions"
                  :key="toIdStr(item.id)"
                  :label="item.deviceName"
                  :value="toIdStr(item.id)"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="点位编码" prop="pointCode">
              <el-input v-model="queryParams.pointCode" placeholder="点位编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="点位名称" prop="pointName">
              <el-input v-model="queryParams.pointName" placeholder="点位名称" clearable @keyup.enter="handleQuery" />
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
        <div class="list-header">
          <div class="list-header__left">
            <el-button
              v-if="routeDeviceId"
              class="back-btn"
              type="primary"
              link
              icon="ArrowLeft"
              @click="router.push('/iot/device')"
            >
              返回设备
            </el-button>
            <div class="list-title">
              <el-icon class="list-title__icon"><Coin /></el-icon>
              <span>{{ isTcpClientDevice ? '命令配置' : '采集点位' }}</span>
            </div>
            <el-tag v-if="headerDeviceName" type="primary" effect="plain" round class="device-chip">
              {{ headerDeviceName }}
            </el-tag>
            <el-tag v-if="protocolLabel" effect="plain" round>
              {{ protocolLabel }}
            </el-tag>
            <div class="stat-chips">
              <span class="stat-chip">共 {{ total }} 个</span>
              <span class="stat-chip good">良好 {{ qualityStats.good }}</span>
              <span class="stat-chip warn">不确定 {{ qualityStats.uncertain }}</span>
              <span class="stat-chip bad">不良 {{ qualityStats.bad }}</span>
            </div>
          </div>
          <div class="list-header__right">
            <el-tooltip :disabled="!!currentDeviceId" content="请先选择设备后再采集" placement="top" effect="dark">
              <span>
                <el-button
                  v-hasPermi="['iot:device:query']"
                  type="success"
                  plain
                  icon="DataLine"
                  :loading="reading"
                  :disabled="!currentDeviceId"
                  @click="handleRead"
                >
                  读取采集
                </el-button>
              </span>
            </el-tooltip>
            <el-button v-hasPermi="['iot:point:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
            <el-button v-hasPermi="['iot:point:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">
              删除
            </el-button>
            <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="pointList"
        border
        stripe
        class="point-table"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column v-if="!routeDeviceId" label="设备" min-width="140" show-overflow-tooltip>
          <template #default="scope">
            {{ resolveDeviceName(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column label="点位编码" prop="pointCode" min-width="130">
          <template #default="scope">
            <code class="code-text">{{ scope.row.pointCode }}</code>
          </template>
        </el-table-column>
        <el-table-column label="点位名称" prop="pointName" min-width="120" show-overflow-tooltip />
        <el-table-column label="点位地址" prop="tagAddress" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <code class="addr-text">{{ scope.row.tagAddress }}</code>
          </template>
        </el-table-column>
        <el-table-column label="类型" align="center" width="90">
          <template #default="scope">
            <el-tag size="small" effect="plain" :type="dataTypeTag(scope.row.dataType)">
              {{ dataTypeLabel(scope.row.dataType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="读写" align="center" width="88">
          <template #default="scope">
            <el-tag size="small" effect="light" :type="rwModeTag(scope.row.rwMode)" round>
              {{ rwModeLabel(scope.row.rwMode) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前值" min-width="130">
          <template #default="scope">
            <div class="value-cell">
              <span class="value-text" :class="{ empty: isEmptyValue(scope.row.currentValue) }">
                {{ formatValue(scope.row.currentValue) }}
              </span>
              <span v-if="scope.row.unit" class="unit-text">{{ scope.row.unit }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="质量" align="center" width="100">
          <template #default="scope">
            <el-tag size="small" effect="light" round :type="qualityTag(scope.row.quality)">
              {{ qualityLabel(scope.row.quality) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="采集时间" align="center" width="170">
          <template #default="scope">
            <span class="time-text">{{ proxy?.parseTime(scope.row.collectTime) || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="150" align="center">
          <template #default="scope">
            <div class="point-ops">
              <el-button v-hasPermi="['iot:point:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
              <el-button v-hasPermi="['iot:point:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <IotReadCollectDialog
      v-model:visible="readDialog.visible"
      :title="readDialog.title"
      :rows="readDialog.rows"
      :refreshing="reading"
      :empty-text="isTcpClientDevice ? '暂无命令数据，请先配置命令点位或直接在设备页采集' : '暂无点位数据，请先配置点位'"
      @refresh="handleRead"
    />

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="720px" destroy-on-close append-to-body class="point-dialog">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-alert
          v-if="isTcpClientDevice"
          class="mb-3"
          type="warning"
          :closable="false"
          show-icon
          title="TCP Client 命令点位"
          description="此处配置业务命令报文，不是 Modbus 寄存器。保活命令请在「设备」编辑页的 TCP 保活中设置。"
        />
        <div class="form-section">
          <div class="form-section__title">基础信息</div>
          <el-row :gutter="16">
            <el-col v-if="!routeDeviceId" :span="24">
              <el-form-item label="设备" prop="deviceId">
                <el-select v-model="form.deviceId" filterable placeholder="请选择设备" style="width: 100%" @change="onDeviceChange">
                  <el-option
                    v-for="item in deviceOptions"
                    :key="toIdStr(item.id)"
                    :label="item.deviceName"
                    :value="toIdStr(item.id)"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="点位编码" prop="pointCode">
                <el-input v-model="form.pointCode" placeholder="如 temperature" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="点位名称" prop="pointName">
                <el-input v-model="form.pointName" placeholder="点位名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="数据类型" prop="dataType">
                <el-select v-model="form.dataType" style="width: 100%" @change="onDataTypeChange">
                  <el-option v-for="item in IOT_DATA_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="读写" prop="rwMode">
                <el-select v-model="form.rwMode" style="width: 100%">
                  <el-option v-for="item in IOT_READ_WRITE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col v-if="protocolGroup !== 'other'" :span="24">
              <el-form-item label="地址生成">
                <div class="addr-builder">
                  <div class="addr-builder__toolbar">
                    <el-tag size="small" effect="plain" type="info">{{ protocolLabel }}</el-tag>
                    <el-switch v-model="addrAutoGenerate" inline-prompt active-text="自动" inactive-text="手动" />
                    <el-button size="small" type="primary" plain icon="MagicStick" @click="applyGeneratedAddress">生成地址</el-button>
                  </div>

                  <el-row v-if="protocolGroup === 'tcp'" :gutter="12">
                    <el-col :span="24">
                      <div class="addr-field">
                        <span class="addr-field__label">请求命令</span>
                        <el-input
                          v-model="addrBuilder.tcpRequest"
                          :disabled="!addrAutoGenerate"
                          placeholder="text:STATUS? 或 hex:01 03 00 00 00 01（非 holding-register）"
                          @input="syncGeneratedAddress"
                        />
                      </div>
                    </el-col>
                  </el-row>

                  <el-row v-else :gutter="12">
                    <el-col :span="protocolGroup === 'modbus' ? 14 : 10">
                      <div class="addr-field">
                        <span class="addr-field__label">区类型</span>
                        <el-select v-model="addrBuilder.area" style="width: 100%" :disabled="!addrAutoGenerate" @change="syncGeneratedAddress">
                          <el-option
                            v-for="item in addressAreaOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                          />
                        </el-select>
                      </div>
                    </el-col>

                    <el-col v-if="protocolGroup === 'modbus'" :span="10">
                      <div class="addr-field">
                        <span class="addr-field__label">寄存器号</span>
                        <el-input-number
                          v-model="addrBuilder.address"
                          :min="0"
                          :step="1"
                          controls-position="right"
                          style="width: 100%"
                          :disabled="!addrAutoGenerate"
                          @change="syncGeneratedAddress"
                        />
                      </div>
                    </el-col>

                    <el-col v-if="protocolGroup === 's7' && addrBuilder.area === 'DB'" :span="7">
                      <div class="addr-field">
                        <span class="addr-field__label">DB 号</span>
                        <el-input-number
                          v-model="addrBuilder.dbNumber"
                          :min="1"
                          :step="1"
                          controls-position="right"
                          style="width: 100%"
                          :disabled="!addrAutoGenerate"
                          @change="syncGeneratedAddress"
                        />
                      </div>
                    </el-col>

                    <el-col v-if="protocolGroup === 's7'" :span="7">
                      <div class="addr-field">
                        <span class="addr-field__label">字节偏移</span>
                        <el-input-number
                          v-model="addrBuilder.byteOffset"
                          :min="0"
                          :step="1"
                          controls-position="right"
                          style="width: 100%"
                          :disabled="!addrAutoGenerate"
                          @change="syncGeneratedAddress"
                        />
                      </div>
                    </el-col>

                    <el-col v-if="protocolGroup === 's7' && form.dataType === 'BOOL'" :span="7">
                      <div class="addr-field">
                        <span class="addr-field__label">位偏移</span>
                        <el-input-number
                          v-model="addrBuilder.bitOffset"
                          :min="0"
                          :max="7"
                          :step="1"
                          controls-position="right"
                          style="width: 100%"
                          :disabled="!addrAutoGenerate"
                          @change="syncGeneratedAddress"
                        />
                      </div>
                    </el-col>

                    <el-col v-if="form.dataType === 'STRING'" :span="protocolGroup === 'modbus' ? 10 : 7">
                      <div class="addr-field">
                        <span class="addr-field__label">字符串长度</span>
                        <el-input-number
                          v-model="addrBuilder.stringLength"
                          :min="1"
                          :max="254"
                          :step="1"
                          controls-position="right"
                          style="width: 100%"
                          :disabled="!addrAutoGenerate"
                          @change="syncGeneratedAddress"
                        />
                      </div>
                    </el-col>
                  </el-row>

                  <div class="addr-preview">
                    预览：<code>{{ generatedAddress || '请完善地址参数' }}</code>
                  </div>
                </div>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item :label="isTcpClientDevice ? '命令内容' : '点位地址'" prop="tagAddress">
                <el-input
                  v-model="form.tagAddress"
                  :placeholder="addressPlaceholder"
                  :readonly="addrAutoGenerate && protocolGroup !== 'other'"
                  @input="onTagAddressManualInput"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section">
          <div class="form-section__title">换算与展示</div>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="缩放" prop="scaleFactor">
                <el-input-number v-model="form.scaleFactor" :step="0.1" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="偏移" prop="offsetValue">
                <el-input-number v-model="form.offsetValue" :step="0.1" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="单位" prop="unit">
                <el-input v-model="form.unit" placeholder="如 ℃、kPa、%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="排序" prop="sortOrder">
                <el-input-number v-model="form.sortOrder" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm">确定</el-button>
        <el-button @click="dialog.visible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="IotPoint" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs, computed, onMounted, onActivated, watch } from 'vue';
import type { ElFormInstance } from 'element-plus';
import { Coin } from '@element-plus/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import { listPoint, getPoint, addPoint, updatePoint, delPoint } from '@/api/iot/point';
import { PointForm, PointQuery, PointVO } from '@/api/iot/point/types';
import { listDevice, getDevice, readDevicePoints, PointReadItem } from '@/api/iot/device';
import { DeviceVO } from '@/api/iot/device/types';
import {
  IOT_DATA_TYPE_OPTIONS,
  IOT_READ_WRITE_OPTIONS,
  IOT_QUALITY_OPTIONS,
  IOT_PROTOCOL_OPTIONS,
  IOT_MODBUS_AREA_OPTIONS,
  IOT_S7_AREA_OPTIONS,
  buildPlcTagAddress,
  createDefaultAddressBuilder,
  getProtocolGroup,
  normalizeProtocolValue,
  parsePlcTagAddress
} from '@/views/iot/options';
import type { IotAddressBuilder } from '@/views/iot/options';
import IotReadCollectDialog from '@/views/iot/components/IotReadCollectDialog.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();

const routeDeviceId = computed(() => route.query.deviceId as string | undefined);
const headerDeviceName = computed(() => (route.query.deviceName as string) || '');

const pointList = ref<PointVO[]>([]);
const deviceOptions = ref<DeviceVO[]>([]);
const loading = ref(true);
const reading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const ids = ref<Array<string | number>>([]);
const multiple = ref(true);
const selectedProtocol = ref('');
const addrAutoGenerate = ref(true);
const addrBuilder = reactive<IotAddressBuilder>(createDefaultAddressBuilder('modbus-tcp', 'FLOAT'));

const dialog = reactive<DialogOption>({ visible: false, title: '' });
const readDialog = reactive({
  visible: false,
  title: '采集结果',
  rows: [] as PointReadItem[]
});
const queryFormRef = ref<ElFormInstance>();
const formRef = ref<ElFormInstance>();

const protocolGroup = computed(() => getProtocolGroup(selectedProtocol.value));
const isTcpClientDevice = computed(() => protocolGroup.value === 'tcp');
const protocolLabel = computed(
  () => IOT_PROTOCOL_OPTIONS.find((item) => item.value === normalizeProtocolValue(selectedProtocol.value))?.label || selectedProtocol.value || '未知协议'
);
const addressAreaOptions = computed(() => (protocolGroup.value === 's7' ? IOT_S7_AREA_OPTIONS : IOT_MODBUS_AREA_OPTIONS));
const addressPlaceholder = computed(() => {
  if (protocolGroup.value === 'modbus') return '例如 holding-register:1:REAL 或 holding-register:1:CHAR[10]';
  if (protocolGroup.value === 's7') return '例如 %DB1.DBD0:REAL';
  if (protocolGroup.value === 'tcp') return '例如 text:STATUS? 或 hex:01 03 00 00 00 01（非 Modbus 寄存器）';
  return '请输入协议对应点位地址';
});

const qualityStats = computed(() => {
  const rows = pointList.value;
  return {
    good: rows.filter((r) => r.quality === 'GOOD').length,
    uncertain: rows.filter((r) => r.quality === 'UNCERTAIN').length,
    bad: rows.filter((r) => r.quality === 'BAD').length
  };
});

const optionLabel = (options: { label: string; value: string }[], value?: string) =>
  options.find((o) => o.value === value)?.label || value || '—';

const dataTypeLabel = (value?: string) => optionLabel(IOT_DATA_TYPE_OPTIONS, value);
const rwModeLabel = (value?: string) => optionLabel(IOT_READ_WRITE_OPTIONS, value);
const qualityLabel = (value?: string) => optionLabel(IOT_QUALITY_OPTIONS, value);

const dataTypeTag = (value?: string): '' | 'success' | 'warning' | 'info' | 'danger' => {
  const map: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    INT: '',
    FLOAT: 'success',
    BOOL: 'warning',
    STRING: 'info'
  };
  return map[value || ''] || 'info';
};

const rwModeTag = (value?: string): '' | 'success' | 'warning' | 'info' | 'danger' => {
  const map: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    R: 'info',
    W: 'warning',
    RW: 'success'
  };
  return map[value || ''] || 'info';
};

const qualityTag = (value?: string): '' | 'success' | 'warning' | 'info' | 'danger' => {
  const map: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    GOOD: 'success',
    UNCERTAIN: 'warning',
    BAD: 'danger'
  };
  return map[value || ''] || 'info';
};

const isEmptyValue = (value?: string) => value == null || value === '';
const formatValue = (value?: string) => (isEmptyValue(value) ? '—' : String(value));

/** 设备 ID 统一按字符串处理，避免雪花 ID 被 Number 精度丢失 */
const toIdStr = (id?: string | number | null | (string | null)[]) => {
  if (id == null || id === '') return '';
  const raw = Array.isArray(id) ? id[0] : id;
  if (raw == null || raw === '') return '';
  return String(raw);
};

const resolveDeviceName = (row: PointVO) => {
  if (row.deviceName) return row.deviceName;
  const matched = deviceOptions.value.find((item) => toIdStr(item.id) === toIdStr(row.deviceId));
  return matched?.deviceName || toIdStr(row.deviceId) || '—';
};

const initForm: PointForm = {
  deviceId: toIdStr(route.query.deviceId as string) || undefined,
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
    deviceId: toIdStr(route.query.deviceId as string) || undefined,
    pointCode: undefined,
    pointName: undefined
  },
  rules: {
    deviceId: [{ required: true, message: '设备不能为空', trigger: 'change' }],
    pointCode: [{ required: true, message: '点位编码不能为空', trigger: 'blur' }],
    pointName: [{ required: true, message: '点位名称不能为空', trigger: 'blur' }],
    tagAddress: [
      {
        validator: (_r: any, value: string, cb: (e?: Error) => void) => {
          if (isTcpClientDevice.value) {
            cb();
            return;
          }
          if (!value || !String(value).trim()) cb(new Error('点位地址不能为空'));
          else cb();
        },
        trigger: 'blur'
      }
    ]
  }
});
const { queryParams, form, rules } = toRefs(data);
const currentDeviceId = computed(() => toIdStr(routeDeviceId.value) || toIdStr(queryParams.value.deviceId) || undefined);
const generatedAddress = computed(() => buildPlcTagAddress(selectedProtocol.value, form.value.dataType, addrBuilder));

const resolveDeviceProtocol = async (deviceId?: string | number) => {
  const id = toIdStr(deviceId);
  if (!id) {
    selectedProtocol.value = '';
    return;
  }
  const cached = deviceOptions.value.find((item) => toIdStr(item.id) === id);
  if (cached?.protocol) {
    selectedProtocol.value = normalizeProtocolValue(cached.protocol);
    return;
  }
  try {
    const res = await getDevice(id);
    selectedProtocol.value = normalizeProtocolValue(res.data?.protocol);
    if (res.data && !deviceOptions.value.some((item) => toIdStr(item.id) === toIdStr(res.data.id))) {
      deviceOptions.value.push(res.data);
    }
  } catch {
    selectedProtocol.value = '';
  }
};

const resetAddressBuilder = (tagAddress?: string) => {
  const next = parsePlcTagAddress(selectedProtocol.value, tagAddress, form.value.dataType);
  Object.assign(addrBuilder, next);
};

const syncGeneratedAddress = () => {
  if (!addrAutoGenerate.value || protocolGroup.value === 'other') return;
  const address = generatedAddress.value;
  if (address) form.value.tagAddress = address;
};

const applyGeneratedAddress = () => {
  const address = generatedAddress.value;
  if (!address) {
    proxy?.$modal.msgWarning('当前协议暂不支持自动生成，请手动填写地址');
    return;
  }
  form.value.tagAddress = address;
  addrAutoGenerate.value = true;
};

const onDataTypeChange = () => {
  if (protocolGroup.value === 'modbus' && addrAutoGenerate.value) {
    if (form.value.dataType === 'BOOL' && (addrBuilder.area === 'holding-register' || addrBuilder.area === 'input-register')) {
      addrBuilder.area = 'coil';
    }
    if (form.value.dataType !== 'BOOL' && (addrBuilder.area === 'coil' || addrBuilder.area === 'discrete-input')) {
      addrBuilder.area = 'holding-register';
    }
  }
  syncGeneratedAddress();
};

const onDeviceChange = async () => {
  await resolveDeviceProtocol(form.value.deviceId);
  resetAddressBuilder();
  if (addrAutoGenerate.value) syncGeneratedAddress();
};

const onTagAddressManualInput = () => {
  if (addrAutoGenerate.value) addrAutoGenerate.value = false;
};

watch(addrAutoGenerate, (enabled) => {
  if (enabled) syncGeneratedAddress();
});

const loadDevices = async () => {
  const res = await listDevice({ pageNum: 1, pageSize: 200 });
  deviceOptions.value = (res as any).rows ?? [];
};

/** 路由带 deviceId 时强制按设备过滤，避免 keep-alive / 未同步导致查出全部点位 */
const syncDeviceIdFromRoute = () => {
  const id = toIdStr(routeDeviceId.value);
  if (id) {
    queryParams.value.deviceId = id;
  }
};

const getList = async () => {
  syncDeviceIdFromRoute();
  loading.value = true;
  try {
    const params = {
      ...queryParams.value,
      deviceId: toIdStr(queryParams.value.deviceId) || undefined
    };
    const res = await listPoint(params);
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
  syncDeviceIdFromRoute();
  handleQuery();
};

const reset = async () => {
  form.value = {
    ...initForm,
    deviceId: toIdStr(routeDeviceId.value) || toIdStr(queryParams.value.deviceId) || undefined
  };
  formRef.value?.resetFields();
  addrAutoGenerate.value = true;
  await resolveDeviceProtocol(form.value.deviceId);
  resetAddressBuilder();
  syncGeneratedAddress();
};

const handleAdd = async () => {
  await reset();
  dialog.visible = true;
  dialog.title = '新增点位';
};

const handleUpdate = async (row: PointVO) => {
  await reset();
  const res = await getPoint(row.id);
  form.value = {
    ...res.data,
    deviceId: toIdStr(res.data?.deviceId) || undefined
  };
  await resolveDeviceProtocol(form.value.deviceId);
  resetAddressBuilder(form.value.tagAddress);
  addrAutoGenerate.value = false;
  dialog.visible = true;
  dialog.title = '修改点位';
};

const submitForm = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    if (!form.value.deviceId) {
      form.value.deviceId = toIdStr(routeDeviceId.value) || toIdStr(queryParams.value.deviceId) || undefined;
    } else {
      form.value.deviceId = toIdStr(form.value.deviceId);
    }
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

const handleRead = async () => {
  if (!currentDeviceId.value) {
    proxy?.$modal.msgWarning('请先选择设备');
    return;
  }
  reading.value = true;
  try {
    const res = await readDevicePoints(currentDeviceId.value);
    readDialog.rows = (res.data || []) as PointReadItem[];
    readDialog.title = `采集结果${headerDeviceName.value ? ` - ${headerDeviceName.value}` : ''}`;
    readDialog.visible = true;
    await getList();
  } finally {
    reading.value = false;
  }
};

let listBootstrapped = false;
let skipNextActivate = true;

const bootstrapPointList = async () => {
  if (!listBootstrapped) {
    await loadDevices();
    listBootstrapped = true;
  }
  syncDeviceIdFromRoute();
  if (routeDeviceId.value) await resolveDeviceProtocol(routeDeviceId.value);
  await getList();
};

onMounted(async () => {
  await bootstrapPointList();
});

onActivated(async () => {
  // 与 onMounted 同一次进入时跳过，避免重复请求
  if (skipNextActivate) {
    skipNextActivate = false;
    return;
  }
  await bootstrapPointList();
});

watch(
  () => route.query.deviceId,
  async (deviceId, prev) => {
    if (toIdStr(deviceId as string) === toIdStr(prev as string)) return;
    queryParams.value.pageNum = 1;
    if (!toIdStr(deviceId as string)) {
      queryParams.value.deviceId = undefined;
      selectedProtocol.value = '';
    }
    await bootstrapPointList();
  }
);
</script>

<style scoped lang="scss">
.point-page {
  .search-card {
    :deep(.el-card__body) {
      padding-bottom: 2px;
    }
  }

  .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .list-header__left,
  .list-header__right {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .list-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    &__icon {
      color: var(--el-color-primary);
      font-size: 18px;
    }
  }

  .back-btn {
    margin-right: 2px;
    font-weight: 500;
    padding: 0 4px;

    :deep(.el-icon) {
      font-size: 15px;
    }
  }

  .device-chip {
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stat-chips {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-left: 4px;
  }

  .stat-chip {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 12px;
    line-height: 20px;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);

    &.good {
      color: var(--el-color-success);
      background: var(--el-color-success-light-9);
      border-color: var(--el-color-success-light-7);
    }

    &.warn {
      color: var(--el-color-warning);
      background: var(--el-color-warning-light-9);
      border-color: var(--el-color-warning-light-7);
    }

    &.bad {
      color: var(--el-color-danger);
      background: var(--el-color-danger-light-9);
      border-color: var(--el-color-danger-light-7);
    }
  }

  .point-table {
    :deep(.el-table__header th) {
      background: var(--el-fill-color-light);
    }
  }

  .code-text,
  .addr-text {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 12px;
  }

  .code-text {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 4px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  .addr-text {
    color: var(--el-text-color-regular);
  }

  .value-cell {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    max-width: 100%;
  }

  .value-text {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-color-success);
    font-variant-numeric: tabular-nums;

    &.empty {
      color: var(--el-text-color-placeholder);
      font-weight: 400;
    }
  }

  .unit-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .time-text {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .point-ops {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
}

.form-section {
  padding: 14px 16px 2px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-extra-light);

  &:last-child {
    margin-bottom: 0;
  }

  &__title {
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.addr-builder {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  background: var(--el-bg-color);
  border: 1px dashed var(--el-border-color);

  &__toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
}

.addr-field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.addr-preview {
  font-size: 12px;
  color: var(--el-text-color-secondary);

  code {
    margin-left: 4px;
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  }
}
</style>
