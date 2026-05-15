<template>
  <div class="gantt-wrapper">
    <div v-if="showLegend" class="legend-container">
      <div class="legend-item">
        <div class="color-block primary"></div>
        <span>{{ legendText.plan }}</span>
      </div>
      <div class="legend-item">
        <div class="color-block success"></div>
        <span>{{ legendText.actual }}</span>
      </div>
    </div>
    <div ref="ganttRef" class="gantt-container"></div>
  </div>
</template>

<script setup lang="ts">
import gantt from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';

dayjs.extend(minMax);

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
      // {
      //   name: 'index',
      //   label: '序号',
      //   align: 'center',
      //   width: 60,
      //   template(task) {
      //     return gantt.getWBSCode(gantt.getTask(task.id));
      //   }
      // },
      { name: 'id', label: '工单号', tree: true, width: 280, resize: true },
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

const emit = defineEmits(['ready', 'task-click', 'task-dblclick']);

const ganttRef = ref(null);
let isInitialized = false;
let updateTimer = null;
let renderTimer = null;

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

// 渲染时间段条
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
    /*
    <div class="fix-width">${formatDelay(diff.startDelay, '开始')}</div>
      <div class="fix-width">${formatDelay(diff.endDelay, '结束')}</div>
*/

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
          <div class="fix-width"><span>实际时间:</span><div>${formatDateStr(actual.actual_start)} ~ ${formatDateStr(actual.actual_end)}</div></div>
          <div class="fix-width"><span>计 划 D 2 D :</span><div>${task.plannedD2DDurationDesc}</div></div>
          <div class="fix-width"><span>实 际 D 2 D :</span><div>${task.actualDurationDesc}</div></div>
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
            <span>完工时间:</span>
            <span>${task.previousActualEndDate || '-'}</span>
          </div>
          <div class="grid-four">
            <span>下一制程:</span>
            <span>${task.nextWorkOrderNo || ''}-${task.nextProcessNo ? Number(task.nextProcessNo) : ''} ${task.nextWorkCenter || ''}</span>
            <span>预计开工:</span>
            <span>${task.nextPlannedStartDate || '-'}</span>
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

// 初始化配置
const initConfig = () => {
  // ==================== 国际化设置 ====================
  gantt.i18n.setLocale('cn');

  // ==================== 插件加载 ====================
  // 必须在 init() 之前加载所有需要的插件
  gantt.plugins({
    tooltip: true, // 启用悬浮提示功能
    marker: true, // 启用标记线功能（如今天线）
    multitask: true // 启用多段任务功能（支持同一任务显示多个时间段）
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
  gantt.config.grid_width = 900; // 左侧表格初始宽度（像素）
  gantt.config.max_task_height = 26; // 任务条最大高度限制

  // ==================== 表格列配置 ====================
  gantt.config.autofit = true; // 自动调整列宽以适应内容
  gantt.config.grid_elastic_columns = false; // 禁用弹性列宽
  gantt.config.autosize_columns = true; // 自动计算列宽
  gantt.config.drag_column_width = true; // 允许拖动调整列宽
  gantt.config.columns = props.columns; // 使用传入的列配置

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

  // gantt.config.task_content_overflow = 'visible'; // 允许任务内容溢出容器（用于显示超出的时间条）
  // gantt.config.dynamic_loading = false; // 启用动态加载（仅渲染可见区域的任务，提升大数据量性能）
  // gantt.config.smart_rendering = false; // 关闭智能渲染（避免自定义时间条被裁剪，确保完整显示）
  // gantt.config.render_mode = 'div'; // 使用div模式
  // gantt.config.static_background = false; // 启用静态背景渲染(提升滚动性能)
  // gantt.config.static_background_cells = true; // 启用静态背景单元格

  gantt.config.task_content_overflow = 'visible'; // 保留：允许内容溢出
  gantt.config.smart_rendering = false; // 关闭智能渲染（避免自定义时间条被裁剪，确保完整显示）
  gantt.config.dynamic_loading = false; // 启用动态加载（仅渲染可见区域的任务，提升大数据量性能）
  gantt.config.render_mode = 'div'; // 使用div模式
  gantt.config.static_background = true; // 启用静态背景渲染(提升滚动性能)
  gantt.config.static_background_cells = true; // 启用静态背景单元格

  // ==================== 布局配置 ====================
  gantt.config.fix_grid_header = true; // 固定表头，滚动时表头保持可见

  // ==================== 布局配置 ====================
  // 自定义左右分栏布局：左侧表格 + 右侧时间轴，各自独立横向滚动
  gantt.config.layout = {
    css: 'gantt_container',
    cols: [
      // 左侧表格区域：固定宽度，支持横向滚动
      {
        width: 900,
        resize: true,
        rows: [
          // 表格主体
          { view: 'grid', scrollX: 'gridScroll', scrollY: 'scrollVer' },
          // 左侧独立横向滚动条
          { view: 'scrollbar', id: 'gridScroll', scroll: 'x', group: 'horizontal' }
        ]
      },

      // 可拖动分隔条
      { resizer: true, width: 4 },

      // 右侧时间轴区域：占满剩余空间
      {
        gravity: 1,
        rows: [
          // 时间轴主体
          { view: 'timeline', scrollX: 'timelineScroll', scrollY: 'scrollVer' },
          // 右侧独立横向滚动条
          { view: 'scrollbar', id: 'timelineScroll', scroll: 'x', group: 'horizontal' }
        ]
      },

      // 纵向滚动条（两侧共享）
      { view: 'scrollbar', id: 'scrollVer', scroll: 'y' }
    ]
  };

  // ==================== 表头滚动同步 ====================
  // 当表格内容横向滚动时，同步滚动表头以保持对齐
  gantt.attachEvent('onGridScroll', (scrollLeft) => {
    const headerRow = document.querySelector('.gantt_grid_scale .gantt_grid_head_row');
    if (headerRow) {
      headerRow.style.transform = `translateX(-${scrollLeft}px)`;
    }
  });

  // ==================== 多段任务配置 ====================
  // 启用多段任务功能，允许同一任务显示多个时间段（计划/实际）
  gantt.config.multitask = true; // 开启多段任务支持
  gantt.config.multitask_branch = false; // 不在分支级别显示多段

  // ==================== 时间轴刻度配置 ====================
  // 三层时间刻度：周 -> 日 -> 小时
  gantt.config.scales = [
    // 第一层：按周显示
    {
      unit: 'week',
      step: 1,
      format: function (date) {
        const startDate = date;
        const endDate = gantt.date.add(gantt.date.add(date, 1, 'week'), -1, 'day');

        // 格式化：月份两位 + 年份
        const dateToStr = gantt.date.date_to_str('%Y-%m-%d');
        const startStr = dateToStr(startDate);
        const endStr = dateToStr(endDate);
        return startStr + ' - ' + endStr;
      }
    },
    // 第二层：按日显示，周末高亮
    {
      unit: 'day',
      step: 1,
      format: '%Y-%m-%d (%D)',
      css: function (date) {
        if (date.getDay() === 0 || date.getDay() === 6) return 'weekend';
        return '';
      }
    },
    // 第三层：每4小时一个刻度
    { unit: 'hour', step: 4, format: '%H:%i' }
  ];

  // ==================== 模板配置 ====================
  // 树形图标模板：根据任务类型和状态显示不同图标
  gantt.templates.grid_folder = function (task: any) {
    let cls = 'gantt_icon ';

    if (task.process && task.process.trim()) {
      // 工序节点：根据状态显示不同颜色图标
      switch (task.finalStatus) {
        case 0:
          // cls += 'process_icon_process'; // 蓝色
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
          // cls += 'order_icon_process'; // 生产中 - 蓝色
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
  gantt.templates.grid_file = function (task: any) {
    return gantt.templates.grid_folder(task);
  };

  // 任务条样式模板：为有时间段的任务设置透明背景
  gantt.templates.task_class = function (start: any, end: any, task: any) {
    // 如果任务有 timeList 或 actual_start/end，使用自定义渲染，任务条设为透明
    if ((task.timeList && task.timeList.length) || (task.actual_start && task.actual_end)) {
      return 'transparent-bar';
    }
    return '';
  };
  // 任务文本模板：自定义任务条上的显示内容
  gantt.templates.task_text = customTaskText;

  // 悬浮提示模板：自定义鼠标悬停时的提示信息
  gantt.templates.tooltip_text = customTooltipText;

  // 周末高亮模板：在时间轴上标记周末
  gantt.templates.scale_cell_class = (date) => {
    const day = date.getDay();
    if (day === 0 || day === 6) {
      // 0是周日，6是周六
      return 'weekend';
    }
  };
};

// 递归构建数据
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

onMounted(async () => {
  await nextTick();

  if (!ganttRef.value) {
    console.warn('Gantt container not found');
    return;
  }

  try {
    // 如果已经初始化过，先软重置
    if (isInitialized) {
      console.log('Gantt already initialized, soft resetting...');
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
      throw new Error('Gantt container disappeared');
    }

    // 如果是首次初始化，调用 init；否则直接加载数据
    if (!isInitialized) {
      console.log('Initializing gantt for the first time...');
      gantt.init(ganttRef.value);
      isInitialized = true;
      console.log('Gantt initialized successfully');
    } else {
      console.log('Reusing existing gantt instance');
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
        } catch (error) {
          console.warn('调整时间范围失败:', error);
        }
      }, 100);
    }

    // 确保添加今天标记线
    addTodayLine();

    emit('ready', { gantt });
  } catch (error) {
    console.error('Gantt initialization error:', error);
    isInitialized = false;
  }
});

watch(
  () => props.tasks,
  (newTasks) => {
    if (isInitialized && newTasks) {
      updateData(newTasks);
    }
  },
  { deep: false }
);

watch(
  () => props.readonly,
  (newReadonly) => {
    if (isInitialized) {
      gantt.config.readonly = newReadonly;
      gantt.refreshData();
    }
  }
);

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

  // 软重置而不是 destructor
  softReset();
  isInitialized = false;
});

defineExpose({
  reload,
  updateData
});
</script>

<style lang="scss" scoped>
.gantt-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.legend-container {
  display: flex;
  gap: 20px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
  flex-shrink: 0;
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

.gantt-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

:deep(.gantt_marker.today .gantt_marker_content) {
  background: #ff5c5c;
  color: white;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
}

:deep(.transparent-bar) {
  background: transparent !important;
  border: none !important;
}
</style>

<style>
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
  --dhx-gantt-font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  --dhx-gantt-regular-font-size: 14px;
  --dhx-gantt-regular-line-height: 1.4;
  --dhx-gantt-regular-font-weight: 400;
}

/* 如果 :root 不生效，可以尝试直接定义在 .gantt_container 上 */
.gantt_container {
  --dhx-gantt-base-colors-primary: #10b981;
  --dhx-gantt-task-background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.gantt_tree_icon.gantt_file,
.gantt_tree_icon.gantt_folder_open,
.gantt_tree_icon.gantt_folder_closed {
  width: 10px;
  background-image: none;
}

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

/* 时间条样式 */
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
  grid-template-columns: 80px minmax(150px, 1fr) 88px 1fr;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
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

/* 工单图标 = 工单/文件夹 */
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
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='18' height='18' fill='%23e6a23c'%3E%3Cpath d='M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0 1.1-.9-2-2-2h-8l-2-2z'/%3E%3C/svg%3E");
}
/* 工单 - 异常 */
.order_icon_error {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='18' height='18' fill='%23f56c6c'%3E%3Cpath d='M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z'/%3E%3C/svg%3E");
}

/* 工序图标 = 工序/步骤 */
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

.ganttx-status-detail-content {
  margin: 0px 0 0 -5px;
  padding: 8px 0;

  &.success {
    color: #67c23a;
    box-shadow: 0 0 5px rgba(103, 194, 58, 0.4);
  }

  &.warning {
    color: #e6a23c;
    box-shadow: 0 0 5px rgba(230, 162, 60, 0.4);
  }

  &.danger {
    color: #f56c6c;
    box-shadow: 0 0 5px rgba(245, 108, 108, 0.4);
  }

  &.default {
    color: #909399;
    box-shadow: 0 0 3px rgba(144, 147, 153, 0.3);
  }
}
</style>
