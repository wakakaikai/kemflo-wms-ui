<template>
  <div class="p-2">
    <el-card v-show="showSearch" shadow="hover" class="mb-[10px]">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
        <el-form-item label="工单" prop="shopOrder">
          <el-input v-model="queryParams.shopOrder" placeholder="请输入工单" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="计划物料" prop="plannedItem">
          <el-input v-model="queryParams.plannedItem" placeholder="请输入计划物料" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="工作中心" prop="plannedWorkCenter">
          <el-input v-model="queryParams.plannedWorkCenter" placeholder="请输入工作中心" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-input v-model="queryParams.status" placeholder="请输入状态" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="工单类型" prop="shopOrderType">
          <el-input v-model="queryParams.shopOrderType" placeholder="请输入工单类型" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="计划开始时间">
          <el-date-picker v-model="plannedStartRange" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" clearable />
        </el-form-item>
        <el-form-item label="计划完成时间">
          <el-date-picker v-model="plannedCompRange" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" clearable />
        </el-form-item>
        <el-form-item label="实际开始时间">
          <el-date-picker v-model="actualStartRange" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" clearable />
        </el-form-item>
        <el-form-item label="实际完成时间">
          <el-date-picker v-model="actualCompRange" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" :loading="shopOrderLoading" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span>生产实时报表</span>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getShopOrderList" />
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="工单信息" name="shopOrder">
          <el-table v-loading="shopOrderLoading" :data="shopOrderList" border @row-dblclick="openOperation">
            <el-table-column label="工单" prop="shopOrder" fixed="left" min-width="130">
              <template #default="scope">
                <el-button link type="primary" @click="openOperation(scope.row)">{{ scope.row.shopOrder }}</el-button>
              </template>
            </el-table-column>
            <el-table-column label="类型" prop="shopOrderType" min-width="90" />
            <el-table-column label="状态" prop="status" min-width="90" />
            <el-table-column label="计划物料" min-width="160">
              <template #default="scope">{{ formatItem(scope.row.plannedItem, scope.row.plannedItemRevision) }}</template>
            </el-table-column>
            <el-table-column label="计划物料描述" prop="plannedItemDesc" min-width="180" />
            <el-table-column label="计划物料清单" prop="plannedBom" min-width="140" />
            <el-table-column label="计划工艺路线" prop="plannedRouter" min-width="140" />
            <el-table-column label="计划工作中心" prop="plannedWorkCenter" min-width="140" />
            <el-table-column label="计划开始时间" prop="plannedStartDate" min-width="170">
              <template #default="scope">{{ parseTime(scope.row.plannedStartDate) }}</template>
            </el-table-column>
            <el-table-column label="计划完成时间" prop="plannedCompDate" min-width="170">
              <template #default="scope">{{ parseTime(scope.row.plannedCompDate) }}</template>
            </el-table-column>
            <el-table-column label="实际开始时间" prop="actualStartDate" min-width="170">
              <template #default="scope">{{ parseTime(scope.row.actualStartDate) }}</template>
            </el-table-column>
            <el-table-column label="实际完成时间" prop="actualCompDate" min-width="170">
              <template #default="scope">{{ parseTime(scope.row.actualCompDate) }}</template>
            </el-table-column>
            <el-table-column label="计划数量" prop="qtyToBuild" align="right" min-width="110" />
            <el-table-column label="已下达数量" prop="qtyReleased" align="right" min-width="110" />
            <el-table-column label="报废数量" prop="qtyScrapped" align="right" min-width="110" />
            <el-table-column label="完工数量" prop="qtyDone" align="right" min-width="110" />
            <el-table-column label="创建人" prop="creator" min-width="100" />
            <el-table-column label="创建时间" prop="createTime" min-width="170">
              <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
            </el-table-column>
            <el-table-column label="修改人" prop="updater" min-width="100" />
            <el-table-column label="修改时间" prop="modifyTime" min-width="170">
              <template #default="scope">{{ parseTime(scope.row.modifyTime) }}</template>
            </el-table-column>
          </el-table>
          <pagination v-show="shopOrderTotal > 0" :total="shopOrderTotal" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getShopOrderList" />
        </el-tab-pane>

        <el-tab-pane label="工序信息" name="operation" :disabled="!selectedShopOrder">
          <el-alert v-if="selectedShopOrder" :title="`当前工单：${selectedShopOrder.shopOrder}`" type="info" show-icon :closable="false" class="mb-[10px]" />
          <el-table v-loading="operationLoading" :data="operationList" border @row-dblclick="openSfc">
            <el-table-column label="步骤ID" prop="stepId" min-width="90" />
            <el-table-column label="工序" prop="operation" fixed="left" min-width="130">
              <template #default="scope">
                <el-button link type="primary" @click="openSfc(scope.row)">{{ scope.row.operation }}</el-button>
              </template>
            </el-table-column>
            <el-table-column label="工序描述" prop="operationDescription" min-width="180" />
            <el-table-column label="工艺路线版本" min-width="180">
              <template #default="scope">{{ formatItem(scope.row.router, scope.row.routerRevision) }}</template>
            </el-table-column>
            <el-table-column label="排队中数量" prop="qtyInQueue" align="right" min-width="120" />
            <el-table-column label="在制数量" prop="qtyInWork" align="right" min-width="110" />
            <el-table-column label="已完成数量" prop="qtyCompleted" align="right" min-width="120" />
          </el-table>
          <pagination v-show="operationTotal > 0" :total="operationTotal" v-model:page="operationQuery.pageNum" v-model:limit="operationQuery.pageSize" @pagination="getOperationList" />
        </el-tab-pane>

        <el-tab-pane label="产品条码" name="sfc" :disabled="!selectedOperation">
          <el-alert v-if="selectedOperation" :title="`当前工序：${selectedOperation.operation}`" type="info" show-icon :closable="false" class="mb-[10px]" />
          <el-table v-loading="sfcLoading" :data="sfcList" border>
            <el-table-column label="产品条码" prop="sfc" fixed="left" min-width="170" />
            <el-table-column label="状态" prop="status" min-width="90" />
            <el-table-column label="物料" min-width="170">
              <template #default="scope">{{ formatItem(scope.row.item, scope.row.itemRevision) }}</template>
            </el-table-column>
            <el-table-column label="物料描述" prop="itemDescription" min-width="200" />
            <el-table-column label="工单" prop="shopOrder" min-width="140" />
            <el-table-column label="数量" prop="qty" align="right" min-width="90" />
            <el-table-column label="进站时间" prop="sfcInWorkDateTime" min-width="170">
              <template #default="scope">{{ parseTime(scope.row.sfcInWorkDateTime) }}</template>
            </el-table-column>
          </el-table>
          <pagination v-show="sfcTotal > 0" :total="sfcTotal" v-model:page="sfcQuery.pageNum" v-model:limit="sfcQuery.pageSize" @pagination="getSfcList" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup name="ImmediatelyReport" lang="ts">
import { listImmediateOperation, listImmediateSfc, listImmediateShopOrder } from '@/api/mes/shopOrder';
import type { ImmediateOperationQuery, ImmediateOperationVO, ImmediateSfcQuery, ImmediateSfcVO, ImmediateShopOrderQuery, ImmediateShopOrderVO } from '@/api/mes/shopOrder/types';

const queryFormRef = ref<ElFormInstance>();
const showSearch = ref(true);
const activeTab = ref('shopOrder');

const shopOrderLoading = ref(false);
const operationLoading = ref(false);
const sfcLoading = ref(false);
const shopOrderList = ref<ImmediateShopOrderVO[]>([]);
const operationList = ref<ImmediateOperationVO[]>([]);
const sfcList = ref<ImmediateSfcVO[]>([]);
const shopOrderTotal = ref(0);
const operationTotal = ref(0);
const sfcTotal = ref(0);
const selectedShopOrder = ref<ImmediateShopOrderVO>();
const selectedOperation = ref<ImmediateOperationVO>();

const plannedStartRange = ref<string[]>([]);
const plannedCompRange = ref<string[]>([]);
const actualStartRange = ref<string[]>([]);
const actualCompRange = ref<string[]>([]);

const queryParams = reactive<ImmediateShopOrderQuery>({
  pageNum: 1,
  pageSize: 10,
  shopOrder: undefined,
  plannedItem: undefined,
  plannedWorkCenter: undefined,
  status: undefined,
  shopOrderType: undefined
});

const operationQuery = reactive<ImmediateOperationQuery>({
  pageNum: 1,
  pageSize: 10,
  shopOrderRef: undefined
});

const sfcQuery = reactive<ImmediateSfcQuery>({
  pageNum: 1,
  pageSize: 10,
  shopOrderRef: undefined,
  operationRef: undefined,
  routerRef: undefined
});

const applyDateRange = () => {
  queryParams.plannedStartDateFrom = plannedStartRange.value?.[0];
  queryParams.plannedStartDateTo = plannedStartRange.value?.[1];
  queryParams.plannedCompDateFrom = plannedCompRange.value?.[0];
  queryParams.plannedCompDateTo = plannedCompRange.value?.[1];
  queryParams.actualStartDateFrom = actualStartRange.value?.[0];
  queryParams.actualStartDateTo = actualStartRange.value?.[1];
  queryParams.actualCompDateFrom = actualCompRange.value?.[0];
  queryParams.actualCompDateTo = actualCompRange.value?.[1];
};

const clearDrillData = () => {
  selectedShopOrder.value = undefined;
  selectedOperation.value = undefined;
  operationList.value = [];
  sfcList.value = [];
  operationTotal.value = 0;
  sfcTotal.value = 0;
};

const getShopOrderList = async () => {
  applyDateRange();
  shopOrderLoading.value = true;
  try {
    const res = await listImmediateShopOrder(queryParams);
    shopOrderList.value = res.rows || [];
    shopOrderTotal.value = res.total || 0;
  } finally {
    shopOrderLoading.value = false;
  }
};

const getOperationList = async () => {
  if (!operationQuery.shopOrderRef) {
    return;
  }
  operationLoading.value = true;
  try {
    const res = await listImmediateOperation(operationQuery);
    operationList.value = res.rows || [];
    operationTotal.value = res.total || 0;
  } finally {
    operationLoading.value = false;
  }
};

const getSfcList = async () => {
  if (!sfcQuery.shopOrderRef || !sfcQuery.operationRef) {
    return;
  }
  sfcLoading.value = true;
  try {
    const res = await listImmediateSfc(sfcQuery);
    sfcList.value = res.rows || [];
    sfcTotal.value = res.total || 0;
  } finally {
    sfcLoading.value = false;
  }
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  clearDrillData();
  activeTab.value = 'shopOrder';
  getShopOrderList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  plannedStartRange.value = [];
  plannedCompRange.value = [];
  actualStartRange.value = [];
  actualCompRange.value = [];
  queryParams.pageNum = 1;
  queryParams.pageSize = 10;
  handleQuery();
};

const openOperation = async (row: ImmediateShopOrderVO) => {
  selectedShopOrder.value = row;
  selectedOperation.value = undefined;
  operationQuery.pageNum = 1;
  operationQuery.shopOrderRef = row.handle;
  sfcList.value = [];
  sfcTotal.value = 0;
  activeTab.value = 'operation';
  await getOperationList();
};

const openSfc = async (row: ImmediateOperationVO) => {
  if (!selectedShopOrder.value) {
    return;
  }
  selectedOperation.value = row;
  sfcQuery.pageNum = 1;
  sfcQuery.shopOrderRef = selectedShopOrder.value.handle;
  sfcQuery.operationRef = row.operationBo;
  sfcQuery.routerRef = row.routerBo;
  activeTab.value = 'sfc';
  await getSfcList();
};

const formatItem = (code?: string, revision?: string) => {
  if (!code) {
    return '';
  }
  return revision ? `${code}/${revision}` : code;
};

onMounted(() => {
  getShopOrderList();
});
</script>
