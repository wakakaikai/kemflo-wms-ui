import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { RouterForm, RouterQuery, RouterVO } from '@/api/mes/router/types';

export const listRouter = (query?: RouterQuery): AxiosPromise<RouterVO[]> => {
  return request({
    url: '/mes/router/list',
    method: 'get',
    params: query
  });
};

export const getRouter = (id: string | number): AxiosPromise<RouterVO> => {
  return request({
    url: '/mes/router/' + id,
    method: 'get'
  });
};

export const addRouter = (data: RouterForm) => {
  return request({
    url: '/mes/router',
    method: 'post',
    data
  });
};

export const updateRouter = (data: RouterForm) => {
  return request({
    url: '/mes/router',
    method: 'put',
    data
  });
};

export const delRouter = (id: string | number | Array<string | number>) => {
  return request({
    url: '/mes/router/' + id,
    method: 'delete'
  });
};
