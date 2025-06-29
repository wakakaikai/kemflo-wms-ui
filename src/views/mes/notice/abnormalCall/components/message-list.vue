<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="工作中心" prop="workCenter">
              <el-input v-model="queryParams.workCenter" placeholder="请输入工作中心" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工作岗位" prop="workStation">
              <el-input v-model="queryParams.workStation" placeholder="请输入工作岗位" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="消息标题" prop="title">
              <el-input v-model="queryParams.title" placeholder="请输入消息标题" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="阅读状态" prop="readStatus">
              <el-select v-model="queryParams.readStatus" placeholder="请选择阅读状态" clearable filterable>
                <el-option label="未读" value="0" />
                <el-option label="已读" value="1" />
              </el-select>
            </el-form-item>
            <el-form-item label="确认状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="请选择确认状态" clearable filterable>
                <el-option label="已发送" value="1" />
                <el-option label="已确认" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="发送时间" prop="sendTimeRange">
              <el-date-picker
                v-model="queryParams.sendTimeRange"
                type="datetimerange"
                :shortcuts="shortcuts"
                value-format="YYYY-MM-DD HH:mm:ss"
                range-separator="-"
                start-placeholder="请选择开始日期"
                end-placeholder="请选择结束日期"
                :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="hover" class="message-card">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="success" icon="message" :disabled="selectedMessages.length === 0" @click="handleMessageRead"> 标为已读 </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button :type="playbackState.isPlaying ? 'danger' : 'primary'" :icon="playbackState.isPlaying ? 'VideoPause' : 'VideoPlay'" @click="togglePlayback">
              {{ playbackState.isPlaying ? '暂停播报' : '开始播报' }}
            </el-button>
          </el-col>
          <el-col :span="1.5" style="float: right">
            <el-button :type="newMessageAutoPlayVoice ? 'warning' : 'info'" :icon="newMessageAutoPlayVoice ? 'VideoPause' : 'VideoPlay'" @click="toggleNewMessageAutoPlayVoice">
              {{ newMessageAutoPlayVoice ? '停止监听新消息' : '监听新消息自动播报' }}
            </el-button>
          </el-col>
          <!--          <el-col :span="1.5">
            <el-button type="danger" icon="Delete" :disabled="selectedMessages.length === 0" @click="batchDeleteMessages"> 批量删除 </el-button>
          </el-col>-->
          <!-- 循环次数输入框 -->
          <div style="margin-left: auto; float: right">
            <el-col :span="1.5">
              <span style="margin-right: 10px; font-size: 14px; color: #606266">循环播放次数：</span>
              <el-input-number v-model="playRepeatCount" :min="1" :max="10" style="width: 100px" controls-position="right" />
            </el-col>
          </div>

          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
          <el-badge :value="filteredMessages.length" :max="99999999" color="green" class="ml10 mr20">
            <el-button circle icon="Document" />
          </el-badge>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="pageMessageList" fit :row-class-name="tableRowClassName" @row-dblclick="handleRowClick" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="title" align="center" label="标题" width="100" />
        <el-table-column prop="time" align="center" label="时间" width="160">
          <template #default="{ row }">
            {{ parseTime(row.time, '{y}-{m}-{d} {h}:{i}:{s}') }}
          </template>
        </el-table-column>
        <el-table-column prop="workCenter" align="center" label="工作中心" width="100" />
        <el-table-column prop="workStation" align="left" label="工作岗位" width="200">
          <template #default="{ row }">
            <span v-if="row.workStation || row.workStationDesc"> {{ row.workStation }}（{{ row.workStationDesc }}） </span>
          </template>
        </el-table-column>
        <el-table-column prop="message" align="left" label="内容" />
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityTagType(row.priority as MessagePriority)">
              {{ getPriorityName(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" align="center" label="阅读状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.read ? 'success' : 'danger'">
              {{ row.read ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="确认状态" align="center" prop="messageStatus">
          <template #default="{ row }">
            <dict-tag :options="mes_message_status" :value="row.messageStatus" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-tooltip class="item" effect="dark" content="单条播放" placement="top">
              <el-button
                size="small"
                :type="playbackState.currentId === row.id && playbackState.isPlaying ? 'warning' : 'primary'"
                :icon="playbackState.currentId === row.id && playbackState.isPlaying ? 'VideoPause' : 'VideoPlay'"
                circle
                @click="playOrPauseMessage(row)"
              />
            </el-tooltip>
            <el-tooltip class="item" effect="dark" content="单条循环10次" placement="top">
              <el-button size="small" type="success" icon="RefreshRight" circle @click="playMessageWithRepeat(row)" :disabled="playbackState.currentId === row.id && playbackState.isPlaying" />
            </el-tooltip>
            <!--            <el-button size="small" type="danger" icon="Delete" circle @click="deleteMessage(row.id)" />-->
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="filteredMessages.length"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100, 200, 500, 1000]"
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
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import Speech from 'speak-tts';
import { parseTime } from '@/utils/ruoyi';
import { markMessageAsRead, queryReceivedMessageList } from '@/api/mes/message';
import { MessageForm, MessageQuery } from '@/api/mes/message/types';
import { useAbnormalCallNoticeStore } from '@/store/modules/abnormalCallNotice';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { mes_message_status } = toRefs<any>(proxy?.useDict('mes_message_status'));
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const messageFormRef = ref<ElFormInstance>();
const initFormData: MessageForm = {
  id: undefined,
  workCenter: undefined,
  workStation: undefined,
  workStationDesc: undefined,
  title: undefined,
  content: undefined,
  messageType: undefined,
  priority: undefined,
  status: undefined,
  sendTime: undefined,
  sendTimeRange: undefined,
  sendUser: undefined,
  confirmTime: undefined,
  confirmUser: undefined,
  remark: undefined
};
const data = reactive<PageData<MessageForm, MessageQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    workCenter: undefined,
    workStation: undefined,
    workStationDesc: undefined,
    title: undefined,
    content: undefined,
    messageType: undefined,
    priority: undefined,
    status: undefined,
    sendTime: undefined,
    sendTimeRange: undefined,
    sendUser: undefined,
    confirmTime: undefined,
    confirmUser: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

const shortcuts = [
  {
    text: '今天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate());
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '昨天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近两天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近三天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 2);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近一周',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近一月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近三月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  }
];
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

// 添加循环次数变量
const playRepeatCount = ref(3); // 默认3次
// 手动播放队列
const playManualQueue = ref<MessageItem[]>([]);
// 新消息播放队列
const playNewMessageQueue = ref<MessageItem[]>([]);
// 新消息播状态
const newMessageAutoPlayVoice = ref(false);
// 播放队列控制
const playQueue = ref<MessageItem[]>([]);
// 播放状态
const isPlayingQueue = ref(false);

/** 查询消息主表列表 */
const getList = async () => {
  loading.value = true;
  noticeStore.removeAllNotices();
  const res = await queryReceivedMessageList(queryParams.value);
  (res.data || []).map((messageData) => {
    noticeStore.addNotice({
      title: messageData.title || '异常呼叫',
      message: messageData.content,
      category: 'abnormalCall',
      priority: messageData.priority,
      id: messageData.id,
      time: messageData.sendTime,
      read: messageData.readStatus == 1,
      workCenter: messageData.workCenter,
      workStation: messageData.workStation,
      workStationDesc: messageData.workStationDesc,
      messageStatus: messageData.status,
      metadata: messageData
    });
  });
  messages.value = noticeStore.state.notices;
  loading.value = false;
};

/** 取消按钮 */
const cancel = () => {
  reset();
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  messageFormRef.value?.resetFields();
};
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

// 存储和语音相关
const noticeStore = useAbnormalCallNoticeStore();
const speech = new Speech();
// 定义播放模式枚举
enum PlayMode {
  MANUAL = 'manual', // 手动选择或从头播放
  NEW_MESSAGE = 'new' // 监听新消息
}
// 播放控制状态
const playbackState = reactive({
  isPlaying: false,
  currentId: '',
  currentMessage: null as MessageItem | null,
  progress: 0,
  startTime: 0,
  intervalId: null as NodeJS.Timeout | null,
  estimatedDuration: 5000, // 默认预估时长5秒
  isAutoPlayMode: false,
  playMode: null as PlayMode | null // 当前播放模式
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
      voice: 'Microsoft Huihui - Chinese (Simplified, PRC)',
      splitSentences: true
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
    const res = await queryReceivedMessageList(queryParams.value);
    noticeStore.removeAllNotices();
    (res.data || []).map((messageData: any) => {
      noticeStore.addNotice({
        title: messageData.title || '异常呼叫',
        message: messageData.content,
        category: 'abnormalCall',
        priority: messageData.priority,
        id: messageData.id,
        time: messageData.sendTime,
        read: messageData.readStatus == 1,
        workCenter: messageData.workCenter,
        workStation: messageData.workStation,
        workStationDesc: messageData.workStationDesc,
        messageStatus: messageData.status,
        metadata: messageData
      });
    });
    messages.value = noticeStore.state.notices;
  } catch (error) {
    console.error('加载消息失败:', error);
  } finally {
    loading.value = false;
  }
};

// 过滤后的消息（分页前）
const filteredMessages = computed(() => {
  return messages.value.filter((msg) => msg.message);
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
const pageMessageList = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredMessages.value.slice(start, end) || [];
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

// 循环播报单条消息
const playMessageWithRepeat = async (message: MessageItem) => {
  if (playbackState.isPlaying) {
    await stopPlayback();
  }

  playbackState.isAutoPlayMode = false;
  playbackState.playMode = PlayMode.MANUAL;
  playManualQueue.value = [message]; // 只包含当前消息

  // 设置循环次数为当前playRepeatCount的值
  await playMessage(message, 10);
};

// 在组件中定义多音字映射表
const polyphonicMap: Record<string, string> = {
  '称重': '称众'
};

// 处理多音字的函数
const processPolyphonic = (text: string): string => {
  let processedText = text;

  // 按优先级处理特定词组
  Object.keys(polyphonicMap).forEach((key) => {
    processedText = processedText.replace(new RegExp(key, 'g'), polyphonicMap[key]);
  });

  // 处理单独出现的多音字
  // processedText = processedText.replace(/乐/g, '月').replace(/行/g, '航').replace(/长/g, '常').replace(/重/g, '虫').replace(/差/g, '拆').replace(/朝/g, '招').replace(/厦/g, '下');

  return processedText;
};

// 播放消息
const playMessage = async (message: MessageItem, repeatCount = playRepeatCount.value || 1) => {
  try {
    // 停止当前播放
    if (playbackState.isPlaying) {
      await speech.cancel();
    }

    // 设置当前播放消息
    playbackState.currentId = message.id;
    playbackState.currentMessage = message;
    playbackState.isPlaying = true;

    // 如果是新消息模式，更新选中状态
    if (playbackState.playMode === PlayMode.NEW_MESSAGE) {
      selectedMessages.value = [message];
    }
    // 预处理文本 - 替换多音字和特殊字符
    const processedText = processPolyphonic(message.message)
      .replace(/[#*]/g, '') // 移除特殊符号
      .replace(/\n/g, '。'); // 将换行符转换为句号

    // 创建播放文本
    // const playText = `${message.title}。${message.message}`;
    const playText = `${message.title}。${processedText}`;
    const repeatedText = Array(repeatCount).fill(playText).join('。');

    // 标记消息为已读
    await markAsRead(message.id);

    // 开始进度条
    startProgressTimer();

    // 开始播放
    await speech.speak({
      text: repeatedText,
      listeners: {
        onstart: () => {
          playbackState.startTime = Date.now();
          // 根据文本长度估计播放时长
          playbackState.estimatedDuration = repeatedText.length * 250;
        },
        onend: () => {
          playbackState.progress = 100;
          // 根据当前播放模式处理
          switch (playbackState.playMode) {
            case PlayMode.MANUAL:
              playNextManualMessage();
              break;
            case PlayMode.NEW_MESSAGE:
              if (playNewMessageQueue.value.length > 0) {
                playNextNewMessage();
              } else {
                resetPlaybackState();
              }
              break;
            default:
              resetPlaybackState();
          }
        },
        onerror: (e) => {
          console.error('播报出错:', e);
          resetPlaybackState();
        }
      }
    });
  } catch (error) {
    console.error('播放失败:', error);
    resetPlaybackState();
    isPlayingQueue.value = false;
  }
};

// 播放下一条手动消息
const playNextManualMessage = async () => {
  const currentIndex = playManualQueue.value.findIndex((msg) => msg.id === playbackState.currentId);

  if (currentIndex >= 0 && currentIndex < playManualQueue.value.length - 1) {
    await playMessage(playManualQueue.value[currentIndex + 1]);
  } else {
    // 手动播放完成
    await stopPlayback();
    ElMessage.success('手动播报完成');

    // 如果开启了新消息自动播报，则开始监听新消息
    if (newMessageAutoPlayVoice.value) {
      playbackState.playMode = PlayMode.NEW_MESSAGE;
      // 检查是否有新消息等待播放
      if (playNewMessageQueue.value.length > 0) {
        // 清空当前选中状态
        selectedMessages.value = [];
        // 播放新消息
        await playNextNewMessage();
      }
    }
  }
};

// 播放下一条新消息
const playNextNewMessage = async () => {
  if (playNewMessageQueue.value.length > 0) {
    const nextMessage = playNewMessageQueue.value[0]; // 获取下一条消息但不shift
    // 更新选中状态
    selectedMessages.value = [nextMessage];
    await playMessage(playNewMessageQueue.value.shift()!);

    // 播放完成后再次检查队列
    if (playNewMessageQueue.value.length > 0) {
      await playNextNewMessage();
    }
  } else {
    await stopPlayback();
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
  playbackState.playMode = null;
  stopProgressTimer();

  // 如果是手动模式被中断，清空手动队列
  if (playbackState.playMode === PlayMode.MANUAL) {
    playManualQueue.value = [];
  }
};

// 标记为已读
const markAsRead = async (id: string) => {
  try {
    // 更新本地状态
    const index = messages.value.findIndex((msg) => msg.id === id);
    if (index >= 0 && !messages.value[index].read) {
      messages.value[index].read = true;
      // 同步到服务器
      await Promise.all([markMessageAsRead(id), noticeStore.markAsRead(id)]);
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
const handleMessageRead = () => {
  if (selectedMessages.value.length === 0) return;
  selectedMessages.value.forEach((msg) => {
    console.log('markAsRead', msg.id);
    Promise.all([markMessageAsRead(msg.id), noticeStore.markAsRead(msg.id)]);
  });
};

// 开始/暂停自动播报
const togglePlayback = async () => {
  if (playbackState.isPlaying) {
    await stopPlayback();
    return;
  } else {
    // 如果有选中的消息，优先播放选中的消息（按优先级排序）
    if (selectedMessages.value.length > 0) {
      playbackState.playMode = PlayMode.MANUAL;
      playManualQueue.value = [...selectedMessages.value].sort((a, b) => b.priority - a.priority);
      await playMessage(playManualQueue.value[0]);
    }
    // 没有选中消息但列表有消息时，播放第一条
    else if (filteredMessages.value.length > 0) {
      playbackState.playMode = PlayMode.MANUAL;
      playManualQueue.value = [...filteredMessages.value].sort((a, b) => b.priority - a.priority);
      await playMessage(playManualQueue.value[0]);
    } else {
      ElMessage.info('没有可播报的消息');
    }
  }
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
  const types: Record<MessagePriority, string> = {
    [MessagePriority.LOW]: 'info',
    [MessagePriority.MEDIUM]: 'primary', // 中优先级使用蓝色
    [MessagePriority.HIGH]: 'warning',
    [MessagePriority.CRITICAL]: 'danger'
  };
  return types[priority] ?? 'primary'; // 使用空值合并运算符确保非空
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

// 切换新消息监听
const toggleNewMessageAutoPlayVoice = () => {
  newMessageAutoPlayVoice.value = !newMessageAutoPlayVoice.value;

  if (newMessageAutoPlayVoice.value) {
    // 开启监听时设置播放模式
    playbackState.playMode = PlayMode.NEW_MESSAGE;

    // 清空当前选中状态
    selectedMessages.value = [];

    // 如果没有正在播放且有新消息，开始播放
    if (!playbackState.isPlaying && playNewMessageQueue.value.length > 0) {
      const nextMessage = playNewMessageQueue.value[0];
      // 更新选中状态
      selectedMessages.value = [nextMessage];
      playNextNewMessage();
    }
  } else {
    // 关闭监听时，如果当前是新消息模式则停止播放
    if (playbackState.playMode === PlayMode.NEW_MESSAGE) {
      stopPlayback();
    }
    playNewMessageQueue.value = [];
  }
};

// 从队列中播放消息
const playFromQueue = async () => {
  if (playQueue.value.length === 0) {
    isPlayingQueue.value = false;
    return;
  }

  isPlayingQueue.value = true;
  const nextMessage = playQueue.value.shift(); // 取出队列第一个消息
  if (nextMessage) {
    await playMessage(nextMessage);
  }
};

// 初始化
onMounted(async () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate());
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  queryParams.value.sendTimeRange = [parseTime(start), parseTime(end)];
  await initSpeech();
  await loadMessages();

  // 监听新消息并加入播放队列
  watch(
    () => messages.value,
    (newMessages) => {
      if (!newMessageAutoPlayVoice.value) return;

      const newUnreadMessages = newMessages.filter((msg) => !msg.read && !playNewMessageQueue.value.some((q) => q.id === msg.id) && (playbackState.currentId !== msg.id || !playbackState.isPlaying));

      if (newUnreadMessages.length > 0) {
        // 将新消息加入队列并按优先级排序
        playNewMessageQueue.value = [...newUnreadMessages, ...playNewMessageQueue.value].sort((a, b) => b.priority - a.priority);

        // 如果没有正在播放，开始播放
        if (!playbackState.isPlaying) {
          playNextNewMessage();
        }
      }
    },
    { deep: true }
  );
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
