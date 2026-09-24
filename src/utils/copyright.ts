import type { TenantVO } from '@/api/types';

/** 未选择租户或列表无匹配时的默认公司名 */
export const DEFAULT_COPYRIGHT_COMPANY_NAME = '溢泰（南京）环保科技有限公司';

const COPYRIGHT_YEAR_RANGE = '2024-2026';

export function resolveTenantCompanyName(tenantId: string | undefined | null, tenantList: TenantVO[]): string {
  const id = String(tenantId ?? '').trim();
  if (!id) {
    return '';
  }
  return tenantList.find((item) => String(item.tenantId) === id)?.companyName?.trim() ?? '';
}

export function buildCopyrightText(companyName?: string | null): string {
  const name = String(companyName ?? '').trim() || DEFAULT_COPYRIGHT_COMPANY_NAME;
  return `Copyright © ${COPYRIGHT_YEAR_RANGE} ${name}`;
}
