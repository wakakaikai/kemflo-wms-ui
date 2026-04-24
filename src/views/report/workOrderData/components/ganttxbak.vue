<template>
  <div ref="ganttRef"></div>
</template>

<script setup>
import gantt from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';

const props = defineProps({
  tasks: {
    type: Object,
    default: () => ({ data: [], links: [] })
  },
  optType: {
    type: String,
    default: () => 'view'
  },
  ids: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:ids']);

const ganttRef = ref(null);
let isInitialized = false;
let updateTimer = null;

const addTodayLine = () => {
  const date_to_str = gantt.date.date_to_str(gantt.config.task_date);
  const today = new Date();
  gantt.addMarker({
    start_date: today,
    css: 'today',
    text: '今天',
    title: '今天: ' + date_to_str(today)
  });
};

const initConfig = () => {
  gantt.config.readonly = props.optType === 'view';
  gantt.config.duration_unit = 'hour';
  gantt.config.duration_step = 8;
  gantt.config.grid_width = 520;

  gantt.config.columns = [
    { name: 'text', label: '料号', tree: true, width: '200' },
    { name: 'workstation', label: '工单号', align: 'center', width: '*' },
    { name: 'process', label: '工序', align: 'center', width: '*' },
    { name: 'start_date', label: '开始时间', align: 'center', width: '*' },
    { name: 'end_date', label: '结束时间', align: 'center', width: '*' }
  ];

  gantt.i18n.setLocale('cn');

  gantt.plugins({
    tooltip: true,
    marker: true
  });

  gantt.templates.tooltip_text = (start, end, task) => {
    const progress = Math.round(task.progress * 100) + '%';
    if (task.type === 'project') {
      return `<b>生产工单:</b> ${task.text} <span>完成比例:${progress}</span>`;
    } else {
      return `<b>生产任务:</b> ${task.process} ${task.text} <span>完成比例:${progress}</span>`;
    }
  };

  gantt.config.open_tree_initially = true;

  gantt.templates.task_text = (start, end, task) => {
    const progress = Math.round(task.progress * 100) + '%';
    if (task.type === 'project') {
      return `<b>生产工单:</b> ${task.text} <span>完成比例:${progress}</span>`;
    } else {
      return `<b>生产任务:</b> ${task.process} ${task.text} <span>完成比例:${progress}</span>`;
    }
  };

  gantt.config.show_task_cells = true;

  const weekScaleTemplate = (date) => {
    const dateToStr = gantt.date.date_to_str('%M %d');
    const endDate = gantt.date.add(gantt.date.add(date, 1, 'week'), -1, 'day');
    return dateToStr(date) + ' - ' + dateToStr(endDate);
  };

  const dayTemplate = (date) => {
    const dateToStr = gantt.date.date_to_str('%M %d');
    return dateToStr(date);
  };

  const daysStyle = (date) => {
    if (date.getDay() === 0 || date.getDay() === 6) return 'weekend';
    return '';
  };

  gantt.config.scales = [
    { unit: 'week', step: 1, format: weekScaleTemplate },
    { unit: 'day', step: 1, format: dayTemplate, css: daysStyle },
    { unit: 'hour', step: 8, format: '%H:%i' }
  ];

  gantt.config.scale_height = 50;
  gantt.config.xml_date = '%Y-%m-%d %H:%i:%s';

  gantt.config.auto_types = false;
  gantt.config.drag_progress = false;
  gantt.config.drag_move = true;
  gantt.config.drag_links = false;
  gantt.config.drag_resize = true;
  gantt.config.details_on_create = true;
  gantt.config.details_on_dblclick = true;
  gantt.config.fit_tasks = true;

  gantt.config.smart_rendering = true;
  gantt.config.dynamic_loading = true;
  gantt.config.preserve_scroll = true;

  // 限制同时渲染的任务数
  gantt.config.max_task_height = 30;
  gantt.config.row_height = 35;

  // 只绑定一次事件
  if (!isInitialized) {
    gantt.attachEvent('onAfterTaskUpdate', (id) => {
      if (!props.ids.includes(id)) {
        const newIds = [...props.ids, id];
        emit('update:ids', newIds);
      }
    });
  }
};

// 使用防抖的数据更新方法
const updateData = (newTasks) => {
  if (updateTimer) {
    clearTimeout(updateTimer);
  }

  updateTimer = setTimeout(() => {
    if (!isInitialized) return;

    try {
      // 使用批量更新,避免频繁渲染
      gantt.batchUpdate(() => {
        gantt.clearAll();
        gantt.parse(newTasks);
      });

      // 重新添加标记线
      const markers = gantt.getMarkers();
      if (markers && markers.length > 0) {
        markers.forEach((marker) => gantt.deleteMarker(marker.id));
      }
      addTodayLine();

      gantt.render();
    } catch (error) {
      console.error('Gantt update error:', error);
    }
  }, 300); // 300ms防抖
};

const reload = () => {
  if (!isInitialized) return;

  gantt.batchUpdate(() => {
    gantt.clearAll();
    gantt.parse(props.tasks);
  });

  const markers = gantt.getMarkers();
  if (markers && markers.length > 0) {
    markers.forEach((marker) => gantt.deleteMarker(marker.id));
  }
  addTodayLine();
  gantt.render();
};

onMounted(async () => {
  await nextTick();

  if (!ganttRef.value) return;

  initConfig();
  gantt.init(ganttRef.value);
  isInitialized = true;

  // 初始加载数据
  if (props.tasks && props.tasks.data && props.tasks.data.length > 0) {
    gantt.parse(props.tasks);
  }

  addTodayLine();
});

// 优化watch,避免深度监听导致的性能问题
watch(
  () => props.tasks,
  (newTasks) => {
    if (isInitialized && newTasks) {
      updateData(newTasks);
    }
  },
  { deep: false } // 改为浅监听,只监听引用变化
);

watch(
  () => props.optType,
  (newType) => {
    if (isInitialized) {
      gantt.config.readonly = newType === 'view';
      gantt.refreshData();
    }
  }
);

// 组件卸载时清理
onBeforeUnmount(() => {
  if (updateTimer) {
    clearTimeout(updateTimer);
  }
  if (isInitialized) {
    gantt.destructor();
    isInitialized = false;
  }
});

// 暴露方法给父组件
defineExpose({
  reload,
  updateData
});
</script>

<style>
@import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

.gantt_tree_icon.gantt_file,
.gantt_tree_icon.gantt_folder_open,
.gantt_tree_icon.gantt_folder_closed {
  width: 10px;
  background-image: none;
}

.gantt_task_line {
  height: 16px !important;
  line-height: 16px !important;
  margin-top: 8px;
  border: none !important;
  border-radius: 8px;
}

.gantt_task_line.gantt_milestone {
  border-radius: 0;
}

.gantt_task_line.gantt_milestone {
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
  background-image: url('../../../../assets/logo/logo.png') !important;
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

.gantt-wrapper ::-webkit-scrollbar {
  width: 14px;
  height: 6px;
}

.gantt-wrapper ::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 5px;
}

.gantt-wrapper ::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
}

.gantt-wrapper ::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
}

.gantt_tree_icon.gantt_close,
.gantt_tree_icon.gantt_open {
  background-image: none !important;
  position: relative;
}

.gantt_layout_cell .gantt_hor_scroll {
  width: calc(100% - 199px) !important;
  left: 199px;
}

.scaleStyle {
  height: 20px;
}

.weekend {
  background: rgb(189, 185, 186) !important;
  width: 30px;
}

/* 计划任务样式 */
.gantt_task_line.planned-task {
  background: linear-gradient(to right, #409eff, #66b1ff);
  opacity: 0.7;
}

/* 实际任务样式 */
.gantt_task_line.actual-task {
  background: linear-gradient(to right, #67c23a, #85ce61);
  border: 2px solid #67c23a;
}

/* 延迟任务样式 */
.gantt_task_line.delayed-task {
  background: linear-gradient(to right, #f56c6c, #f78989);
}

.actual-info {
  font-size: 12px;
  color: #67c23a;
  padding: 2px 5px;
}
</style>
