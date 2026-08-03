<template>
  <div class="designer-root" @contextmenu.prevent="handleContextMenu">
    <div class="designer-layout">
      <!-- 画布区域（全宽） -->
      <div class="canvas-panel">
        <div class="toolbar">
          <div class="toolbar-left">
            <el-button size="small" type="primary" @click="handleSave">
              <template #icon><el-icon><Check /></el-icon></template>
              保存
            </el-button>
            <el-button size="small" @click="handleValidate">
              <template #icon><el-icon><Select /></el-icon></template>
              校验
            </el-button>
            <el-button size="small" type="success" @click="handlePublish">
              <template #icon><el-icon><Upload /></el-icon></template>
              发布
            </el-button>
            <el-divider direction="vertical" />
            <el-tooltip content="撤销 (Ctrl+Z)">
              <el-button size="small" :disabled="!canUndo" @click="handleUndo">
                <template #icon><el-icon><RefreshLeft /></el-icon></template>
              </el-button>
            </el-tooltip>
            <el-tooltip content="重做 (Ctrl+Shift+Z)">
              <el-button size="small" :disabled="!canRedo" @click="handleRedo">
                <template #icon><el-icon><RefreshRight /></el-icon></template>
              </el-button>
            </el-tooltip>
            <el-divider direction="vertical" />
            <el-tooltip content="缩小">
              <el-button size="small" @click="handleZoomOut">
                <template #icon><el-icon><ZoomOut /></el-icon></template>
              </el-button>
            </el-tooltip>
            <el-tooltip content="放大">
              <el-button size="small" @click="handleZoomIn">
                <template #icon><el-icon><ZoomIn /></el-icon></template>
              </el-button>
            </el-tooltip>
            <el-tooltip content="适应画布">
              <el-button size="small" @click="handleZoomToFit">
                <template #icon><el-icon><FullScreen /></el-icon></template>
              </el-button>
            </el-tooltip>
            <el-divider direction="vertical" />
            <el-tooltip content="导出JSON">
              <el-button size="small" @click="handleExport">
                <template #icon><el-icon><Download /></el-icon></template>
              </el-button>
            </el-tooltip>
            <el-upload accept=".json" :show-file-list="false" :before-upload="handleImport">
              <el-tooltip content="导入JSON">
                <el-button size="small">
                  <template #icon><el-icon><Upload /></el-icon></template>
                </el-button>
              </el-tooltip>
            </el-upload>
          </div>
          <div class="toolbar-right">
            <span class="toolbar-hint">
              <el-icon><InfoFilled /></el-icon>
              {{ definitionId ? '编辑流程' : '新建流程' }} · 右键画布添加节点
            </span>
          </div>
        </div>
        <div ref="canvasRef" class="canvas-container" @drop.prevent="handleDrop" @dragover.prevent @contextmenu.prevent="handleCanvasContextMenu">
          <div v-if="showEmptyHint" class="canvas-empty-hint">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d0d5dd" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <p class="empty-title">右键画布或从物料栏拖拽节点开始搭建流程</p>
            <p class="empty-desc">点击节点底部「+」添加后续节点</p>
          </div>
        </div>
        <div ref="minimapRef" class="designer-minimap" />
      </div>

      <!-- 右侧属性面板 -->
      <div class="property-panel">
        <div class="panel-header">
          <span class="panel-title">节点属性</span>
        </div>
        <PropertyPanel :node="selectedNode" @update-config="handleUpdateConfig" />
      </div>

      <!-- 底部日志 -->
      <div class="bottom-panel">
        <BottomPanel :logs="logs" />
      </div>
    </div>

    <!-- 浮动节点选择面板 -->
    <NodePicker
      :visible="pickerVisible"
      :anchor-rect="pickerAnchor"
      @select="handlePickerSelect"
      @close="pickerVisible = false"
    />

    <!-- 右键菜单 -->
    <div v-if="contextMenuVisible" class="context-menu" :style="contextMenuStyle" @mouseleave="contextMenuVisible = false">
      <div class="context-item" @click="handleContextAddNode">添加触发节点</div>
      <div class="context-item" @click="handleContextAddNode">添加结束节点</div>
      <div class="context-divider" />
      <div class="context-item" @click="contextMenuVisible = false">取消</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue';
import { Graph, Node, Cell, Edge, MiniMap } from '@antv/x6';
import { useGraph, addNodeToGraph, exportDesignJson, importDesignJson } from './graph/useGraph';
import { getNodeConfig } from './types';
import PropertyPanel from './panels/propertyPanel.vue';
import BottomPanel from './panels/bottomPanel.vue';
import NodePicker from './panels/NodePicker.vue';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';
import { on as eventOn } from './events';

const props = defineProps<{
  definitionId?: string;
}>();

const emit = defineEmits<{
  saved: [data: any];
  published: [];
}>();

const canvasRef = ref<HTMLDivElement>();
const minimapRef = ref<HTMLDivElement>();
const logs = ref<Array<{ level: string; message: string; time: string }>>([]);
const selectedNode = ref<Node | null>(null);
const canUndo = ref(false);
const canRedo = ref(false);
const showEmptyHint = ref(true);

// NodePicker 状态
const pickerVisible = ref(false);
const pickerAnchor = ref<{ x: number; y: number; width?: number; height?: number }>({ x: 0, y: 0 });
interface PickerSource {
  sourceNode?: any;
  sourceEdge?: any;
  x?: number;
  y?: number;
}
const pickerSource = ref<PickerSource>({});

// 右键菜单
const contextMenuVisible = ref(false);
const contextMenuStyle = ref<Record<string, string>>({});
const contextMenuPos = ref({ x: 0, y: 0 });

let graph: Graph | null = null;

function addLog(level: string, message: string) {
  const time = new Date().toLocaleTimeString();
  logs.value.push({ level, message, time });
  if (logs.value.length > 200) logs.value.shift();
}

function getAnchorRectFromGraph(x: number, y: number) {
  if (!graph || !canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  return { x: rect.left + x, y: rect.top + y };
}

onMounted(async () => {
  await nextTick();
  if (!canvasRef.value) return;

  graph = useGraph(canvasRef.value);

  // 小地图
  if (minimapRef.value) {
    graph.use(new MiniMap({
      container: minimapRef.value,
      width: 180, height: 120, padding: 10,
    }));
  }

  // === 节点选中事件 ===
  graph.on('node:selected', ({ node }) => { selectedNode.value = node; });
  graph.on('node:unselected', () => { selectedNode.value = null; });
  graph.on('blank:click', () => { selectedNode.value = null; });

  // === 历史变更 ===
  graph.on('history:change', () => {
    if (graph) { canUndo.value = graph.canUndo(); canRedo.value = graph.canRedo(); }
  });

  // === 节点/边变更 ===
  graph.on('cell:added', ({ cell }) => {
    showEmptyHint.value = false;
    if (cell.isNode()) addLog('info', `添加节点: ${cell.attr('label/text') || cell.id}`);
    else if (cell.isEdge()) addLog('info', `添加连线`);
  });
  graph.on('cell:removed', () => {
    if (graph && graph.getCells().length === 0) showEmptyHint.value = true;
  });

  // === Delete 删除 ===
  graph.bindKey(['del', 'backspace'], () => {
    const cells = graph?.getSelectedCells();
    if (cells && cells.length > 0) {
      cells.forEach(cell => cell.remove());
      addLog('info', `删除 ${cells.length} 个元素`);
    }
  });

  // === 监听节点「+」按钮事件（来自节点 Vue 组件） ===
  eventOn('node:plus-click', (data: PickerSource) => {
    pickerSource.value = data;
    const pos = getAnchorRectFromGraph(data.x!, data.y!);
    if (pos) {
      pickerAnchor.value = pos;
      pickerVisible.value = true;
    }
  });

  // === 节点悬停显示端口（参考智能体流程编排） ===
  graph.on('node:mouseenter', ({ node }: { node: Node }) => {
    node.getPorts().forEach(p => node.setPortProp(p.id!, 'attrs/circle/style/visibility', 'visible'));
  });
  graph.on('node:mouseleave', ({ node }: { node: Node }) => {
    const edges = graph!.getConnectedEdges(node);
    node.getPorts().forEach(p => {
      const connected = edges.some(e => e.getSourcePortId() === p.id || e.getTargetPortId() === p.id);
      node.setPortProp(p.id!, 'attrs/circle/style/visibility', connected ? 'visible' : 'hidden');
      const color = connected ? '#5F95FF' : '#C2C8D5';
      node.setPortProp(p.id!, 'attrs/circle/fill', color);
      node.setPortProp(p.id!, 'attrs/circle/stroke', color);
    });
  });

  // === 端口连线状态跟踪 ===
  graph.on('edge:added', ({ edge }: { edge: Edge }) => {
    [edge.getSourceCellId(), edge.getTargetCellId()].forEach((cid, i) => {
      const portId = i === 0 ? edge.getSourcePortId() : edge.getTargetPortId();
      if (!cid || !portId) return;
      const cell = graph!.getCellById(cid);
      if (cell?.isNode()) {
        (cell as Node).setPortProp(portId, 'attrs/circle/style/visibility', 'visible');
        (cell as Node).setPortProp(portId, 'attrs/circle/fill', '#5F95FF');
        (cell as Node).setPortProp(portId, 'attrs/circle/stroke', '#5F95FF');
      }
    });
  });
  graph.on('edge:removed', ({ edge }: { edge: Edge }) => {
    [edge.getSourceCellId(), edge.getTargetCellId()].forEach((cid, i) => {
      const portId = i === 0 ? edge.getSourcePortId() : edge.getTargetPortId();
      if (!cid || !portId) return;
      const cell = graph!.getCellById(cid);
      if (cell?.isNode() && graph) {
        const node = cell as Node;
        const stillConnected = graph.getConnectedEdges(node).some(e =>
          (e.getSourcePortId() === portId || e.getTargetPortId() === portId) && e.id !== edge.id
        );
        if (!stillConnected) {
          node.setPortProp(portId, 'attrs/circle/fill', '#C2C8D5');
          node.setPortProp(portId, 'attrs/circle/stroke', '#C2C8D5');
        }
      }
    });
  });

  // === 连线悬停显示「+」插入按钮 ===
  graph.on('edge:mouseenter', ({ edge }: { edge: Edge }) => {
    edge.addTools([{
      name: 'button',
      args: {
        markup: [{ tagName: 'circle', selector: 'btn', attrs: { r: 10, fill: '#1677ff', cursor: 'pointer' } },
                 { tagName: 'text', selector: 'icon', attrs: { text: '+', fill: '#fff', fontSize: 14, fontWeight: 'bold', textAnchor: 'middle', dominantBaseline: 'central', pointerEvents: 'none' } }],
        distance: 0.5,
        onClick: ({ edge: e }: { edge: Edge }) => {
          const src = e.getSourceNode();
          const tgt = e.getTargetNode();
          if (!src || !tgt) return;
          const srcBox = src.getBoundingBox();
          const tgtBox = tgt.getBoundingBox();
          const mx = (srcBox.x + srcBox.width / 2 + tgtBox.x + tgtBox.width / 2) / 2;
          const my = (srcBox.y + srcBox.height / 2 + tgtBox.y + tgtBox.height / 2) / 2;
          pickerSource.value = { sourceNode: src, sourceEdge: e, x: mx, y: my };
          const pos = getAnchorRectFromGraph(mx, my);
          if (pos) { pickerAnchor.value = pos; pickerVisible.value = true; }
          e.removeTools();
        },
      },
    }]);
  });
  graph.on('edge:mouseleave', ({ edge }: { edge: Edge }) => {
    edge.removeTools();
  });

  addLog('success', '画布初始化完成');

  // 加载已有设计
  if (props.definitionId) {
    await loadDefinition(props.definitionId);
  }
});

onUnmounted(() => { graph?.dispose(); });

/** 加载已有流程设计 */
async function loadDefinition(id: string) {
  try {
    const res = await request({ url: `/automation/definition/${id}`, method: 'get' });
    if (res.data?.designJson) {
      importDesignJson(graph!, JSON.parse(res.data.designJson));
      showEmptyHint.value = false;
      addLog('success', '已加载流程定义');
    }
  } catch (e) { addLog('error', '加载流程定义失败'); }
}

/** 添加节点到画布 */
function handleAddNode(type: string, x: number, y: number) {
  if (!graph) return;
  try {
    addNodeToGraph(graph, type, x, y);
    addLog('success', `添加节点: ${getNodeConfig(type)?.label || type}`);
  } catch (e: any) { addLog('error', `添加节点失败: ${e.message}`); }
}

/** 从事件总线来的拖拽/点击添加节点 */
function handleDrop(e: DragEvent) {
  if (!graph) return;
  const type = e.dataTransfer?.getData('application/x6-node-type');
  if (!type) return;
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  handleAddNode(type, e.clientX - rect.left, e.clientY - rect.top);
}

/** NodePicker 选择节点后回调 */
function handlePickerSelect(type: string) {
  if (!graph) return;
  const src = pickerSource.value;
  const x = src.x ?? 300;
  const y = src.y ?? 100;

  if (src.sourceEdge) {
    // 在连线中间插入节点：删除原连线，创建新节点，创建两条连线
    const edge = src.sourceEdge;
    const sourceNode = edge.getSourceNode();
    const targetNode = edge.getTargetNode();
    const sourcePort = edge.getSourcePortId();
    const targetPort = edge.getTargetPortId();
    edge.remove();

    const newNode = addNodeToGraph(graph, type, x, y);
    if (sourceNode) {
      graph.addEdge({ source: { cell: sourceNode.id, port: sourcePort || 'bottom' }, target: { cell: newNode.id, port: 'top' }, shape: 'automation-edge' });
    }
    if (targetNode) {
      graph.addEdge({ source: { cell: newNode.id, port: 'bottom' }, target: { cell: targetNode.id, port: targetPort || 'top' }, shape: 'automation-edge' });
    }
    addLog('success', '在连线中插入节点');
  } else if (src.sourceNode) {
    // 从节点「+」创建分支节点
    const sourceNode = src.sourceNode;
    const newNode = addNodeToGraph(graph, type, x, y);
    graph.addEdge({ source: { cell: sourceNode.id, port: 'bottom' }, target: { cell: newNode.id, port: 'top' }, shape: 'automation-edge' });
    addLog('success', `从节点创建分支: ${getNodeConfig(type)?.label || type}`);
  } else {
    // 空白位置创建节点（兜底）
    handleAddNode(type, x, y);
  }
}

/** 右键画布空白区域菜单 */
function handleCanvasContextMenu(e: MouseEvent) {
  contextMenuPos.value = { x: e.clientX, y: e.clientY };
  contextMenuStyle.value = { left: e.clientX + 'px', top: e.clientY + 'px' };
  contextMenuVisible.value = true;
}

function handleContextMenu(e: MouseEvent) {
  // 全局右键阻止默认菜单
  e.preventDefault();
}

function handleContextAddNode() {
  contextMenuVisible.value = false;
  if (!graph || !canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const x = contextMenuPos.value.x - rect.left;
  const y = contextMenuPos.value.y - rect.top;
  pickerSource.value = {};
  pickerAnchor.value = { x: contextMenuPos.value.x, y: contextMenuPos.value.y };
  pickerVisible.value = true;
}

/** 保存 */
function handleSave() {
  if (!graph) return;
  const designData = exportDesignJson(graph);
  emit('saved', designData);
  addLog('success', '设计已保存');
}

function handleValidate() {
  if (!graph) return;
  const errors: string[] = [];
  const cells = graph.getCells();
  const triggerNodes = cells.filter(c => c.getData()?.nodeType?.includes('TRIGGER'));
  if (triggerNodes.length === 0) errors.push('流程必须包含至少一个触发节点');
  const endNodes = cells.filter(c => c.getData()?.nodeType === 'END');
  if (endNodes.length === 0) errors.push('流程必须包含结束节点');
  if (errors.length === 0) { addLog('success', '校验通过'); ElMessage.success('校验通过'); }
  else { errors.forEach(e => addLog('error', e)); ElMessage.warning('校验失败，请查看日志'); }
}

async function handlePublish() {
  if (!props.definitionId) { ElMessage.warning('请先保存流程定义'); return; }
  try {
    await request({ url: `/automation/definition/${props.definitionId}/publish`, method: 'post' });
    addLog('success', '流程已发布'); ElMessage.success('发布成功'); emit('published');
  } catch (e) { addLog('error', '发布失败'); }
}

function handleUndo() { graph?.undo(); }
function handleRedo() { graph?.redo(); }
function handleZoomOut() { graph?.zoom(-0.1); }
function handleZoomIn() { graph?.zoom(0.1); }
function handleZoomToFit() { graph?.zoomToFit({ maxScale: 1 }); }

function handleExport() {
  if (!graph) return;
  const data = exportDesignJson(graph);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `flow-design-${Date.now()}.json`; a.click();
  URL.revokeObjectURL(url); addLog('success', '设计已导出');
}

function handleImport(file: File): boolean {
  if (!graph) return false;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      importDesignJson(graph, JSON.parse(e.target?.result as string));
      addLog('success', '设计已导入');
    } catch { addLog('error', '导入文件格式错误'); }
  };
  reader.readAsText(file);
  return false;
}

function handleUpdateConfig(config: Record<string, any>) {
  if (!selectedNode.value || !graph) return;
  const data = selectedNode.value.getData() || {};
  data.config = { ...data.config, ...config };
  selectedNode.value.setData(data);
  addLog('info', `更新节点配置: ${selectedNode.value.attr('label/text')}`);
}
</script>

<style scoped>
.designer-root {
  height: 100%;
  background: #f0f2f5;
}
.designer-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  grid-template-rows: 1fr 140px;
  gap: 1px;
  height: 100%;
  background: #e8e8e8;
}
.panel-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
  flex-shrink: 0;
}
.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
}
.canvas-panel {
  grid-row: 1 / 2;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
  position: relative;
}
.property-panel {
  grid-row: 1 / 2;
  background: #fff;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.bottom-panel {
  grid-column: 1 / 3;
  grid-row: 2 / 3;
  background: #fff;
  overflow-y: auto;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
  flex-shrink: 0;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 4px;
}
.toolbar-right {
  display: flex;
  align-items: center;
}
.toolbar-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #86909c;
}
.canvas-container {
  flex: 1;
  overflow: hidden;
}
.designer-minimap {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 180px;
  height: 120px;
  border: 1px solid #e5e6e8;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  z-index: 10;
  overflow: hidden;
}
.canvas-empty-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
  z-index: 5;
}
.empty-icon { opacity: 0.5; }
.empty-title { font-size: 14px; font-weight: 500; color: #86909c; margin: 0; }
.empty-desc { font-size: 12px; color: #c9cdd4; margin: 0; }
.context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 160px;
  background: #fff;
  border: 1px solid #e5e6e8;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.10);
  padding: 4px;
}
.context-item {
  padding: 8px 14px;
  font-size: 12px;
  color: #1d2129;
  cursor: pointer;
  border-radius: 4px;
}
.context-item:hover { background: #f0f5ff; color: #1677ff; }
.context-divider { height: 1px; background: #f0f0f0; margin: 4px 0; }
</style>
