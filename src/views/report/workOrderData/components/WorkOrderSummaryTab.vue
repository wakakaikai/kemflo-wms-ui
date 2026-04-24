<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="产品料号" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入产品料号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="客户订单号" prop="salesOrderNo">
              <el-input v-model="queryParams.salesOrderNo" placeholder="请输入产品描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:workOrder:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="workOrderList">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="expand">
          <template #default="scope">
            <el-table :data="scope.row.workOrderProcessVoList" style="width: calc(100% - 110px); float: right; margin: 10px 0" empty-text="暂无数据">
              <el-table-column label="序号" align="center" width="60">
                <template #default="{ $index }">
                  {{ $index + 1 }}
                </template>
              </el-table-column>
              <el-table-column label="工单号" align="center" prop="workOrderNo" />
              <el-table-column label="工序" align="center" prop="process" />
              <el-table-column label="工序描述" align="center" prop="processShortDesc" />
              <el-table-column label="工单报工数量" align="center" prop="mesReportQty" />
              <el-table-column label="工单入库数量" align="center" prop="wmsDeliveredQty" />
              <el-table-column label="预计开工" align="center" prop="plannedEndDate" />
              <el-table-column label="预计完工" align="center" prop="plannedStartDate" />
              <el-table-column label="预计生产时长" align="center" prop="plannedDurationDesc" />
              <el-table-column label="实际开工" align="center" prop="actualStartDate" />
              <el-table-column label="实际完工" align="center" prop="actualEndDate" />
              <el-table-column label="实际生产时长" align="center" prop="actualDurationDesc" />
            </el-table>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[0].visible" label="工单号" align="left" prop="workOrderNo" min-width="130" />
        <el-table-column v-if="columns[1].visible" label="产品料号" align="left" prop="item" min-width="150" />
        <el-table-column v-if="columns[2].visible" label="产品描述" align="left" prop="itemDesc" show-overflow-tooltip min-width="300" />
        <el-table-column v-if="columns[3].visible" label="计划开工日期" align="center" prop="plannedStartDate" width="180" />
        <el-table-column v-if="columns[4].visible" label="计划完工日期" align="center" prop="plannedEndDate" width="180" />
        <el-table-column v-if="columns[5].visible" label="计划数量" align="center" prop="plannedQty" />
        <el-table-column v-if="columns[6].visible" label="已交货数量" align="center" prop="deliveredQty" min-width="100" />
        <el-table-column v-if="columns[7].visible" label="单位" align="center" prop="unit" />
        <el-table-column v-if="columns[8].visible" label="销售订单号" align="center" prop="salesOrderNo" min-width="120" />
        <el-table-column v-if="columns[9].visible" label="销售订单项次" align="center" prop="salesOrderItem" min-width="120" />
        <el-table-column v-if="columns[10].visible" label="销售订数量" align="center" prop="salesOrderQty" min-width="120" />
        <el-table-column v-if="columns[11].visible" label="销售订单单位" align="center" prop="salesOrderUnit" min-width="120" />
        <el-table-column v-if="columns[12].visible" label="溯源工单号" align="center" prop="traceOrderNo" min-width="120" />
        <el-table-column v-if="columns[13].visible" label="销售订单交货日" align="center" prop="soDeliveryDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.soDeliveryDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[14].visible" label="生产模式" align="center" prop="productionMode" min-width="120">
          <template #default="scope">
            <dict-tag :options="wms_production_mode" :value="scope.row.productionMode" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[15].visible" label="集约生产标识" align="center" prop="intensiveProductionFlag">
          <template #default="scope">
            <el-checkbox v-model="scope.row.intensiveProductionFlag" disabled />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[16].visible" label="尾数工单标识" align="center" prop="mantissaOrderFlag">
          <template #default="scope">
            <el-checkbox v-model="scope.row.mantissaOrderFlag" disabled />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[17].visible" label="创建时间" align="center" prop="createTime" />
        <el-table-column v-if="columns[18].visible" label="创建者" align="center" prop="createByName" />
        <el-table-column v-if="columns[19].visible" label="更新时间" align="center" prop="updateTime" />
        <el-table-column v-if="columns[20].visible" label="更新者" align="center" prop="updateByName" />
        <el-table-column v-if="columns[21].visible" label="备注" align="center" prop="remark" />
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup name="WorkOrderSummaryTab" lang="ts">
import { WorkOrderVO, WorkOrderQuery, WorkOrderForm } from '@/api/wms/workOrder/types';
import { TableColumns } from '@/api/types';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_production_mode, wms_work_order_check_enable } = toRefs<any>(proxy?.useDict('wms_production_mode', 'wms_work_order_check_enable'));

import { nextTick, ref } from 'vue';
import { parseTime } from '@/utils/ruoyi';

import { listWorkOrderSummary } from '@/api/report/workOrder';

const workOrderList = ref<WorkOrderVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const queryFormRef = ref<ElFormInstance>();
const workOrderFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: WorkOrderForm = {
  id: undefined,
  workOrderNo: undefined,
  item: undefined,
  itemDesc: undefined,
  checkEnable: 0,
  plannedStartDate: undefined,
  plannedEndDate: undefined,
  plannedQty: undefined,
  deliveredQty: undefined,
  waitStockQty: undefined,
  productionMode: undefined,
  intensiveProductionFlag: undefined,
  mantissaOrderFlag: undefined,
  remark: undefined
};
const data = reactive<PageData<WorkOrderForm, WorkOrderQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    workOrderNo: undefined,
    item: undefined,
    itemDesc: undefined,
    inspectionFlag: undefined,
    plannedStartDate: undefined,
    plannedEndDate: undefined,
    plannedQty: undefined,
    deliveredQty: undefined,
    waitStockQty: undefined,
    productionMode: undefined,
    intensiveProductionFlag: undefined,
    mantissaOrderFlag: undefined,
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
  { key: 7, label: '已交货数量', visible: false },
  { key: 8, label: '单位', visible: false },
  { key: 9, label: '销售订单号', visible: true },
  { key: 10, label: '销售订单项次', visible: false },
  { key: 11, label: '销售订数量', visible: false },
  { key: 12, label: '销售订单单位', visible: false },
  { key: 13, label: '溯源工单号', visible: false },
  { key: 14, label: '销售订单交货日', visible: false },
  { key: 15, label: '生产模式', visible: false },
  { key: 16, label: '集约生产标识', visible: false },
  { key: 17, label: '尾数工单标识', visible: false },
  { key: 18, label: '创建时间', visible: false },
  { key: 19, label: '创建者', visible: false },
  { key: 20, label: '更新时间', visible: false },
  { key: 21, label: '更新者', visible: false },
  { key: 22, label: '备注', visible: false }
]);

/** 查询工单信息列表 */
const getList = async () => {
  loading.value = true;
  const res = await listWorkOrderSummary(queryParams.value);
  workOrderList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  nextTick(() => {
    workOrderFormRef.value?.resetFields();
  });
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

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/workOrder/export',
    {
      ...queryParams.value
    },
    `workOrder_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
<style lang="scss" scoped></style>
