import type { Cell, Edge, Graph } from '@antv/x6'
import type { Ref } from 'vue'

interface Options {
  graph: Ref<Graph | undefined>
}

export function useRoutingNodeMenu(options: Options) {
  const { graph } = options

  const nodeVariables = reactive({
    menuVisible: false,
    pageX: 0,
    pageY: 0,
    menuCell: {} as Cell,
    menuEdge: {} as Edge,
    row: {},
    labelValue: '',
  })

  const menuHide = () => {
    nodeVariables.menuVisible = false

    graph.value?.unlockScroller()
  }

  const nodeOrEdgeMenuBaseInfoSaveOrShow = (
    type: 'node' | 'edge',
    { cell, x, y }: any) => {
    nodeVariables.menuEdge = type === 'edge' ? cell : null
    nodeVariables.menuCell = type === 'node' ? cell : null
    const data = graph.value!.localToPage(x, y)
    nodeVariables.pageX = data.x
    nodeVariables.pageY = data.y

    // show menu
    nodeVariables.menuVisible = true

    // lock scroller
    graph.value!.lockScroller()
  }

  onMounted(() => {
    if (graph.value) {
      graph.value.on('node:contextmenu', ({ cell, x, y }) => {
        nodeOrEdgeMenuBaseInfoSaveOrShow('node', { cell, x, y })
      })
      graph.value.on('edge:contextmenu', ({ cell, x, y }) => {
        nodeVariables.labelValue = cell.getLabels()[0].attrs ? cell.getLabels()[0].attrs?.text.text as string : ''
        nodeOrEdgeMenuBaseInfoSaveOrShow('edge', { cell, x, y })
      })
    }
  })

  return {
    nodeVariables,
    menuHide,
  }
}
