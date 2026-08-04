<template>
  <div class="designer-root" :class="{ 'is-readonly': readonly }" @contextmenu.prevent>
    <div class="designer-layout">
      <!-- 左侧物料栏 -->
      <aside v-if="!readonly" class="stencil-panel">
        <div class="stencil-header">
          <span class="stencil-title">节点物料</span>
        </div>
        <NodeToolbox @add-node="handleToolboxAdd" />
      </aside>

      <!-- 画布区域 -->
      <main class="canvas-panel">
        <div class="toolbar">
          <div v-if="!readonly" class="toolbar-group">
            <el-button size="small" type="primary" @click="handleSave">
              <el-icon><Check /></el-icon>保存
            </el-button>
            <el-button size="small" @click="handleValidate">
              <el-icon><Select /></el-icon>校验
            </el-button>
            <el-button size="small" type="success" @click="handlePublish">
              <el-icon><Upload /></el-icon>发布
            </el-button>
          </div>
          <div v-else class="toolbar-group">
            <el-tag type="warning" effect="plain" size="small">历史版本预览（只读）</el-tag>
          </div>
          <template v-if="!readonly">
            <div class="toolbar-divider" />
            <div class="toolbar-group">
              <el-tooltip content="撤销 (Ctrl+Z)" placement="bottom">
                <button class="tool-icon-btn" :disabled="!canUndo" @click="handleUndo">
                  <el-icon><RefreshLeft /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip content="重做 (Ctrl+Shift+Z)" placement="bottom">
                <button class="tool-icon-btn" :disabled="!canRedo" @click="handleRedo">
                  <el-icon><RefreshRight /></el-icon>
                </button>
              </el-tooltip>
            </div>
          </template>
          <div class="toolbar-divider" />
          <div class="toolbar-group">
            <el-tooltip content="缩小" placement="bottom">
              <button class="tool-icon-btn" @click="handleZoomOut">
                <el-icon><ZoomOut /></el-icon>
              </button>
            </el-tooltip>
            <span class="zoom-label">{{ zoomPercent }}%</span>
            <el-tooltip content="放大" placement="bottom">
              <button class="tool-icon-btn" @click="handleZoomIn">
                <el-icon><ZoomIn /></el-icon>
              </button>
            </el-tooltip>
            <el-tooltip content="适应画布" placement="bottom">
              <button class="tool-icon-btn" @click="handleZoomToFit">
                <el-icon><FullScreen /></el-icon>
              </button>
            </el-tooltip>
          </div>
          <div class="toolbar-spacer" />
          <div class="toolbar-group">
            <el-tooltip content="导出 JSON" placement="bottom">
              <button class="tool-icon-btn" @click="handleExport">
                <el-icon><Download /></el-icon>
              </button>
            </el-tooltip>
            <el-upload v-if="!readonly" accept=".json" :show-file-list="false" :before-upload="handleImport">
              <el-tooltip content="导入 JSON" placement="bottom">
                <button class="tool-icon-btn">
                  <el-icon><Upload /></el-icon>
                </button>
              </el-tooltip>
            </el-upload>
            <el-tooltip :content="showLogs ? '收起日志' : '展开日志'" placement="bottom">
              <button class="tool-icon-btn" :class="{ active: showLogs }" @click="showLogs = !showLogs">
                <el-icon><Document /></el-icon>
              </button>
            </el-tooltip>
          </div>
        </div>

        <div
          ref="canvasAreaRef"
          class="canvas-area"
          @drop.prevent="onDrop"
          @dragover.prevent
          @contextmenu.prevent="onCanvasContextMenu"
        >
          <div ref="canvasRef" class="canvas-container" />
          <div v-if="showEmptyHint" class="canvas-empty-hint">
            <div class="empty-icon">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="1.2">
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <p class="empty-title">{{ readonly ? '该版本暂无流程设计数据' : '从左侧拖拽节点开始搭建流程' }}</p>
            <p v-if="!readonly" class="empty-desc">空格+拖拽平移画布 · Ctrl+滚轮缩放 · Shift+拖拽框选</p>
          </div>
        </div>

        <div ref="minimapRef" class="designer-minimap" />

        <!-- 底部日志 -->
        <transition name="slide-up">
          <div v-show="showLogs" class="bottom-panel">
            <BottomPanel :logs="logs" />
          </div>
        </transition>
      </main>

      <!-- 右侧属性面板 -->
      <aside v-if="!readonly" class="property-panel" :class="{ collapsed: !selectedNode && !propertyPinned }">
        <div class="panel-header">
          <span class="panel-title">{{ selectedNode ? '节点配置' : '属性面板' }}</span>
          <button
            v-if="selectedNode"
            class="panel-close"
            title="取消选中"
            @click="clearSelection"
          >
            <el-icon :size="14"><Close /></el-icon>
          </button>
        </div>
        <div class="panel-body">
          <PropertyPanel :node="selectedNode" @update-config="handleUpdateConfig" />
        </div>
      </aside>
    </div>

    <!-- 浮动节点选择面板 -->
    <NodePicker
      v-if="!readonly"
      :visible="pickerVisible"
      :anchor-rect="pickerAnchor"
      @select="handlePickerSelect"
      @close="pickerVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { Graph, Node, Edge, MiniMap } from '@antv/x6';
import {
  Check, Select, Upload, RefreshLeft, RefreshRight,
  ZoomOut, ZoomIn, FullScreen, Download, Document, Close,
} from '@element-plus/icons-vue';
import { useGraph, resizeGraph, addNodeToGraph, exportDesignJson, importDesignJson } from './graph/useGraph';
import { getNodeConfig } from './types';
import PropertyPanel from './panels/propertyPanel.vue';
import BottomPanel from './panels/bottomPanel.vue';
import NodePicker from './panels/NodePicker.vue';
import NodeToolbox from './panels/nodeToolbox.vue';
import { ElMessage } from 'element-plus';
import { on as eventOn } from './events';
import { getDefinitionDesign, saveDefinitionDesign, publishDefinition } from '@/api/automation/definition';
import { getDesignJson } from '@/api/automation/version';

const props = defineProps<{
  definitionId?: string | number;
  versionId?: string | number;
  automationName?: string;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  saved: [data: any];
  published: [];
}>();

const readonly = computed(() => !!props.readonly);

const canvasAreaRef = ref<HTMLDivElement>();
const canvasRef = ref<HTMLDivElement>();
const minimapRef = ref<HTMLDivElement>();
const logs = ref<Array<{ level: string; message: string; time: string }>>([]);
const selectedNode = ref<any>(null);
const canUndo = ref(false);
const canRedo = ref(false);
const showEmptyHint = ref(true);
const showLogs = ref(false);
const propertyPinned = ref(false);
const zoomPercent = ref(100);

const pickerVisible = ref(false);
const pickerAnchor = ref<{ x: number; y: number; width?: number; height?: number }>({ x: 0, y: 0 });
interface PickerSource {
  sourceNode?: any;
  sourceEdge?: any;
  x?: number;
  y?: number;
}
const pickerSource = ref<PickerSource>({});

let graph: Graph | null = null;
let resizeObserver: ResizeObserver | null = null;
let designLoadedForId: string | undefined;

function resolveDefinitionId() {
  if (props.definitionId === undefined || props.definitionId === null || props.definitionId === '') {
    return undefined;
  }
  return String(props.definitionId);
}

function addLog(level: string, message: string) {
  const time = new Date().toLocaleTimeString();
  logs.value.push({ level, message, time });
  if (logs.value.length > 200) logs.value.shift();
}

function getAnchorRectFromGraph(x: number, y: number) {
  if (!graph || !canvasAreaRef.value) return;
  const rect = canvasAreaRef.value.getBoundingClientRect();
  return { x: rect.left + x, y: rect.top + y };
}

function clearSelection() {
  graph?.cleanSelection();
  selectedNode.value = null;
}

function updateZoomLabel() {
  if (!graph) return;
  zoomPercent.value = Math.round(graph.zoom() * 100);
}

function syncCanvasSize() {
  if (!graph || !canvasAreaRef.value) return;
  const { clientWidth, clientHeight } = canvasAreaRef.value;
  resizeGraph(graph, clientWidth, clientHeight);
}

onMounted(async () => {
  await nextTick();
  if (!canvasRef.value || !canvasAreaRef.value) return;

  // 先按外层容器尺寸初始化，避免 0x0
  const { clientWidth, clientHeight } = canvasAreaRef.value;
  if (clientWidth > 0) canvasRef.value.style.width = `${clientWidth}px`;
  if (clientHeight > 0) canvasRef.value.style.height = `${clientHeight}px`;

  graph = useGraph(canvasRef.value, { readonly: readonly.value });
  syncCanvasSize();

  if (minimapRef.value) {
    graph.use(new MiniMap({
      container: minimapRef.value,
      width: 160,
      height: 100,
      padding: 8,
    }));
  }

  // 观察外层稳定容器（属性面板展开/收起、日志开关都会触发）
  resizeObserver = new ResizeObserver(() => {
    syncCanvasSize();
  });
  resizeObserver.observe(canvasAreaRef.value);

  graph.on('node:selected', ({ node }) => { selectedNode.value = node; });
  graph.on('node:unselected', () => { selectedNode.value = null; });
  graph.on('blank:click', () => { selectedNode.value = null; });

  if (!readonly.value) {
    graph.on('history:change', () => {
      if (graph) {
        canUndo.value = graph.canUndo();
        canRedo.value = graph.canRedo();
      }
    });
  }

  graph.on('scale', () => updateZoomLabel());

  graph.on('cell:added', ({ cell }) => {
    showEmptyHint.value = false;
    if (cell.isNode()) addLog('info', `添加节点: ${(cell.getData() as any)?.label || cell.id}`);
    else if (cell.isEdge()) addLog('info', '添加连线');
  });
  graph.on('cell:removed', () => {
    if (graph && graph.getCells().length === 0) showEmptyHint.value = true;
  });

  if (!readonly.value) {
    graph.bindKey(['del', 'backspace'], () => {
      const cells = graph?.getSelectedCells();
      if (cells && cells.length > 0) {
        cells.forEach(cell => cell.remove());
        addLog('info', `删除 ${cells.length} 个元素`);
      }
    });

    eventOn('node:plus-click', (data: PickerSource) => {
      pickerSource.value = data;
      const pos = getAnchorRectFromGraph(data.x!, data.y!);
      if (pos) {
        pickerAnchor.value = pos;
        pickerVisible.value = true;
      }
    });

    eventOn('node:delete', (data: { node: Node }) => {
      data.node?.remove();
      addLog('info', '删除节点');
    });

    eventOn('node:copy', (data: { node: Node }) => {
      if (!graph || !data.node) return;
      const pos = data.node.getPosition();
      const nodeData = data.node.getData() || {};
      const type = nodeData.nodeType;
      if (!type) return;
      addNodeToGraph(graph, type, pos.x + 40, pos.y + 40);
      addLog('info', '复制节点');
    });
  }

  // 端口悬停显隐（参考 agentFlow）
  graph.on('node:mouseenter', ({ node }: { node: Node }) => {
    node.getPorts().forEach(p => {
      if (p.id) node.setPortProp(p.id, 'attrs/circle/style/visibility', 'visible');
    });
  });
  graph.on('node:mouseleave', ({ node }: { node: Node }) => {
    const edges = graph!.getConnectedEdges(node);
    node.getPorts().forEach(p => {
      if (!p.id) return;
      const connected = edges.some(e => e.getSourcePortId() === p.id || e.getTargetPortId() === p.id);
      node.setPortProp(p.id, 'attrs/circle/style/visibility', connected ? 'visible' : 'hidden');
      const color = connected ? '#5F95FF' : '#C2C8D5';
      node.setPortProp(p.id, 'attrs/circle/fill', color);
      node.setPortProp(p.id, 'attrs/circle/stroke', color);
    });
  });

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
          node.setPortProp(portId, 'attrs/circle/style/visibility', 'hidden');
        }
      }
    });
  });

  // 连线悬停：删除按钮 + 插入节点（只读模式禁用）
  if (!readonly.value) {
    graph.on('edge:mouseenter', ({ edge }: { edge: Edge }) => {
      edge.addTools([
        { name: 'button-remove', args: { distance: -40 } },
        {
          name: 'button',
          args: {
            markup: [
              { tagName: 'circle', selector: 'btn', attrs: { r: 10, fill: '#5F95FF', cursor: 'pointer' } },
              { tagName: 'text', selector: 'icon', attrs: { text: '+', fill: '#fff', fontSize: 14, fontWeight: 'bold', textAnchor: 'middle', dominantBaseline: 'central', pointerEvents: 'none' } }
            ],
            distance: 0.5,
            onClick: ({ edge: e }: { edge: Edge }) => {
              const src = e.getSourceNode();
              const tgt = e.getTargetNode();
              if (!src || !tgt) return;
              const srcBox = src.getBBox();
              const tgtBox = tgt.getBBox();
              const mx = (srcBox.x + srcBox.width / 2 + tgtBox.x + tgtBox.width / 2) / 2;
              const my = (srcBox.y + srcBox.height / 2 + tgtBox.y + tgtBox.height / 2) / 2;
              pickerSource.value = { sourceNode: src, sourceEdge: e, x: mx, y: my };
              const pos = getAnchorRectFromGraph(mx, my);
              if (pos) { pickerAnchor.value = pos; pickerVisible.value = true; }
              e.removeTools();
            },
          },
        }
      ]);
    });
    graph.on('edge:mouseleave', ({ edge }: { edge: Edge }) => {
      edge.removeTools();
    });
  }

  addLog('success', '画布初始化完成');

  const versionId = resolveVersionId();
  if (versionId) {
    await loadVersionDesign(versionId);
  } else {
    const id = resolveDefinitionId();
    if (id) {
      await loadDefinition(id);
    }
  }
});

watch(
  () => [props.definitionId, props.versionId],
  async () => {
    if (!graph) return;
    const versionId = resolveVersionId();
    if (versionId) {
      if (designLoadedForId === `v:${versionId}`) return;
      await loadVersionDesign(versionId);
      return;
    }
    const id = resolveDefinitionId();
    if (!id || designLoadedForId === id) return;
    await loadDefinition(id);
  }
);

onUnmounted(() => {
  resizeObserver?.disconnect();
  graph?.dispose();
  graph = null;
  designLoadedForId = undefined;
});

function resolveVersionId() {
  if (props.versionId === undefined || props.versionId === null || props.versionId === '') {
    return undefined;
  }
  return String(props.versionId);
}

function applyDesignJson(designJson?: string | null) {
  if (!designJson) {
    addLog('info', '暂无已保存的流程设计');
    return;
  }
  const data = typeof designJson === 'string' ? JSON.parse(designJson) : designJson;
  if (graph) {
    importDesignJson(graph, data);
    showEmptyHint.value = false;
    nextTick(() => {
      graph?.zoomToFit({ maxScale: 1, padding: 40 });
      updateZoomLabel();
    });
  }
  addLog('success', '已加载流程设计');
}

async function loadDefinition(id: string) {
  try {
    const res = await getDefinitionDesign(id);
    designLoadedForId = id;
    applyDesignJson(res.data?.designJson);
  } catch {
    addLog('error', '加载流程设计失败');
  }
}

async function loadVersionDesign(id: string) {
  try {
    const res = await getDesignJson(id);
    designLoadedForId = `v:${id}`;
    applyDesignJson(res.data?.designJson);
  } catch {
    addLog('error', '加载历史版本设计失败');
  }
}

function onDrop(e: DragEvent) {
  if (readonly.value) return;
  handleDrop(e);
}

function onCanvasContextMenu(e: MouseEvent) {
  if (readonly.value) return;
  handleCanvasContextMenu(e);
}

function handleAddNode(type: string, x: number, y: number) {
  if (!graph) return;
  try {
    addNodeToGraph(graph, type, x, y);
    addLog('success', `添加节点: ${getNodeConfig(type)?.label || type}`);
  } catch (e: any) {
    addLog('error', `添加节点失败: ${e.message}`);
  }
}

function handleToolboxAdd(type: string, x: number, y: number) {
  handleAddNode(type, x, y);
}

function handleDrop(e: DragEvent) {
  if (!graph) return;
  const type = e.dataTransfer?.getData('application/x6-node-type');
  if (!type) return;
  // 落点对齐卡片中心
  const local = graph.clientToLocal(e.clientX, e.clientY);
  handleAddNode(type, local.x - 130, local.y - 48);
}

function handlePickerSelect(type: string) {
  if (!graph) return;
  const src = pickerSource.value;
  const x = src.x ?? 300;
  const y = src.y ?? 100;

  if (src.sourceEdge) {
    const edge = src.sourceEdge;
    const sourceNode = edge.getSourceNode();
    const targetNode = edge.getTargetNode();
    const sourcePort = edge.getSourcePortId();
    const targetPort = edge.getTargetPortId();
    edge.remove();

    const newNode = addNodeToGraph(graph, type, x - 130, y - 48);
    if (sourceNode) {
      graph.addEdge({ source: { cell: sourceNode.id, port: sourcePort || 'bottom' }, target: { cell: newNode.id, port: 'top' }, shape: 'automation-edge' });
    }
    if (targetNode) {
      graph.addEdge({ source: { cell: newNode.id, port: 'bottom' }, target: { cell: targetNode.id, port: targetPort || 'top' }, shape: 'automation-edge' });
    }
    addLog('success', '在连线中插入节点');
  } else if (src.sourceNode) {
    const sourceNode = src.sourceNode;
    const newNode = addNodeToGraph(graph, type, x - 130, y);
    graph.addEdge({ source: { cell: sourceNode.id, port: 'bottom' }, target: { cell: newNode.id, port: 'top' }, shape: 'automation-edge' });
    addLog('success', `从节点创建分支: ${getNodeConfig(type)?.label || type}`);
  } else {
    handleAddNode(type, x, y);
  }
}

function handleCanvasContextMenu(e: MouseEvent) {
  if (!graph || !canvasRef.value) return;
  const local = graph.clientToLocal(e.clientX, e.clientY);
  pickerSource.value = { x: local.x, y: local.y };
  pickerAnchor.value = { x: e.clientX, y: e.clientY };
  pickerVisible.value = true;
}

async function handleSave() {
  if (!graph) return;
  const id = resolveDefinitionId();
  if (!id) {
    ElMessage.warning('请先保存流程基本配置');
    return;
  }
  const designData = exportDesignJson(graph);
  try {
    await saveDefinitionDesign(id, JSON.stringify(designData));
    designLoadedForId = id;
    emit('saved', designData);
    addLog('success', '设计已保存');
    ElMessage.success('设计已保存');
  } catch {
    addLog('error', '设计保存失败');
  }
}

function handleValidate() {
  if (!graph) return;
  const errors: string[] = [];
  const cells = graph.getCells();
  const triggerNodes = cells.filter(c => c.getData()?.nodeType?.includes('TRIGGER'));
  if (triggerNodes.length === 0) errors.push('流程必须包含至少一个触发节点');
  const endNodes = cells.filter(c => c.getData()?.nodeType === 'END');
  if (endNodes.length === 0) errors.push('流程必须包含结束节点');
  if (errors.length === 0) {
    addLog('success', '校验通过');
    ElMessage.success('校验通过');
  } else {
    showLogs.value = true;
    errors.forEach(e => addLog('error', e));
    ElMessage.warning('校验失败，请查看日志');
  }
}

async function handlePublish() {
  const id = resolveDefinitionId();
  if (!id) {
    ElMessage.warning('请先保存流程定义');
    return;
  }
  if (!graph) return;
  try {
    // 发布前先持久化当前设计
    const designData = exportDesignJson(graph);
    await saveDefinitionDesign(id, JSON.stringify(designData));
    await publishDefinition(id);
    designLoadedForId = id;
    addLog('success', '流程已发布');
    ElMessage.success('发布成功');
    emit('published');
  } catch {
    addLog('error', '发布失败');
  }
}

function handleUndo() { graph?.undo(); }
function handleRedo() { graph?.redo(); }
function handleZoomOut() { graph?.zoom(-0.1); updateZoomLabel(); }
function handleZoomIn() { graph?.zoom(0.1); updateZoomLabel(); }
function handleZoomToFit() { graph?.zoomToFit({ maxScale: 1, padding: 40 }); updateZoomLabel(); }

function handleExport() {
  if (!graph) return;
  const data = exportDesignJson(graph);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flow-design-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  addLog('success', '设计已导出');
}

function handleImport(file: File): boolean {
  if (!graph) return false;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      importDesignJson(graph!, JSON.parse(e.target?.result as string));
      showEmptyHint.value = false;
      addLog('success', '设计已导入');
    } catch {
      addLog('error', '导入文件格式错误');
    }
  };
  reader.readAsText(file);
  return false;
}

function handleUpdateConfig(config: Record<string, any>) {
  if (!selectedNode.value || !graph) return;
  const data = selectedNode.value.getData() || {};
  data.config = { ...data.config, ...config };
  if (config.name) data.label = config.name;
  selectedNode.value.setData(data);
  addLog('info', `更新节点配置: ${data.label || selectedNode.value.id}`);
}
</script>

<style scoped>
.designer-root {
  height: 100%;
  background: #fff;
}
.designer-root.is-readonly .canvas-panel {
  border-left: none;
}
.designer-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* ---- Stencil ---- */
.stencil-panel {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #dfe3e8;
  background: #fff;
  z-index: 5;
}
.stencil-header {
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.stencil-title {
  font-size: 14px;
  font-weight: 600;
  color: #141414;
}

/* ---- Canvas ---- */
.canvas-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  min-width: 0;
  background: #fff;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 44px;
  padding: 0 12px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  flex-shrink: 0;
}
.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}
.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e8eaed;
  margin: 0 6px;
}
.toolbar-spacer {
  flex: 1;
}
.tool-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #4e5969;
  cursor: pointer;
  transition: all 0.15s;
}
.tool-icon-btn:hover:not(:disabled) {
  background: #f0f5ff;
  color: #5f95ff;
}
.tool-icon-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.tool-icon-btn.active {
  background: #f0f5ff;
  color: #5f95ff;
}
.zoom-label {
  font-size: 12px;
  color: #8c8c8c;
  min-width: 40px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.canvas-area {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
  min-width: 0;
}
.canvas-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.designer-minimap {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 160px;
  height: 100px;
  border: 1px solid #e5e6e8;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 10;
  overflow: hidden;
  pointer-events: auto;
}
.canvas-empty-hint {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
  z-index: 5;
}
.empty-title {
  font-size: 14px;
  font-weight: 500;
  color: #8c8c8c;
  margin: 0;
}
.empty-desc {
  font-size: 12px;
  color: #c2c8d5;
  margin: 0;
}

/* ---- Bottom logs ---- */
.bottom-panel {
  height: 140px;
  flex-shrink: 0;
  border-top: 1px solid #e8eaed;
  background: #fff;
  overflow: hidden;
  z-index: 8;
}
.slide-up-enter-active,
.slide-up-leave-active {
  transition: height 0.2s ease, opacity 0.2s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  height: 0;
  opacity: 0;
}

/* ---- Property ---- */
.property-panel {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #dfe3e8;
  background: #fff;
  transition: width 0.2s ease, opacity 0.2s ease;
  overflow: hidden;
  z-index: 5;
}
.property-panel.collapsed {
  width: 0;
  border-left: none;
  opacity: 0;
  pointer-events: none;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #141414;
}
.panel-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #8c8c8c;
  cursor: pointer;
}
.panel-close:hover {
  background: #f5f5f5;
  color: #141414;
}
.panel-body {
  flex: 1;
  overflow-y: auto;
}
</style>
