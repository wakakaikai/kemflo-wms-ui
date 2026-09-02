import type { Component } from 'vue';
import DefaultMetricView from './DefaultMetricView.vue';
import StandardInjectionView from './StandardInjectionView.vue';
import RoFilmInjectionView from './RoFilmInjectionView.vue';

export interface InjectionViewOption {
  label: string;
  value: string;
  description?: string;
}

/** 数采看板视图注册表：新增视图时在此追加选项与组件映射 */
export const INJECTION_VIEW_OPTIONS: InjectionViewOption[] = [
  {
    label: '默认属性看板',
    value: 'standard',
    description: '通用属性卡片网格，适合大多数采集设备'
  },
  {
    label: '注塑机看板',
    value: 'injection',
    description: '分类侧边栏 + 状态/设定参数，适配注塑机'
  },
  {
    label: 'RO卷膜数据记录',
    value: 'ro-film',
    description: '汇川风格数据记录表格，适配 RO 卷膜检漏设备'
  }
];

export const DEFAULT_INJECTION_VIEW = 'standard';

const VIEW_COMPONENTS: Record<string, Component> = {
  standard: DefaultMetricView,
  default: DefaultMetricView,
  injection: StandardInjectionView,
  'ro-film': RoFilmInjectionView,
  rofilm: RoFilmInjectionView
};

export const resolveInjectionViewComponent = (view?: string | null): Component => {
  const key = String(view || DEFAULT_INJECTION_VIEW).trim().toLowerCase() || DEFAULT_INJECTION_VIEW;
  return VIEW_COMPONENTS[key] || VIEW_COMPONENTS[DEFAULT_INJECTION_VIEW];
};

export const getInjectionViewLabel = (view?: string | null) => {
  const key = String(view || DEFAULT_INJECTION_VIEW).trim().toLowerCase() || DEFAULT_INJECTION_VIEW;
  return INJECTION_VIEW_OPTIONS.find((item) => item.value === key)?.label || INJECTION_VIEW_OPTIONS[0].label;
};
