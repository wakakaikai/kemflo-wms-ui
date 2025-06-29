export interface DataCollectionForm {
  /**
   * 产品条码
   */
  sfc: string;
}

export interface DataCollectionQuery extends PageQuery {
  /**
   * 产品条码
   */
  sfc: string;
}
