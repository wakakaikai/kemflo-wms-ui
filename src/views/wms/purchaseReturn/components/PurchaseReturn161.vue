<template>
  <el-row :gutter="20">
    <el-col :span="24">
      <el-card shadow="never" class="search-card history-card" :class="{ 'is-history-collapsed': !historyExpanded }">
        <template #header>
          <div class="history-card-header">
            <div class="history-header-left" @click="historyExpanded = !historyExpanded">
              <el-icon class="history-collapse-icon" :class="{ 'is-expanded': historyExpanded }">
                <ArrowRight />
              </el-icon>
              <span class="history-header-title">采购订单明细（退货）</span>
            </div>
            <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
          </div>
        </template>

        <div v-show="historyExpanded" class="history-card-body">
          <el-form v-show="showSearch" ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="采购单" prop="poNumber">
              <HistoryInput v-model="queryParams.poNumber" :config="poNumberConfig" placeholder="请输入采购单" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="项次" prop="itemNumber">
              <HistoryInput v-model="queryParams.itemNumber" :config="itemNoConfig" placeholder="请输入项次" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="采购类别" prop="poCategory">
              <el-select v-model="queryParams.poCategory" placeholder="请选择采购类别" clearable>
                <el-option v-for="dict in wms_purchase_category" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="显示已退货" prop="showOpenQuantityZero">
              <el-checkbox v-model="queryParams.showOpenQuantityZero" @change="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery" :loading="loading">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="search-result">
            <el-table ref="purchaseTableRef" :data="purchaseOrderDetailList" height="300" border v-loading="loading" @selection-change="handleSelectionChange">
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column v-if="columns[0].visible" label="采购单" align="left" prop="poNumber" fixed="left" min-width="120" />
              <el-table-column v-if="columns[1].visible" label="项次" align="left" prop="itemNumber" fixed="left" min-width="65" />
              <el-table-column v-if="columns[17].visible" label="采购类别" align="center" prop="poCategory" min-width="100">
                <template #default="scope">
                  <dict-tag :options="wms_purchase_category" :value="scope.row.poCategory" />
                </template>
              </el-table-column>
              <el-table-column v-if="columns[2].visible" label="排程" align="left" prop="scheduleNumber" min-width="60" />
              <el-table-column v-if="columns[3].visible" label="交货日期" align="center" prop="deliveryDate" min-width="100" />
              <el-table-column v-if="columns[4].visible" label="料号" align="left" prop="materialCode" min-width="135" />
              <el-table-column v-if="columns[5].visible" label="旧料号" align="left" prop="oldMaterialCode" />
              <el-table-column v-if="columns[6].visible" label="物料描述" align="left" prop="materialDesc" show-overflow-tooltip />
              <el-table-column v-if="columns[7].visible" label="订单数量" align="left" prop="orderQuantity" min-width="100" />
              <el-table-column v-if="columns[8].visible" label="已退数量" align="left" prop="receivedQuantity" min-width="100" />
              <el-table-column v-if="columns[9].visible" label="未清数量" align="left" prop="openQuantity" min-width="100" />
              <el-table-column v-if="columns[10].visible" label="订单单位" align="center" prop="orderUnit" />
              <el-table-column v-if="columns[11].visible" label="需质检" align="center" prop="inspectionFlag" />
              <el-table-column v-if="columns[13].visible" label="库存单位" align="center" prop="inventoryUnit" />
              <el-table-column v-if="columns[14].visible" label="换算比例" align="center" prop="conversionRatio" />
              <el-table-column v-if="columns[15].visible" label="供应商代码" align="center" prop="supplierCode" min-width="120" />
              <el-table-column v-if="columns[16].visible" label="供应商名称" align="center" prop="supplierName" show-overflow-tooltip min-width="100" />
            </el-table>
            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
          </div>
        </div>
      </el-card>
    </el-col>

    <div style="margin: 20px 0; text-align: center; width: 100%">
      <el-button type="primary" @click="addSelectedToReturnList" circle class="rotate-button">
        <el-icon><Switch /></el-icon>
      </el-button>
    </div>

    <el-col :span="24">
      <el-card shadow="never" class="transfer-main-card" :class="{ 'is-transfer-collapsed': !transferExpanded }">
        <template #header>
          <div class="transfer-header">
            <div class="history-header-left" @click="transferExpanded = !transferExpanded">
              <el-icon class="history-collapse-icon" :class="{ 'is-expanded': transferExpanded }">
                <ArrowRight />
              </el-icon>
              <span class="header-title">退货列表</span>
            </div>
            <div class="header-actions" @click.stop>
              <el-button type="danger" @click="clearReturnList" :disabled="returnList.length === 0">清空列表</el-button>
            </div>
          </div>
        </template>

        <div v-show="transferExpanded" class="transfer-card-body">
          <el-form :model="fixedReturnForm" ref="fixedReturnFormRef" label-width="auto" :inline="true">
            <el-row :gutter="20">
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="交货单">
                  <HistoryInput v-model="fixedReturnForm.lfsnr" :config="lfsnrConfig" placeholder="请输入交货单" />
                </el-form-item>
              </el-col>
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="抬头文本" prop="bktxt">
                  <HistoryInput v-model="fixedReturnForm.bktxt" :config="bktxtConfig" placeholder="请输入抬头文本" />
                </el-form-item>
              </el-col>
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="过账日期" prop="postingDate">
                  <el-date-picker clearable v-model="fixedReturnForm.postingDate" type="date" :disabled-date="disabledFutureDate" value-format="YYYY-MM-DD" placeholder="请选择过账日期" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>

          <div v-if="resultMessage" class="m-y-2">
            <el-alert show-icon center :title="resultMessage" :type="resultStatus ? 'success' : 'error'">
              <template #icon>
                <Bell />
              </template>
            </el-alert>
          </div>

          <el-table :data="returnList" border style="width: 100%" v-loading="tableLoading" max-height="400">
            <el-table-column type="index" width="50" align="center" />
            <el-table-column label="采购单" prop="poNumber" />
            <el-table-column label="项次" prop="itemNumber" />
            <el-table-column label="采购类别" prop="poCategory" align="center">
              <template #default="scope">
                <dict-tag :options="wms_purchase_category" :value="scope.row.poCategory" />
              </template>
            </el-table-column>
            <el-table-column label="料号" prop="materialCode" />
            <el-table-column label="物料描述" prop="materialDesc" show-overflow-tooltip />
            <el-table-column label="订单数量" align="left" prop="orderQuantity" min-width="100" />
            <el-table-column label="未清数量" prop="openQuantity" />
            <el-table-column label="源库位信息" min-width="160">
              <template #default="scope">
                <div class="source-location-cell">
                  <div>
                    <div>仓库: {{ scope.row.sourceWarehouseCode || '-' }}</div>
                    <div>库区: {{ scope.row.sourceAreaCode || '-' }}</div>
                    <div>库位: {{ scope.row.sourceLocationCode || '-' }}</div>
                  </div>
                  <el-button link type="primary" icon="Search" @click="openInventoryDialog(scope.row)"></el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="批次号" prop="batchCode" min-width="120" show-overflow-tooltip />
            <el-table-column label="库存标识" align="center" prop="specialInventoryFlag" min-width="100">
              <template #default="scope">
                <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
              </template>
            </el-table-column>
            <el-table-column label="业务伙伴" align="center" min-width="140" show-overflow-tooltip>
              <template #default="scope">
                <span>{{ scope.row.businessCode || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="库存类型" prop="inventoryType" align="center" min-width="100">
              <template #default="scope">
                <dict-tag :options="wms_inventory_type" :value="scope.row.inventoryType" />
              </template>
            </el-table-column>
            <el-table-column label="退货数量" align="center" width="150">
              <template #default="scope">
                <el-input-number v-model="scope.row.returnQuantity" :min="0" :max="getReturnQuantityMax(scope.row)" :precision="3" size="small" controls-position="right" @change="handleReturnQuantityChange(scope.row)" />
              </template>
            </el-table-column>
            <el-table-column label="库存数量" prop="inventoryQuantity" />
            <el-table-column label="库存单位" prop="inventoryUnit" />
            <el-table-column label="操作" width="80" align="center">
              <template #default="scope">
                <el-button type="danger" link icon="Delete" @click="removeFromReturnList(scope.$index)"></el-button>
              </template>
            </el-table-column>
          </el-table>

          <div style="margin-top: 20px; text-align: center">
            <el-button :loading="buttonLoading" type="primary" @click="submitForm" :disabled="returnList.length === 0">
              采购退货161
              <el-tooltip :content="主要用于跨月向供应商退货的业务" placement="top">
                <el-icon class="ml-1"><QuestionFilled /></el-icon>
              </el-tooltip>
            </el-button>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>

  <InventorySelectionDialog v-model="inventoryDialog.visible" :material-code="inventoryDialog.row?.materialCode || ''" :material-desc="inventoryDialog.row?.materialDesc || ''" :issue-qty="Number(inventoryDialog.row?.returnQuantity || inventoryDialog.row?.openQuantity || 0)" :unit="inventoryDialog.row?.orderUnit || inventoryDialog.row?.inventoryUnit || ''" :general-only="false" @confirm="applyInventorySelection" />
</template>

<script setup name="PurchaseReturn161" lang="ts">
import { listPurchaseOrderDetail } from '@/api/wms/purchaseOrderDetail';
import { PurchaseOrderDetailVO, PurchaseOrderDetailQuery, PurchaseOrderDetailForm } from '@/api/wms/purchaseOrderDetail/types';
import { returnPurchaseInventory } from '@/api/wms/inventoryDetail';
import HistoryInput from '@/components/HistoryInput/index.vue';
import InventorySelectionDialog from '@/views/wms/inventoryDetail/components/InventorySelectionDialog.vue';
import { ArrowRight, Bell, QuestionFilled, Switch } from '@element-plus/icons-vue';
import { HttpStatus } from '@/enums/RespEnum';
import { HistoryConfig } from '@/types/history';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_purchase_category, wms_inventory_type, wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_purchase_category', 'wms_inventory_type', 'wms_inventory_special_flag'));

const purchaseOrderDetailList = ref<PurchaseOrderDetailVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const historyExpanded = ref(true);
const transferExpanded = ref(true);
const total = ref(0);
const resultMessage = ref('');
const resultStatus = ref(false);
const buttonLoading = ref(false);
const tableLoading = ref(false);
const selectedSearchItems = ref<PurchaseOrderDetailVO[]>([]);
const returnList = ref<any[]>([]);
const fixedReturnForm = ref({
  lfsnr: '',
  bktxt: '',
  postingDate: null
});
const queryFormRef = ref<ElFormInstance>();
const purchaseTableRef = ref<ElTableInstance>();
const fixedReturnFormRef = ref<ElFormInstance>();
const inventoryDialog = reactive<{ visible: boolean; row: any | null }>({
  visible: false,
  row: null
});

const initFormData: PurchaseOrderDetailForm = {
  id: undefined,
  poNumber: undefined,
  itemNumber: undefined,
  materialCode: undefined,
  materialDesc: undefined,
  shortText: undefined,
  orderQuantity: undefined,
  orderUnit: undefined,
  returnFlag: 'X',
  openQuantity: undefined,
  itemDeleteFlag: undefined,
  completedFlag: undefined,
  enableSapSync: true,
  showOpenQuantityZero: false,
  remark: undefined
};

const data = reactive<PageData<PurchaseOrderDetailForm, PurchaseOrderDetailQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    poNumber: undefined,
    itemNumber: undefined,
    poCategory: undefined,
    materialCode: undefined,
    materialDesc: undefined,
    shortText: undefined,
    orderQuantity: undefined,
    orderUnit: undefined,
    returnFlag: 'X',
    openQuantity: undefined,
    itemDeleteFlag: undefined,
    completedFlag: undefined,
    enableSapSync: true,
    showOpenQuantityZero: false,
    params: {}
  },
  rules: {}
});

const { queryParams } = toRefs(data);

const poNumberConfig: HistoryConfig = {
  key: 'poNumber',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseReturn161',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};
const lfsnrConfig: HistoryConfig = {
  key: 'lfsnr',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseReturn161',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};
const bktxtConfig: HistoryConfig = {
  key: 'bktxt',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseReturn161',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};
const itemNoConfig: HistoryConfig = {
  key: 'itemNo',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseReturn161',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};

const columns = ref<FieldOption[]>([
  { key: 0, label: '采购单', visible: true, children: [] },
  { key: 1, label: '项次', visible: true, children: [] },
  { key: 2, label: '排程', visible: true, children: [] },
  { key: 3, label: '交货日期', visible: true, children: [] },
  { key: 4, label: '料号', visible: true, children: [] },
  { key: 5, label: '旧料号', visible: false, children: [] },
  { key: 6, label: '物料描述', visible: true, children: [] },
  { key: 7, label: '订单数量', visible: true, children: [] },
  { key: 8, label: '已退数量', visible: true, children: [] },
  { key: 9, label: '未清数量', visible: true, children: [] },
  { key: 10, label: '订单单位', visible: true, children: [] },
  { key: 11, label: '需质检', visible: false, children: [] },
  { key: 12, label: '库存数量', visible: false, children: [] },
  { key: 13, label: '库存单位', visible: false, children: [] },
  { key: 14, label: '换算比例', visible: false, children: [] },
  { key: 15, label: '供应商代码', visible: true, children: [] },
  { key: 16, label: '供应商名称', visible: true, children: [] },
  { key: 17, label: '采购类别', visible: true, children: [] }
]);

const disabledFutureDate = (time: Date) => {
  const now = new Date();
  now.setSeconds(now.getSeconds() + 3);
  now.setMilliseconds(0);
  return time.getTime() > now.getTime();
};

function formatPostingDate(postingDate?: string | null): string | undefined {
  if (!postingDate) {
    return undefined;
  }
  return postingDate.includes(' ') ? postingDate : `${postingDate} 00:00:00`;
}

const resolveCurrentInventoryQuantity = (row: any) => {
  if (row.inventoryType === 'X') {
    return Number(row.inspectionQuantity ?? 0);
  }
  if (row.inventoryType === 'S') {
    return Number(row.blockedQuantity ?? 0);
  }
  return Number(row.availableQuantity ?? 0);
};

const getReturnQuantityMax = (row: any) => {
  const openQty = Number(row.openQuantity ?? 0);
  const inventoryQty = resolveCurrentInventoryQuantity(row);
  if (row.sourceLocationCode && inventoryQty > 0) {
    return Math.min(openQty, inventoryQty);
  }
  return openQty;
};

const getList = async () => {
  loading.value = true;
  try {
    queryParams.value.returnFlag = 'X';
    const res = await listPurchaseOrderDetail(queryParams.value);
    purchaseOrderDetailList.value = res.rows;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const calculateInventoryQuantity = (row) => {
  row.inventoryQuantity = ((row.returnQuantity || 0) * (row.conversionRatio || 1)).toFixed(3);
};

const handleReturnQuantityChange = (row) => {
  if (row.returnQuantity === null || row.returnQuantity === undefined || row.returnQuantity === '') {
    row.inventoryQuantity = 0;
  } else {
    calculateInventoryQuantity(row);
  }
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.returnFlag = 'X';
  purchaseTableRef.value?.clearSelection();
  handleQuery();
};

const handleSelectionChange = (selection: PurchaseOrderDetailVO[]) => {
  selectedSearchItems.value = selection;
};

const addSelectedToReturnList = () => {
  if (selectedSearchItems.value.length === 0) {
    proxy?.$modal.msgWarning('请先选择要退货的采购订单明细');
    return;
  }
  const newItems = selectedSearchItems.value.map((item) => ({
    ...item,
    returnQuantity: undefined,
    conversionRatio: item.conversionRatio || 1,
    inventoryQuantity: 0,
    specialInventoryFlag: undefined,
    inventoryType: undefined,
    businessCode: undefined,
    businessName: undefined,
    sourceWarehouseCode: undefined,
    sourceAreaCode: undefined,
    sourceLocationCode: undefined,
    batchCode: undefined,
    availableQuantity: item.openQuantity,
    inspectionQuantity: item.inspectionQuantity,
    blockedQuantity: item.blockedQuantity
  }));
  returnList.value.push(...newItems);
  proxy?.$modal.msgSuccess(`成功添加${newItems.length}条记录到退货列表`);
  purchaseTableRef.value?.clearSelection();
};

const removeFromReturnList = (index: number) => {
  returnList.value.splice(index, 1);
};

const clearReturnList = () => {
  returnList.value = [];
  fixedReturnForm.value.lfsnr = '';
  fixedReturnForm.value.bktxt = '';
  fixedReturnForm.value.postingDate = null;
};

const openInventoryDialog = (row: any) => {
  if (!String(row.materialCode || '').trim()) {
    proxy?.$modal.msgWarning('请先填写料号');
    return;
  }
  inventoryDialog.visible = true;
  inventoryDialog.row = row;
};

const applyInventorySelection = async (payload: { locations: any[] }) => {
  const row = inventoryDialog.row;
  const selected = payload.locations?.[0];
  if (!row || !selected) {
    return;
  }
  row.inventoryDetailId = selected.id;
  row.batchCode = selected.batchCode || '';
  row.warehouseCode = selected.warehouseCode;
  row.areaCode = selected.areaCode;
  row.locationCode = selected.locationCode;
  row.sourceWarehouseCode = selected.warehouseCode;
  row.sourceAreaCode = selected.areaCode;
  row.sourceLocationCode = selected.locationCode;
  row.specialInventoryFlag = selected.specialInventoryFlag || '';
  row.inventoryType = selected.inventoryType || row.inventoryType || 'N';
  row.availableQuantity = Number(selected.availableQuantity ?? 0);
  row.inspectionQuantity = Number(selected.inspectionQuantity ?? 0);
  row.blockedQuantity = Number(selected.blockedQuantity ?? 0);
  row.inventoryUnit = selected.unit || row.inventoryUnit || row.orderUnit;
  handleInventoryTypeChange(-1, row);
  const pickQty = Number(selected.pickQty ?? 0);
  row.returnQuantity = Math.min(pickQty, getReturnQuantityMax(row));
  handleReturnQuantityChange(row);
  await nextTick();
  row.businessCode = selected.businessCode || '';
  row.businessName = selected.businessName || '';
  inventoryDialog.visible = false;
};

const handleInventoryTypeChange = (index: number, row: any) => {
  const item = returnList.value[index] || row;
  item.currentQuantity = resolveCurrentInventoryQuantity(item);
};

const submitForm = async () => {
  const validReturnList = returnList.value.filter((item) => item.returnQuantity > 0);
  resultStatus.value = true;
  resultMessage.value = '';
  if (validReturnList.length === 0) {
    resultMessage.value = '退货数量不能都为0';
    resultStatus.value = false;
    return;
  }

  const missingLocationItems = validReturnList.filter((item) => !item.sourceLocationCode && !item.locationCode);
  if (missingLocationItems.length > 0) {
    resultMessage.value = '请为所有退货行选择源库存明细';
    resultStatus.value = false;
    return;
  }

  const overQuantityItems = validReturnList.filter((item) => item.returnQuantity > item.openQuantity || item.returnQuantity > getReturnQuantityMax(item));
  if (overQuantityItems.length > 0) {
    resultMessage.value = '退货数量不能超过未清数量';
    resultStatus.value = false;
    return;
  }

  buttonLoading.value = true;
  try {
    const postingDate = formatPostingDate(fixedReturnForm.value.postingDate) || '';
    const returnRequests = validReturnList.map((item) => ({
      moveType: '161',
      sourceDocCode: item.poNumber,
      sourceDocType: 'PO',
      poItemNo: item.itemNumber,
      itemCode: item.materialCode,
      itemName: item.materialDesc,
      batchCode: item.batchCode,
      returnQuantity: item.returnQuantity,
      poUnit: item.orderUnit,
      inventoryType: item.inventoryType,
      inventoryQuantity: item.inventoryQuantity,
      inventoryUnit: item.inventoryUnit,
      conversionRatio: item.conversionRatio,
      specialInventoryFlag: item.specialInventoryFlag,
      businessCode: item.businessCode,
      businessName: item.businessName,
      targetLocationCode: item.sourceLocationCode || item.locationCode,
      lfsnr: fixedReturnForm.value.lfsnr || '',
      bktxt: fixedReturnForm.value.bktxt || '',
      postingDate
    }));
    const res: any = await returnPurchaseInventory({
      purchaseOrderReturnBoList: returnRequests,
      returnType: 1
    });
    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg;
      resultStatus.value = false;
      return;
    }
    resultMessage.value = res.msg || `采购退货161成功${returnRequests.length}条记录`;
    resultStatus.value = true;
    returnList.value = [];
    fixedReturnForm.value.lfsnr = '';
    fixedReturnForm.value.bktxt = '';
    fixedReturnForm.value.postingDate = null;
    handleQuery();
  } catch (error) {
    resultMessage.value = error.message || '退货失败';
    resultStatus.value = false;
  } finally {
    buttonLoading.value = false;
  }
};

onMounted(() => {
  getList();
});
</script>

<style scoped>
.search-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
}
.history-card.is-history-collapsed :deep(.el-card__body),
.transfer-main-card.is-transfer-collapsed :deep(.el-card__body) {
  display: none;
}
.history-card.is-history-collapsed {
  min-height: 0;
}
.history-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.history-header-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
.history-collapse-icon {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  transition: transform 0.2s ease;
}
.history-collapse-icon.is-expanded {
  transform: rotate(90deg);
}
.history-header-title,
.header-title {
  font-weight: 600;
}
.transfer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.transfer-card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.source-location-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.rotate-button :deep(.el-icon) {
  transform: rotate(90deg);
}
</style>
