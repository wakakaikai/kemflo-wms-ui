export interface AssembleForm {
  /**
   * 产品条码
   */
  sfc: string;
  steps?: any[];
  stepActive?: number;
  stepName?: string;
  bomComponentVo?: any;
  bomComponentVoList?: any[];
  canAssembleComponents: boolean;
  assembleId: number;
  newBomItemSfc: string;
  itemNeedValid: boolean;
  itemNeedCheck: boolean;
}

export interface AssembleQuery extends PageQuery {
  /**
   * 产品条码
   */
  sfc: string;
  steps?: any[];
  stepActive?: number;
  stepName?: string;
  bomComponentVo?: any;
  bomComponentVoList?: any[];
  canAssembleComponents: boolean;
  assembleId: number;
  newBomItemSfc: string;
  itemNeedValid: boolean;
  itemNeedCheck: boolean;
}
