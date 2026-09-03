<template>
  <div v-loading="loading" class="complete-panel-shell">
    <div class="android-panel-dialog complete-panel-dialog">
      <aside class="android-panel-left">
        <div class="info-row">
          <span class="info-label">产品描述</span>
          <span class="info-value info-value-multiline">{{ data.productDesc || '-' }}</span>
        </div>
        <div class="info-row info-row-split">
          <div class="info-split-item">
            <span class="info-label">计划数量</span>
            <span class="info-value">{{ data.qtyToBuild ?? '-' }}</span>
          </div>
          <div class="info-split-item">
            <span class="info-label">已报工数量</span>
            <span class="info-value">{{ data.qtyReported ?? 0 }}</span>
          </div>
        </div>
        <div class="info-row">
          <span class="info-label">理论产量</span>
          <span class="info-value">{{ formatCount(data.theoryOutput) }}</span>
        </div>
        <div class="info-row info-row-split">
          <div class="info-split-item">
            <span class="info-label">良品数量</span>
            <el-input-number
              v-if="!data.qtyReportReadOnly"
              :model-value="data.qtyReport"
              :min="0"
              :precision="3"
              controls-position="right"
              class="qty-input"
              :class="{ 'qty-input-danger': !data.qtyReport }"
              @update:model-value="emit('update:qtyReport', Number($event || 0))"
            />
            <span v-else class="info-value" :class="{ 'qty-readonly-danger': !data.qtyReport }">
              {{ formatCount(data.qtyReport) }}
            </span>
          </div>
          <div class="info-split-item">
            <span class="info-label">不良数量</span>
            <el-input-number
              :model-value="data.qtyScrapped"
              :min="0"
              :precision="3"
              controls-position="right"
              class="qty-input"
              @update:model-value="emit('update:qtyScrapped', Number($event || 0))"
            />
          </div>
        </div>
        <div class="info-row info-row-split">
          <div class="info-split-item">
            <span class="info-label">标准人数</span>
            <span class="info-value">{{ formatCount(data.standardPersonNumber) }}</span>
          </div>
          <div class="info-split-item">
            <span class="info-label">实际平均人数</span>
            <span class="info-value">{{ formatCount(data.actualPersonNumber) }}</span>
          </div>
        </div>
        <div class="info-row">
          <span class="info-label">班别班次</span>
          <span class="info-value shift-display">{{ data.shiftDisplay || data.productionShift || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">开工时间</span>
          <span class="info-value">{{ data.startDateTime || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">完工时间</span>
          <div class="info-value info-value-inline">
            <el-date-picker
              :model-value="data.endDateTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              class="start-time-picker"
              @update:model-value="emit('update:endDateTime', $event)"
            />
          </div>
        </div>
        <div class="info-row info-row-split">
          <div class="info-split-item">
            <span class="info-label">起迄时长</span>
            <span class="info-value">{{ formatCount(data.totalDuration) }}</span>
          </div>
          <div class="info-split-item">
            <span class="info-label">休息时长</span>
            <el-input-number
              :model-value="data.restDuration"
              :min="0"
              :precision="2"
              controls-position="right"
              class="qty-input"
              @update:model-value="emit('update:restDuration', Number($event || 0))"
            />
          </div>
        </div>
      </aside>

      <section class="android-panel-right">
        <el-tabs v-model="innerTab" class="employee-tabs">
          <el-tab-pane label="待报工条码" name="barcode" />
          <el-tab-pane label="例外时间明细" name="exception" />
          <el-tab-pane :label="`员工打卡信息 (${data.reportEmployeeList?.length || 0})`" name="employee" />
        </el-tabs>

        <div v-if="innerTab === 'barcode'" class="complete-tab-panel">
          <el-table :data="data.pendingBarcodeList || []" height="320" empty-text="暂无待报工条码" :row-class-name="resolveBarcodeRowClass">
            <el-table-column label="" width="48">
              <template #default="{ row }">
                <el-checkbox
                  :model-value="row.checked"
                  :disabled="!row.selectable"
                  @change="(value) => handleBarcodeChange(row.type, value)"
                />
              </template>
            </el-table-column>
            <el-table-column label="项目" prop="item" min-width="120" />
            <el-table-column label="起始时间" prop="startTime" min-width="150" />
            <el-table-column label="截止时间" prop="endTime" min-width="150" />
            <el-table-column label="数量" prop="qty" width="90" />
          </el-table>
          <div class="barcode-legend">
            <span class="legend-item legend-required">红色：必选项（报工起迄时间之间发生）</span>
            <span class="legend-item legend-optional">橙色：可选项（报工开始时间之前发生）</span>
            <span class="legend-item legend-disabled">灰色：不可选项（报工结束时间之后发生）</span>
          </div>
        </div>

        <div v-else-if="innerTab === 'exception'" class="complete-tab-panel">
          <el-table :data="data.exceptionTimeList || []" height="320" empty-text="暂无例外时间明细">
            <el-table-column label="例外类型" min-width="120">
              <template #default="{ row }">
                {{ row.typeDesc || row.type || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="开始时间" prop="startTime" min-width="150" />
            <el-table-column label="结束时间" prop="endTime" min-width="150" />
            <el-table-column label="时长(分钟)" prop="duration" width="110" />
          </el-table>
        </div>

        <div v-else class="complete-tab-panel">
          <el-table :data="data.reportEmployeeList || []" height="320" empty-text="暂无员工打卡信息">
            <el-table-column label="工号" prop="employeeId" width="110" />
            <el-table-column label="姓名" prop="employeeName" width="100" />
            <el-table-column label="上线时间" prop="onLineTime" min-width="150" />
            <el-table-column label="下线时间" prop="offLineTime" min-width="150" />
            <el-table-column label="出勤时长(分钟)" prop="duration" width="130" />
            <el-table-column label="有效时长(分钟)" prop="effectiveDuration" width="130" />
          </el-table>
        </div>
      </section>
    </div>

    <div class="complete-kpi-bar">
      <div class="kpi-item" :class="{ 'is-danger': Number(data.goodRate || 0) <= 0 }">
        <span>良品率</span>
        <strong>{{ formatPercent(data.goodRate) }}</strong>
      </div>
      <div class="kpi-item">
        <span>时间稼动率</span>
        <strong>{{ formatPercent(data.timeRate) }}</strong>
      </div>
      <div class="kpi-item" :class="{ 'is-danger': Number(data.speedRate || 0) <= 0 }">
        <span>速度稼动率</span>
        <strong>{{ formatPercent(data.speedRate) }}</strong>
      </div>
      <div class="kpi-item" :class="{ 'is-danger': Number(data.oeeRate || 0) <= 0 }">
        <span>综合效率OEE</span>
        <strong>{{ formatPercent(data.oeeRate) }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { WorkPanelCompletePrepareVO } from '@/api/mes/workpanel/types';

const props = withDefaults(
  defineProps<{
    data: WorkPanelCompletePrepareVO;
    loading?: boolean;
    activeTab?: 'barcode' | 'exception' | 'employee';
  }>(),
  {
    data: () => ({}),
    loading: false,
    activeTab: 'barcode'
  }
);

const emit = defineEmits<{
  'update:qtyReport': [value: number];
  'update:qtyScrapped': [value: number];
  'update:endDateTime': [value: string];
  'update:restDuration': [value: number];
  'update:activeTab': [value: 'barcode' | 'exception' | 'employee'];
  toggleBarcode: [type: number | undefined, checked: boolean];
}>();

const innerTab = computed({
  get: () => props.activeTab,
  set: (value: 'barcode' | 'exception' | 'employee') => emit('update:activeTab', value)
});

const formatCount = (value?: number | string) => {
  if (value === undefined || value === null || value === '') return '-';
  const num = Number(value);
  return Number.isNaN(num) ? String(value) : num.toFixed(2);
};

const formatPercent = (value?: number | string) => {
  if (value === undefined || value === null || value === '') return '0.00%';
  const num = Number(value);
  return Number.isNaN(num) ? '0.00%' : `${num.toFixed(2)}%`;
};

const resolveBarcodeRowClass = ({ row }: { row: { selectType?: string } }) => {
  if (row.selectType === 'required') return 'barcode-row-required';
  if (row.selectType === 'disabled') return 'barcode-row-disabled';
  return 'barcode-row-optional';
};

const handleBarcodeChange = (type: number | undefined, value: string | number | boolean) => {
  emit('toggleBarcode', type, Boolean(value));
};
</script>

<style scoped>
.complete-panel-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.complete-panel-dialog {
  min-height: 460px;
}

.android-panel-dialog {
  display: grid;
  grid-template-columns: minmax(320px, 42%) minmax(0, 58%);
  gap: 0;
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
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 9px 0;
  border-bottom: 1px solid #eef2f7;
}

.info-row-split {
  grid-template-columns: 1fr;
  gap: 8px;
}

.info-split-item {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
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
  max-height: 72px;
  overflow: auto;
}

.info-value-inline,
.start-time-picker,
.qty-input {
  width: 100%;
}

.shift-display {
  display: block;
  font-size: 13px;
  line-height: 20px;
}

.qty-input-danger :deep(.el-input__inner) {
  color: #ef4444;
}

.qty-readonly-danger {
  color: #ef4444;
}

:deep(.barcode-row-required) {
  color: #ef4444;
}

:deep(.barcode-row-optional) {
  color: #f97316;
}

:deep(.barcode-row-disabled) {
  color: #9ca3af;
}

.employee-tabs :deep(.el-tabs__header) {
  margin-bottom: 8px;
}

.complete-tab-panel {
  min-height: 320px;
}

.barcode-legend {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 10px;
  font-size: 12px;
}

.legend-item {
  line-height: 18px;
}

.legend-required {
  color: #ef4444;
}

.legend-optional {
  color: #f97316;
}

.legend-disabled {
  color: #9ca3af;
}

.complete-kpi-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.kpi-item {
  padding: 10px 12px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #fff;
  text-align: center;
}

.kpi-item span {
  display: block;
  color: #64748b;
  font-size: 12px;
}

.kpi-item strong {
  display: block;
  margin-top: 4px;
  color: #111827;
  font-size: 18px;
  line-height: 24px;
}

.kpi-item.is-danger strong {
  color: #ef4444;
}

@media (max-width: 960px) {
  .android-panel-dialog {
    grid-template-columns: 1fr;
  }

  .android-panel-left {
    border-right: 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .complete-kpi-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
