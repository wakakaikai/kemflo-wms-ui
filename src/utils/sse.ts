import { getToken } from '@/utils/auth';
import { ElNotification } from 'element-plus';
import { useNoticeStore } from '@/store/modules/notice';
import { useSpeech } from './speak-tts';
import { MessageCategory, MessagePriority } from '@/store/modules/notice';

// 初始化 SSE
export const initSSE = (baseUrl: string) => {
  if (import.meta.env.VITE_APP_SSE === 'false') return;

  const noticeStore = useNoticeStore();
  const { initSpeech, checkSupport, enqueueMessage } = useSpeech();

  // 初始化语音引擎
  if (checkSupport()) {
    initSpeech();
  }

  // 构建 SSE URL
  const url = `${baseUrl}?Authorization=Bearer ${getToken()}&clientid=${import.meta.env.VITE_APP_CLIENT_ID}`;

  const { data, error } = useEventSource(url, [], {
    autoReconnect: {
      retries: 10,
      delay: 3000,
      onFailed() {
        console.error('SSE 连接失败，已重试10次');
      }
    }
  });

  // 错误处理
  watch(error, (err) => {
    if (err) {
      console.error('SSE 连接错误:', err);
      error.value = null;

      ElNotification.error({
        title: '连接错误',
        message: '实时消息连接中断，正在尝试重新连接...',
        duration: 3000
      });
    }
  });

  // 消息处理
  watch(data, async (newData) => {
    if (!newData) return;

    try {
      let messageData;

      // 尝试解析JSON，失败则作为纯文本处理
      try {
        messageData = JSON.parse(newData);
      } catch (e) {
        messageData = {
          content: newData, // 原始字符串作为content
          category: MessageCategory.SYSTEM,
          priority: MessagePriority.MEDIUM
        };
      }

      // 确保messageData有必需字段
      if (!messageData.content) {
        messageData.content = newData; // 回退到原始消息
      }
      if (!messageData.category) {
        messageData.category = MessageCategory.SYSTEM;
      }
      if (!messageData.priority) {
        messageData.priority = MessagePriority.MEDIUM;
      }

      // 添加到通知中心
      const notice = await noticeStore.addNotice({
        title: messageData.title || '新消息',
        message: messageData.content,
        category: messageData.category,
        priority: messageData.priority,
        metadata: messageData.metadata
      });

      // 显示可视化通知（根据优先级决定样式）
      const notificationType = messageData.priority >= MessagePriority.HIGH ? 'warning' : 'success';
      ElNotification({
        title: messageData.title || '新消息',
        message: messageData.content,
        type: notificationType,
        position: 'top-right',
        duration: messageData.priority >= MessagePriority.HIGH ? 10000 : 5000
      });

      // 语音播报（如果启用）
      if (noticeStore.state.ttsEnabled) {
        const prefix = messageData.priority >= MessagePriority.HIGH ? '重要通知：' : '';
        const speechText = `${prefix}${messageData.title ? messageData.title + '。' : ''}${messageData.content}`;
        enqueueMessage(speechText, messageData.priority, messageData.category);
      }
    } catch (e) {
      console.error('消息处理错误:', e);
    } finally {
      data.value = null;
    }
  });
};
