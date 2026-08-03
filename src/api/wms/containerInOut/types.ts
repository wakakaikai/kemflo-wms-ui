import type { InventoryDetailVO, InventoryDetailForm } from '@/api/wms/inventoryDetail/types';

export type { InventoryDetailVO, InventoryDetailForm };

export interface ContainerInOutQuery extends PageQuery {
  /** 物料编码（表单输入，不传参） */
  itemCodeStr?: string;
  /** 批量物料编码列表 */
  itemCodeList?: string[];
  /** 物料名称 */
  itemName?: string;
  /** 批次号 */
  batchCode?: string;
  /** 仓库编码 */
  warehouseCode?: string;
  /** 库区编码 */
  areaCode?: string;
  /** 库位编码 */
  locationCode?: string;
  /** 特殊库存标识 */
  specialInventoryFlag?: string;
  /** 日期范围参数 */
  params?: any;
}