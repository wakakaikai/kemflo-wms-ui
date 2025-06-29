import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { MessageRecipientVO, MessageRecipientForm, MessageRecipientQuery } from '@/api/mes/messageRecipient/types';

/**
 * 查询消息接收列表
 * @param query
 * @returns {*}
 */

export const listMessageRecipient = (query?: MessageRecipientQuery): AxiosPromise<MessageRecipientVO[]> => {
  return request({
    url: '/mes/messageRecipient/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询消息接收详细
 * @param id
 */
export const getMessageRecipient = (id: string | number): AxiosPromise<MessageRecipientVO> => {
  return request({
    url: '/mes/messageRecipient/' + id,
    method: 'get'
  });
};

/**
 * 新增消息接收
 * @param data
 */
export const addMessageRecipient = (data: MessageRecipientForm) => {
  return request({
    url: '/mes/messageRecipient',
    method: 'post',
    data: data
  });
};

/**
 * 修改消息接收
 * @param data
 */
export const updateMessageRecipient = (data: MessageRecipientForm) => {
  return request({
    url: '/mes/messageRecipient',
    method: 'put',
    data: data
  });
};

/**
 * 删除消息接收
 * @param id
 */
export const delMessageRecipient = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/messageRecipient/' + id,
    method: 'delete'
  });
};
