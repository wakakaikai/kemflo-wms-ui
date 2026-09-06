import type { Cell, Edge, Graph, Node } from '@antv/x6';
import type { Ref } from 'vue';
import { EDGE, EDGE_HOVER, EDGE_SELECTED, NODE, NODE_HOVER, NODE_SELECTED, PORT, PORT_HOVER, PORT_SELECTED, ROUTING_PORT_OUT_NAME } from './routing-config';

interface Options {
  graph: Ref<Graph | undefined>;
}

export function useRoutingHighlight(options: Options) {
  const { graph } = options;
  const hoverCell = ref<Cell>();
  const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
  const merge = (target: any, source: any): any => {
    Object.keys(source || {}).forEach((key) => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = merge(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    });
    return target;
  };

  function setEdgeStyle(edge: Edge) {
    const isHover = edge === hoverCell.value;
    const isSelected = graph.value?.isSelected(edge);

    let edgeProps = null;

    if (isHover) edgeProps = merge(clone(EDGE), EDGE_HOVER);
    else if (isSelected) edgeProps = merge(clone(EDGE), EDGE_SELECTED);
    else edgeProps = clone(EDGE);
    edge.setAttrs(edgeProps.attrs);
    const currentLabel = edge.getLabels().length > 0 ? edge.getLabels()[0] : {};
    const nextLabel = merge(
      {
        ...clone(edgeProps.defaultLabel),
        attrs: clone(edgeProps.defaultLabel.attrs)
      },
      currentLabel
    );
    const labelText = nextLabel.attrs?.text?.text ?? nextLabel.attrs?.label?.text ?? '';
    nextLabel.attrs.text = { ...nextLabel.attrs.text, text: labelText };
    nextLabel.attrs.label = { ...nextLabel.attrs.label, text: labelText };
    edge.setLabels([nextLabel]);
  }

  function setNodeStyle(node: Node) {
    const isHover = node === hoverCell.value;
    const isSelected = graph.value?.isSelected(node);
    const portHover = clone(PORT_HOVER.groups[ROUTING_PORT_OUT_NAME].attrs);
    const portSelected = clone(PORT_SELECTED.groups[ROUTING_PORT_OUT_NAME].attrs);
    const portDefault = clone(PORT.groups[ROUTING_PORT_OUT_NAME].attrs);
    const nodeHover = merge(clone(NODE.attrs), NODE_HOVER.attrs);
    const nodeSelected = merge(clone(NODE.attrs), NODE_SELECTED.attrs);

    let nodeAttrs = null;
    let portAttrs = null;

    if (isHover || isSelected) {
      if (isHover) {
        nodeAttrs = nodeHover;
        portAttrs = merge(portDefault, portHover);
      } else {
        nodeAttrs = nodeSelected;
        portAttrs = merge(portDefault, portSelected);
      }
    } else {
      nodeAttrs = NODE.attrs;
      portAttrs = portDefault;
    }
    node.setAttrs(nodeAttrs);
    node.setPortProp(ROUTING_PORT_OUT_NAME, 'attrs', portAttrs);
  }

  function updateCellStyle(cell: Cell) {
    if (cell.isEdge()) setEdgeStyle(cell);
    else if (cell.isNode()) setNodeStyle(cell);
  }

  watch(
    graph,
    (instance, _prev, onCleanup) => {
      if (!instance) {
        return;
      }

      const onMouseEnter = ({ cell }: { cell: Cell }) => {
        hoverCell.value = cell;
        updateCellStyle(cell);
      };
      const onMouseLeave = ({ cell }: { cell: Cell }) => {
        hoverCell.value = undefined;
        updateCellStyle(cell);
      };
      const onSelected = ({ cell }: { cell: Cell }) => {
        updateCellStyle(cell);
      };
      const onUnselected = ({ cell }: { cell: Cell }) => {
        updateCellStyle(cell);
      };

      instance.on('cell:mouseenter', onMouseEnter);
      instance.on('cell:mouseleave', onMouseLeave);
      instance.on('cell:selected', onSelected);
      instance.on('cell:unselected', onUnselected);

      onCleanup(() => {
        instance.off('cell:mouseenter', onMouseEnter);
        instance.off('cell:mouseleave', onMouseLeave);
        instance.off('cell:selected', onSelected);
        instance.off('cell:unselected', onUnselected);
      });
    },
    { immediate: true }
  );

  return {
    hoverCell
  };
}
