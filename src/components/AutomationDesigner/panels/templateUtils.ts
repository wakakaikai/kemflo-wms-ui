/** UI 使用易读的 {{var}} 占位符，持久化时转换为运行时使用的 ${var}。 */

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
