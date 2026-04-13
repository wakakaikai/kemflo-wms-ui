export interface PalletVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 栈板号
   */
  palletNo: string;

  /**
   * 1:栈板 2:外箱
   */
  palletLevel: number;

  /**
   * 批次号
   */
  batchId: string | number;

  /**
   * 状态：0：未使用 1：已使用
   */
  status: number;

  /**
   * 业务类型：1：外部栈板号导入 2：系统生成自动绑定 3：系统生成人工绑定
   */
  businessType: number;

  /**
   * 生产日期
   */
  productTime: string;

  /**
   * 托盘净重
   */
  palletNetWeight: number;

  /**
   * 托盘毛重
   */
  palletGrossWeight: number;

  /**
   * 装托数量
   */
  palletNumber: number;

  /**
   * 客户PO
   */
  customerPo: string;

  /**
   * 物料
   */
  item: string;

  /**
   * 创建者
   */
  creator: string;

}

export interface PalletForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 栈板号
   */
  palletNo?: string;

  /**
   * 1:栈板 2:外箱
   */
  palletLevel?: number;

  /**
   * 批次号
   */
  batchId?: string | number;

  /**
   * 状态：0：未使用 1：已使用
   */
  status?: number;

  /**
   * 业务类型：1：外部栈板号导入 2：系统生成自动绑定 3：系统生成人工绑定
   */
  businessType?: number;

  /**
   * 生产日期
   */
  productTime?: string;

  /**
   * 托盘净重
   */
  palletNetWeight?: number;

  /**
   * 托盘毛重
   */
  palletGrossWeight?: number;

  /**
   * 装托数量
   */
  palletNumber?: number;

  /**
   * 客户PO
   */
  customerPo?: string;

  /**
   * 物料
   */
  item?: string;

  /**
   * 创建者
   */
  creator?: string;

}

export interface PalletQuery extends PageQuery {

  /**
   * 栈板号
   */
  palletNo?: string;

  /**
   * 1:栈板 2:外箱
   */
  palletLevel?: number;

  /**
   * 批次号
   */
  batchId?: string | number;

  /**
   * 状态：0：未使用 1：已使用
   */
  status?: number;

  /**
   * 业务类型：1：外部栈板号导入 2：系统生成自动绑定 3：系统生成人工绑定
   */
  businessType?: number;

  /**
   * 生产日期
   */
  productTime?: string;

  /**
   * 托盘净重
   */
  palletNetWeight?: number;

  /**
   * 托盘毛重
   */
  palletGrossWeight?: number;

  /**
   * 装托数量
   */
  palletNumber?: number;

  /**
   * 客户PO
   */
  customerPo?: string;

  /**
   * 物料
   */
  item?: string;

  /**
   * 创建者
   */
  creator?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



