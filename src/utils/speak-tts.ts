import Speech from 'speak-tts';
import { ElNotification } from 'element-plus';
import { ref } from 'vue';
import { useNoticeStore, MessagePriority } from '@/store/modules/notice';

// 消息队列项
interface QueuedMessage {
  text: string;
  priority: MessagePriority;
  category: string;
}

export const useSpeech = () => {
  const speech = new Speech();
  const isSupported = ref(false);
  const isInitialized = ref(false);
  const isLoading = ref(false);
  const isSpeaking = ref(false);
  const messageQueue = ref<QueuedMessage[]>([]);

  // 初始化语音引擎
  const initSpeech = async () => {
    try {
      if (isInitialized.value) return;

      isLoading.value = true;
      await speech.init({
        volume: 0.8,
        lang: 'zh-CN',
        rate: 1,
        pitch: 1,
        voice: 'Microsoft Huihui - Chinese (Simplified, PRC)',
        listeners: {
          onvoiceschanged: (voices) => {
            console.log('可用语音列表:', voices);
          }
        }
      });

      isInitialized.value = true;
      isSupported.value = true;
      console.log('TTS 初始化成功');
    } catch (error) {
      console.error('语音初始化失败:', error);
      ElNotification.error({
        title: '语音提示',
        message: '语音引擎初始化失败',
        duration: 3000
      });
    } finally {
      isLoading.value = false;
    }
  };

  // 检查浏览器支持
  const checkSupport = () => {
    const supported = speech.hasBrowserSupport();
    isSupported.value = supported;
    return supported;
  };

  // 添加消息到队列
  const enqueueMessage = (text: string, priority: MessagePriority, category: string) => {
    const message = { text, priority, category };

    // 根据优先级插入队列
    const index = messageQueue.value.findIndex((m) => m.priority < priority);
    if (index === -1) {
      messageQueue.value.push(message);
    } else {
      messageQueue.value.splice(index, 0, message);
    }

    // 如果没有正在播报，开始处理队列
    if (!isSpeaking.value) {
      processQueue();
    }
  };

  // 处理消息队列
  const processQueue = async () => {
    if (!isInitialized.value || isSpeaking.value || messageQueue.value.length === 0) return;

    isSpeaking.value = true;
    const message = messageQueue.value.shift()!;

    try {
      await speech.speak({
        text: message.text,
        listeners: {
          onend: () => {
            isSpeaking.value = false;
            processQueue();
          },
          onerror: (e) => {
            console.error('播报出错:', e);
            isSpeaking.value = false;
            processQueue();
          }
        }
      });
    } catch (error) {
      console.error('播报异常:', error);
      isSpeaking.value = false;
      processQueue();
    }
  };

  // 停止所有播报
  const cancelAll = () => {
    speech.cancel();
    messageQueue.value = [];
    isSpeaking.value = false;
  };

  return {
    isSupported,
    isInitialized,
    isLoading,
    isSpeaking,
    initSpeech,
    checkSupport,
    enqueueMessage,
    cancelAll
  };
};
