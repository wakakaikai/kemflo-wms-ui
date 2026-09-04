export interface IssueMoveOption {
  value: string;
  label: string;
  desc: string;
}

/** 部门领料支持的移动类型 */
export const DEPT_ISSUE_MOVE_TYPES: IssueMoveOption[] = [
  { value: '201', label: '201 成本中心领用', desc: '成本中心领用' },
  { value: 'Z01', label: 'Z01 销管研成本中心发货', desc: '销管研成本中心发货' },
  { value: 'Z03', label: 'Z03 售后维修领料', desc: '售后维修领料' }
];

export const DEFAULT_DEPT_ISSUE_MOVE_TYPE = '201';

export const getIssueMoveTypeOption = (value: string): IssueMoveOption | undefined => {
  return DEPT_ISSUE_MOVE_TYPES.find((item) => item.value === value);
};

export const getIssueMoveTypeDesc = (value: string): string => {
  return getIssueMoveTypeOption(value)?.desc ?? '';
};

/** Z01 销管研成本中心发货（可选订单号） */
export const isDeptIssueZ01 = (value: string): boolean => {
  return value === 'Z01';
};

export const getDefaultSourceInventoryType = (): string => 'N';
