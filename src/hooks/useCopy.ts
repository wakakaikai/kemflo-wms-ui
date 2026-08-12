/**
 * 复制工具（组合式）
 * 用法：const { copy } = useCopy(); 模板：@click="copy(formData.sfc)"
 */
import { copyText, type Copyable } from '@/utils/copy';

export function useCopy() {
  const copy = (text: Copyable, message?: string) => copyText(text, message);
  return { copy };
}