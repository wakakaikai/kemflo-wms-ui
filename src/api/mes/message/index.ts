import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { MessageVO, MessageForm, MessageQuery } from '@/api/mes/message/types';

/**
 * 查询消息主表列表
 * @param query
 * @returns {*}
 */

export const listMessage = (query?: MessageQuery): AxiosPromise<MessageVO[]> => {
  return request({
    url: '/mes/message/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询消息主表详细
 * @param id
 */
export const getMessage = (id: string | number): AxiosPromise<MessageVO> => {
  return request({
    url: '/mes/message/' + id,
    method: 'get'
  });
};

/**
 * 新增消息主表
 * @param data
 */
export const addMessage = (data: MessageForm) => {
  return request({
    url: '/mes/message',
    method: 'post',
    data: data
  });
};

/**
 * 修改消息主表
 * @param data
 */
export const updateMessage = (data: MessageForm) => {
  return request({
    url: '/mes/message',
    method: 'put',
    data: data
  });
};

/**
 * 删除消息主表
 * @param id
 */
export const delMessage = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/message/' + id,
    method: 'delete'
  });
};
/**
 * 标记消息已读
 * @param messageIds
 */
export const markMessageAsRead = (messageIds: string | number | Array<string | number>) => {
  return request({
    url: '/mes/message/markAsRead/' + messageIds,
    method: 'put'
  });
};
/**
 * 获取接收到的消息列表
 * @param query
 */
export const queryReceivedMessageList = (query?: MessageQuery): AxiosPromise<MessageVO[]> => {
  return request({
    url: '/mes/message/received/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询工作中心工作岗位异常呼叫列表
 * @param query
 * @returns {*}
 */

export const queryWorkCenterAbnormalCallList = (query?: MessageQuery): AxiosPromise<MessageVO[]> => {
  return request({
    url: '/mes/message/workStation/abnormalCall',
    method: 'get',
    params: query
  });
};
export const queryAbnormalCallScada = (query?: any) => {
  return request({
    url: '/mes/message/abnormalCallScada',
    method: 'get',
    params: query
  });
};

/**
 * 新增消息主表
 * @param data
 */
export const saveEquipmentAbnormalCall = (data: MessageForm) => {
  return request({
    url: '/mes/message/equipmentAbnormalCall',
    method: 'post',
    data: data
  });
};
