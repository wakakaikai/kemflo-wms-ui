export interface AutoInstanceQuery extends PageQuery {
  instanceNo?: string;
  status?: string;
  triggerType?: string;
  definitionId?: number | string;
}

export interface AutoInstanceVo {
  id: number | string;
  instanceNo: string;
  definitionId: number | string;
  definitionName?: string;
  definitionVersion?: number;
  businessType?: string;
  businessId?: string;
  status: string;
  triggerType: string;
  currentNodeId?: string;
  startTime?: string;
  endTime?: string;
  durationMs?: number;
  errorCode?: string;
  errorMessage?: string;
  createTime?: string;
}

export interface AutoInstanceStartBo {
  definitionId: number | string;
  definitionVersion?: number;
  triggerType?: string;
  variables?: Record<string, any>;
}

export interface AutoInstanceNodeStatus {
  nodeId: string;
  nodeType?: string;
  nodeName?: string;
  status: string;
  durationMs?: number;
  startTime?: string;
  endTime?: string;
  errorMessage?: string;
}

export interface AutoInstanceTraceVo {
  instanceId: number | string;
  status: string;
  currentNodeId?: string;
  errorMessage?: string;
  nodes: AutoInstanceNodeStatus[];
}
