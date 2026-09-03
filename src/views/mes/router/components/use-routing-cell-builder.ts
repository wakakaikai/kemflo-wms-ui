import { ROUTING_EDGE_NAME, ROUTING_NODE_NAME } from './routing-config'
import type { Coordinate } from './types'

export function useRoutingCellBuilder() {
  function parseLocationStr(locationStr: string) {
    let locations = null
    if (!locationStr)
      return locations
    locations = JSON.parse(locationStr)
    return Array.isArray(locations) ? locations : null
  }

  function buildEdgeJson(
    sourceId: string,
    targetId: string,
    label: '',
    isStream = false,
  ) {
    return {
      shape: ROUTING_EDGE_NAME,
      source: {
        cell: sourceId,
      },
      target: {
        cell: targetId,
      },
      labels: label ? [label] : undefined,
      attrs: {
        line: {
          strokeDasharray: isStream ? '5 5' : 'none',
        },
      },
    }
  }

  function buildNodeJson(
    id: string,
    label: string,
    flag: string,
    coordinate: Coordinate = { x: 100, y: 100 },
    routingNode: { [key: string]: any },
  ) {
    return {
      id,
      shape: ROUTING_NODE_NAME,
      x: coordinate.x,
      y: coordinate.y,
      data: {
        routingNode,
        taskName: label,
        flag,
      },
      attrs: {
        title: {
          text: label,
        },
        rect: {
          fill: flag === 'NO' ? '#f3f3f5' : '#ffffff',
        },
      },
    }
  }

  function buildGraphFromJson(definition: any) {
    if (!definition) {
      return { cells: [] }
    }
    if (typeof definition === 'string') {
      return JSON.parse(definition)
    }
    return definition
  }

  return {
    buildNodeJson,
    buildEdgeJson,
    buildGraphFromJson,
  }
}
