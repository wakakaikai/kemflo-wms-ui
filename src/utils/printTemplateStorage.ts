import type { PrintTemplateVo } from '@/api/wms/printTemplate';

const INDEX_KEY = 'wms_print_template_index';
const BODY_PREFIX = 'wms_print_template_body:';

export type PrintTemplateListRow = Pick<PrintTemplateVo, 'id' | 'templateCode' | 'templateName' | 'remark' | 'updateTime'> &
  Required<Pick<PrintTemplateVo, 'templateCode'>>;

function readIndex(): PrintTemplateListRow[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as PrintTemplateListRow[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeIndex(rows: PrintTemplateListRow[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(rows));
}

/** Backend list API not ready: use browser cache */
export function localListPrintTemplates(): PrintTemplateListRow[] {
  return readIndex().sort((a, b) => (b.updateTime || '').localeCompare(a.updateTime || ''));
}

export function localGetPrintTemplate(templateCode: string): PrintTemplateVo | null {
  try {
    const raw = localStorage.getItem(BODY_PREFIX + templateCode);
    if (!raw) return null;
    return JSON.parse(raw) as PrintTemplateVo;
  } catch {
    return null;
  }
}

export function localSavePrintTemplate(vo: PrintTemplateVo) {
  const now = new Date().toISOString();
  const code = vo.templateCode || '';
  if (!code) return;
  const full: PrintTemplateVo = {
    ...vo,
    id: vo.id ?? code,
    updateTime: now
  };
  localStorage.setItem(BODY_PREFIX + code, JSON.stringify(full));

  const rows = readIndex();
  const idx = rows.findIndex((r) => r.templateCode === code);
  const row: PrintTemplateListRow = {
    id: full.id,
    templateCode: code,
    templateName: full.templateName,
    remark: full.remark,
    updateTime: now
  };
  if (idx >= 0) rows[idx] = { ...rows[idx], ...row };
  else rows.push(row);
  writeIndex(rows);
}

export function localRemovePrintTemplate(templateCode: string) {
  localStorage.removeItem(BODY_PREFIX + templateCode);
  writeIndex(readIndex().filter((r) => r.templateCode !== templateCode));
  removeFavorite(templateCode);
}

export function localHasPrintTemplate(templateCode: string): boolean {
  return readIndex().some((r) => r.templateCode === templateCode) || !!localGetPrintTemplate(templateCode);
}

/** Duplicate template body + index row under a new code */
export function localCopyPrintTemplate(sourceCode: string, newCode: string, newName?: string): PrintTemplateVo | null {
  const src = localGetPrintTemplate(sourceCode);
  if (!src) return null;
  const code = newCode.trim();
  if (!code || localHasPrintTemplate(code)) return null;
  const content =
    typeof src.templateContent === 'string'
      ? src.templateContent
      : src.templateContent != null
        ? JSON.stringify(src.templateContent)
        : undefined;
  const vo: PrintTemplateVo = {
    ...src,
    id: code,
    templateCode: code,
    templateName: (newName || `${src.templateName || sourceCode} (����)`).trim(),
    templateContent: content,
    widgetOptions:
      typeof src.widgetOptions === 'string' ? src.widgetOptions : src.widgetOptions ? JSON.stringify(src.widgetOptions) : undefined
  };
  localSavePrintTemplate(vo);
  return vo;
}

const FAV_KEY = 'wms_print_template_favorites';

function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as string[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeFavorites(codes: string[]) {
  localStorage.setItem(FAV_KEY, JSON.stringify(codes));
}

export function listFavoriteTemplateCodes(): string[] {
  return readFavorites();
}

export function isFavoriteTemplate(code: string): boolean {
  return readFavorites().includes(code);
}

export function toggleFavoriteTemplate(code: string): boolean {
  const set = new Set(readFavorites());
  if (set.has(code)) set.delete(code);
  else set.add(code);
  writeFavorites([...set]);
  return set.has(code);
}

export function removeFavorite(code: string) {
  writeFavorites(readFavorites().filter((c) => c !== code));
}
