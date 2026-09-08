import { getNodeConfig } from '../types';
import { Graph, Shape, Node, Selection, Snapline, Keyboard, Clipboard, History } from '@antv/x6';
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
  syncBranchPorts,
} from '../nodes/registerNodes';

export { CARD_WIDTH, CARD_HEIGHT, END_CARD_WIDTH, END_CARD_HEIGHT, BRANCH_CARD_WIDTH, BRANCH_CARD_HEIGHT, syncBranchPorts };

const COLOR_PORT_BLUE = '#5F95FF';
const COLOR_EDGE = '#b7bdc7';

function isBranchType(type: string) {
  return type === 'CONDITION' || type === 'SWITCH';
}

function getNodeSize(type: string) {
  if (type === 'END') return { w: END_CARD_WIDTH, h: END_CARD_HEIGHT };
  if (isBranchType(type)) return { w: BRANCH_CARD_WIDTH, h: BRANCH_CARD_HEIGHT };
  return { w: CARD_WIDTH, h: CARD_HEIGHT };
}

/** Jeecg 风格横向流程连线：平滑贝塞尔曲线 */
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

export function applyFlowEdgeStyle(edge: any) {
  if (!edge) return;
  try {
    edge.removeTools?.();
  } catch {
    // ignore
  }
  edge.setRouter(FLOW_EDGE_ROUTER);
  edge.setConnector(FLOW_EDGE_CONNECTOR);
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
    background: { color: '#f5f6f7' },
    grid: {
      size: 10,
      visible: true,
      type: 'dot',
      args: { color: '#dfe3e8', thickness: 1 },
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
      snap: { radius: 24 },
      allowBlank: false,
      allowLoop: false,
      allowEdge: false,
      allowMulti: true,
      highlight: !readonly,
      createEdge() {
        return new Shape.Edge({
          shape: 'automation-edge',
          attrs: FLOW_EDGE_ATTRS,
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

  // 节点移动后重算连线路径，使线条绕开卡片
  graph.on('node:change:position', () => {
    graph.getEdges().forEach((edge) => applyFlowEdgeStyle(edge));
  });

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

function resolveLegacyPort(port?: string) {
  return normalizePortId(port);
}

export function importDesignJson(graph: Graph, data: any) {
  graph.clearCells();
  if (!data) return;

  if (Array.isArray(data.cells) && data.cells.length > 0) {
    graph.fromJSON(data);
    graph.getNodes().forEach((node) => {
      node.setZIndex(2);
      const nodeType = node.getData()?.nodeType;
      if (nodeType) {
        node.setProp('ports', getNodePorts(nodeType));
        syncBranchPorts(node);
      }
    });
    graph.getEdges().forEach((edge) => {
      const source = edge.getSource() as any;
      const target = edge.getTarget() as any;
      if (source?.port) {
        edge.setSource({ ...source, port: resolveLegacyPort(source.port) });
      }
      if (target?.port) {
        edge.setTarget({ ...target, port: resolveLegacyPort(target.port) });
      }
      applyFlowEdgeStyle(edge);
    });
    return;
  }

  if (Array.isArray(data.nodes) || Array.isArray(data.edges)) {
    data.nodes?.forEach((n: any) => {
      const nodeConfig = getNodeConfig(n.type || n.nodeType || n.data?.nodeType);
      if (!nodeConfig) return;
      const type = n.type || n.nodeType || n.data?.nodeType;
      const { w, h } = getNodeSize(type);
      graph.addNode({
        id: n.id,
        shape: type + '-vue',
        x: n.x ?? n.position?.x ?? 0,
        y: n.y ?? n.position?.y ?? 0,
        width: w,
        height: h,
        zIndex: 2,
        ports: getNodePorts(type),
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
        source: { cell: source, port: resolveLegacyPort(e.sourcePort || e.source?.port || 'right') },
        target: { cell: target, port: resolveLegacyPort(e.targetPort || e.target?.port || 'left') },
        labels: e.label ? [{ attrs: { label: { text: e.label } } }] : [],
        data: e.data || {},
      });
      applyFlowEdgeStyle(graph.getCellById(e.id));
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
