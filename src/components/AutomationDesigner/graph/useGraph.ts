import { NODE_PORTS, getNodeConfig } from '../types';
import { Graph, Shape, Node, Edge, Scroller, Selection, Snapline, Keyboard, Clipboard, History } from '@antv/x6';
import { registerVueNodes } from '../nodes/registerNodes';

// 注册自定义节点（使用 Vue 组件）
export function registerCustomNodes() {
  registerVueNodes();
}

// 注册连接边
export function registerCustomEdges() {
  Graph.registerEdge('automation-edge', {
    inherit: 'edge',
    attrs: {
      line: {
        stroke: '#c9cdd4',
        strokeWidth: 1.5,
        strokeDasharray: 'none',
        targetMarker: {
          name: 'classic',
          size: 7,
        },
      },
    },
    label: {
      fontSize: 11,
      fill: '#86909c',
    },
  });
}

// 初始化 Graph 实例
export function useGraph(container: HTMLDivElement): Graph {
  registerCustomNodes();
  registerCustomEdges();

  const graph = new Graph({
    container,
    width: container.clientWidth,
    height: container.clientHeight,
    background: {
      color: '#f8f9fa',
    },
    grid: {
      size: 10,
      visible: true,
      type: 'dot',
      args: { color: '#d0d5dd', thickness: 1 },
    },
    highlighting: {
      magnetAdsorbed: {
        name: 'stroke',
        args: { attrs: { fill: '#1677ff', stroke: '#1677ff' } },
      },
    },
    connecting: {
      router: 'manhattan',
      connector: {
        name: 'rounded',
        args: { radius: 8 },
      },
      anchor: 'center',
      snap: true,
      allowBlank: false,
      allowLoop: false,
      allowMulti: false,
      highlight: true,
      createEdge() {
        return new Shape.Edge({
          attrs: {
            line: {
              stroke: '#c9cdd4',
              strokeWidth: 1.5,
              targetMarker: {
                name: 'classic',
                size: 7,
              },
            },
          },
          zIndex: 0,
        });
      },
    },
    resizing: true,
    rotating: false,
    mousewheel: {
      enabled: true,
      zoomAtMousePosition: true,
    },
  });

  // X6 v3 插件模式：使用 graph.use() 注册插件
  graph.use(new Scroller({ enabled: true, pannable: true, pageVisible: false }));
  graph.use(new Selection({ enabled: true, multiple: true, rubberband: true, movable: true, showNodeSelectionBox: true }));
  graph.use(new Snapline({ enabled: true }));
  graph.use(new Keyboard({ enabled: true, global: false }));
  graph.use(new Clipboard({ enabled: true }));
  graph.use(new History({ enabled: true }));

  return graph;
}

// 添加节点到画布（使用 Vue 组件）
export function addNodeToGraph(graph: Graph, type: string, x: number, y: number): Node {
  const nodeConfig = getNodeConfig(type);
  if (!nodeConfig) throw new Error(`Unknown node type: ${type}`);

  const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  // 使用 Vue 组件节点（registerVueNodes 已确保所有节点注册成功）
  const shapeName = type + '-vue';

  const node = graph.addNode({
    id,
    shape: shapeName,
    x,
    y,
    width: 140,
    height: 56,
    data: {
      nodeType: type,
      label: nodeConfig.label,
      config: { ...(nodeConfig.defaultConfig || {}) },
    },
  });

  return node;
}

// 导出为定义 JSON
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
      label: node.getData()?.label || node.attr('label/text') || '',
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
      label: edge.getLabelAt(0)?.attrs?.label?.text || '',
    };
  });

  return { nodes, edges };
}

// 导入定义 JSON
export function importDesignJson(graph: Graph, data: any) {
  graph.clearCells();

  data.nodes?.forEach((n: any) => {
    const nodeConfig = getNodeConfig(n.type);
    if (!nodeConfig) return;

    const vueShape = n.type + '-vue';
    const shapeName = vueShape;

    graph.addNode({
      id: n.id,
      shape: shapeName,
      x: n.x,
      y: n.y,
      width: n.width || 140,
      height: n.height || 56,
      data: {
        nodeType: n.type,
        label: n.label || nodeConfig.label,
        config: n.config || {},
      },
    });
  });

  data.edges?.forEach((e: any) => {
    graph.addEdge({
      id: e.id,
      source: e.source,
      target: e.target,
      labels: e.label ? [{ attrs: { label: { text: e.label } } }] : [],
    });
  });
}