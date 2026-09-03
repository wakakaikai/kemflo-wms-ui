import type { Ref } from 'vue'
import { nextTick, watch } from 'vue'
import type { Graph } from '@antv/x6'
import { useRoutingCellBuilder } from './use-routing-cell-builder'
import { fitRoutingGraphView } from './use-routing-viewport'

interface Options {
  graph: Ref<Graph | undefined>
  definition: Ref<any | undefined>
}

/**
 * Backfill workflow into graph
 */
export function useRoutingBackfill(options: Options) {
  const { graph, definition } = options

  const { buildGraphFromJson } = useRoutingCellBuilder()
  let loadedContent = ''

  watch(
    [graph, () => definition.value?.routerContent],
    async () => {
      const content = definition.value?.routerContent
      if (!graph.value || !content) {
        return
      }
      const contentKey = typeof content === 'string' ? content : JSON.stringify(content)
      if (contentKey === loadedContent) {
        return
      }
      loadedContent = contentKey

      try {
        graph.value.fromJSON(buildGraphFromJson(content) || { cells: [] })
        await nextTick()
        fitRoutingGraphView(graph.value)
      } catch (error) {
        console.error('[router] failed to restore graph content', error)
      }
    },
    { flush: 'post' },
  )

  return {}
}
