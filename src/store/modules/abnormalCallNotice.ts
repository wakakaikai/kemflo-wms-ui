import { defineStore } from 'pinia';
import { reactive } from 'vue';
import localforage from 'localforage';

// 消息类型定义
export enum MessageCategory {
  ABNORMAL_CALL = 'abnormalCall',
  SYSTEM = 'system',
  ALERT = 'alert',
  TASK = 'task',
  NOTICE = 'notice'
}

export enum MessagePriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export interface NoticeItem {
  id: string;
  title?: string;
  message: string;
  category: MessageCategory;
  priority: MessagePriority;
  read: boolean;
  time: string;
  workCenter: string;
  workStation: string;
  workStationDesc: string;
  metadata?: Record<string, any>;
}

export const useAbnormalCallNoticeStore = defineStore('abnormalCallNotice', () => {
  const state = reactive({
    notices: [] as NoticeItem[],
    isLoading: false,
    lastCleanup: 0,
    ttsEnabled: false
  });

  // 判断消息是否应该保留
  const shouldKeepNotice = (notice: NoticeItem): boolean => {
    // 未读消息永远保留
    if (!notice.read) return true;

    // 已读消息根据类别设置不同保留时间
    const noticeDate = new Date(notice.time);
    const now = new Date();

    let daysToKeep = 7; // 默认保留7天

    switch (notice.category) {
      case MessageCategory.ALERT:
        daysToKeep = 30; // 警报保留30天
        break;
      case MessageCategory.SYSTEM:
        daysToKeep = 14; // 系统消息保留14天
        break;
    }

    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    return noticeDate >= cutoffDate;
  };

  // 清理过期消息
  const cleanupExpiredNotices = async (): Promise<void> => {
    const now = Date.now();
    if (now - state.lastCleanup < 24 * 60 * 60 * 1000) return;

    state.lastCleanup = now;
    state.notices = state.notices.filter(shouldKeepNotice);
    await saveToDB();
  };

  // 保存到 IndexedDB
  const saveToDB = async (): Promise<void> => {
    try {
      const serialized = JSON.parse(JSON.stringify(state.notices));
      await localforage.setItem('abnormalCallNotice', serialized);
    } catch (error) {
      console.error('保存通知失败:', error);
    }
  };

  // 从 IndexedDB 加载
  const loadFromDB = async (): Promise<void> => {
    state.isLoading = true;
    try {
      const saved = await localforage.getItem<NoticeItem[]>('abnormalCallNotice');
      if (saved) {
        state.notices = saved.filter(shouldKeepNotice);
        await saveToDB(); // 保存过滤后的数据
      }
    } catch (error) {
      console.error('加载通知失败:', error);
    } finally {
      state.isLoading = false;
    }
  };

  // 添加新通知
  const addNotice = async (notice: {
    id: any;
    time: any;
    title: string;
    message: any;
    category: any;
    priority: any;
    workCenter: string;
    workStation: any;
    workStationDesc: any;
    messageStatus: number | string;
    metadata: any;
    read: boolean;
  }): Promise<NoticeItem> => {
    const newNotice: NoticeItem = {
      ...notice,
      id: notice.metadata.id,
      time: notice.metadata.sendTime,
      read: notice.metadata.readStatus == 1,
      workCenter: notice.metadata.workCenter,
      workStation: notice.metadata.workStation
    };

    // 使用 unshift 将新消息添加到数组开头
    state.notices.unshift(newNotice);

    await saveToDB();
    return newNotice;
  };

  // 标记为已读
  const markAsRead = async (id: string): Promise<void> => {
    const notice = state.notices.find((n) => n.id === id);
    if (notice && !notice.read) {
      notice.read = true;
      await saveToDB();
      await cleanupExpiredNotices();
    }
  };

  // 删除通知
  const removeNotice = async (id: string): Promise<void> => {
    state.notices = state.notices.filter((n) => n.id !== id);
    await saveToDB();
  };

  // 批量删除方法
  const removeNotices = async (ids: string[]): Promise<void> => {
    state.notices = state.notices.filter((n) => !ids.includes(n.id));
    await saveToDB();
  };

  // 批量删除所有方法
  const removeAllNotices = async (): Promise<void> => {
    state.notices = [];
    await saveToDB();
  };

  // 标记全部为已读
  const markAllAsRead = async (): Promise<void> => {
    state.notices.forEach((n) => {
      n.read = true;
    });
    await saveToDB();
    await cleanupExpiredNotices();
  };

  // 按类别获取通知
  const getNoticesByCategory = (category: MessageCategory) => {
    return state.notices.filter((n) => n.category === category);
  };

  // 初始化
  loadFromDB();
  setInterval(cleanupExpiredNotices, 60 * 60 * 1000);

  return {
    state,
    addNotice,
    markAsRead,
    removeNotice,
    removeNotices,
    removeAllNotices,
    markAllAsRead,
    getNoticesByCategory,
    cleanupExpiredNotices
  };
});

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
