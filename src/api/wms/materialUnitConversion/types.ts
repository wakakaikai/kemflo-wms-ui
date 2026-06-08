export interface MaterialUnitConversionVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 物料编码
   */
  materialCode: string;

  /**
   * 基本计量单位
   */
  baseUnit: string;

  /**
   * 可选计量单位
   */
  altUnit: string;

  /**
   * 换算分子
   */
  numerator: number;

  /**
   * 换算分母
   */
  denominator: number;

  /**
   * 换算率=分子/分母
   */
  conversionRate: number;

  /**
   * 长度
   */
  length: number;

  /**
   * 宽度
   */
  width: string | number;

  /**
   * 高度
   */
  height: number;

  /**
   * 尺寸单位
   */
  dimUnit: string;

  /**
   * 体积
   */
  volume: number;

  /**
   * 体积单位
   */
  volUnit: string;

  /**
   * 毛重
   */
  grossWeight: number;

  /**
   * 净重
   */
  netWeight: number;

  /**
   * 重量单位
   */
  weightUnit: string;

}

export interface MaterialUnitConversionForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 物料编码
   */
  materialCode?: string;

  /**
   * 基本计量单位
   */
  baseUnit?: string;

  /**
   * 可选计量单位
   */
  altUnit?: string;

  /**
   * 换算分子
   */
  numerator?: number;

  /**
   * 换算分母
   */
  denominator?: number;

  /**
   * 换算率=分子/分母
   */
  conversionRate?: number;

  /**
   * 长度
   */
  length?: number;

  /**
   * 宽度
   */
  width?: string | number;

  /**
   * 高度
   */
  height?: number;

  /**
   * 尺寸单位
   */
  dimUnit?: string;

  /**
   * 体积
   */
  volume?: number;

  /**
   * 体积单位
   */
  volUnit?: string;

  /**
   * 毛重
   */
  grossWeight?: number;

  /**
   * 净重
   */
  netWeight?: number;

  /**
   * 重量单位
   */
  weightUnit?: string;

}

export interface MaterialUnitConversionQuery extends PageQuery {

  /**
   * 物料编码
   */
  materialCode?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



