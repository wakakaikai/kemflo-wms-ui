<template>
  <div class="p-2 work-complete-page">
    <div class="work-complete-header">
      <div class="header-main">
        <el-button class="back-button" circle icon="ArrowLeft" @click="goBack" />
        <div class="header-icon">
          <el-icon>
            <CircleCheckFilled />
          </el-icon>
        </div>
        <div>
          <h2 class="work-complete-title">完工汇报</h2>
          <p>核对生产数量、工时与人员信息后完成本次报工</p>
        </div>
      </div>
      <div class="report-badge">
        <span>开工记录</span>
        <strong>#{{ reportId || '-' }}</strong>
      </div>
    </div>

    <el-card shadow="never" class="work-complete-card">
      <div v-loading="completePrepareLoading" class="complete-panel-shell is-page-layout">
        <div class="android-panel-dialog complete-panel-dialog">
          <aside class="android-panel-left">
            <div class="info-section-title"><span>基础信息</span></div>
            <div class="info-row info-row-split">
              <div class="info-split-item">
                <span class="info-label">工单单号</span><strong class="info-value info-value-strong">{{ completePrepare.shopOrder || '-' }}</strong>
              </div>
              <div class="info-split-item">
                <span class="info-label">产品品号</span><span class="info-value">{{ completePrepare.item || '-' }}</span>
              </div>
            </div>
            <div class="info-row">
              <span class="info-label">工序描述</span><span class="info-value">{{ completePrepare.operationDesc || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">产品描述</span><span class="info-value info-value-multiline">{{ completePrepare.productDesc || '-' }}</span>
            </div>
            <div class="info-section-title"><span>生产数据</span></div>
            <div class="info-row info-row-split numeric-row">
              <div class="info-split-item">
                <span class="info-label">计划数量</span><span class="info-value">{{ formatIntegerValue(completePrepare.qtyToBuild) }}</span>
              </div>
              <div class="info-split-item">
                <span class="info-label">已报工数量</span><span class="info-value">{{ formatIntegerValue(completePrepare.qtyReported) }}</span>
              </div>
            </div>
            <div class="info-row info-row-split numeric-row">
              <div class="info-split-item">
                <span class="info-label">理论产量</span><span class="info-value">{{ formatCount(completePrepare.theoryOutput) }}</span>
              </div>
              <div class="info-split-item">
                <span class="info-label">良品数量</span>
                <el-input-number v-if="!completePrepare.qtyReportReadOnly" :model-value="completePrepare.qtyReport" :min="0" :precision="0" :step="1" controls-position="right" class="qty-input" :class="{ 'qty-input-danger': !completePrepare.qtyReport }" @update:model-value="handleCompleteFieldChange('qtyReport', Number($event || 0))" />
                <span v-else class="info-value" :class="{ 'qty-readonly-danger': !completePrepare.qtyReport }">{{ formatIntegerValue(completePrepare.qtyReport) }}</span>
              </div>
            </div>
            <div class="info-row info-row-split numeric-row">
              <div class="info-split-item">
                <span class="info-label">不良数量</span>
                <el-input-number :model-value="completePrepare.qtyScrapped" :min="0" :precision="0" :step="1" controls-position="right" class="qty-input" @update:model-value="handleCompleteFieldChange('qtyScrapped', Number($event || 0))" />
              </div>
              <div class="info-split-item">
                <span class="info-label">标准/实际人数</span><span class="info-value">{{ formatCount(completePrepare.standardPersonNumber) }} / {{ formatCount(completePrepare.actualPersonNumber) }}</span>
              </div>
            </div>
            <div class="info-row">
              <span class="info-label">班别班次</span><span class="info-value shift-display">{{ completePrepare.shiftDisplay || completePrepare.productionShift || '-' }}</span>
            </div>
            <div class="info-row info-row-split time-row">
              <div class="info-split-item">
                <span class="info-label">开工时间</span><span class="info-value">{{ completePrepare.startDateTime || '-' }}</span>
              </div>
              <div class="info-split-item">
                <span class="info-label">完工时间</span>
                <el-date-picker :model-value="completePrepare.endDateTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" class="start-time-picker" :disabled-date="disabledEndDate" :disabled-hours="disabledEndHours" :disabled-minutes="disabledEndMinutes" :disabled-seconds="disabledEndSeconds" @update:model-value="handleCompleteFieldChange('endDateTime', $event)" style="margin-left: -30px" />
              </div>
            </div>
            <div class="info-section-title"><span>工时统计</span></div>
            <div class="info-row info-row-split compact-row">
              <div class="info-split-item">
                <span class="info-label">起迄时长</span><span class="info-value">{{ formatCount(completePrepare.totalDuration) }}</span>
              </div>
              <div class="info-split-item">
                <span class="info-label">休息时长</span><span class="info-value readonly-value">{{ formatCount(completePrepare.restDuration) }}</span>
              </div>
            </div>
            <div class="info-row info-row-split compact-row">
              <div class="info-split-item">
                <span class="info-label">操作时间</span><span class="info-value">{{ formatCount(completePrepare.operationDuration) }}</span>
              </div>
              <div class="info-split-item">
                <span class="info-label">例外时间</span><span class="info-value metric-danger">{{ formatCount(completePrepare.abnormalDuration) }}</span>
              </div>
            </div>
            <div class="info-row compact-row">
              <span class="info-label">有效时间</span><span class="info-value">{{ formatCount(completePrepare.effectiveDuration) }}</span>
            </div>
            <div class="info-section-title"><span>产能与人时</span></div>
            <div class="info-row info-row-split compact-row">
              <div class="info-split-item">
                <span class="info-label">标准产能</span><strong class="info-value capacity-value">{{ formatCount(completePrepare.standardCapacity) }}</strong>
              </div>
              <div class="info-split-item">
                <span class="info-label">实际产能</span><span class="info-value">{{ formatCount(actualCapacity) }}</span>
              </div>
            </div>
            <div class="info-row info-row-split compact-row">
              <div class="info-split-item">
                <span class="info-label">理论时间</span><span class="info-value">{{ formatCount(theoryDuration) }}</span>
              </div>
              <div class="info-split-item">
                <span class="info-label">实际时间</span><span class="info-value">{{ formatCount(completePrepare.effectiveDuration) }}</span>
              </div>
            </div>
            <div class="info-row info-row-split compact-row">
              <div class="info-split-item">
                <span class="info-label">员工出勤人时</span><strong class="info-value metric-emphasis">{{ formatCount(employeeAttendanceTime) }}</strong>
              </div>
              <div class="info-split-item">
                <span class="info-label">员工操作人时</span><strong class="info-value metric-emphasis">{{ formatCount(employeeOperationTime) }}</strong>
              </div>
            </div>
            <div class="info-row info-row-split compact-row">
              <div class="info-split-item">
                <span class="info-label">实际有效人时</span><strong class="info-value metric-emphasis">{{ formatCount(completePrepare.personTime) }}</strong>
              </div>
              <div class="info-split-item">
                <span class="info-label">理论人时</span><span class="info-value">{{ formatCount(theoryPersonTime) }}</span>
              </div>
            </div>
          </aside>

          <section class="android-panel-right">
            <el-tabs v-model="completePanelTab" class="employee-tabs">
              <el-tab-pane label="待报工条码" name="barcode" />
              <el-tab-pane label="例外时间明细" name="exception" />
              <el-tab-pane :label="`员工打卡信息 (${completePrepare.reportEmployeeList?.length || 0})`" name="employee" />
            </el-tabs>

            <div v-if="completePanelTab === 'barcode'" class="complete-tab-panel">
              <el-table :data="completePrepare.pendingBarcodeList || []" :height="completeTableHeight" empty-text="暂无待报工条码" :row-class-name="resolveBarcodeRowClass">
                <el-table-column label="" width="48">
                  <template #default="{ row }">
                    <el-checkbox :model-value="row.checked" :disabled="!row.selectable" @change="(value) => handleBarcodeToggle(row.type, Boolean(value))" />
                  </template>
                </el-table-column>
                <el-table-column label="项目" prop="item" min-width="120" />
                <el-table-column label="起始时间" prop="startTime" min-width="150" />
                <el-table-column label="截止时间" prop="endTime" min-width="150" />
                <el-table-column label="数量" prop="qty" width="90" align="right" :formatter="formatInteger" />
              </el-table>
              <div class="barcode-legend">
                <span class="legend-item legend-required">红色：必选项（报工起迄时间之间发生）</span>
                <span class="legend-item legend-optional">橙色：可选项（报工开始时间之前发生）</span>
                <span class="legend-item legend-disabled">灰色：不可选项（报工结束时间之后发生）</span>
              </div>
            </div>

            <div v-else-if="completePanelTab === 'exception'" class="complete-tab-panel">
              <el-table :data="completePrepare.exceptionTimeList || []" :height="completeTableHeight" empty-text="暂无例外时间明细">
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
              <el-table :data="completePrepare.reportEmployeeList || []" :height="completeTableHeight" empty-text="暂无员工打卡信息">
                <el-table-column label="工号" prop="employeeId" width="110" fixed="left" />
                <el-table-column label="姓名" prop="employeeName" width="100" fixed="left" />
                <el-table-column label="上线时间" prop="onLineTime" min-width="180" class-name="datetime-column" />
                <el-table-column label="下线时间" prop="offLineTime" min-width="180" class-name="datetime-column" />
                <el-table-column label="出勤时长(分钟)" prop="duration" width="130" />
                <el-table-column label="操作时长(分钟)" prop="operationDuration" width="130" />
                <el-table-column label="有效时长(分钟)" prop="effectiveDuration" width="130" />
              </el-table>
            </div>
          </section>
        </div>

        <div class="complete-summary-bar">
          <div class="complete-kpi-area">
            <div class="complete-kpi-bar">
              <div class="kpi-item" :class="rateLevelClass(completePrepare.goodRate)">
                <span>良品率</span>
                <strong>{{ formatPercent(completePrepare.goodRate) }}</strong>
              </div>
              <div class="kpi-item" :class="rateLevelClass(completePrepare.timeRate)">
                <span>时间稼动率</span>
                <strong>{{ formatPercent(completePrepare.timeRate) }}</strong>
              </div>
              <div class="kpi-item" :class="rateLevelClass(completePrepare.speedRate)">
                <span>速度稼动率</span>
                <strong>{{ formatPercent(completePrepare.speedRate) }}</strong>
              </div>
              <div class="kpi-item" :class="rateLevelClass(completePrepare.oeeRate)">
                <span>综合效率OEE</span>
                <strong>{{ formatPercent(completePrepare.oeeRate) }}</strong>
              </div>
            </div>
            <!--        <div class="rate-legend" aria-label="指标颜色范围">
          <span><i class="legend-dot is-danger"></i>红色：&lt; 60%</span>
          <span><i class="legend-dot is-warning"></i>黄色：60%～&lt; 85%</span>
          <span><i class="legend-dot is-success"></i>绿色：≥ 85%</span>
        </div>-->
          </div>
          <div class="work-complete-footer">
            <el-button class="complete-action-button" size="large" @click="goBack">取消</el-button>
            <el-button class="complete-action-button" type="primary" size="large" :loading="submitLoading" @click="handleWorkComplete">确认完工</el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { CircleCheckFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import type { Dayjs } from 'dayjs';
import { completeWork, prepareCompleteWork } from '@/api/mes/workpanel';
import type { WorkPanelCompletePrepareVO, WorkPanelSfcSelectionForm } from '@/api/mes/workpanel/types';
import { debounce } from '@/utils/index';

const route = useRoute();
const router = useRouter();

const completePanelTab = ref<'barcode' | 'exception' | 'employee'>('barcode');
const completePrepareLoading = ref(false);
const submitLoading = ref(false);
const completePrepare = ref<WorkPanelCompletePrepareVO>({});

const completeForm = reactive({
  endDateTime: '',
  qtyReport: 0,
  qtyScrapped: 0,
  restDuration: 0
});

const reportId = computed(() => {
  const value = route.query.reportId;
  return typeof value === 'string' && value ? value : '';
});

const cacheContextPath = computed(() => {
  const from = route.query.from;
  return typeof from === 'string' && from ? from : route.fullPath;
});

const getRouteCache = (key: string): Record<string, any> => {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value)[cacheContextPath.value] || {} : {};
};

const panelContext = computed(() => ({
  ...getRouteCache('workPanelResource'),
  ...getRouteCache('workPanelOperation'),
  ...getRouteCache('workPanelShopOrder')
}));

const now = () => {
  const date = new Date();
  const pad = (value: number) => `${value}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const parseDateTime = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value.replace(/-/g, '/'));
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const isEndTimeWithin24Hours = (value: string) => {
  const start = parseDateTime(completePrepare.value.startDateTime);
  const end = parseDateTime(value);
  if (!start || !end) return false;
  const duration = end.getTime() - start.getTime();
  return duration >= 0 && duration <= 24 * 60 * 60 * 1000;
};

const buildSfcSelections = (): WorkPanelSfcSelectionForm[] =>
  (completePrepare.value.pendingBarcodeList || [])
    .filter((item) => item.type !== undefined && item.type !== null)
    .map((item) => ({
      type: Number(item.type),
      checked: Boolean(item.checked)
    }));

const loadCompletePrepare = async () => {
  if (!reportId.value) return;
  completePrepareLoading.value = true;
  try {
    const isAssemblyReport = completePrepare.value.businessType === 1;
    const payload: Parameters<typeof prepareCompleteWork>[0] = {
      reportId: reportId.value,
      endDateTime: completeForm.endDateTime || now(),
      qtyScrapped: completeForm.qtyScrapped,
      restDuration: completeForm.restDuration,
      sfcSelections: buildSfcSelections()
    };
    if (!isAssemblyReport && completePrepare.value.businessType !== undefined) {
      payload.qtyReport = completeForm.qtyReport;
    }
    const { data } = await prepareCompleteWork(payload);
    completePrepare.value = {
      ...(data || {}),
      operationDesc: data?.operationDesc || panelContext.value.operationDesc || panelContext.value.operation,
      item: data?.item || panelContext.value.item || panelContext.value.itemBo,
      productDesc: data?.productDesc || panelContext.value.shopOrderDesc
    };
    completeForm.endDateTime = completePrepare.value.endDateTime || completeForm.endDateTime;
    completeForm.qtyReport = Number(completePrepare.value.qtyReport ?? 0);
    completeForm.qtyScrapped = Number(completePrepare.value.qtyScrapped ?? completeForm.qtyScrapped);
    completeForm.restDuration = Number(completePrepare.value.restDuration ?? completeForm.restDuration);
  } finally {
    completePrepareLoading.value = false;
  }
};

const debouncedLoadCompletePrepare = debounce(loadCompletePrepare, 300, false);

const handleBarcodeToggle = (type: number | undefined, checked: boolean) => {
  if (type === undefined || type === null) return;
  completePrepare.value = {
    ...completePrepare.value,
    pendingBarcodeList: (completePrepare.value.pendingBarcodeList || []).map((item) => (item.type === type ? { ...item, checked } : item))
  };
  debouncedLoadCompletePrepare();
};

const handleCompleteFieldChange = (field: 'qtyReport' | 'qtyScrapped' | 'endDateTime', value: string | number) => {
  if (field === 'endDateTime') {
    const endDateTime = String(value || '');
    if (!isEndTimeWithin24Hours(endDateTime)) {
      ElMessage.warning('完工时间必须在开工时间起24小时以内');
      return;
    }
    completeForm.endDateTime = endDateTime;
    completePrepare.value = { ...completePrepare.value, endDateTime: completeForm.endDateTime };
  } else if (field === 'qtyReport') {
    if (completePrepare.value.qtyReportReadOnly) return;
    completeForm.qtyReport = Number(value || 0);
    completePrepare.value = { ...completePrepare.value, qtyReport: completeForm.qtyReport };
  } else if (field === 'qtyScrapped') {
    completeForm.qtyScrapped = Number(value || 0);
    completePrepare.value = { ...completePrepare.value, qtyScrapped: completeForm.qtyScrapped };
  }
  debouncedLoadCompletePrepare();
};

const completeTableHeight = '100%';

const totalOutput = computed(() => Number(completePrepare.value.qtyReport || 0) + Number(completePrepare.value.qtyScrapped || 0));
const actualCapacity = computed(() => {
  if (completePrepare.value.actualCapacity !== undefined && completePrepare.value.actualCapacity !== null) {
    return Number(completePrepare.value.actualCapacity);
  }
  const personTime = Number(completePrepare.value.personTime || 0);
  return personTime > 0 ? (totalOutput.value * 60) / personTime : 0;
});
const theoryDuration = computed(() => {
  if (completePrepare.value.theoryDuration !== undefined && completePrepare.value.theoryDuration !== null) {
    return Number(completePrepare.value.theoryDuration);
  }
  const standardCapacity = Number(completePrepare.value.standardCapacity || 0);
  const actualPersonNumber = Number(completePrepare.value.actualPersonNumber || 0);
  return standardCapacity > 0 && actualPersonNumber > 0 ? (totalOutput.value * 60) / (standardCapacity * actualPersonNumber) : 0;
});
const theoryPersonTime = computed(() => {
  if (completePrepare.value.theoryPersonTime !== undefined && completePrepare.value.theoryPersonTime !== null) {
    return Number(completePrepare.value.theoryPersonTime);
  }
  const standardCapacity = Number(completePrepare.value.standardCapacity || 0);
  return standardCapacity > 0 ? (totalOutput.value * 60) / standardCapacity : 0;
});
const sumEmployeeDuration = (field: 'duration' | 'operationDuration' | 'effectiveDuration') => (completePrepare.value.reportEmployeeList || []).reduce((total, item) => total + Number(item[field] || 0), 0);
const employeeAttendanceTime = computed(() => sumEmployeeDuration('duration'));
const employeeOperationTime = computed(() => sumEmployeeDuration('operationDuration'));

const formatCount = (value?: number | string) => {
  if (value === undefined || value === null || value === '') return '-';
  const num = Number(value);
  return Number.isNaN(num) ? String(value) : num.toFixed(2);
};

const formatIntegerValue = (value?: number | string) => {
  if (value === undefined || value === null || value === '') return '-';
  const num = Number(value);
  return Number.isNaN(num) ? String(value) : num.toFixed(0);
};

const formatPercent = (value?: number | string) => {
  if (value === undefined || value === null || value === '') return '0.00%';
  const num = Number(value);
  return Number.isNaN(num) ? '0.00%' : `${num.toFixed(2)}%`;
};

const rateLevelClass = (value?: number | string) => {
  const rate = Number(value || 0);
  if (rate < 60) return 'is-danger';
  if (rate < 85) return 'is-warning';
  return 'is-success';
};

const endTimeRange = computed(() => {
  const min = parseDateTime(completePrepare.value.startDateTime);
  if (!min) return undefined;
  return { min, max: new Date(min.getTime() + 24 * 60 * 60 * 1000) };
});

const isSameDate = (left: Date, right: Date) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();

const disabledEndDate = (date: Date) => {
  const range = endTimeRange.value;
  if (!range) return false;
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const minDay = new Date(range.min.getFullYear(), range.min.getMonth(), range.min.getDate()).getTime();
  const maxDay = new Date(range.max.getFullYear(), range.max.getMonth(), range.max.getDate()).getTime();
  return day < minDay || day > maxDay;
};

const selectedEndDate = (comparingDate?: Dayjs) => comparingDate?.toDate() || parseDateTime(completePrepare.value.endDateTime) || endTimeRange.value?.min;

const disabledEndHours = (_role: string, comparingDate?: Dayjs) => {
  const range = endTimeRange.value;
  const selected = selectedEndDate(comparingDate);
  if (!range || !selected) return [];
  return Array.from({ length: 24 }, (_, hour) => hour).filter((hour) => (isSameDate(selected, range.min) && hour < range.min.getHours()) || (isSameDate(selected, range.max) && hour > range.max.getHours()));
};

const disabledEndMinutes = (hour: number, _role: string, comparingDate?: Dayjs) => {
  const range = endTimeRange.value;
  const selected = selectedEndDate(comparingDate);
  if (!range || !selected) return [];
  return Array.from({ length: 60 }, (_, minute) => minute).filter((minute) => (isSameDate(selected, range.min) && hour === range.min.getHours() && minute < range.min.getMinutes()) || (isSameDate(selected, range.max) && hour === range.max.getHours() && minute > range.max.getMinutes()));
};

const disabledEndSeconds = (hour: number, minute: number, _role: string, comparingDate?: Dayjs) => {
  const range = endTimeRange.value;
  const selected = selectedEndDate(comparingDate);
  if (!range || !selected) return [];
  return Array.from({ length: 60 }, (_, second) => second).filter((second) => (isSameDate(selected, range.min) && hour === range.min.getHours() && minute === range.min.getMinutes() && second < range.min.getSeconds()) || (isSameDate(selected, range.max) && hour === range.max.getHours() && minute === range.max.getMinutes() && second > range.max.getSeconds()));
};

const formatInteger = (_row: unknown, _column: unknown, value?: number | string) => {
  if (value === undefined || value === null || value === '') return '-';
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? String(value) : numberValue.toFixed(0);
};

const resolveBarcodeRowClass = ({ row }: { row: { selectType?: string } }) => {
  if (row.selectType === 'required') return 'barcode-row-required';
  if (row.selectType === 'disabled') return 'barcode-row-disabled';
  return 'barcode-row-optional';
};

const goBack = () => {
  const from = route.query.from;
  if (typeof from === 'string' && from) {
    router.push(from);
    return;
  }
  router.back();
};

const handleWorkComplete = async () => {
  if (!reportId.value) {
    ElMessage.warning('缺少开工记录');
    return;
  }
  if (Number(completePrepare.value.qtyReport ?? completeForm.qtyReport) <= 0) {
    ElMessage.warning('完工数必须大于0');
    return;
  }
  const endDateTime = completePrepare.value.endDateTime || completeForm.endDateTime;
  if (!endDateTime) {
    ElMessage.warning('请先选择完工时间');
    return;
  }
  if (!isEndTimeWithin24Hours(endDateTime)) {
    ElMessage.warning('完工时间必须在开工时间起24小时以内');
    return;
  }

  submitLoading.value = true;
  try {
    await completeWork({
      reportId: reportId.value,
      endDateTime,
      qtyReport: Number(completePrepare.value.qtyReport ?? completeForm.qtyReport),
      qtyScrapped: Number(completePrepare.value.qtyScrapped ?? completeForm.qtyScrapped),
      restDuration: Number(completePrepare.value.restDuration ?? completeForm.restDuration),
      stopDuration: 0,
      loadDuration: 0,
      abnormalDuration: 0,
      sfcSelections: buildSfcSelections()
    });
    ElMessage.success('完工汇报成功');
    goBack();
  } finally {
    submitLoading.value = false;
  }
};

onMounted(async () => {
  if (!reportId.value) {
    ElMessage.warning('缺少开工记录，无法完工汇报');
    return;
  }
  completeForm.endDateTime = now();
  completePanelTab.value = 'barcode';
  await loadCompletePrepare();
});
</script>

<style scoped>
.work-complete-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px);
  box-sizing: border-box;
  padding: 10px !important;
  overflow: hidden;
  background: radial-gradient(circle at 90% 0%, rgb(34 197 94 / 10%), transparent 28%), linear-gradient(180deg, #f8fbf8 0%, #f1f5f9 100%);
}

.work-complete-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  padding: 8px 12px;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  background: linear-gradient(90deg, #f0fdf4 0%, #fff 42%, #fff 100%);
}

.header-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.back-button {
  border-color: #d1fae5;
  background: #fff;
  color: #16a34a;
}

.back-button:hover {
  border-color: #86efac;
  background: #ecfdf5;
  color: #15803d;
}

.header-icon {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 8px;
  background: #16a34a;
  color: #fff;
  font-size: 16px;
}

.work-complete-title {
  margin: 0;
  color: #166534;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.header-main p {
  display: none;
}

.report-badge {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  padding: 4px 10px;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  background: #fff;
  text-align: right;
}

.report-badge span,
.report-badge strong {
  display: inline;
}

.report-badge span {
  color: #6b7280;
  font-size: 12px;
}

.report-badge strong {
  margin-top: 0;
  color: #15803d;
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.work-complete-card {
  flex: 1;
  min-height: 0;
  border: 0;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgb(15 23 42 / 8%);
}

.work-complete-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  overflow: hidden;
}

.work-complete-card :deep(.complete-panel-shell) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.work-complete-footer {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-left: auto;
  white-space: nowrap;
}

.complete-action-button {
  width: 112px;
  height: 60px;
  margin-left: 0 !important;
}

@media (max-width: 720px) {
  .work-complete-header {
    padding: 5px 8px;
  }

  .header-main p,
  .report-badge span {
    display: none;
  }

  .report-badge {
    min-width: auto;
  }
}

.complete-panel-shell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.complete-panel-dialog {
  min-height: 460px;
}

.android-panel-dialog {
  display: grid;
  grid-template-columns: minmax(520px, 48%) minmax(0, 52%);
  align-items: stretch;
  gap: 0;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  overflow: hidden;
}

.android-panel-left {
  padding: 7px 10px;
  border-right: 1px solid #e5e7eb;
  background: #fff;
}

.android-panel-right {
  min-width: 0;
  padding: 7px 10px;
  background: #fafafa;
}

.info-row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 6px;
  align-items: center;
  padding: 3px 5px;
  border-radius: 6px;
}

.info-row-split {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.info-split-item {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 6px;
  align-items: center;
}

.time-row .info-split-item {
  grid-template-columns: 96px minmax(0, 1fr);
}

.time-row .start-time-picker {
  width: 178px;
  max-width: 100%;
  min-width: 0;
  justify-self: end;
}

.info-label {
  color: #64748b;
  font-size: 12px;
  line-height: 20px;
}

.info-value {
  color: #111827;
  font-size: 13px;
  line-height: 20px;
  word-break: break-word;
}

.numeric-row .info-value,
.compact-row .info-value {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.numeric-row .qty-input {
  width: min(100%, 180px);
  justify-self: end;
}

.numeric-row :deep(.el-input__inner) {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.info-value-strong {
  color: #0f766e;
  font-weight: 700;
}

.info-value-multiline {
  max-height: 40px;
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

.info-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 3px 0 1px;
  color: #16a34a;
  font-size: 12px;
  font-weight: 700;
}

.info-section-title::after {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, #86efac, transparent);
  content: '';
}

.compact-row {
  padding-top: 2px;
  padding-bottom: 2px;
}

.readonly-value {
  color: #475569;
  font-weight: 600;
}

.metric-danger,
.metric-emphasis {
  color: #ef4444;
  font-weight: 700;
}

.capacity-value {
  color: #0f766e;
  font-size: 14px;
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
  margin-bottom: 4px;
}

.employee-tabs :deep(.el-tabs__item.is-active) {
  color: #16a34a;
}

.employee-tabs :deep(.el-tabs__active-bar) {
  background-color: #16a34a;
}

.employee-tabs :deep(.el-tabs__item:hover) {
  color: #15803d;
}

:deep(.datetime-column .cell) {
  white-space: nowrap;
}

.complete-tab-panel {
  min-height: 320px;
}

.barcode-legend {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 5px;
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
  gap: 6px;
}

.complete-kpi-area {
  flex: 1;
  min-width: 0;
}

.complete-summary-bar {
  display: flex;
  flex: none;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.is-page-layout .complete-panel-dialog {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  background: #f8faf8;
}

.is-page-layout .android-panel-left {
  align-self: stretch;
  box-sizing: border-box;
  overflow: hidden auto;
  scrollbar-width: none;
  border: 0;
  border-right: 1px solid #bbf7d0;
  border-radius: 0;
  background: linear-gradient(180deg, #fff 0%, #f0fdf4 100%);
}

.is-page-layout .android-panel-left::-webkit-scrollbar {
  display: none;
}

.is-page-layout .info-row {
  padding-top: 2px;
  padding-bottom: 2px;
}

.is-page-layout .info-row:nth-of-type(even) {
  background: rgb(239 246 255 / 55%);
}

.is-page-layout :deep(.el-input-number .el-input__wrapper),
.is-page-layout :deep(.el-date-editor .el-input__wrapper) {
  min-height: 28px;
  padding-top: 0;
  padding-bottom: 0;
}

.is-page-layout .android-panel-right {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  box-sizing: border-box;
  overflow: hidden;
  border: 0;
  border-radius: 0;
}

.is-page-layout .complete-tab-panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.is-page-layout .employee-tabs {
  flex: none;
}

.is-page-layout .kpi-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 60px;
  box-sizing: border-box;
  padding: 5px 10px;
  border-color: #bbf7d0;
  background: linear-gradient(180deg, #fff, #f0fdf4);
}

.is-page-layout .kpi-item strong {
  font-size: 16px;
  line-height: 20px;
}

.kpi-item {
  padding: 10px 12px;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  background: #fff;
  text-align: center;
}

.kpi-item span {
  display: block;
  color: #64748b;
  font-size: 11px;
}

.kpi-item strong {
  display: block;
  margin-top: 1px;
  color: #111827;
  font-size: 18px;
  line-height: 24px;
}

.kpi-item.is-danger strong {
  color: #ef4444;
}

.kpi-item.is-danger {
  border-color: #fecaca;
  background: #fff7f7;
}

.kpi-item.is-warning {
  border-color: #fde68a;
  background: #fffbeb;
}

.kpi-item.is-warning strong {
  color: #d97706;
}

.kpi-item.is-success {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.kpi-item.is-success strong {
  color: #16a34a;
}

.rate-legend {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 7px 4px 0;
  color: #64748b;
  font-size: 11px;
  line-height: 16px;
}

.rate-legend span {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.legend-dot {
  width: 8px;
  height: 8px;
  margin-right: 4px;
  border-radius: 50%;
}

.legend-dot.is-danger {
  background: #ef4444;
}

.legend-dot.is-warning {
  background: #f59e0b;
}

.legend-dot.is-success {
  background: #22c55e;
}

@media (max-width: 960px) {
  .android-panel-dialog {
    grid-template-columns: 1fr;
  }

  .android-panel-left {
    border-right: 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .info-row-split {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .complete-kpi-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .complete-summary-bar {
    flex-wrap: wrap;
  }
}
</style>
