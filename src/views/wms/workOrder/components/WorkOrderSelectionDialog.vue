<template>
  <el-dialog v-model="visible" title="选择工单" width="100%" @close="handleClose">
    <div class="order-selection-dialog">
      <!-- 搜索区域 -->
      <el-card shadow="hover">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
          <el-form-item label="工单号" prop="workOrderNoStr">
            <el-input v-model="queryParams.workOrderNoStr" placeholder="请输入工单号" clearable @keyup.enter="handleQuery">
              <template #append>
                <el-button icon="CopyDocument" @click="openBatchInputDialog" title="批量录入工单号" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="产品料号" prop="item">
            <el-input v-model="queryParams.item" placeholder="请输入产品料号" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="计划开始日期" prop="plannedStartDateRange">
            <el-date-picker v-model="queryParams.plannedStartDateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" :loading="loading" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" :disabled="loading" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 工单列表 -->
      <div class="order-list" v-loading="loading">
        <el-table ref="orderTableRef" :data="workOrderList" border height="400" @selection-change="handleSelectionChange" row-key="id">
          <el-table-column type="selection" width="55" />
          <el-table-column prop="workOrderNo" label="工单号" fixed>
            <template #default="{ row }">
              <el-tooltip v-if="row.isUrgent" content="紧急工单" placement="top">
                <el-tag type="danger" size="small">急</el-tag>
              </el-tooltip>
              <span>{{ row.workOrderNo }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="item" label="产品料号" />
          <el-table-column prop="itemDesc" label="产品描述" min-width="150" show-overflow-tooltip />
          <el-table-column prop="plannedQty" label="计划数量" />
          <el-table-column prop="plannedStartDate" label="计划开始" />
          <el-table-column prop="plannedEndDate" label="计划完成" />
          <el-table-column prop="status" label="状态" align="center">
            <template #default="{ row }">
              <dict-tag :options="wms_work_order_status" :value="row.status" />
            </template>
          </el-table-column>
          <el-table-column v-if="showBomAction" label="操作" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" link @click="viewBom(row)">
                {{ bomMode === 'prep' ? '填写备料' : '查看领料' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
      </div>

      <!-- 已选工单 -->
      <div class="selected-orders">
        <div class="selected-title">
          <span>已选工单 ({{ pickedOrders.length }})</span>
          <el-button type="danger" size="small" :disabled="pickedOrders.length === 0" @click="clearSelection"> 清空选择 </el-button>
        </div>
        <div class="selected-list">
          <el-tag v-for="order in pickedOrders" :key="order.id" closable @close="removeSelectedOrder(order)" class="selected-tag">
            {{ order.workOrderNo }}
            <span v-if="order.materialIssues?.length" class="partial-badge">{{ bomMode === 'prep' ? '部分备料' : '部分领料' }}</span>
          </el-tag>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="pickedOrders.length === 0"> 确认选择 ({{ pickedOrders.length }}个工单) </el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 批量输入对话框 -->
  <BatchInputDialog ref="batchInputDialogRef" v-model="batchInputDialogVisible" title="批量录入工单号" placeholder="请输入工单号，支持多行粘贴" @confirm="handleBatchInputConfirm" />

  <!-- BOM详情对话框 -->
  <work-order-bom-dialog
    v-if="showBomAction"
    v-model="showBomDialog"
    :work-order="currentWorkOrder"
    :material-issues="currentWorkOrder ? orderMaterialIssues[currentWorkOrder.workOrderNo] : undefined"
    :mode="bomMode"
    @save="onBomMaterialIssuesSave"
  />
</template>

<script setup lang="ts">
import { ref, reactive, watch, getCurrentInstance, toRefs, nextTick } from 'vue';
import WorkOrderBomDialog from '@/views/wms/allocation/components/WorkOrderBomDialog.vue';
import type { WorkOrderVO, WorkOrderMaterialIssueLine } from '@/api/wms/allocation/types';

import { listWorkOrder } from '@/api/wms/workOrder';
import { WorkOrderForm, WorkOrderQuery } from '@/api/wms/workOrder/types';
import { TableColumns } from '@/api/types';
import BatchInputDialog from '@/components/BatchInputDialog/index.vue';
interface Props {
  modelValue: boolean;
  selectedOrders?: WorkOrderVO[];
  /** issue=261领料；prep=平面仓备料需求 */
  bomMode?: 'issue' | 'prep';
  /** 是否显示列表内 BOM 快捷操作（统一工作台选单时关闭） */
  showBomAction?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedOrders: () => [],
  bomMode: 'issue',
  showBomAction: true
});

const bomMode = computed(() => props.bomMode);
const showBomAction = computed(() => props.showBomAction);

const emit = defineEmits(['update:modelValue', 'confirm']);

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_work_order_status } = toRefs<any>(proxy?.useDict('wms_work_order_status'));

const visible = ref(false);
const queryFormRef = ref<ElFormInstance>();
const orderTableRef = ref();
const showBomDialog = ref(false);
/** 工单号 -> 部分发料明细 */
const orderMaterialIssues = ref<Record<string, WorkOrderMaterialIssueLine[]>>({});

const batchInputDialogVisible = ref(false);
const batchInputDialogRef = ref<InstanceType<typeof BatchInputDialog>>();

const loading = ref(false);
const currentWorkOrder = ref<WorkOrderVO | null>(null);

const initFormData: WorkOrderForm = {
  id: undefined,
  workOrderNo: undefined,
  status: undefined,
  item: undefined,
  itemDesc: undefined,
  checkEnable: undefined,
  plannedStartDate: undefined,
  plannedEndDate: undefined,
  plannedQty: undefined,
  deliveredQty: undefined,
  issuedQty: undefined,
  unit: undefined,
  salesOrderNo: undefined,
  salesOrderItem: undefined,
  soDeliveryDate: undefined,
  previousOrderNo: undefined,
  remark: undefined,
  priority: undefined
};
const data = reactive<PageData<WorkOrderForm, WorkOrderQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    workOrderNo: undefined,
    status: '',
    item: undefined,
    itemDesc: undefined,
    checkEnable: undefined,
    plannedStartDate: undefined,
    plannedEndDate: undefined,
    plannedQty: undefined,
    deliveredQty: undefined,
    issuedQty: undefined,
    unit: undefined,
    salesOrderNo: undefined,
    salesOrderItem: undefined,
    soDeliveryDate: undefined,
    previousOrderNo: undefined,
    priority: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

const columns = ref<TableColumns[]>([
  { key: 1, label: '工单号', visible: true },
  { key: 2, label: '产品料号', visible: true },
  { key: 3, label: '产品描述', visible: true },
  { key: 4, label: '计划开工日期', visible: true },
  { key: 5, label: '计划完工日期', visible: true },
  { key: 6, label: '计划数量', visible: true },
  { key: 7, label: '已交货数量', visible: true },
  { key: 8, label: '单位', visible: true },
  { key: 9, label: '销售订单号', visible: true },
  { key: 10, label: '销售订单项次', visible: true },
  { key: 11, label: '溯源工单号', visible: true },
  { key: 12, label: '销售订单交货日', visible: true },
  { key: 13, label: '创建时间', visible: false },
  { key: 14, label: '创建者', visible: false },
  { key: 15, label: '更新时间', visible: false },
  { key: 16, label: '更新者', visible: false },
  { key: 17, label: '备注', visible: false }
]);

// 分页
const total = ref(0);

// 工单列表
const workOrderList = ref<WorkOrderVO[]>([]);
// 已选工单（本地状态，避免与 props.selectedOrders 重名）
const pickedOrders = ref<WorkOrderVO[]>([]);
const selectedIds = ref<number[]>([]);
const syncingSelection = ref(false);

const initPickedOrdersFromProps = () => {
  pickedOrders.value = [...props.selectedOrders];
  orderMaterialIssues.value = {};
  props.selectedOrders.forEach((o) => {
    if (o.materialIssues?.length) {
      orderMaterialIssues.value[o.workOrderNo] = [...o.materialIssues];
    }
  });
};

/** 按 pickedOrders 同步当前页表格勾选（与外部列表保持一致） */
const syncTableSelection = async (clearAll = false) => {
  await nextTick();
  const table = orderTableRef.value;
  if (!table) return;
  syncingSelection.value = true;
  if (clearAll) table.clearSelection();
  const pickedWoNos = new Set(pickedOrders.value.map((o) => o.workOrderNo));
  workOrderList.value.forEach((row) => {
    table.toggleRowSelection(row, pickedWoNos.has(row.workOrderNo));
  });
  await nextTick();
  syncingSelection.value = false;
};

// 监听props变化
watch(
  () => props.modelValue,
  async (val) => {
    visible.value = val;
    if (val) {
      initPickedOrdersFromProps();
      await getList();
      await syncTableSelection(true);
    }
  }
);

// 监听visible变化
watch(visible, (val) => {
  emit('update:modelValue', val);
});

// 打开批量录入条码弹框
const openBatchInputDialog = () => {
  batchInputDialogVisible.value = true;
};
// 补零函数：将单个工单号补足12位
const padWorkOrder = (order) => {
  if (!order) return order;
  const str = String(order);
  return str.length >= 12 ? str : str.padStart(12, '0');
};
// 弹框确定的回调
const handleBatchInputConfirm = (values: string[]) => {
  // 将批量输入的值回填到输入框，查询时统一解析
  queryParams.value.workOrderNoStr = values.map(padWorkOrder).join(',');
  handleQuery(); // 执行查询
};

/** 查询工单信息列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listWorkOrder(queryParams.value);
    workOrderList.value = res.rows;
    total.value = res.total;
    if (visible.value) {
      await syncTableSelection();
    }
  } finally {
    loading.value = false;
  }
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  // 从输入框内容解析工单号列表（支持手动输入单个/多个，或批量录入回填）
  const str = String(queryParams.value.workOrderNoStr || '').trim();
  queryParams.value.workOrderNoList = str
    ? str
        .split(/[,;，；\s]+/)
        .filter(Boolean)
        .map(padWorkOrder)
    : [];
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  // 清空批量录入的工单号（workOrderNoList 未绑定表单项，resetFields 不会重置）
  queryParams.value.workOrderNoStr = undefined;
  queryParams.value.workOrderNoList = [];
  batchInputDialogRef.value?.resetInput();
  handleQuery();
};

/** 表格勾选变化：合并当前页选择，保留其他页已选工单 */
const handleSelectionChange = (rows: WorkOrderVO[]) => {
  if (syncingSelection.value) return;
  const currentPageWoNos = new Set(workOrderList.value.map((r) => r.workOrderNo));
  const selectedOnPage = new Set(rows.map((r) => r.workOrderNo));
  const kept = pickedOrders.value.filter((o) => !currentPageWoNos.has(o.workOrderNo) || selectedOnPage.has(o.workOrderNo));
  const keptWoNos = new Set(kept.map((o) => o.workOrderNo));
  rows.forEach((row) => {
    if (keptWoNos.has(row.workOrderNo)) return;
    kept.push({
      ...row,
      materialIssues: orderMaterialIssues.value[row.workOrderNo] ?? row.materialIssues
    });
    keptWoNos.add(row.workOrderNo);
  });
  pickedOrders.value = kept;
  selectedIds.value = pickedOrders.value.map((item) => item.id);
};

/** 从已选列表移除工单并取消表格勾选 */
const removeSelectedOrder = (order: WorkOrderVO) => {
  pickedOrders.value = pickedOrders.value.filter((o) => o.workOrderNo !== order.workOrderNo);
  const tableRow = workOrderList.value.find((r) => r.workOrderNo === order.workOrderNo);
  if (orderTableRef.value && tableRow) {
    orderTableRef.value.toggleRowSelection(tableRow, false);
  }
};

/** 清空全部已选工单 */
const clearSelection = () => {
  pickedOrders.value = [];
  if (orderTableRef.value) {
    orderTableRef.value.clearSelection();
  }
};

/** 打开工单 BOM 领料/备料弹窗 */
const viewBom = (order: WorkOrderVO) => {
  currentWorkOrder.value = order;
  showBomDialog.value = true;
};

/** 关闭工单选择弹窗 */
const handleClose = () => {
  orderTableRef.value?.clearSelection();
  visible.value = false;
};

/** BOM 保存回调：缓存并同步工单的部分发料/备料明细 */
const onBomMaterialIssuesSave = (payload: { workOrderNo: string; materialIssues: WorkOrderMaterialIssueLine[] }) => {
  orderMaterialIssues.value[payload.workOrderNo] = payload.materialIssues;
  if (pickedOrders.value.some((o) => o.workOrderNo === payload.workOrderNo)) {
    pickedOrders.value = pickedOrders.value.map((o) =>
      o.workOrderNo === payload.workOrderNo ? { ...o, materialIssues: payload.materialIssues } : o
    );
  }
};

/** 确认选择：合并发料明细并提交给父组件 */
const handleConfirm = () => {
  const orders = pickedOrders.value.map((o) => ({
    ...o,
    materialIssues: orderMaterialIssues.value[o.workOrderNo] ?? o.materialIssues
  }));
  emit('confirm', orders);
  handleClose();
};
</script>

<style scoped>
.order-selection-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-list {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.selected-orders {
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
}

.selected-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: bold;
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 120px;
  overflow-y: auto;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 4px;
}

.selected-tag {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.partial-badge {
  margin-left: 4px;
  font-size: 11px;
  color: var(--el-color-warning);
}

.text-warning {
  color: #e6a23c;
}

.text-success {
  color: #67c23a;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
