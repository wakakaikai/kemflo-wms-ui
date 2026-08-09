<template>
  <div class="designer-root" :class="{ 'is-readonly': readonly }" @contextmenu.prevent>
    <div class="designer-layout">
      <!-- 左侧物料栏（默认收起） -->
      <aside v-if="!readonly && showStencilPanel" class="stencil-panel">
        <div class="stencil-header">
          <span class="stencil-title">节点物料</span>
          <button class="stencil-close" title="收起" @click="showStencilPanel = false">
            <el-icon :size="14"><Close /></el-icon>
          </button>
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
            <el-button size="small" type="warning" :loading="running" @click="handleRun">
              <el-icon><VideoPlay /></el-icon>执行
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
            <el-tooltip content="节点物料" placement="bottom">
              <button class="tool-icon-btn" :class="{ active: showStencilPanel }" @click="showStencilPanel = !showStencilPanel">
                <el-icon><Grid /></el-icon>
              </button>
            </el-tooltip>
          </div>
          <div class="toolbar-divider" />
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
            <p class="empty-title">{{ readonly ? '该版本暂无流程设计数据' : '点击节点底部 + 添加下一步' }}</p>
            <p v-if="!readonly" class="empty-desc">竖向编排 · 节点 ··· 打开设置 · 工具栏可展开节点物料</p>
          </div>

          <!-- 浮动缩放工具栏（明道云风格） -->
          <div class="floating-zoom-bar">
            <el-tooltip content="适应画布" placement="right">
              <button class="float-btn" @click="handleZoomToFit">
                <el-icon><FullScreen /></el-icon>
              </button>
            </el-tooltip>
            <div class="float-divider" />
            <el-tooltip content="缩小" placement="right">
              <button class="float-btn" @click="handleZoomOut">
                <el-icon><ZoomOut /></el-icon>
              </button>
            </el-tooltip>
            <span class="float-zoom-label">{{ zoomPercent }}%</span>
            <el-tooltip content="放大" placement="right">
              <button class="float-btn" @click="handleZoomIn">
                <el-icon><ZoomIn /></el-icon>
              </button>
            </el-tooltip>
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
    </div>

    <!-- 节点选择弹窗 -->
    <NodePicker
      v-if="!readonly"
      :visible="pickerVisible"
      @select="handlePickerSelect"
      @close="pickerVisible = false"
    />

    <!-- 节点设置抽屉 -->
    <NodeSettingsDrawer
      v-if="!readonly"
      :visible="settingsDrawerVisible"
      :node="settingsNode"
      @close="closeSettingsDrawer"
      @save="closeSettingsDrawer"
      @update-config="handleUpdateConfig"
    />

    <el-dialog v-model="runDialogVisible" title="执行流程" width="520px" destroy-on-close append-to-body>
      <el-form label-width="90px">
        <el-form-item label="输入变量">
          <el-input
            v-model="runVariablesText"
            type="textarea"
            :rows="8"
            placeholder='JSON 对象，例如: {"orderId":"SO-1","amount":15000}'
          />
        </el-form-item>
        <el-form-item v-if="runningInstanceId" label="实例ID">
          <span>{{ runningInstanceId }}</span>
          <el-tag class="ml-2" size="small">{{ runningInstanceStatus }}</el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="runDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="running" @click="confirmRun">开始执行</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { Graph, Node, Edge, MiniMap } from '@antv/x6';
import {
  Check, Select, Upload, RefreshLeft, RefreshRight,
  ZoomOut, ZoomIn, FullScreen, Download, Document, Close, VideoPlay, Grid,
} from '@element-plus/icons-vue';
import { useGraph, resizeGraph, addNodeToGraph, exportDesignJson, importDesignJson, applyNodeRuntimeStatus, clearNodeRuntimeStatus, applyVerticalEdgeStyle, alignNodeBelow, CARD_WIDTH, CARD_HEIGHT } from './graph/useGraph';
import { getNodeConfig } from './types';
import BottomPanel from './panels/bottomPanel.vue';
import NodePicker from './panels/NodePicker.vue';
import NodeSettingsDrawer from './panels/NodeSettingsDrawer.vue';
import NodeToolbox from './panels/nodeToolbox.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { on as eventOn } from './events';
import { getDefinitionDesign, saveDefinitionDesign, publishDefinition, validateDefinitionDesign } from '@/api/automation/definition';
import { getDesignJson } from '@/api/automation/version';
import { startInstance, getInstanceNodes } from '@/api/automation/instance';

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
const showStencilPanel = ref(false);
const zoomPercent = ref(100);

const pickerVisible = ref(false);
interface PickerSource {
  sourceNode?: any;
  sourceEdge?: any;
  x?: number;
  y?: number;
}
const pickerSource = ref<PickerSource>({});

const settingsDrawerVisible = ref(false);
const settingsNode = ref<any>(null);

const running = ref(false);
const runDialogVisible = ref(false);
const runVariablesText = ref('{\n  "orderId": "SO-10086",\n  "amount": 15000\n}');
const runningInstanceId = ref<string | number | ''>('');
const runningInstanceStatus = ref('');
let pollTimer: ReturnType<typeof setInterval> | null = null;

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

function openSettingsDrawer(node: Node) {
  settingsNode.value = node;
  settingsDrawerVisible.value = true;
  selectedNode.value = node;
}

function closeSettingsDrawer() {
  settingsDrawerVisible.value = false;
  settingsNode.value = null;
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
  graph.on('blank:click', () => {
    selectedNode.value = null;
    closeSettingsDrawer();
  });

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
      pickerVisible.value = true;
    });

    eventOn('node:settings', (data: { node: Node }) => {
      if (!graph || !data.node) return;
      graph.select(data.node);
      openSettingsDrawer(data.node);
    });

    eventOn('node:rename', async (data: { node: Node }) => {
      if (!graph || !data.node) return;
      const nd = data.node.getData() || {};
      const current = nd.label || '';
      try {
        const { value } = await ElMessageBox.prompt('请输入节点名称', '修改名称', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputValue: current,
          inputValidator: (v) => (!!v?.trim() ? true : '名称不能为空'),
        });
        if (!value?.trim()) return;
        data.node.setData({ ...nd, label: value.trim() });
        addLog('info', `已重命名: ${value.trim()}`);
      } catch {
        /* cancelled */
      }
    });

    eventOn('node:edit-meta', (data: { node: Node; focus?: string }) => {
      if (!graph || !data.node) return;
      graph.select(data.node);
      openSettingsDrawer(data.node);
      addLog('info', `编辑节点: ${(data.node.getData() as any)?.label || data.node.id}`);
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
    applyVerticalEdgeStyle(edge);
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
  stopPoll();
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
  handleAddNode(type, local.x - CARD_WIDTH / 2, local.y - CARD_HEIGHT / 2);
}

function handlePickerSelect(type: string) {
  if (!graph) return;
  const src = pickerSource.value;
  const rawX = src.x ?? 300;
  const rawY = src.y ?? 100;

  if (src.sourceEdge) {
    const edge = src.sourceEdge;
    const sourceNode = edge.getSourceNode();
    const targetNode = edge.getTargetNode();
    const sourcePort = edge.getSourcePortId();
    const targetPort = edge.getTargetPortId();
    edge.remove();

    const newNode = addNodeToGraph(graph, type, rawX - CARD_WIDTH / 2, rawY - CARD_HEIGHT / 2);
    if (sourceNode) {
      alignNodeBelow(sourceNode, newNode, 48);
    }
    const e1 = graph.addEdge({ source: { cell: sourceNode!.id, port: sourcePort || 'bottom' }, target: { cell: newNode.id, port: 'top' }, shape: 'automation-edge' });
    applyVerticalEdgeStyle(e1);
    if (targetNode) {
      alignNodeBelow(newNode, targetNode, 48);
      const e2 = graph.addEdge({ source: { cell: newNode.id, port: 'bottom' }, target: { cell: targetNode.id, port: targetPort || 'top' }, shape: 'automation-edge' });
      applyVerticalEdgeStyle(e2);
    }
    addLog('success', '在连线中插入节点');
  } else if (src.sourceNode) {
    const sourceNode = src.sourceNode;
    const newNode = addNodeToGraph(graph, type, rawX - CARD_WIDTH / 2, rawY);
    alignNodeBelow(sourceNode, newNode, 48);

    // 分支节点：第二路分支偏右排列
    if (type === 'CONDITION' || type === 'SWITCH') {
      const outs = graph.getOutgoingEdges(sourceNode) || [];
      if (outs.length >= 1) {
        const pos = newNode.getPosition();
        newNode.setPosition({ x: pos.x + (outs.length > 1 ? 0 : 160), y: pos.y });
      }
    }

    const e = graph.addEdge({ source: { cell: sourceNode.id, port: 'bottom' }, target: { cell: newNode.id, port: 'top' }, shape: 'automation-edge' });
    applyVerticalEdgeStyle(e);
    addLog('success', `添加节点: ${getNodeConfig(type)?.label || type}`);
  } else {
    handleAddNode(type, rawX - CARD_WIDTH / 2, rawY - CARD_HEIGHT / 2);
  }
}

function handleCanvasContextMenu(e: MouseEvent) {
  if (!graph) return;
  const local = graph.clientToLocal(e.clientX, e.clientY);
  pickerSource.value = { x: local.x, y: local.y };
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

async function handleValidate() {
  if (!graph) return;
  const id = resolveDefinitionId();
  const designData = exportDesignJson(graph);
  // 前端快速检查
  const nodes = graph.getNodes();
  const triggerNodes = nodes.filter(c => c.getData()?.nodeType?.includes('TRIGGER'));
  const endNodes = nodes.filter(c => c.getData()?.nodeType === 'END');
  if (triggerNodes.length === 0) {
    ElMessage.warning('流程必须包含至少一个触发节点');
    addLog('error', '流程必须包含至少一个触发节点');
    return;
  }
  if (endNodes.length === 0) {
    ElMessage.warning('流程必须包含结束节点');
    addLog('error', '流程必须包含结束节点');
    return;
  }
  if (!id) {
    addLog('success', '前端校验通过（未绑定定义，跳过后端校验）');
    ElMessage.success('校验通过');
    return;
  }
  try {
    await validateDefinitionDesign(id, JSON.stringify(designData));
    addLog('success', '后端校验通过');
    ElMessage.success('校验通过');
  } catch (e: any) {
    showLogs.value = true;
    const msg = e?.message || e?.msg || '校验失败';
    addLog('error', msg);
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
    const designData = exportDesignJson(graph);
    await saveDefinitionDesign(id, JSON.stringify(designData));
    await publishDefinition(id);
    designLoadedForId = id;
    addLog('success', '流程已发布（已生成 LiteFlow EL）');
    ElMessage.success('发布成功');
    emit('published');
  } catch (e: any) {
    addLog('error', e?.message || e?.msg || '发布失败');
  }
}

function handleRun() {
  const id = resolveDefinitionId();
  if (!id) {
    ElMessage.warning('请先保存流程定义');
    return;
  }
  runDialogVisible.value = true;
}

async function confirmRun() {
  const id = resolveDefinitionId();
  if (!id || !graph) return;
  let variables: Record<string, any> = {};
  try {
    variables = runVariablesText.value?.trim() ? JSON.parse(runVariablesText.value) : {};
  } catch {
    ElMessage.error('输入变量必须是合法 JSON 对象');
    return;
  }
  running.value = true;
  try {
    // 执行前保存并确保已发布版本存在；若发布失败仍尝试用已有版本
    const designData = exportDesignJson(graph);
    await saveDefinitionDesign(id, JSON.stringify(designData));
    try {
      await publishDefinition(id);
    } catch {
      // 可能已有发布版本
    }
    clearNodeRuntimeStatus(graph);
    const res = await startInstance({ definitionId: id, variables, triggerType: 'MANUAL_TRIGGER' });
    const instanceId = (res as any).data ?? res;
    runningInstanceId.value = instanceId;
    runningInstanceStatus.value = 'RUNNING';
    addLog('success', `已启动实例 ${instanceId}`);
    ElMessage.success('已启动执行');
    startPoll(instanceId);
  } catch (e: any) {
    addLog('error', e?.message || e?.msg || '执行失败');
    ElMessage.error('执行失败');
  } finally {
    running.value = false;
  }
}

function startPoll(instanceId: string | number) {
  stopPoll();
  const tick = async () => {
    if (!graph) return;
    try {
      const res = await getInstanceNodes(instanceId);
      const trace = res.data;
      runningInstanceStatus.value = trace?.status || '';
      clearNodeRuntimeStatus(graph);
      (trace?.nodes || []).forEach((n) => {
        applyNodeRuntimeStatus(graph!, n.nodeId, n.status);
      });
      if (trace?.status && !['CREATED', 'RUNNING', 'WAITING'].includes(trace.status)) {
        stopPoll();
        addLog(trace.status === 'SUCCESS' ? 'success' : 'error', `实例结束: ${trace.status}`);
        if (trace.errorMessage) addLog('error', trace.errorMessage);
      }
    } catch {
      // ignore transient
    }
  };
  tick();
  pollTimer = setInterval(tick, 1000);
}

function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
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
  const node = settingsNode.value || selectedNode.value;
  if (!node || !graph) return;
  const data = node.getData() || {};
  data.config = { ...data.config, ...config };
  if (config.name) data.label = config.name;
  node.setData(data);
  addLog('info', `更新节点配置: ${data.label || node.id}`);
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
  padding: 0 12px 0 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  gap: 8px;
}
.stencil-title {
  font-size: 14px;
  font-weight: 600;
  color: #141414;
  flex: 1;
}
.stencil-close {
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
.stencil-close:hover {
  background: #f5f5f5;
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
  background: #f7f8fa;
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

/* ---- Floating zoom ---- */
.floating-zoom-bar {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 12;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e8eaed;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(4px);
}
.float-btn {
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
.float-btn:hover {
  background: #f0f5ff;
  color: #5f95ff;
}
.float-divider {
  width: 20px;
  height: 1px;
  background: #e8eaed;
  margin: 2px 0;
}
.float-zoom-label {
  font-size: 11px;
  color: #8c8c8c;
  min-width: 36px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  padding: 2px 0;
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
</style>
