export interface TransferMoveOption {
  value: string;
  label: string;
  desc: string;
}

/** 库存移转支持的移动类型 */
export const INVENTORY_TRANSFER_MOVE_TYPES: TransferMoveOption[] = [
  { value: '311', label: '311 库存地点转帐 (一步)', desc: '库存地点转帐 (一步)' },
  { value: '411', label: '411 E 销售库存->非限制', desc: '销售库存->非限制' },
  { value: '413', label: '413 转销售订单库存', desc: '非限制转销售订单库存' },
  { value: '343', label: '343 冻结->非限制', desc: '冻结->非限制' },
  // { value: '321', label: '321 质检->非限制', desc: '质检->非限制' },
  { value: '344', label: '344 非限制->冻结', desc: '非限制->冻结' }
];

export const DEFAULT_TRANSFER_MOVE_TYPE = '311';

export const getTransferMoveTypeDesc = (moveType: string): string => {
  return INVENTORY_TRANSFER_MOVE_TYPES.find((item) => item.value === moveType)?.desc ?? '';
};

/** 需要选择目标库位的移动类型 */
export const needsTargetLocation = (moveType: string): boolean => {
  return moveType === '311' || moveType === '411' || moveType === '413';
};

/** 同库位库存状态/特殊库存转换（无需选择目标库位） */
export const isStockStatusTransfer = (moveType: string): boolean => {
  return ['321', '343', '344', '413'].includes(moveType);
};

export const getDefaultSourceInventoryType = (moveType: string): string => {
  switch (moveType) {
    case '321':
      return 'X';
    case '343':
      return 'S';
    case '344':
    case '411':
    case '413':
      return 'N';
    default:
      return 'N';
  }
};

export const getDefaultTargetInventoryType = (moveType: string): string => {
  switch (moveType) {
    case '344':
      return 'S';
    default:
      return 'N';
  }
};
