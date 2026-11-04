import request from '@/utils/request';
import type { AxiosPromise } from 'axios';
import type { QmsInspectionTemplateDetail, QmsInspectionTemplateListItem, QmsInspectionTemplateQuery } from './types';

/** 分页查询检验模板。 */
export function listInspectionTemplate(query: QmsInspectionTemplateQuery): AxiosPromise<QmsInspectionTemplateListItem[]> {
  return request({
    url: '/qms/inspectionTemplate/list',
    method: 'get',
    params: query
  });
}

/** 查询检验模板详情。 */
export function getInspectionTemplate(id: string): AxiosPromise<QmsInspectionTemplateDetail> {
  return request({
    url: `/qms/inspectionTemplate/${id}`,
    method: 'get'
  });
}
