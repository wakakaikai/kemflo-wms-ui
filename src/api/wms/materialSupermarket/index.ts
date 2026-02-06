import type { Material, Warehouse } from './types';

export const mockMaterials: Material[] = [
  {
    id: '1',
    name: '不锈钢螺丝',
    code: 'MAT-001',
    location: 'A-01',
    currentStock: 1500,
    safetyStock: 1000,
    maxStock: 5000,
    unit: '个',
    status: 'normal',
    lastUpdate: '2024-01-15T08:30:00',
    category: '紧固件',
    supplier: '上海紧固件有限公司',
    daysOfSupply: 45,
    trendData: [1600, 1550, 1520, 1500]
  },
  {
    id: '2',
    name: 'PCB板',
    code: 'MAT-002',
    location: 'A-02',
    currentStock: 450,
    safetyStock: 500,
    maxStock: 2000,
    unit: '片',
    status: 'danger',
    lastUpdate: '2024-01-15T08:25:00',
    category: '电子元件',
    supplier: '深圳电子科技',
    daysOfSupply: 15,
    trendData: [600, 550, 500, 450]
  },
  {
    id: '3',
    name: '电机',
    code: 'MAT-003',
    location: 'B-01',
    currentStock: 280,
    safetyStock: 300,
    maxStock: 1000,
    unit: '台',
    status: 'warning',
    lastUpdate: '2024-01-15T08:20:00',
    category: '动力部件',
    supplier: '江苏电机厂',
    daysOfSupply: 28,
    trendData: [320, 310, 290, 280]
  }
  // ... 可以添加更多物料数据
];

export const mockWarehouses: Warehouse[] = [
  {
    id: 'WH-001',
    name: '主仓库',
    location: 'A区',
    materials: mockMaterials.slice(0, 3),
    capacity: 10000,
    usedCapacity: 3500
  }
];
