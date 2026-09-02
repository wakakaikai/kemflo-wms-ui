<template>
  <teleport to="body">
    <transition name="drawer-slide">
      <aside v-if="visible" class="settings-drawer" role="dialog" aria-modal="false">
        <header class="drawer-header">
          <button class="drawer-close" aria-label="关闭" @click="handleCancel">
            <el-icon><Close /></el-icon>
          </button>
          <div class="drawer-title-wrap">
            <span class="drawer-title">{{ drawerTitle }}</span>
            <span class="drawer-type-badge">
              <span class="type-icon" :style="{ background: nodeConfig?.color || '#1677ff' }" v-html="typeIconSvg" />
              {{ nodeConfig?.label || '节点' }}
            </span>
          </div>
          <button class="drawer-edit" title="修改名称" @click="renameNode">
            <el-icon><EditPen /></el-icon>
          </button>
        </header>

        <div v-if="node && showDescription" class="drawer-desc">
          <el-input
            v-model="description"
            type="textarea"
            :rows="2"
            placeholder="添加描述..."
            @change="onDescriptionChange"
          />
        </div>

        <div class="drawer-body">
          <HttpCallSettingsPanel
            v-if="node && nodeType === 'HTTP_CALL'"
            ref="panelRef"
            :node="node"
            @update-config="emit('updateConfig', $event)"
          />
          <StartSettingsPanel
            v-else-if="node && isTriggerNode"
            ref="panelRef"
            :node="node"
            @update-config="emit('updateConfig', $event)"
          />
          <JdbcSettingsPanel
            v-else-if="node && nodeType === 'JDBC_CALL'"
            ref="panelRef"
            :node="node"
            @update-config="emit('updateConfig', $event)"
          />
          <LoopSettingsPanel
            v-else-if="node && nodeType === 'LOOP'"
            ref="panelRef"
            :node="node"
            @update-config="emit('updateConfig', $event)"
          />
          <SwitchSettingsPanel
            v-else-if="node && nodeType === 'SWITCH'"
            ref="panelRef"
            :node="node"
            @update-config="emit('updateConfig', $event)"
          />
          <ChatVarSettingsPanel
            v-else-if="node && nodeType === 'CHAT_VAR_GET'"
            ref="panelRef"
            :node="node"
            mode="get"
            @update-config="emit('updateConfig', $event)"
          />
          <ChatVarSettingsPanel
            v-else-if="node && nodeType === 'CHAT_VAR_SET'"
            ref="panelRef"
            :node="node"
            mode="set"
            @update-config="emit('updateConfig', $event)"
          />
          <PropertyPanel v-else-if="node" :node="node" drawer-mode @update-config="emit('updateConfig', $event)" />
        </div>

        <footer class="drawer-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </footer>
      </aside>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Node } from '@antv/x6';
import { Close, EditPen } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import PropertyPanel from './propertyPanel.vue';
import HttpCallSettingsPanel from './HttpCallSettingsPanel.vue';
import StartSettingsPanel from './StartSettingsPanel.vue';
import JdbcSettingsPanel from './JdbcSettingsPanel.vue';
import LoopSettingsPanel from './LoopSettingsPanel.vue';
import SwitchSettingsPanel from './SwitchSettingsPanel.vue';
import ChatVarSettingsPanel from './ChatVarSettingsPanel.vue';
import { getNodeConfig } from '../types';

const SPECIALIZED_TYPES = new Set([
  'HTTP_CALL',
  'JDBC_CALL',
  'LOOP',
  'SWITCH',
  'CHAT_VAR_GET',
  'CHAT_VAR_SET',
]);

const props = defineProps<{
  visible: boolean;
  node: Node | null;
}>();

const emit = defineEmits<{
  close: [];
  save: [];
  updateConfig: [config: Record<string, any>];
}>();

const panelRef = ref<{ emitChange?: () => void }>();
const description = ref('');

const nodeData = computed(() => props.node?.getData() || {});
const nodeType = computed(() => nodeData.value.nodeType || '');
const nodeConfig = computed(() => getNodeConfig(nodeType.value));
const isTriggerNode = computed(() => nodeType.value.includes('TRIGGER'));
const drawerTitle = computed(() => nodeData.value.label || nodeConfig.value?.label || '节点设置');
const showDescription = computed(() => isTriggerNode.value || (SPECIALIZED_TYPES.has(nodeType.value) && nodeType.value !== 'HTTP_CALL'));

const typeIconSvg = computed(() => {
  const type = nodeType.value;
  if (type.includes('TRIGGER')) {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
  }
  if (type === 'HTTP_CALL') {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/></svg>';
  }
  if (type === 'JDBC_CALL') {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/></svg>';
  }
  if (type === 'SWITCH') {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2"><path d="M6 3v6a3 3 0 003 3h9"/></svg>';
  }
  if (type === 'LOOP') {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2"><path d="M17 1l4 4-4 4"/></svg>';
  }
  if (type === 'CHAT_VAR_GET' || type === 'CHAT_VAR_SET') {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2"><path d="M4 7h16"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="4"/></svg>';
});

watch(
  () => props.node,
  (node) => {
    if (!node) {
      description.value = '';
      return;
    }
    const cfg = node.getData()?.config || {};
    description.value = cfg.description || '';
  },
  { immediate: true },
);

function onDescriptionChange() {
  if (!props.node) return;
  const data = props.node.getData() || {};
  const config = { ...(data.config || {}), description: description.value };
  props.node.setData({ ...data, config });
  emit('updateConfig', { description: description.value });
}

function handleCancel() {
  emit('close');
}

function handleSave() {
  panelRef.value?.emitChange?.();
  onDescriptionChange();
  emit('save');
  emit('close');
}

async function renameNode() {
  if (!props.node) return;
  try {
    const { value } = await ElMessageBox.prompt('请输入节点名称', '修改名称', {
      inputValue: drawerTitle.value,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValidator: (val) => (val?.trim() ? true : '名称不能为空'),
    });
    const name = value?.trim();
    if (!name) return;
    const data = props.node.getData() || {};
    props.node.setData({ ...data, label: name, config: { ...(data.config || {}), name } });
    emit('updateConfig', { name });
  } catch {
    // cancelled
  }
}
</script>

<style scoped>
.settings-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 3000;
  width: min(640px, 44vw);
  min-width: 540px;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  box-shadow: -4px 0 24px rgba(15, 23, 42, 0.1);
  display: flex;
  flex-direction: column;
}
.drawer-header {
  min-height: 56px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #edf0f3;
  background: #fff;
  flex: 0 0 auto;
}
.drawer-close,
.drawer-edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #8a94a6;
  cursor: pointer;
  padding: 0;
  flex: 0 0 auto;
  margin-top: 2px;
}
.drawer-close:hover,
.drawer-edit:hover {
  background: #f3f4f6;
  color: #111827;
}
.drawer-title-wrap {
  flex: 1;
  min-width: 0;
}
.drawer-title {
  display: block;
  color: #111827;
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.drawer-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  color: #8c8c8c;
  font-size: 12px;
}
.type-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
}
.drawer-desc {
  padding: 0 16px 12px;
  border-bottom: 1px solid #edf0f3;
  flex: 0 0 auto;
}
.drawer-desc :deep(.el-textarea__inner) {
  border-color: #e8eaed;
  box-shadow: none;
  font-size: 13px;
}
.drawer-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: #fff;
}
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid #edf0f3;
  background: #fff;
  flex: 0 0 auto;
}
.drawer-footer :deep(.el-button--primary) {
  background: #1677ff;
  border-color: #1677ff;
}
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.22s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
@media (max-width: 900px) {
  .settings-drawer {
    width: 100vw;
    min-width: 0;
  }
}
</style>
