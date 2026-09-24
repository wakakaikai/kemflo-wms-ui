import request from '@/utils/request';
import { printTemplateAdapter, printTemplateUrls } from '@/config/printTemplate';

export interface PrintTemplateVo {
  id?: string | number;
  templateCode?: string;
  templateName?: string;
  templateContent?: string | Record<string, unknown>;
  /** 新设计器字段字典；widgetOptions 保留兼容旧接口。 */
  businessFields?: string | Record<string, unknown>[];
  widgetOptions?: string | Record<string, unknown>[];
  sampleData?: string | Record<string, unknown> | Record<string, unknown>[];
  remark?: string;
  updateTime?: string;
}

const urls = printTemplateUrls;

export function listPrintTemplate(params?: { keyword?: string; templateName?: string; templateCode?: string; pageNum?: number; pageSize?: number }) {
  return request<PrintTemplateVo[]>({
    url: urls().list,
    method: 'get',
    params
  });
}

export function getPrintTemplate(id: string | number) {
  return request<PrintTemplateVo>({
    url: urls().detail(id),
    method: 'get'
  });
}

export function savePrintTemplate(data: PrintTemplateVo) {
  const body = printTemplateAdapter.mapSavePayload(data as unknown as Record<string, unknown>);
  return request({
    url: urls().save,
    method: 'post',
    data: body
  });
}

export function delPrintTemplate(ids: string | number | Array<string | number>) {
  const s = Array.isArray(ids) ? ids.join(',') : String(ids);
  return request({
    url: urls().deletePath(s),
    method: 'delete'
  });
}

export function listPrintWidgetOptions(templateCode?: string) {
  return request<Record<string, unknown>[]>({
    url: urls().widgetOptions,
    method: 'get',
    params: { templateCode }
  });
}

export function getPrintSampleData(templateCode?: string, params?: Record<string, unknown>) {
  return request<Record<string, unknown> | Record<string, unknown>[]>({
    url: urls().sampleData,
    method: 'get',
    params: { templateCode, ...params }
  });
}
