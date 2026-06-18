export interface MigoOption {
  value: string;
  label: string;
  desc?: string;
}

/** MIGO 操作类型 */
export const MIGO_ACTION_TYPES: MigoOption[] = [
  { value: 'A04', label: 'A04 显示' },
  { value: 'A08', label: 'A08 传输过账' }
];

/** 参考凭证类型 */
export const MIGO_REFERENCE_TYPES: MigoOption[] = [
  { value: 'R02', label: 'R02 物料凭证' },
  { value: 'R10', label: 'R10 其他' }
];

/** 移动类型 */
export const MIGO_MOVE_TYPES: MigoOption[] = [
  { value: '411', label: '411', desc: 'TF 库存地到库存地' },
  { value: '344', label: '344', desc: 'TR 冻结到非限制' }
];

/** 库存类型 */
export const INVENTORY_TYPE_OPTIONS = [
  { value: 'N', label: '非限制库存' },
  { value: 'X', label: '质检库存' },
  { value: 'S', label: '冻结库存' }
];

export const getMoveTypeDesc = (moveType: string): string => {
  return MIGO_MOVE_TYPES.find((item) => item.value === moveType)?.desc ?? '';
};

export const isDisplayMode = (actionType: string, referenceType: string): boolean => {
  return actionType === 'A04' && referenceType === 'R02';
};

export const isTransferPostingMode = (actionType: string): boolean => {
  return actionType === 'A08';
};

export const isLocationTransfer = (moveType: string): boolean => {
  return moveType === '411';
};

export const isStockStatusTransfer = (moveType: string): boolean => {
  return moveType === '344';
};
