export interface Coordinate {
  x: number
  y: number
}

export interface Dragged {
  x: number
  y: number
  routingNode: { [key: string]: any }
}

// 对应后端工序主数据
export interface Process {
  // 工序唯一编号
  id: string
  // 工序名称
  name: string
  // 工序类型码，对应以类型码为名称的图标
  type: string
  [key: string]: any
}

// 对应后端基于工艺信息，以及工艺节点位置和连接的信息
export interface RoutingDef {
  routingCode: string
  routingName: string
  locations: string
}

export interface WorkflowDefinition {

}

export interface Connect {
  code?: string
  name: string
  routingVersoin?: number
  routingCode?: string
  preProcessCode: string
  preProcessVersion?: number
  postProcessCode: string
  postProcessVersion?: number
}

export interface RoutingProcess {
  code: string
  name: string
  version?: number
}

export interface RoutingFlow {
  routing: RoutingDef
  connects: Connect[]
  processes: RoutingProcess[]
}
