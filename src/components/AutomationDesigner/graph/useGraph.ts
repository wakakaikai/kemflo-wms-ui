import { getNodeConfig } from '../types';
import { Graph, Shape, Node, Edge, Selection, Snapline, Keyboard, Clipboard, History } from '@antv/x6';
import {
  registerVueNodes,
  CARD_WIDTH,
  CARD_HEIGHT,
  END_CARD_WIDTH,
  END_CARD_HEIGHT,
  BRANCH_CARD_WIDTH,
  BRANCH_CARD_HEIGHT,
  getNodePorts,
  normalizePortId,
  getDefaultSourcePort,
  syncBranchPorts,
} from '../nodes/registerNodes';

export { CARD_WIDTH, CARD_HEIGHT, END_CARD_WIDTH, END_CARD_HEIGHT, BRANCH_CARD_WIDTH, BRANCH_CARD_HEIGHT, syncBranchPorts };

const COLOR_PORT_BLUE = '#5F95FF';
const COLOR_EDGE = '#c2c8d5';

function isBranchType(type: string) {
  return type === 'CONDITION' || type === 'SWITCH';
}

function getNodeSize(type: string) {
  if (type === 'END') return { w: END_CARD_WIDTH, h: END_CARD_HEIGHT };
  if (isBranchType(type)) return { w: BRANCH_CARD_WIDTH, h: BRANCH_CARD_HEIGHT };
  return { w: CARD_WIDTH, h: CARD_HEIGHT };
}

/** 横向主链使用平滑曲线，回连与上下排列使用避障圆角路径。 */
export const FLOW_EDGE_ATTRS = {
  line: {
    stroke: COLOR_EDGE,
    strokeWidth: 1.5,
    targetMarker: null,
  },
};

export const FLOW_EDGE_ROUTER = {
  name: 'normal',
};

export const FLOW_EDGE_CONNECTOR = {
  name: 'smooth',
  args: {
    direction: 'H',
  },
};

const FLOW_AVOIDANCE_ROUTER = {
  name: 'manhattan',
  args: {
    startDirections: ['right'],
    endDirections: ['left'],
    padding: 24,
    step: 8,
    perpendicular: false,
  },
};

const FLOW_AVOIDANCE_CONNECTOR = {
  name: 'rounded',
  args: { radius: 16 },
};

/** 清除旧的节点边界锚点，始终将连线接到真实端口的中心。 */
function resolveFlowTerminal(terminal: any, type: 'source' | 'target', ports: string[] = [], nodeType = '') {
  const endpoint = typeof terminal === 'string' ? { cell: terminal } : terminal;
  if (endpoint?.cell == null) return endpoint;
  const fallbackPort = type === 'source' ? getDefaultSourcePort(nodeType) : 'left';
  const normalizedPort = normalizePortId(endpoint.port);
  const port = type === 'target'
    ? 'left'
    : ports.includes(normalizedPort) && normalizedPort !== 'left'
      ? normalizedPort
      : fallbackPort;
  return {
    cell: endpoint.cell,
    port,
    anchor: { name: 'center' },
    connectionPoint: { name: 'anchor' },
  };
}

export function applyFlowEdgeStyle(edge: Edge) {
  if (!edge) return;
  try {
    edge.removeTools?.();
  } catch {
    // ignore
  }
  const sourceNode = edge.getSourceNode();
  const targetNode = edge.getTargetNode();
  if (sourceNode) {
    edge.setSource(resolveFlowTerminal(
      edge.getSource(), 'source', sourceNode.getPorts().map(port => port.id!).filter(Boolean), sourceNode.getData()?.nodeType,
    ));
  }
  if (targetNode) {
    edge.setTarget(resolveFlowTerminal(edge.getTarget(), 'target'));
  }
  // smooth(H) 在目标位于出口左边时会先向卡片内部弯曲，必须改用避障路径。
  const needsAvoidance = sourceNode && targetNode
    && targetNode.getBBox().left - sourceNode.getBBox().right < 24;
  edge.setRouter(needsAvoidance ? FLOW_AVOIDANCE_ROUTER : FLOW_EDGE_ROUTER);
  edge.setConnector(needsAvoidance ? FLOW_AVOIDANCE_CONNECTOR : FLOW_EDGE_CONNECTOR);
  edge.setAttrs(FLOW_EDGE_ATTRS);
  edge.setZIndex(0);
}

/** @deprecated 兼容旧引用 */
export const VERTICAL_EDGE_ATTRS = FLOW_EDGE_ATTRS;
export function applyVerticalEdgeStyle(edge: any) {
  applyFlowEdgeStyle(edge);
}

export function registerCustomNodes() {
  registerVueNodes();
}

export function registerCustomEdges() {
  Graph.registerEdge(
    'automation-edge',
    {
      inherit: 'edge',
      attrs: FLOW_EDGE_ATTRS,
      router: FLOW_EDGE_ROUTER,
      connector: FLOW_EDGE_CONNECTOR,
      zIndex: 0,
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
    background: { color: '#ffffff' },
    grid: {
      size: 10,
      visible: true,
      type: 'dot',
      args: { color: '#e6eaf0', thickness: 1 },
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
      connector: FLOW_EDGE_CONNECTOR,
      router: FLOW_EDGE_ROUTER,
      connectionPoint: 'anchor',
      anchor: 'center',
      snap: { radius: 20 },
      allowBlank: false,
      allowLoop: false,
      allowEdge: false,
      allowMulti: false,
      highlight: !readonly,
      createEdge() {
        return new Shape.Edge({
          shape: 'automation-edge',
          attrs: FLOW_EDGE_ATTRS,
          zIndex: 0,
        });
      },
      validateMagnet({ magnet }) {
        // 只能从输出端口开始拖线。
        return !readonly && magnet.getAttribute('port')?.startsWith('right') === true;
      },
      validateConnection({ sourceCell, targetCell, sourceMagnet, targetMagnet }) {
        return !readonly
          && sourceCell !== targetCell
          && sourceMagnet?.getAttribute('port')?.startsWith('right') === true
          && targetMagnet?.getAttribute('port') === 'left';
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

  // 自动测量卡片高度或拖动节点后，重新选择直连 / 避障路径。
  const refreshEdgePaths = () => {
    graph.getEdges().forEach((edge) => applyFlowEdgeStyle(edge));
  };
  graph.on('node:change:position', refreshEdgePaths);
  graph.on('node:change:size', refreshEdgePaths);
  graph.on('edge:connected', ({ edge }) => applyFlowEdgeStyle(edge));

  return graph;
}

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

  const added = graph.addNode({
    id,
    shape: shapeName,
    x,
    y,
    width: w,
    height: h,
    zIndex: 2,
    ports: getNodePorts(type),
    data: {
      nodeType: type,
      label: nodeConfig.label,
      color: nodeConfig.color,
      config: { ...(nodeConfig.defaultConfig || {}) },
    },
  });
  syncBranchPorts(added);
  return added;
}

/** 横向对齐：新节点居中对齐到源节点右侧 */
export function alignNodeRight(sourceNode: Node, targetNode: Node, gap = 80) {
  const src = sourceNode.getBBox();
  const tgt = targetNode.getBBox();
  targetNode.setPosition({
    x: src.x + src.width + gap,
    y: src.y + src.height / 2 - tgt.height / 2,
  });
}

/** @deprecated */
export function alignNodeBelow(sourceNode: Node, targetNode: Node, gap = 56) {
  alignNodeRight(sourceNode, targetNode, gap);
}

export function centerNodeX(graph: Graph, node: Node, x: number) {
  const box = node.getBBox();
  const canvasCenter = graph.options.width ? graph.options.width / 2 : 400;
  const targetX = x > 0 ? x - box.width / 2 : canvasCenter - box.width / 2;
  node.setPosition({ x: targetX, y: box.y });
}

export function exportDesignJson(graph: Graph): any {
  const json = graph.toJSON();
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

  if (Array.isArray(data.cells) && data.cells.length > 0) {
    // 必须在 fromJSON 之前迁移端口；加载后删除 top/bottom 端口会被 X6 同时删除关联边。
    const nodeMetadata = new Map<string, any>();
    const cells = data.cells.map((cell: any) => {
      const nodeType = cell.data?.nodeType;
      if (!nodeType) return { ...cell };
      const node = { ...cell, zIndex: 2, ports: getNodePorts(nodeType, cell.data?.config) };
      nodeMetadata.set(String(cell.id), node);
      return node;
    });
    cells.forEach((cell: any) => {
      if (!cell.source || !cell.target) return;
      const sourceId = typeof cell.source === 'string' ? cell.source : cell.source.cell;
      const sourceNode = nodeMetadata.get(String(sourceId));
      const ports = sourceNode?.ports.items.map((port: any) => port.id) || [];
      cell.source = resolveFlowTerminal(cell.source, 'source', ports, sourceNode?.data.nodeType);
      cell.target = resolveFlowTerminal(cell.target, 'target');
      cell.shape = 'automation-edge';
      // 旧路径顶点属于旧的竖向布线，新的路由器按当前卡片位置计算。
      cell.vertices = [];
    });
    graph.fromJSON({ ...data, cells });
    graph.getEdges().forEach((edge) => applyFlowEdgeStyle(edge));
    return;
  }

  if (Array.isArray(data.nodes) || Array.isArray(data.edges)) {
    data.nodes?.forEach((n: any) => {
      const nodeConfig = getNodeConfig(n.type || n.nodeType || n.data?.nodeType);
      if (!nodeConfig) return;
      const type = n.type || n.nodeType || n.data?.nodeType;
      const { w, h } = getNodeSize(type);
      const node = graph.addNode({
        id: n.id,
        shape: type + '-vue',
        x: n.x ?? n.position?.x ?? 0,
        y: n.y ?? n.position?.y ?? 0,
        width: w,
        height: h,
        zIndex: 2,
        ports: getNodePorts(type, n.config || n.data?.config),
        data: {
          nodeType: type,
          label: n.label || n.data?.label || nodeConfig.label,
          color: nodeConfig.color,
          config: n.config || n.data?.config || {},
        },
      });
      syncBranchPorts(node);
    });
    data.edges?.forEach((e: any) => {
      const source = typeof e.source === 'object' ? e.source?.cell : e.source;
      const target = typeof e.target === 'object' ? e.target?.cell : e.target;
      const sourceNode = graph.getCellById(source);
      const sourceType = sourceNode?.getData()?.nodeType;
      const sourcePorts = sourceNode?.isNode() ? sourceNode.getPorts().map(port => port.id!).filter(Boolean) : [];
      const edge = graph.addEdge({
        id: e.id,
        shape: 'automation-edge',
        source: resolveFlowTerminal({ cell: source, port: e.sourcePort || e.source?.port }, 'source', sourcePorts, sourceType),
        target: resolveFlowTerminal({ cell: target, port: e.targetPort || e.target?.port }, 'target'),
        labels: e.label ? [{ attrs: { label: { text: e.label } } }] : [],
        data: e.data || {},
      });
      applyFlowEdgeStyle(edge);
    });
    return;
  }

  graph.fromJSON(data);
  graph.getEdges().forEach((edge) => applyFlowEdgeStyle(edge));
}

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
