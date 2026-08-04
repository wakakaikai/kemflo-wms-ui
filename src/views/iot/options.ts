/** IoT 字典兜底选项 */

export interface IotDictOption {
  label: string;
  value: string;
  elTagType?: string;
}

export const IOT_ONLINE_STATUS_OPTIONS: IotDictOption[] = [
  { label: '离线', value: '0', elTagType: 'info' },
  { label: '在线', value: '1', elTagType: 'success' }
];

export const IOT_COMMAND_STATUS_OPTIONS: IotDictOption[] = [
  { label: '待发送', value: 'PENDING', elTagType: 'info' },
  { label: '已发送', value: 'SENT', elTagType: 'primary' },
  { label: '成功', value: 'SUCCESS', elTagType: 'success' },
  { label: '失败', value: 'FAILED', elTagType: 'danger' }
];

export const IOT_PROTOCOL_OPTIONS: IotDictOption[] = [
  { label: 'MQTT', value: 'MQTT' },
  { label: 'ModbusTCP', value: 'ModbusTCP' },
  { label: 'ModbusRTU', value: 'ModbusRTU' },
  { label: 'OPC-UA', value: 'OPC-UA' },
  { label: 'HTTP', value: 'HTTP' }
];

export const IOT_CONNECTION_TYPE_OPTIONS: IotDictOption[] = [
  { label: 'MQTT', value: 'MQTT' },
  { label: 'TCP', value: 'TCP' },
  { label: '串口', value: 'SERIAL' },
  { label: 'HTTP', value: 'HTTP' }
];

export const IOT_DATA_TYPE_OPTIONS: IotDictOption[] = [
  { label: '整型', value: 'INT' },
  { label: '浮点', value: 'FLOAT' },
  { label: '布尔', value: 'BOOL' },
  { label: '字符串', value: 'STRING' }
];

export const IOT_READ_WRITE_OPTIONS: IotDictOption[] = [
  { label: '只读', value: 'R' },
  { label: '只写', value: 'W' },
  { label: '读写', value: 'RW' }
];

export const IOT_QUALITY_OPTIONS: IotDictOption[] = [
  { label: '良好', value: 'GOOD', elTagType: 'success' },
  { label: '不确定', value: 'UNCERTAIN', elTagType: 'warning' },
  { label: '不良', value: 'BAD', elTagType: 'danger' }
];

export function resolveDictOptions(dictOptions: any, fallback: IotDictOption[]): IotDictOption[] {
  return Array.isArray(dictOptions) && dictOptions.length > 0 ? dictOptions : fallback;
}
