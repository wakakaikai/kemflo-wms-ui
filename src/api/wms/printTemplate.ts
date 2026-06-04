import request from '@/utils/request';
import type { PrintTemplate } from '@/components/print-designer/types';
import type { WidgetOption } from '@/components/print-designer/types';
import { printTemplateAdapter, printTemplateUrls } from '@/config/printTemplate';

export interface PrintTemplateVo {
  id?: string | number;
  templateCode?: string;
  templateName?: string;
  templateContent?: string | PrintTemplate;
  widgetOptions?: string | WidgetOption[];
  remark?: string;
  updateTime?: string;
}

const urls = printTemplateUrls;

export function listPrintTemplate(params?: { templateName?: string; templateCode?: string; pageNum?: number; pageSize?: number }) {
  return request<{ rows: PrintTemplateVo[]; total: number }>({
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
  return request<WidgetOption[]>({
    url: urls().widgetOptions,
    method: 'get',
    params: { templateCode }
  });
}

export function getPrintSampleData(templateCode?: string) {
  return request<Record<string, unknown>[]>({
    url: urls().sampleData,
    method: 'get',
    params: { templateCode }
  });
}
