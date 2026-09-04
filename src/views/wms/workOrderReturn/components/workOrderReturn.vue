<template>
  <div class="p-2 work-order-return-page">
    <el-card shadow="never" class="history-card" :class="{ 'is-history-collapsed': !historyExpanded }">
      <template #header>
        <div class="history-card-header">
          <div class="history-header-left" @click="historyExpanded = !historyExpanded">
            <el-icon class="history-collapse-icon" :class="{ 'is-expanded': historyExpanded }">
              <ArrowRight />
            </el-icon>
            <span class="history-header-title">工单入库历史</span>
          </div>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
        </div>
      </template>

      <div v-show="historyExpanded" class="history-card-body">
        <el-form v-show="showSearch" ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
          <el-form-item label="物料凭证号" prop="sapMaterialOrderNo">
            <HistoryInput v-model="queryParams.sapMaterialOrderNo" :config="sapMaterialOrderNoConfig" placeholder="请输入物料凭证号" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="工单号" prop="sourceDocCode">
            <HistoryInput v-model="queryParams.sourceDocCode" :config="sourceDocCodeConfig" placeholder="请输入工单号" @keyup.enter="handleQuery" />
          </el-form-item>
          <!-- 高级搜索项，默认隐藏 -->
          <div v-show="showAdvancedSearch">
            <el-form-item label="物料凭证项次" prop="sapMaterialItem">
              <HistoryInput v-model="queryParams.sapMaterialItem" :config="sapMaterialItemConfig" placeholder="请输入物料凭证项次" @keyup.enter="handleQuery" />
            </el-form-item>
          </div>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery" :loading="loading">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            <el-button link type="primary" @click="toggleAdvancedSearch">
              {{ showAdvancedSearch ? '收起' : '高级搜索' }}
              <el-icon class="el-icon--right">
                <ArrowDown v-if="!showAdvancedSearch" />
                <ArrowUp v-else />
              </el-icon>
            </el-button>
          </el-form-item>
        </el-form>

        <div class="search-result">
          <el-table ref="inventoryTableRef" :data="inventoryDetailList" height="300" border v-loading="loading" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column v-if="columns[0].visible" label="物料凭证号" align="left" prop="sapMaterialOrderNo" />
            <el-table-column v-if="columns[1].visible" label="凭证项次" align="left" prop="sapMaterialItem" />
            <el-table-column v-if="columns[2].visible" label="工单号" align="left" prop="sourceDocCode" />
            <el-table-column v-if="columns[3].visible" label="物料编码" align="left" prop="itemCode" />
            <el-table-column v-if="columns[4].visible" label="物料名称" align="left" prop="itemName" show-overflow-tooltip />
            <el-table-column v-if="columns[5].visible" label="批次号" align="center" prop="batchCode" />
            <el-table-column v-if="columns[6].visible" label="数量" align="center">
              <template #default="scope">{{ formatQtyWithUnit(scope.row.quantity, scope.row.unit) }}</template>
            </el-table-column>
            <el-table-column v-if="columns[7].visible" label="特殊库存" align="center" prop="specialInventoryFlag">
              <template #default="scope">
                <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
              </template>
            </el-table-column>
            <el-table-column v-if="columns[8].visible" label="业务伙伴" align="center" prop="businessCode" />
            <el-table-column v-if="columns[9].visible" label="伙伴名称" align="center" prop="businessName" show-overflow-tooltip />
            <el-table-column v-if="columns[10].visible" label="仓库编码" align="center" prop="warehouseCode" />
            <el-table-column v-if="columns[11].visible" label="库区编码" align="center" prop="areaCode" />
            <el-table-column v-if="columns[12].visible" label="库位编码" align="center" prop="locationCode" fixed="right" />
          </el-table>

          <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
        </div>
      </div>
    </el-card>

    <div class="add-transfer-bar">
      <el-button type="primary" @click="addSelectedToTransferList" circle class="rotate-button">
        <el-icon><Switch /></el-icon>
      </el-button>
    </div>

    <el-card shadow="never" class="transfer-main-card" :class="{ 'is-transfer-collapsed': !transferExpanded }">
      <template #header>
        <div class="transfer-header">
          <div class="history-header-left" @click="transferExpanded = !transferExpanded">
            <el-icon class="history-collapse-icon" :class="{ 'is-expanded': transferExpanded }">
              <ArrowRight />
            </el-icon>
            <span class="header-title">工单退货列表</span>
          </div>
          <div class="header-actions" @click.stop>
            <el-button type="danger" @click="clearTransferList" :disabled="transferList.length === 0">清空列表</el-button>
            <right-toolbar :search="false" :columns="transferColumns" />
          </div>
        </div>
      </template>

      <div v-show="transferExpanded" class="transfer-card-body">
        <div class="query-panel">
          <el-form :model="fixedTransferForm" ref="fixedTransferFormRef" label-width="auto" :inline="true">
            <el-row :gutter="20">
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="交货单">
                  <HistoryInput v-model="fixedTransferForm.lfsnr" :config="lfsnrConfig" placeholder="请输入交货单" />
                </el-form-item>
              </el-col>
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="抬头文本" prop="bktxt">
                  <HistoryInput v-model="fixedTransferForm.bktxt" :config="bktxtConfig" placeholder="请输入抬头文本" />
                </el-form-item>
              </el-col>
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="过账日期" prop="postingDate">
                  <el-date-picker clearable v-model="fixedTransferForm.postingDate" type="date" :disabled-date="disabledFutureDate" value-format="YYYY-MM-DD" placeholder="请选择过账日期" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div v-if="resultMessage" class="m-y-2">
          <el-alert show-icon center :title="resultMessage" :type="resultStatus ? 'success' : 'error'">
            <template #icon>
              <Bell />
            </template>
          </el-alert>
        </div>

        <el-table :data="transferList" border style="width: 100%" v-loading="tableLoading" max-height="520">
          <el-table-column type="index" width="50" align="center" />
          <el-table-column v-if="transferColumns[0].visible" label="工单号" min-width="120">
            <template #default="scope">
              <el-link type="primary" :underline="false" @click="openWorkOrderDialog(scope.row)">
                {{ scope.row.workOrderNo || '选择工单号' }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column v-if="transferColumns[1].visible" prop="itemCode" label="物料编码" min-width="150"> </el-table-column>
          <el-table-column v-if="transferColumns[2].visible" label="物料名称" prop="itemName" min-width="140" show-overflow-tooltip />
          <el-table-column v-if="transferColumns[3].visible" label="批次号" min-width="140">
            <template #default="scope">
              <el-input
                v-if="editingBatchRowId === scope.row.id"
                :ref="(el) => setBatchInputRef(el, scope.row.id)"
                v-model.trim="scope.row.batchCode"
                placeholder="请输入批次号"
                clearable
                @blur="finishBatchEdit"
                @keydown.enter.prevent="finishBatchEdit"
              />
              <div v-else class="editable-cell" @dblclick.stop="startBatchEdit(scope.row)">
                {{ scope.row.batchCode || '' }}
              </div>
            </template>
          </el-table-column>
          <el-table-column v-if="transferColumns[4].visible" label="源库位信息" min-width="160">
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
          <el-table-column v-if="transferColumns[5].visible" label="库存标识" align="center" prop="specialInventoryFlag" min-width="100">
            <template #default="scope">
              <el-select v-model="scope.row.specialInventoryFlag" placeholder="请选择" filterable clearable>
                <el-option v-for="dict in wms_inventory_special_flag" :key="dict.value" :label="dict.value + ' ' + dict.label" :value="dict.value" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column v-if="transferColumns[6].visible" label="业务伙伴" align="center" min-width="180">
            <template #default="scope">
              <BusinessPartnerInput v-model:business-code="scope.row.businessCode" v-model:business-name="scope.row.businessName" :special-inventory-flag="scope.row.specialInventoryFlag" :material-code="scope.row.materialCode || scope.row.itemCode" />
            </template>
          </el-table-column>
          <el-table-column v-if="transferColumns[7].visible" label="退货数量" width="180">
            <template #default="scope">
              <div class="qty-with-unit-cell">
                <el-input-number v-model="scope.row.returnQuantity" :min="0" :max="parseFloat(scope.row.quantity || 0)" :precision="3" size="small" controls-position="right" @change="handleReturnPoQuantityChange(scope.row)" />
                <span v-if="scope.row.unit" class="qty-unit-text">{{ scope.row.unit }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template #default="scope">
              <el-button type="danger" link icon="Delete" @click="removeFromTransferList(scope.$index)"></el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="list-footer-actions">
          <el-button type="primary" circle icon="Plus" @click="addManualTransferRow" />
        </div>

        <div style="text-align: center">
          <el-button v-hasPermi="['wms:workOrder:return']" :loading="buttonLoading1" type="primary" @click="submitTransfer" :disabled="transferList.length === 0"> 工单入库取消 </el-button>
        </div>
      </div>
    </el-card>

    <InventorySelectionDialog v-model="inventoryDialog.visible" :material-code="inventoryDialog.row?.materialCode || inventoryDialog.row?.itemCode || ''" :material-desc="inventoryDialog.row?.materialName || inventoryDialog.row?.itemName || ''" :issue-qty="Number(inventoryDialog.row?.returnQuantity || inventoryDialog.row?.quantity || 0)" :unit="inventoryDialog.row?.unit || ''" :general-only="false" @confirm="applyInventorySelection" />
    <WorkOrderSelectionDialog v-model="workOrderDialog.visible" :selected-orders="[]" :show-bom-action="false" :single-select="true" @confirm="handleWorkOrderSelection" />
  </div>
</template>

<script setup name="WorkOrderReturn" lang="ts">
import { ref, reactive, nextTick, getCurrentInstance, toRefs } from 'vue';
import { ArrowDown, ArrowRight, ArrowUp, Bell, Switch } from '@element-plus/icons-vue';
import { listInventoryMovement } from '@/api/wms/inventoryMovement';
import type { InventoryMovementQuery, InventoryMovementVO } from '@/api/wms/inventoryMovement/types';
import { buildWorkOrderReturnBo, enrichWorkOrderReturnRow, workOrderOutbound } from '@/api/wms/workOrderReturn';
import { HttpStatus } from '@/enums/RespEnum';
import { formatQty } from '@/utils/ruoyi';
import { HistoryConfig } from '@/types/history';
import HistoryInput from '@/components/HistoryInput/index.vue';
import InventorySelectionDialog from '@/views/wms/inventoryDetail/components/InventorySelectionDialog.vue';
import WorkOrderSelectionDialog from '@/views/wms/workOrder/components/WorkOrderSelectionDialog.vue';
import BusinessPartnerInput from '@/views/wms/components/BusinessPartnerInput.vue';
const showAdvancedSearch = ref(false); // 控制高级搜索显示状态
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));

const showSearch = ref(true);
const historyExpanded = ref(true);
const transferExpanded = ref(true);
const loading = ref(false);
const tableLoading = ref(false);
const buttonLoading1 = ref(false);
const inventoryDetailList = ref<InventoryMovementVO[]>([]);
const selectedSearchItems = ref<InventoryMovementVO[]>([]);
const transferList = ref<any[]>([]);
const total = ref(0);
const resultMessage = ref('');
const resultStatus = ref(false);
const queryFormRef = ref<any>(null);
const inventoryTableRef = ref<any>(null);
const fixedTransferFormRef = ref<any>(null);
const editingBatchRowId = ref<string | number | null>(null);

const fixedTransferForm = ref({
  lfsnr: '',
  bktxt: '',
  postingDate: null as string | null
});

const queryParams = ref<InventoryMovementQuery>({
  pageNum: 1,
  pageSize: 10,
  moveType: '101',
  sourceDocType: 'WO',
  sourceDocCode: undefined,
  sapMaterialOrderNo: undefined,
  sapMaterialItem: undefined,
  params: {}
});

const inventoryDialog = reactive<{
  visible: boolean;
  row: any | null;
}>({
  visible: false,
  row: null
});

const workOrderDialog = reactive<{
  visible: boolean;
  row: any | null;
}>({
  visible: false,
  row: null
});

const sapMaterialOrderNoConfig: HistoryConfig = {
  key: 'sapMaterialOrderNo',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'workOrderReturn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const sapMaterialItemConfig: HistoryConfig = {
  key: 'sapMaterialItem',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'workOrderReturn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const sourceDocCodeConfig: HistoryConfig = {
  key: 'sourceDocCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'workOrderReturn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const lfsnrConfig: HistoryConfig = {
  key: 'lfsnr',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'workOrderReturn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const bktxtConfig: HistoryConfig = {
  key: 'bktxt',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'workOrderReturn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const columns = ref<FieldOption[]>([
  { key: 0, label: `物料凭证号`, visible: true, children: [] },
  { key: 1, label: `凭证项次`, visible: true, children: [] },
  { key: 2, label: `工单号`, visible: true, children: [] },
  { key: 3, label: `物料编码`, visible: true, children: [] },
  { key: 4, label: `物料名称`, visible: true, children: [] },
  { key: 5, label: `批次号`, visible: true, children: [] },
  { key: 6, label: `数量`, visible: true, children: [] },
  { key: 7, label: `特殊库存`, visible: true, children: [] },
  { key: 8, label: `业务伙伴`, visible: true, children: [] },
  { key: 9, label: `伙伴名称`, visible: false, children: [] },
  { key: 10, label: `仓库编码`, visible: false, children: [] },
  { key: 11, label: `库区编码`, visible: false, children: [] },
  { key: 12, label: `库位编码`, visible: true, children: [] }
]);

const transferColumns = ref<FieldOption[]>([
  { key: 0, label: `工单号`, visible: true, children: [] },
  { key: 1, label: `物料编码`, visible: true, children: [] },
  { key: 2, label: `物料名称`, visible: true, children: [] },
  { key: 3, label: `批次号`, visible: true, children: [] },
  { key: 4, label: `源库位信息`, visible: true, children: [] },
  { key: 5, label: `库存标识`, visible: true, children: [] },
  { key: 6, label: `业务伙伴`, visible: true, children: [] },
  { key: 7, label: `退货数量`, visible: true, children: [] }
]);

/** 切换高级搜索显示状态 */
const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value;
};

const formatQtyWithUnit = (qty?: number | string | null, unit?: string) => {
  const text = formatQty(qty);
  if (!text) {
    return unit || '';
  }
  return unit ? `${text} ${unit}` : text;
};

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

const buildTransferRow = (item: InventoryMovementVO) =>
  enrichWorkOrderReturnRow({
    ...item,
    materialCode: item.itemCode,
    materialName: item.itemName,
    quantity: item.quantity,
    currentQuantity: item.quantity || 0,
    returnQuantity: item.quantity,
    inventoryQuantity: item.quantity,
    inventoryUnit: item.unit
  });

const getList = async () => {
  loading.value = true;
  resultMessage.value = '';
  try {
    const res = await listInventoryMovement(queryParams.value);
    const rows = res.rows || [];
    inventoryDetailList.value = rows;
    total.value = res.total || 0;
  } catch (error: any) {
    inventoryDetailList.value = [];
    total.value = 0;
    resultStatus.value = false;
    resultMessage.value = error.message || '查询失败';
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  inventoryDetailList.value = [];
  selectedSearchItems.value = [];
  total.value = 0;
  inventoryTableRef.value?.clearSelection?.();
  resultMessage.value = '';
};

const handleSelectionChange = (selection: InventoryMovementVO[]) => {
  selectedSearchItems.value = selection;
};

const addSelectedToTransferList = () => {
  if (selectedSearchItems.value.length === 0) {
    proxy.$modal.msgWarning('请先选择要加入的记录');
    return;
  }

  const newItems = selectedSearchItems.value.map(buildTransferRow);
  let addedCount = 0;
  newItems.forEach((newItem) => {
    const exists = transferList.value.some((item) => item.id === newItem.id);
    if (!exists) {
      transferList.value.push(newItem);
      addedCount++;
    }
  });
  inventoryTableRef.value?.clearSelection?.();
  selectedSearchItems.value = [];
  proxy.$modal.msgSuccess(`成功加入${addedCount}条记录`);
};

const handleReturnPoQuantityChange = (row: any) => {
  row.inventoryQuantity = row.returnQuantity || 0;
};

const batchInputRefs = new Map<string | number, any>();
let batchEditReady = false;

const setBatchInputRef = (el: any, rowId: string | number) => {
  if (el) {
    batchInputRefs.set(rowId, el);
  } else {
    batchInputRefs.delete(rowId);
  }
};

const startBatchEdit = (row: any) => {
  if (row.batchCode == null) {
    row.batchCode = '';
  }
  batchEditReady = false;
  editingBatchRowId.value = row.id;
  nextTick(() => {
    const input = batchInputRefs.get(row.id);
    input?.focus?.();
    // 避免双击切换输入框时立刻触发 blur 退出编辑
    setTimeout(() => {
      batchEditReady = true;
    }, 100);
  });
};

const finishBatchEdit = () => {
  if (!batchEditReady) {
    return;
  }
  editingBatchRowId.value = null;
};

const removeFromTransferList = (index: number) => {
  transferList.value.splice(index, 1);
};

const clearTransferList = () => {
  transferList.value = [];
  fixedTransferForm.value.lfsnr = '';
  fixedTransferForm.value.bktxt = '';
  resultMessage.value = '';
};

const addManualTransferRow = () => {
  transferList.value.push({
    id: `manual_${Date.now()}_${transferList.value.length}`,
    manualAdd: true,
    sourceDocType: 'WO',
    workOrderNo: '',
    sourceDocCode: '',
    materialCode: '',
    materialName: '',
    itemName: '',
    batchCode: '',
    quantity: 0,
    returnQuantity: undefined,
    unit: '',
    specialInventoryFlag: undefined,
    businessCode: undefined,
    businessName: undefined,
    warehouseCode: undefined,
    areaCode: undefined,
    locationCode: undefined,
    sourceWarehouseCode: undefined,
    sourceAreaCode: undefined,
    sourceLocationCode: undefined
  });
};

const openWorkOrderDialog = (row: any) => {
  workOrderDialog.row = row;
  workOrderDialog.visible = true;
};

const handleWorkOrderSelection = (orders: any[]) => {
  const selected = orders?.[0];
  const row = workOrderDialog.row;
  if (row && selected) {
    row.workOrderNo = selected.workOrderNo;
    row.sourceDocType = 'WO';
    row.sourceDocCode = selected.workOrderNo;
    row.materialCode = selected.item || row.materialCode;
    row.itemCode = selected.item || row.itemCode;
    row.materialName = selected.itemDesc || row.materialName;
    row.itemName = selected.itemDesc || row.itemName;
    row.unit = selected.unit || row.unit;
    row.inventoryUnit = selected.unit || row.inventoryUnit || row.unit;
  }
  workOrderDialog.visible = false;
};

const openInventoryDialog = (row: any) => {
  if (!String(row.materialCode || row.itemCode || '').trim()) {
    proxy.$modal.msgWarning('请先选择工单号或填写物料编码');
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
  row.materialCode = selected.itemCode || row.materialCode;
  row.itemCode = selected.itemCode || row.itemCode;
  row.materialName = selected.itemName || row.materialName;
  row.itemName = selected.itemName || row.itemName;
  row.sourceDocType = 'WO';
  row.sourceDocCode = String(row.workOrderNo || row.sourceDocCode || '').trim();
  row.batchCode = selected.batchCode || '';
  row.warehouseCode = selected.warehouseCode;
  row.areaCode = selected.areaCode;
  row.locationCode = selected.locationCode;
  row.sourceWarehouseCode = selected.warehouseCode;
  row.sourceAreaCode = selected.areaCode;
  row.sourceLocationCode = selected.locationCode;
  row.specialInventoryFlag = selected.specialInventoryFlag || '';
  row.quantity = Number(selected.availableQuantity ?? row.quantity ?? 0);
  row.currentQuantity = row.quantity;
  row.inventoryQuantity = row.quantity;
  row.availableQuantity = row.quantity;
  row.returnQuantity = Math.min(Number(selected.pickQty ?? row.returnQuantity ?? 0), Number(row.quantity ?? 0));
  row.unit = selected.unit || row.unit;
  row.inventoryUnit = selected.unit || row.inventoryUnit || row.unit;
  await nextTick();
  row.businessCode = selected.businessCode || '';
  row.businessName = selected.businessName || '';
  inventoryDialog.visible = false;
};

const submitTransfer = async () => {
  const validTransfers = transferList.value.filter((item) => Number(item.returnQuantity || 0) > 0);
  resultStatus.value = true;
  resultMessage.value = '';
  if (validTransfers.length === 0) {
    resultMessage.value = '没有有效的入库取消记录';
    resultStatus.value = false;
    return;
  }
  const missingWorkOrderItems = validTransfers.filter((item) => !String(item.workOrderNo || item.sourceDocCode || '').trim());
  if (missingWorkOrderItems.length > 0) {
    resultMessage.value = '请填写所有入库取消行的工单号';
    resultStatus.value = false;
    return;
  }
  const missingLocationItems = validTransfers.filter((item) => !item.locationCode);
  if (missingLocationItems.length > 0) {
    resultMessage.value = '请为所有入库取消行选择源库存明细';
    resultStatus.value = false;
    return;
  }
  const overQuantityItems = validTransfers.filter((item) => Number(item.returnQuantity || 0) > Number(item.quantity || 0));
  if (overQuantityItems.length > 0) {
    resultMessage.value = '退货数量不能超过当前可用数量';
    resultStatus.value = false;
    return;
  }
  buttonLoading1.value = true;
  try {
    const transferRequests = validTransfers.map((item) =>
      buildWorkOrderReturnBo(
        {
          ...item,
          sourceDocType: 'WO',
          sourceDocCode: String(item.workOrderNo || item.sourceDocCode || '').trim(),
          workOrderNo: String(item.workOrderNo || item.sourceDocCode || '').trim()
        },
        {}
      )
    );
    const res: any = await workOrderOutbound({
      lfsnr: fixedTransferForm.value.lfsnr,
      bktxt: fixedTransferForm.value.bktxt,
      postingDate: formatPostingDate(fixedTransferForm.value.postingDate),
      workOrderInOutBoundList: transferRequests
    });

    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg;
      resultStatus.value = false;
      return;
    }
    resultMessage.value = res.msg || `成功取消${validTransfers.length}条入库记录`;
    resultStatus.value = true;
    transferList.value = [];
    fixedTransferForm.value.lfsnr = '';
    fixedTransferForm.value.bktxt = '';
    fixedTransferForm.value.postingDate = null;
  } catch (error: any) {
    resultMessage.value = error.message || '入库取消失败';
    resultStatus.value = false;
  } finally {
    buttonLoading1.value = false;
  }
};
</script>

<style scoped>
.work-order-return-page {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-card {
  flex: 0 0 auto;
}

.history-card :deep(.el-card__header) {
  padding: 10px 16px;
}

.history-card :deep(.el-card__body) {
  padding: 0;
}

.history-card.is-history-collapsed :deep(.el-card__body) {
  display: none;
}

.history-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.transfer-main-card {
  flex: 1 1 auto;
}

.transfer-main-card :deep(.el-card__header) {
  padding: 10px 16px;
}

.transfer-main-card.is-transfer-collapsed :deep(.el-card__body) {
  display: none;
}

.transfer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.history-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.history-collapse-icon {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  transition: transform 0.2s;
}

.history-collapse-icon.is-expanded {
  transform: rotate(90deg);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.history-header-title {
  font-size: 16px;
  font-weight: 600;
}

.history-card-body {
  padding: 12px 16px 16px;
}

.search-result {
  overflow: auto;
}

.add-transfer-bar {
  text-align: center;
  padding: 4px 0;
}

.rotate-button {
  transform: rotate(90deg);
  margin: 0 auto;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.transfer-card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.query-panel {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.source-location-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.list-footer-actions {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.qty-with-unit-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.qty-unit-text {
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.editable-cell {
  display: block;
  width: 100%;
  min-height: 32px;
  line-height: 32px;
  cursor: pointer;
}
</style>
