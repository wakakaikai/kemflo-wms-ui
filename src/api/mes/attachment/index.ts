import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { AttachmentVO, AttachmentForm, AttachmentQuery } from '@/api/mes/attachment/types';

/**
 * 查询附加项主表列表
 * @param query
 * @returns {*}
 */

export const listAttachment = (query?: AttachmentQuery): AxiosPromise<AttachmentVO[]> => {
  return request({
    url: '/mes/attachment/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询附加项主表详细
 * @param id
 */
export const getAttachment = (id: string | number): AxiosPromise<AttachmentVO> => {
  return request({
    url: '/mes/attachment/' + id,
    method: 'get'
  });
};

/**
 * 新增附加项主表
 * @param data
 */
export const addAttachment = (data: AttachmentForm) => {
  return request({
    url: '/mes/attachment',
    method: 'post',
    data: data
  });
};

/**
 * 修改附加项主表
 * @param data
 */
export const updateAttachment = (data: AttachmentForm) => {
  return request({
    url: '/mes/attachment',
    method: 'put',
    data: data
  });
};

/**
 * 删除附加项主表
 * @param id
 */
export const delAttachment = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/attachment/' + id,
    method: 'delete'
  });
};
