import { ref, computed, watch } from 'vue';
import { historyDB } from '@/store/modules/indexedDB';
import type { HistoryConfig, HistoryItem } from '@/types/history';

export function useInputHistory(config: HistoryConfig) {
  const { key, storage = 'indexedDB', maxSize = 10, page = 'default', autoSave = true, saveCondition = (value) => value.trim().length > 0, formatter = (value) => value.trim() } = config;

  const inputValue = ref('');
  const historyList = ref<HistoryItem[]>([]);
  const loading = ref(false);
  const showHistory = ref(false);

  // 加载历史记录
  const loadHistory = async () => {
    try {
      loading.value = true;
      if (storage === 'indexedDB') {
        historyList.value = await historyDB.getHistory(key, maxSize, page);
      } else {
        const localStorageKey = `history_${key}_${page}`;
        const data = localStorage.getItem(localStorageKey);
        historyList.value = data ? JSON.parse(data) : [];
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
    } finally {
      loading.value = false;
    }
  };

  // 保存历史记录
  const saveHistory = async (value?: string) => {
    const valueToSave = formatter(value || inputValue.value);

    if (!saveCondition(valueToSave)) {
      return;
    }

    try {
      // 去重检查
      const existingIndex = historyList.value.findIndex((item) => item.value === valueToSave);

      if (existingIndex !== -1) {
        // 删除旧记录
        const oldItem = historyList.value[existingIndex];
        if (oldItem.id && storage === 'indexedDB') {
          await historyDB.deleteHistory(oldItem.id);
        }
        historyList.value.splice(existingIndex, 1);
      }

      const newItem: Omit<HistoryItem, 'id'> = {
        value: valueToSave,
        key,
        page,
        timestamp: Date.now()
      };

      if (storage === 'indexedDB') {
        const id = await historyDB.addHistory(newItem);
        newItem.id = id;
      } else {
        newItem.id = Date.now();
      }

      // 添加到列表开头
      historyList.value.unshift(newItem as HistoryItem);

      // 限制数量
      if (historyList.value.length > maxSize) {
        const toRemove = historyList.value.slice(maxSize);
        historyList.value = historyList.value.slice(0, maxSize);

        // 从存储中删除多余的
        if (storage === 'indexedDB') {
          for (const item of toRemove) {
            if (item.id) {
              await historyDB.deleteHistory(item.id);
            }
          }
        }
      }

      // 保存到 localStorage（如果使用）
      if (storage === 'localStorage') {
        const localStorageKey = `history_${key}_${page}`;
        localStorage.setItem(localStorageKey, JSON.stringify(historyList.value.slice(0, maxSize)));
      }
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  };

  // 删除单条记录
  const deleteHistory = async (id: number) => {
    try {
      if (storage === 'indexedDB') {
        await historyDB.deleteHistory(id);
      }

      const index = historyList.value.findIndex((item) => item.id === id);
      if (index !== -1) {
        historyList.value.splice(index, 1);

        if (storage === 'localStorage') {
          const localStorageKey = `history_${key}_${page}`;
          localStorage.setItem(localStorageKey, JSON.stringify(historyList.value));
        }
      }
    } catch (error) {
      console.error('删除历史记录失败:', error);
    }
  };

  // 清空历史记录
  const clearHistory = async () => {
    try {
      if (storage === 'indexedDB') {
        await historyDB.clearHistory(key, page);
      } else {
        const localStorageKey = `history_${key}_${page}`;
        localStorage.removeItem(localStorageKey);
      }
      historyList.value = [];
    } catch (error) {
      console.error('清空历史记录失败:', error);
    }
  };

  // 搜索历史记录
  const searchHistory = async (searchText: string) => {
    if (storage === 'indexedDB') {
      return await historyDB.searchHistory(key, searchText, maxSize);
    } else {
      return historyList.value.filter((item) => item.value.toLowerCase().includes(searchText.toLowerCase())).slice(0, maxSize);
    }
  };

  // 导出历史记录
  const exportHistory = () => {
    return JSON.stringify(historyList.value, null, 2);
  };

  // 导入历史记录
  const importHistory = async (jsonString: string) => {
    try {
      const items = JSON.parse(jsonString) as HistoryItem[];
      for (const item of items) {
        await saveHistory(item.value);
      }
    } catch (error) {
      console.error('导入历史记录失败:', error);
    }
  };

  // 监听输入值变化，自动搜索
  const searchResults = ref<HistoryItem[]>([]);
  watch(inputValue, async (newValue) => {
    if (newValue.trim()) {
      searchResults.value = await searchHistory(newValue);
    } else {
      searchResults.value = historyList.value;
    }
  });

  return {
    // 状态
    inputValue,
    historyList,
    loading,
    showHistory,
    searchResults,

    // 方法
    loadHistory,
    saveHistory,
    deleteHistory,
    clearHistory,
    searchHistory,
    exportHistory,
    importHistory,

    // 工具方法
    toggleHistory: () => {
      showHistory.value = !showHistory.value;
      if (showHistory.value && historyList.value.length === 0) {
        loadHistory();
      }
    }
  };
}
