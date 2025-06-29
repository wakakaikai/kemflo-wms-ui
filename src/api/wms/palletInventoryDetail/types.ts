export interface PalletInventoryDetailVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 栈板编号
   */
  palletCode: string;

  /**
   * 打包编号
   */
  packingCode: string;

  /**
   * 工单号
   */
  workOrderNo: string;

  /**
   * 料号
   */
  item: string;

  /**
   * 待入库数量
   */
  packingQty: number;

  /**
   * 状态
   */
  status: number;

  /**
   * 物料凭证号
   */
  materialOrderNo: string;

  /**
   * 物料文件项次
   */
  materialItem: string;

  /**
   * 生产日期
   */
  productDate: string;

  /**
   * 失效日期
   */
  expireDate: string;

  /**
   * 备注
   */
  remark: string;

}

export interface PalletInventoryDetailForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 栈板编号
   */
  palletCode?: string;

  /**
   * 打包编号
   */
  packingCode?: string;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 料号
   */
  item?: string;

  /**
   * 待入库数量
   */
  packingQty?: number;

  /**
   * 状态
   */
  status?: number;

  /**
   * 物料凭证号
   */
  materialOrderNo?: string;

  /**
   * 物料文件项次
   */
  materialItem?: string;

  /**
   * 生产日期
   */
  productDate?: string;

  /**
   * 失效日期
   */
  expireDate?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface PalletInventoryDetailQuery extends PageQuery {

  /**
   * 栈板编号
   */
  palletCode?: string;

  /**
   * 打包编号
   */
  packingCode?: string;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 料号
   */
  item?: string;

  /**
   * 待入库数量
   */
  packingQty?: number;

  /**
   * 状态
   */
  status?: number;

  /**
   * 物料凭证号
   */
  materialOrderNo?: string;

  /**
   * 物料文件项次
   */
  materialItem?: string;

  /**
   * 生产日期
   */
  productDate?: string;

  /**
   * 失效日期
   */
  expireDate?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



