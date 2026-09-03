import type { Graph } from '@antv/x6'

export function resizeRoutingGraph(graph: Graph | undefined, width: number, height: number) {
  if (!graph || width <= 0 || height <= 0) {
    return
  }
  graph.resize(width, height)
}

export function fitRoutingGraphView(graph: Graph | undefined, options?: { padding?: number; maxScale?: number }) {
  if (!graph) {
    return
  }
  if (!graph.getCells().length) {
    graph.centerContent()
    graph.zoomTo(1)
    return
  }
  graph.zoomToFit({
    padding: options?.padding ?? 48,
    maxScale: options?.maxScale ?? 1,
    minScale: 0.35,
  })
}
