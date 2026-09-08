import { ROUTING_EDGE_NAME, ROUTING_NODE_NAME, ROUTING_NODE_ICON } from './routing-config';
import type { Coordinate } from './types';

export function useRoutingCellBuilder() {
  function parseLocationStr(locationStr: string) {
    let locations = null;
    if (!locationStr) return locations;
    locations = JSON.parse(locationStr);
    return Array.isArray(locations) ? locations : null;
  }

  function buildEdgeJson(sourceId: string, targetId: string, label = '', isStream = false) {
    return {
      shape: ROUTING_EDGE_NAME,
      source: {
        cell: sourceId
      },
      target: {
        cell: targetId
      },
      labels: label ? [label] : undefined,
      attrs: {
        line: {
          strokeDasharray: isStream ? '5 5' : 'none'
        }
      }
    };
  }

  function buildNodeJson(id: string, label: string, flag: string, coordinate: Coordinate = { x: 100, y: 100 }, routingNode: { [key: string]: any }) {
    return {
      id,
      shape: ROUTING_NODE_NAME,
      x: coordinate.x,
      y: coordinate.y,
      data: {
        routingNode,
        taskName: label,
        flag
      },
      attrs: {
        title: {
          text: label
        },
        body: {
          fill: flag === 'NO' ? '#f3f3f5' : '#ffffff'
        }
      }
    };
  }

  function buildGraphFromJson(definition: any) {
    if (!definition) {
      return { cells: [] };
    }
    const raw = typeof definition === 'string' ? JSON.parse(definition) : definition;
    if (!raw || typeof raw !== 'object') {
      return { cells: [] };
    }
    // 兼容旧数据：去掉已废弃的 nodemenu tool，避免 fromJSON 半途失败只渲染部分节点
    if (Array.isArray(raw.cells)) {
      raw.cells = raw.cells.map((cell: any) => {
        if (!cell || typeof cell !== 'object') {
          return cell;
        }
        const next = { ...cell };
        if (next.tools) {
          delete next.tools;
        }
        if (next.shape === ROUTING_NODE_NAME) {
          next.attrs = {
            ...(next.attrs || {}),
            image: {
              ...(next.attrs?.image || {}),
              href: ROUTING_NODE_ICON
            }
          };
        }
        return next;
      });
    }
    return raw;
  }

  return {
    buildNodeJson,
    buildEdgeJson,
    buildGraphFromJson
  };
}
