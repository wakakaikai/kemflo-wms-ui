import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { NcCodeVO, NcCodeForm, NcCodeQuery } from '@/api/mes/ncCode/types';

export const listNcCode = (query?: NcCodeQuery): AxiosPromise<NcCodeVO[]> => {
  return request({
    url: '/mes/ncCode/list',
    method: 'get',
    params: query
  });
};

export const getNcCode = (id: string | number): AxiosPromise<NcCodeVO> => {
  return request({
    url: '/mes/ncCode/' + id,
    method: 'get'
  });
};

export const addNcCode = (data: NcCodeForm) => {
  return request({
    url: '/mes/ncCode',
    method: 'post',
    data: data
  });
};

export const updateNcCode = (data: NcCodeForm) => {
  return request({
    url: '/mes/ncCode',
    method: 'put',
    data: data
  });
};

export const delNcCode = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/ncCode/' + id,
    method: 'delete'
  });
};
