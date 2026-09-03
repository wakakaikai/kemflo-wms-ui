import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { SfcBomVO, SfcBomForm, SfcBomQuery } from '@/api/mes/sfcBom/types';

export const listSfcBom = (query?: SfcBomQuery): AxiosPromise<SfcBomVO[]> => {
  return request({
    url: '/mes/sfcBom/list',
    method: 'get',
    params: query
  });
};

export const getSfcBom = (id: string | number): AxiosPromise<SfcBomVO> => {
  return request({
    url: '/mes/sfcBom/' + id,
    method: 'get'
  });
};

export const addSfcBom = (data: SfcBomForm) => {
  return request({
    url: '/mes/sfcBom',
    method: 'post',
    data: data
  });
};

export const updateSfcBom = (data: SfcBomForm) => {
  return request({
    url: '/mes/sfcBom',
    method: 'put',
    data: data
  });
};

export const delSfcBom = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/sfcBom/' + id,
    method: 'delete'
  });
};
