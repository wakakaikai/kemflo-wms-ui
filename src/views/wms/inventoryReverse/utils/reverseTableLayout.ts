/** SAP 风格树表：主行 + 543 子行共用表头 */
export const REVERSE_TABLE_LEADING = {
  historySelect: 55,
  reverseIndex: 55
} as const;

/** 列索引与 right-toolbar 显隐一致 */
export const REVERSE_COLUMN_LABELS = {
  purchase: ['物料名称', '采购订单', '项目', '移动类型', '物料', '物料凭证号', '凭证项次', '数量', '单位', '库位', '批次', '进出', '冲销标识'],
  inventory: ['物料名称', '来源单号', '项目', '移动类型', '物料', '物料凭证号', '凭证项次', '数量', '单位', '库位', '批次', '进出', '冲销标识']
} as const;

export const REVERSE_DATA_COLUMN = {
  itemName: { minWidth: 180, showOverflowTooltip: true },
  sourceDocCode: { minWidth: 120, showOverflowTooltip: true },
  sourceDocItem: { width: 72, align: 'center' as const },
  moveType: { width: 88, align: 'center' as const },
  itemCode: { minWidth: 130, showOverflowTooltip: true },
  sapMaterialOrderNo: { minWidth: 118, showOverflowTooltip: true },
  sapMaterialItem: { width: 88, align: 'center' as const },
  quantity: { width: 96, align: 'right' as const },
  unit: { width: 72, align: 'center' as const },
  locationCode: { minWidth: 100, showOverflowTooltip: true },
  batchCode: { minWidth: 100, showOverflowTooltip: true },
  direction: { width: 88, align: 'center' as const },
  reversal: { width: 96, align: 'center' as const },
  action: { width: 80, align: 'center' as const, fixed: 'right' as const }
};

export function createReverseColumnOptions(layout: 'purchase' | 'inventory'): FieldOption[] {
  return REVERSE_COLUMN_LABELS[layout].map((label, key) => ({
    key,
    label,
    visible: true,
    children: []
  }));
}
