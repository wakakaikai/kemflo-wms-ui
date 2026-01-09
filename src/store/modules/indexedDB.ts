export interface HistoryItem {
  id?: number;
  value: string;
  key: string; // 存储键名，用于区分不同输入框
  timestamp: number;
  page?: string; // 页面标识
  metadata?: Record<string, any>; // 额外数据
}

class HistoryDB {
  private dbName = 'InputHistoryDB';
  private version = 1;
  private storeName = 'history';

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('key', 'key', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('page', 'page', { unique: false });
        }
      };
    });
  }

  // 添加历史记录
  async addHistory(item: Omit<HistoryItem, 'id'>): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add({
        ...item,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  // 获取历史记录
  async getHistory(key: string, limit: number = 10, page?: string): Promise<HistoryItem[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('key');
      const keyRange = IDBKeyRange.only(key);
      const request = index.getAll(keyRange);

      request.onsuccess = () => {
        let items = request.result as HistoryItem[];

        // 按页面筛选
        if (page) {
          items = items.filter((item) => item.page === page);
        }

        // 按时间倒序排序，取最新记录
        items.sort((a, b) => b.timestamp - a.timestamp);

        // 限制数量
        if (limit > 0) {
          items = items.slice(0, limit);
        }

        resolve(items);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // 删除单条记录
  async deleteHistory(id: number): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 清空某个key的历史记录
  async clearHistory(key: string, page?: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('key');
      const keyRange = IDBKeyRange.only(key);
      const request = index.openCursor(keyRange);

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const item = cursor.value as HistoryItem;
          // 如果指定了page，只删除该页面的记录
          if (!page || item.page === page) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // 搜索历史记录
  async searchHistory(key: string, searchText: string, limit: number = 10): Promise<HistoryItem[]> {
    const items = await this.getHistory(key, 0); // 获取所有记录
    return items.filter((item) => item.value.toLowerCase().includes(searchText.toLowerCase())).slice(0, limit);
  }
}

export const historyDB = new HistoryDB();
