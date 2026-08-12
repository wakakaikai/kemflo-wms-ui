/**
 * 复制工具类
 * - copyToClipboard: 把内容复制到剪贴板（优先 navigator.clipboard，失败回退隐藏 textarea + execCommand）
 * - copyText: 复制并弹出成功/失败提示，便于点击某段内容即复制
 *
 * 用法（script setup 中）：
 *   import { copyText } from '@/utils/copy';
 *   // 模板：<el-button @click="copyText(formData.sfc)">条码</el-button>
 */
import { ElMessage } from 'element-plus';

export type Copyable = string | number | undefined | null;

/** 隐藏 textarea 兜底方案（兼容非安全上下文 / 老浏览器） */
function copyByTextarea(input: string): boolean {
  const element = document.createElement('textarea');
  const previouslyFocusedElement = document.activeElement as HTMLInputElement;
  element.value = input;
  // 防止移动端弹出键盘
  element.setAttribute('readonly', '');

  element.style.contain = 'strict';
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  element.style.fontSize = '12pt'; // 防止 iOS 缩放

  const selection = document.getSelection();
  let originalRange: Range | undefined;
  if (selection && selection.rangeCount > 0) {
    originalRange = selection.getRangeAt(0);
  }
  document.body.append(element);
  element.select();
  // iOS 显式选区
  element.selectionStart = 0;
  element.selectionEnd = input.length;

  let isSuccess = false;
  try {
    isSuccess = document.execCommand('copy');
  } catch (err) {
    console.error('[copy] execCommand 复制失败', err);
  }
  element.remove();

  if (originalRange) {
    selection?.removeAllRanges();
    selection?.addRange(originalRange);
  }
  // 焦点还给之前的元素
  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus();
  }
  return isSuccess;
}

/** 将内容复制到剪贴板，返回是否成功 */
export function copyToClipboard(input: Copyable): Promise<boolean> {
  const text = input === null || input === undefined ? '' : String(input);
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => copyByTextarea(text)
    );
  }
  return Promise.resolve(copyByTextarea(text));
}

/**
 * 复制内容到剪贴板并给出提示
 * @param text 要复制的内容（可为空，空内容不提示成功）
 * @param message 成功提示文案，默认“已复制到剪贴板”
 */
export async function copyText(input: Copyable, message?: string): Promise<boolean> {
  const text = input === null || input === undefined ? '' : String(input);
  if (!text) {
    return false;
  }
  const ok = await copyToClipboard(text);
  if (ok) {
    ElMessage.success(message || '已复制');
  } else {
    ElMessage.error('复制失败');
  }
  return ok;
}
