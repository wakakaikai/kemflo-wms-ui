import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { MessageTitleRecipientVO, MessageTitleRecipientForm, MessageTitleRecipientQuery } from '@/api/mes/messageTitleRecipient/types';

/**
 * 查询消息主题接收列表
 * @param query
 * @returns {*}
 */

export const listMessageTitleRecipient = (query?: MessageTitleRecipientQuery): AxiosPromise<MessageTitleRecipientVO[]> => {
  return request({
    url: '/mes/messageTitleRecipient/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询消息主题接收详细
 * @param id
 */
export const getMessageTitleRecipient = (id: string | number): AxiosPromise<MessageTitleRecipientVO> => {
  return request({
    url: '/mes/messageTitleRecipient/' + id,
    method: 'get'
  });
};

/**
 * 新增消息主题接收
 * @param data
 */
export const addMessageTitleRecipient = (data: MessageTitleRecipientForm) => {
  return request({
    url: '/mes/messageTitleRecipient',
    method: 'post',
    data: data
  });
};

/**
 * 修改消息主题接收
 * @param data
 */
export const updateMessageTitleRecipient = (data: MessageTitleRecipientForm) => {
  return request({
    url: '/mes/messageTitleRecipient',
    method: 'put',
    data: data
  });
};

/**
 * 删除消息主题接收
 * @param id
 */
export const delMessageTitleRecipient = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/messageTitleRecipient/' + id,
    method: 'delete'
  });
};
