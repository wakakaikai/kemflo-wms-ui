export interface WmsUnitVO {
  /**
   * 主键ID
   */
  id: string | number;

  /**
   * 内部单位
   */
  innerName: string;

  /**
   * 商业单位
   */
  commercialName: string;

  /**
   * 技术单位
   */
  technicalName: string;

  /**
   * 计量单位短名称
   */
  unitShortName: string;

  /**
   * 计量单位长名称
   */
  unitLongName: string;

  /**
   * 备注
   */
  remark: string;

}

export interface WmsUnitForm extends BaseEntity {
  /**
   * 主键ID
   */
  id?: string | number;

  /**
   * 内部单位
   */
  innerName?: string;

  /**
   * 商业单位
   */
  commercialName?: string;

  /**
   * 技术单位
   */
  technicalName?: string;

  /**
   * 计量单位短名称
   */
  unitShortName?: string;

  /**
   * 计量单位长名称
   */
  unitLongName?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface WmsUnitQuery extends PageQuery {

  /**
   * 内部单位
   */
  innerName?: string;

  /**
   * 商业单位
   */
  commercialName?: string;

  /**
   * 技术单位
   */
  technicalName?: string;

  /**
   * 计量单位短名称
   */
  unitShortName?: string;

  /**
   * 计量单位长名称
   */
  unitLongName?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



