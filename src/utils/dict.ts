import { getDicts } from '@/api/system/dict/data';
import { useDictStore } from '@/store/modules/dict';

const DICT_TAG_TYPES = new Set<ElTagType>(['primary', 'success', 'info', 'warning', 'danger']);

export interface DictTagClassOption {
  value: string;
  label: string;
}

/** 字典样式属性：纯色标签（与 DICT_TAG_COLORS 键名一致） */
export const DICT_TAG_COLORS = [
  { key: 'red', label: '红色' },
  { key: 'orange', label: '橙色' },
  { key: 'amber', label: '琥珀' },
  { key: 'yellow', label: '黄色' },
  { key: 'lime', label: '青柠' },
  { key: 'green', label: '绿色' },
  { key: 'emerald', label: '翠绿' },
  { key: 'teal', label: '蓝绿' },
  { key: 'cyan', label: '青色' },
  { key: 'sky', label: '天蓝' },
  { key: 'blue', label: '蓝色' },
  { key: 'indigo', label: '靛蓝' },
  { key: 'violet', label: '紫罗兰' },
  { key: 'purple', label: '紫色' },
  { key: 'fuchsia', label: '洋红' },
  { key: 'pink', label: '粉色' },
  { key: 'rose', label: '玫红' },
  { key: 'brown', label: '棕色' },
  { key: 'gray', label: '灰色' },
  { key: 'slate', label: '石板' },
  { key: 'gold', label: '金色' }
] as const;

/** 字典样式属性可选项（系统管理-字典数据） */
export const DICT_TAG_CLASS_OPTIONS: DictTagClassOption[] = DICT_TAG_COLORS.map((item) => ({
  value: `dict-tag-${item.key}`,
  label: item.label
}));

function pickDictTagClass(cssClass?: string | null) {
  return String(cssClass ?? '')
    .trim()
    .split(/\s+/)
    .find((name) => name.startsWith('dict-tag-'));
}

/** dict-tag-* 使用 info 作为浅色底衬；否则使用回显样式 listClass */
export function resolveDictTagType(option?: Pick<DictDataOption, 'elTagType' | 'elTagClass'>): ElTagType {
  if (pickDictTagClass(option?.elTagClass)) return 'info';
  const type = String(option?.elTagType ?? '').trim() as ElTagType;
  if (DICT_TAG_TYPES.has(type)) return type;
  return 'primary';
}

/**
 * 获取字典数据
 */
export const useDict = (...args: string[]): { [key: string]: DictDataOption[] } => {
  const res = ref<{
    [key: string]: DictDataOption[];
  }>({});

  args.forEach(async (dictType) => {
    res.value[dictType] = [];
    const dicts = useDictStore().getDict(dictType);
    if (dicts) {
      res.value[dictType] = dicts;
    } else {
      await getDicts(dictType).then((resp) => {
        res.value[dictType] = resp.data.map(
          (p): DictDataOption => ({ label: p.dictLabel, value: p.dictValue, elTagType: p.listClass, elTagClass: p.cssClass })
        );
        useDictStore().setDict(dictType, res.value[dictType]);
      });
    }
  });
  return res.value;
};
