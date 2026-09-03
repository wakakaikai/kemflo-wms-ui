import type { Graph } from '@antv/x6'
import type { Ref } from 'vue'
import type { Coordinate } from './types'
import { useRoutingCellBuilder } from './use-routing-cell-builder'
import { ROUTING_NODE_NAME } from './routing-config'

interface Options {
  graph: Ref<Graph | undefined>
}

export function useRoutingCellUpdate(options: Options) {
  const { graph } = options

  const { buildNodeJson } = useRoutingCellBuilder()

  function setNodeName(id: string, newName: string) {
    const node = graph.value?.getCellById(id)
    if (node) {
      node.attr('title/text', newName)
      node.setData({ taskName: newName })
    }
  }

  function addNode(
    id: string,
    name: string,
    flag: string,
    coordinate: Coordinate = { x: 100, y: 100 },
    routingNode: { [key: string]: any },
  ) {
    // 添加一个sequence字段（后端要）,累加1; 默认类型是NORMAL正常工序
    const cells: any = graph.value?.getCells()?.filter((cell: any) => cell.shape === ROUTING_NODE_NAME)
    const number = cells.length > 0 ? cells[cells.length - 1]?.data?.routingNode?.number : 0
    const nodeId = `${id}-${Date.now()}-${number + 1}`
    const node = buildNodeJson(nodeId, name, flag, coordinate, { ...routingNode, id: nodeId, number: number + 1, stepType: 'NORMAL' })
    graph.value?.addNode(node)
  }

  return {
    setNodeName,
    addNode,
  }
}
