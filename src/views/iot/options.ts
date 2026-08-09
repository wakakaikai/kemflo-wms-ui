/** IoT 前端写死选项（PLC4X 协议编码） */

export interface IotOption {
  label: string;
  value: string;
  elTagType?: string;
}

export const IOT_PROTOCOL_OPTIONS: IotOption[] = [
  { label: 'Modbus TCP', value: 'modbus-tcp' },
  { label: 'Modbus RTU', value: 'modbus-rtu' },
  { label: 'Siemens S7', value: 's7' },
  { label: 'OPC UA', value: 'opcua' },
  { label: 'EtherNet/IP', value: 'eip' },
  { label: 'TCP Client', value: 'tcp-client' }
];

/** 传输链路协议（iot_device.transport_code） */
export const IOT_TRANSPORT_OPTIONS: IotOption[] = [
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

export function normalizeTransportValue(value?: string): string {
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

export function isTcpTransport(value?: string): boolean {
  return normalizeTransportValue(value) === 'TCP_CLIENT';
}

export function isSerialTransport(value?: string): boolean {
  const v = normalizeTransportValue(value);
  return v === 'SERIAL_RS232' || v === 'SERIAL_RS485';
}

export const IOT_ONLINE_STATUS_OPTIONS: IotOption[] = [
  { label: '离线', value: '0', elTagType: 'info' },
  { label: '在线', value: '1', elTagType: 'success' }
];

export const IOT_DATA_TYPE_OPTIONS: IotOption[] = [
  { label: 'INT(16位有符号)', value: 'INT' },
  { label: 'UINT(16位无符号)', value: 'UINT' },
  { label: 'DINT(32位有符号)', value: 'DINT' },
  { label: 'UDINT(32位无符号)', value: 'UDINT' },
  { label: 'FLOAT/REAL(32位浮点)', value: 'FLOAT' },
  { label: 'DOUBLE/LREAL(64位浮点)', value: 'DOUBLE' },
  { label: '布尔', value: 'BOOL' },
  { label: '字符串', value: 'STRING' }
];

/** 显示格式（对齐 Modbus Poll） */
export const IOT_DISPLAY_FORMAT_OPTIONS: IotOption[] = [
  { label: '有符号', value: 'SIGNED' },
  { label: '无符号', value: 'UNSIGNED' },
  { label: '十六进制', value: 'HEX' },
  { label: '二进制', value: 'BINARY' }
];

/** Modbus Poll Format（数据类型 + 格式 + 字节序合一，选项英文） */
export interface IotPlcFormatOption {
  label: string;
  value: string;
  dataType: string;
  displayFormat: string;
  byteOrder: string;
}

export interface IotPlcFormatGroup {
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

export const POLL_UNIFIED_FORMAT_OPTIONS: IotPlcFormatOption[] = [
  ...POLL_FMT_INT_OPTIONS,
  ...POLL_FMT_LONG_OPTIONS,
  ...POLL_FMT_FLOAT_OPTIONS,
  ...POLL_FMT_DOUBLE_OPTIONS,
  ...POLL_FMT_STRING_OPTIONS
];

/** Poll 完整 Format 分组（选项英文，与 Modbus Poll 菜单一致） */
export function resolvePollUnifiedFormatGroups(): IotPlcFormatGroup[] {
  return [
    { label: '\u200b', options: POLL_FMT_INT_OPTIONS },
    { label: '\u200b', options: POLL_FMT_LONG_OPTIONS },
    { label: '\u200b', options: POLL_FMT_FLOAT_OPTIONS },
    { label: '\u200b', options: POLL_FMT_DOUBLE_OPTIONS },
    { label: '\u200b', options: POLL_FMT_STRING_OPTIONS }
  ];
}

export function resolvePlcFormatGroups(_dataType?: string): IotPlcFormatGroup[] {
  return resolvePollUnifiedFormatGroups();
}

export function flattenPlcFormatOptions(_dataType?: string): IotPlcFormatOption[] {
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
export function encodePlcFormat(displayFormat?: string, byteOrder?: string, dataType?: string): string {
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
export function decodePlcFormat(
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

export function defaultPlcFormat(_dataType?: string): string {
  return 'FLOAT_CDAB';
}

export function plcFormatFieldTip(protocol?: string, dataType?: string): string {
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
export const IOT_BYTE_ORDER_32_OPTIONS: IotOption[] = [
  { label: 'Long AB CD / Float AB CD', value: 'ABCD' },
  { label: 'Long CD AB / Float CD AB', value: 'CDAB' },
  { label: 'Long BA DC / Float BA DC', value: 'BADC' },
  { label: 'Long DC BA / Float DC BA', value: 'DCBA' }
];

/** 16 位寄存器字节序 */
export const IOT_BYTE_ORDER_16_OPTIONS: IotOption[] = [
  { label: 'AB（默认）', value: 'ABCD' },
  { label: 'BA（字节交换）', value: 'BA' }
];

/** 64 位双精度字节序 */
export const IOT_BYTE_ORDER_64_OPTIONS: IotOption[] = [
  { label: 'Double AB CD EF GH', value: 'ABCDEFGH' },
  { label: 'Double GH EF CD AB', value: 'GHEFCDAB' },
  { label: 'Double BA DC FE HG', value: 'BADCFEHG' },
  { label: 'Double HG FE DC BA', value: 'HGFEDCBA' }
];

export function resolveByteOrderOptions(dataType?: string): IotOption[] {
  const type = (dataType || '').toUpperCase();
  if (type === 'DOUBLE' || type === 'LREAL') return IOT_BYTE_ORDER_64_OPTIONS;
  if (type === 'FLOAT' || type === 'REAL' || type === 'DINT' || type === 'UDINT' || type === 'LONG' || type === 'DWORD') {
    return IOT_BYTE_ORDER_32_OPTIONS;
  }
  if (type === 'STRING' || type === 'CHAR') return IOT_BYTE_ORDER_32_OPTIONS;
  if (type === 'INT' || type === 'UINT' || type === 'WORD' || type === 'SHORT') return IOT_BYTE_ORDER_16_OPTIONS;
  return IOT_BYTE_ORDER_32_OPTIONS;
}

export function defaultByteOrder(dataType?: string): string {
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

export const IOT_READ_WRITE_OPTIONS: IotOption[] = [
  { label: '只读', value: 'R' },
  { label: '只写', value: 'W' },
  { label: '读写', value: 'RW' }
];

export const IOT_QUALITY_OPTIONS: IotOption[] = [
  { label: '良好', value: 'GOOD', elTagType: 'success' },
  { label: '不确定', value: 'UNCERTAIN', elTagType: 'warning' },
  { label: '不良', value: 'BAD', elTagType: 'danger' }
];

/** Modbus 功能码（Poll 英文 + 中文说明） */
export interface IotModbusFunctionOption {
  /** Poll 英文标签 */
  label: string;
  /** 中文说明 */
  hint: string;
  value: string;
}

export const IOT_MODBUS_FUNCTION_OPTIONS: IotModbusFunctionOption[] = [
  { label: '01 Read Coils (0x)', hint: '读线圈，位地址 0x 区', value: 'coil' },
  { label: '02 Read Discrete Inputs (1x)', hint: '读离散输入，位地址 1x 区', value: 'discrete-input' },
  { label: '03 Read Holding Registers (4x)', hint: '读保持寄存器，4x 区（最常用）', value: 'holding-register' },
  { label: '04 Read Input Registers (3x)', hint: '读输入寄存器，3x 区', value: 'input-register' }
];

export function modbusFunctionHint(value?: string): string {
  const hit = IOT_MODBUS_FUNCTION_OPTIONS.find((o) => o.value === (value || '').toLowerCase());
  return hit?.hint || '';
}

export function modbusAreaToFunction(area?: string): string {
  const hit = IOT_MODBUS_FUNCTION_OPTIONS.find((o) => o.value === (area || '').toLowerCase());
  return hit?.value || 'holding-register';
}

export function modbusFunctionToArea(func?: string): string {
  const hit = IOT_MODBUS_FUNCTION_OPTIONS.find((o) => o.value === func);
  return hit?.value || 'holding-register';
}

export function parseModbusAreaFromTag(tagAddress?: string): string {
  const match = (tagAddress || '').trim().match(/^(holding-register|input-register|coil|discrete-input)/i);
  return match ? match[1].toLowerCase() : 'holding-register';
}

export function modbusFunctionLabelFromTag(tagAddress?: string): string {
  const area = parseModbusAreaFromTag(tagAddress);
  return IOT_MODBUS_FUNCTION_OPTIONS.find((o) => o.value === area)?.label || area;
}

export function modbusFunctionHintFromTag(tagAddress?: string): string {
  const area = parseModbusAreaFromTag(tagAddress);
  return modbusFunctionHint(area);
}

/** Poll Quantity：本点位占用的寄存器/线圈数量 */
export function resolveModbusRegisterQuantity(dataType?: string, stringLength = 10): number {
  const type = (dataType || '').toUpperCase();
  if (type === 'BOOL') return 1;
  if (type === 'INT' || type === 'UINT' || type === 'WORD') return 1;
  if (type === 'FLOAT' || type === 'REAL' || type === 'DINT' || type === 'UDINT' || type === 'LONG' || type === 'DWORD') return 2;
  if (type === 'DOUBLE' || type === 'LREAL') return 4;
  if (type === 'STRING' || type === 'CHAR') return Math.max(1, Number(stringLength) || 1);
  return 1;
}

/** 人类可读 Format 标签（列表/预览） */
export function plcFormatLabel(displayFormat?: string, byteOrder?: string, dataType?: string): string {
  const key = encodePlcFormat(displayFormat, byteOrder, dataType);
  const hit = flattenPlcFormatOptions(dataType).find((o) => o.value === key);
  return hit?.label || key;
}

/** 协议地址 ↔ PLC 4x/3x 人类地址（均从 1 起算） */
export function modbusHumanAddress(protocolAddress: number): string {
  const addr = Math.max(0, Number(protocolAddress) || 0);
  return `4x ${40001 + addr} / 3x ${30001 + addr}`;
}

/** Poll 窗口：列起始地址 + 行号(0起) → 协议地址；Float 占 start+row 与 start+row+1 */
export function modbusPollRowAddress(columnStart: number, row: number): number {
  return Math.max(0, Number(columnStart) || 0) + Math.max(0, Number(row) || 0);
}

/** Modbus 地址区类型 */
export const IOT_MODBUS_AREA_OPTIONS: IotOption[] = [
  { label: '保持寄存器 (4x)', value: 'holding-register' },
  { label: '输入寄存器 (3x)', value: 'input-register' },
  { label: '线圈 (0x)', value: 'coil' },
  { label: '离散输入 (1x)', value: 'discrete-input' }
];

/** Siemens S7 地址区类型 */
export const IOT_S7_AREA_OPTIONS: IotOption[] = [
  { label: '数据块 DB', value: 'DB' },
  { label: '输入 I', value: 'I' },
  { label: '输出 Q', value: 'Q' },
  { label: '标志位 M', value: 'M' }
];

export type IotAddressProtocolGroup = 'modbus' | 's7' | 'tcp' | 'other';

export interface IotAddressBuilder {
  area: string;
  /** Poll 列头 / 协议起始地址（0 起） */
  address: number;
  /** Poll 行号（0 起），实际地址 = address + pollRowOffset */
  pollRowOffset: number;
  dbNumber: number;
  byteOffset: number;
  bitOffset: number;
  stringLength: number;
  /** TCP Client 请求报文 */
  tcpRequest: string;
}

export function normalizeProtocolValue(value?: string): string {
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

export function getProtocolGroup(protocol?: string): IotAddressProtocolGroup {
  const value = normalizeProtocolValue(protocol);
  if (value.startsWith('modbus')) return 'modbus';
  if (value === 's7') return 's7';
  if (value === 'tcp-client') return 'tcp';
  return 'other';
}

export function createDefaultAddressBuilder(protocol?: string, dataType?: string): IotAddressBuilder {
  const group = getProtocolGroup(protocol);
  if (group === 'modbus') {
    return {
      area: dataType === 'BOOL' ? 'coil' : 'holding-register',
      address: 0,
      pollRowOffset: 0,
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
      pollRowOffset: 0,
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
      pollRowOffset: 0,
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
    pollRowOffset: 0,
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
export function buildPlcTagAddress(protocol: string | undefined, dataType: string | undefined, builder: IotAddressBuilder): string {
  const group = getProtocolGroup(protocol);
  const rowOffset = Math.max(0, Number(builder.pollRowOffset) || 0);
  const address = Math.max(0, Number(builder.address) || 0) + rowOffset;
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
export function parsePlcTagAddress(protocol: string | undefined, tagAddress?: string, dataType?: string): IotAddressBuilder {
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
        pollRowOffset: 0,
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

/** Modbus TCP 设备连接参数示例（站号 + 可选全局浮点字节序） */
export const IOT_MODBUS_TCP_PARAMS_EXAMPLE = `{
  "unit-identifier": 1,
  "floatByteOrder": "CDAB",
  "addressOffset": 0
}`;

/** TCP Client 设备连接参数示例（帧参数；保活在设备表单单独配置） */
export const IOT_TCP_CLIENT_PARAMS_EXAMPLE = `{
  "encoding": "UTF-8",
  "frameMode": "json",
  "soTimeout": 5000,
  "maxFrameBytes": 65536,
  "responseAsHex": false
}`;

/** TCP Client 保活表单（写入 connectionParamsJson） */
export interface TcpClientHeartbeatForm {
  heartbeatEnable: boolean;
  heartbeat: string;
  heartbeatInterval: number;
  heartbeatWaitReply: boolean;
}

export function createDefaultTcpHeartbeat(): TcpClientHeartbeatForm {
  return {
    heartbeatEnable: false,
    heartbeat: '',
    heartbeatInterval: 30000,
    heartbeatWaitReply: false
  };
}

/** 是否 TCP Client 原始帧采集（仅协议决定，传输链路 TCP_CLIENT 也用于 Modbus TCP） */
export function isTcpClientProtocol(protocol?: string, _transportCode?: string): boolean {
  return normalizeProtocolValue(protocol) === 'tcp-client';
}

export function isModbusProtocol(protocol?: string): boolean {
  return getProtocolGroup(protocol) === 'modbus';
}

export function isModbusFloatDataType(dataType?: string): boolean {
  const type = (dataType || '').toUpperCase();
  return type === 'FLOAT' || type === 'REAL' || type === 'DOUBLE' || type === 'LREAL';
}

/** 字节序表单项提示（对齐 Modbus Poll Float 字节序选项） */
export function byteOrderFieldTip(protocol?: string, dataType?: string): string {
  if (isModbusProtocol(protocol) && isModbusFloatDataType(dataType)) {
    return 'Modbus REAL 占连续 2 个寄存器；默认 AB CD。Poll 选 Float AB CD→ABCD；Float CD AB→CDAB。值极小/正负反时先核对 Poll 原始寄存器，再调 byteOrder 或设备 addressOffset(-1)。';
  }
  if (isModbusProtocol(protocol) && ((dataType || '').toUpperCase() === 'STRING' || (dataType || '').toUpperCase() === 'CHAR')) {
    return '字符串乱序（如 42A7 显示为 247A）时尝试 CD AB。';
  }
  return '正数变负/数值异常时优先尝试 CD AB（32 位浮点/DINT）。';
}

export function parseConnectionParamsJson(json?: string): Record<string, any> {
  if (!json || !String(json).trim()) return {};
  try {
    const obj = JSON.parse(json);
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
  } catch {
    return {};
  }
}

/** 从连接参数 JSON 解析保活字段 */
export function parseTcpHeartbeat(json?: string): TcpClientHeartbeatForm {
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
export function mergeTcpHeartbeat(json: string | undefined, heartbeat: TcpClientHeartbeatForm): string {
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
export const IOT_SERIAL_PARAMS_EXAMPLE = `{
  "baudRate": 9600,
  "dataBits": 8,
  "stopBits": 1,
  "parity": "NONE",
  "rs485": false
}`;
