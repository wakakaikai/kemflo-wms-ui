<template>
  <div class="android-panel-dialog">
    <aside class="android-panel-left">
      <div class="info-row">
        <span class="info-label">工单单号</span>
        <span class="info-value">{{ shopOrder || '-' }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">工序描述</span>
        <span class="info-value">{{ operationDesc || '-' }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">产品品号</span>
        <span class="info-value">{{ item || '-' }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">产品描述</span>
        <span class="info-value info-value-multiline">{{ productDesc || '-' }}</span>
      </div>
      <div class="info-row info-row-split">
        <div class="info-split-item">
          <span class="info-label">计划数量</span>
          <span class="info-value">{{ qtyToBuild ?? '-' }}</span>
        </div>
        <div class="info-split-item">
          <span class="info-label">已完成数量</span>
          <span class="info-value">{{ qtyDone ?? '-' }}</span>
        </div>
      </div>
      <div class="info-row info-row-split">
        <div class="info-split-item">
          <span class="info-label">标准人数</span>
          <span class="info-value">{{ formatCount(standardPersonNumber) }}</span>
        </div>
        <div class="info-split-item">
          <span class="info-label">实际人数</span>
          <span class="info-value">{{ formatCount(actualPersonNumber) }}</span>
        </div>
      </div>
      <div class="info-row">
        <span class="info-label">班别班次</span>
        <div class="info-value info-value-block">
          <el-select
            v-if="editableShift"
            :model-value="productionShift"
            placeholder="请选择班别班次"
            clearable
            filterable
            class="shift-select-full"
            @update:model-value="emit('update:productionShift', $event)"
          >
            <el-option
              v-for="shift in productionShiftList"
              :key="shift.shiftId"
              :label="formatShiftDetail(shift)"
              :value="shift.shiftId"
            />
          </el-select>
          <span v-else class="shift-display">{{ shiftDisplayText }}</span>
        </div>
      </div>
      <div class="info-row">
        <span class="info-label">开始时间</span>
        <div class="info-value info-value-inline">
          <el-date-picker
            v-if="editableStartTime"
            :model-value="startDateTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="start-time-picker"
            @update:model-value="emit('update:startDateTime', $event)"
          />
          <span v-else>{{ startDateTime || '-' }}</span>
        </div>
      </div>
    </aside>

    <section class="android-panel-right">
      <el-tabs v-model="innerTab" class="employee-tabs">
        <el-tab-pane :label="`依工单在线 (${shopOrderOnlineCount})`" name="shopOrder" />
        <el-tab-pane :label="`依工作中心在线 (${workCenterOnlineCount})`" name="workCenter" />
        <el-tab-pane v-if="showHistoryTab" label="员工上下线情况" name="history" />
      </el-tabs>

      <div v-if="innerTab !== 'history'" class="employee-work-area">
        <div class="employee-main">
          <div class="employee-input-row">
            <el-input
              :model-value="employeeCardInput"
              placeholder="刷卡或输入员工工号后回车"
              clearable
              @update:model-value="emit('update:employeeCardInput', $event)"
              @keyup.enter="emit('swipe-employee')"
            >
              <template #prepend>员工工号</template>
            </el-input>
            <div v-if="showModeToggle" class="mode-toggle">
              <button
                type="button"
                class="mode-btn"
                :class="{ 'is-active': employeeMode === 'online' }"
                title="上线模式"
                @click="emit('update:employeeMode', 'online')"
              >
                <el-icon><CirclePlusFilled /></el-icon>
                <span>上线</span>
              </button>
              <button
                type="button"
                class="mode-btn mode-btn-offline"
                :class="{ 'is-active': employeeMode === 'offline' }"
                title="下线模式"
                @click="emit('update:employeeMode', 'offline')"
              >
                <el-icon><RemoveFilled /></el-icon>
                <span>下线</span>
              </button>
            </div>
          </div>

          <div class="online-employee-list">
            <el-empty v-if="!displayOnlineEmployees.length" description="暂无在线员工" :image-size="48" />
            <button
              v-for="item in displayOnlineEmployees"
              :key="item.id"
              type="button"
              class="online-employee-card"
              @click="emit('select-online-employee', item)"
            >
              <el-icon><UserFilled /></el-icon>
              <div class="online-employee-meta">
                <strong>{{ item.employeeId }}</strong>
                <span>{{ item.employeeName || '-' }}</span>
                <small>{{ formatOnlineTime(item.onLineTime) }}</small>
              </div>
            </button>
          </div>
        </div>

        <div class="employee-favorites">
          <div class="panel-title">
            <span>收藏员工</span>
            <el-button link type="primary" icon="Plus" @click="emit('add-favorite')">收藏</el-button>
          </div>
          <el-table
            :data="employeeFavoriteList"
            height="280"
            highlight-current-row
            @current-change="(row: EmployeeFavorite | undefined) => emit('favorite-select', row)"
          >
            <el-table-column width="48">
              <template #default="{ row }">
                <el-radio :model-value="selectedEmployeeId" :label="row.employeeId" @change="emit('favorite-select', row)">&nbsp;</el-radio>
              </template>
            </el-table-column>
            <el-table-column label="员工工号" prop="employeeId" min-width="100" />
            <el-table-column label="姓名" prop="employeeName" min-width="80" />
          </el-table>
        </div>
      </div>

      <div v-else class="employee-history-panel">
        <el-table :data="reportEmployeeList" height="360">
          <el-table-column label="工号" prop="employeeId" width="110" />
          <el-table-column label="姓名" prop="employeeName" width="100" />
          <el-table-column label="上线时间" prop="onLineTime" min-width="150" />
          <el-table-column label="下线时间" prop="offLineTime" min-width="150" />
          <el-table-column label="有效时长(分钟)" prop="effectiveDuration" width="130" />
        </el-table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { CirclePlusFilled, RemoveFilled, UserFilled } from '@element-plus/icons-vue';
import { computed } from 'vue';
import type { ShopOrderReportEmployeeVO } from '@/api/mes/shopOrderReportEmployee/types';
import type { WorkCenterEmployeeBindingVO, WorkPanelProductionShiftVO } from '@/api/mes/workpanel/types';
import { formatShiftDetail } from '@/views/mes/workpanel/utils/workPanelShift';

type EmployeeFavorite = {
  employeeId: string;
  employeeName: string;
};

const props = withDefaults(
  defineProps<{
    shopOrder?: string;
    operationDesc?: string;
    item?: string;
    productDesc?: string;
    qtyToBuild?: number | string;
    qtyDone?: number | string;
    standardPersonNumber?: number | string;
    actualPersonNumber?: number | string;
    productionShift?: string;
    productionShiftList: WorkPanelProductionShiftVO[];
    startDateTime?: string;
    editableShift?: boolean;
    editableStartTime?: boolean;
    shopOrderOnlineEmployees: WorkCenterEmployeeBindingVO[];
    workCenterOnlineEmployees: WorkCenterEmployeeBindingVO[];
    reportEmployeeList?: ShopOrderReportEmployeeVO[];
    employeeFavoriteList: EmployeeFavorite[];
    employeeCardInput?: string;
    selectedEmployeeId?: string;
    employeeMode?: 'online' | 'offline';
    showModeToggle?: boolean;
    showHistoryTab?: boolean;
    activeTab?: 'shopOrder' | 'workCenter' | 'history';
  }>(),
  {
    shopOrder: '',
    operationDesc: '',
    item: '',
    productDesc: '',
    productionShift: '',
    productionShiftList: () => [],
    startDateTime: '',
    editableShift: false,
    editableStartTime: false,
    shopOrderOnlineEmployees: () => [],
    workCenterOnlineEmployees: () => [],
    reportEmployeeList: () => [],
    employeeFavoriteList: () => [],
    employeeCardInput: '',
    selectedEmployeeId: '',
    employeeMode: 'online',
    showModeToggle: true,
    showHistoryTab: true,
    activeTab: 'shopOrder'
  }
);

const emit = defineEmits<{
  'update:productionShift': [value: string];
  'update:startDateTime': [value: string];
  'update:employeeCardInput': [value: string];
  'update:employeeMode': [value: 'online' | 'offline'];
  'update:activeTab': [value: 'shopOrder' | 'workCenter' | 'history'];
  'swipe-employee': [];
  'favorite-select': [row?: EmployeeFavorite];
  'add-favorite': [];
  'select-online-employee': [row: WorkCenterEmployeeBindingVO];
}>();

const innerTab = computed({
  get: () => props.activeTab,
  set: (value: 'shopOrder' | 'workCenter' | 'history') => emit('update:activeTab', value)
});

const selectedShift = computed(() => props.productionShiftList.find((item) => item.shiftId === props.productionShift));

const shiftDisplayText = computed(() => {
  if (!selectedShift.value) {
    return props.productionShift || '-';
  }
  return formatShiftDetail(selectedShift.value);
});

const shopOrderOnlineCount = computed(() => `${props.shopOrderOnlineEmployees.length}`);

const workCenterOnlineCount = computed(() => props.workCenterOnlineEmployees.length.toFixed(2));

const displayOnlineEmployees = computed(() =>
  innerTab.value === 'workCenter' ? props.workCenterOnlineEmployees : props.shopOrderOnlineEmployees
);

const formatCount = (value?: number | string) => {
  if (value === undefined || value === null || value === '') return '-';
  const num = Number(value);
  return Number.isNaN(num) ? String(value) : num.toFixed(2);
};

const formatOnlineTime = (value?: string) => {
  if (!value) return '-';
  const normalized = value.replace(/-/g, '/');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num: number) => `${num}`.padStart(2, '0');
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
</script>

<style scoped>
.android-panel-dialog {
  display: grid;
  grid-template-columns: minmax(300px, 42%) minmax(0, 58%);
  gap: 0;
  min-height: 420px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  overflow: hidden;
}

.android-panel-left {
  padding: 14px 16px;
  border-right: 1px solid #e5e7eb;
  background: #fff;
}

.android-panel-right {
  min-width: 0;
  padding: 8px 12px 12px;
  background: #fafafa;
}

.info-row {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 10px 0;
  border-bottom: 1px solid #eef2f7;
}

.info-row-split {
  grid-template-columns: 1fr;
  gap: 8px;
}

.info-split-item {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 10px;
}

.info-label {
  color: #64748b;
  font-size: 13px;
  line-height: 22px;
}

.info-value {
  color: #111827;
  font-size: 14px;
  line-height: 22px;
  word-break: break-word;
}

.info-value-multiline {
  max-height: 66px;
  overflow: auto;
}

.info-value-block,
.info-value-inline {
  min-width: 0;
}

.shift-select-full,
.start-time-picker {
  width: 100%;
}

.shift-display {
  display: block;
  padding: 6px 0;
  color: #111827;
  font-size: 13px;
  line-height: 20px;
}

.employee-tabs :deep(.el-tabs__header) {
  margin-bottom: 10px;
}

.employee-work-area {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 200px;
  gap: 12px;
  min-height: 320px;
  align-items: start;
}

.employee-favorites {
  min-width: 0;
  max-width: 200px;
}

.employee-main {
  min-width: 0;
  padding: 10px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #fff;
}

.employee-input-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.mode-toggle {
  display: flex;
  gap: 8px;
}

.mode-btn {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 54px;
  height: 54px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  color: #6b7280;
  cursor: pointer;
}

.mode-btn .el-icon {
  font-size: 22px;
}

.mode-btn span {
  font-size: 12px;
}

.mode-btn.is-active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #15803d;
}

.mode-btn-offline.is-active {
  border-color: #ef4444;
  background: #fef2f2;
  color: #dc2626;
}

.online-employee-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;
  margin-top: 12px;
  min-height: 220px;
  align-content: start;
}

.online-employee-card {
  display: flex;
  gap: 8px;
  min-width: 0;
  padding: 10px 8px;
  border: 1px solid #dcfce7;
  border-radius: 8px;
  background: #f0fdf4;
  color: #15803d;
  text-align: left;
  cursor: pointer;
}

.online-employee-card .el-icon {
  margin-top: 2px;
  font-size: 24px;
}

.online-employee-meta {
  min-width: 0;
}

.online-employee-meta strong,
.online-employee-meta span,
.online-employee-meta small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.online-employee-meta span,
.online-employee-meta small {
  color: #6b7280;
  font-size: 12px;
}

.employee-favorites,
.employee-history-panel {
  min-width: 0;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #fff;
  padding: 8px;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 960px) {
  .android-panel-dialog {
    grid-template-columns: 1fr;
  }

  .android-panel-left {
    border-right: 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .employee-work-area {
    grid-template-columns: 1fr;
  }
}
</style>
