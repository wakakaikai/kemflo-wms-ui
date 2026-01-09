<template>
  <div class="table-history-input-container">
    <el-input
      ref="inputRef"
      v-model="localValue"
      :placeholder="placeholder"
      @keydown="handleKeyDown"
      @focus="handleFocus"
      @blur="handleBlur"
      clearable
      :class="{ 'has-history': historyList.length > 0 }"
    >
      <template #append>
        <slot name="append"></slot>
      </template>
      <template #prefix>
        <slot name="prefix"></slot>
      </template>
      <template #suffix v-if="config.component?.showHistoryIcon !== false">
        <slot name="suffix">
          <el-icon class="history-icon" @click="toggleHistory">
            <Clock />
          </el-icon>
        </slot>
      </template>
    </el-input>

    <!-- 在容器内直接显示下拉框，确保在下方 -->
    <div
      v-show="showHistory && config.component?.showDropdown !== false"
      ref="dropdownRef"
      class="table-history-dropdown"
      :style="{ maxHeight: config.component?.dropdownMaxHeight || '200px' }"
      @mouseenter="isMouseInDropdown = true"
      @mouseleave="isMouseInDropdown = false"
    >
      <div v-if="loading" class="loading-history">
        <el-icon class="loading-icon">
          <Loading />
        </el-icon>
        加载中...
      </div>

      <div v-else-if="filteredHistory.length === 0" class="empty-history">
        {{ config.component?.emptyText || '暂无历史记录' }}
      </div>

      <template v-else>
        <div
          v-for="(item, index) in filteredHistory"
          :key="item.id"
          ref="itemRefs"
          class="table-history-item"
          :class="{ active: activeIndex === index }"
          @click="selectItem(item)"
          @mouseenter="activeIndex = index"
        >
          <div class="history-content">
            <span class="history-value">{{ item.value }}</span>
            <span v-if="config.component?.showTime" class="history-time">
              {{ formatTime(item.timestamp) }}
            </span>
          </div>

          <el-icon v-if="config.component?.showDelete !== false" class="delete-icon" @click.stop="deleteItem(item)">
            <Close />
          </el-icon>
        </div>
      </template>

      <div v-if="filteredHistory.length > 0" class="history-footer">
        <span class="history-count"> 共 {{ filteredHistory.length }} 条 </span>
        <el-button type="text" size="small" @click="clearAll"> 清空历史 </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { Clock, Loading, Close } from '@element-plus/icons-vue';
import { useInputHistory } from '@/hooks/useInputHistory';
import type { HistoryConfig, HistoryItem } from '@/types/history';

interface Props {
  modelValue?: string;
  config: HistoryConfig;
  placeholder?: string;
  immediateLoad?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请输入内容',
  immediateLoad: true
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'save': [value: string];
  'select': [item: HistoryItem];
  'clear': [];
  'key-navigate': [direction: 'up' | 'down'];
}>();

// Refs
const inputRef = ref<HTMLInputElement>();
const dropdownRef = ref<HTMLElement>();
const itemRefs = ref<HTMLElement[]>([]);
const isMouseInDropdown = ref(false);

// 键盘导航状态
const isNavigating = ref(false);
const navigationLock = ref(false);

// 使用hook
const { inputValue, historyList, loading, showHistory, loadHistory, saveHistory, deleteHistory, clearHistory, toggleHistory } = useInputHistory(props.config);

// 本地值
const localValue = ref(props.modelValue || '');
const activeIndex = ref(-1);

// 计算下拉框位置
const dropdownStyle = computed(() => {
  if (!inputRef.value?.$el) {
    return {
      maxHeight: props.config.component?.dropdownMaxHeight || '200px'
    };
  }

  const inputEl = inputRef.value.$el as HTMLElement;
  const rect = inputEl.getBoundingClientRect();

  // 获取页面滚动偏移
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  // 计算下拉框位置，确保不会超出视窗
  const top = rect.bottom + scrollTop;
  const left = rect.left + scrollLeft;
  const width = rect.width;

  // 计算下拉框高度，确保不会超出视窗底部
  const maxHeight = props.config.component?.dropdownMaxHeight ? parseInt(props.config.component.dropdownMaxHeight) : 200;
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const bottomSpace = windowHeight - rect.bottom;

  // 如果下方空间不够，显示在上方
  let actualTop = top;
  let actualMaxHeight = maxHeight;
  if (bottomSpace < maxHeight && rect.top > maxHeight) {
    actualTop = rect.top + scrollTop - maxHeight;
    actualMaxHeight = Math.min(maxHeight, rect.top);
  } else {
    actualMaxHeight = Math.min(maxHeight, bottomSpace);
  }

  return {
    position: 'absolute',
    top: `${actualTop}px`,
    left: `${left}px`,
    width: `${width}px`,
    maxHeight: `${actualMaxHeight}px`,
    zIndex: '2000'
  };
});

// 初始化
onMounted(() => {
  if (props.immediateLoad) {
    loadHistory();
  }
});

// 监听键盘事件 - 防止与其他组件冲突
const keydownListener = (event: KeyboardEvent) => {
  if (!showHistory.value) return;

  const { key } = event;

  switch (key) {
    case 'Escape':
      handleEscape(event);
      break;
  }
};

onMounted(() => {
  document.addEventListener('keydown', keydownListener);
});

onUnmounted(() => {
  document.removeEventListener('keydown', keydownListener);
});

// 双向绑定
watch(
  () => props.modelValue,
  (val) => {
    localValue.value = val || '';
  }
);

watch(localValue, (val) => {
  emit('update:modelValue', val);
});

// 过滤后的历史记录
const filteredHistory = computed(() => {
  if (!localValue.value.trim()) {
    return historyList.value;
  }
  return historyList.value.filter((item) => item.value.toLowerCase().includes(localValue.value.toLowerCase()));
});

// 监听历史记录变化，重置选中项
watch(filteredHistory, (newItems) => {
  if (newItems.length === 0) {
    activeIndex.value = -1;
  } else if (activeIndex.value >= newItems.length) {
    activeIndex.value = newItems.length - 1;
  }
});

// 统一的键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  if (navigationLock.value) return;

  const { key } = event;

  switch (key) {
    case 'Backspace':
      showHistory.value = true;
      break;
    case 'ArrowUp':
      handleArrowUp(event);
      break;

    case 'ArrowDown':
      handleArrowDown(event);
      break;

    case 'Enter':
      // 触发 enter 事件，允许父组件处理
      emit('keydown.enter', event);
      handleEnter(event);
      break;

    case 'Escape':
      handleEscape(event);
      break;

    case 'Tab':
      // 触发 tab 事件，允许父组件处理
      emit('keydown.tab', event);
      if (showHistory.value) {
        handleTab(event);
      }
      break;
  }
};

// 向上键处理
const handleArrowUp = (event: KeyboardEvent) => {
  if (!showHistory.value || filteredHistory.value.length === 0) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (navigationLock.value) return;
  navigationLock.value = true;

  try {
    isNavigating.value = true;
    let newIndex;

    if (activeIndex.value <= 0) {
      // 循环到最后一个
      newIndex = filteredHistory.value.length - 1;
    } else {
      newIndex = activeIndex.value - 1;
    }

    activeIndex.value = newIndex;
    scrollToActiveItem();
    emit('key-navigate', 'up');
  } finally {
    // 使用 setTimeout 确保导航锁在下一个事件循环中释放
    setTimeout(() => {
      navigationLock.value = false;
      isNavigating.value = false;
    }, 50);
  }
};

// 向下键处理
const handleArrowDown = (event: KeyboardEvent) => {
  if (navigationLock.value) return;
  navigationLock.value = true;

  try {
    if (!showHistory.value && filteredHistory.value.length > 0) {
      // 如果下拉框未显示，显示并选中第一项
      event.preventDefault();
      event.stopPropagation();

      isNavigating.value = true;
      showHistory.value = true;

      nextTick(() => {
        if (filteredHistory.value.length > 0) {
          activeIndex.value = 0;
          scrollToActiveItem();
        }
        emit('key-navigate', 'down');
      });
      return;
    }

    if (!showHistory.value || filteredHistory.value.length === 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    isNavigating.value = true;
    let newIndex;

    if (activeIndex.value >= filteredHistory.value.length - 1) {
      // 循环到第一个
      newIndex = 0;
    } else if (activeIndex.value === -1) {
      // 从无选中状态开始，选中第一个
      newIndex = 0;
    } else {
      newIndex = activeIndex.value + 1;
    }

    activeIndex.value = newIndex;
    scrollToActiveItem();
    emit('key-navigate', 'down');
  } finally {
    setTimeout(() => {
      navigationLock.value = false;
      isNavigating.value = false;
    }, 50);
  }
};

// 回车键处理
const handleEnter = (event: KeyboardEvent) => {
  if (showHistory.value && activeIndex.value >= 0) {
    // 有选中项，使用选中项
    event.preventDefault();
    event.stopPropagation();
    confirmSelection();
  } else if (localValue.value.trim()) {
    // 保存当前输入
    saveHistory(localValue.value);
    emit('save', localValue.value);
    closeDropdown();
  }
};

// ESC 键处理
const handleEscape = (event: KeyboardEvent) => {
  if (showHistory.value) {
    event.preventDefault();
    event.stopPropagation();
    closeDropdown();
  }
};

// Tab 键处理
const handleTab = (event: KeyboardEvent) => {
  closeDropdown();
};

// 确认选择
const confirmSelection = () => {
  if (activeIndex.value >= 0 && activeIndex.value < filteredHistory.value.length) {
    const selectedItem = filteredHistory.value[activeIndex.value];
    selectItem(selectedItem);
  }
};

// 滚动到选中项
const scrollToActiveItem = () => {
  nextTick(() => {
    if (activeIndex.value >= 0 && itemRefs.value[activeIndex.value]) {
      const activeElement = itemRefs.value[activeIndex.value];
      const dropdownElement = dropdownRef.value;

      if (!activeElement || !dropdownElement) return;

      const itemTop = activeElement.offsetTop;
      const itemHeight = activeElement.offsetHeight;
      const dropdownScrollTop = dropdownElement.scrollTop;
      const dropdownHeight = dropdownElement.clientHeight;

      // 如果选中项在可视区域上方
      if (itemTop < dropdownScrollTop) {
        dropdownElement.scrollTo({
          top: itemTop,
          behavior: 'smooth'
        });
      }
      // 如果选中项在可视区域下方
      else if (itemTop + itemHeight > dropdownScrollTop + dropdownHeight) {
        dropdownElement.scrollTo({
          top: itemTop + itemHeight - dropdownHeight,
          behavior: 'smooth'
        });
      }
    }
  });
};

// 关闭下拉框
const closeDropdown = () => {
  showHistory.value = false;
  activeIndex.value = -1;
  isMouseInDropdown.value = false;
};

// 处理聚焦
const handleFocus = () => {
  if (historyList.value.length === 0) {
    loadHistory();
  }

  if (props.config.component?.showDropdown !== false) {
    showHistory.value = true;
    // 如果输入框有内容，不自动选中第一项
    if (!localValue.value.trim() && filteredHistory.value.length > 0) {
      // 延迟设置，确保下拉框已渲染
      setTimeout(() => {
        if (showHistory.value && filteredHistory.value.length > 0) {
          activeIndex.value = 0;
          scrollToActiveItem();
        }
      }, 100);
    }
  }
};

// 处理失焦
const handleBlur = () => {
  // 延迟关闭，以便处理点击事件
  setTimeout(() => {
    if (!isMouseInDropdown.value && !isNavigating.value) {
      closeDropdown();
    }
  }, 200);
};

// 选择历史项
const selectItem = (item: HistoryItem) => {
  localValue.value = item.value;
  closeDropdown();
  emit('select', item);

  // 获取焦点到输入框
  nextTick(() => {
    inputRef.value?.focus();
  });
};

// 删除单条
const deleteItem = async (item: HistoryItem) => {
  if (item.id) {
    const index = filteredHistory.value.findIndex((i) => i.id === item.id);
    const wasActive = index === activeIndex.value;

    await deleteHistory(item.id);

    // 如果删除的是当前选中项，更新选中状态
    if (wasActive) {
      if (filteredHistory.value.length === 0) {
        activeIndex.value = -1;
      } else if (activeIndex.value >= filteredHistory.value.length) {
        activeIndex.value = filteredHistory.value.length - 1;
        scrollToActiveItem();
      }
    }
  }
};

// 清空所有
const clearAll = async () => {
  await clearHistory();
  closeDropdown();
  emit('clear');
};

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;

  // 今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return (
      '昨天 ' +
      date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    );
  }

  // 一周内
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return `周${weekdays[date.getDay()]} ${date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  }

  // 更早
  return (
    date.toLocaleDateString('zh-CN') +
    ' ' +
    date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  );
};

// 暴露方法给父组件
defineExpose({
  saveHistory: () => saveHistory(localValue.value),
  clearHistory,
  loadHistory,
  toggleHistory,
  openDropdown: () => {
    showHistory.value = true;
    nextTick(() => {
      if (filteredHistory.value.length > 0) {
        activeIndex.value = 0;
        scrollToActiveItem();
      }
    });
  },
  closeDropdown,
  navigateUp: () => {
    handleArrowUp(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
  },
  navigateDown: () => {
    handleArrowDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
  }
});
</script>

<style scoped>
.table-history-input-container {
  position: relative;
  width: 100%;
  /* 确保下拉框能正确显示 */
  z-index: 1;
}

.history-icon {
  cursor: pointer;
  color: #c0c4cc;
  transition: color 0.3s;
}

.history-icon:hover {
  color: #409eff;
}

.table-history-dropdown {
  position: static; /* 改为静态定位，不再绝对定位 */
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1; /* 降低z-index，因为不需要覆盖其他元素 */
  margin-top: 2px;
  overflow-y: auto;
  animation: dropdown-appear 0.2s ease;
  box-sizing: border-box;
  max-height: 200px;
  /* 确保在容器内显示 */
  width: 100%;
}

@keyframes dropdown-appear {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-history {
  padding: 10px;
  text-align: center;
  color: #909399;
  font-size: 12px;
}

.loading-icon {
  animation: rotate 1s linear infinite;
  margin-right: 8px;
}

.empty-history {
  padding: 10px;
  text-align: center;
  color: #909399;
  font-size: 12px;
}

.table-history-item {
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 2px solid transparent;
  user-select: none;
  font-size: 12px;
}

.table-history-item:hover {
  background-color: #f5f7fa;
}

.table-history-item.active {
  background-color: #ecf5ff;
  border-left-color: #409eff;
}

.table-history-item.active .history-value {
  color: #409eff;
  font-weight: 500;
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-value {
  display: block;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s;
  font-size: 12px;
}

.history-time {
  display: block;
  font-size: 10px;
  color: #909399;
  margin-top: 1px;
}

.delete-icon {
  color: #c0c4cc;
  font-size: 12px;
  opacity: 0;
  transition:
    opacity 0.2s,
    color 0.2s;
  padding: 1px;
  border-radius: 2px;
}

.table-history-item:hover .delete-icon {
  opacity: 1;
}

.delete-icon:hover {
  color: #f56c6c;
  background-color: #fef0f0;
}

.history-footer {
  padding: 4px 8px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fafafa;
  font-size: 10px;
}

.history-tips {
  color: #909399;
  flex: 1;
}

.history-count {
  font-size: 10px;
  color: #909399;
  margin: 0 8px;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 输入框有历史记录时的样式 */
:deep(.has-history .el-input__wrapper) {
  box-shadow: 0 0 0 1px #409eff inset;
}

/* 键盘导航指示器 */
.table-history-item::before {
  content: '';
  width: 3px;
  height: 3px;
  background-color: #409eff;
  border-radius: 50%;
  margin-right: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}

.table-history-item.active::before {
  opacity: 1;
}
</style>
