import type { Graph } from '@antv/x6';
import type { Scroller } from '@antv/x6';

const DEFAULT_FIT_PADDING = 32;
const DEFAULT_MAX_SCALE = 1.2;
const DEFAULT_MIN_READABLE_SCALE = 1;

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
 * 自适应画布：内容较多时优先保持工序节点可读，超出部分交给 Scroller 滚动查看。
 */
export function fitRoutingGraphView(graph: Graph | undefined, options?: { padding?: number; maxScale?: number; minScale?: number }) {
  if (!graph) {
    return;
  }

  const padding = options?.padding ?? DEFAULT_FIT_PADDING;
  const maxScale = options?.maxScale ?? DEFAULT_MAX_SCALE;
  const minScale = options?.minScale ?? DEFAULT_MIN_READABLE_SCALE;

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

  const contentArea = graph.getContentArea();
  const visibleArea = graph.getGraphArea();
  if (!contentArea.width || !contentArea.height || !visibleArea.width || !visibleArea.height) {
    return;
  }

  const currentScale = graph.zoom();
  const viewportWidth = visibleArea.width * currentScale;
  const viewportHeight = visibleArea.height * currentScale;
  const availableWidth = Math.max(1, viewportWidth - padding * 2);
  const availableHeight = Math.max(1, viewportHeight - padding * 2);
  const fitScale = Math.min(availableWidth / contentArea.width, availableHeight / contentArea.height);
  const targetScale = Math.min(maxScale, Math.max(minScale, fitScale));

  if (scroller) {
    scroller.zoomTo(targetScale);
    scroller.centerContent({ padding });
  } else {
    graph.zoomTo(targetScale);
    graph.centerContent({ padding });
  }
}

export function clientToRoutingLocal(graph: Graph, clientX: number, clientY: number) {
  const scroller = getScroller(graph);
  if (scroller) {
    return scroller.clientToLocalPoint(clientX, clientY);
  }
  return graph.clientToLocal(clientX, clientY);
}
