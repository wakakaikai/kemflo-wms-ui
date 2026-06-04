/**
 * Common fonts on Chinese Windows. Printing uses C-Lodop on the client PC;
 * `value` must match the font family name installed on the print machine.
 */
export const PRINT_FONT_PRESETS: readonly { label: string; value: string }[] = [
  { label: 'Microsoft YaHei', value: 'Microsoft YaHei' },
  { label: 'Microsoft YaHei UI', value: 'Microsoft YaHei UI' },
  { label: 'DengXian', value: 'DengXian' },
  { label: 'DengXian Light', value: 'DengXian Light' },
  { label: 'SimSun', value: 'SimSun' },
  { label: 'NSimSun', value: 'NSimSun' },
  { label: 'SimHei', value: 'SimHei' },
  { label: 'KaiTi', value: 'KaiTi' },
  { label: 'FangSong', value: 'FangSong' },
  { label: 'LiSu', value: 'LiSu' },
  { label: 'YouYuan', value: 'YouYuan' },
  { label: 'STSong', value: 'STSong' },
  { label: 'STKaiti', value: 'STKaiti' },
  { label: 'STFangsong', value: 'STFangsong' },
  { label: 'STXihei', value: 'STXihei' },
  { label: 'STZhongsong', value: 'STZhongsong' },
  { label: 'STHupo', value: 'STHupo' },
  { label: 'STXinwei', value: 'STXinwei' },
  { label: 'STLiti', value: 'STLiti' },
  { label: 'STXingkai', value: 'STXingkai' },
  { label: 'FZShuTi', value: 'FZShuTi' },
  { label: 'FZYaoTi', value: 'FZYaoTi' },
  { label: 'Microsoft JhengHei', value: 'Microsoft JhengHei' },
  { label: 'Microsoft JhengHei UI', value: 'Microsoft JhengHei UI' },
  { label: 'PMingLiU', value: 'PMingLiU' },
  { label: 'MingLiU', value: 'MingLiU' },
  { label: 'Segoe UI', value: 'Segoe UI' },
  { label: 'Segoe UI Variable', value: 'Segoe UI Variable' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Arial Black', value: 'Arial Black' },
  { label: 'Arial Unicode MS', value: 'Arial Unicode MS' },
  { label: 'Tahoma', value: 'Tahoma' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Calibri', value: 'Calibri' },
  { label: 'Cambria', value: 'Cambria' },
  { label: 'Candara', value: 'Candara' },
  { label: 'Corbel', value: 'Corbel' },
  { label: 'Constantia', value: 'Constantia' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Consolas', value: 'Consolas' },
  { label: 'Cascadia Mono', value: 'Cascadia Mono' },
  { label: 'Cascadia Code', value: 'Cascadia Code' },
  { label: 'Comic Sans MS', value: 'Comic Sans MS' },
  { label: 'Impact', value: 'Impact' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS' },
  { label: 'Palatino Linotype', value: 'Palatino Linotype' },
  { label: 'Lucida Console', value: 'Lucida Console' },
  { label: 'Lucida Sans Unicode', value: 'Lucida Sans Unicode' },
  { label: 'Franklin Gothic Medium', value: 'Franklin Gothic Medium' },
  { label: 'Century Gothic', value: 'Century Gothic' },
  { label: 'Book Antiqua', value: 'Book Antiqua' },
  { label: 'Garamond', value: 'Garamond' },
  { label: 'Symbol', value: 'Symbol' },
  { label: 'Wingdings', value: 'Wingdings' },
  { label: 'Wingdings 2', value: 'Wingdings 2' },
  { label: 'Wingdings 3', value: 'Wingdings 3' },
  { label: 'Noto Sans SC', value: 'Noto Sans SC' },
  { label: 'Noto Serif SC', value: 'Noto Serif SC' },
  { label: 'Source Han Sans CN', value: 'Source Han Sans CN' },
  { label: 'Source Han Serif CN', value: 'Source Han Serif CN' },
  { label: 'HarmonyOS Sans SC', value: 'HarmonyOS Sans SC' },
  { label: 'PingFang SC', value: 'PingFang SC' },
  { label: 'Heiti SC', value: 'Heiti SC' },
  { label: 'Songti SC', value: 'Songti SC' },
  { label: 'Kaiti SC', value: 'Kaiti SC' }
];

/** i18n keys under printDesigner.fontPresets.* */
export const FONT_PRESET_I18N_KEYS: Partial<Record<string, string>> = {
  'Microsoft YaHei': 'microsoftYaHei',
  'Microsoft YaHei UI': 'microsoftYaHeiUi',
  DengXian: 'dengXian',
  'DengXian Light': 'dengXianLight',
  SimSun: 'simSun',
  NSimSun: 'nSimSun',
  SimHei: 'simHei',
  KaiTi: 'kaiTi',
  FangSong: 'fangSong',
  LiSu: 'liSu',
  YouYuan: 'youYuan',
  STSong: 'stSong',
  STKaiti: 'stKaiti',
  STFangsong: 'stFangsong',
  STXihei: 'stXihei',
  STZhongsong: 'stZhongsong',
  STHupo: 'stHupo',
  STXinwei: 'stXinwei',
  STLiti: 'stLiti',
  STXingkai: 'stXingkai',
  FZShuTi: 'fzShuTi',
  FZYaoTi: 'fzYaoTi',
  'Microsoft JhengHei': 'microsoftJhengHei',
  'Microsoft JhengHei UI': 'microsoftJhengHeiUi',
  PMingLiU: 'pMingLiU',
  MingLiU: 'mingLiU',
  'Noto Sans SC': 'notoSansSc',
  'Noto Serif SC': 'notoSerifSc',
  'Source Han Sans CN': 'sourceHanSansCn',
  'Source Han Serif CN': 'sourceHanSerifCn',
  'HarmonyOS Sans SC': 'harmonyOsSansSc',
  'PingFang SC': 'pingFangSc',
  'Heiti SC': 'heitiSc',
  'Songti SC': 'songtiSc',
  'Kaiti SC': 'kaitiSc'
};

/** Detect labels corrupted by wrong file encoding (replacement chars / mojibake). */
export function isGarbledFontLabel(text: string): boolean {
  if (!text) return false;
  if (text.includes('\uFFFD')) return true;
  if (/[\u0080-\u009F]/.test(text)) return true;
  if (/[\u0080-\u00BF]{2,}/.test(text) && !/[\u4e00-\u9fff]/.test(text)) return true;
  return false;
}

/** Recover Latin font family from Lodop / broken strings, e.g. mojibake + "FangSong" -> FangSong */
export function normalizeFontFamilyName(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (!isGarbledFontLabel(v)) return v;
  const m = v.match(/[A-Za-z][A-Za-z0-9\s\-]{0,48}/);
  return m ? m[0].trim() : null;
}

function isZhLocale(locale?: string): boolean {
  return !locale || locale === 'zh-CN' || locale === 'zh_CN';
}

export function formatFontOptionLabel(
  value: string,
  locale?: string,
  t?: (key: string) => string
): string {
  const v = value.trim();
  if (!v) return v;
  if (isZhLocale(locale) && t) {
    const i18nKey = FONT_PRESET_I18N_KEYS[v];
    if (i18nKey) {
      const zh = t(`printDesigner.fontPresets.${i18nKey}`);
      if (zh && !isGarbledFontLabel(zh) && !zh.startsWith('printDesigner.')) {
        return `${zh} (${v})`;
      }
    }
  }
  return v;
}

/** Preset + locally queried families (deduped), sorted by label. */
export function mergePrintFontSelectOptions(
  extraFamilies: readonly string[],
  locale?: string,
  t?: (key: string) => string
): { label: string; value: string }[] {
  const byKey = new Map<string, { label: string; value: string }>();
  for (const p of PRINT_FONT_PRESETS) {
    const label = formatFontOptionLabel(p.value, locale, t) || p.label;
    byKey.set(p.value.toLowerCase(), { label, value: p.value });
  }
  for (const fam of extraFamilies) {
    const normalized = normalizeFontFamilyName(fam);
    if (!normalized) continue;
    const v = normalized.trim();
    const k = v.toLowerCase();
    if (!byKey.has(k)) {
      byKey.set(k, { label: formatFontOptionLabel(v, locale, t), value: v });
    }
  }
  return [...byKey.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  );
}
