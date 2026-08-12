/**
 * IndexedDB 工具类（本地数据库）
 * 用于在浏览器本地数据库存储数据（localStorage 只存字符串、容量小，不适合历史记录等场景）。
 *
 * 用法：
 *   import { IndexedDBStorage, weightHistoryDB } from '@/utils/indexedDB';
 *   await weightHistoryDB.set('key', value);
 *   const value = await weightHistoryDB.get<string>('key');
 *   await weightHistoryDB.remove('key');
 *   await weightHistoryDB.clear();
 */
export class IndexedDBStorage {
  private dbName: string;
  private storeName: string;
  private version: number;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(dbName: string, storeName = 'default', version = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
  }

  /** 打开数据库（懒加载并复用连接） */
  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.dbPromise;
  }

  /** 按 key 读取（无则返回 undefined） */
  async get<T = any>(key: string): Promise<T | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  /** 写入/覆盖 key */
  async set(key: string, value: any): Promise<void> {
    const db = await this.open();
    // Vue ref 的 .value 是响应式 Proxy，IndexedDB 无法结构化克隆；
    // 先深拷贝成纯对象再写入
    let plainValue = value;
    try {
      plainValue = structuredClone(value);
    } catch (e) {
      plainValue = value == null ? value : JSON.parse(JSON.stringify(value));
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.put(plainValue, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** 删除 key */
  async remove(key: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** 清空整个 object store */
  async clear(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

/** 全局单例：称重页面历史数据本地数据库 */
export const weightHistoryDB = new IndexedDBStorage('kemflo-mes', 'weightHistory', 1);
