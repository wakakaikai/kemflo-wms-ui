import { getNodeConfig } from '../types';
import { Graph, Shape, Node, Selection, Snapline, Keyboard, Clipboard, History } from '@antv/x6';
import { registerVueNodes, CARD_WIDTH, CARD_HEIGHT, AGENT_PORTS } from '../nodes/registerNodes';

const COLOR_PORT_BLUE = '#5F95FF';

export function registerCustomNodes() {
  registerVueNodes();
}

export function registerCustomEdges() {
  Graph.registerEdge(
    'automation-edge',
    {
      inherit: 'edge',
      attrs: {
        line: {
          stroke: COLOR_PORT_BLUE,
          strokeWidth: 2,
          targetMarker: {
            name: 'block',
            width: 10,
            height: 6,
          },
        },
      },
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
      args: { color: '#e5e6eb', thickness: 1 },
    },
    // 空格+左键 / 滚轮 平移；只读模式下左键直接平移画布
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
      connector: { name: 'smooth' },
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
          attrs: {
            line: {
              stroke: COLOR_PORT_BLUE,
              strokeWidth: 2,
              targetMarker: { name: 'block', width: 10, height: 6 },
            },
          },
          zIndex: 0,
        });
      },
      validateConnection({ targetMagnet }) {
        return !readonly && !!targetMagnet;
      },
    },
  });

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
export function resizeGraph(graph: Graph, width: number, height: number) {
  if (width <= 0 || height <= 0) return;
  graph.resize(width, height);
}

export function addNodeToGraph(graph: Graph, type: string, x: number, y: number): Node {
  const nodeConfig = getNodeConfig(type);
  if (!nodeConfig) throw new Error(`Unknown node type: ${type}`);

  const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const shapeName = type + '-vue';

  return graph.addNode({
    id,
    shape: shapeName,
    x,
    y,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    ports: AGENT_PORTS,
    data: {
      nodeType: type,
      label: nodeConfig.label,
      color: nodeConfig.color,
      config: { ...(nodeConfig.defaultConfig || {}) },
    },
  });
}

export function exportDesignJson(graph: Graph): any {
  const nodes = graph.getNodes().map(node => {
    const pos = node.getPosition();
    const size = node.getSize();
    return {
      id: node.id,
      type: node.getData()?.nodeType || '',
      x: pos.x,
      y: pos.y,
      width: size.width,
      height: size.height,
      label: node.getData()?.label || '',
      config: node.getData()?.config || {},
    };
  });

  const edges = graph.getEdges().map(edge => {
    const source = edge.getSourceCell() as Node;
    const target = edge.getTargetCell() as Node;
    return {
      id: edge.id,
      source: source?.id || '',
      target: target?.id || '',
      sourcePort: edge.getSourcePortId() || 'bottom',
      targetPort: edge.getTargetPortId() || 'top',
      label: edge.getLabelAt(0)?.attrs?.label?.text || '',
    };
  });

  return { nodes, edges };
}

export function importDesignJson(graph: Graph, data: any) {
  graph.clearCells();

  data.nodes?.forEach((n: any) => {
    const nodeConfig = getNodeConfig(n.type);
    if (!nodeConfig) return;

    graph.addNode({
      id: n.id,
      shape: n.type + '-vue',
      x: n.x,
      y: n.y,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      ports: AGENT_PORTS,
      data: {
        nodeType: n.type,
        label: n.label || nodeConfig.label,
        color: nodeConfig.color,
        config: n.config || {},
      },
    });
  });

  data.edges?.forEach((e: any) => {
    graph.addEdge({
      id: e.id,
      shape: 'automation-edge',
      source: { cell: e.source, port: e.sourcePort || 'bottom' },
      target: { cell: e.target, port: e.targetPort || 'top' },
      labels: e.label ? [{ attrs: { label: { text: e.label } } }] : [],
    });
  });
}
