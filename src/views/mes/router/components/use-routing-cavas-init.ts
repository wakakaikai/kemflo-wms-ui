import type { Markup, Node } from '@antv/x6';
import { Export, Graph, Keyboard, MiniMap, Scroller, Selection, Shape, Snapline } from '@antv/x6';
import { useDebounceFn } from '@vueuse/core';
import type { Ref } from 'vue';
import { EDGE, NODE, ROUTING_EDGE_NAME, ROUTING_NODE_NAME } from './routing-config';
import { fitRoutingGraphView, resizeRoutingGraph } from './use-routing-viewport';

interface Options {
  readonly: Ref<boolean>;
  graph: Ref<Graph | undefined>;
}

export function useRoutingCanvasInit(options: Options) {
  const { readonly, graph } = options;

  const paper = ref<HTMLElement>();
  const minimap = ref<HTMLElement>();
  const container = ref<HTMLElement>();

  function getContainerSize() {
    const width = container.value?.clientWidth ?? 0;
    const height = container.value?.clientHeight ?? 0;
    return { width, height };
  }

  function registerCustomCells() {
    Graph.registerNode(
      ROUTING_NODE_NAME,
      {
        inherit: 'rect',
        ...NODE
      },
      true
    );
    Graph.registerEdge(
      ROUTING_EDGE_NAME,
      {
        inherit: 'edge',
        ...EDGE
      },
      true
    );
  }

  function graphInit() {
    if (!paper.value) {
      throw new Error('[router] graph container is not ready');
    }

    const { width, height } = getContainerSize();

    return new Graph({
      container: paper.value,
      width: width || 800,
      height: height || 600,
      autoResize: false,
      background: { color: '#ffffff' },
      // 使用 Scroller 时关闭内置 panning，避免冲突（插件也会自动禁用）
      panning: false,
      scaling: {
        min: 0.2,
        max: 2
      },
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
        zoomAtMousePosition: true,
        minScale: 0.2,
        maxScale: 2
      },
      grid: {
        size: 10,
        visible: true,
        type: 'dot',
        args: { color: '#e8e8e8', thickness: 1 }
      },
      interacting: {
        edgeLabelMovable: false,
        nodeMovable: !readonly.value,
        magnetConnectable: !readonly.value
      },
      connecting: {
        allowMulti: false,
        allowBlank: false,
        allowLoop: false,
        allowEdge: false,
        allowNode: true,
        allowPort: false,
        highlight: true,
        createEdge() {
          return new Shape.Edge({
            shape: ROUTING_EDGE_NAME
          });
        }
      },
      highlighting: {
        nodeAvailable: {
          name: 'className',
          args: {
            className: 'available'
          }
        },
        magnetAvailable: {
          name: 'className',
          args: {
            className: 'available'
          }
        },
        magnetAdsorbed: {
          name: 'className',
          args: {
            className: 'adsorbed'
          }
        }
      }
    });
  }

  function usePlugins(instance: Graph) {
    const { width, height } = getContainerSize();

    instance.use(
      new Selection({
        enabled: true,
        multiple: false,
        rubberband: false,
        rubberEdge: false,
        movable: false,
        showNodeSelectionBox: false,
        showEdgeSelectionBox: false
      })
    );

    // https://x6.antv.antgroup.com/tutorial/plugins/scroller
    instance.use(
      new Scroller({
        enabled: true,
        className: 'routing-scroller',
        width: width || 800,
        height: height || 600,
        pannable: true,
        pageVisible: false,
        pageBreak: false,
        autoResize: true,
        minVisibleWidth: 50,
        minVisibleHeight: 50
      })
    );

    instance.use(new Snapline({ enabled: true, sharp: true }));
    instance.use(new Export());
    instance.use(new Keyboard({ enabled: true }));
  }

  function initMinimap(instance: Graph) {
    if (!minimap.value) {
      return;
    }
    instance.use(
      new MiniMap({
        container: minimap.value,
        scalable: true,
        width: 200,
        height: 120,
        padding: 10,
        minScale: 0.2,
        maxScale: 2
      })
    );
  }

  function scheduleMinimapInit(instance: Graph) {
    const run = () => initMinimap(instance);
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(run, { timeout: 1500 });
    } else {
      window.setTimeout(run, 200);
    }
  }

  function bindGraphEvents(instance: Graph) {
    instance.on('edge:connected', ({ isNew, edge }) => {
      if (isNew) {
        const sourceNode = edge.getSourceNode() as Node;
        if (sourceNode) {
          edge.setSource(sourceNode);
        }
      }
    });

    instance.on('node:mouseenter', ({ node }) => {
      const nodeName = node.getData()?.taskName;
      if (!nodeName) {
        return;
      }
      const markup = node.getMarkup() as Markup.JSONMarkup[];
      const fo = markup.find((m) => m.tagName === 'foreignObject');

      node.addTools({
        name: 'button',
        args: {
          markup: [
            {
              tagName: 'text',
              textContent: nodeName,
              attrs: {
                fill: '#868686',
                fontSize: 16,
                textAnchor: 'middle'
              }
            }
          ],
          x: 0,
          y: 0,
          offset: { x: 0, y: fo ? -28 : -10 }
        }
      });
    });

    instance.on('node:mouseleave', ({ node }) => {
      node.removeTool('button');
    });

    instance.bindKey(['delete', 'backspace'], () => {
      if (readonly.value) {
        return false;
      }
      const cells = instance.getSelectedCells();
      if (cells.length) {
        instance.removeCells(cells);
      }
      return false;
    });
  }

  const doResize = () => {
    if (!container.value || !graph.value) {
      return;
    }
    resizeRoutingGraph(graph.value, container.value.clientWidth, container.value.clientHeight);
  };

  const resize = useDebounceFn(doResize, 80);

  const fitView = () => fitRoutingGraphView(graph.value);

  useResizeObserver(container, resize);

  onMounted(async () => {
    registerCustomCells();
    const instance = graphInit();
    usePlugins(instance);
    bindGraphEvents(instance);
    graph.value = instance;

    await nextTick();
    resize();
    scheduleMinimapInit(instance);
  });

  onBeforeUnmount(() => {
    graph.value?.dispose();
    graph.value = undefined;
  });

  return {
    graph,
    paper,
    minimap,
    container,
    fitView,
    resize,
    resizeImmediate: doResize
  };
}
