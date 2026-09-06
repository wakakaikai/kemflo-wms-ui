import type { Cell, Edge, Graph } from '@antv/x6';
import type { Ref } from 'vue';

interface Options {
  graph: Ref<Graph | undefined>;
}

export function useRoutingNodeMenu(options: Options) {
  const { graph } = options;

  const nodeVariables = reactive({
    menuVisible: false,
    pageX: 0,
    pageY: 0,
    menuCell: {} as Cell,
    menuEdge: {} as Edge,
    row: {},
    labelValue: ''
  });

  const menuHide = () => {
    nodeVariables.menuVisible = false;
    graph.value?.unlockScroller();
  };

  const nodeOrEdgeMenuBaseInfoSaveOrShow = (type: 'node' | 'edge', { cell, x, y }: { cell: Cell; x: number; y: number }) => {
    nodeVariables.menuEdge = (type === 'edge' ? cell : null) as Edge;
    nodeVariables.menuCell = (type === 'node' ? cell : null) as Cell;
    const data = graph.value!.localToPage(x, y);
    nodeVariables.pageX = data.x;
    nodeVariables.pageY = data.y;
    nodeVariables.menuVisible = true;
    graph.value!.lockScroller();
  };

  watch(
    graph,
    (instance, _prev, onCleanup) => {
      if (!instance) {
        return;
      }

      const onNodeContextMenu = ({ cell, x, y }: { cell: Cell; x: number; y: number }) => {
        nodeOrEdgeMenuBaseInfoSaveOrShow('node', { cell, x, y });
      };
      const onEdgeContextMenu = ({ cell, x, y }: { cell: Edge; x: number; y: number }) => {
        const labels = cell.getLabels();
        const first = labels?.[0] as any;
        nodeVariables.labelValue = (first?.attrs?.text?.text as string) || (first?.attrs?.label?.text as string) || '';
        nodeOrEdgeMenuBaseInfoSaveOrShow('edge', { cell, x, y });
      };

      instance.on('node:contextmenu', onNodeContextMenu);
      instance.on('edge:contextmenu', onEdgeContextMenu);

      onCleanup(() => {
        instance.off('node:contextmenu', onNodeContextMenu);
        instance.off('edge:contextmenu', onEdgeContextMenu);
      });
    },
    { immediate: true }
  );

  return {
    nodeVariables,
    menuHide
  };
}
