/** UI 使用 Jeecg 风格 {{var}}，持久化使用流程引擎 ${var} */

export function toDisplayTemplate(value: unknown) {
  return String(value ?? '').replace(/\$\{([^}]+)\}/g, '{{$1}}');
}

export function toPersistTemplate(value: unknown) {
  return String(value ?? '').replace(/\{\{\s*([^}]+?)\s*\}\}/g, '${$1}');
}

export function toDisplayTemplateMap(map?: Record<string, string> | null) {
  const result: Record<string, string> = {};
  if (!map || typeof map !== 'object') return result;
  Object.entries(map).forEach(([key, val]) => {
    result[key] = toDisplayTemplate(val);
  });
  return result;
}

export function toPersistTemplateMap(map?: Record<string, string> | null) {
  const result: Record<string, string> = {};
  if (!map || typeof map !== 'object') return result;
  Object.entries(map).forEach(([key, val]) => {
    result[key] = toPersistTemplate(val);
  });
  return result;
}
