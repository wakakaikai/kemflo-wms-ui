import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { SerialPortVo } from '@/api/mes/serialPort/types';

export const serialPortApi = {
  /**
   * 获取可用串口列表
   */
  getAvailablePorts(): AxiosPromise<SerialPortVo[]> {
    return request({
      url: '/mes/serialPort/ports',
      method: 'get'
    });
  },

  /**
   * 打开串口
   */
  openPort(data: SerialPortVo): AxiosPromise<any> {
    return request({
      url: '/mes/serialPort/open',
      method: 'post',
      data: data
    });
  },

  /**
   * 关闭串口
   */
  closePort(): AxiosPromise<any> {
    return request({
      url: '/mes/serialPort/close',
      method: 'post'
    });
  },

  /**
   * 发送文本数据
   * @param data 要发送的文本
   */
  sendText(data: SerialPortVo): AxiosPromise<any> {
    return request({
      url: '/mes/serialPort/send',
      method: 'post',
      data: data
    });
  },

  /**
   * 发送十六进制数据
   * @param data 十六进制字符串(如"41 42 43")
   */
  sendHex(data: SerialPortVo): AxiosPromise<any> {
    return request({
      url: '/mes/serialPort/send-hex',
      method: 'post',
      data: data
    });
  }
};
