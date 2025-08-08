export interface PackagingData {
  date: string;
  packed: number;
  sent: number;
  received: number;
  returned: number;
  failed: number;
  notes?: string;
}

// 直接导出的静态数据
export const packagingData: PackagingData[] = [
  { date: '2025/7/31', packed: 32, sent: 32, received: 32, returned: 0, failed: 0 },
  { date: '2025/8/1', packed: 68, sent: 68, received: 68, returned: 0, failed: 0 },
  { date: '2025/8/2', packed: 65, sent: 65, received: 65, returned: 0, failed: 0 },
  { date: '2025/8/3', packed: 29, sent: 29, received: 29, returned: 0, failed: 0 },
  { date: '2025/8/4', packed: 81, sent: 81, received: 81, returned: 0, failed: 0 },
  { date: '2025/8/5', packed: 91, sent: 91, received: 77, returned: 0, failed: 0 },
  { date: '2025/8/6', packed: 96, sent: 96, received: 81, returned: 1, failed: 0, notes: '退回已处理' }
];
