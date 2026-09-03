import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { SfcFixedSfcVO, SfcFixedSfcForm, SfcFixedSfcQuery } from '@/api/mes/sfcFixedSfc/types';

export const listSfcFixedSfc = (query?: SfcFixedSfcQuery): AxiosPromise<SfcFixedSfcVO[]> => {
  return request({
    url: '/mes/sfcFixedSfc/list',
    method: 'get',
    params: query
  });
};

export const getSfcFixedSfc = (id: string | number): AxiosPromise<SfcFixedSfcVO> => {
  return request({
    url: '/mes/sfcFixedSfc/' + id,
    method: 'get'
  });
};

export const addSfcFixedSfc = (data: SfcFixedSfcForm) => {
  return request({
    url: '/mes/sfcFixedSfc',
    method: 'post',
    data: data
  });
};

export const updateSfcFixedSfc = (data: SfcFixedSfcForm) => {
  return request({
    url: '/mes/sfcFixedSfc',
    method: 'put',
    data: data
  });
};

export const delSfcFixedSfc = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/sfcFixedSfc/' + id,
    method: 'delete'
  });
};
