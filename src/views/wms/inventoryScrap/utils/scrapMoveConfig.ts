export interface ScrapMoveOption {
  value: string;
  label: string;
  desc: string;
}

/** 库存报废支持的移动类型 */
export const INVENTORY_SCRAP_MOVE_TYPES: ScrapMoveOption[] = [
  { value: '551', label: '551 非限制库存报废', desc: '非限制库存报废' }
];

export const DEFAULT_SCRAP_MOVE_TYPE = '551';

export const getScrapMoveTypeOption = (value: string): ScrapMoveOption | undefined => {
  return INVENTORY_SCRAP_MOVE_TYPES.find((item) => item.value === value);
};

export const getScrapMoveTypeDesc = (value: string): string => {
  return getScrapMoveTypeOption(value)?.desc ?? '';
};

export const getDefaultSourceInventoryType = (): string => 'N';
