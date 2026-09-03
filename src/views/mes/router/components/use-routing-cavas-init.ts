import type { Markup, Node } from '@antv/x6'
import { Graph } from '@antv/x6'
import { useDebounceFn } from '@vueuse/core'
import type { Ref } from 'vue'
import { EDGE, NODE, ROUTING_EDGE_NAME, ROUTING_NODE_NAME } from './routing-config'
import { fitRoutingGraphView, resizeRoutingGraph } from './use-routing-viewport'
import RoutingNodeMenu from './routing-node-menu.vue'

interface Options {
  readonly: Ref<boolean>
  graph: Ref<Graph | undefined>
}

export function useRoutingCanvasInit(options: Options) {
  const { readonly, graph } = options

  const paper = ref<HTMLElement>()
  const minimap = ref<HTMLElement>()
  const container = ref<HTMLElement>()

  function getContainerSize() {
    const width = container.value?.clientWidth ?? 0
    const height = container.value?.clientHeight ?? 0
    return { width, height }
  }

  function graphInit() {
    Graph.registerNodeTool('nodemenu', RoutingNodeMenu, true)

    const { width, height } = getContainerSize()

    return new Graph({
      container: paper.value,
      width: width || 800,
      height: height || 600,
      background: { color: '#f5f7fa' },
      selecting: {
        enabled: true,
        multiple: false,
        rubberband: false,
        rubberEdge: false,
        movable: false,
        showEdgeSelectionBox: false,
      },
      scaling: {
        min: 0.2,
        max: 2,
      },
      panning: {
        enabled: true,
        eventTypes: ['leftMouseDown', 'mouseWheel'],
      },
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
        zoomAtMousePosition: true,
        minScale: 0.2,
        maxScale: 2,
      },
      grid: {
        size: 10,
        visible: true,
        type: 'dot',
        args: { color: '#dcdfe6', thickness: 1 },
      },
      snapline: true,
      minimap: {
        enabled: true,
        container: minimap.value,
        scalable: false,
        width: 168,
        height: 104,
        padding: 8,
      },
      interacting: {
        edgeLabelMovable: false,
        nodeMovable: !readonly.value,
        magnetConnectable: !readonly.value,
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
          return graph.value?.createEdge({
            shape: ROUTING_EDGE_NAME,
          })
        },
      },
      highlighting: {
        nodeAvailable: {
          name: 'className',
          args: {
            className: 'available',
          },
        },
        magnetAvailable: {
          name: 'className',
          args: {
            className: 'available',
          },
        },
        magnetAdsorbed: {
          name: 'className',
          args: {
            className: 'adsorbed',
          },
        },
      },
    })
  }

  const resize = useDebounceFn(() => {
    if (!container.value || !graph.value) {
      return
    }
    resizeRoutingGraph(graph.value, container.value.clientWidth, container.value.clientHeight)
  }, 80)

  const fitView = () => fitRoutingGraphView(graph.value)

  useResizeObserver(container, resize)

  function registerCustomCells() {
    Graph.unregisterNode(ROUTING_NODE_NAME)
    Graph.unregisterEdge(ROUTING_EDGE_NAME)
    Graph.registerNode(ROUTING_NODE_NAME, { ...NODE })
    Graph.registerEdge(ROUTING_EDGE_NAME, { ...EDGE })
  }

  onMounted(async () => {
    registerCustomCells()
    graph.value = graphInit()

    graph.value.on('edge:connected', ({ isNew, edge }) => {
      if (isNew) {
        const sourceNode = edge.getSourceNode() as Node
        edge.setSource(sourceNode)
      }
    })

    graph.value.on('node:mouseenter', ({ node }) => {
      const nodeName = node.getData().taskName
      const markup = node.getMarkup() as Markup.JSONMarkup[]
      const fo = markup.filter(m => m.tagName === 'foreignObject')[0]

      node.addTools({
        name: 'button',
        args: {
          markup: [
            {
              tagName: 'text',
              textContent: nodeName,
              attrs: {
                'fill': '#868686',
                'font-size': 16,
                'font-anchor': 'center',
              },
            },
          ],
          x: 0,
          y: 0,
          offset: { x: 0, y: fo ? -28 : -10 },
        },
      })
    })

    graph.value.on('node:mouseleave', ({ node }) => {
      node.removeTool('button')
    })

    await nextTick()
    resize()
  })

  return {
    graph,
    paper,
    minimap,
    container,
    fitView,
    resize,
  }
}
