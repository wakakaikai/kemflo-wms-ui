export interface UserCollectionsVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 用户ID
   */
  userId: string | number;

  /**
   * 账号
   */
  userName: string;

  /**
   * 用户名称
   */
  nickName: string;

  /**
   * 收藏类型
   */
  collectionType: number;

  /**
   * 排序位置
   */
  sequence: number;

  /**
   * 备注
   */
  remark: string;

}

export interface UserCollectionsForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 用户ID
   */
  userId?: string | number;

  /**
   * 账号
   */
  userName?: string;

  /**
   * 用户名称
   */
  nickName?: string;

  /**
   * 收藏类型
   */
  collectionType?: number;

  /**
   * 排序位置
   */
  sequence?: number;

  /**
   * 备注
   */
  remark?: string;

}

export interface UserCollectionsQuery extends PageQuery {

  /**
   * 用户ID
   */
  userId?: string | number;

  /**
   * 账号
   */
  userName?: string;

  /**
   * 用户名称
   */
  nickName?: string;

  /**
   * 收藏类型
   */
  collectionType?: number;

  /**
   * 排序位置
   */
  sequence?: number;

    /**
     * 日期范围参数
     */
    params?: any;
}



