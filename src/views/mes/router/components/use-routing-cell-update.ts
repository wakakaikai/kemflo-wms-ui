import type { Graph } from '@antv/x6';
import type { Ref } from 'vue';
import type { Coordinate } from './types';
import { useRoutingCellBuilder } from './use-routing-cell-builder';
import { ROUTING_NODE_NAME } from './routing-config';

interface Options {
  graph: Ref<Graph | undefined>;
}

export function useRoutingCellUpdate(options: Options) {
  const { graph } = options;

  const { buildNodeJson } = useRoutingCellBuilder();

  const getProcessKey = (routingNode: { [key: string]: any }) => String(routingNode?.sourceProcessKey || routingNode?.handle || routingNode?.operationRef || routingNode?.operation || routingNode?.id || '');

  function setNodeName(id: string, newName: string) {
    const node = graph.value?.getCellById(id);
    if (node) {
      node.attr('title/text', newName);
      node.setData({ taskName: newName });
    }
  }

  function addNode(id: string, name: string, flag: string, coordinate: Coordinate = { x: 100, y: 100 }, routingNode: { [key: string]: any }) {
    const cells: any[] = graph.value?.getCells()?.filter((cell: any) => cell.shape === ROUTING_NODE_NAME) || [];
    const processKey = getProcessKey(routingNode);
    const exists = cells.some((cell: any) => getProcessKey(cell?.data?.routingNode || {}) === processKey);
    if (processKey && exists) {
      return false;
    }

    const number = cells.length > 0 ? cells[cells.length - 1]?.data?.routingNode?.number : 0;
    const nodeId = `${id}-${Date.now()}-${number + 1}`;
    const node = buildNodeJson(nodeId, name, flag, coordinate, { ...routingNode, id: nodeId, sourceProcessKey: processKey, number: number + 1, stepType: 'NORMAL' });
    graph.value?.addNode(node);
    return true;
  }

  return {
    setNodeName,
    addNode
  };
}
