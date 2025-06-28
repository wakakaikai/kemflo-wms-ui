<template>
  <div class="message-container">
    <el-card shadow="hover" class="message-card">
      <template #header>
        <div class="card-header">
          <span>消息通知</span>
          <div class="header-actions">
            <el-button type="primary" size="small" :icon="playbackState.isPlaying ? 'VideoPause' : 'VideoPlay'" @click="togglePlayback">
              {{ playbackState.isPlaying ? '暂停播报' : '开始播报' }}
            </el-button>
            <el-button type="danger" size="small" icon="Delete" :disabled="selectedMessages.length === 0" @click="batchDeleteMessages"> 批量删除 </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="paginatedMessages" style="width: 100%" :row-class-name="tableRowClassName" @row-dblclick="handleRowClick" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="time" label="时间" width="180">
          <template #default="{ row }">
            {{ parseTime(row.time, '{y}-{m}-{d} {h}:{i}:{s}') }}
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="message" label="内容" />
        <el-table-column prop="category" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getCategoryTagType(row.category)">
              {{ getCategoryName(row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityTagType(row.priority)">
              {{ getPriorityName(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.read ? 'success' : 'danger'">
              {{ row.read ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              size="small"
              :type="playbackState.currentId === row.id && playbackState.isPlaying ? 'warning' : 'primary'"
              :icon="playbackState.currentId === row.id && playbackState.isPlaying ? 'VideoPause' : 'VideoPlay'"
              circle
              @click="playOrPauseMessage(row)"
            />
            <el-button size="small" type="danger" icon="Delete" circle @click="deleteMessage(row.id)" />
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="filteredMessages.length"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
        />
      </div>
    </el-card>

    <!-- 语音播放状态栏 -->
    <div v-if="playbackState.currentMessage" class="playback-status">
      <div class="status-content">
        <span>正在播报: {{ playbackState.currentMessage.title }}</span>
        <el-progress :percentage="playbackState.progress" :stroke-width="4" :show-text="false" />
      </div>
      <el-button type="danger" size="small" icon="VideoPause" @click="stopPlayback"> 停止 </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useNoticeStore } from '@/store/modules/notice';
import Speech from 'speak-tts';
import { parseTime } from '@/utils/ruoyi';

// 消息类型和优先级枚举
enum MessageCategory {
  SYSTEM = 'system',
  ALERT = 'alert',
  TASK = 'task',
  NOTICE = 'notice'
}

enum MessagePriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

interface MessageItem {
  id: string;
  title: string;
  message: string;
  category: MessageCategory;
  priority: MessagePriority;
  read: boolean;
  time: string;
  line?: string;
}

// 存储和语音相关
const noticeStore = useNoticeStore();
const speech = new Speech();

// 播放控制状态
const playbackState = reactive({
  isPlaying: false,
  currentId: '',
  currentMessage: null as MessageItem | null,
  progress: 0,
  startTime: 0,
  intervalId: null as NodeJS.Timeout | null,
  estimatedDuration: 5000, // 默认预估时长5秒
  isAutoPlayMode: false
});

// 页面数据
const loading = ref(false);
const messages = ref<any[]>([]);
const selectedMessages = ref<MessageItem[]>([]);
const pagination = reactive({
  currentPage: 1,
  pageSize: 10
});

// 初始化语音引擎
const initSpeech = async () => {
  try {
    await speech.init({
      volume: 0.8,
      lang: 'zh-CN',
      rate: 1,
      pitch: 1,
      voice: 'Microsoft Huihui - Chinese (Simplified, PRC)'
    });
  } catch (error) {
    console.error('语音初始化失败:', error);
    ElMessage.error('语音播报功能初始化失败');
  }
};

// 加载消息
const loadMessages = async () => {
  try {
    loading.value = true;
    messages.value = noticeStore.state.notices;
    // messages.value = messages.value.map((notice) => ({
    //   id: notice.id,
    //   title: notice.title || '无标题',
    //   message: notice.message,
    //   category: notice.category || MessageCategory.SYSTEM,
    //   priority: notice.priority || MessagePriority.MEDIUM,
    //   read: notice.read || false,
    //   time: notice.time
    // }));
  } catch (error) {
    console.error('加载消息失败:', error);
    ElMessage.error('加载消息失败');
  } finally {
    loading.value = false;
  }
};

// 过滤后的消息（分页前）
const filteredMessages = computed(() => {
  return messages.value.filter((msg) => msg.message); // 过滤掉空消息
  // .sort((a, b) => {
  //   // 未读消息优先
  //   if (a.read !== b.read) return a.read ? 1 : -1;
  //   // 高优先级优先
  //   if (a.priority !== b.priority) return b.priority - a.priority;
  //   // 最新时间优先
  //   return new Date(b.time).getTime() - new Date(a.time).getTime();
  // });
});

// 分页后的消息
const paginatedMessages = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredMessages.value.slice(start, end);
});

// 播放/暂停单条消息
const playOrPauseMessage = async (message: MessageItem) => {
  if (playbackState.currentId === message.id && playbackState.isPlaying) {
    await pausePlayback();
  } else {
    playbackState.isAutoPlayMode = false; // 设置为单条播放模式
    await playMessage(message);
  }
};

// 播放消息
const playMessage = async (message: MessageItem, repeatCount = 3) => {
  try {
    // 停止当前播放
    if (playbackState.isPlaying) {
      speech.cancel();
    }

    // 设置当前播放消息
    playbackState.currentId = message.id;
    playbackState.currentMessage = message;
    playbackState.isPlaying = true;

    // 开始进度条
    startProgressTimer();

    // 创建播放文本
    const playText = `${message.title}。${message.message}`;
    const repeatedText = Array(repeatCount).fill(playText).join('。');

    // 标记消息为已读
    await markAsRead(message.id);

    // 开始播放
    await speech.speak({
      text: repeatedText,
      listeners: {
        onstart: () => {
          playbackState.startTime = Date.now();
          // 根据文本长度估计播放时长
          playbackState.estimatedDuration = Math.max(5000, playText.length * 1000);
        },
        onend: () => {
          playbackState.progress = 100;
          // 如果是自动播放模式，才播放下一条
          if (playbackState.isAutoPlayMode) {
            playNextMessage();
          } else {
            resetPlaybackState();
          }
        },
        onerror: (e) => {
          console.error('播报出错:', e);
          resetPlaybackState();
          ElMessage.error('消息播报失败');
        }
      }
    });
  } catch (error) {
    console.error('播放失败:', error);
    resetPlaybackState();
    ElMessage.error('消息播报失败');
  }
};

// 暂停播放
const pausePlayback = async () => {
  try {
    await speech.pause();
    playbackState.isPlaying = false;
    stopProgressTimer();
  } catch (error) {
    console.error('暂停失败:', error);
    ElMessage.error('暂停播报失败');
  }
};

// 恢复播放
const resumePlayback = async () => {
  if (!playbackState.currentMessage) return;

  try {
    await speech.resume();
    playbackState.isPlaying = true;
    startProgressTimer();
  } catch (error) {
    console.error('恢复失败:', error);
    ElMessage.error('恢复播报失败');
  }
};

// 停止播放
const stopPlayback = async () => {
  try {
    await speech.cancel();
    resetPlaybackState();
  } catch (error) {
    console.error('停止失败:', error);
    ElMessage.error('停止播报失败');
  }
};

// 播放下一条消息
const playNextMessage = async () => {
  if (!playbackState.isAutoPlayMode) return;

  const currentIndex = filteredMessages.value.findIndex((msg) => msg.id === playbackState.currentId);
  if (currentIndex >= 0 && currentIndex < filteredMessages.value.length - 1) {
    const nextMessage = filteredMessages.value[currentIndex + 1];
    await playMessage(nextMessage);
  } else {
    await stopPlayback();
    ElMessage.success('所有消息已播报完毕');
  }
  R;
};

// 开始进度计时器
const startProgressTimer = () => {
  stopProgressTimer();
  playbackState.progress = 0;
  playbackState.startTime = Date.now();

  playbackState.intervalId = setInterval(() => {
    const elapsed = Date.now() - playbackState.startTime;
    playbackState.progress = Math.min((elapsed / playbackState.estimatedDuration) * 100, 100);
  }, 100);
};

// 停止进度计时器
const stopProgressTimer = () => {
  if (playbackState.intervalId) {
    clearInterval(playbackState.intervalId);
    playbackState.intervalId = null;
  }
  playbackState.progress = 0;
};

// 重置播放状态
const resetPlaybackState = () => {
  playbackState.isPlaying = false;
  playbackState.currentId = '';
  playbackState.currentMessage = null;
  stopProgressTimer();
};

// 标记为已读
const markAsRead = async (id: string) => {
  try {
    // 更新本地状态
    const index = messages.value.findIndex((msg) => msg.id === id);
    if (index >= 0 && !messages.value[index].read) {
      messages.value[index].read = true;
      // 同步到服务器
      await noticeStore.markAsRead(id);
    }
  } catch (error) {
    console.error('标记已读失败:', error);
    ElMessage.error('标记已读失败');
  }
};

// 删除单条消息
const deleteMessage = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这条消息吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    if (playbackState.currentId === id) {
      await stopPlayback();
    }

    await noticeStore.removeNotice(id);
    messages.value = messages.value.filter((msg) => msg.id !== id);

    // 如果删除的是选中消息，从选中列表中移除
    selectedMessages.value = selectedMessages.value.filter((msg) => msg.id !== id);

    ElMessage.success('删除成功');
  } catch (error) {
    console.error('删除失败:', error);
  }
};

// 批量删除消息
const batchDeleteMessages = async () => {
  if (selectedMessages.value.length === 0) return;

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedMessages.value.length} 条消息吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    const ids = selectedMessages.value.map((msg) => msg.id);

    if (ids.includes(playbackState.currentId)) {
      await stopPlayback();
    }

    await noticeStore.removeNotices(ids);
    messages.value = messages.value.filter((msg) => !ids.includes(msg.id));
    selectedMessages.value = [];
    ElMessage.success('删除成功');
  } catch (error) {
    console.error('批量删除失败:', error);
  }
};

// 表格选择变化
const handleSelectionChange = (selection: MessageItem[]) => {
  selectedMessages.value = selection;
};

// 开始/暂停自动播报
const togglePlayback = async () => {
  if (playbackState.isPlaying) {
    await stopPlayback();
  } else {
    if (filteredMessages.value.length > 0) {
      playbackState.isAutoPlayMode = true; // 设置为自动播放模式
      await playMessage(filteredMessages.value[0]);
    } else {
      ElMessage.info('没有可播报的消息');
    }
  }
};

// 辅助函数：获取分类名称和样式
const getCategoryName = (category: MessageCategory) => {
  const names = {
    [MessageCategory.SYSTEM]: '系统',
    [MessageCategory.ALERT]: '警报',
    [MessageCategory.TASK]: '任务',
    [MessageCategory.NOTICE]: '通知'
  };
  return names[category] || '未知';
};

const getCategoryTagType = (category: MessageCategory) => {
  const types = {
    [MessageCategory.SYSTEM]: '',
    [MessageCategory.ALERT]: 'danger',
    [MessageCategory.TASK]: 'warning',
    [MessageCategory.NOTICE]: 'success'
  };
  return types[category] || '';
};

// 辅助函数：获取优先级名称和样式
const getPriorityName = (priority: MessagePriority) => {
  const names = {
    [MessagePriority.LOW]: '低',
    [MessagePriority.MEDIUM]: '中',
    [MessagePriority.HIGH]: '高',
    [MessagePriority.CRITICAL]: '紧急'
  };
  return names[priority] || '未知';
};

const getPriorityTagType = (priority: MessagePriority) => {
  const types = {
    [MessagePriority.LOW]: 'info',
    [MessagePriority.MEDIUM]: '',
    [MessagePriority.HIGH]: 'warning',
    [MessagePriority.CRITICAL]: 'danger'
  };
  return types[priority] || '';
};

// 添加行样式函数
const tableRowClassName = ({ row }) => {
  return row.id === playbackState.currentId ? 'highlight-row' : '';
};

// 点击行处理
const handleRowClick = (row: MessageItem) => {
  if (playbackState.currentId === row.id) {
    stopPlayback();
  } else {
    playbackState.isAutoPlayMode = false;
    playMessage(row);
  }
};

// 初始化
onMounted(async () => {
  await initSpeech();
  await loadMessages();
});

// 清理
onUnmounted(() => {
  stopPlayback();
  speech.cancel();
});
</script>

<style scoped>
.message-container {
  padding: 20px;
}

.message-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.playback-status {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--el-bg-color);
  padding: 10px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 2000;
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 300px;
}

.el-progress {
  margin-top: 5px;
}

/* 高亮行样式 */
:deep(.el-table .highlight-row) {
  background-color: var(--el-color-primary-light-9);
  transition: background-color 0.3s ease;
  animation: pulse 2s infinite;
}

/* 脉冲动画效果 */
@keyframes pulse {
  0% {
    background-color: var(--el-color-primary-light-9);
  }
  50% {
    background-color: var(--el-color-primary-light-7);
  }
  100% {
    background-color: var(--el-color-primary-light-9);
  }
}
</style>
