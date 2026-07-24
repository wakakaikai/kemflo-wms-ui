export interface ScCollectParamMappingVO {
  id: string | number;
  deviceId: string | number;
  deviceCode?: string;
  deviceName?: string;
  collectParamId: string | number;
  collectParamCode?: string;
  collectParamName?: string;
  backendSystem?: string;
  backendParamCode: string;
  backendParamName?: string;
  transformType?: string;
  transformExpr?: string;
  status?: number;
  remark?: string;
}

export interface ScCollectParamMappingForm extends BaseEntity {
  id?: string | number;
  deviceId?: string | number;
  collectParamId?: string | number;
  backendSystem?: string;
  backendParamCode?: string;
  backendParamName?: string;
  transformType?: string;
  transformExpr?: string;
  status?: number;
  remark?: string;
}

export interface ScCollectParamMappingQuery extends PageQuery {
  deviceId?: string | number;
  collectParamId?: string | number;
  backendSystem?: string;
  backendParamCode?: string;
  backendParamName?: string;
  status?: number;
  params?: any;
}
