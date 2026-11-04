import axios, { AxiosPromise } from 'axios';
import request from '@/utils/request';
import { globalHeaders } from '@/utils/request';
import { OssQuery, OssVO } from './types';

const baseURL = import.meta.env.VITE_APP_BASE_API;

// 查询OSS对象存储列表
export function listOss(query: OssQuery): AxiosPromise<OssVO[]> {
  return request({
    url: '/resource/oss/list',
    method: 'get',
    params: query
  });
}

// 查询OSS对象基于id串
export function listByIds(ossId: string | number): AxiosPromise<OssVO[]> {
  return request({
    url: '/resource/oss/listByIds/' + ossId,
    method: 'get'
  });
}

// 删除OSS对象存储
export function delOss(ossId: string | number | Array<string | number>) {
  return request({
    url: '/resource/oss/' + ossId,
    method: 'delete'
  });
}

/** 下载 OSS 文件流（用于预览组件，需 system:oss:download）。 */
export function fetchOssDownloadArrayBuffer(ossId: string | number) {
  return axios.get<ArrayBuffer>(`${baseURL}/resource/oss/download/${ossId}`, {
    responseType: 'arraybuffer',
    headers: globalHeaders()
  });
}
