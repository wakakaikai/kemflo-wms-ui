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
            <el-form-item label="设备品牌" prop="deviceBrand">
              <el-select v-model="queryParams.deviceBrand" placeholder="设备品牌" clearable filterable style="width: 140px">
                <el-option v-for="dict in iot_device_brand" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="系统品牌" prop="systemBrand">
              <el-select v-model="queryParams.systemBrand" placeholder="系统品牌" clearable filterable style="width: 140px">
                <el-option v-for="dict in iot_device_system_brand" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
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
            <el-button type="warning" plain icon="Monitor" @click="goInjectionDisplay()">射出显示</el-button>
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
            role="button"
            tabindex="0"
            @click="goPoints(row)"
            @keydown.enter.prevent="goPoints(row)"
            @keydown.space.prevent="goPoints(row)"
          >
            <div class="device-card__top">
              <el-checkbox :model-value="isCardSelected(row.id)" @change="(val: CheckboxValueType) => toggleCardSelect(row, !!val)" @click.stop />
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
                <span class="meta-label">品牌</span>
                <span class="meta-value">
                  <dict-tag :options="iot_device_brand" :value="row.deviceBrand" />
                  <span v-if="!row.deviceBrand">—</span>
                </span>
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
              <div class="device-card__actions" @click.stop>
                <el-tooltip content="测试连接" placement="top" effect="dark" :show-after="200">
                  <el-button v-hasPermi="['iot:device:query']" link type="primary" icon="Connection" :loading="actionId === row.id && actionType === 'test'" @click="handleTest(row)" />
                </el-tooltip>
                <el-tooltip content="射出显示" placement="top" effect="dark" :show-after="200">
                  <el-button link type="warning" icon="Monitor" @click="goInjectionDisplay(row)" />
                </el-tooltip>
                <el-tooltip :content="isTcpClientRow(row) ? '数据解析' : '点位配置'" placement="top" effect="dark" :show-after="200">
                  <el-button v-hasPermi="['iot:point:list']" link type="primary" icon="Coin" @click="goPoints(row)" />
                </el-tooltip>
                <el-tooltip content="编辑设备" placement="top" effect="dark" :show-after="200">
                  <el-button v-hasPermi="['iot:device:edit']" link type="primary" icon="Edit" @click="handleUpdate(row)" />
                </el-tooltip>
                <el-tooltip content="复制设备" placement="top" effect="dark" :show-after="200">
                  <el-button v-hasPermi="['iot:device:add']" link type="primary" icon="CopyDocument" @click="handleCopy(row)" />
                </el-tooltip>
                <el-tooltip content="删除设备" placement="top" effect="dark" :show-after="200">
                  <el-button v-hasPermi="['iot:device:remove']" link type="danger" icon="Delete" @click="handleDelete(row)" />
                </el-tooltip>
              </div>
            </div>
          </div>
          <el-empty v-if="!deviceList.length" description="暂无采集设备" />
        </div>

        <el-table v-else :data="deviceList" border stripe class="device-table" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="设备编码" prop="deviceCode" min-width="130" />
          <el-table-column label="设备名称" prop="deviceName" min-width="140" />
          <el-table-column label="设备品牌" align="center" width="110">
            <template #default="scope">
              <dict-tag :options="iot_device_brand" :value="scope.row.deviceBrand" />
            </template>
          </el-table-column>
          <el-table-column label="系统品牌" align="center" width="120">
            <template #default="scope">
              <dict-tag :options="iot_device_system_brand" :value="scope.row.systemBrand" />
            </template>
          </el-table-column>
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
                  <el-button v-hasPermi="['iot:device:query']" link type="primary" icon="Connection" :loading="actionId === scope.row.id && actionType === 'test'" @click="handleTest(scope.row)" />
                </el-tooltip>
                <el-tooltip content="射出显示" placement="top" effect="dark" :show-after="200">
                  <el-button link type="warning" icon="Monitor" @click="goInjectionDisplay(scope.row)" />
                </el-tooltip>
                <el-tooltip :content="isTcpClientRow(scope.row) ? '数据解析' : '点位配置'" placement="top" effect="dark" :show-after="200">
                  <el-button v-hasPermi="['iot:point:list']" link type="primary" icon="Coin" @click="goPoints(scope.row)" />
                </el-tooltip>
                <el-tooltip content="编辑设备" placement="top" effect="dark" :show-after="200">
                  <el-button v-hasPermi="['iot:device:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
                </el-tooltip>
                <el-tooltip content="复制设备" placement="top" effect="dark" :show-after="200">
                  <el-button v-hasPermi="['iot:device:add']" link type="primary" icon="CopyDocument" @click="handleCopy(scope.row)" />
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
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="设备编码" prop="deviceCode">
              <el-input v-model="form.deviceCode" placeholder="唯一编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备名称" prop="deviceName">
              <el-input v-model="form.deviceName" placeholder="设备名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备品牌" prop="deviceBrand">
              <el-select v-model="form.deviceBrand" clearable filterable placeholder="请选择设备品牌" style="width: 100%">
                <el-option v-for="dict in iot_device_brand" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="系统品牌" prop="systemBrand">
              <el-select v-model="form.systemBrand" clearable filterable placeholder="请选择系统品牌" style="width: 100%">
                <el-option v-for="dict in iot_device_system_brand" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="协议" prop="protocol">
              <el-select v-model="form.protocol" style="width: 100%" @change="onProtocolChange">
                <el-option v-for="item in IOT_PROTOCOL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
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
            <el-col :span="8">
              <el-form-item label="启用心跳">
                <el-switch v-model="tcpHeartbeat.heartbeatEnable" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="保活频率(ms)">
                <el-input-number v-model="tcpHeartbeat.heartbeatInterval" :min="1000" :step="1000" :disabled="!tcpHeartbeat.heartbeatEnable" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="等待应答">
                <el-switch v-model="tcpHeartbeat.heartbeatWaitReply" :disabled="!tcpHeartbeat.heartbeatEnable" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="保活命令">
                <el-input v-model="tcpHeartbeat.heartbeat" :disabled="!tcpHeartbeat.heartbeatEnable" placeholder='按品牌填写，例如 {"Heart":"Ask"} 或 text:PING\r\n 或 hex:FF01...' />
                <div class="form-tip">连接后按保活频率发送；每次业务读写前也会先发一次。不填则不发。</div>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="业务请求">
                <el-input v-model="tcpRequest" placeholder="可选。空=被动收帧；例 text:STATUS? 或 hex:FF01..." @change="applyTcpConnectionParamsToForm" />
                <div class="form-tip">主动轮询时发送；写入 connectionParamsJson.request。点位只做 V.GetData 映射。</div>
              </el-form-item>
            </el-col>
            <el-col v-if="form.id" :span="12">
              <el-form-item label="连接状态">
                <dict-tag :options="IOT_ONLINE_STATUS_OPTIONS" :value="formOnlineStatus" />
                <span v-if="formLastOnlineTime" class="form-tip inline">最近在线 {{ formLastOnlineTime }}</span>
              </el-form-item>
            </el-col>
          </template>

          <el-col v-if="isModbus && !isTcpClient" :span="24">
            <el-form-item label="地址编号">
              <el-select v-model="modbusAddressBase" style="width: 100%">
                <el-option v-for="item in IOT_MODBUS_ADDRESS_BASE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <template v-if="isOpcUa">
            <el-col :span="8">
              <el-form-item label="鉴权方式">
                <el-select v-model="opcUaAuth.authType" style="width: 100%" @change="applyOpcUaAuthToForm">
                  <el-option v-for="item in IOT_OPCUA_AUTH_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="用户名">
                <el-input v-model="opcUaAuth.username" :disabled="opcUaAuth.authType === 'anonymous'" placeholder="OPC UA 用户名" @change="applyOpcUaAuthToForm" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="密码">
                <el-input v-model="opcUaAuth.password" :disabled="opcUaAuth.authType === 'anonymous'" type="password" show-password placeholder="OPC UA 密码" @change="applyOpcUaAuthToForm" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="安全策略">
                <el-select v-model="opcUaAuth.securityPolicy" style="width: 100%" @change="onOpcUaSecurityPolicyChange">
                  <el-option v-for="item in IOT_OPCUA_SECURITY_POLICY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="安全模式">
                <el-select v-model="opcUaAuth.messageSecurity" style="width: 100%" @change="applyOpcUaAuthToForm">
                  <el-option v-for="item in IOT_OPCUA_MESSAGE_SECURITY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Discovery">
                <el-switch v-model="opcUaAuth.discovery" @change="applyOpcUaAuthToForm" />
              </el-form-item>
            </el-col>
          </template>
          <el-col :span="24">
            <el-form-item label="连接参数JSON" prop="connectionParamsJson">
              <el-input v-model="form.connectionParamsJson" type="textarea" :rows="isTcpClient || isSerialLink || isOpcUa ? 5 : 3" :placeholder="connectionParamsPlaceholder" @change="onConnectionParamsJsonChange" />
              <div v-if="isTcpClient" class="form-tip">随上方保活参数自动同步；也可直接改 JSON，失焦后回写到表单。</div>
              <div v-if="isOpcUa" class="form-tip">随上方鉴权参数自动同步；也可直接改 JSON，失焦后回写到表单。</div>
            </el-form-item>
          </el-col>
          <el-col v-if="!isTcpClient" :span="24">
            <el-form-item label="完整连接串" prop="connectionUrl">
              <el-input v-model="form.connectionUrl" placeholder="优先，如 modbus-tcp://192.168.1.1:502 或 s7://10.0.0.1?rack=0&slot=1" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="位置" prop="deviceLocation">
              <el-input v-model="form.deviceLocation" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm">确定</el-button>
        <el-button @click="dialog.visible = false">取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="copyDialog.visible" :title="copyDialog.title" width="520px" destroy-on-close append-to-body>
      <el-form ref="copyFormRef" :model="copyForm" :rules="copyRules" label-width="110px">
        <el-form-item label="来源设备">
          <el-input :model-value="copySourceText" disabled />
        </el-form-item>
        <el-form-item label="新设备编码" prop="deviceCode">
          <el-input v-model="copyForm.deviceCode" placeholder="请输入新设备编码" />
        </el-form-item>
        <el-form-item label="新设备名称" prop="deviceName">
          <el-input v-model="copyForm.deviceName" placeholder="请输入新设备名称" />
        </el-form-item>
        <el-form-item label="采集参数">
          <el-checkbox v-model="copyForm.copyPoints">复制点位采集参数和视图配置</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="copySubmitting" @click="submitCopy">确定</el-button>
        <el-button @click="copyDialog.visible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="IotDevice" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, computed, reactive, ref, toRefs, onMounted, watch } from 'vue';
import type { CheckboxValueType, FormInstance } from 'element-plus';
import { Monitor } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { listDevice, getDevice, addDevice, updateDevice, copyDevice, delDevice, testDeviceConnection } from '@/api/iot/device';
import { DeviceCopyForm, DeviceForm, DeviceQuery, DeviceVO } from '@/api/iot/device/types';

// ===== iot-options (inlined) =====
/** IoT 前端写死选项（PLC4X 协议编码） */

interface IotOption extends DictDataOption {}

const IOT_PROTOCOL_OPTIONS: IotOption[] = [
  { label: 'Modbus TCP', value: 'modbus-tcp' },
  { label: 'Modbus RTU', value: 'modbus-rtu' },
  { label: 'Siemens S7', value: 's7' },
  { label: 'OPC UA', value: 'opcua' },
  { label: 'EtherNet/IP', value: 'eip' },
  { label: 'TCP Client', value: 'tcp-client' }
];

/** 历史传输编码兼容映射 */
const TRANSPORT_ALIAS_MAP: Record<string, string> = {
  tcp: 'TCP_CLIENT',
  'tcp-client': 'TCP_CLIENT',
  tcpclient: 'TCP_CLIENT',
  tcp_client: 'TCP_CLIENT',
  TCP_CLIENT: 'TCP_CLIENT',
  udp: 'udp',
  serial: 'SERIAL_RS232',
  rs232: 'SERIAL_RS232',
  'serial-rs232': 'SERIAL_RS232',
  serial_rs232: 'SERIAL_RS232',
  SERIAL_RS232: 'SERIAL_RS232',
  rs485: 'SERIAL_RS485',
  'serial-rs485': 'SERIAL_RS485',
  serial_rs485: 'SERIAL_RS485',
  SERIAL_RS485: 'SERIAL_RS485'
};

function normalizeTransportValue(value?: string): string {
  if (!value) return '';
  const raw = value.trim();
  const key = raw.toLowerCase().replace(/[\s]+/g, '-').replace(/_/g, '-');
  const compact = key.replace(/-/g, '');
  return TRANSPORT_ALIAS_MAP[raw] || TRANSPORT_ALIAS_MAP[key] || TRANSPORT_ALIAS_MAP[compact] || TRANSPORT_ALIAS_MAP[raw.toUpperCase()] || raw;
}

function isTcpTransport(value?: string): boolean {
  return normalizeTransportValue(value) === 'TCP_CLIENT';
}

function isSerialTransport(value?: string): boolean {
  const v = normalizeTransportValue(value);
  return v === 'SERIAL_RS232' || v === 'SERIAL_RS485';
}

const IOT_ONLINE_STATUS_OPTIONS: IotOption[] = [
  { label: '离线', value: '0', elTagType: 'info' },
  { label: '在线', value: '1', elTagType: 'success' }
];

const IOT_DATA_TYPE_OPTIONS: IotOption[] = [
  { label: 'INT(16位有符号)', value: 'INT' },
  { label: 'UINT(16位无符号)', value: 'UINT' },
  { label: 'DINT(32位有符号)', value: 'DINT' },
  { label: 'UDINT(32位无符号)', value: 'UDINT' },
  { label: 'FLOAT/REAL(32位浮点)', value: 'FLOAT' },
  { label: 'DOUBLE/LREAL(64位浮点)', value: 'DOUBLE' },
  { label: '布尔', value: 'BOOL' },
  { label: '字符串', value: 'STRING' }
];

/** 数值类型（可乘系数换算） */
function isNumericDataType(dataType?: string): boolean {
  const type = (dataType || '').toUpperCase();
  return type === 'INT' || type === 'UINT' || type === 'DINT' || type === 'UDINT' || type === 'FLOAT' || type === 'REAL' || type === 'DOUBLE' || type === 'LREAL' || type === 'WORD' || type === 'DWORD' || type === 'LONG';
}

function resolveScaleFactor(scaleFactor?: number | null): number {
  const n = Number(scaleFactor);
  return Number.isFinite(n) ? n : 1;
}

/** 数值类型：展示/采集值 = 原始值 × 系数；BOOL/STRING 原样返回 */
function applyNumericScale(raw: unknown, dataType?: string, scaleFactor?: number | null): unknown {
  if (raw == null || raw === '') return raw;
  if (!isNumericDataType(dataType)) return raw;
  const scale = resolveScaleFactor(scaleFactor);
  if (scale === 1) return raw;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw * scale;
  if (typeof raw === 'string') {
    const text = raw.trim();
    if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(text)) return raw;
    const num = Number(text);
    if (!Number.isFinite(num)) return raw;
    return num * scale;
  }
  return raw;
}

/** 显示格式（对齐 Modbus Poll） */
const IOT_DISPLAY_FORMAT_OPTIONS: IotOption[] = [
  { label: '有符号', value: 'SIGNED' },
  { label: '无符号', value: 'UNSIGNED' },
  { label: '十六进制', value: 'HEX' },
  { label: '二进制', value: 'BINARY' }
];

/** Modbus Poll Format（数据类型 + 格式 + 字节序合一，选项英文） */
interface IotPlcFormatOption {
  label: string;
  value: string;
  dataType: string;
  displayFormat: string;
  byteOrder: string;
}

interface IotPlcFormatGroup {
  label: string;
  options: IotPlcFormatOption[];
}

function plcFmt(label: string, value: string, dataType: string, displayFormat: string, byteOrder: string): IotPlcFormatOption {
  return { label, value, dataType, displayFormat, byteOrder };
}

const POLL_FMT_INT_OPTIONS: IotPlcFormatOption[] = [plcFmt('Signed', 'SIGNED', 'INT', 'SIGNED', 'ABCD'), plcFmt('Unsigned', 'UNSIGNED', 'UINT', 'UNSIGNED', 'ABCD'), plcFmt('Hex', 'HEX', 'INT', 'HEX', 'ABCD'), plcFmt('Binary', 'BINARY', 'INT', 'BINARY', 'ABCD')];

const POLL_FMT_LONG_OPTIONS: IotPlcFormatOption[] = [plcFmt('Long AB CD', 'LONG_ABCD', 'DINT', 'SIGNED', 'ABCD'), plcFmt('Long CD AB', 'LONG_CDAB', 'DINT', 'SIGNED', 'CDAB'), plcFmt('Long BA DC', 'LONG_BADC', 'DINT', 'SIGNED', 'BADC'), plcFmt('Long DC BA', 'LONG_DCBA', 'DINT', 'SIGNED', 'DCBA')];

const POLL_FMT_FLOAT_OPTIONS: IotPlcFormatOption[] = [plcFmt('Float AB CD', 'FLOAT_ABCD', 'FLOAT', 'SIGNED', 'ABCD'), plcFmt('Float CD AB', 'FLOAT_CDAB', 'FLOAT', 'SIGNED', 'CDAB'), plcFmt('Float BA DC', 'FLOAT_BADC', 'FLOAT', 'SIGNED', 'BADC'), plcFmt('Float DC BA', 'FLOAT_DCBA', 'FLOAT', 'SIGNED', 'DCBA')];

const POLL_FMT_DOUBLE_OPTIONS: IotPlcFormatOption[] = [plcFmt('Double AB CD EF GH', 'DOUBLE_ABCDEFGH', 'DOUBLE', 'SIGNED', 'ABCDEFGH'), plcFmt('Double GH EF CD AB', 'DOUBLE_GHEFCDAB', 'DOUBLE', 'SIGNED', 'GHEFCDAB'), plcFmt('Double BA DC FE HG', 'DOUBLE_BADCFEHG', 'DOUBLE', 'SIGNED', 'BADCFEHG'), plcFmt('Double HG FE DC BA', 'DOUBLE_HGFEDCBA', 'DOUBLE', 'SIGNED', 'HGFEDCBA')];

const POLL_FMT_STRING_OPTIONS: IotPlcFormatOption[] = [plcFmt('String AB CD', 'STR_ABCD', 'STRING', 'SIGNED', 'ABCD'), plcFmt('String CD AB', 'STR_CDAB', 'STRING', 'SIGNED', 'CDAB')];

const POLL_UNIFIED_FORMAT_OPTIONS: IotPlcFormatOption[] = [...POLL_FMT_INT_OPTIONS, ...POLL_FMT_LONG_OPTIONS, ...POLL_FMT_FLOAT_OPTIONS, ...POLL_FMT_DOUBLE_OPTIONS, ...POLL_FMT_STRING_OPTIONS];

/** Poll 完整 Format 分组（选项英文，与 Modbus Poll 菜单一致） */
function resolvePollUnifiedFormatGroups(): IotPlcFormatGroup[] {
  return [
    { label: '整数 (INT)', options: POLL_FMT_INT_OPTIONS },
    { label: '长整数(DINT)', options: POLL_FMT_LONG_OPTIONS },
    { label: '浮点 (FLOAT)', options: POLL_FMT_FLOAT_OPTIONS },
    { label: '双精度(DOUBLE)', options: POLL_FMT_DOUBLE_OPTIONS },
    { label: '字符串(STRING)', options: POLL_FMT_STRING_OPTIONS }
  ];
}

function flattenPlcFormatOptions(_dataType?: string): IotPlcFormatOption[] {
  return POLL_UNIFIED_FORMAT_OPTIONS;
}

function normalizePlcDataType(dataType?: string): string {
  const type = (dataType || '').toUpperCase();
  if (type === 'REAL') return 'FLOAT';
  if (type === 'LREAL') return 'DOUBLE';
  if (type === 'LONG' || type === 'DWORD') return 'DINT';
  if (type === 'CHAR') return 'STRING';
  return type;
}

/** 反查 Poll Format */
function encodePlcFormat(displayFormat?: string, byteOrder?: string, dataType?: string): string {
  const type = normalizePlcDataType(dataType);
  const display = (displayFormat || 'SIGNED').toUpperCase();
  const order = (byteOrder || defaultByteOrder(dataType)).toUpperCase();

  const exact = POLL_UNIFIED_FORMAT_OPTIONS.find((o) => normalizePlcDataType(o.dataType) === type && o.displayFormat.toUpperCase() === display && o.byteOrder.toUpperCase() === order);
  if (exact) return exact.value;

  if (type === 'FLOAT') {
    return POLL_FMT_FLOAT_OPTIONS.find((o) => o.byteOrder === order)?.value || 'FLOAT_CDAB';
  }
  if (type === 'DOUBLE') {
    return POLL_FMT_DOUBLE_OPTIONS.find((o) => o.byteOrder === order)?.value || 'DOUBLE_GHEFCDAB';
  }
  if (type === 'DINT' || type === 'UDINT') {
    if (display === 'SIGNED') {
      return POLL_FMT_LONG_OPTIONS.find((o) => o.byteOrder === order)?.value || 'LONG_CDAB';
    }
  }
  if (type === 'STRING') {
    return order === 'CDAB' ? 'STR_CDAB' : 'STR_ABCD';
  }
  return POLL_FMT_INT_OPTIONS.find((o) => o.displayFormat === display)?.value || 'SIGNED';
}

/** Poll Format -> 数据类型 + displayFormat + byteOrder */
function decodePlcFormat(formatValue: string, _dataType?: string, current?: { dataType?: string; displayFormat?: string; byteOrder?: string }): { dataType: string; displayFormat: string; byteOrder: string } {
  const option = POLL_UNIFIED_FORMAT_OPTIONS.find((o) => o.value === formatValue);
  if (!option) {
    return {
      dataType: current?.dataType || 'INT',
      displayFormat: current?.displayFormat || 'SIGNED',
      byteOrder: current?.byteOrder || defaultByteOrder(current?.dataType)
    };
  }
  return {
    dataType: option.dataType,
    displayFormat: option.displayFormat,
    byteOrder: option.byteOrder
  };
}

function defaultPlcFormat(_dataType?: string): string {
  return 'FLOAT_CDAB';
}

function plcFormatFieldTip(protocol?: string, dataType?: string): string {
  const type = normalizePlcDataType(dataType);
  if (isModbusProtocol(protocol) && type === 'FLOAT') {
    return '选项与 Modbus Poll Format 菜单一致；Float CD AB 占连续 2 个寄存器。';
  }
  if (isModbusProtocol(protocol) && type === 'DOUBLE') {
    return 'Double GH EF CD AB 为 64 位字交换（常用）。';
  }
  if (type === 'STRING') {
    return '字符串乱码时可试 String CD AB。';
  }
  return 'Signed/Unsigned/Hex/Binary 为 16 位；Long/Float/Double 为 32/64 位。';
}

/** 16/32 位字节序 */
const IOT_BYTE_ORDER_32_OPTIONS: IotOption[] = [
  { label: 'Long AB CD / Float AB CD', value: 'ABCD' },
  { label: 'Long CD AB / Float CD AB', value: 'CDAB' },
  { label: 'Long BA DC / Float BA DC', value: 'BADC' },
  { label: 'Long DC BA / Float DC BA', value: 'DCBA' }
];

/** 16 位寄存器字节序 */
const IOT_BYTE_ORDER_16_OPTIONS: IotOption[] = [
  { label: 'AB（默认）', value: 'ABCD' },
  { label: 'BA（字节交换）', value: 'BA' }
];

/** 64 位双精度字节序 */
const IOT_BYTE_ORDER_64_OPTIONS: IotOption[] = [
  { label: 'Double AB CD EF GH', value: 'ABCDEFGH' },
  { label: 'Double GH EF CD AB', value: 'GHEFCDAB' },
  { label: 'Double BA DC FE HG', value: 'BADCFEHG' },
  { label: 'Double HG FE DC BA', value: 'HGFEDCBA' }
];

function resolveByteOrderOptions(dataType?: string): IotOption[] {
  const type = (dataType || '').toUpperCase();
  if (type === 'DOUBLE' || type === 'LREAL') return IOT_BYTE_ORDER_64_OPTIONS;
  if (type === 'FLOAT' || type === 'REAL' || type === 'DINT' || type === 'UDINT' || type === 'LONG' || type === 'DWORD') {
    return IOT_BYTE_ORDER_32_OPTIONS;
  }
  if (type === 'STRING' || type === 'CHAR') return IOT_BYTE_ORDER_32_OPTIONS;
  if (type === 'INT' || type === 'UINT' || type === 'WORD' || type === 'SHORT') return IOT_BYTE_ORDER_16_OPTIONS;
  return IOT_BYTE_ORDER_32_OPTIONS;
}

function defaultByteOrder(dataType?: string): string {
  const type = (dataType || '').toUpperCase();
  if (type === 'FLOAT' || type === 'REAL') {
    return 'CDAB';
  }
  if (type === 'DINT' || type === 'UDINT' || type === 'STRING' || type === 'CHAR') {
    return 'CDAB';
  }
  if (type === 'DOUBLE' || type === 'LREAL') return 'GHEFCDAB';
  return 'ABCD';
}

const IOT_READ_WRITE_OPTIONS: IotOption[] = [
  { label: '只读', value: 'R' },
  { label: '只写', value: 'W' },
  { label: '读写', value: 'RW' }
];

const IOT_QUALITY_OPTIONS: IotOption[] = [
  { label: '良好', value: 'GOOD', elTagType: 'success' },
  { label: '不确定', value: 'UNCERTAIN', elTagType: 'warning' },
  { label: '不良', value: 'BAD', elTagType: 'danger' }
];

/** Modbus 功能码（Poll 英文 + 中文说明） */
interface IotModbusFunctionOption {
  /** Poll 英文标签 */
  label: string;
  /** 中文说明 */
  hint: string;
  value: string;
}

const IOT_MODBUS_FUNCTION_OPTIONS: IotModbusFunctionOption[] = [
  { label: '01 Read Coils (0x)', hint: '读线圈，位地址 0x 区', value: 'coil' },
  { label: '02 Read Discrete Inputs (1x)', hint: '读离散输入，位地址 1x 区', value: 'discrete-input' },
  { label: '03 Read Holding Registers (4x)', hint: '读保持寄存器，4x 区（最常用）', value: 'holding-register' },
  { label: '04 Read Input Registers (3x)', hint: '读输入寄存器，3x 区', value: 'input-register' }
];

function modbusFunctionHint(value?: string): string {
  const hit = IOT_MODBUS_FUNCTION_OPTIONS.find((o) => o.value === (value || '').toLowerCase());
  return hit?.hint || '';
}

function modbusAreaToFunction(area?: string): string {
  const hit = IOT_MODBUS_FUNCTION_OPTIONS.find((o) => o.value === (area || '').toLowerCase());
  return hit?.value || 'holding-register';
}

function modbusFunctionToArea(func?: string): string {
  const hit = IOT_MODBUS_FUNCTION_OPTIONS.find((o) => o.value === func);
  return hit?.value || 'holding-register';
}

function parseModbusAreaFromTag(tagAddress?: string): string {
  const match = (tagAddress || '').trim().match(/^(holding-register|input-register|coil|discrete-input)/i);
  return match ? match[1].toLowerCase() : 'holding-register';
}

function modbusFunctionLabelFromTag(tagAddress?: string): string {
  const area = parseModbusAreaFromTag(tagAddress);
  return IOT_MODBUS_FUNCTION_OPTIONS.find((o) => o.value === area)?.label || area;
}

function modbusFunctionHintFromTag(tagAddress?: string): string {
  const area = parseModbusAreaFromTag(tagAddress);
  return modbusFunctionHint(area);
}

/** Poll Quantity：本点位占用的寄存器/线圈数量 */
function resolveModbusRegisterQuantity(dataType?: string, stringLength = 10): number {
  const type = (dataType || '').toUpperCase();
  if (type === 'BOOL') return 1;
  if (type === 'INT' || type === 'UINT' || type === 'WORD') return 1;
  if (type === 'FLOAT' || type === 'REAL' || type === 'DINT' || type === 'UDINT' || type === 'LONG' || type === 'DWORD') return 2;
  if (type === 'DOUBLE' || type === 'LREAL') return 4;
  if (type === 'STRING' || type === 'CHAR') return Math.max(1, Number(stringLength) || 1);
  return 1;
}

/** 人类可读 Format 标签（列表/预览） */
function plcFormatLabel(displayFormat?: string, byteOrder?: string, dataType?: string): string {
  const key = encodePlcFormat(displayFormat, byteOrder, dataType);
  const hit = flattenPlcFormatOptions(dataType).find((o) => o.value === key);
  return hit?.label || key;
}

/** 协议地址 ↔ PLC 4x/3x 人类地址（均从 1 起算） */
function modbusHumanAddress(protocolAddress: number): string {
  const addr = Math.max(0, Number(protocolAddress) || 0);
  return `4x ${40001 + addr} / 3x ${30001 + addr}`;
}

/** Modbus 地址区类型 */
const IOT_MODBUS_AREA_OPTIONS: IotOption[] = [
  { label: '保持寄存器 (4x)', value: 'holding-register' },
  { label: '输入寄存器 (3x)', value: 'input-register' },
  { label: '线圈 (0x)', value: 'coil' },
  { label: '离散输入 (1x)', value: 'discrete-input' }
];

/** Siemens S7 地址区类型 */
const IOT_S7_AREA_OPTIONS: IotOption[] = [
  { label: '数据块 DB', value: 'DB' },
  { label: '输入 I', value: 'I' },
  { label: '输出 Q', value: 'Q' },
  { label: '标志位 M', value: 'M' }
];

type IotAddressProtocolGroup = 'modbus' | 's7' | 'tcp' | 'other';

interface IotAddressBuilder {
  area: string;
  /** 协议地址（0 起） */
  address: number;
  dbNumber: number;
  byteOffset: number;
  bitOffset: number;
  stringLength: number;
  /** TCP Client 请求报文 */
  tcpRequest: string;
}

function normalizeProtocolValue(value?: string): string {
  if (!value) return '';
  const key = value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
  const compact = key.replace(/-/g, '');
  const map: Record<string, string> = {
    'modbus-tcp': 'modbus-tcp',
    modbustcp: 'modbus-tcp',
    modbus: 'modbus-tcp',
    'modbus-rtu': 'modbus-rtu',
    modbusrtu: 'modbus-rtu',
    s7: 's7',
    opcua: 'opcua',
    'opc-ua': 'opcua',
    eip: 'eip',
    'tcp-client': 'tcp-client',
    tcpclient: 'tcp-client',
    tcp: 'tcp-client'
  };
  return map[key] || map[compact] || key;
}

function getProtocolGroup(protocol?: string): IotAddressProtocolGroup {
  const value = normalizeProtocolValue(protocol);
  if (value.startsWith('modbus')) return 'modbus';
  if (value === 's7') return 's7';
  if (value === 'tcp-client') return 'tcp';
  return 'other';
}

function createDefaultAddressBuilder(protocol?: string, dataType?: string): IotAddressBuilder {
  const group = getProtocolGroup(protocol);
  if (group === 'modbus') {
    return {
      area: dataType === 'BOOL' ? 'coil' : 'holding-register',
      address: 0,
      dbNumber: 1,
      byteOffset: 0,
      bitOffset: 0,
      stringLength: 10,
      tcpRequest: ''
    };
  }
  if (group === 's7') {
    return {
      area: 'DB',
      address: 1,
      dbNumber: 1,
      byteOffset: 0,
      bitOffset: 0,
      stringLength: 10,
      tcpRequest: ''
    };
  }
  if (group === 'tcp') {
    return {
      area: '',
      address: 1,
      dbNumber: 1,
      byteOffset: 0,
      bitOffset: 0,
      stringLength: 10,
      tcpRequest: 'text:STATUS?'
    };
  }
  return {
    area: '',
    address: 1,
    dbNumber: 1,
    byteOffset: 0,
    bitOffset: 0,
    stringLength: 10,
    tcpRequest: ''
  };
}

function toModbusDataType(dataType?: string): string {
  switch ((dataType || '').toUpperCase()) {
    case 'BOOL':
      return 'BOOL';
    case 'FLOAT':
    case 'REAL':
      return 'REAL';
    case 'DOUBLE':
    case 'LREAL':
      return 'LREAL';
    case 'STRING':
    case 'CHAR':
      return 'CHAR';
    case 'UINT':
    case 'WORD':
      return 'UINT';
    case 'DINT':
    case 'LONG':
      return 'DINT';
    case 'UDINT':
    case 'DWORD':
      return 'UDINT';
    case 'INT':
    default:
      return 'INT';
  }
}

function toS7Access(dataType?: string): { access: string; plcType: string } {
  switch ((dataType || '').toUpperCase()) {
    case 'BOOL':
      return { access: 'DBX', plcType: 'BOOL' };
    case 'FLOAT':
    case 'REAL':
      return { access: 'DBD', plcType: 'REAL' };
    case 'DOUBLE':
    case 'LREAL':
      return { access: 'DBD', plcType: 'LREAL' };
    case 'STRING':
      return { access: 'DBB', plcType: 'STRING' };
    case 'DINT':
    case 'UDINT':
    case 'LONG':
      return { access: 'DBD', plcType: 'DINT' };
    case 'UINT':
      return { access: 'DBW', plcType: 'UINT' };
    case 'INT':
    default:
      return { access: 'DBW', plcType: 'INT' };
  }
}

function toS7SimpleAccess(area: 'I' | 'Q' | 'M', dataType?: string): { prefix: string; plcType: string } {
  switch ((dataType || '').toUpperCase()) {
    case 'BOOL':
      return { prefix: area, plcType: 'BOOL' };
    case 'FLOAT':
    case 'REAL':
      return { prefix: `${area}D`, plcType: 'REAL' };
    case 'DOUBLE':
    case 'LREAL':
      return { prefix: `${area}D`, plcType: 'LREAL' };
    case 'STRING':
      return { prefix: `${area}B`, plcType: 'STRING' };
    case 'DINT':
    case 'UDINT':
    case 'LONG':
      return { prefix: `${area}D`, plcType: 'DINT' };
    case 'INT':
    default:
      return { prefix: `${area}W`, plcType: 'INT' };
  }
}

/** 根据协议/区类型/数据类型生成点位地址 */
function buildPlcTagAddress(protocol: string | undefined, dataType: string | undefined, builder: IotAddressBuilder): string {
  const group = getProtocolGroup(protocol);
  const address = Math.max(0, Number(builder.address) || 0);
  const dbNumber = Math.max(1, Number(builder.dbNumber) || 1);
  const byteOffset = Math.max(0, Number(builder.byteOffset) || 0);
  const bitOffset = Math.min(7, Math.max(0, Number(builder.bitOffset) || 0));
  const stringLength = Math.max(1, Number(builder.stringLength) || 10);

  if (group === 'tcp') {
    return (builder.tcpRequest || '').trim();
  }

  if (group === 'modbus') {
    const area = builder.area || (dataType === 'BOOL' ? 'coil' : 'holding-register');
    const type = toModbusDataType(dataType);
    if (area === 'coil' || area === 'discrete-input') {
      return `${area}:${address}`;
    }
    if (type === 'CHAR') {
      return `${area}:${address}:CHAR[${stringLength}]`;
    }
    if (type === 'BOOL') {
      return `${area}:${address}`;
    }
    return `${area}:${address}:${type}`;
  }

  if (group === 's7') {
    const area = builder.area || 'DB';
    if (area === 'DB') {
      const { access, plcType } = toS7Access(dataType);
      if (plcType === 'BOOL') {
        return `%DB${dbNumber}.${access}${byteOffset}.${bitOffset}:${plcType}`;
      }
      if (plcType === 'STRING') {
        return `%DB${dbNumber}.${access}${byteOffset}:CHAR[${stringLength}]`;
      }
      return `%DB${dbNumber}.${access}${byteOffset}:${plcType}`;
    }

    const { prefix, plcType } = toS7SimpleAccess(area as 'I' | 'Q' | 'M', dataType);
    if (plcType === 'BOOL') {
      return `%${prefix}${byteOffset}.${bitOffset}:${plcType}`;
    }
    if (plcType === 'STRING') {
      return `%${prefix}${byteOffset}:CHAR[${stringLength}]`;
    }
    return `%${prefix}${byteOffset}:${plcType}`;
  }

  return '';
}

/** 尝试从已有地址反解析构建器（失败则返回默认） */
function parsePlcTagAddress(protocol: string | undefined, tagAddress?: string, dataType?: string): IotAddressBuilder {
  const defaults = createDefaultAddressBuilder(protocol, dataType);
  if (!tagAddress) return defaults;
  const group = getProtocolGroup(protocol);
  const text = tagAddress.trim();

  if (group === 'tcp') {
    return {
      ...defaults,
      tcpRequest: text
    };
  }

  if (group === 'modbus') {
    const baseMatch = text.match(/^(holding-register|input-register|coil|discrete-input):(\d+)/i);
    if (baseMatch) {
      const strMatch = text.match(/CHAR\[(\d+)]/i) || text.match(/STRING\((\d+)\)/i);
      return {
        ...defaults,
        area: baseMatch[1].toLowerCase(),
        address: Number(baseMatch[2]),
        stringLength: Number(strMatch?.[1] || defaults.stringLength)
      };
    }
  }

  if (group === 's7') {
    const dbMatch = text.match(/^%?DB(\d+)\.DB([XWDBxbwd])(\d+)(?:\.(\d+))?/i);
    if (dbMatch) {
      return {
        ...defaults,
        area: 'DB',
        dbNumber: Number(dbMatch[1]),
        byteOffset: Number(dbMatch[3]),
        bitOffset: dbMatch[4] != null ? Number(dbMatch[4]) : 0
      };
    }
    const simpleMatch = text.match(/^%([IQM])([WDB]?)(\d+)(?:\.(\d+))?/i);
    if (simpleMatch) {
      return {
        ...defaults,
        area: simpleMatch[1].toUpperCase(),
        byteOffset: Number(simpleMatch[3]),
        bitOffset: simpleMatch[4] != null ? Number(simpleMatch[4]) : 0
      };
    }
  }

  return defaults;
}

/** Modbus 地址编号（对齐 Poll Display） */
const IOT_MODBUS_ADDRESS_BASE_OPTIONS: IotOption[] = [
  { label: 'PLC地址（从1开始）', value: '1' },
  { label: '协议地址（从0开始）', value: '0' }
];

function parseModbusAddressBase(json?: string): string {
  const params = parseConnectionParamsJson(json);
  const raw = params.addressBase ?? params.modbusAddressBase ?? params.pollAddressBase;
  if (raw === 0 || raw === '0' || String(raw).toLowerCase() === 'protocol' || String(raw).toLowerCase() === 'base0') {
    return '0';
  }
  return '1';
}

function mergeModbusAddressBase(json: string | undefined, addressBase: string): string {
  const params = parseConnectionParamsJson(json);
  delete params.addressOffset;
  delete params.modbusAddressBase;
  delete params.pollAddressBase;
  params.addressBase = Number(addressBase) === 0 ? 0 : 1;
  return JSON.stringify(params, null, 2);
}

/** Modbus TCP 设备连接参数示例（站号 + 地址编号） */
const IOT_MODBUS_TCP_PARAMS_EXAMPLE = `{
  "unit-identifier": 1,
  "addressBase": 1
}`;

const IOT_OPCUA_PARAMS_EXAMPLE = `{
  "discovery": false,
  "security-policy": "NONE",
  "message-security": "NONE"
}`;

const IOT_OPCUA_AUTH_TYPE_OPTIONS: IotOption[] = [
  { label: '匿名', value: 'anonymous' },
  { label: '用户名密码', value: 'username' }
];

const IOT_OPCUA_SECURITY_POLICY_OPTIONS: IotOption[] = [
  { label: 'None', value: 'NONE' },
  { label: 'Basic128Rsa15', value: 'Basic128Rsa15' },
  { label: 'Basic256', value: 'Basic256' },
  { label: 'Basic256Sha256', value: 'Basic256Sha256' },
  { label: 'Aes128 Sha256 RsaOaep', value: 'Aes128_Sha256_RsaOaep' },
  { label: 'Aes256 Sha256 RsaPss', value: 'Aes256_Sha256_RsaPss' }
];

const IOT_OPCUA_MESSAGE_SECURITY_OPTIONS: IotOption[] = [
  { label: 'None', value: 'NONE' },
  { label: 'Sign', value: 'SIGN' },
  { label: 'Sign & Encrypt', value: 'SIGN_ENCRYPT' }
];

interface OpcUaAuthForm {
  authType: 'anonymous' | 'username';
  username: string;
  password: string;
  securityPolicy: string;
  messageSecurity: string;
  discovery: boolean;
}

function createDefaultOpcUaAuth(): OpcUaAuthForm {
  return {
    authType: 'anonymous',
    username: '',
    password: '',
    securityPolicy: 'NONE',
    messageSecurity: 'NONE',
    discovery: false
  };
}

/** TCP Client 设备连接参数示例（帧参数；保活在设备表单单独配置） */
const IOT_TCP_CLIENT_PARAMS_EXAMPLE = `{
  "encoding": "UTF-8",
  "frameMode": "json",
  "soTimeout": 5000,
  "maxFrameBytes": 65536,
  "responseAsHex": false,
  "request": ""
}`;

/** TCP Client 保活表单（写入 connectionParamsJson） */
interface TcpClientHeartbeatForm {
  heartbeatEnable: boolean;
  heartbeat: string;
  heartbeatInterval: number;
  heartbeatWaitReply: boolean;
}

function createDefaultTcpHeartbeat(): TcpClientHeartbeatForm {
  return {
    heartbeatEnable: false,
    heartbeat: '',
    heartbeatInterval: 30000,
    heartbeatWaitReply: false
  };
}

/** 是否 TCP Client 原始帧采集（仅协议决定，传输链路 TCP_CLIENT 也用于 Modbus TCP） */
function isTcpClientProtocol(protocol?: string, _transportCode?: string): boolean {
  return normalizeProtocolValue(protocol) === 'tcp-client';
}

function isModbusProtocol(protocol?: string): boolean {
  return getProtocolGroup(protocol) === 'modbus';
}

function isOpcUaProtocol(protocol?: string): boolean {
  return normalizeProtocolValue(protocol) === 'opcua';
}

function isModbusFloatDataType(dataType?: string): boolean {
  const type = (dataType || '').toUpperCase();
  return type === 'FLOAT' || type === 'REAL' || type === 'DOUBLE' || type === 'LREAL';
}

/** 字节序表单项提示（对齐 Modbus Poll Float 字节序选项） */
function byteOrderFieldTip(protocol?: string, dataType?: string): string {
  if (isModbusProtocol(protocol) && isModbusFloatDataType(dataType)) {
    return 'Modbus REAL 占连续 2 个寄存器；默认 Float CD AB。值异常时先核对 Poll 原始寄存器与设备地址编号。';
  }
  if (isModbusProtocol(protocol) && ((dataType || '').toUpperCase() === 'STRING' || (dataType || '').toUpperCase() === 'CHAR')) {
    return '字符串乱序（如 42A7 显示为 247A）时尝试 CD AB。';
  }
  return '正数变负/数值异常时优先尝试 CD AB（32 位浮点/DINT）。';
}

function parseConnectionParamsJson(json?: string): Record<string, any> {
  if (!json || !String(json).trim()) return {};
  try {
    const obj = JSON.parse(json);
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
  } catch {
    return {};
  }
}

function compactJsonKey(key: string): string {
  return key.trim().replace(/[-_\s]/g, '').toLowerCase();
}

function getParamValue(params: Record<string, any>, keys: string[]): any {
  const compactKeys = keys.map(compactJsonKey);
  const matched = Object.keys(params).find((key) => compactKeys.includes(compactJsonKey(key)));
  return matched ? params[matched] : undefined;
}

function normalizeOpcUaSecurityPolicy(value?: any): string {
  const compact = String(value ?? 'NONE').replace(/[-_\s]/g, '').toLowerCase();
  const map: Record<string, string> = {
    none: 'NONE',
    basic128rsa15: 'Basic128Rsa15',
    basic256: 'Basic256',
    basic256sha256: 'Basic256Sha256',
    aes128sha256rsaoaep: 'Aes128_Sha256_RsaOaep',
    aes256sha256rsapss: 'Aes256_Sha256_RsaPss'
  };
  return map[compact] || String(value || 'NONE');
}

function normalizeOpcUaMessageSecurity(value?: any): string {
  const compact = String(value ?? 'NONE').replace(/[-_\s&]/g, '').toLowerCase();
  const map: Record<string, string> = {
    none: 'NONE',
    sign: 'SIGN',
    signencrypt: 'SIGN_ENCRYPT',
    signandencrypt: 'SIGN_ENCRYPT'
  };
  return map[compact] || String(value || 'NONE');
}

function isAnonymousOpcUaAuthValue(value: any): boolean {
  const compact = String(value ?? '').trim().replace(/[-_\s]/g, '').toLowerCase();
  return compact === 'anonymous' || compact === 'none' || compact === 'noauth';
}

function parseOpcUaAuth(json?: string): OpcUaAuthForm {
  const params = parseConnectionParamsJson(json);
  const authGroup = getParamValue(params, ['authentication', 'auth', 'identity', 'userIdentity', 'userIdentityToken']);
  const authParams = authGroup && typeof authGroup === 'object' && !Array.isArray(authGroup) ? authGroup : {};
  const username = getParamValue(authParams, ['username', 'userName', 'user', 'userId', 'account']) ?? getParamValue(params, ['username', 'userName', 'user', 'userId', 'account']);
  const password = getParamValue(authParams, ['password', 'pwd', 'pass']) ?? getParamValue(params, ['password', 'pwd', 'pass']);
  const authType = getParamValue(authParams, ['type', 'authType', 'identityType', 'loginMode']) ?? getParamValue(params, ['authType', 'authentication', 'identityType', 'loginMode']);
  const anonymous = getParamValue(params, ['anonymous']) === true || getParamValue(authParams, ['anonymous']) === true || isAnonymousOpcUaAuthValue(authType);
  return {
    authType: !anonymous && (username || password) ? 'username' : 'anonymous',
    username: username == null ? '' : String(username),
    password: password == null ? '' : String(password),
    securityPolicy: normalizeOpcUaSecurityPolicy(getParamValue(params, ['security-policy', 'securityPolicy'])),
    messageSecurity: normalizeOpcUaMessageSecurity(getParamValue(params, ['message-security', 'messageSecurity', 'messageSecurityMode', 'securityMode'])),
    discovery: getParamValue(params, ['discovery']) === true || String(getParamValue(params, ['discovery'])).toLowerCase() === 'true'
  };
}

function deleteParamsByAliases(params: Record<string, any>, keys: string[]) {
  const compactKeys = keys.map(compactJsonKey);
  Object.keys(params).forEach((key) => {
    if (compactKeys.includes(compactJsonKey(key))) {
      delete params[key];
    }
  });
}

function mergeOpcUaAuth(json: string | undefined, auth: OpcUaAuthForm): string {
  const params = parseConnectionParamsJson(json);
  deleteParamsByAliases(params, ['authentication', 'auth', 'authType', 'anonymous', 'identity', 'identityType', 'userIdentity', 'userIdentityType', 'userIdentityToken', 'loginMode']);
  deleteParamsByAliases(params, ['username', 'userName', 'user', 'userId', 'account', 'password', 'pwd', 'pass']);
  deleteParamsByAliases(params, ['security-policy', 'securityPolicy', 'message-security', 'messageSecurity', 'messageSecurityMode', 'securityMode']);
  params.discovery = !!auth.discovery;
  params['security-policy'] = normalizeOpcUaSecurityPolicy(auth.securityPolicy);
  params['message-security'] = normalizeOpcUaMessageSecurity(auth.messageSecurity);
  if (auth.authType === 'username') {
    params.username = auth.username.trim();
    params.password = auth.password;
  }
  return JSON.stringify(params, null, 2);
}

/** 从连接参数 JSON 解析保活字段 */
function parseTcpHeartbeat(json?: string): TcpClientHeartbeatForm {
  const params = parseConnectionParamsJson(json);
  const heartbeat = typeof params.heartbeat === 'string' ? params.heartbeat : '';
  const enable = typeof params.heartbeatEnable === 'boolean' ? params.heartbeatEnable : !!heartbeat;
  return {
    heartbeatEnable: enable,
    heartbeat,
    heartbeatInterval: Number(params.heartbeatInterval) > 0 ? Number(params.heartbeatInterval) : 30000,
    heartbeatWaitReply: !!params.heartbeatWaitReply
  };
}

/** 把保活字段 + 业务请求写回连接参数 JSON（保留其它帧参数） */
function mergeTcpHeartbeat(json: string | undefined, heartbeat: TcpClientHeartbeatForm, request?: string): string {
  const params = parseConnectionParamsJson(json);
  if (heartbeat.heartbeatEnable) {
    params.heartbeatEnable = true;
    params.heartbeatInterval = heartbeat.heartbeatInterval > 0 ? heartbeat.heartbeatInterval : 30000;
    params.heartbeatWaitReply = !!heartbeat.heartbeatWaitReply;
    if (heartbeat.heartbeat?.trim()) {
      params.heartbeat = heartbeat.heartbeat.trim();
    } else {
      delete params.heartbeat;
    }
  } else {
    delete params.heartbeatEnable;
    delete params.heartbeat;
    delete params.heartbeatInterval;
    delete params.heartbeatWaitReply;
  }
  if (request?.trim()) {
    params.request = request.trim();
  } else {
    delete params.request;
  }
  return JSON.stringify(params, null, 2);
}

/** 串口链路连接参数示例 */
const IOT_SERIAL_PARAMS_EXAMPLE = `{
  "baudRate": 9600,
  "dataBits": 8,
  "stopBits": 1,
  "parity": "NONE",
  "rs485": false
}`;
// ===== end iot-options =====

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const router = useRouter();
const { sys_normal_disable, iot_device_brand, iot_device_system_brand } = toRefs<any>(proxy?.useDict('sys_normal_disable', 'iot_device_brand', 'iot_device_system_brand'));

const deviceList = ref<DeviceVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const viewMode = ref<'card' | 'table'>('card');
const total = ref(0);
const ids = ref<Array<string | number>>([]);
const multiple = ref(true);
const actionId = ref<string | number>();
const actionType = ref<'test'>();
const copySubmitting = ref(false);
const copySource = ref<DeviceVO>();
const tcpHeartbeat = reactive<TcpClientHeartbeatForm>(createDefaultTcpHeartbeat());
const tcpRequest = ref('');
const modbusAddressBase = ref('1');
const opcUaAuth = reactive<OpcUaAuthForm>(createDefaultOpcUaAuth());
const formOnlineStatus = ref<string>('0');
const formLastOnlineTime = ref<string>('');

const dialog = reactive<DialogOption>({ visible: false, title: '' });
const copyDialog = reactive<DialogOption>({ visible: false, title: '复制采集设备' });
const pageOnlineCount = computed(() => deviceList.value.filter((d) => isOnline(d)).length);
const pageOfflineCount = computed(() => deviceList.value.length - pageOnlineCount.value);

const queryFormRef = ref<FormInstance>();
const formRef = ref<FormInstance>();
const copyFormRef = ref<FormInstance>();

const initForm: DeviceForm = {
  deviceCode: undefined,
  deviceName: undefined,
  deviceBrand: undefined,
  systemBrand: undefined,
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

const initCopyForm: DeviceCopyForm = {
  sourceDeviceId: undefined,
  deviceCode: undefined,
  deviceName: undefined,
  copyPoints: true
};

const copyForm = ref<DeviceCopyForm>({ ...initCopyForm });
const copyRules = {
  deviceCode: [{ required: true, message: '新设备编码不能为空', trigger: 'blur' }],
  deviceName: [{ required: true, message: '新设备名称不能为空', trigger: 'blur' }]
};
const copySourceText = computed(() => {
  if (!copySource.value) return '';
  return `${copySource.value.deviceName || ''}（${copySource.value.deviceCode || ''}）`;
});

const data = reactive<PageData<DeviceForm, DeviceQuery>>({
  form: { ...initForm },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deviceCode: undefined,
    deviceName: undefined,
    deviceBrand: undefined,
    systemBrand: undefined,
    protocol: undefined,
    onlineStatus: undefined,
    status: undefined
  },
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

const protocolLabel = (protocol?: string) => IOT_PROTOCOL_OPTIONS.find((item) => item.value === protocol)?.label || protocol || '-';

const isTcpClientRow = (row: DeviceVO) => isTcpClientProtocol(row.protocol);

const isTcpClient = computed(() => isTcpClientProtocol(form.value.protocol));
const isModbus = computed(() => isModbusProtocol(form.value.protocol));
const isOpcUa = computed(() => isOpcUaProtocol(form.value.protocol));
const isSerialLink = computed(() => isSerialTransport(form.value.transportCode));
const hostPlaceholder = computed(() => {
  if (isSerialLink.value) return '如 COM3 或 /dev/ttyUSB0';
  if (isTcpClient.value) return '设备 TCP Server IP';
  if (isOpcUa.value) return 'OPC UA Server IP';
  return 'IP/主机名';
});
const connectionParamsPlaceholder = computed(() => {
  if (isSerialLink.value) {
    return form.value.transportCode === 'SERIAL_RS485' ? IOT_SERIAL_PARAMS_EXAMPLE.replace('"rs485": false', '"rs485": true') : IOT_SERIAL_PARAMS_EXAMPLE;
  }
  if (isTcpClient.value) return IOT_TCP_CLIENT_PARAMS_EXAMPLE;
  if (isOpcUa.value) return IOT_OPCUA_PARAMS_EXAMPLE;
  if (isModbus.value) {
    return IOT_MODBUS_TCP_PARAMS_EXAMPLE;
  }
  return '如 {"unit-identifier":1}；Modbus 浮点字节序可在设备 JSON（floatByteOrder）或各点位 byteOrder 配置';
});

const syncTcpHeartbeatFromForm = () => {
  Object.assign(tcpHeartbeat, parseTcpHeartbeat(form.value.connectionParamsJson));
  const params = parseConnectionParamsJson(form.value.connectionParamsJson);
  tcpRequest.value = typeof params.request === 'string' ? params.request : '';
};

const applyTcpHeartbeatToForm = () => {
  if (!isTcpClient.value) return;
  form.value.connectionParamsJson = mergeTcpHeartbeat(form.value.connectionParamsJson, tcpHeartbeat, tcpRequest.value);
};

const applyTcpConnectionParamsToForm = () => {
  applyTcpHeartbeatToForm();
};

const syncOpcUaAuthFromForm = () => {
  Object.assign(opcUaAuth, parseOpcUaAuth(form.value.connectionParamsJson));
};

const applyOpcUaAuthToForm = () => {
  if (!isOpcUa.value) return;
  form.value.connectionParamsJson = mergeOpcUaAuth(form.value.connectionParamsJson, opcUaAuth);
};

const onOpcUaSecurityPolicyChange = () => {
  if (opcUaAuth.securityPolicy === 'NONE') {
    opcUaAuth.messageSecurity = 'NONE';
  } else if (opcUaAuth.messageSecurity === 'NONE') {
    opcUaAuth.messageSecurity = 'SIGN_ENCRYPT';
  }
  applyOpcUaAuthToForm();
};

/** 避免保活表单 ↔ JSON 双向同步互相覆盖 */
let syncingTcpConnectionParams = false;
let syncingOpcUaConnectionParams = false;

watch(
  tcpHeartbeat,
  () => {
    if (!isTcpClient.value || syncingTcpConnectionParams) return;
    syncingTcpConnectionParams = true;
    try {
      applyTcpHeartbeatToForm();
    } finally {
      syncingTcpConnectionParams = false;
    }
  },
  { deep: true }
);

watch(tcpRequest, () => {
  if (!isTcpClient.value || syncingTcpConnectionParams) return;
  syncingTcpConnectionParams = true;
  try {
    applyTcpHeartbeatToForm();
  } finally {
    syncingTcpConnectionParams = false;
  }
});

watch(
  opcUaAuth,
  () => {
    if (!isOpcUa.value || syncingOpcUaConnectionParams) return;
    syncingOpcUaConnectionParams = true;
    try {
      applyOpcUaAuthToForm();
    } finally {
      syncingOpcUaConnectionParams = false;
    }
  },
  { deep: true }
);

const onConnectionParamsJsonChange = () => {
  if (isTcpClient.value && !syncingTcpConnectionParams) {
    syncingTcpConnectionParams = true;
    try {
      syncTcpHeartbeatFromForm();
    } finally {
      syncingTcpConnectionParams = false;
    }
  }
  if (isOpcUa.value && !syncingOpcUaConnectionParams) {
    syncingOpcUaConnectionParams = true;
    try {
      syncOpcUaAuthFromForm();
    } finally {
      syncingOpcUaConnectionParams = false;
    }
  }
};

const syncModbusAddressBaseFromForm = () => {
  modbusAddressBase.value = parseModbusAddressBase(form.value.connectionParamsJson);
};

const applyModbusAddressBaseToForm = () => {
  if (!isModbus.value || isTcpClient.value) return;
  form.value.connectionParamsJson = mergeModbusAddressBase(form.value.connectionParamsJson, modbusAddressBase.value);
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
    syncModbusAddressBaseFromForm();
  } else if (protocol === 'modbus-tcp') {
    if (isTcpTransport(form.value.transportCode)) {
      form.value.transportCode = undefined;
    }
    if (!form.value.port) form.value.port = 502;
    if (!form.value.connectionParamsJson) {
      form.value.connectionParamsJson = IOT_MODBUS_TCP_PARAMS_EXAMPLE;
    }
    syncModbusAddressBaseFromForm();
  } else if (protocol === 'opcua') {
    if (isTcpTransport(form.value.transportCode)) {
      form.value.transportCode = undefined;
    }
    if (!form.value.port) form.value.port = 4840;
    if (!form.value.connectionParamsJson) {
      form.value.connectionParamsJson = IOT_OPCUA_PARAMS_EXAMPLE;
    }
    syncOpcUaAuthFromForm();
  }
};

const onTransportChange = (value?: string) => {
  const transport = normalizeTransportValue(value);
  form.value.transportCode = transport || undefined;
  const protocol = normalizeProtocolValue(form.value.protocol);
  if (isTcpTransport(transport)) {
    if (protocol === 'tcp-client' || !protocol) {
      if (!form.value.protocol) {
        form.value.protocol = 'tcp-client';
      }
      form.value.connectionUrl = undefined;
      if (!form.value.port) form.value.port = 9000;
      if (!form.value.connectionParamsJson) {
        form.value.connectionParamsJson = IOT_TCP_CLIENT_PARAMS_EXAMPLE;
      }
      syncTcpHeartbeatFromForm();
    } else if (protocol === 'modbus-tcp') {
      if (!form.value.port) form.value.port = 502;
      if (!form.value.connectionParamsJson) {
        form.value.connectionParamsJson = IOT_MODBUS_TCP_PARAMS_EXAMPLE;
      }
      syncModbusAddressBaseFromForm();
    }
  } else if (isSerialTransport(transport)) {
    form.value.port = undefined;
    form.value.connectionUrl = undefined;
    if (!form.value.connectionParamsJson) {
      form.value.connectionParamsJson = transport === 'SERIAL_RS485' ? IOT_SERIAL_PARAMS_EXAMPLE.replace('"rs485": false', '"rs485": true') : IOT_SERIAL_PARAMS_EXAMPLE;
    }
    if (protocol.startsWith('modbus')) {
      syncModbusAddressBaseFromForm();
    }
  }
};

const formatEndpoint = (row: DeviceVO) => {
  if (row.host && row.port) return `${row.host}:${row.port}`;
  if (row.host) return row.host;
  if (row.connectionUrl) return row.connectionUrl;
  return '-';
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
  tcpRequest.value = '';
  modbusAddressBase.value = '1';
  Object.assign(opcUaAuth, createDefaultOpcUaAuth());
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
  syncModbusAddressBaseFromForm();
  syncOpcUaAuthFromForm();
  dialog.visible = true;
  dialog.title = '修改采集设备';
};

const handleCopy = (row: DeviceVO) => {
  copySource.value = row;
  copyForm.value = {
    sourceDeviceId: row.id,
    deviceCode: `${row.deviceCode || ''}_COPY`,
    deviceName: `${row.deviceName || ''}-复制`,
    copyPoints: true
  };
  copyDialog.visible = true;
  copyDialog.title = '复制采集设备';
};

const submitCopy = () => {
  copyFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    copySubmitting.value = true;
    try {
      await copyDevice(copyForm.value);
      proxy?.$modal.msgSuccess('复制成功');
      copyDialog.visible = false;
      await getList();
    } finally {
      copySubmitting.value = false;
    }
  });
};

const goPoints = (row: DeviceVO) => {
  router.push({ path: '/iot/point', query: { deviceId: String(row.id), deviceName: row.deviceName } });
};

const goInjectionDisplay = (row?: DeviceVO) => {
  router.push({ path: '/iot/injection-display', query: row?.id ? { deviceId: String(row.id) } : {} });
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
    if (isOpcUa.value) {
      if (opcUaAuth.authType === 'username' && !opcUaAuth.username.trim()) {
        proxy?.$modal.msgError('OPC UA 用户名不能为空');
        return;
      }
      applyOpcUaAuthToForm();
      if (!form.value.port) form.value.port = 4840;
    }
    applyModbusAddressBaseToForm();
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
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s;

  &:hover,
  &:focus-visible {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
    outline: none;
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
