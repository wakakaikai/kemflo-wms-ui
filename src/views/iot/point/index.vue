<template>
  <div class="p-2 point-page">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover" class="search-card">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item v-if="!routeDeviceId" label="设备" prop="deviceId">
              <el-select v-model="queryParams.deviceId" clearable filterable placeholder="全部设备" style="width: 200px" @change="handleQuery">
                <el-option v-for="item in deviceOptions" :key="toIdStr(item.id)" :label="item.deviceName" :value="toIdStr(item.id)" />
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
            <el-button v-if="routeDeviceId" class="back-btn" type="primary" link icon="ArrowLeft" @click="router.push('/iot/device')"> 返回设备 </el-button>
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
                <el-button v-hasPermi="['iot:device:query']" type="success" plain icon="DataLine" :loading="reading" :disabled="!currentDeviceId" @click="handleRead"> 读取采集 </el-button>
              </span>
            </el-tooltip>
            <el-button v-hasPermi="['iot:point:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
            <el-button v-hasPermi="['iot:point:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()"> 删除 </el-button>
            <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="pointList" border stripe class="point-table" @selection-change="handleSelectionChange">
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
        <el-table-column v-if="isModbusDeviceList" label="功能码" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <span class="poll-fc-label" :title="modbusFunctionHintFromTag(scope.row.tagAddress)">
              {{ modbusFunctionLabelFromTag(scope.row.tagAddress) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column v-if="isModbusDeviceList" label="数据格式" width="130" show-overflow-tooltip>
          <template #default="scope">
            {{ plcFormatLabel(scope.row.displayFormat, scope.row.byteOrder, scope.row.dataType) }}
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
                {{ formatPointValue(scope.row) }}
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

    <IotReadCollectDialog v-model:visible="readDialog.visible" :title="readDialog.title" :rows="readDialog.rows" :refreshing="reading" :empty-text="isTcpClientDevice ? '暂无命令数据，请先配置命令点位或直接在设备页采集' : '暂无点位数据，请先配置点位'" @refresh="handleRead" />

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="760px" destroy-on-close append-to-body class="point-dialog">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-alert v-if="isTcpClientDevice" class="mb-3" type="warning" :closable="false" show-icon title="TCP Client 命令点位" description="此处配置业务命令报文，不是 Modbus 寄存器。保活命令请在「设备」编辑页的 TCP 保活中设置。" />
        <div class="form-section">
          <div class="form-section__title">基础信息</div>
          <el-row :gutter="16">
            <el-col v-if="!routeDeviceId" :span="24">
              <el-form-item label="设备" prop="deviceId">
                <el-select v-model="form.deviceId" filterable placeholder="请选择设备" style="width: 100%" @change="onDeviceChange">
                  <el-option v-for="item in deviceOptions" :key="toIdStr(item.id)" :label="item.deviceName" :value="toIdStr(item.id)" />
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
          </el-row>
        </div>

        <!-- Modbus 读写定义 -->
        <div v-if="protocolGroup === 'modbus'" class="form-section poll-section">
          <div class="form-section__title">读写定义</div>
          <div class="poll-rw-grid">
            <div class="poll-rw-row">
              <label class="poll-rw-label">功能码：</label>
              <el-select v-model="modbusFunction" class="poll-rw-control poll-fc-select" @change="onModbusFunctionChange">
                <el-option v-for="item in IOT_MODBUS_FUNCTION_OPTIONS" :key="item.value" :label="item.label" :value="item.value">
                  <div class="poll-fc-option">
                    <span class="poll-fc-option__en">{{ item.label }}</span>
                    <span class="poll-fc-option__zh">{{ item.hint }}</span>
                  </div>
                </el-option>
              </el-select>
              <span class="poll-rw-hint">{{ modbusFunctionHintText }}</span>
            </div>
            <div class="poll-rw-row">
              <label class="poll-rw-label">地址：</label>
              <el-input-number v-model="addrBuilder.address" class="poll-rw-control poll-rw-number" :min="0" :max="65535" :step="1" controls-position="right" @change="syncModbusAddress" />
              <span class="poll-rw-hint">0 起算。{{ modbusHumanAddrHint }}；Float 占 2 个连续寄存器</span>
            </div>
            <div class="poll-rw-row">
              <label class="poll-rw-label">数量：</label>
              <el-input-number v-model="modbusQuantity" class="poll-rw-control poll-rw-number" :min="1" :max="form.dataType === 'STRING' ? 254 : 999" :step="1" :disabled="!quantityEditable" controls-position="right" @change="onModbusQuantityChange" />
              <span class="poll-rw-hint">{{ registerQuantityHint }}</span>
            </div>
          </div>
          <div class="poll-addr-preview">
            点位地址：<code>{{ form.tagAddress || generatedAddress || '—' }}</code>
          </div>
        </div>

        <!-- 数据格式（Format 与数据类型合并，选项英文） -->
        <div v-if="!isTcpClientDevice" class="form-section poll-section">
          <div class="form-section__title">数据格式</div>
          <el-row :gutter="16">
            <el-col v-if="showPlcFormat" :span="16">
              <el-form-item label="数据类型" prop="plcFormat">
                <el-select v-model="plcFormat" class="poll-format-select" style="width: 100%" placeholder="Float CD AB" @change="onPlcFormatChange">
                  <el-option-group v-for="(group, gi) in pollUnifiedFormatGroups" :key="gi" :label="group.label" class="poll-format-group">
                    <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
                  </el-option-group>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="showPlcFormat ? 8 : 24">
              <el-form-item label="读写" prop="rwMode">
                <el-select v-model="form.rwMode" style="width: 100%">
                  <el-option v-for="item in IOT_READ_WRITE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- S7 / TCP / 其它协议地址 -->
        <div v-if="protocolGroup !== 'modbus' && protocolGroup !== 'other'" class="form-section">
          <div class="form-section__title">{{ isTcpClientDevice ? '命令配置' : '地址配置' }}</div>
          <el-row :gutter="16">
            <el-col :span="24">
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
                        <el-input v-model="addrBuilder.tcpRequest" :disabled="!addrAutoGenerate" placeholder="text:STATUS? 或 hex:01 03 00 00 00 01" @input="syncGeneratedAddress" />
                      </div>
                    </el-col>
                  </el-row>

                  <el-row v-else :gutter="12">
                    <el-col :span="10">
                      <div class="addr-field">
                        <span class="addr-field__label">区类型</span>
                        <el-select v-model="addrBuilder.area" style="width: 100%" :disabled="!addrAutoGenerate" @change="syncGeneratedAddress">
                          <el-option v-for="item in addressAreaOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                      </div>
                    </el-col>
                    <el-col v-if="protocolGroup === 's7' && addrBuilder.area === 'DB'" :span="7">
                      <div class="addr-field">
                        <span class="addr-field__label">DB 号</span>
                        <el-input-number v-model="addrBuilder.dbNumber" :min="1" :step="1" controls-position="right" style="width: 100%" :disabled="!addrAutoGenerate" @change="syncGeneratedAddress" />
                      </div>
                    </el-col>
                    <el-col v-if="protocolGroup === 's7'" :span="7">
                      <div class="addr-field">
                        <span class="addr-field__label">字节偏移</span>
                        <el-input-number v-model="addrBuilder.byteOffset" :min="0" :step="1" controls-position="right" style="width: 100%" :disabled="!addrAutoGenerate" @change="syncGeneratedAddress" />
                      </div>
                    </el-col>
                    <el-col v-if="protocolGroup === 's7' && form.dataType === 'BOOL'" :span="7">
                      <div class="addr-field">
                        <span class="addr-field__label">位偏移</span>
                        <el-input-number v-model="addrBuilder.bitOffset" :min="0" :max="7" :step="1" controls-position="right" style="width: 100%" :disabled="!addrAutoGenerate" @change="syncGeneratedAddress" />
                      </div>
                    </el-col>
                    <el-col v-if="form.dataType === 'STRING'" :span="7">
                      <div class="addr-field">
                        <span class="addr-field__label">字符串长度</span>
                        <el-input-number v-model="addrBuilder.stringLength" :min="1" :max="254" :step="1" controls-position="right" style="width: 100%" :disabled="!addrAutoGenerate" @change="syncGeneratedAddress" />
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
                <el-input v-model="form.tagAddress" :placeholder="addressPlaceholder" :readonly="addrAutoGenerate" @input="onTagAddressManualInput" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div v-if="protocolGroup === 'other'" class="form-section">
          <div class="form-section__title">点位地址</div>
          <el-form-item label="地址" prop="tagAddress">
            <el-input v-model="form.tagAddress" placeholder="请输入协议对应点位地址" />
          </el-form-item>
        </div>

        <div class="form-section">
          <div class="form-section__title">换算与展示</div>
          <el-row :gutter="16">
            <el-col v-if="isNumericPoint" :span="12">
              <el-form-item label="系数" prop="scaleFactor">
                <el-input-number v-model="form.scaleFactor" :step="0.1" controls-position="right" style="width: 100%" />
                <div class="form-tip">数值类型：采集值 = 原始值 × 系数</div>
              </el-form-item>
            </el-col>
            <el-col v-if="isNumericPoint" :span="12">
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
import IotReadCollectDialog from '@/views/iot/components/IotReadCollectDialog.vue';

// ===== iot-options (inlined) =====
/** IoT 前端写死选项（PLC4X 协议编码） */

interface IotOption {
  label: string;
  value: string;
  elTagType?: string;
}

const IOT_PROTOCOL_OPTIONS: IotOption[] = [
  { label: 'Modbus TCP', value: 'modbus-tcp' },
  { label: 'Modbus RTU', value: 'modbus-rtu' },
  { label: 'Siemens S7', value: 's7' },
  { label: 'OPC UA', value: 'opcua' },
  { label: 'EtherNet/IP', value: 'eip' },
  { label: 'TCP Client', value: 'tcp-client' }
];

/** 传输链路协议（iot_device.transport_code） */
const IOT_TRANSPORT_OPTIONS: IotOption[] = [
  { label: 'TCP 客户端', value: 'TCP_CLIENT' },
  { label: 'RS232 串口', value: 'SERIAL_RS232' },
  { label: 'RS485 串口', value: 'SERIAL_RS485' }
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
  return (
    TRANSPORT_ALIAS_MAP[raw] ||
    TRANSPORT_ALIAS_MAP[key] ||
    TRANSPORT_ALIAS_MAP[compact] ||
    TRANSPORT_ALIAS_MAP[raw.toUpperCase()] ||
    raw
  );
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

function plcFmt(
  label: string,
  value: string,
  dataType: string,
  displayFormat: string,
  byteOrder: string
): IotPlcFormatOption {
  return { label, value, dataType, displayFormat, byteOrder };
}

const POLL_FMT_INT_OPTIONS: IotPlcFormatOption[] = [
  plcFmt('Signed', 'SIGNED', 'INT', 'SIGNED', 'ABCD'),
  plcFmt('Unsigned', 'UNSIGNED', 'UINT', 'UNSIGNED', 'ABCD'),
  plcFmt('Hex', 'HEX', 'INT', 'HEX', 'ABCD'),
  plcFmt('Binary', 'BINARY', 'INT', 'BINARY', 'ABCD')
];

const POLL_FMT_LONG_OPTIONS: IotPlcFormatOption[] = [
  plcFmt('Long AB CD', 'LONG_ABCD', 'DINT', 'SIGNED', 'ABCD'),
  plcFmt('Long CD AB', 'LONG_CDAB', 'DINT', 'SIGNED', 'CDAB'),
  plcFmt('Long BA DC', 'LONG_BADC', 'DINT', 'SIGNED', 'BADC'),
  plcFmt('Long DC BA', 'LONG_DCBA', 'DINT', 'SIGNED', 'DCBA')
];

const POLL_FMT_FLOAT_OPTIONS: IotPlcFormatOption[] = [
  plcFmt('Float AB CD', 'FLOAT_ABCD', 'FLOAT', 'SIGNED', 'ABCD'),
  plcFmt('Float CD AB', 'FLOAT_CDAB', 'FLOAT', 'SIGNED', 'CDAB'),
  plcFmt('Float BA DC', 'FLOAT_BADC', 'FLOAT', 'SIGNED', 'BADC'),
  plcFmt('Float DC BA', 'FLOAT_DCBA', 'FLOAT', 'SIGNED', 'DCBA')
];

const POLL_FMT_DOUBLE_OPTIONS: IotPlcFormatOption[] = [
  plcFmt('Double AB CD EF GH', 'DOUBLE_ABCDEFGH', 'DOUBLE', 'SIGNED', 'ABCDEFGH'),
  plcFmt('Double GH EF CD AB', 'DOUBLE_GHEFCDAB', 'DOUBLE', 'SIGNED', 'GHEFCDAB'),
  plcFmt('Double BA DC FE HG', 'DOUBLE_BADCFEHG', 'DOUBLE', 'SIGNED', 'BADCFEHG'),
  plcFmt('Double HG FE DC BA', 'DOUBLE_HGFEDCBA', 'DOUBLE', 'SIGNED', 'HGFEDCBA')
];

const POLL_FMT_STRING_OPTIONS: IotPlcFormatOption[] = [
  plcFmt('String AB CD', 'STR_ABCD', 'STRING', 'SIGNED', 'ABCD'),
  plcFmt('String CD AB', 'STR_CDAB', 'STRING', 'SIGNED', 'CDAB')
];

const POLL_UNIFIED_FORMAT_OPTIONS: IotPlcFormatOption[] = [
  ...POLL_FMT_INT_OPTIONS,
  ...POLL_FMT_LONG_OPTIONS,
  ...POLL_FMT_FLOAT_OPTIONS,
  ...POLL_FMT_DOUBLE_OPTIONS,
  ...POLL_FMT_STRING_OPTIONS
];

/** Poll 完整 Format 分组（选项英文，与 Modbus Poll 菜单一致） */
function resolvePollUnifiedFormatGroups(): IotPlcFormatGroup[] {
  return [
    { label: '整数 (INT)', options: POLL_FMT_INT_OPTIONS },
    { label: '长整型 (DINT)', options: POLL_FMT_LONG_OPTIONS },
    { label: '浮点 (FLOAT)', options: POLL_FMT_FLOAT_OPTIONS },
    { label: '双精度 (DOUBLE)', options: POLL_FMT_DOUBLE_OPTIONS },
    { label: '字符串 (STRING)', options: POLL_FMT_STRING_OPTIONS }
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

/** 反查 Poll Format 值 */
function encodePlcFormat(displayFormat?: string, byteOrder?: string, dataType?: string): string {
  const type = normalizePlcDataType(dataType);
  const display = (displayFormat || 'SIGNED').toUpperCase();
  const order = (byteOrder || defaultByteOrder(dataType)).toUpperCase();

  const exact = POLL_UNIFIED_FORMAT_OPTIONS.find(
    (o) =>
      normalizePlcDataType(o.dataType) === type &&
      o.displayFormat.toUpperCase() === display &&
      o.byteOrder.toUpperCase() === order
  );
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

/** Poll Format 值 → 数据类型 + displayFormat + byteOrder */
function decodePlcFormat(
  formatValue: string,
  _dataType?: string,
  current?: { dataType?: string; displayFormat?: string; byteOrder?: string }
): { dataType: string; displayFormat: string; byteOrder: string } {
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
  const key = value.trim().toLowerCase().replace(/[\s_]+/g, '-');
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

/** TCP Client 设备连接参数示例（帧参数；保活在设备表单单独配置） */
const IOT_TCP_CLIENT_PARAMS_EXAMPLE = `{
  "encoding": "UTF-8",
  "frameMode": "json",
  "soTimeout": 5000,
  "maxFrameBytes": 65536,
  "responseAsHex": false
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

function isModbusFloatDataType(dataType?: string): boolean {
  const type = (dataType || '').toUpperCase();
  return type === 'FLOAT' || type === 'REAL' || type === 'DOUBLE' || type === 'LREAL';
}

/** 字节序表单项提示（对齐 Modbus Poll Float 字节序选项） */
function byteOrderFieldTip(protocol?: string, dataType?: string): string {
  if (isModbusProtocol(protocol) && isModbusFloatDataType(dataType)) {
    return 'Modbus REAL 占连续 2 个寄存器；默认 Float CD AB。值异常时先核对 Poll 原始寄存器与设备「地址编号」。';
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

/** 从连接参数 JSON 解析保活字段 */
function parseTcpHeartbeat(json?: string): TcpClientHeartbeatForm {
  const params = parseConnectionParamsJson(json);
  const heartbeat = typeof params.heartbeat === 'string' ? params.heartbeat : '';
  const enable =
    typeof params.heartbeatEnable === 'boolean'
      ? params.heartbeatEnable
      : !!heartbeat;
  return {
    heartbeatEnable: enable,
    heartbeat,
    heartbeatInterval: Number(params.heartbeatInterval) > 0 ? Number(params.heartbeatInterval) : 30000,
    heartbeatWaitReply: !!params.heartbeatWaitReply
  };
}

/** 把保活字段写回连接参数 JSON（保留其它帧参数） */
function mergeTcpHeartbeat(json: string | undefined, heartbeat: TcpClientHeartbeatForm): string {
  const params = parseConnectionParamsJson(json);
  if (heartbeat.heartbeatEnable && heartbeat.heartbeat?.trim()) {
    params.heartbeatEnable = true;
    params.heartbeat = heartbeat.heartbeat.trim();
    params.heartbeatInterval = heartbeat.heartbeatInterval > 0 ? heartbeat.heartbeatInterval : 30000;
    params.heartbeatWaitReply = !!heartbeat.heartbeatWaitReply;
  } else {
    delete params.heartbeatEnable;
    delete params.heartbeat;
    delete params.heartbeatInterval;
    delete params.heartbeatWaitReply;
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
const currentDevice = ref<DeviceVO | null>(null);
const modbusFunction = ref('holding-register');
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
const isModbusDeviceList = computed(() => protocolGroup.value === 'modbus');
const isTcpClientDevice = computed(() => protocolGroup.value === 'tcp');
const protocolLabel = computed(() => IOT_PROTOCOL_OPTIONS.find((item) => item.value === normalizeProtocolValue(selectedProtocol.value))?.label || selectedProtocol.value || '未知协议');
const addressAreaOptions = computed(() => (protocolGroup.value === 's7' ? IOT_S7_AREA_OPTIONS : IOT_MODBUS_AREA_OPTIONS));
const addressPlaceholder = computed(() => {
  if (protocolGroup.value === 'modbus') return '例如 holding-register:1740:REAL（占 1740-1741 两寄存器）或 holding-register:1:CHAR[10]';
  if (protocolGroup.value === 's7') return '例如 %DB1.DBD0:REAL';
  if (protocolGroup.value === 'tcp') return '例如 text:STATUS? 或 hex:01 03 00 00 00 01（非 Modbus 寄存器）';
  return '请输入协议对应点位地址';
});

/** 设备 ID 统一按字符串处理，避免雪花 ID 被 Number 精度丢失 */
const toIdStr = (id?: string | number | null | (string | null)[]) => {
  if (id == null || id === '') return '';
  const raw = Array.isArray(id) ? id[0] : id;
  if (raw == null || raw === '') return '';
  return String(raw);
};

const initForm: PointForm = {
  deviceId: toIdStr(route.query.deviceId as string) || undefined,
  pointCode: undefined,
  pointName: undefined,
  tagAddress: undefined,
  dataType: 'FLOAT',
  displayFormat: 'SIGNED',
  byteOrder: 'CDAB',
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
    pageSize: 50,
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

const pollUnifiedFormatGroups = resolvePollUnifiedFormatGroups();
const showPlcFormat = computed(() => {
  const type = (form.value.dataType || '').toUpperCase();
  return !!type && type !== 'BOOL';
});
const isNumericPoint = computed(() => isNumericDataType(form.value.dataType));
const isModbusBitArea = computed(() => {
  const area = (addrBuilder.area || '').toLowerCase();
  return area === 'coil' || area === 'discrete-input';
});
const quantityEditable = computed(() => !isModbusBitArea.value && form.value.dataType !== 'BOOL');
const registerQuantityHint = computed(() => {
  const q = modbusQuantity.value;
  const auto = resolveModbusRegisterQuantity(form.value.dataType, addrBuilder.stringLength);
  if (form.value.dataType === 'STRING') {
    return quantityDirty.value ? `字符串占 ${q} 个寄存器（已手动调整）` : `随 Format 联动；字符串占 ${q} 个寄存器，可手动调整`;
  }
  if (form.value.dataType === 'BOOL') return '线圈/离散点固定为 1';
  if (quantityDirty.value) return `已手动设为 ${q}（Format 默认 ${auto}）`;
  if (q === 1) return '随 Format 默认：1 个寄存器（16 位），可手动调整';
  if (q === 2) return '随 Format 默认：2 个连续寄存器（32 位），可手动调整';
  if (q === 4) return '随 Format 默认：4 个连续寄存器（64 位），可手动调整';
  return `随 Format 默认：${q} 个寄存器，可手动调整`;
});
const modbusHumanAddrHint = computed(() => modbusHumanAddress(addrBuilder.address));
const modbusFunctionHintText = computed(() => modbusFunctionHint(modbusFunction.value));

const modbusQuantity = ref(2);
const quantityDirty = ref(false);
const plcFormat = ref('FLOAT_CDAB');

function syncModbusQuantityFromFormat() {
  modbusQuantity.value = resolveModbusRegisterQuantity(form.value.dataType, addrBuilder.stringLength);
}

function onModbusQuantityChange(val: number | undefined) {
  if (val == null) return;
  quantityDirty.value = true;
  if (form.value.dataType === 'STRING') {
    addrBuilder.stringLength = val;
    syncModbusAddress();
  }
}

watch(
  () => [form.value.dataType, addrBuilder.stringLength, plcFormat.value, isModbusBitArea.value] as const,
  () => {
    if (!quantityDirty.value) {
      syncModbusQuantityFromFormat();
    }
  },
  { immediate: true }
);

const syncPlcFormatFromForm = () => {
  plcFormat.value = encodePlcFormat(form.value.displayFormat, form.value.byteOrder, form.value.dataType);
};

const onPlcFormatChange = (value: string) => {
  const next = decodePlcFormat(value, undefined, {
    dataType: form.value.dataType,
    displayFormat: form.value.displayFormat,
    byteOrder: form.value.byteOrder
  });
  form.value.dataType = next.dataType;
  form.value.displayFormat = next.displayFormat;
  form.value.byteOrder = next.byteOrder;
  quantityDirty.value = false;
  syncModbusQuantityFromFormat();
  if (protocolGroup.value === 'modbus') {
    syncModbusAddress();
  } else {
    syncGeneratedAddress();
  }
};

const qualityStats = computed(() => {
  const rows = pointList.value;
  return {
    good: rows.filter((r) => r.quality === 'GOOD').length,
    uncertain: rows.filter((r) => r.quality === 'UNCERTAIN').length,
    bad: rows.filter((r) => r.quality === 'BAD').length
  };
});

const optionLabel = (options: { label: string; value: string }[], value?: string) => options.find((o) => o.value === value)?.label || value || '—';

const rwModeLabel = (value?: string) => optionLabel(IOT_READ_WRITE_OPTIONS, value);
const qualityLabel = (value?: string) => optionLabel(IOT_QUALITY_OPTIONS, value);

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
const formatValue = (value?: unknown) => {
  if (value == null || value === '') return '—';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return String(value);
    const abs = Math.abs(value);
    if (abs > 0 && (abs < 1e-4 || abs >= 1e8)) return value.toPrecision(6);
    return value.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 6 });
  }
  const text = String(value).trim();
  if (!text) return '—';
  if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(text)) return text;
  const num = Number(text);
  if (!Number.isFinite(num)) return text;
  const abs = Math.abs(num);
  if (abs > 0 && (abs < 1e-4 || abs >= 1e8)) {
    return num.toPrecision(6);
  }
  return num.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 6 });
};
/** 数值类型当前值 = 原始值 × 系数 */
const formatPointValue = (row: PointVO) => {
  if (isEmptyValue(row.currentValue)) return '—';
  const scaled = applyNumericScale(row.currentValue, row.dataType, row.scaleFactor);
  return formatValue(scaled);
};

const attachPointScaleMeta = async (deviceId: string | number | undefined, rows: PointReadItem[]): Promise<PointReadItem[]> => {
  let points = pointList.value;
  if (deviceId) {
    try {
      const pointRes = await listPoint({ deviceId, pageNum: 1, pageSize: 500 });
      points = ((pointRes as any).rows ?? []) as PointVO[];
    } catch {
      /* 回退当前列表 */
    }
  }
  const byCode = new Map(points.map((p) => [p.pointCode, p]));
  return (rows || []).map((row) => {
    const point = byCode.get(row.pointCode);
    if (!point) return row;
    return {
      ...row,
      dataType: point.dataType ?? row.dataType,
      scaleFactor: point.scaleFactor ?? row.scaleFactor
    };
  });
};

const resolveDeviceName = (row: PointVO) => {
  if (row.deviceName) return row.deviceName;
  const matched = deviceOptions.value.find((item) => toIdStr(item.id) === toIdStr(row.deviceId));
  return matched?.deviceName || toIdStr(row.deviceId) || '—';
};

const resolveDeviceProtocol = async (deviceId?: string | number) => {
  const id = toIdStr(deviceId);
  if (!id) {
    selectedProtocol.value = '';
    currentDevice.value = null;
    return;
  }
  const cached = deviceOptions.value.find((item) => toIdStr(item.id) === id);
  if (cached?.protocol) {
    selectedProtocol.value = normalizeProtocolValue(cached.protocol);
  }
  try {
    const res = await getDevice(id);
    selectedProtocol.value = normalizeProtocolValue(res.data?.protocol);
    currentDevice.value = res.data || null;
    if (res.data) {
      const idx = deviceOptions.value.findIndex((item) => toIdStr(item.id) === id);
      if (idx >= 0) {
        deviceOptions.value[idx] = { ...deviceOptions.value[idx], ...res.data };
      } else {
        deviceOptions.value.push(res.data);
      }
    }
  } catch {
    if (!cached?.protocol) selectedProtocol.value = '';
    currentDevice.value = cached || null;
  }
};

const syncModbusAddress = () => {
  if (protocolGroup.value !== 'modbus') return;
  const address = generatedAddress.value;
  if (address) form.value.tagAddress = address;
};

const onModbusFunctionChange = () => {
  addrBuilder.area = modbusFunction.value;
  if (isModbusBitArea.value) {
    form.value.dataType = 'BOOL';
    quantityDirty.value = false;
    syncModbusQuantityFromFormat();
  } else if (form.value.dataType === 'BOOL') {
    plcFormat.value = 'FLOAT_CDAB';
    onPlcFormatChange('FLOAT_CDAB');
    return;
  }
  syncModbusAddress();
};

const resetAddressBuilder = (tagAddress?: string) => {
  const next = parsePlcTagAddress(selectedProtocol.value, tagAddress, form.value.dataType);
  Object.assign(addrBuilder, next);
  if (protocolGroup.value === 'modbus') {
    modbusFunction.value = modbusAreaToFunction(addrBuilder.area);
  }
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
  quantityDirty.value = false;
  await resolveDeviceProtocol(form.value.deviceId);
  resetAddressBuilder();
  syncGeneratedAddress();
  plcFormat.value = defaultPlcFormat(form.value.dataType);
  if (protocolGroup.value === 'modbus') {
    modbusFunction.value = modbusAreaToFunction(addrBuilder.area);
    syncModbusAddress();
  }
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
    deviceId: toIdStr(res.data?.deviceId) || undefined,
    displayFormat: res.data?.displayFormat || 'SIGNED',
    byteOrder: res.data?.byteOrder || defaultByteOrder(res.data?.dataType)
  };
  await resolveDeviceProtocol(form.value.deviceId);
  resetAddressBuilder(form.value.tagAddress);
  addrAutoGenerate.value = false;
  syncPlcFormatFromForm();
  quantityDirty.value = false;
  syncModbusQuantityFromFormat();
  syncModbusAddress();
  dialog.visible = true;
  dialog.title = '修改点位';
};

const syncFormFromPlcFormat = () => {
  const next = decodePlcFormat(plcFormat.value, undefined, {
    dataType: form.value.dataType,
    displayFormat: form.value.displayFormat,
    byteOrder: form.value.byteOrder
  });
  form.value.dataType = next.dataType;
  form.value.displayFormat = next.displayFormat;
  form.value.byteOrder = next.byteOrder;
};

const submitForm = () => {
  if (protocolGroup.value === 'modbus') {
    syncFormFromPlcFormat();
    syncModbusAddress();
    if (generatedAddress.value) {
      form.value.tagAddress = generatedAddress.value;
    }
  }
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
    readDialog.rows = await attachPointScaleMeta(currentDeviceId.value, (res.data || []) as PointReadItem[]);
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

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.poll-section {
  background: #fff;
}

.poll-rw-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.poll-rw-row {
  display: grid;
  grid-template-columns: 88px minmax(160px, 280px) 1fr;
  align-items: center;
  gap: 12px;
}

.poll-rw-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-align: right;
}

.poll-rw-control {
  width: 100%;
}

.poll-rw-number {
  max-width: 280px;
}

.poll-rw-hint {
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

.poll-addr-preview {
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border: 1px dashed var(--el-border-color);

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: var(--el-color-primary);
  }
}

.poll-fc-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.poll-fc-select :deep(.el-select__selected-item) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

.poll-fc-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.poll-fc-option__en {
  flex-shrink: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.poll-fc-option__zh {
  flex: 1;
  text-align: right;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.poll-format-select :deep(.el-select-group__title) {
  padding: 6px 12px 4px;
  font-size: 12px;
  line-height: 18px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  border-top: 1px solid var(--el-border-color-lighter);
}

.poll-format-select :deep(.el-select-group:first-child .el-select-group__title) {
  border-top: none;
  padding-top: 2px;
}

.poll-format-select :deep(.el-select-dropdown__item) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

@media (max-width: 640px) {
  .poll-rw-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .poll-rw-label {
    text-align: left;
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
