<template>
  <teleport to="body">
    <transition name="drawer-fade">
      <div v-if="visible" class="settings-drawer-mask" @click.self="handleCancel" />
    </transition>
    <transition name="drawer-slide">
      <aside
        v-if="visible"
        class="settings-drawer"
        :class="{ 'is-http': isHttpNode }"
        role="dialog"
        aria-modal="true"
      >
        <div class="drawer-header" :style="{ background: headerColor }">
          <span class="drawer-icon">{{ iconChar }}</span>
          <span class="drawer-title">{{ drawerTitle }}</span>
          <button class="drawer-close" aria-label="关闭" @click="handleCancel">×</button>
        </div>

        <div class="drawer-body">
          <HttpCallSettingsPanel
            v-if="node && isHttpNode"
            ref="httpPanelRef"
            :node="node"
            @update-config="emit('updateConfig', $event)"
          />
          <PropertyPanel
            v-else-if="node"
            :node="node"
            drawer-mode
            @update-config="emit('updateConfig', $event)"
          />
        </div>

        <div class="drawer-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </div>
      </aside>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Node } from '@antv/x6';
import PropertyPanel from './propertyPanel.vue';
import HttpCallSettingsPanel from './HttpCallSettingsPanel.vue';
import { getNodeConfig } from '../types';
import { getNodeIconChar, getCategoryColor } from '../config/nodeIcons';

const props = defineProps<{
  visible: boolean;
  node: Node | null;
}>();

const emit = defineEmits<{
  close: [];
  save: [];
  updateConfig: [config: Record<string, any>];
}>();

const httpPanelRef = ref<InstanceType<typeof HttpCallSettingsPanel>>();

const nodeData = computed(() => props.node?.getData() || {});
const nodeType = computed(() => nodeData.value.nodeType || '');
const nodeConfig = computed(() => getNodeConfig(nodeType.value));
const isHttpNode = computed(() => nodeType.value === 'HTTP_CALL');

const drawerTitle = computed(() => {
  if (isHttpNode.value) return '发送自定义请求';
  const label = nodeData.value.label || props.node?.attr('label/text');
  return label || nodeConfig.value?.label || '节点配置';
});

const iconChar = computed(() => getNodeIconChar(nodeType.value, nodeConfig.value?.label));
const headerColor = computed(() => {
  if (isHttpNode.value) return '#5b8ff9';
  const cat = nodeConfig.value?.category;
  return cat ? getCategoryColor(cat, nodeConfig.value?.color) : (nodeConfig.value?.color || '#5b8ff9');
});

function handleCancel() {
  emit('close');
}

function handleSave() {
  httpPanelRef.value?.emitChange();
  emit('save');
  emit('close');
}
</script>

<style scoped>
.settings-drawer-mask {
  position: fixed;
  inset: 0;
  z-index: 2900;
  background: rgba(0, 0, 0, 0.25);
}
.settings-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 3000;
  width: min(480px, 92vw);
  background: #fff;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
}
.settings-drawer.is-http {
  width: min(520px, 94vw);
}
.drawer-header {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 20px;
  flex-shrink: 0;
  color: #fff;
}
.drawer-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}
.drawer-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.drawer-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  border-radius: 4px;
  flex-shrink: 0;
}
.drawer-close:hover {
  background: rgba(255, 255, 255, 0.15);
}
.drawer-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  background: #fff;
}
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
}

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.25s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
