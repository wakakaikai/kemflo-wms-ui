import type { Graph } from '@antv/x6';
import type { Scroller } from '@antv/x6';

function getScroller(graph: Graph): Scroller | null {
  return (graph.getPlugin('scroller') as Scroller | undefined) || null;
}

export function resizeRoutingGraph(graph: Graph | undefined, width: number, height: number) {
  if (!graph || width <= 0 || height <= 0) {
    return;
  }
  const scroller = getScroller(graph);
  if (scroller) {
    // Scroller 视口尺寸需单独更新，仅 graph.resize 不会撑满容器
    scroller.resize(width, height);
  } else {
    graph.resize(width, height);
  }
}

/**
 * 自适应画布：缩放并居中，使全部内容落入可视区域。
 */
export function fitRoutingGraphView(graph: Graph | undefined, options?: { padding?: number; maxScale?: number; minScale?: number }) {
  if (!graph) {
    return;
  }

  const padding = options?.padding ?? 48;
  const maxScale = options?.maxScale ?? 1;
  const minScale = options?.minScale ?? 0.35;

  const scroller = getScroller(graph);
  if (!graph.getCells().length) {
    graph.zoomTo(1);
    if (scroller) {
      scroller.center();
    } else {
      graph.centerContent();
    }
    return;
  }

  const fitOptions = { padding, maxScale, minScale };
  if (scroller) {
    scroller.zoomToFit(fitOptions);
  } else {
    graph.zoomToFit(fitOptions);
  }
}

export function clientToRoutingLocal(graph: Graph, clientX: number, clientY: number) {
  const scroller = getScroller(graph);
  if (scroller) {
    return scroller.clientToLocalPoint(clientX, clientY);
  }
  return graph.clientToLocal(clientX, clientY);
}
