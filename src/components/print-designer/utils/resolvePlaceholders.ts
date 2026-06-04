/**
 * Replace `{fieldName}` with flat keys from(data).
 */
export function resolvePlaceholders(template: string, data: Record<string, unknown>): string {
  if (!template) return '';
  return template.replace(/\{([^}]+)\}/g, (_, rawKey: string) => {
    const key = rawKey.trim();
    const v = data[key];
    if (v === undefined || v === null) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  });
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hasPlaceholders(template: string): boolean {
  return /\{[^}]+\}/.test(template);
}

export function resolveTextItemValue(
  item: { value: string; name?: string; defaultValue?: string | Record<string, unknown>[] },
  data: Record<string, unknown>
): string {
  const valueTemplate = String(item.value ?? '').trim();

  // ?????????? {???}????????/?????????????????????��???
  if (valueTemplate && !hasPlaceholders(valueTemplate)) {
    return valueTemplate;
  }

  if (valueTemplate) {
    const resolved = resolvePlaceholders(valueTemplate, data).trim();
    if (resolved) return resolved;
  }

  if (item.name && data[item.name] !== undefined && data[item.name] !== null) {
    const v = data[item.name];
    if (typeof v === 'object') return JSON.stringify(v);
    const fromField = String(v).trim();
    if (fromField) return fromField;
  }

  if (item.defaultValue != null && item.defaultValue !== '') {
    if (typeof item.defaultValue === 'object') {
      return JSON.stringify(item.defaultValue);
    }
    return String(item.defaultValue).trim();
  }

  return '';
}

export function resolveHtmlItemValue(
  item: { value: string; name?: string; defaultValue?: string | Record<string, unknown>[] },
  data: Record<string, unknown>
): string {
  return resolveTextItemValue(item, data);
}
