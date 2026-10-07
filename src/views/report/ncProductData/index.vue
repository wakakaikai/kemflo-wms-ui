<template>
  <div class="p-2 nc-product-report">
    <el-card v-show="showSearch" shadow="never" class="mb-2">
      <el-form :model="form" inline label-width="auto" @submit.prevent="handleQuery">
        <el-form-item label="工单">
          <el-input v-model="form.shopOrder" placeholder="工单号，支持模糊查询" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item :label="isOrder ? '计划物料' : '物料'">
          <el-select v-model="form.itemBo" filterable remote clearable :remote-method="searchItems" :loading="itemsLoading" placeholder="输入物料编码或描述选择" @visible-change="(open: boolean) => open && searchItems('')">
            <el-option v-for="option in itemOptions" :key="option.handle" :value="option.handle" :label="optionLabel(option)" />
          </el-select>
        </el-form-item>
        <el-form-item :label="isOrder ? '计划工作中心' : '工作中心'">
          <el-select v-model="form.workCenterBo" filterable remote clearable :remote-method="searchWorkCenters" :loading="workCentersLoading" placeholder="输入工作中心编码或描述" @visible-change="(open: boolean) => open && searchWorkCenters('')">
            <el-option v-for="option in workCenterOptions" :key="option.handle" :value="option.handle" :label="optionLabel(option)" />
          </el-select>
        </el-form-item>
        <el-form-item label="生产/记录时间" required>
          <el-date-picker v-model="form.timeRange" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" :default-time="defaultTime" :shortcuts="shortcuts" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button link type="primary" @click="advanced = !advanced">{{ advanced ? '收起筛选' : '更多筛选' }}</el-button>
        </el-form-item>
        <div v-show="advanced">
          <el-form-item label="工序"><el-input v-model="form.operation" placeholder="工序编码" clearable @keyup.enter="handleQuery" /></el-form-item>
          <el-form-item label="不合格代码"><el-input v-model="form.ncCode" placeholder="不合格代码" clearable @keyup.enter="handleQuery" /></el-form-item>
          <el-form-item label="不合格组"><el-input v-model="form.ncGroup" placeholder="不合格组" clearable @keyup.enter="handleQuery" /></el-form-item>
          <el-form-item label="不合格状态"
            ><el-select v-model="form.ncState" clearable placeholder="全部"><el-option v-for="(label, value) in ncStates" :key="value" :label="label" :value="value" /></el-select
          ></el-form-item>
          <el-form-item label="工单状态"
            ><el-select v-model="form.status" clearable placeholder="全部"><el-option v-for="(label, value) in orderStatuses" :key="value" :label="label" :value="value" /></el-select
          ></el-form-item>
          <el-form-item label="工单类型"
            ><el-select v-model="form.shopOrderType" clearable placeholder="全部"><el-option v-for="(label, value) in orderTypes" :key="value" :label="label" :value="value" /></el-select
          ></el-form-item>
        </div>
      </el-form>
    </el-card>
    <el-card shadow="never">
      <el-tabs v-model="dimension" @tab-change="handleQuery">
        <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name" />
      </el-tabs>
      <div class="report-toolbar">
        <el-button v-hasPermi="['report:ncProductData:export']" type="warning" plain icon="Download" :loading="exporting" :disabled="loading || !loaded" @click="handleExport">导出</el-button>
        <span class="report-hint">{{ timeHint }}</span>
        <right-toolbar v-model:showSearch="showSearch" @query-table="retryList" />
      </div>
      <el-alert v-if="failed" type="error" title="报表加载失败，请重新查询或刷新。" :closable="false" class="mb-2" />
      <ReportTable :dimension="dimension" :rows="rows" :loading="loading" :page="pageNum" :page-size="pageSize" @drill="openDetail" />
      <pagination v-if="total > 0" v-model:page="pageNum" v-model:limit="pageSize" :total="total" @pagination="loadList(appliedQuery!)" />
      <div class="report-footnote">不良数量：同一工单、同一不合格对象的记录取最大数量后汇总；不合格记录数和缺陷数量分别统计。排除拆分复制记录，同一对象跨工序或代码的汇总不能直接相加。</div>
    </el-card>
    <el-dialog v-model="detailVisible" :title="detailTitle" width="90%" append-to-body @closed="clearDetail">
      <div class="report-toolbar">
        <el-button v-hasPermi="['report:ncProductData:export']" type="warning" plain icon="Download" :loading="exporting" :disabled="detailLoading || !detailLoaded" @click="exportDetail">导出明细</el-button>
        <span class="report-hint">沿用来源查询的时间和筛选条件</span>
      </div>
      <el-alert v-if="detailFailed" type="error" title="明细加载失败，请重试。" :closable="false" class="mb-2"><el-button link type="primary" @click="loadDetail">重试</el-button></el-alert>
      <ReportTable dimension="DETAIL" :rows="detailRows" :loading="detailLoading" :page="detailPageNum" :page-size="detailPageSize" />
      <pagination v-if="detailTotal > 0" v-model:page="detailPageNum" v-model:limit="detailPageSize" :total="detailTotal" @pagination="loadDetail" />
    </el-dialog>
  </div>
</template>

<script setup name="NcProductDataReport" lang="ts">
import moment from 'moment';
import { download } from '@/utils/request';
import { listNcProductData, listNcReportItems, listNcReportWorkCenters } from '@/api/report/ncProductData';
import type { NcReportDimension, NcReportQuery, NcReportRow, NcReportOption } from '@/api/report/ncProductData/types';
import { tabs, orderDimensions, orderStatuses, orderTypes, ncStates } from './columns';
import ReportTable from './components/ReportTable.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const dimension = ref<NcReportDimension>('NC_ORDER');
const isOrder = computed(() => orderDimensions.includes(dimension.value));
const showSearch = ref(true);
const advanced = ref(false);
const defaultTime = [new Date(2000, 0, 1, 0, 0, 0), new Date(2000, 0, 1, 23, 59, 59)];
const rangeFor = (days: number): [string, string] => [
  moment()
    .subtract(days - 1, 'days')
    .startOf('day')
    .format('YYYY-MM-DD HH:mm:ss'),
  moment().endOf('day').format('YYYY-MM-DD HH:mm:ss')
];
const shortcuts = [1, 7, 30, 90].map((days) => ({ text: days === 1 ? '今天' : `最近${days}天`, value: () => rangeFor(days).map((date) => moment(date).toDate()) }));
const createForm = () => ({ shopOrder: '', itemBo: '', workCenterBo: '', timeRange: rangeFor(30), operation: '', ncCode: '', ncGroup: '', ncState: '', status: '', shopOrderType: '' });
const form = reactive(createForm());
const rows = ref<NcReportRow[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const loaded = ref(false);
const failed = ref(false);
const exporting = ref(false);
const appliedQuery = ref<NcReportQuery>();
let pendingQuery: NcReportQuery | undefined;
let requestId = 0;
const timeHint = computed(() => (dimension.value === 'STARTED_ORDER' ? '按生产开工时间筛选；不良数量统计所选期间的记录。' : dimension.value === 'ALL_ORDER' ? '包含所选期间计划开始、生产开工或有不合格记录的工单（含不良数量为0的工单）。' : '按不合格记录时间统计。点击工单或汇总编码查看明细。'));

const itemOptions = ref<NcReportOption[]>([]);
const workCenterOptions = ref<NcReportOption[]>([]);
const itemsLoading = ref(false);
const workCentersLoading = ref(false);
let itemRequestId = 0;
let workCenterRequestId = 0;
const optionLabel = (option: NcReportOption) => `${option.code}${option.revision ? '/' + option.revision : ''}${option.description ? ' · ' + option.description : ''}`;
const retainSelection = (options: NcReportOption[], previous: NcReportOption[], handle: string) => {
  const selected = previous.find((option) => option.handle === handle);
  return selected && !options.some((option) => option.handle === handle) ? [selected, ...options] : options;
};
async function searchItems(keyword: string) {
  const id = ++itemRequestId;
  itemsLoading.value = true;
  try {
    const result = await listNcReportItems(keyword);
    if (id === itemRequestId) itemOptions.value = retainSelection(result.data, itemOptions.value, form.itemBo);
  } catch {
    /* 全局请求拦截器提示错误，保留已有选项。 */
  } finally {
    if (id === itemRequestId) itemsLoading.value = false;
  }
}
async function searchWorkCenters(keyword: string) {
  const id = ++workCenterRequestId;
  workCentersLoading.value = true;
  try {
    const result = await listNcReportWorkCenters(keyword);
    if (id === workCenterRequestId) workCenterOptions.value = retainSelection(result.data, workCenterOptions.value, form.workCenterBo);
  } catch {
    /* 全局请求拦截器提示错误，保留已有选项。 */
  } finally {
    if (id === workCenterRequestId) workCentersLoading.value = false;
  }
}
function buildQuery(): NcReportQuery | undefined {
  const [beginTime, endTime] = form.timeRange ?? [];
  const start = moment(beginTime, 'YYYY-MM-DD HH:mm:ss', true);
  const end = moment(endTime, 'YYYY-MM-DD HH:mm:ss', true);
  if (!beginTime || !endTime || !start.isValid() || !end.isValid() || end.isBefore(start) || end.diff(start, 'days', true) > 366) {
    proxy?.$modal.msgWarning('请选择有效时间范围，最多366天');
    return;
  }
  const { timeRange, ...filters } = form;
  return { ...filters, dimension: dimension.value, beginTime, endTime };
}
async function handleQuery() {
  requestId++;
  pendingQuery = undefined;
  loaded.value = false;
  loading.value = false;
  failed.value = false;
  rows.value = [];
  total.value = 0;
  const query = buildQuery();
  if (!query) return;
  pageNum.value = 1;
  await loadList(query);
}
async function loadList(query: NcReportQuery) {
  if (!query) return;
  const id = ++requestId;
  pendingQuery = { ...query };
  loading.value = true;
  loaded.value = false;
  failed.value = false;
  rows.value = [];
  total.value = 0;
  try {
    const result = await listNcProductData({ ...query, pageNum: pageNum.value, pageSize: pageSize.value });
    if (id !== requestId) return;
    rows.value = result.rows;
    total.value = Number(result.total);
    appliedQuery.value = { ...query };
    loaded.value = true;
  } catch {
    if (id === requestId) failed.value = true;
  } finally {
    if (id === requestId) loading.value = false;
  }
}
const retryList = () => (pendingQuery ? loadList(pendingQuery) : handleQuery());
const resetQuery = () => {
  Object.assign(form, createForm());
  handleQuery();
};
async function exportQuery(query: NcReportQuery, title: string) {
  exporting.value = true;
  try {
    await download('/wms/report/ncProductData/export', { ...query }, `${title}_${moment().format('YYYYMMDD_HHmmss')}.xlsx`);
  } finally {
    exporting.value = false;
  }
}
const handleExport = () => (loaded.value && appliedQuery.value ? exportQuery(appliedQuery.value, tabs.find((tab) => tab.name === appliedQuery.value?.dimension)!.label) : undefined);

const detailVisible = ref(false);
const detailTitle = ref('不合格明细');
const detailQuery = ref<NcReportQuery>();
const detailRows = ref<NcReportRow[]>([]);
const detailTotal = ref(0);
const detailPageNum = ref(1);
const detailPageSize = ref(20);
const detailLoading = ref(false);
const detailLoaded = ref(false);
const detailFailed = ref(false);
let detailRequestId = 0;
function openDetail(row: NcReportRow) {
  if (!loaded.value || !appliedQuery.value) return;
  const source = appliedQuery.value;
  const byOrder = orderDimensions.includes(source.dimension);
  detailQuery.value = { ...source, dimension: 'DETAIL', drillDimension: source.dimension, ...(byOrder ? { shopOrderBo: row.shopOrderBo } : { groupKey: row.groupKey || '__UNASSIGNED__' }) };
  detailTitle.value = `${byOrder ? row.shopOrder : row.groupName} · 不合格明细`;
  detailPageNum.value = 1;
  detailVisible.value = true;
  loadDetail();
}
async function loadDetail() {
  if (!detailQuery.value || !detailVisible.value) return;
  const id = ++detailRequestId;
  detailLoading.value = true;
  detailLoaded.value = false;
  detailFailed.value = false;
  detailRows.value = [];
  detailTotal.value = 0;
  try {
    const result = await listNcProductData({ ...detailQuery.value, pageNum: detailPageNum.value, pageSize: detailPageSize.value });
    if (id !== detailRequestId || !detailVisible.value) return;
    detailRows.value = result.rows;
    detailTotal.value = Number(result.total);
    detailLoaded.value = true;
  } catch {
    if (id === detailRequestId && detailVisible.value) detailFailed.value = true;
  } finally {
    if (id === detailRequestId) detailLoading.value = false;
  }
}
function clearDetail() {
  detailRequestId++;
  detailQuery.value = undefined;
  detailRows.value = [];
  detailLoaded.value = false;
}
const exportDetail = () => (detailLoaded.value && detailQuery.value ? exportQuery(detailQuery.value, '不合格产品明细') : undefined);
onMounted(handleQuery);
onBeforeUnmount(() => {
  requestId++;
  detailRequestId++;
  itemRequestId++;
  workCenterRequestId++;
});
</script>

<style scoped>
.nc-product-report :deep(.el-form .el-select),
.nc-product-report :deep(.el-form .el-input) {
  width: 240px;
}
.report-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.report-toolbar :deep(.top-right-btn) {
  margin-left: auto;
}
.report-hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.report-footnote {
  padding-top: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.7;
}
</style>
