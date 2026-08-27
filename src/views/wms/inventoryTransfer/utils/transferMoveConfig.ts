export interface TransferMoveOption {
  value: string;
  label: string;
  desc: string;
}

/** 库存移转支持的移动类型（变体由行项目特殊库存标识判断） */
export const INVENTORY_TRANSFER_MOVE_TYPES: TransferMoveOption[] = [
  { value: '201', label: '201 成本中心领用', desc: '成本中心领用' },
  { value: '309', label: '309 物料到物料的转账', desc: '物料->新物料的转账' },
  { value: '311', label: '311 库存地点转帐 (一步)', desc: '库存地点转帐 (一步)' },
  { value: '321', label: '321 质检->非限制', desc: '质检->非限制' },
  { value: '343', label: '343 冻结->非限制', desc: '冻结->非限制' },
  { value: '344', label: '344 非限制->冻结', desc: '非限制->冻结' },
  { value: '411', label: '411 特殊库存转非限制', desc: '特殊库存转非限制' },
  { value: '413', label: '413 转销售订单库存', desc: '转销售订单库存' },
  { value: '551', label: '551 非限制库存报废', desc: '非限制库存报废' },
  { value: 'Z01', label: 'Z01 销管研成本中心发货', desc: '销管研成本中心发货' },
  { value: 'Z03', label: 'Z03 售后维修领料', desc: '售后维修领料' }
];

export const DEFAULT_TRANSFER_MOVE_TYPE = '311';

export const getTransferMoveTypeOption = (value: string): TransferMoveOption | undefined => {
  return INVENTORY_TRANSFER_MOVE_TYPES.find((item) => item.value === value);
};

export const getTransferMoveTypeDesc = (value: string): string => {
  return getTransferMoveTypeOption(value)?.desc ?? '';
};

/** 309 物料转换（同库位，源物料转目标物料） */
export const isMaterialConversionTransfer = (value: string): boolean => {
  return value === '309';
};

/** 必须选择目标库位的移动类型 */
export const needsTargetLocation = (value: string): boolean => {
  return value === '311';
};

/** 可选择目标库位的移动类型 */
export const canSelectTargetLocation = (value: string): boolean => {
  return needsTargetLocation(value) || value === '411' || value === '413';
};

/** 同库位库存状态/特殊库存/物料转换（无需选择目标库位） */
export const isStockStatusTransfer = (value: string): boolean => {
  return ['321', '343', '344', '309'].includes(value);
};

/** 部门领料（Z01/Z03/201，仅移出） */
export const isDepartmentIssueTransfer = (value: string): boolean => {
  return ['Z01', 'Z03', '201'].includes(value);
};

/** Z01 销管研成本中心发货（可选订单号） */
export const isDeptIssueZ01 = (value: string): boolean => {
  return value === 'Z01';
};

/** 仅移出、不产生目标库存（551 报废 / 部门领料） */
export const isOutboundOnlyTransfer = (value: string): boolean => {
  return value === '551' || isDepartmentIssueTransfer(value);
};

export const getDefaultSourceInventoryType = (value: string): string => {
  switch (value) {
    case '321':
      return 'X';
    case '343':
      return 'S';
    case '344':
    case '411':
    case '413':
    case '551':
    case '309':
    case 'Z01':
    case 'Z03':
    case '201':
      return 'N';
    default:
      return 'N';
  }
};

export const getDefaultTargetInventoryType = (value: string): string => {
  switch (value) {
    case '344':
      return 'S';
    default:
      return 'N';
  }
};
