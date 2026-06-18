export interface TransferMoveOption {
  value: string;
  label: string;
  desc: string;
}

/** 库存移转支持的移动类型 */
export const INVENTORY_TRANSFER_MOVE_TYPES: TransferMoveOption[] = [
  { value: '311', label: '311', desc: '库存地点转帐 (一步)' },
  { value: '411', label: '411', desc: 'TF 库存地到库存地' },
  { value: '344', label: '344', desc: 'TR 冻结到非限制' }
];

export const DEFAULT_TRANSFER_MOVE_TYPE = '311';

export const getTransferMoveTypeDesc = (moveType: string): string => {
  return INVENTORY_TRANSFER_MOVE_TYPES.find((item) => item.value === moveType)?.desc ?? '';
};

/** 需要选择目标库位的移动类型 */
export const needsTargetLocation = (moveType: string): boolean => {
  return moveType === '311' || moveType === '411';
};

/** 库存状态转换（同库位，源/目标库存类型不同） */
export const isStockStatusTransfer = (moveType: string): boolean => {
  return moveType === '344';
};

export const getDefaultSourceInventoryType = (moveType: string): string => {
  return isStockStatusTransfer(moveType) ? 'S' : 'N';
};

export const getDefaultTargetInventoryType = (moveType: string): string => {
  return isStockStatusTransfer(moveType) ? 'N' : 'N';
};
