export interface AutoDefinitionQuery extends PageQuery {
  automationCode?: string;
  automationName?: string;
  triggerType?: string;
  status?: string;
}

export interface AutoDefinitionVo {
  id: number | string;
  automationCode: string;
  automationName: string;
  categoryId?: number;
  description?: string;
  triggerType: string;
  status: string;
  currentVersion?: number;
  enabled?: number;
  createTime?: string;
}

export interface AutoDefinitionForm {
  id?: number | string;
  automationCode?: string;
  automationName?: string;
  categoryId?: number;
  description?: string;
  triggerType?: string;
  status?: string;
  currentVersion?: number;
  enabled?: number;
}

export interface AutoDesignCompileMessage {
  code: string;
  nodeId?: string;
  edgeId?: string;
  message: string;
}

export interface AutoDesignValidationVo {
  valid: boolean;
  errors: AutoDesignCompileMessage[];
  warnings: AutoDesignCompileMessage[];
}
