export interface HistoryConfig {
  // 存储键名，必填
  key: string;

  // 存储引擎，默认 'indexedDB'
  storage?: 'indexedDB' | 'localStorage';

  // 最大记录数，默认 10
  maxSize?: number;

  // 页面标识，用于区分不同页面的相同key
  page?: string;

  // 是否自动保存（按回车时）
  autoSave?: boolean;

  // 保存条件
  saveCondition?: (value: string) => boolean;

  // 自定义格式化
  formatter?: (value: string) => string;

  // 组件显示配置
  component?: {
    // 是否显示下拉历史记录
    showDropdown?: boolean;
    // 下拉框最大高度
    dropdownMaxHeight?: string;
    // 是否显示时间
    showTime?: boolean;
    // 是否显示删除按钮
    showDelete?: boolean;
    // 空状态提示
    emptyText?: string;
  };
}

export interface HistoryItem {
  id?: number;
  value: string;
  key: string;
  timestamp: number;
  page?: string;
  metadata?: Record<string, any>;
}
