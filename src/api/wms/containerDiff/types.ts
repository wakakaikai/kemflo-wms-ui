export interface ContainerDiffVO {
  /** 物料编码 */
  itemCode: string;
  /** 物料名称 */
  itemName: string;
  /** 仓库编码 */
  warehouseCode: string;
  /** 入库数量 */
  inboundQuantity: number;
  /** 出库数量 */
  outboundQuantity: number;
  /** 差异数量 */
  diffQuantity: number;
  /** 单位 */
  unit: string;
}

export interface ContainerDiffQuery extends PageQuery {
  /** 物料编码（表单输入，不传参） */
  itemCodeStr?: string;
  /** 物料编码列表（实际传参） */
  itemCodeList?: string[];
  /** 物料名称 */
  itemName?: string;
  /** 仓库编码 */
  warehouseCode?: string;
  /** 查询开始时间 */
  startTime?: string;
  /** 查询结束时间 */
  endTime?: string;
  /** 日期范围（前端使用） */
  dateTimeRange?: any;
  /** 附加参数 */
  params?: any;
}
