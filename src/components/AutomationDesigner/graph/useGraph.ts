import { getNodeConfig } from '../types';
import { Graph, Shape, Node, Selection, Snapline, Keyboard, Clipboard, History } from '@antv/x6';
import { registerVueNodes, CARD_WIDTH, CARD_HEIGHT, END_CARD_WIDTH, END_CARD_HEIGHT, BRANCH_CARD_WIDTH, BRANCH_CARD_HEIGHT, VERTICAL_PORTS } from '../nodes/registerNodes';

export { CARD_WIDTH, CARD_HEIGHT, END_CARD_WIDTH, END_CARD_HEIGHT, BRANCH_CARD_WIDTH, BRANCH_CARD_HEIGHT };

const COLOR_PORT_BLUE = '#5F95FF';
const COLOR_EDGE = '#d0d4dc';

function isBranchType(type: string) {
  return type === 'CONDITION' || type === 'SWITCH';
}

function getNodeSize(type: string) {
  if (type === 'END') return { w: END_CARD_WIDTH, h: END_CARD_HEIGHT };
  if (isBranchType(type)) return { w: BRANCH_CARD_WIDTH, h: BRANCH_CARD_HEIGHT };
  return { w: CARD_WIDTH, h: CARD_HEIGHT };
}

/** 竖向流程连线：曼哈顿路由，仅上下方向 */
export const VERTICAL_EDGE_ATTRS = {
  line: {
    stroke: COLOR_EDGE,
    strokeWidth: 1,
    targetMarker: null,
  },
};

export function applyVerticalEdgeStyle(edge: any) {
  if (!edge) return;
  try {
    edge.removeTools?.();
  } catch {
    // ignore
  }
  edge.setRouter({
    name: 'manhattan',
    args: {
      padding: 20,
      step: 10,
      startDirections: ['bottom'],
      endDirections: ['top'],
    },
  });
  edge.setConnector({ name: 'normal' });
  edge.setAttrs(VERTICAL_EDGE_ATTRS);
}

export function registerCustomNodes() {
  registerVueNodes();
}

export function registerCustomEdges() {
  Graph.registerEdge(
    'automation-edge',
    {
      inherit: 'edge',
      attrs: VERTICAL_EDGE_ATTRS,
    },
    true,
  );
}

export function useGraph(container: HTMLDivElement, options?: { readonly?: boolean }): Graph {
  registerCustomNodes();
  registerCustomEdges();

  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;
  const readonly = !!options?.readonly;

  const graph = new Graph({
    container,
    width,
    height,
    autoResize: false,
    background: { color: '#f7f8fa' },
    grid: {
      size: 10,
      visible: true,
      type: 'dot',
      args: { color: '#e5e6eb', thickness: 1 },
    },
    panning: {
      enabled: true,
      modifiers: readonly ? undefined : ['space'],
      eventTypes: ['leftMouseDown', 'mouseWheel'],
    },
    mousewheel: {
      enabled: true,
      modifiers: ['ctrl', 'meta'],
      zoomAtMousePosition: true,
      minScale: 0.4,
      maxScale: 2.5,
      factor: 1.1,
    },
    interacting: {
      nodeMovable: !readonly,
      edgeMovable: false,
      edgeLabelMovable: false,
      arrowheadMovable: false,
      vertexMovable: false,
      vertexAddable: false,
      vertexDeletable: false,
    },
    highlighting: {
      magnetAdsorbed: {
        name: 'stroke',
        args: { attrs: { fill: COLOR_PORT_BLUE, stroke: COLOR_PORT_BLUE } },
      },
    },
    connecting: {
      connector: { name: 'normal' },
      router: {
        name: 'manhattan',
        args: {
          padding: 20,
          step: 10,
          startDirections: ['bottom'],
          endDirections: ['top'],
        },
      },
      connectionPoint: 'anchor',
      anchor: 'center',
      snap: { radius: 24 },
      allowBlank: false,
      allowLoop: false,
      allowEdge: false,
      allowMulti: false,
      highlight: !readonly,
      createEdge() {
        return new Shape.Edge({
          shape: 'automation-edge',
          attrs: VERTICAL_EDGE_ATTRS,
          zIndex: 0,
        });
      },
      validateConnection({ targetMagnet }) {
        return !readonly && !!targetMagnet;
      },
    },
  });

  (graph as any).__automationReadonly = readonly;

  graph.use(new Selection({
    enabled: true,
    multiple: !readonly,
    rubberband: !readonly,
    modifiers: readonly ? undefined : ['shift'],
    movable: !readonly,
    showNodeSelectionBox: true,
    pointerEvents: 'none',
  }));
  if (!readonly) {
    graph.use(new Snapline({ enabled: true }));
    graph.use(new Keyboard({ enabled: true, global: false }));
    graph.use(new Clipboard({ enabled: true }));
    graph.use(new History({ enabled: true }));
  }

  return graph;
}

/** 按外层容器尺寸同步画布 */
/** 按外层容器尺寸同步画布 */
export function resizeGraph(graph: Graph, width: number, height: number) {
  if (width <= 0 || height <= 0) return;
  graph.resize(width, height);
}

export function addNodeToGraph(graph: Graph, type: string, x: number, y: number): Node {
  const nodeConfig = getNodeConfig(type);
  if (!nodeConfig) throw new Error(`Unknown node type: ${type}`);

  const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const shapeName = type + '-vue';
  const { w, h } = getNodeSize(type);
  const ports = type === 'END'
    ? { groups: VERTICAL_PORTS.groups, items: [{ id: 'top', group: 'top' }] }
    : VERTICAL_PORTS;

  return graph.addNode({
    id,
    shape: shapeName,
    x,
    y,
    width: w,
    height: h,
    ports,
    data: {
      nodeType: type,
      label: nodeConfig.label,
      color: nodeConfig.color,
      config: { ...(nodeConfig.defaultConfig || {}) },
    },
  });
}

/** 竖向对齐：新节点居中对齐到源节点下方 */
export function alignNodeBelow(sourceNode: Node, targetNode: Node, gap = 56) {
  const src = sourceNode.getBBox();
  const tgt = targetNode.getBBox();
  targetNode.setPosition({
    x: src.x + src.width / 2 - tgt.width / 2,
    y: src.y + src.height + gap,
  });
}

export function centerNodeX(graph: Graph, node: Node, x: number) {
  const box = node.getBBox();
  const canvasCenter = graph.options.width ? graph.options.width / 2 : 400;
  const targetX = x > 0 ? x - box.width / 2 : canvasCenter - box.width / 2;
  node.setPosition({ x: targetX, y: box.y });
}

export function exportDesignJson(graph: Graph): any {
  const json = graph.toJSON();
  // 不持久化连线上的交互工具（如中点加号）
  if (Array.isArray(json.cells)) {
    json.cells.forEach((cell: any) => {
      if (cell.tools) delete cell.tools;
    });
  }
  return json;
}

export function importDesignJson(graph: Graph, data: any) {
  graph.clearCells();
  if (!data) return;

  // 原生 cells 结构
  if (Array.isArray(data.cells) && data.cells.length > 0) {
    graph.fromJSON(data);
    graph.getEdges().forEach((edge) => applyVerticalEdgeStyle(edge));
    return;
  }

  // 兼容旧版自定义 {nodes,edges}
  if (Array.isArray(data.nodes) || Array.isArray(data.edges)) {
    data.nodes?.forEach((n: any) => {
      const nodeConfig = getNodeConfig(n.type || n.nodeType || n.data?.nodeType);
      if (!nodeConfig) return;
      const type = n.type || n.nodeType || n.data?.nodeType;
      const { w, h } = getNodeSize(type);
      const ports = type === 'END'
        ? { groups: VERTICAL_PORTS.groups, items: [{ id: 'top', group: 'top' }] }
        : VERTICAL_PORTS;
      graph.addNode({
        id: n.id,
        shape: type + '-vue',
        x: n.x ?? n.position?.x ?? 0,
        y: n.y ?? n.position?.y ?? 0,
        width: w,
        height: h,
        ports,
        data: {
          nodeType: type,
          label: n.label || n.data?.label || nodeConfig.label,
          color: nodeConfig.color,
          config: n.config || n.data?.config || {},
        },
      });
    });
    data.edges?.forEach((e: any) => {
      const source = typeof e.source === 'object' ? e.source.cell || e.source : e.source;
      const target = typeof e.target === 'object' ? e.target.cell || e.target : e.target;
      graph.addEdge({
        id: e.id,
        shape: 'automation-edge',
        source: { cell: source, port: e.sourcePort || e.source?.port || 'bottom' },
        target: { cell: target, port: e.targetPort || e.target?.port || 'top' },
        labels: e.label ? [{ attrs: { label: { text: e.label } } }] : [],
        data: e.data || {},
      });
      applyVerticalEdgeStyle(graph.getCellById(e.id));
    });
    return;
  }

  graph.fromJSON(data);
  graph.getEdges().forEach((edge) => applyVerticalEdgeStyle(edge));
}

/** 应用运行时节点状态高亮（不写回保存 JSON） */
export function applyNodeRuntimeStatus(graph: Graph, nodeId: string, status?: string) {
  const cell = graph.getCellById(nodeId);
  if (!cell || !cell.isNode()) return;
  const data = { ...(cell.getData() || {}), runtimeStatus: status || '' };
  cell.setData(data);
}

export function clearNodeRuntimeStatus(graph: Graph) {
  graph.getNodes().forEach((node) => {
    const data = node.getData() || {};
    if (data.runtimeStatus) {
      node.setData({ ...data, runtimeStatus: '' });
    }
  });
}
