import request from '@/utils/request';
import type { AxiosPromise } from 'axios';
import type { NcGroupVO, NcGroupForm, NcGroupQuery, NcGroupMemberVO, NcGroupMemberForm, NcGroupMemberQuery } from './types';
import type { NcCodeVO } from '@/api/mes/ncCode/types';

// 后端 PageQuery 不传分页参数时返回全部数据，避免穿梭框只显示第一页。
export const listNcGroup = (query?: NcGroupQuery): AxiosPromise<NcGroupVO[]> => {
  return request({
    url: '/mes/group/list',
    method: 'get',
    params: query
  });
};

export const getNcGroup = (id: string | number): AxiosPromise<NcGroupVO> => request({ url: '/mes/group/' + id, method: 'get' });
export const addNcGroup = (data: NcGroupForm) => request({ url: '/mes/group', method: 'post', data });
export const updateNcGroup = (data: NcGroupForm) => request({ url: '/mes/group', method: 'put', data });
export const delNcGroup = (ids: string | number | Array<string | number>) => request({ url: '/mes/group/' + ids, method: 'delete' });
export const listNcGroupCodeOptions = (): AxiosPromise<NcCodeVO[]> => request({ url: '/mes/group/code-options', method: 'get' });

export const listNcGroupMember = (query: NcGroupMemberQuery): AxiosPromise<NcGroupMemberVO[]> => {
  return request({
    url: '/mes/groupMember/list',
    method: 'get',
    params: query
  });
};

export const addNcGroupMember = (data: NcGroupMemberForm) => {
  return request({
    url: '/mes/groupMember',
    method: 'post',
    data
  });
};

export const delNcGroupMember = (ids: Array<string | number>) => {
  return request({
    url: '/mes/groupMember/' + ids.join(','),
    method: 'delete'
  });
};
