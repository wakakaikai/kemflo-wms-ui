export interface Material {
  id: string;
  name: string;
  code: string;
  location: string; // 库位
  currentStock: number;
  safetyStock: number; // 安全库存
  maxStock: number; // 最大库存
  unit: string; // 单位
  status: 'normal' | 'warning' | 'danger';
  lastUpdate: string;
  category: string; // 物料类别
  supplier: string; // 供应商
  daysOfSupply: number; // 可供应天数
  trendData: number[]; // 库存趋势数据
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  materials: Material[];
  capacity: number;
  usedCapacity: number;
}

export interface Alert {
  id: string;
  materialId: string;
  materialName: string;
  location: string;
  currentStock: number;
  safetyStock: number;
  alertLevel: 'warning' | 'danger';
  time: string;
  resolved: boolean;
}
