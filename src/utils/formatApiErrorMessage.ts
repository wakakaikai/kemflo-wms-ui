const SAP_RESPONSE_PREFIX = 'SAP接口异常响应:';

const stripHtml = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractSapHtmlError = (html: string): string => {
  const parts: string[] = [];
  const headerMatch = html.match(/class="errorTextHeader"[\s\S]*?<span[^>]*>([^<]+)<\/span>/i);
  if (headerMatch?.[1]?.trim()) {
    parts.push(headerMatch[1].trim());
  }
  const msgTextRegex = /<span[^>]*id="msgText"[^>]*>([^<]*)<\/span>/gi;
  let match: RegExpExecArray | null;
  while ((match = msgTextRegex.exec(html)) !== null) {
    const segment = match[1]?.trim();
    if (segment) {
      parts.push(segment);
    }
  }
  if (parts.length) {
    return parts.join('；');
  }
  return stripHtml(html);
};

/**
 * 将后端 / SAP 返回的错误信息转为界面可读的纯文本（避免 HTML/CSS 撑破提示框）
 */
export function formatApiErrorMessage(raw?: string | null, maxLength = 800): string {
  if (raw == null || raw === '') {
    return '';
  }
  let text = String(raw).trim();
  let prefix = '';

  if (text.startsWith(SAP_RESPONSE_PREFIX)) {
    prefix = 'SAP接口异常：';
    text = text.slice(SAP_RESPONSE_PREFIX.length).trim();
  }

  if (/<!DOCTYPE\s+html/i.test(text) || /<html[\s>]/i.test(text)) {
    text = prefix + extractSapHtmlError(text);
  } else if (/<[^>]+>/.test(text)) {
    text = prefix + stripHtml(text);
  } else if (prefix) {
    text = prefix + text;
  }

  text = text.replace(/[\r\n]+/g, '\n').trim();
  if (maxLength > 0 && text.length > maxLength) {
    return `${text.slice(0, maxLength)}…`;
  }
  return text;
}
