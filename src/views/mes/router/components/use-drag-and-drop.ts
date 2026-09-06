import type { Graph } from '@antv/x6';
import { ElMessage } from 'element-plus';
import type { Ref } from 'vue';
import type { Coordinate, Dragged } from './types';
import { clientToRoutingLocal } from './use-routing-viewport';

interface Options {
  readonly: Ref<boolean>;
  graph: Ref<Graph | undefined>;
  addNode: (id: string, name: string, flag: string, coor: Coordinate, routingNode: { [key: string]: any }) => boolean | void;
}

export function useDragAndDrop(options: Options) {
  const { readonly, graph, addNode } = options;

  const dragged = ref<Dragged>({
    x: 0,
    y: 0,
    routingNode: {}
  });

  const id = ref(0);

  function onDragStart(e: DragEvent, routingNode: { [key: string]: any }) {
    if (readonly.value) {
      e.preventDefault();
      return;
    }
    dragged.value = {
      x: e.offsetX,
      y: e.offsetY,
      routingNode
    };
  }

  function onDrop(e: DragEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (readonly.value) return;

    if (dragged.value && graph.value) {
      const { x: eX, y: eY, routingNode } = dragged.value;
      const { x, y } = clientToRoutingLocal(graph.value, e.clientX, e.clientY);
      id.value += 1;
      const added = addNode(routingNode.id, `${routingNode.description}`, '', { x: x - eX, y: y - eY }, routingNode);
      if (added === false) {
        ElMessage.warning('相同工序不能重复添加');
      }
    }
  }

  const preventDefault = (e: DragEvent) => {
    e.preventDefault();
  };

  return {
    onDragStart,
    onDrop,
    onDragenter: preventDefault,
    onDragover: preventDefault,
    onDragleave: preventDefault
  };
}
