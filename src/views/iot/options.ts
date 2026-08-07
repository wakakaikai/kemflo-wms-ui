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
  { label: 'Signed 有符号', value: 'SIGNED' },
  { label: 'Unsigned 无符号', value: 'UNSIGNED' },
  { label: 'Hex 十六进制', value: 'HEX' },
  { label: 'Binary 二进制', value: 'BINARY' }
];

/** 16/32 位字节序 */
export const IOT_BYTE_ORDER_32_OPTIONS: IotOption[] = [
  { label: 'AB CD（大端）', value: 'ABCD' },
  { label: 'CD AB（字交换，常用）', value: 'CDAB' },
  { label: 'BA DC（字节交换）', value: 'BADC' },
  { label: 'DC BA（小端）', value: 'DCBA' }
];

/** 16 位寄存器字节序 */
export const IOT_BYTE_ORDER_16_OPTIONS: IotOption[] = [
  { label: 'AB（默认）', value: 'ABCD' },
  { label: 'BA（字节交换）', value: 'BA' }
];

/** 64 位双精度字节序 */
export const IOT_BYTE_ORDER_64_OPTIONS: IotOption[] = [
  { label: 'AB CD EF GH', value: 'ABCDEFGH' },
  { label: 'GH EF CD AB（常用）', value: 'GHEFCDAB' },
  { label: 'BA DC FE HG', value: 'BADCFEHG' },
  { label: 'HG FE DC BA', value: 'HGFEDCBA' }
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
  if (type === 'FLOAT' || type === 'REAL' || type === 'DINT' || type === 'UDINT' || type === 'STRING' || type === 'CHAR') {
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

/** Modbus 地址区类型 */
export const IOT_MODBUS_AREA_OPTIONS: IotOption[] = [
  { label: '保持寄存器 holding-register', value: 'holding-register' },
  { label: '输入寄存器 input-register', value: 'input-register' },
  { label: '线圈 coil', value: 'coil' },
  { label: '离散输入 discrete-input', value: 'discrete-input' }
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
  address: number;
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
      address: 1,
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
export function buildPlcTagAddress(protocol: string | undefined, dataType: string | undefined, builder: IotAddressBuilder): string {
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
    const match = text.match(/^(holding-register|input-register|coil|discrete-input):(\d+)(?::(?:CHAR\[(\d+)\]|STRING\((\d+)\)))?/i);
    if (match) {
      return {
        ...defaults,
        area: match[1].toLowerCase(),
        address: Number(match[2]),
        stringLength: Number(match[3] || match[4] || defaults.stringLength)
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

export function isTcpClientProtocol(protocol?: string, transportCode?: string): boolean {
  return normalizeProtocolValue(protocol) === 'tcp-client' || isTcpTransport(transportCode);
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
