<template>
  <div class="gantt-wrapper" :class="{ 'fullscreen-mode': isFullscreen }">
    <div v-if="showLegend" class="legend-container">
      <!-- 图例说明 -->
      <div class="legend-item">
        <div class="color-block primary"></div>
        <span>{{ legendText.plan }}</span>
      </div>
      <div class="legend-item">
        <div class="color-block success"></div>
        <span>{{ legendText.actual }}</span>
      </div>
      <!-- 树节点展开/折叠控制 -->
      <div class="tree-control">
        <el-switch v-model="allExpanded" @change="handleTreeExpandChange" inline-prompt active-text="展开" inactive-text="折叠" style="--el-switch-on-color: #409eff; --el-switch-off-color: #dcdfe6" />
      </div>

      <!-- 右侧网格显示切换 -->
      <div class="grid-toggle-control">
        <el-switch
          v-model="showGridLines"
          @change="handleGridLineChange"
          inline-prompt
          active-text="网格"
          inactive-text="非网格"
          style="--el-switch-on-color: #409eff; --el-switch-off-color: #dcdfe6"
        />
      </div>

      <!-- 视图切换按钮组（6个预定义视图级别） -->
      <div class="view-switcher">
        <el-button-group>
          <el-tooltip content="小时级详细视图" placement="top">
            <el-button :type="currentView === 'hours' ? 'primary' : ''" @click="switchView('hours')"> 小时 </el-button>
          </el-tooltip>
          <el-tooltip content="天级视图" placement="top">
            <el-button :type="currentView === 'days' ? 'primary' : ''" @click="switchView('days')"> 天 </el-button>
          </el-tooltip>
          <el-tooltip content="周级视图（默认）" placement="top">
            <el-button :type="currentView === 'weeks' ? 'primary' : ''" @click="switchView('weeks')"> 周 </el-button>
          </el-tooltip>
          <el-tooltip content="月级视图" placement="top">
            <el-button :type="currentView === 'months' ? 'primary' : ''" @click="switchView('months')"> 月 </el-button>
          </el-tooltip>
          <el-tooltip content="季度视图" placement="top">
            <el-button :type="currentView === 'quarters' ? 'primary' : ''" @click="switchView('quarters')"> 季度 </el-button>
          </el-tooltip>
          <el-tooltip content="年级宏观视图" placement="top">
            <el-button :type="currentView === 'years' ? 'primary' : ''" @click="switchView('years')"> 年 </el-button>
          </el-tooltip>
        </el-button-group>
      </div>

      <!-- 缩放控制按钮组 -->
      <div class="zoom-controls">
        <el-button-group>
          <el-tooltip content="缩小" placement="top">
            <el-button @click="zoomOut">
              <el-icon><ZoomOut /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="放大" placement="top">
            <el-button @click="zoomIn">
              <el-icon><ZoomIn /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="重置缩放" placement="top">
            <el-button @click="resetZoom">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
          <!--          <el-tooltip content="自动适应" type="primary" placement="top">
                      <el-button type="primary" @click="zoomToFit">
                        <el-icon><RefreshLeft /></el-icon>
                      </el-button>
                    </el-tooltip>-->
        </el-button-group>
      </div>
      <!-- 全屏模式切换 -->
      <div class="fullscreen-control">
        <el-tooltip :content="isFullscreen ? '退出全屏' : '全屏模式'" placement="top">
          <el-button @click="toggleFullscreen">
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 甘特图容器 -->
    <div ref="ganttRef" class="gantt-container"></div>
  </div>
</template>

<script setup lang="ts">
import gantt from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import { ZoomIn, ZoomOut, Refresh, FullScreen, Expand, Close } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

// 扩展 dayjs 插件
dayjs.extend(minMax);

// ==================== Props 定义 ====================
const props = defineProps({
  tasks: {
    type: Object,
    default: () => ({ data: [], links: [] })
  },
  readonly: {
    type: Boolean,
    default: true
  },
  showLegend: {
    type: Boolean,
    default: true
  },
  legendText: {
    type: Object,
    default: () => ({
      plan: '计划时间',
      actual: '实际时间'
    })
  },
  columns: {
    type: Array,
    default: () => [
      // 左侧表格列配置
      { name: 'id', label: '工单号', tree: true, width: '260', resize: true },
      {
        name: 'salesOrderNo',
        label: '销售订单',
        align: 'center',
        resize: true,
        width: 160,
        template(task: any) {
          if (task.salesOrderNo && task.salesOrderItem) {
            return task.salesOrderNo + '-' + Number(task.salesOrderItem);
          } else {
            return '-';
          }
        }
      },
      { name: 'text', label: '产品描述', align: 'left', width: 120, resize: true },
      { name: 'workCenter', label: '工作中心', align: 'center', width: 80, resize: true },
      { name: 'start_date', label: '计划开始时间', align: 'center', width: 120, resize: true },
      { name: 'end_date', label: '计划结束时间', align: 'center', width: 120, resize: true }
    ]
  }
});

// ==================== Emits 定义 ====================
const emit = defineEmits(['ready', 'task-click', 'task-dblclick']);

// ==================== 响应式状态 ====================
const ganttRef = ref(null);
const currentView = ref('weeks'); // 默认使用 weeks 视图（对应 zoomConfig）
const zoomLevel = ref(2); // 默认缩放级别（从0开始，对应 weeks）
const isFullscreen = ref(false); // 全屏状态
const allExpanded = ref(true); // 记录是否全部展开
const showGridLines = ref(false); // 控制网格线显示/隐藏
let isInitialized = false;
let updateTimer = null;
let renderTimer = null;
let originalOverflow = ''; // 保存原始overflow样式
const cachedZoomSettings: any = {}; // 缓存缩放设置

// ==================== 统一的缩放配置（替代原来的 viewConfigs）====================
// 使用 dhtmlx-gantt 的 Zoom Extension API，提供6个预定义的视图级别
const zoomConfig = {
  levels: [
    {
      name: 'hours', // 小时视图 - 适合查看当天详细安排
      scales: [
        { unit: 'day', step: 1, format: '%Y年%m月%d日 (%D)' },
        { unit: 'hour', step: 1, format: '%H:00' },
        {
          unit: 'minute',
          step: 10,
          format: '%H:%i'
        }
      ],
      round_dnd_dates: true,
      min_column_width: 80,
      scale_height: 60
    },
    {
      name: 'days', // 天视图 - 适合查看周内每日计划
      scales: [
        { unit: 'month', step: 1, format: '%Y年%m月' },
        {
          unit: 'day',
          step: 1,
          format: '%d日 (%D)',
          css: (date) => {
            if (date.getDay() === 0 || date.getDay() === 6) return 'weekend';
            return '';
          }
        },
        {
          unit: 'hour',
          step: 1,
          format: '%H:%i'
        }
      ],
      round_dnd_dates: true,
      min_column_width: 60,
      scale_height: 60
    },
    {
      name: 'weeks', // 周视图（默认）- 适合查看月度工单安排
      scales: [
        {
          unit: 'week',
          step: 1,
          format: (date) => {
            const startDate = date;
            const endDate = gantt.date.add(gantt.date.add(date, 1, 'week'), -1, 'day');
            const dateToStr = gantt.date.date_to_str('%Y-%m-%d');
            const startStr = dateToStr(startDate);
            const endStr = dateToStr(endDate);
            return startStr + ' - ' + endStr;
          }
        },
        {
          unit: 'day',
          step: 1,
          format: '%Y-%m-%d (%D)',
          css: (date) => {
            if (date.getDay() === 0 || date.getDay() === 6) return 'weekend';
            return '';
          }
        },
        {
          unit: 'hour',
          step: 4,
          format: '%H:%i'
        }
      ],
      round_dnd_dates: false,
      min_column_width: 50,
      scale_height: 70
    },
    {
      name: 'months', // 月视图 - 适合查看季度规划
      scales: [
        { unit: 'year', step: 1, format: '%Y年' },
        { unit: 'month', step: 1, format: '%m月' },
        {
          unit: 'day',
          step: 1,
          format: '%d (%D)',
          css: (date) => {
            if (date.getDay() === 0 || date.getDay() === 6) return 'weekend';
            return '';
          }
        }
      ],
      round_dnd_dates: false,
      min_column_width: 80,
      scale_height: 60
    },
    {
      name: 'quarters', // 季度视图 - 适合查看年度计划
      scales: [
        { unit: 'year', step: 1, format: '%Y年' },
        {
          unit: 'quarter',
          step: 1,
          format: (date) => {
            const month = date.getMonth();
            let q_num;

            if (month >= 9) {
              q_num = 4;
            } else if (month >= 6) {
              q_num = 3;
            } else if (month >= 3) {
              q_num = 2;
            } else {
              q_num = 1;
            }

            return 'Q' + q_num;
          }
        },
        { unit: 'month', step: 1, format: '%m月' }
      ],
      round_dnd_dates: false,
      min_column_width: 70,
      scale_height: 70
    },
    {
      name: 'years', // 年视图 - 适合长期战略规划
      scales: [
        {
          unit: 'year',
          step: 1,
          format: '%Y年'
        },
        {
          unit: 'year',
          step: 5,
          format: (date) => {
            const dateToStr = gantt.date.date_to_str('%Y');
            const endDate = gantt.date.add(gantt.date.add(date, 5, 'year'), -1, 'day');
            return dateToStr(date) + ' ~ ' + dateToStr(endDate);
          }
        }
      ],
      round_dnd_dates: false,
      min_column_width: 100,
      scale_height: 60
    }
  ]
};

// 视图映射（用于按钮显示和快速切换）
const viewMapping = {
  hours: { label: '小时视图', level: 0 },
  days: { label: '天视图', level: 1 },
  weeks: { label: '周视图', level: 2 },
  months: { label: '月视图', level: 3 },
  quarters: { label: '季度视图', level: 4 },
  years: { label: '年视图', level: 5 }
};

// ==================== 视图切换功能 ====================
// 切换视图
const switchView = (viewName: string) => {
  if (!isInitialized || !gantt || !gantt.ext || !gantt.ext.zoom) return;

  const viewInfo = viewMapping[viewName];
  if (!viewInfo) {
    console.warn(`Unknown view: ${viewName}`);
    return;
  }

  currentView.value = viewName;
  zoomLevel.value = viewInfo.level;

  try {
    gantt.ext.zoom.setLevel(viewName);
    gantt.render();

    // 重新添加今天标记线
    addTodayLine();
  } catch (error) {
    console.error('Switch view failed:', error);
  }
};

// ==================== 缩放功能 ====================
// 初始化缩放配置（在 gantt.init() 之后调用）
const initZoomConfig = () => {
  if (!gantt || !gantt.ext || !gantt.ext.zoom) {
    console.warn('Zoom extension not available');
    return;
  }

  try {
    gantt.ext.zoom.init(zoomConfig);

    // 设置初始缩放级别
    gantt.ext.zoom.setLevel(zoomConfig.levels[zoomLevel.value].name);
  } catch (error) {
    console.error('Failed to initialize zoom config:', error);
  }
};

// 放大 - 切换到更详细的视图
const zoomIn = () => {
  if (!isInitialized || !gantt || !gantt.ext || !gantt.ext.zoom) return;

  const maxLevel = zoomConfig.levels.length - 1;

  if (zoomLevel.value < maxLevel) {
    zoomLevel.value++;
    const levelName = zoomConfig.levels[zoomLevel.value].name;

    gantt.ext.zoom.setLevel(levelName);
    gantt.render();

    // 重新添加今天标记线
    addTodayLine();
  }
};

// 缩小 - 切换到更宏观的视图
const zoomOut = () => {
  if (!isInitialized || !gantt || !gantt.ext || !gantt.ext.zoom) return;

  if (zoomLevel.value > 0) {
    zoomLevel.value--;
    const levelName = zoomConfig.levels[zoomLevel.value].name;

    gantt.ext.zoom.setLevel(levelName);
    gantt.render();

    // 重新添加今天标记线
    addTodayLine();
  }
};

// 重置缩放到默认级别（周视图）
const resetZoom = () => {
  if (!isInitialized || !gantt || !gantt.ext || !gantt.ext.zoom) return;

  zoomLevel.value = 2; // 默认 weeks 级别
  currentView.value = 'weeks';
  const levelName = zoomConfig.levels[zoomLevel.value].name;

  gantt.ext.zoom.setLevel(levelName);
  gantt.render();

  // 重新添加今天标记线
  addTodayLine();
};

// 获取缩放级别的显示名称
const getLevelDisplayName = (levelIndex: number): string => {
  const names = {
    0: '小时视图',
    1: '天视图',
    2: '周视图',
    3: '月视图',
    4: '季度视图',
    5: '年视图'
  };
  return names[levelIndex] || '未知视图';
};

// 自动适应视图（根据数据范围自动选择最佳缩放级别）
const zoomToFit = () => {
  if (!isInitialized || !gantt) return;

  try {
    const project = gantt.getSubtaskDates();
    const areaWidth = gantt.$task.offsetWidth;
    const scaleConfigs = zoomConfig.levels;

    let bestLevel = 0;

    for (let i = 0; i < scaleConfigs.length; i++) {
      bestLevel = i;
      const level = scaleConfigs[i].scales;
      const lowestScale = level[level.length - 1];
      const columnCount = getUnitsBetween(project.start_date, project.end_date, lowestScale.unit, lowestScale.step || 1);

      if ((columnCount + 2) * gantt.config.min_column_width <= areaWidth) {
        break;
      }
    }

    if (bestLevel >= scaleConfigs.length) {
      bestLevel = scaleConfigs.length - 1;
    }

    zoomLevel.value = bestLevel;
    const levelName = scaleConfigs[bestLevel].name;

    gantt.ext.zoom.setLevel(levelName);
    gantt.render();

    addTodayLine();
  } catch (error) {
    console.error('Auto zoom failed:', error);
  }
};

// ==================== 网格线显示切换功能 ====================
const handleGridLineChange = (value: boolean) => {
  if (!isInitialized || !gantt) {
    return;
  }
  try {
    // 更新静态背景配置
    gantt.config.static_background = !value;
    gantt.config.static_background_cells = !value;

    // 重新渲染甘特图以应用更改
    gantt.render();
  } catch (error) {
    console.error('Toggle grid lines failed:', error);
  }
};

// 计算两个日期之间的单位数量
const getUnitsBetween = (from: Date, to: Date, unit: string, step: number): number => {
  let start = new Date(from);
  const end = new Date(to);
  let units = 0;
  while (start.valueOf() < end.valueOf()) {
    units++;
    start = gantt.date.add(start, step, unit);
  }
  return units;
};

// ==================== 树节点展开/折叠功能 ====================
const expandAllTasks = () => {
  if (!isInitialized || !gantt) {
    return;
  }

  try {
    // 使用 eachTask 遍历所有任务，设置 $open 属性
    gantt.eachTask((task: any) => {
      task.$open = true;
    });

    // 统一渲染，性能更好
    gantt.render();

    allExpanded.value = true;
  } catch (error) {
    console.error('展开所有节点失败:', error);
  }
};

const collapseAllTasks = () => {
  if (!isInitialized || !gantt) {
    ElMessage.warning('甘特图未初始化');
    return;
  }

  try {
    // 使用 eachTask 遍历所有任务，设置 $open 属性
    gantt.eachTask((task: any) => {
      task.$open = false;
    });

    // 统一渲染，性能更好
    gantt.render();

    allExpanded.value = false;
  } catch (error) {
    console.error('折叠所有节点失败:', error);
  }
};

// Switch 组件变化处理函数
const handleTreeExpandChange = (value: boolean) => {
  if (value) {
    expandAllTasks();
  } else {
    collapseAllTasks();
  }
};
// ==================== 全屏模式功能 ====================
// 切换全屏模式
const toggleFullscreen = () => {
  if (!isInitialized) {
    ElMessage.warning('甘特图未初始化');
    return;
  }

  try {
    // 使用浏览器的原生 Fullscreen API
    if (!document.fullscreenElement) {
      // 进入全屏
      const element = ganttRef.value;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        (element as any).webkitRequestFullscreen();
      } else if ((element as any).msRequestFullscreen) {
        (element as any).msRequestFullscreen();
      }
    } else {
      // 退出全屏
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  } catch (error) {
    console.error('全屏模式切换失败:', error);
  }
};

// 监听全屏状态变化
const handleFullscreenChange = () => {
  const fullscreenElement = document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).msFullscreenElement;

  if (fullscreenElement === ganttRef.value) {
    isFullscreen.value = true;
    console.log('浏览器原生全屏已激活');
  } else {
    isFullscreen.value = false;
    console.log('浏览器原生全屏已退出');
  }
};

// ==================== 时间计算工具函数 ====================
// 计算时间差异
const dateTimeDifference = (plan: any, actual: any) => {
  if (!plan || !actual) return null;

  const planStart = dayjs(plan.start_date);
  const planEnd = dayjs(plan.end_date);
  const actualStart = dayjs(actual.actual_start);
  const actualEnd = dayjs(actual.actual_end);

  const formatDuration = (totalSeconds: any) => {
    if (totalSeconds < 0) {
      totalSeconds = Math.abs(totalSeconds);
    }

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    let result = '';
    if (days > 0) {
      result += days + '天';
    }
    if (hours > 0) {
      result += hours + '小时';
    }
    if (minutes > 0) {
      result += minutes + '分钟';
    }
    if (seconds > 0 || result === '') {
      result += seconds + '秒';
    }

    return result;
  };

  return {
    startDelay: actualStart.diff(planStart, 'second'),
    endDelay: actualEnd.diff(planEnd, 'second'),
    planDuration: formatDuration(planEnd.diff(planStart, 'second')),
    actualDuration: formatDuration(actualEnd.diff(actualStart, 'second'))
  };
};

// 格式化日期
const formatDate = (date) => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

// ==================== 自定义渲染函数 ====================
// 渲染时间段条（用于显示计划和实际时间）
const handleTimePeriodRender = (seg, task, opt = {}) => {
  const startDate = dayjs(seg.start_date).toDate();
  const endDate = dayjs(seg.end_date).toDate();

  const left = gantt.posFromDate(startDate);
  const right = gantt.posFromDate(endDate);

  // 最小宽度保护
  const width = Math.max(6, right - left);

  // 计算相对于任务条左侧的位置（允许负数，用于超出计划范围）
  const taskStart = dayjs(task.start_date).toDate();
  const taskLeft = gantt.posFromDate(taskStart);

  // 允许负数，让实际条可以向左溢出
  const relativeLeft = left - taskLeft;

  const color = opt.color || '#999';
  const height = opt.height || 8;
  const offsetY = opt.offsetY || 0;
  const zIndex = opt.zIndex || 3;

  return `<div class="gantt-time-bar"
               style="position:absolute;
                      left:${relativeLeft}px;
                      width:${width}px;
                      top:${offsetY}px;
                      height:${height}px;
                      background:${color};
                      border-radius:3px;
                      box-shadow:0 0 3px rgba(0,0,0,0.15);
                      z-index:${zIndex};
                      pointer-events:auto;"
               data-start="${seg.start_date}"
               data-end="${seg.end_date}"
               data-type="${opt.type || 'default'}">
        </div>`;
};

// 自定义任务文本显示
const customTaskText = (start: any, end: any, task: any) => {
  // 使用actual_start/actual_end字段
  if (task.actual_start && task.actual_end) {
    // 容器必须允许内容溢出
    let html = `<div style="position:relative;height:30px;min-width:100%;overflow:visible!important;pointer-events:none;">`;

    // 计划时间条
    html += handleTimePeriodRender({ start_date: task.start_date, end_date: task.end_date }, task, {
      color: '#409EFF',
      offsetY: 2,
      height: 8,
      type: 'plan'
    });

    // 实际时间条（允许超出计划范围）
    html += handleTimePeriodRender({ start_date: task.actual_start, end_date: task.actual_end }, task, {
      color: '#67C23A',
      offsetY: 14,
      height: 8,
      type: 'actual'
    });

    html += `</div>`;
    return html;
  }

  // 默认显示
  const progress = task.progress ? Math.round(task.progress * 100) + '%' : '';
  if (task.type === 'project') {
    return `<span>工单号:${task.workOrderNo} </span> ${task.text} <span>${progress}</span>`;
  } else {
    return `<span>${task.text}</span>`;
  }
};

// 自定义悬浮提示
const customTooltipText = (start: any, end: any, task: any) => {
  const formatDateStr = (date: any) => dayjs(date).format('YYYY-MM-DD HH:mm:ss');

  // 项目节点
  if (task.type === 'project') {
    const progress = task.progress ? Math.round(task.progress * 100) : 0;
    return `
      <div class="tip-container">
        <div><b>${task.text}</b></div>
        <hr class="tip-item" />
        <div class="fix-width"><span>工单号:</span> ${task.workOrderNo || '-'}</div>
        <div class="fix-width"><span>计划时间:</span> ${formatDateStr(task.start_date)} ~ ${formatDateStr(task.end_date)}</div>
        <div class="fix-width"><span>计划数量:</span> ${task.planQuantity}</div>
        <div class="fix-width"><span>交货数量:</span> ${task.planQuantity}</div>
        <div class="fix-width"><span>工单进度:</span> ${progress}%</div>
      </div>`;
  }

  // 格式化状态详情
  const formatStatusDetail = (task: any) => {
    if (!task.finalStatusDetail && !task.finalStatusDesc) return '';

    const statusDotClass =
      {
        0: 'success',
        1: 'warning',
        2: 'danger'
      }[task.finalStatus] || 'default';

    const items = task.finalStatusDetail
      ? task.finalStatusDetail
          .split('|')
          .map((item: string) => item.trim())
          .filter(Boolean)
      : [];

    return `<div class="status-with-detail">
        ${
          items.length > 0
            ? `<div class="ganttx-status-detail-content ${statusDotClass}">
                ${items.map((item: string) => `<div>${item}</div>`).join('')}
              </div>`
            : ''
        }
      </div>`;
  };
  if (task.actual_start && !task.actual_end) {
    task.actual_end = task.currentDate;
  }
  // 使用actual_start/actual_end字段
  if (task.actual_start && task.actual_end) {
    const plan = {
      start_date: task.start_date,
      end_date: task.end_date
    };
    const actual = {
      actual_start: task.actual_start,
      actual_end: task.actual_end
    };

    const diff = dateTimeDifference(plan, actual);

    const formatDelay = (totalSeconds: any, label: any) => {
      if (totalSeconds === 0) return `<span style="color:#67c23a">${label}: 准时</span>`;

      const late = totalSeconds > 0;
      const absSeconds = Math.abs(totalSeconds);

      const days = Math.floor(absSeconds / 86400);
      const hours = Math.floor((absSeconds % 86400) / 3600);
      const minutes = Math.floor((absSeconds % 3600) / 60);
      const seconds = Math.floor(absSeconds % 60);

      let val = '';
      if (days > 0) {
        val += days + '天';
      }
      if (hours > 0) {
        val += hours + '小时';
      }
      if (minutes > 0) {
        val += minutes + '分钟';
      }
      if (seconds > 0 || val === '') {
        val += seconds + '秒';
      }
      // 如果是结束时间且是提前状态，需要判断完成数量是否等于计划数量
      if (!late && label === '结束时间') {
        const planQty = task.planQuantity ? parseFloat(task.planQuantity) : 0;
        const completeQty = task.mesCompleteQuantity ? parseFloat(task.mesCompleteQuantity) : 0;

        // 如果完成数量小于计划数量，且结束时间在计划完成时间之前显示生产中
        if (task.actual_start && completeQty < planQty) {
          return `<span style="color:#67c23a">${label}: 生产中</span>`;
        }
      }
      const color = late ? '#ff5c5c' : '#409eff';
      const sign = late ? '延迟' : '提前';
      return `<span style="color:${color}">${label}${sign}:</span> <div style="color:${color}">${val}</div>`;
    };

    return `
        <div class="tip-container">
          <div style="margin-bottom:8px; font-weight:500;">${task.text}</div>
          <hr class="tip-item" />
          <div class="fix-width"><span>工单号:</span><div>${task.id || task.workOrderNo || '-'}</div> </div>
          <div class="fix-width"><span>物料编码:</span><div>${task.material || '-'}</div></div>
          <div class="fix-width"><span>物料描述:</span><div>${task.materialDesc || '-'}</div></div>
          <div class="fix-width"><span>工作中心:</span><div>${task.workCenter || '-'}</div></div>
          <div class="grid-four">
            <span>计划数量:</span>
            <div>${task.planQuantity ? parseFloat(task.planQuantity) : ''}</div>
            <span>完成数量:</span>
            <div>${task.mesCompleteQuantity ? parseFloat(task.mesCompleteQuantity) : ''}</div>
          </div>


          <hr class="tip-item" />
          <div class="fix-width"><span>计划时间:</span><div>${formatDateStr(plan.start_date)} ~ ${formatDateStr(plan.end_date)}</div></div>
          <div class="fix-width"><span>实际时间:</span><div>${formatDateStr(actual.actual_start)} ~ ${Number(task.mesCompleteQuantity) >= Number(task.planQuantity) ? formatDateStr(actual.actual_end) : ''}</div></div>
          <div class="fix-width"><span>计 划 D T D :</span><div>${task.plannedD2DDurationDesc}</div></div>
          <div class="fix-width"><span>实 际 D T D :</span><div>${task.actualD2DDurationDesc}</div></div>
          <div class="fix-width"><span>状态详情:</span><div>${formatStatusDetail(task)}</div></div>

          <hr class="tip-item" />
           <div class="grid-four">
            <span>客户订单:</span>
            <div>${task.salesOrderNo || ''}-${task.salesOrderItem ? Number(task.salesOrderItem) : ''}</div>
            <span>客户交期:</span>
            <div>${task.soDeliveryDate || '-'}</div>
          </div>

          <hr class="tip-item" />
          <div class="grid-four">
            <span>前一制程:</span>
            <span>${task.previousWorkOrderNo || ''}-${task.previousProcessNo ? Number(task.previousProcessNo) : ''} ${task.previousWorkCenter || ''}</span>
            <span class="time-label">完工时间:</span>
            <span class="time-value">${task.previousActualEndDate || '-'}</span>
          </div>
          <div class="grid-four">
            <span>下一制程:</span>
            <span>${task.nextWorkOrderNo || ''}-${task.nextProcessNo ? Number(task.nextProcessNo) : ''} ${task.nextWorkCenter || ''}</span>
            <span class="time-label">预计开工:</span>
            <span class="time-value">${task.nextPlannedStartDate || '-'}</span>
          </div>
        </div>
        `;
  }

  // 只有计划时间
  return `<div class="tip-container">
            <div><span>${task.text}</span></div>
            <hr class="tip-item" />
            <div class="fix-width"><span class="text">工单号:</span> ${task.id || '-'}</div>
            ${task.process ? `<div class="fix-width"><span>工单工序:</span> ${task.process}</div>` : ''}
            <div class="fix-width"><span>工作中心:</span> ${task.workCenter || '-'}</div>
            <div class="fix-width"><span>工单数量:</span> ${task.planQuantity || '-'}</div>
            <hr class="tip-item" />
            <div class="fix-width"><span>计划时间:</span> ${formatDateStr(task.start_date)} ~ ${formatDateStr(task.end_date)}</div>
            <div class="fix-width"><span>实际状态:</span> 未开始</div>
            <div class="fix-width">${formatStatusDetail(task)}</div>
          </div>`;
};

// 添加今天标记线
const addTodayLine = () => {
  if (!isInitialized) return;

  try {
    // 先检查是否已存在今天的标记线
    const existingMarkers = gantt.config.markers || [];
    const todayMarkerExists = existingMarkers.some((marker) => marker.id === 'today-line');

    // 如果已存在，先删除
    if (todayMarkerExists) {
      gantt.deleteMarker('today-line');
    }

    const date_to_str = gantt.date.date_to_str(gantt.config.task_date);
    const today = new Date();

    // 添加新的标记线，指定唯一ID
    gantt.addMarker({
      id: 'today-line',
      start_date: today,
      css: 'today',
      text: '今天',
      title: '今天: ' + date_to_str(today)
    });
  } catch (error) {
    console.warn('添加今天标记线失败:', error);
  }
};

// ==================== 甘特图初始化配置 ====================
const initConfig = () => {
  // ==================== 国际化设置 ====================
  gantt.i18n.setLocale('cn');

  // ==================== 插件加载 ====================
  // 必须在 init() 之前加载所有需要的插件
  gantt.plugins({
    tooltip: true, // 启用悬浮提示功能
    marker: true, // 启用标记线功能（如今天线）
    multitask: true, // 启用多段任务功能（支持同一任务显示多个时间段）
    export_api: true, // 导出功能
    drag_timeline: true, //拖动时间线
    // keyboard_navigation: true, // 键盘导航
    fullscreen: true, // 全屏模式
    columns_resizable: true // 列宽可调整
  });

  // ==================== 基础显示配置 ====================
  gantt.config.readonly = props.readonly; // 设置为只读模式，禁止编辑
  gantt.config.show_grid = true; // 显示左侧表格区域
  gantt.config.sort = true; // 允许表格列排序
  gantt.config.open_tree_initially = true; // 初始展开所有树节点

  // ==================== 尺寸配置 ====================
  gantt.config.scale_height = 50; // 时间轴刻度区域高度（像素）
  gantt.config.bar_height = 26; // 任务条高度（像素）
  gantt.config.row_height = 32; // 表格行高（像素）
  gantt.config.grid_width = 500; // 左侧表格初始宽度（像素）
  gantt.config.max_task_height = 26; // 任务条最大高度限制
  gantt.config.autosize_grid = false; // 禁用网格自动调整大小

  // ==================== 表格列配置 ====================
  gantt.config.autofit = false; // 禁用自动调整列宽，使用手动控制
  gantt.config.grid_elastic_columns = false; // 禁用弹性列宽
  gantt.config.autosize_columns = false; // 禁用自动计算列宽，使用固定宽度
  gantt.config.drag_column_width = true; // 允许拖动调整列宽
  gantt.config.columns = props.columns; // 使用传入的列配置

  // ==================== 键盘导航配置 ====================
  gantt.config.keyboard_navigation = true; // 启用键盘导航
  gantt.config.keyboard_navigation_cells = true; // 允许在表格单元格间导航
  gantt.config.multiselect = true; // 允许多选（配合键盘使用）
  gantt.config.touch_drag = false; // 禁用触摸拖拽（避免与键盘冲突）

  // ==================== 全屏模式事件监听 ====================
  gantt.attachEvent('onBeforeExpand', () => {
    return true;
  });

  gantt.attachEvent('onBeforeCollapse', () => {
    return true;
  });

  gantt.attachEvent('onExpand', () => {
    isFullscreen.value = true;

    // 隐藏父级容器的滚动条和溢出
    const parentContainers = document.querySelectorAll('.app-main, .main-container, .el-main');
    parentContainers.forEach((container) => {
      originalOverflow = (container as HTMLElement).style.overflow;
      (container as HTMLElement).style.overflow = 'hidden';
    });
  });

  gantt.attachEvent('onCollapse', () => {
    isFullscreen.value = false;

    // 恢复父级容器的原始样式
    const parentContainers = document.querySelectorAll('.app-main, .main-container, .el-main');
    parentContainers.forEach((container) => {
      (container as HTMLElement).style.overflow = originalOverflow;
    });
  });

  // ==================== 日期格式配置 ====================
  gantt.config.xml_date = '%Y-%m-%d %H:%i:%s'; // 日期解析格式

  // ==================== 交互行为配置 ====================
  // 禁用所有拖拽操作（只读模式下的额外保护）
  gantt.config.drag_progress = false; // 禁止拖拽进度条
  gantt.config.drag_move = false; // 禁止拖拽移动任务
  gantt.config.drag_links = false; // 禁止拖拽创建关联
  gantt.config.drag_resize = false; // 禁止拖拽调整大小
  gantt.config.details_on_create = false; // 创建任务时不弹出详情框
  gantt.config.details_on_dblclick = false; // 双击不弹出详情框

  // ==================== 渲染优化配置 ====================
  gantt.config.auto_types = false; // 禁用自动任务类型转换（保持手动指定的类型）
  gantt.config.fit_tasks = true; // 自动扩展时间轴范围以显示所有任务
  gantt.config.preserve_scroll = true; // 数据更新时保持滚动位置不变
  gantt.config.show_task_cells = true; // 显示任务单元格网格线

  gantt.config.task_content_overflow = 'visible'; // 保留：允许内容溢出
  gantt.config.smart_rendering = false; // 关闭智能渲染（避免自定义时间条被裁剪，确保完整显示）
  gantt.config.dynamic_loading = false; // 禁用动态加载（渲染所有任务，确保自定义时间条完整显示）
  gantt.config.render_mode = 'div'; // 使用div模式
  gantt.config.static_background = true; // 启用静态背景渲染(提升滚动性能)
  gantt.config.static_background_cells = true; // 启用静态背景单元格

  // ==================== 布局配置 ====================
  gantt.config.fix_grid_header = true; // 固定表头，滚动时表头保持可见

  // ==================== 启用表格列宽拖动 ====================
  gantt.config.grid_resize = true; // 允许调整表格列宽
  gantt.config.drag_column_width = true; // 允许拖动列宽
  gantt.config.resize_table_rows = true; // 允许拖动行高

  // 列宽拖动手柄优化（让调整手柄位置更符合用户预期）
  gantt.attachEvent('onColumnResizeStart', (ind, column) => {
    // ind: 当前列的索引
    // column: 当前列的配置对象

    // 1. 只对非树形列且不是第一列的情况生效
    if (!column.tree || ind == 0) return;

    setTimeout(() => {
      // 2. 获取调整手柄元素
      const marker = document.querySelector('.gantt_grid_resize_area');
      if (!marker) return;

      // 3. 获取所有列配置
      const cols = gantt.getGridColumns();

      // 4. 计算前一列的宽度
      const delta = cols[ind - 1].width || 0;
      if (!delta) return;

      // 5. 调整手柄位置和样式
      marker.style.boxSizing = 'content-box'; // 使用 content-box 盒模型
      marker.style.marginLeft = -delta + 'px'; // 向左偏移前一列的宽度
      marker.style.paddingRight = delta + 'px'; // 右侧增加内边距补偿
    }, 1);
  });

  // ==================== 布局配置 ====================
  // 自定义左右分栏布局：左侧表格 + 右侧时间轴，各自独立横向滚动
  gantt.config.layout = {
    css: 'gantt_container',
    cols: [
      {
        width: 860,
        min_width: 300,
        rows: [
          { view: 'grid', scrollX: 'gridScroll', scrollable: true, scrollY: 'scrollVer' },
          { view: 'scrollbar', id: 'gridScroll', group: 'horizontalScrolls' }
        ]
      },
      { resizer: true, width: 1 },
      {
        rows: [
          { view: 'timeline', scrollX: 'scrollHor', scrollY: 'scrollVer' },
          { view: 'scrollbar', id: 'scrollHor', group: 'horizontalScrolls' }
        ]
      },
      { view: 'scrollbar', id: 'scrollVer' }
    ]
  };

  // ==================== 多段任务配置 ====================
  // 启用多段任务功能，允许同一任务显示多个时间段（计划/实际）
  gantt.config.multitask = true; // 开启多段任务支持
  gantt.config.multitask_branch = false; // 不在分支级别显示多段

  // 使用 zoomConfig 的默认 scales（weeks 级别）
  gantt.config.scales = zoomConfig.levels[2].scales;

  // ==================== 模板配置 ====================
  // 树形图标模板：根据任务类型和状态显示不同图标
  gantt.templates.grid_folder = (task: any) => {
    let cls = 'gantt_icon ';

    if (task.process && task.process.trim()) {
      // 工序节点：根据状态显示不同颜色图标
      switch (task.finalStatus) {
        case 0:
          cls += 'process_icon_done'; // 绿色
          break;
        case 1:
          cls += 'process_icon_pause'; //  橙色
          break;
        case 2:
          cls += 'process_icon_error'; // 红色
          break;
        default:
          cls += 'process_icon_wait'; // 灰色
      }
    } else {
      // 工单节点：根据状态显示不同颜色图标
      switch (task.finalStatus) {
        case 0:
          cls += 'order_icon_done'; // 绿色
          break;
        case 1:
          cls += 'order_icon_pause'; //橙色
          break;
        case 2:
          cls += 'order_icon_error'; // 红色
          break;
        default:
          cls += 'order_icon_wait'; // 灰色
      }
    }

    return `<div class="${cls}"></div>`;
  };

  // 文件图标模板：复用文件夹图标逻辑
  gantt.templates.grid_file = (task: any) => {
    return gantt.templates.grid_folder(task);
  };

  // 任务条样式模板：为有时间段的任务设置透明背景
  gantt.templates.task_class = (start: any, end: any, task: any) => {
    // 如果任务有 timeList 或 actual_start/end，使用自定义渲染，任务条设为透明
    if ((task.timeList && task.timeList.length) || (task.actual_start && task.actual_end)) {
      return 'transparent-bar';
    }
    return '';
  };

  // 任务文本模板：自定义任务条上的显示内容
  gantt.templates.task_text = customTaskText;

  // 悬浮提示模板：自定义鼠标悬停时的提示信息
  // gantt.templates.tooltip_text = customTooltipText;
  gantt.attachEvent('onGanttReady', function () {
    console.log('✅ Gantt 准备完成，设置 tooltip');
    gantt.templates.tooltip_text = customTooltipText;
  });
  // 周末高亮模板：在时间轴上标记周末
  gantt.templates.scale_cell_class = (date) => {
    const day = date.getDay();
    if (day === 0 || day === 6) {
      // 0是周日，6是周六
      return 'weekend';
    }
  };
};

// ==================== 数据处理函数 ====================
// 递归构建数据（将后端数据转换为甘特图所需格式）
const formatData = (treeList) => {
  if (!treeList || !Array.isArray(treeList)) return [];

  const result = [];

  treeList.forEach((item) => {
    // 判断是否有子任务结构
    if (item.child && item.child.length > 0) {
      // 父节点（工单级别）
      const allTimes = item.child.flatMap((t) => {
        const times = [];
        if (t.plannedStartDate) times.push(t.plannedStartDate);
        if (t.plannedEndDate) times.push(t.plannedEndDate);
        if (t.actualStartDate) times.push(t.actualStartDate);
        if (t.actual_end) times.push(t.actual_end);
        return times;
      });

      if (allTimes.length > 0) {
        const validTimes = allTimes.filter((t) => t);
        if (validTimes.length > 0) {
          const start = dayjs.min(...validTimes.map((d) => dayjs(d))).format('YYYY-MM-DD HH:mm:ss');
          const end = dayjs.max(...validTimes.map((d) => dayjs(d))).format('YYYY-MM-DD HH:mm:ss');

          result.push({
            ...item,
            id: item.id,
            text: item.text || item.projectName,
            salesOrderNo: item.salesOrderNo,
            salesOrderItem: item.salesOrderItem,
            workOrderNo: item.workOrderNo,
            start_date: start,
            end_date: end,
            parent: item.parent || 0,
            open: true,
            type: 'project',
            progress: item.progress || 0,
            workCenter: item.workCenter,
            process: item.process,
            planQuantity: item.planQuantity
          });
        }
      }

      // 子任务
      item.child.forEach((task) => {
        result.push({
          ...task,
          id: task.id,
          text: task.text,
          type: task.type || 'task',
          salesOrderNo: item.salesOrderNo,
          salesOrderItem: item.salesOrderItem,
          workOrderNo: item.workOrderNo,
          duration: task.duration,
          progress: task.progress,
          workCenter: task.workCenter,
          product: task.product,
          planQuantity: task.planQuantity,
          color: task.color,
          process: task.process,
          parent: task.parent || item.id,
          timeList: task.timeList,
          start_date: task.plannedStartDate,
          end_date: task.plannedEndDate,
          actual_start: task.actualStartDate,
          actual_end: task.actualEndDate
        });
      });
    } else {
      // 扁平结构,直接添加
      result.push({
        ...item,
        id: item.id,
        text: item.text,
        type: item.type || 'task',
        salesOrderNo: item.salesOrderNo,
        salesOrderItem: item.salesOrderItem,
        workOrderNo: item.workOrderNo,
        duration: item.duration,
        progress: item.progress,
        workCenter: item.workCenter,
        product: item.product,
        planQuantity: item.planQuantity,
        color: item.color,
        process: item.process,
        parent: item.parent || 0,
        timeList: item.timeList,
        start_date: item.plannedStartDate,
        end_date: item.plannedEndDate,
        actual_start: item.actualStartDate,
        actual_end: item.actualEndDate
      });
    }
  });

  // 按 parent 分组，然后在每组内排序：有 process 字段的优先
  const groupedByParent = {};
  result.forEach((item) => {
    const parentKey = item.parent || 0;
    if (!groupedByParent[parentKey]) {
      groupedByParent[parentKey] = [];
    }
    groupedByParent[parentKey].push(item);
  });

  // 对每个父级组内的任务进行排序
  const sortedResult = [];
  Object.keys(groupedByParent).forEach((parentKey) => {
    const group = groupedByParent[parentKey];
    // 排序规则：有 process 字段的排在前面
    const sortedGroup = group.sort((a, b) => {
      const aHasProcess = a.process && a.process.trim() ? 0 : 1;
      const bHasProcess = b.process && b.process.trim() ? 0 : 1;

      // 第一优先级：有 process 的优先
      if (aHasProcess !== bHasProcess) {
        return aHasProcess - bHasProcess;
      }

      // 第二优先级：如果都有或都没有 process，保持原有顺序
      return 0;
    });
    sortedResult.push(...sortedGroup);
  });

  return sortedResult;
};

// 提取时间范围计算为独立函数
const updateDateRange = (formattedData: any) => {
  if (!formattedData || formattedData.length === 0) return;

  let minDate = null;
  let maxDate = null;

  // 单次遍历同时计算最小和最大日期
  for (let i = 0; i < formattedData.length; i++) {
    const task = formattedData[i];

    if (task.start_date) {
      const start = dayjs(task.start_date);
      if (!minDate || start.isBefore(minDate)) minDate = start;
    }
    if (task.end_date) {
      const end = dayjs(task.end_date);
      if (!maxDate || end.isAfter(maxDate)) maxDate = end;
    }
    if (task.actual_start) {
      const actualStart = dayjs(task.actual_start);
      if (!minDate || actualStart.isBefore(minDate)) minDate = actualStart;
    }
    if (task.actual_end) {
      const actualEnd = dayjs(task.actual_end);
      if (!maxDate || actualEnd.isAfter(maxDate)) maxDate = actualEnd;
    }
  }

  if (minDate && maxDate) {
    // 扩展时间范围:前后各加7天
    const startDate = minDate.subtract(7, 'day').toDate();
    const endDate = maxDate.add(7, 'day').toDate();

    // 设置显示范围
    gantt.config.start_date = startDate;
    gantt.config.end_date = endDate;
  }
};

// 使用防抖的数据更新方法
const updateData = (newTasks) => {
  if (updateTimer) {
    clearTimeout(updateTimer);
  }

  updateTimer = setTimeout(() => {
    if (!isInitialized) {
      return;
    }

    try {
      const formattedData = formatData(newTasks.data || []);

      gantt.batchUpdate(() => {
        gantt.clearAll();
        gantt.parse({
          data: formattedData,
          links: newTasks.links || []
        });
      });

      // 重新计算时间范围
      updateDateRange(formattedData);

      // 添加今天标记线
      addTodayLine();

      // 重新渲染
      gantt.render();
    } catch (error) {
      console.error('Gantt update error:', error);
    }
  }, 150);
};

// 重新加载数据
const reload = () => {
  if (!isInitialized) return;

  const formattedData = formatData(props.tasks.data || []);

  gantt.batchUpdate(() => {
    gantt.clearAll();
    gantt.parse({
      data: formattedData,
      links: props.tasks.links || []
    });
  });

  // 时间范围计算
  updateDateRange(formattedData);

  // 确保添加今天标记线
  addTodayLine();

  // 重新渲染
  gantt.render();
};

// 软重置甘特图（不调用 destructor，避免内部状态损坏）
const softReset = () => {
  if (!isInitialized) return;

  try {
    // 1. 清除所有事件监听
    gantt.detachAllEvents();

    // 2. 清除所有标记线
    if (gantt.config.markers && gantt.config.markers.length > 0) {
      const markers = [...gantt.config.markers];
      markers.forEach((marker: any) => {
        try {
          gantt.deleteMarker(marker.id);
        } catch (e) {
          // 忽略删除标记线的错误
        }
      });
    }

    // 3. 清空数据
    gantt.clearAll();

    // 4. 重置配置（保留基础结构）
    gantt.config.start_date = null;
    gantt.config.end_date = null;

    console.log('Gantt soft reset completed');
  } catch (error) {
    console.warn('Gantt soft reset error:', error);
  }
};

// 滚动时间轴
const scrollTimeline = (offset: number) => {
  if (!isInitialized || !gantt) return;

  const timeline = gantt.$task_data;
  if (timeline) {
    timeline.scrollLeft += offset;
  }
};

// 滚动到开始
const scrollToStart = () => {
  if (!isInitialized || !gantt) return;

  const timeline = gantt.$task_data;
  if (timeline) {
    timeline.scrollLeft = 0;
  }
};

// 滚动到结束
const scrollToEnd = () => {
  if (!isInitialized || !gantt) return;

  const timeline = gantt.$task_data;
  if (timeline) {
    timeline.scrollLeft = timeline.scrollWidth;
  }
};

// 显示今天
const showToday = () => {
  if (!isInitialized || !gantt) return;

  try {
    const today = new Date();
    gantt.showDate(today);
  } catch (error) {
    console.error('Show today failed:', error);
  }
};

// ==================== 生命周期钩子 ====================
onMounted(async () => {
  await nextTick();

  if (!ganttRef.value) {
    return;
  }

  // 添加全屏状态变化监听器
  document.addEventListener('fullscreenchange', handleFullscreenChange);

  try {
    // 如果已经初始化过，先软重置
    if (isInitialized) {
      softReset();

      // 短暂等待确保清理完成
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // 重新初始化配置
    initConfig();

    // 等待容器渲染完成
    await nextTick();

    // 再次检查容器是否存在
    if (!ganttRef.value) {
      isInitialized = false;
      return;
    }

    // 如果是首次初始化，调用 init；否则直接加载数据
    if (!isInitialized) {
      gantt.init(ganttRef.value);
      isInitialized = true;

      // 初始化缩放配置（在 init 之后）
      initZoomConfig();
    }

    // 初始加载数据
    if (props.tasks && props.tasks.data && props.tasks.data.length > 0) {
      const formattedData = formatData(props.tasks.data);

      // 解析数据
      gantt.parse({
        data: formattedData,
        links: props.tasks.links || []
      });

      // 使用统一的时间范围计算
      updateDateRange(formattedData);

      // 数据加载后，确保今天可见
      renderTimer = setTimeout(() => {
        if (!isInitialized || !ganttRef.value) return;

        try {
          const today = dayjs();
          gantt.render();
          gantt.showDate(today.toDate());
        } catch (error) {}
      }, 100);
    }

    // 确保添加今天标记线
    addTodayLine();

    emit('ready', { gantt });
  } catch (error) {
    isInitialized = false;
  }
});

// 监听 tasks 变化
watch(
  () => props.tasks,
  (newTasks) => {
    if (isInitialized && newTasks) {
      updateData(newTasks);
    }
  },
  { deep: false }
);

// 监听 readonly 变化
watch(
  () => props.readonly,
  (newReadonly) => {
    if (isInitialized) {
      gantt.config.readonly = newReadonly;
      gantt.refreshData();
    }
  }
);

// 组件卸载前清理
onBeforeUnmount(() => {
  // 清除所有定时器
  if (updateTimer) {
    clearTimeout(updateTimer);
    updateTimer = null;
  }
  if (renderTimer) {
    clearTimeout(renderTimer);
    renderTimer = null;
  }

  // 移除全屏状态变化监听器
  document.removeEventListener('fullscreenchange', handleFullscreenChange);

  // 软重置而不是 destructor
  softReset();
  isInitialized = false;
});

// 暴露方法给父组件
defineExpose({
  reload,
  updateData
});
</script>

<style lang="scss" scoped>
// ==================== 组件容器样式 ====================
.gantt-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  // 全屏模式下的样式
  &.fullscreen-mode {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 99999 !important;
    background: #ffffff;

    .legend-container {
      background: rgba(245, 247, 250, 0.95);
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
}

// ==================== 图例容器样式 ====================
.legend-container {
  display: flex;
  gap: 20px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
  flex-shrink: 0;
  align-items: center;
}

.legend-item {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: #606266;
}

.color-block {
  width: 28px;
  height: 14px;
  border-radius: 2px;
}

.color-block.primary {
  background-color: #409eff;
}

.color-block.success {
  background-color: #67c23a;
}

// ==================== 甘特图容器样式 ====================
.gantt-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

// ==================== 甘特图深层样式（使用 :deep() 穿透）====================

// 确保甘特图容器正确显示
:deep(.gantt_container) {
  border: none !important;
  font-family: var(--dhx-gantt-font-family);
}

// 确保横向滚动条可见且不被隐藏
:deep(.gantt_scroll_hor) {
  display: block !important;
  height: 18px !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
}

// 确保垂直滚动条可见
:deep(.gantt_scroll_ver) {
  display: block !important;
  width: 18px !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
}

// 确保网格数据区域可以滚动
:deep(.gantt_grid_data) {
  overflow-x: auto !important;
  overflow-y: hidden !important;
}

// 确保时间轴数据区域可以滚动
:deep(.gantt_task_data) {
  overflow-x: auto !important;
  overflow-y: hidden !important;
}

// 确保表头可以响应鼠标事件以调整列宽
:deep(.gantt_grid_scale) {
  cursor: default !important;
}

// 确保表头分隔条可以拖动
:deep(.gantt_scale_line) {
  cursor: col-resize !important;
}

// 确保列标题之间的分隔线可见且可拖动
:deep(.gantt_grid_head_cell) {
  position: relative !important;
  overflow: visible !important;
}

// 排序图标样式优化
:deep(.gantt_sort_desc),
:deep(.gantt_sort_asc) {
  width: 16px !important;
  height: 16px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  right: 5px !important;
}

// 列宽调整手柄样式
:deep(.gantt_grid_resize_marker) {
  display: block !important;
  width: 5px !important;
  cursor: col-resize !important;
  background: rgba(64, 158, 255, 0.3) !important;
  z-index: 100 !important;
}

// 全屏模式下甘特图容器样式
:deep(.gantt_fullscreen) {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 99999 !important;
  background: #ffffff;
}

// 今天标记线样式
:deep(.gantt_marker.today .gantt_marker_content) {
  background: #ff5c5c;
  color: white;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
}

// 透明任务条样式
:deep(.transparent-bar) {
  background: transparent !important;
  border: none !important;
}

// ==================== 控制按钮样式 ====================

// 全屏控制按钮样式
.fullscreen-control {
  display: flex;
  align-items: center;
}

// 树节点控制按钮样式
.tree-control {
  display: flex;
  align-items: center;
  margin-left: 10px;
  gap: 5px;
}

// 网格切换控制按钮样式
.grid-toggle-control {
  display: flex;
  align-items: center;
  margin-left: 10px;
}

// ==================== 甘特图全局样式（不使用 scoped，影响所有甘特图实例）====================
</style>

<style>
/* ==================== CSS 变量定义 ==================== */
:root {
  /* 主题主色 - 改为绿色 */
  --dhx-gantt-base-colors-primary: #10b981;

  /* 任务条背景 - 渐变效果 */
  --dhx-gantt-task-background: linear-gradient(135deg, #10b981 0%, #059669 100%);

  /* 任务条文字颜色 */
  --dhx-gantt-task-color: #ffffff;

  /* 里程碑颜色 */
  --dhx-gantt-milestone-background: #8b5cf6;

  /* 项目任务颜色 */
  --dhx-gantt-project-background: #f59e0b;

  /* 表头背景 */
  --dhx-gantt-scale-background: #f3f4f6;

  /* 奇数行背景（斑马纹） */
  --dhx-gantt-task-row-background--odd: #f9fafb;

  /* 基础背景 - Element Plus Card 风格 */
  --dhx-gantt-tooltip-background: #ffffff;
  --dhx-gantt-tooltip-color: #303133;
  --dhx-gantt-tooltip-border: 1px solid #e4e7ed;
  --dhx-gantt-tooltip-border-radius: 8px;

  /* 阴影 - Element Plus Card 的阴影效果 */
  --dhx-gantt-box-shadow-m: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  /* 字体设置 */
  --dhx-gantt-font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  --dhx-gantt-regular-font-size: 14px;
  --dhx-gantt-regular-line-height: 1.4;
  --dhx-gantt-regular-font-weight: 400;
}

/* 如果 :root 不生效，可以尝试直接定义在 .gantt_container 上 */
.gantt_container {
  --dhx-gantt-base-colors-primary: #10b981;
  --dhx-gantt-task-background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

/* ==================== 树形图标样式 ==================== */
.gantt_tree_icon.gantt_file,
.gantt_tree_icon.gantt_folder_open,
.gantt_tree_icon.gantt_folder_closed {
  width: 10px;
  background-image: none;
}

/* ==================== 任务条溢出控制 ==================== */
.gantt_task_line {
  overflow: visible !important;
}

.gantt_task_line.gantt_milestone {
  width: 12px !important;
  height: 16px !important;
  border: none !important;
  background-color: inherit !important;
  background-size: cover;
}

/* 任务行容器溢出隐藏问题 */
.gantt_task_row,
.gantt_task_cell,
.gantt_task_content,
.gantt_task_progress {
  overflow: visible !important;
}

/* 任务条内部容器允许溢出 */
.gantt_task .gantt_task_content div {
  overflow: visible !important;
}

/* 任务条本身允许内容溢出 */
.gantt_task_bar,
.gantt_task_line {
  overflow: visible !important;
}

/* 优化:确保智能渲染下任务行不被过早裁剪 */
.gantt_task_row {
  will-change: auto !important;
  contain: none !important;
}

/* ==================== 时间条样式 ==================== */
.gantt-time-bar {
  transition: opacity 0.2s;
  cursor: pointer;
}

.gantt-time-bar:hover {
  opacity: 0.85;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
}

.transparent-bar {
  background: transparent !important;
  border: none !important;
}

.gantt_marker.today .gantt_marker_content {
  background: #ff5c5c;
  color: white;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
}

/*::-webkit-scrollbar {
  width: 14px;
  height: 6px;
}*/

.weekend {
  background: #909399 !important;
  color: #fff;
}

/* ==================== 提示框样式 ==================== */
/* 提示框整体容器 */
.gantt_tooltip {
  padding: 8px 8px 8px 8px;
  position: absolute;
  z-index: 50;
  white-space: nowrap;
  box-shadow: var(--dhx-gantt-box-shadow-m);
  background: var(--dhx-gantt-tooltip-background);
  color: var(--dhx-gantt-tooltip-color);
  border: var(--dhx-gantt-tooltip-border);
  font-family: var(--dhx-gantt-font-family);
  font-size: var(--dhx-gantt-regular-font-size);
  line-height: var(--dhx-gantt-regular-line-height);
  font-weight: var(--dhx-gantt-regular-font-weight);
  border-radius: var(--dhx-gantt-tooltip-border-radius);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.tip-container {
  /*  padding: 10px 12px;*/
  line-height: 1.2;
  min-width: 400px;
  background-color: #ffffff;
  color: #201d1d;
  border-radius: 6px;
  /*  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);*/
  font-size: 14px;
}

/* 分割线 */
.tip-container .tip-item {
  margin: 8px 0;
  border: none;
  border-top: 1px solid #dcdfe6;
}

/* 统一两行布局：标签固定宽度 + 内容自适应 */
.fix-width {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
}

/* 四列布局：前一制程/下一制程 */
.grid-four {
  display: grid;
  grid-template-columns: 70px minmax(120px, 1fr) 70px 1fr;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
}
/* 时间标签样式（完工时间/预计开工） */
.grid-four .time-label {
  width: 70px;
  color: #000000;
  text-align: justify;
  text-align-last: justify;
  white-space: nowrap;
}

/* 时间值样式（日期+时间） */
.grid-four .time-value {
  width: 130px;
  color: #000000;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* 标签文字样式 */
.fix-width span,
.grid-four span {
  color: #000000;
  text-align: justify;
  text-align-last: justify;
  white-space: nowrap;
}

/* 内容文字样式 - 支持 span 和 div */
.fix-width > span:nth-child(2),
.fix-width > div:nth-child(2),
.grid-four > span:nth-child(2n),
.grid-four > div:nth-child(2n) {
  color: #000000;
  word-break: break-all;
  text-align: left;
}

/* ==================== 工具栏布局样式 ==================== */
.legend-container {
  display: flex;
  gap: 20px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
  flex-shrink: 0;
  align-items: center;
}

.legend-item {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: #606266;
}

/* 日期多维度切换 */
.view-switcher {
  margin-left: auto;
}

.color-block {
  width: 28px;
  height: 14px;
  border-radius: 2px;
}

.color-block.primary {
  background-color: #409eff;
}

.color-block.success {
  background-color: #67c23a;
}

/* 缩放功能 */
.legend-container {
  display: flex;
  gap: 20px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
  flex-shrink: 0;
  align-items: center;
}

.legend-item {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: #606266;
}

.zoom-controls {
  display: flex;
  align-items: center;
}

.export-controls {
  display: flex;
  align-items: center;
  margin-left: 10px;
}

.view-switcher {
  margin-left: auto;
}

.color-block {
  width: 28px;
  height: 14px;
  border-radius: 2px;
}

.color-block.primary {
  background-color: #409eff;
}

.color-block.success {
  background-color: #67c23a;
}

/* ==================== 表格列宽拖动样式 ==================== */
/* 表格列宽拖动线 - 可见、可拖动、视觉反馈 */
.gantt_grid_resize_marker {
  position: absolute !important;
  z-index: 999 !important;
  width: 4px !important;
  background: rgba(64, 158, 255, 0.4) !important;
  cursor: col-resize !important;
  opacity: 1 !important;
  display: block !important;
}

.gantt_grid_head_cell {
  position: relative !important;
  overflow: visible !important;
}

.gantt_scale_line {
  cursor: col-resize !important;
}

/* ==================== 甘特图行内容垂直居中 ==================== */
/* 让 Gantt 行内容全部垂直居中 */
.gantt_tree_content {
  display: flex;
  align-items: center !important;
  gap: 6px;
  height: 100%;
}

/* 父级:让图标 + 文字 同一行垂直居中 */
.gantt_cell {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
}

/* 图标本身样式 */
.gantt_icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
}

/* ==================== 工单图标（文件夹图标）==================== */
/* 工单 - 未开始 */
.order_icon_wait {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='18' height='18' fill='%23909399'%3E%3Cpath d='M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z'/%3E%3C/svg%3E");
}

/* 工单 - 生产中 */
.order_icon_process {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='18' height='18' fill='%23409eff'%3E%3Cpath d='M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z'/%3E%3C/svg%3E");
}

/* 工单 - 已完成 */
.order_icon_done {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='18' height='18' fill='%2367c23a'%3E%3Cpath d='M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z'/%3E%3C/svg%3E");
}

/* 工单 - 暂停 */
.order_icon_pause {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='18' height='18' fill='%23e6a23c'%3E%3Cpath d='M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z'/%3E%3C/svg%3E");
}

/* 工单 - 异常 */
.order_icon_error {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='18' height='18' fill='%23f56c6c'%3E%3Cpath d='M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z'/%3E%3C/svg%3E");
}

/* ==================== 工序图标（步骤图标）==================== */
/* 工序-未开始 灰色 */
.process_icon_wait {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Cpath d='M661.333333 170.666667l253.866667 34.133333-209.066667 209.066667zM362.666667 853.333333L108.8 819.2l209.066667-209.066667zM170.666667 362.666667L204.8 108.8l209.066667 209.066667z' fill='%23909399'%3E%3C/path%3E%3Cpath d='M198.4 452.266667l-89.6 17.066666c-2.133333 14.933333-2.133333 27.733333-2.133333 42.666667 0 98.133333 34.133333 192 98.133333 264.533333l64-55.466666C219.733333 663.466667 192 588.8 192 512c0-19.2 2.133333-40.533333 6.4-59.733333zM512 106.666667c-115.2 0-217.6 49.066667-292.266667 125.866666l59.733334 59.733334C339.2 230.4 420.266667 192 512 192c19.2 0 40.533333 2.133333 59.733333 6.4l14.933334-83.2C563.2 108.8 537.6 106.666667 512 106.666667zM825.6 571.733333l89.6-17.066666c2.133333-14.933333 2.133333-27.733333 2.133333-42.666667 0-93.866667-32-185.6-91.733333-258.133333l-66.133333 53.333333c46.933333 57.6 72.533333 130.133333 72.533333 202.666667 0 21.333333-2.133333 42.666667-6.4 61.866666zM744.533333 731.733333C684.8 793.6 603.733333 832 512 832c-19.2 0-40.533333-2.133333-59.733333-6.4l-14.933334 83.2c25.6 4.266667 51.2 6.4 74.666667 6.4 115.2 0 217.6-49.066667 292.266667-125.866667l-59.733334-57.6z' fill='%23909399'%3E%3C/path%3E%3Cpath d='M853.333333 661.333333l-34.133333 253.866667-209.066667-209.066667z' fill='%23909399'%3E%3C/path%3E%3C/svg%3E");
}

/* 工序-生产中 蓝色 */
.process_icon_process {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Cpath d='M661.333333 170.666667l253.866667 34.133333-209.066667 209.066667zM362.666667 853.333333L108.8 819.2l209.066667-209.066667zM170.666667 362.666667L204.8 108.8l209.066667 209.066667z' fill='%23409eff'%3E%3C/path%3E%3Cpath d='M198.4 452.266667l-89.6 17.066666c-2.133333 14.933333-2.133333 27.733333-2.133333 42.666667 0 98.133333 34.133333 192 98.133333 264.533333l64-55.466666C219.733333 663.466667 192 588.8 192 512c0-19.2 2.133333-40.533333 6.4-59.733333zM512 106.666667c-115.2 0-217.6 49.066667-292.266667 125.866666l59.733334 59.733334C339.2 230.4 420.266667 192 512 192c19.2 0 40.533333 2.133333 59.733333 6.4l14.933334-83.2C563.2 108.8 537.6 106.666667 512 106.666667zM825.6 571.733333l89.6-17.066666c2.133333-14.933333 2.133333-27.733333 2.133333-42.666667 0-93.866667-32-185.6-91.733333-258.133333l-66.133333 53.333333c46.933333 57.6 72.533333 130.133333 72.533333 202.666667 0 21.333333-2.133333 42.666667-6.4 61.866666zM744.533333 731.733333C684.8 793.6 603.733333 832 512 832c-19.2 0-40.533333-2.133333-59.733333-6.4l-14.933334 83.2c25.6 4.266667 51.2 6.4 74.666667 6.4 115.2 0 217.6-49.066667 292.266667-125.866667l-59.733334-57.6z' fill='%23409eff'%3E%3C/path%3E%3Cpath d='M853.333333 661.333333l-34.133333 253.866667-209.066667-209.066667z' fill='%23409eff'%3E%3C/path%3E%3C/svg%3E");
}

/* 工序-已完成 绿色 */
.process_icon_done {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Cpath d='M661.333333 170.666667l253.866667 34.133333-209.066667 209.066667zM362.666667 853.333333L108.8 819.2l209.066667-209.066667zM170.666667 362.666667L204.8 108.8l209.066667 209.066667z' fill='%2367c23a'%3E%3C/path%3E%3Cpath d='M198.4 452.266667l-89.6 17.066666c-2.133333 14.933333-2.133333 27.733333-2.133333 42.666667 0 98.133333 34.133333 192 98.133333 264.533333l64-55.466666C219.733333 663.466667 192 588.8 192 512c0-19.2 2.133333-40.533333 6.4-59.733333zM512 106.666667c-115.2 0-217.6 49.066667-292.266667 125.866666l59.733334 59.733334C339.2 230.4 420.266667 192 512 192c19.2 0 40.533333 2.133333 59.733333 6.4l14.933334-83.2C563.2 108.8 537.6 106.666667 512 106.666667zM825.6 571.733333l89.6-17.066666c2.133333-14.933333 2.133333-27.733333 2.133333-42.666667 0-93.866667-32-185.6-91.733333-258.133333l-66.133333 53.333333c46.933333 57.6 72.533333 130.133333 72.533333 202.666667 0 21.333333-2.133333 42.666667-6.4 61.866666zM744.533333 731.733333C684.8 793.6 603.733333 832 512 832c-19.2 0-40.533333-2.133333-59.733333-6.4l-14.933334 83.2c25.6 4.266667 51.2 6.4 74.666667 6.4 115.2 0 217.6-49.066667 292.266667-125.866667l-59.733334-57.6z' fill='%2367c23a'%3E%3C/path%3E%3Cpath d='M853.333333 661.333333l-34.133333 253.866667-209.066667-209.066667z' fill='%2367c23a'%3E%3C/path%3E%3C/svg%3E");
}

/* 工序-暂停 橙色 */
.process_icon_pause {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Cpath d='M661.333333 170.666667l253.866667 34.133333-209.066667 209.066667zM362.666667 853.333333L108.8 819.2l209.066667-209.066667zM170.666667 362.666667L204.8 108.8l209.066667 209.066667z' fill='%23e6a23c'%3E%3C/path%3E%3Cpath d='M198.4 452.266667l-89.6 17.066666c-2.133333 14.933333-2.133333 27.733333-2.133333 42.666667 0 98.133333 34.133333 192 98.133333 264.533333l64-55.466666C219.733333 663.466667 192 588.8 192 512c0-19.2 2.133333-40.533333 6.4-59.733333zM512 106.666667c-115.2 0-217.6 49.066667-292.266667 125.866666l59.733334 59.733334C339.2 230.4 420.266667 192 512 192c19.2 0 40.533333 2.133333 59.733333 6.4l14.933334-83.2C563.2 108.8 537.6 106.666667 512 106.666667zM825.6 571.733333l89.6-17.066666c2.133333-14.933333 2.133333-27.733333 2.133333-42.666667 0-93.866667-32-185.6-91.733333-258.133333l-66.133333 53.333333c46.933333 57.6 72.533333 130.133333 72.533333 202.666667 0 21.333333-2.133333 42.666667-6.4 61.866666zM744.533333 731.733333C684.8 793.6 603.733333 832 512 832c-19.2 0-40.533333-2.133333-59.733333-6.4l-14.933334 83.2c25.6 4.266667 51.2 6.4 74.666667 6.4 115.2 0 217.6-49.066667 292.266667-125.866667l-59.733334-57.6z' fill='%23e6a23c'%3E%3C/path%3E%3Cpath d='M853.333333 661.333333l-34.133333 253.866667-209.066667-209.066667z' fill='%23e6a23c'%3E%3C/path%3E%3C/svg%3E");
}

/* 工序-异常 红色 */
.process_icon_error {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Cpath d='M661.333333 170.666667l253.866667 34.133333-209.066667 209.066667zM362.666667 853.333333L108.8 819.2l209.066667-209.066667zM170.666667 362.666667L204.8 108.8l209.066667 209.066667z' fill='%23f56c6c'%3E%3C/path%3E%3Cpath d='M198.4 452.266667l-89.6 17.066666c-2.133333 14.933333-2.133333 27.733333-2.133333 42.666667 0 98.133333 34.133333 192 98.133333 264.533333l64-55.466666C219.733333 663.466667 192 588.8 192 512c0-19.2 2.133333-40.533333 6.4-59.733333zM512 106.666667c-115.2 0-217.6 49.066667-292.266667 125.866666l59.733334 59.733334C339.2 230.4 420.266667 192 512 192c19.2 0 40.533333 2.133333 59.733333 6.4l14.933334-83.2C563.2 108.8 537.6 106.666667 512 106.666667zM825.6 571.733333l89.6-17.066666c2.133333-14.933333 2.133333-27.733333 2.133333-42.666667 0-93.866667-32-185.6-91.733333-258.133333l-66.133333 53.333333c46.933333 57.6 72.533333 130.133333 72.533333 202.666667 0 21.333333-2.133333 42.666667-6.4 61.866666zM744.533333 731.733333C684.8 793.6 603.733333 832 512 832c-19.2 0-40.533333-2.133333-59.733333-6.4l-14.933334 83.2c25.6 4.266667 51.2 6.4 74.666667 6.4 115.2 0 217.6-49.066667 292.266667-125.866667l-59.733334-57.6z' fill='%23f56c6c'%3E%3C/path%3E%3Cpath d='M853.333333 661.333333l-34.133333 253.866667-209.066667-209.066667z' fill='%23f56c6c'%3E%3C/path%3E%3C/svg%3E");
}

/* ==================== 状态详情内容样式 ==================== */
.ganttx-status-detail-content {
  margin: 0px 0 0 -5px;
  padding: 8px 0;

  &.success {
    color: #67c23a;
  }

  &.warning {
    color: #e6a23c;
  }

  &.danger {
    color: #f56c6c;
  }

  &.default {
    color: #909399;
  }
}
</style>
