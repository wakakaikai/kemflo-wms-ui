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

<script setup>
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
      { name: 'id', label: '工单号', tree: true, width: 280 },
      {
        name: 'salesOrderNo',
        label: '销售订单',
        align: 'center',
        width: 120,
        template(task) {
          if (task.salesOrderNo && task.salesItemNo) {
            return task.salesOrderNo + '-' + Number(task.salesItemNo);
          } else {
            return '-';
          }
        }
      },
      { name: 'text', label: '产品描述', align: 'left', width: 200 },
      { name: 'workstation', label: '工作中心', align: 'left', width: 100 },
      { name: 'start_date', label: '计划开始时间', align: 'center', width: 100 },
      { name: 'end_date', label: '计划结束时间', align: 'center', width: 100 }
    ]
  }
});

const emit = defineEmits(['ready', 'task-click', 'task-dblclick']);

const ganttRef = ref(null);
let isInitialized = false;
let updateTimer = null;

// 计算时间差异
const dateTimeDifference = (plan, actual) => {
  if (!plan || !actual) return null;

  const planStart = dayjs(plan.start_date);
  const planEnd = dayjs(plan.end_date);
  const actualStart = dayjs(actual.actual_start);
  const actualEnd = dayjs(actual.actual_end);

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}小时`;
      } else {
        return `${hours}小时${remainingMinutes}分钟`;
      }
    }
  };

  return {
    startDelay: actualStart.diff(planStart, 'minute'),
    endDelay: actualEnd.diff(planEnd, 'minute'),
    planDuration: formatDuration(planEnd.diff(planStart, 'minute')),
    actualDuration: formatDuration(actualEnd.diff(actualStart, 'minute'))
  };
};

// 格式化日期
const formatDate = (date) => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

// 渲染时间段条
const handleTimePeriodRender = (seg, totalLeft, totalWidth, opt = {}) => {
  const startDate = dayjs(seg.start_date).toDate();
  const endDate = dayjs(seg.end_date).toDate();
  const left = gantt.posFromDate(startDate);
  const right = gantt.posFromDate(endDate);
  const width = Math.max(2, right - left);

  const offsetLeft = ((left - totalLeft) / totalWidth) * 100;
  const relativeWidth = (width / totalWidth) * 100;
  const color = opt.color || '#999';
  const height = opt.height || 10;
  const offsetY = opt.offsetY || 0;

  return `
    <div
      style="
        position:absolute;
        left:${offsetLeft}%;
        width:${relativeWidth}%;
        top:${offsetY}px;
        height:${height}px;
        background:${color};
        border-radius:3px;
        box-shadow:0 0 3px rgba(0,0,0,0.15);
        transition:all 0.2s ease;
      "></div>`;
};

// 自定义任务文本显示
const customTaskText = (start, end, task) => {
  // 如果有timeList字段,使用叠加显示方式
  if (task.timeList && task.timeList.length) {
    const allDates = task.timeList.flatMap((s) => [s.startDate, s.endDate]);
    const minStart = dayjs.min(...allDates.map((d) => dayjs(d))).toDate();
    const maxEnd = dayjs.max(...allDates.map((d) => dayjs(d))).toDate();
    const totalLeft = gantt.posFromDate(minStart);
    const totalRight = gantt.posFromDate(maxEnd);
    const totalWidth = Math.max(1, totalRight - totalLeft);

    const plans = task.timeList.filter((s) => s.type === 'plan');
    const actuals = task.timeList.filter((s) => s.type === 'actual');

    let html = `<div style="position:relative;height:100%;overflow:hidden;">`;

    plans.forEach((item) => {
      html += handleTimePeriodRender(item, totalLeft, totalWidth, {
        color: '#409EFF',
        offsetY: 2,
        height: 8
      });
    });

    actuals.forEach((item) => {
      html += handleTimePeriodRender(item, totalLeft, totalWidth, {
        color: '#67C23A',
        offsetY: 14,
        height: 8
      });
    });

    html += `</div>`;
    return html;
  }

  // 使用actual_start/actual_end字段
  if (task.actual_start && task.actual_end) {
    const allDates = [task.start_date, task.end_date, task.actual_start, task.actual_end];
    const minStart = dayjs.min(...allDates.map((d) => dayjs(d))).toDate();
    const maxEnd = dayjs.max(...allDates.map((d) => dayjs(d))).toDate();
    const totalLeft = gantt.posFromDate(minStart);
    const totalRight = gantt.posFromDate(maxEnd);
    const totalWidth = Math.max(1, totalRight - totalLeft);

    let html = `<div style="position:relative;height:100%;overflow:hidden;">`;

    // 计划时间条
    html += handleTimePeriodRender({ start_date: task.start_date, end_date: task.end_date }, totalLeft, totalWidth, { color: '#409EFF', offsetY: 2, height: 8 });

    // 实际时间条
    html += handleTimePeriodRender({ start_date: task.actual_start, end_date: task.actual_end }, totalLeft, totalWidth, { color: '#67C23A', offsetY: 14, height: 8 });

    html += `</div>`;
    return html;
  }

  // 没有实际时间,只显示计划
  const progress = task.progress ? Math.round(task.progress * 100) + '%' : '';
  if (task.type === 'project') {
    return `<span>工单号:${task.workOrderNo} </span> ${task.text} <span>${progress}</span>`;
  } else {
    return `<span>${task.text}</span>`;
  }
};

// 自定义悬浮提示
const customTooltipText = (start, end, task) => {
  const formatDateStr = (date) => dayjs(date).format('YYYY-MM-DD HH:mm');

  // 项目节点
  if (task.type === 'project') {
    const progress = task.progress ? Math.round(task.progress * 100) : 0;
    return `
      <div class="tip-container">
        <div><b>${task.text}</b></div>
        <hr class="tip-item" />
        <div class="fix-width"><span>工单号:</span> ${task.workOrderNo || '-'}</div>
        <div class="fix-width"><span>计划时间:</span> ${formatDateStr(task.start_date)} ~ ${formatDateStr(task.end_date)}</div>
        <div class="fix-width"><span>工单数量:</span> ${task.planQuantity}</div>
        <div class="fix-width"><span>工单进度:</span> ${progress}%</div>
      </div>`;
  }

  // 有timeList的情况
  if (task.timeList && task.timeList.length) {
    const plan = task.timeList.find((s) => s.type === 'plan');
    const actual = task.timeList.find((s) => s.type === 'actual');

    if (!plan || !actual) {
      return `
        <div class="tip-container">
          <div><b>${task.text}</b></div>
        </div>`;
    }

    const diff = dateTimeDifference(plan, actual);

    const formatDelay = (min, label) => {
      if (min === 0) return `<span style="color:#67c23a">${label}: 准时</span>`;
      const late = min > 0;
      const hours = Math.floor(Math.abs(min) / 60);
      const minutes = Math.abs(min) % 60;
      const color = late ? '#ff5c5c' : '#409eff';
      const sign = late ? '延迟' : '提前';
      const val = hours > 0 ? `${hours}小时${minutes}分钟` : `${minutes}分钟`;
      return `<span style="color:${color}">${label}: ${sign}${val}</span>`;
    };

    return `
      <div class="tip-container">
        <div><b>${task.text}</b></div>
        <hr class="tip-item" />
        <div><b>计划:</b> ${formatDateStr(plan.startDate)} ~ ${formatDateStr(plan.endDate)}</div>
        <div><b>实际:</b> ${formatDateStr(actual.startDate)} ~ ${formatDateStr(actual.endDate)}</div>
        <div>${formatDelay(diff.startDelay, '开始')}</div>
        <div>${formatDelay(diff.endDelay, '结束')}</div>
        <div>工期: 计划 ${diff.planDuration} | 实际 ${diff.actualDuration}</div>
      </div>`;
  }

  // 使用actual_start/actual_end字段
  if (task.actual_start && task.actual_end) {
    const plan = {
      start_date: task.start_date,
      end_date: task.end_date
    };
    const actual = {
      start_date: task.actual_start,
      end_date: task.actual_end
    };

    const diff = dateTimeDifference(plan, actual);

    const formatDelay = (min, label) => {
      if (min === 0) return `<span style="color:#67c23a">${label}: 准时</span>`;
      const late = min > 0;
      const hours = Math.floor(Math.abs(min) / 60);
      const minutes = Math.abs(min) % 60;
      const color = late ? '#ff5c5c' : '#409eff';
      const sign = late ? '延迟' : '提前';
      const val = hours > 0 ? `${hours}小时${minutes}分钟` : `${minutes}分钟`;
      return `<span style="color:${color}">${label}: ${sign}${val}</span>`;
    };

    return `
      <div class="tip-container">
        <div>${task.text}</span></div>
        <hr class="tip-item" />
        <div class="fix-width"><span>工单号:</span> ${task.workOrderNo || '-'}</div>
        <div class="fix-width"><span>工作中心:</span> ${task.workstation || '-'}</div>
        ${task.process ? `<div class="fix-width"><span>工单工序:</span> ${task.process}</div>` : ''}
        <div class="fix-width"><span>工单数量:</span> ${task.planQuantity || '-'}</div>
        <hr class="tip-item" />
        <div class="fix-width"><span>计划时间:</span> ${formatDateStr(plan.start_date)} ~ ${formatDateStr(plan.end_date)}</div>
        <div class="fix-width"><span>实际时间:</span> ${formatDateStr(actual.start_date)} ~ ${formatDateStr(actual.end_date)}</div>
        <div>${formatDelay(diff.startDelay, '开始')}</div>
        <div>${formatDelay(diff.endDelay, '结束')}</div>
        <div>工期: 计划 ${diff.planDuration} | 实际 ${diff.actualDuration}</div>
      </div>`;
  }

  // 只有计划时间
  return `<div class="tip-container">
            <div><span>${task.text}</span></div>
            <hr class="tip-item" />
            <div class="fix-width"><span class="text">工单号:</span> ${task.id || '-'}</div>
            <div class="fix-width"><span>工作中心:</span> ${task.workstation || '-'}</div>
            ${task.process ? `<div class="fix-width"><span>工单工序:</span> ${task.process}</div>` : ''}
            <div class="fix-width"><span>工单数量:</span> ${task.planQuantity || '-'}</div>
            <hr class="tip-item" />
            <div class="fix-width"><span>计划时间:</span> ${formatDateStr(task.start_date)} ~ ${formatDateStr(task.end_date)}</div>
            <div class="fix-width"><span>实际状态:</span> 未开始</div>
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
  gantt.i18n.setLocale('cn');

  gantt.plugins({
    tooltip: true,
    marker: true
  });

  gantt.config.readonly = props.readonly;
  gantt.config.show_grid = true;
  gantt.config.sort = true;
  gantt.config.scale_height = 50;
  gantt.config.bar_height = 26;
  gantt.config.row_height = 32;

  gantt.config.grid_width = 520;

  gantt.config.xml_date = '%Y-%m-%d %H:%i:%s';
  gantt.config.open_tree_initially = true;
  // 显示单元格
  gantt.config.show_task_cells = true;
  gantt.config.auto_types = false;
  gantt.config.drag_progress = false;
  gantt.config.drag_move = false;
  gantt.config.drag_links = false;
  gantt.config.drag_resize = false;
  gantt.config.details_on_create = false;
  gantt.config.details_on_dblclick = false;
  gantt.config.fit_tasks = true;
  gantt.config.smart_rendering = true;
  gantt.config.dynamic_loading = true;
  gantt.config.preserve_scroll = true;
  gantt.config.max_task_height = 30;
  gantt.config.columns = props.columns;

  // 固定 grid 宽、关闭自动适应
  gantt.config.grid_width = 900;
  gantt.config.autofit = false;
  gantt.config.grid_elastic_columns = false;
  gantt.config.autosize_columns = false;

  // 允许列调整大小
  gantt.config.drag_column_width = true;

  // 关键：关闭固定表头（配合布局才生效）
  gantt.config.fix_grid_header = false;

  // 左右区域滚动条独立配置
  gantt.config.layout = {
    css: 'gantt_container',
    cols: [
      // 左侧表格区域：固定宽度，内容溢出时显示横向滚动条
      {
        width: 900,
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

  // 同步表头横向滚动
  gantt.attachEvent('onGridScroll', function (scrollLeft) {
    const headerRow = document.querySelector('.gantt_grid_scale .gantt_grid_head_row');
    if (headerRow) {
      headerRow.style.transform = `translateX(-${scrollLeft}px)`;
    }
  });

  // 开启多段任务
  gantt.config.multitask = true;
  gantt.config.multitask_branch = false;

  // 时间轴刻度 - 使用普通函数
  gantt.config.scales = [
    {
      unit: 'week',
      step: 1,
      format: function (date) {
        const dateToStr = gantt.date.date_to_str('%M %d');
        const endDate = gantt.date.add(gantt.date.add(date, 1, 'week'), -1, 'day');
        return dateToStr(date) + ' - ' + dateToStr(endDate);
      }
    },
    {
      unit: 'day',
      step: 1,
      format: '%Y-%m-%d (%D)',
      css: function (date) {
        if (date.getDay() === 0 || date.getDay() === 6) return 'weekend';
        return '';
      }
    },
    { unit: 'hour', step: 4, format: '%H:%i' }
  ];

  gantt.templates.grid_folder = function (task) {
    let cls = 'gantt_icon ';

    if (task.process && task.process.trim()) {
      // 工序 → 根据状态切换
      switch (task.status) {
        case 'process':
          cls += 'process_icon_process';
          break;
        case 'done':
          cls += 'process_icon_done';
          break;
        case 'pause':
          cls += 'process_icon_pause';
          break;
        case 'error':
          cls += 'process_icon_error';
          break;
        default:
          cls += 'process_icon_wait';
      }
    } else {
      // 工单 → 根据状态切换
      switch (task.status) {
        case 'process':
          cls += 'order_icon_process';
          break;
        case 'done':
          cls += 'order_icon_done';
          break;
        case 'pause':
          cls += 'order_icon_pause';
          break;
        case 'error':
          cls += 'order_icon_error';
          break;
        default:
          cls += 'order_icon_wait';
      }
    }

    return `<div class="${cls}"></div>`;
  };

  gantt.templates.grid_file = function (task) {
    return gantt.templates.grid_folder(task);
  };

  // 只为有时间列表的任务设置透明样式
  gantt.templates.task_class = function (start, end, task) {
    if ((task.timeList && task.timeList.length) || (task.actual_start && task.actual_end)) {
      return 'transparent-bar';
    }
    return '';
  };

  gantt.templates.task_text = customTaskText;
  gantt.templates.tooltip_text = customTooltipText;

  // 高亮周末 - 使用普通函数
  gantt.templates.scale_cell_class = function (date) {
    const day = date.getDay();
    if (day === 0 || day === 6) {
      return 'weekend';
    }
  };
};

// 处理数据格式 - 适配后台返回的数据结构
const formatData = (treeList) => {
  if (!treeList || !Array.isArray(treeList)) return [];

  const result = [];

  treeList.forEach((item) => {
    // 判断是否有子任务结构
    if (item.child && item.child.length > 0) {
      // 父节点（工单级别）
      const allTimes = item.child.flatMap((t) => {
        const times = [];
        if (t.start_date) times.push(t.start_date);
        if (t.end_date) times.push(t.end_date);
        if (t.actual_start) times.push(t.actual_start);
        if (t.actual_end) times.push(t.actual_end);
        return times;
      });

      if (allTimes.length > 0) {
        const validTimes = allTimes.filter((t) => t);
        if (validTimes.length > 0) {
          const start = dayjs.min(...validTimes.map((d) => dayjs(d))).format('YYYY-MM-DD HH:mm:ss');
          const end = dayjs.max(...validTimes.map((d) => dayjs(d))).format('YYYY-MM-DD HH:mm:ss');

          result.push({
            id: item.id,
            text: item.text || item.projectName,
            salesOrderNo: item.salesOrderNo,
            salesItemNo: item.salesItemNo,
            workOrderNo: item.workOrderNo,
            start_date: start,
            end_date: end,
            parent: item.parent || 0,
            open: true,
            type: 'project',
            progress: item.progress || 0,
            workstation: item.workstation,
            process: item.process,
            planQuantity: item.planQuantity
          });
        }
      }

      // 子任务
      item.child.forEach((task) => {
        result.push({
          id: task.id,
          text: task.text,
          type: task.type || 'task',
          salesOrderNo: item.salesOrderNo,
          salesItemNo: item.salesItemNo,
          workOrderNo: item.workOrderNo,
          duration: task.duration,
          progress: task.progress,
          workstation: task.workstation,
          product: task.product,
          planQuantity: task.planQuantity,
          color: task.color,
          process: task.process,
          parent: task.parent || item.id,
          timeList: task.timeList,
          start_date: task.start_date,
          end_date: task.end_date,
          actual_start: task.actual_start,
          actual_end: task.actual_end
        });
      });
    } else {
      // 扁平结构,直接添加
      result.push({
        id: item.id,
        text: item.text,
        type: item.type || 'task',
        salesOrderNo: item.salesOrderNo,
        salesItemNo: item.salesItemNo,
        workOrderNo: item.workOrderNo,
        duration: item.duration,
        progress: item.progress,
        workstation: item.workstation,
        product: item.product,
        planQuantity: item.planQuantity,
        color: item.color,
        process: item.process,
        parent: item.parent || 0,
        timeList: item.timeList,
        start_date: item.start_date,
        end_date: item.end_date,
        actual_start: item.actual_start,
        actual_end: item.actual_end
      });
    }
  });

  return result;
};

// 使用防抖的数据更新方法
const updateData = (newTasks) => {
  if (updateTimer) {
    clearTimeout(updateTimer);
  }

  updateTimer = setTimeout(() => {
    if (!isInitialized) return;

    try {
      const formattedData = formatData(newTasks.data || []);

      gantt.batchUpdate(() => {
        gantt.clearAll();
        gantt.parse({
          data: formattedData,
          links: newTasks.links || []
        });
      });

      // 重新添加标记线
      const markers = gantt.config.markers || [];
      if (markers && markers.length > 0) {
        markers.forEach((marker) => gantt.deleteMarker(marker.id));
      }
      addTodayLine();

      gantt.render();
    } catch (error) {
      console.error('Gantt update error:', error);
    }
  }, 300);
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

  // 重新添加标记线
  try {
    const markers = gantt.config.markers || [];
    if (markers && markers.length > 0) {
      markers.forEach((marker) => {
        if (marker.id) {
          gantt.deleteMarker(marker.id);
        }
      });
    }
  } catch (e) {
    console.warn('清除标记线失败:', e);
  }

  addTodayLine();
  gantt.render();
};

onMounted(async () => {
  await nextTick();

  if (!ganttRef.value) return;

  try {
    // 先初始化配置
    initConfig();

    // 等待容器渲染完成并获取高度
    await nextTick();

    // 再初始化甘特图
    gantt.init(ganttRef.value);
    isInitialized = true;

    // 初始加载数据
    if (props.tasks && props.tasks.data && props.tasks.data.length > 0) {
      const formattedData = formatData(props.tasks.data);

      // 解析数据
      gantt.parse({
        data: formattedData,
        links: props.tasks.links || []
      });

      // 数据加载后，确保今天可见
      setTimeout(() => {
        if (!isInitialized) return;

        try {
          // 获取所有任务的时间范围
          const allDates = [];
          formattedData.forEach((task) => {
            if (task.start_date) allDates.push(dayjs(task.start_date));
            if (task.end_date) allDates.push(dayjs(task.end_date));
            if (task.actual_start) allDates.push(dayjs(task.actual_start));
            if (task.actual_end) allDates.push(dayjs(task.actual_end));
          });

          // 添加今天的日期
          const today = dayjs();
          allDates.push(today);

          if (allDates.length > 0) {
            const minDate = dayjs.min(...allDates);
            const maxDate = dayjs.max(...allDates);

            // 扩展时间范围：前后各加7天
            const startDate = minDate.subtract(7, 'day').toDate();
            const endDate = maxDate.add(7, 'day').toDate();

            // 设置显示范围
            gantt.config.start_date = startDate;
            gantt.config.end_date = endDate;

            // 重新渲染
            gantt.render();

            // 滚动到中间位置（今天的附近）
            gantt.showDate(today.toDate());
          }
        } catch (error) {
          console.warn('调整时间范围失败:', error);
        }
      }, 200);
    }

    // 确保添加今天标记线
    addTodayLine();

    emit('ready', { gantt });
  } catch (error) {
    console.error('Gantt initialization error:', error);
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
  if (updateTimer) {
    clearTimeout(updateTimer);
  }
  if (isInitialized) {
    gantt.destructor();
    isInitialized = false;
  }
});

defineExpose({
  reload,
  updateData
});
</script>

<style scoped>
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
  /*  flex: 1;*/
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.tip-container {
  padding: 6px 8px;
  line-height: 1.6;
  min-width: 250px;
}

.tip-container .tip-item {
  margin: 4px 0;
  border: none;
  border-top: 1px solid #eee;
}
</style>

<style>
@import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

.gantt_tree_icon.gantt_file,
.gantt_tree_icon.gantt_folder_open,
.gantt_tree_icon.gantt_folder_closed {
  width: 10px;
  background-image: none;
}

.gantt_task_line {
  height: 26px !important;
  line-height: 26px !important;
  margin-top: 3px;
  border: none !important;
  border-radius: 4px;
}

.gantt_task_line.gantt_milestone {
  border-radius: 0;
  width: 12px !important;
  height: 16px !important;
  border: none !important;
  background-color: inherit !important;
  background-size: cover;
}

.gantt_task_line.gantt_milestone .gantt_task_content {
  width: 12px;
  height: 16px;
  margin-left: 40px;
  transform: rotate(0deg) !important;
}

.transparent-bar {
  background: transparent !important;
  border: none !important;
}

.gantt_grid_data .gantt_row.odd:hover,
.gantt_grid_data .gantt_row:hover {
  background-color: #f3f1fe !important;
}

.gantt_grid_data .gantt_row.gantt_selected,
.gantt_grid_data .gantt_row.odd.gantt_selected,
.gantt_task_row.gantt_selected {
  background-color: #f3f1fe !important;
}

.gantt_task_row.gantt_selected .gantt_task_cell {
  border-right-color: #f3f1fe !important;
}

.gantt_marker {
  background-color: #f4ae05;
  opacity: 0.8;
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

::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
}

.gantt_tree_icon.gantt_close,
.gantt_tree_icon.gantt_open {
  background-image: none !important;
  position: relative;
}

/*
.gantt_layout_cell .gantt_hor_scroll {
  width: calc(100% - 500px) !important;
  left: 500px;
}
*/

.weekend {
  background: rgb(245, 247, 250) !important;
}

.gantt_grid_data {
  overflow-x: auto !important;
}
.gantt_grid_scale {
  position: relative !important;
  overflow: visible !important;
}
.gantt_cell {
  white-space: nowrap !important;
}

/* 文本一致宽度样式 */
.fix-width {
  display: grid;
  grid-template-columns: 80px 1fr; /* 左边文字宽度固定，右边内容自适应 */
  gap: 8px;
}

.fix-width span {
  text-align: justify; /* 可选：让左边文字两端对齐 */
  text-align-last: justify; /* 使最后一行也两端对齐 */
}

/* 让 Gantt 行内容全部垂直居中 */
.gantt_tree_content {
  display: flex;
  align-items: center !important;
  gap: 6px;
  height: 100%;
}
/* 父级：让图标 + 文字 同一行垂直居中 */
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
</style>
