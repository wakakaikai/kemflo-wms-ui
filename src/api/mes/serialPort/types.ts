export interface SerialPortVo {
  portName: string;
  portDesc: string;
  baudRate: number;
}
export interface SerialPortQuery extends PageQuery {
  portName: string;
  portDesc: string;
  baudRate: number;
}
