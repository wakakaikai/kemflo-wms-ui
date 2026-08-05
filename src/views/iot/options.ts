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
  { label: 'EtherNet/IP', value: 'eip' }
];

export const IOT_TRANSPORT_OPTIONS: IotOption[] = [
  { label: 'tcp', value: 'tcp' },
  { label: 'udp', value: 'udp' },
  { label: 'serial', value: 'serial' }
];

export const IOT_ONLINE_STATUS_OPTIONS: IotOption[] = [
  { label: '离线', value: '0', elTagType: 'info' },
  { label: '在线', value: '1', elTagType: 'success' }
];

export const IOT_DATA_TYPE_OPTIONS: IotOption[] = [
  { label: '整型', value: 'INT' },
  { label: '浮点', value: 'FLOAT' },
  { label: '布尔', value: 'BOOL' },
  { label: '字符串', value: 'STRING' }
];

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
    eip: 'eip'
  };
  return map[key] || map[compact] || key;
}
