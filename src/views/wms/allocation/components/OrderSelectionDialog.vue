<template>
  <el-dialog v-model="visible" title="选择工单" width="1200px" @close="handleClose">
    <div class="order-selection-dialog">
      <!-- 搜索区域 -->
      <el-card shadow="hover">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
          <el-form-item label="工单号" prop="workOrderNo">
            <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="产品料号" prop="item">
            <el-input v-model="queryParams.item" placeholder="请输入产品料号" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="计划开始日期" prop="plannedStartDateRange">
            <el-date-picker v-model="queryParams.plannedStartDateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 工单列表 -->
      <div class="order-list">
        <el-table ref="orderTableRef" :data="workOrderList" border height="400" @selection-change="handleSelectionChange" row-key="id">
          <el-table-column type="selection" width="55" :reserve-selection="true" />
          <el-table-column prop="workOrderNo" label="工单号" width="120" fixed>
            <template #default="{ row }">
              <el-tooltip v-if="row.isUrgent" content="紧急工单" placement="top">
                <el-tag type="danger" size="small">急</el-tag>
              </el-tooltip>
              <span>{{ row.workOrderNo }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="item" label="产品料号" width="120" />
          <el-table-column prop="itemDesc" label="产品描述" min-width="150" show-overflow-tooltip />
          <el-table-column prop="plannedQty" label="计划数量" width="100">
            <template #default="{ row }"> {{ row.plannedQty }} {{ row.unit }} </template>
          </el-table-column>
          <el-table-column prop="issuedQty" label="已发料" width="100">
            <template #default="{ row }"> {{ row.issuedQty }} {{ row.unit }} </template>
          </el-table-column>
          <el-table-column prop="remainingQty" label="待发料" width="100">
            <template #default="{ row }">
              <span
                :class="{
                  'text-warning': row.remainingQty > 0,
                  'text-success': row.remainingQty === 0
                }"
              >
                {{ row.remainingQty }} {{ row.unit }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="plannedStartDate" label="计划开始" width="120">
            <template #default="{ row }">
              {{ formatDate(row.plannedStartDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="plannedEndDate" label="计划完成" width="120">
            <template #default="{ row }">
              {{ formatDate(row.plannedEndDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="soDeliveryDate" label="交货日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.soDeliveryDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="80">
            <template #default="{ row }">
              <priority-badge :priority="row.priority" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="viewBom(row)"> 查看BOM </el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
      </div>

      <!-- 已选工单 -->
      <div class="selected-orders">
        <div class="selected-title">
          <span>已选工单 ({{ selectedOrders.length }})</span>
          <el-button type="danger" size="small" :disabled="selectedOrders.length === 0" @click="clearSelection"> 清空选择 </el-button>
        </div>
        <div class="selected-list">
          <el-tag v-for="order in selectedOrders" :key="order.id" closable @close="removeSelectedOrder(order)" class="selected-tag"> {{ order.workOrderNo }} </el-tag>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="selectedOrders.length === 0"> 确认选择 ({{ selectedOrders.length }}个工单) </el-button>
      </span>
    </template>
  </el-dialog>

  <!-- BOM详情对话框 -->
  <work-order-bom-dialog v-model="showBomDialog" :work-order="currentWorkOrder" />
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue';
import WorkOrderBomDialog from './WorkOrderBomDialog.vue';
import dayjs from 'dayjs';
import type { WorkOrderVO } from '@/api/wms/allocation/types';

import PriorityBadge from './PriorityBadge.vue';
import { listWorkOrder } from '@/api/wms/workOrder';
import { WorkOrderForm, WorkOrderQuery } from '@/api/wms/workOrder/types';
import { TableColumns } from '@/api/types';
interface Props {
  modelValue: boolean;
  selectedOrders?: WorkOrderVO[];
}

const props = withDefaults(defineProps<Props>(), {
  selectedOrders: () => []
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const visible = ref(false);
const queryFormRef = ref<ElFormInstance>();
const orderTableRef = ref();
const showBomDialog = ref(false);

const loading = ref(true);
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
    status: 'RELEASABLE',
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

// 搜索表单
// const queryParams = reactive({
//   workOrderNo: '',
//   item: '',
//   itemDesc: '',
//   plannedStartDateRange: []
// });

// 分页
const total = ref(0);

// 工单列表
const workOrderList = ref<WorkOrderVO[]>([]);
// 已选工单
const selectedOrders = ref<WorkOrderVO[]>([]);
const selectedIds = ref<number[]>([]);
// 监听props变化
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      // 初始化已选工单
      selectedOrders.value = [...props.selectedOrders];
      // 加载数据
      getList();
    }
  }
);

// 监听visible变化
watch(visible, (val) => {
  emit('update:modelValue', val);
});

// 格式化日期
const formatDate = (dateStr: string) => {
  return dayjs(dateStr).format('MM/DD');
};

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'DRAFT': '草稿',
    'PENDING': '待发料',
    'PARTIAL_ISSUED': '部分发料',
    'FULL_ISSUED': '全部发料',
    'CLOSED': '关闭'
  };
  return statusMap[status] || status;
};

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const typeMap: Record<string, string> = {
    'PENDING': 'warning',
    'PARTIAL_ISSUED': 'info',
    'FULL_ISSUED': 'success',
    'CLOSED': 'primary'
  };
  return typeMap[status] || 'info';
};
/** 查询工单信息列表 */
const getList = async () => {
  loading.value = true;
  const res = await listWorkOrder(queryParams.value);
  workOrderList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

// 表格选择变化
const handleSelectionChange = (rows: WorkOrderVO[]) => {
  selectedOrders.value = rows;
  selectedIds.value = rows.map((item: any) => item.id);
};

// 移除已选工单
const removeSelectedOrder = (order: WorkOrderVO) => {
  selectedOrders.value = selectedOrders.value.filter((o) => o.id !== order.id);
  if (orderTableRef.value) {
    orderTableRef.value.toggleRowSelection(order, false);
  }
};

// 清空选择
const clearSelection = () => {
  selectedOrders.value = [];
  if (orderTableRef.value) {
    orderTableRef.value.clearSelection();
  }
};

// 查看BOM
const viewBom = (order: WorkOrderVO) => {
  currentWorkOrder.value = order;
  showBomDialog.value = true;
};

// 关闭对话框
const handleClose = () => {
  visible.value = false;
};

// 确认选择
const handleConfirm = () => {
  emit('confirm', selectedOrders.value);
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
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
