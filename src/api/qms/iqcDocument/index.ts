import request from '@/utils/request';
import type { AxiosPromise } from 'axios';
import type { QmsIqcDocumentDetailVO, QmsIqcDocumentQuery, QmsIqcDocumentVO } from './types';

export function listIqcDocument(query: QmsIqcDocumentQuery): AxiosPromise<QmsIqcDocumentVO[]> {
  return request({
    url: '/qms/iqcDocument/list',
    method: 'get',
    params: query
  });
}

export function getIqcDocument(id: string | number): AxiosPromise<QmsIqcDocumentDetailVO> {
  return request({
    url: `/qms/iqcDocument/${id}`,
    method: 'get'
  });
}
