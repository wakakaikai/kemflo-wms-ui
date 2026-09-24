<template>
  <div class="p-2 purchase-reverse-page">
    <el-card shadow="never" class="history-card" :class="{ 'is-history-collapsed': !historyExpanded }">
      <template #header>
        <div class="history-card-header">
          <div class="history-header-left" @click="historyExpanded = !historyExpanded">
            <el-icon class="history-collapse-icon" :class="{ 'is-expanded': historyExpanded }">
              <ArrowRight />
            </el-icon>
            <span class="history-header-title">采购入库历史</span>
          </div>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList" />
        </div>
      </template>

      <div v-show="historyExpanded" class="history-card-body">
        <el-form v-show="showSearch" :inline="true" label-width="auto">
          <el-form-item label="移动类型">
            <HistoryInput v-model="searchMoveType" :config="moveTypeConfig" placeholder="请输入移动类型" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="物料凭证号">
            <HistoryInput v-model="searchSapMaterialOrderNo" :config="sapMaterialOrderNoConfig" placeholder="请输入物料凭证号" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="采购单号">
            <HistoryInput v-model="searchSourceDocCode" :config="sourceDocCodeConfig" placeholder="请输入采购单号" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" :loading="loading" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="search-result">
          <ReverseMovementTreeTable ref="historyTableRef" :groups="groupedRows" layout="purchase" :columns="columns" height="300" :loading="loading" :default-expand-all="false" @selection-change="handleSelectionChange" />
          <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
        </div>
      </div>
    </el-card>

    <div class="add-transfer-bar">
      <el-button type="primary" @click="addSelectedToReverseList" circle class="rotate-button">
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
            <span class="header-title">采购冲销列表</span>
          </div>
          <div class="header-actions" @click.stop>
            <el-button type="danger" @click="clearReverseList" :disabled="reverseList.length === 0">清空列表</el-button>
            <right-toolbar :search="false" :columns="columns" />
          </div>
        </div>
      </template>

      <div v-show="transferExpanded" class="transfer-card-body">
        <div class="query-panel">
          <el-form :model="cancelForm" label-width="auto" :inline="true">
            <el-row :gutter="20">
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="抬头文本">
                  <HistoryInput v-model="cancelForm.bktxt" :config="bktxtConfig" placeholder="请输入抬头文本" />
                </el-form-item>
              </el-col>
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="过账日期">
                  <el-date-picker v-model="cancelForm.postingDate" clearable type="date" value-format="YYYY-MM-DD" :disabled-date="disabledFutureDate" placeholder="请选择过账日期" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div v-if="resultMessage" class="result-alert">
          <el-alert show-icon center :title="resultMessage" :type="resultStatus ? 'success' : 'error'" :closable="true">
            <template #icon>
              <Bell />
            </template>
          </el-alert>
        </div>

        <ReverseMovementTreeTable :groups="reverseList" layout="purchase" mode="reverse" :columns="columns" max-height="520">
          <template #trailing>
            <el-table-column label="操作" v-bind="REVERSE_DATA_COLUMN.action">
              <template #default="scope">
                <el-button v-if="scope.row.isGroupHead" type="danger" link icon="Delete" @click.stop="removeFromReverseList(scope.row.groupKey)"></el-button>
              </template>
            </el-table-column>
          </template>
        </ReverseMovementTreeTable>

        <div style="text-align: center">
          <el-button :loading="buttonLoading" type="primary" @click="submitCancel" :disabled="reverseList.length === 0">提交冲销</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup name="PurchaseReverse" lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ArrowRight, Bell, Switch } from '@element-plus/icons-vue';
import { listInventoryMovement } from '@/api/wms/inventoryMovement';
import { syncSapMaterialOrderNoEmptyFilter } from '@/api/wms/inventoryMovement/query';
import { InventoryMovementQuery, InventoryMovementVO } from '@/api/wms/inventoryMovement/types';
import { buildInventoryCancelPayloadByVoucher, cancelInventoryMovement } from '@/api/wms/inventoryDetail';
import { isInventoryMovementReversed } from '@/api/wms/workOrderReturn';
import { HttpStatus } from '@/enums/RespEnum';
import { HistoryConfig } from '@/types/history';
import HistoryInput from '@/components/HistoryInput/index.vue';
import ReverseMovementTreeTable from '@/views/wms/inventoryReverse/components/ReverseMovementTreeTable.vue';
import { createReverseColumnOptions, REVERSE_DATA_COLUMN } from '@/views/wms/inventoryReverse/utils/reverseTableLayout';
import {
  buildMovementDisplayGroups,
  collectCancelSapMaterialItemsFromGroups,
  enrichPrimaryReceiptGroupWithSubcontractChildren,
  getMainRowMoveType,
  isTreeParentRow,
  normalizeReverseGroupRow,
  resolveReverseGroupsFromSelection,
  ReverseTreeRow,
  validateReverseCancelSapItems
} from '@/views/wms/inventoryReverse/utils/reverseMovement';

interface VoucherItemGroup {
  groupKey: string;
  sapMaterialOrderNo?: string;
  sapMaterialItem?: string;
  sapMaterialDocYear?: number | string;
  moveType?: string;
  itemCode?: string;
  itemName?: string;
  batchCode?: string;
  sourceDocCode?: string;
  sourceDocItem?: string;
  quantity?: number | string;
  unit?: string;
  reversalFlag?: number;
  hasPair: boolean;
  outMovement?: InventoryMovementVO;
  inMovement?: InventoryMovementVO;
  movements: InventoryMovementVO[];
  mainMovement?: InventoryMovementVO;
  childMovements?: InventoryMovementVO[];
  childMovementList?: InventoryMovementVO[];
  allMovementList?: InventoryMovementVO[];
}

const showSearch = ref(true);
const historyExpanded = ref(true);
const transferExpanded = ref(true);
const loading = ref(false);
const buttonLoading = ref(false);
const total = ref(0);
const inventoryDetailList = ref<VoucherItemGroup[]>([]);
const selectedSearchItems = ref<VoucherItemGroup[]>([]);
const reverseList = ref<VoucherItemGroup[]>([]);
const resultMessage = ref('');
const resultStatus = ref(false);
const historyTableRef = ref();
const searchMoveType = ref('');
const searchSapMaterialOrderNo = ref('');
const searchSourceDocCode = ref('');

const queryParams = ref<InventoryMovementQuery>({
  pageNum: 1,
  pageSize: 20,
  sourceDocTypeList: ['PO', 'STO'],
  sapMaterialOrderNo: undefined,
  sourceDocCode: undefined,
  sapMaterialOrderNoEmpty: true,
  params: {}
});

const cancelForm = ref({
  sapMaterialDocYear: undefined as number | string | undefined,
  lfsnr: '',
  mtsnr: '',
  bktxt: '',
  postingDate: null as string | null
});

const columns = ref<FieldOption[]>(createReverseColumnOptions('purchase'));

const historyPage = 'purchaseReverse';
const historyComponentConfig = {
  showDropdown: true,
  showTime: false,
  showDelete: true,
  dropdownMaxHeight: '300px'
};

const moveTypeConfig: HistoryConfig = {
  key: 'moveType',
  storage: 'indexedDB',
  maxSize: 10,
  page: historyPage,
  autoSave: true,
  component: historyComponentConfig
};

const sapMaterialOrderNoConfig: HistoryConfig = {
  key: 'sapMaterialOrderNo',
  storage: 'indexedDB',
  maxSize: 10,
  page: historyPage,
  autoSave: true,
  component: historyComponentConfig
};

const sourceDocCodeConfig: HistoryConfig = {
  key: 'sourceDocCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: historyPage,
  autoSave: true,
  component: historyComponentConfig
};

const bktxtConfig: HistoryConfig = {
  key: 'bktxt',
  storage: 'indexedDB',
  maxSize: 10,
  page: historyPage,
  autoSave: true,
  component: historyComponentConfig
};

const groupedRows = computed(() => inventoryDetailList.value);

function buildGroupKey(row: Pick<VoucherItemGroup, 'sapMaterialDocYear' | 'sapMaterialOrderNo' | 'sapMaterialItem'>, includeMaterialItem = true) {
  const voucherKey = `${String(row.sapMaterialDocYear ?? '').trim()}|${String(row.sapMaterialOrderNo ?? '').trim()}`;
  return includeMaterialItem ? `${voucherKey}|${String(row.sapMaterialItem ?? '').trim()}` : voucherKey;
}

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

function syncCancelVoucherFromReverseList() {
  const voucherSet = new Set(reverseList.value.map((row) => buildGroupKey(row, false)));
  const matched = voucherSet.size === 1 ? reverseList.value[0] : undefined;
  cancelForm.value.sapMaterialDocYear = matched?.sapMaterialDocYear;
}

function getSingleReverseVoucherNo(): string {
  const rows = reverseList.value.filter((item) => String(item.sapMaterialOrderNo ?? '').trim());
  const voucherSet = new Set(rows.map((row) => buildGroupKey(row, false)));
  return voucherSet.size === 1 ? String(rows[0]?.sapMaterialOrderNo ?? '').trim() : '';
}

function showResultMessage(message: string, status = false) {
  resultStatus.value = status;
  resultMessage.value = message;
}

const getList = async () => {
  syncSapMaterialOrderNoEmptyFilter(queryParams.value);
  loading.value = true;
  try {
    const res = await listInventoryMovement(queryParams.value);
    inventoryDetailList.value = buildMovementDisplayGroups((res.rows || []) as InventoryMovementVO[]) as VoucherItemGroup[];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
};

const handleQuery = async () => {
  const moveType = String(searchMoveType.value ?? '').trim();
  const voucherNo = String(searchSapMaterialOrderNo.value ?? '').trim();
  const sourceDocCode = String(searchSourceDocCode.value ?? '').trim();
  queryParams.value.moveType = moveType || undefined;
  queryParams.value.sapMaterialOrderNo = voucherNo || undefined;
  queryParams.value.sourceDocCode = sourceDocCode || undefined;
  queryParams.value.pageNum = 1;
  resultMessage.value = '';
  await getList();
};

const resetQuery = () => {
  searchMoveType.value = '';
  searchSapMaterialOrderNo.value = '';
  searchSourceDocCode.value = '';
  queryParams.value.moveType = undefined;
  queryParams.value.sapMaterialOrderNo = undefined;
  queryParams.value.sourceDocCode = undefined;
  queryParams.value.sapMaterialOrderNoEmpty = true;
  selectedSearchItems.value = [];
  historyTableRef.value?.clearSelection?.();
  resultMessage.value = '';
  handleQuery();
};

const handleSelectionChange = (selection: ReverseTreeRow[]) => {
  selectedSearchItems.value = selection
    .filter(isTreeParentRow)
    .map((row) => inventoryDetailList.value.find((group) => group.groupKey === row.groupKey))
    .filter((group): group is VoucherItemGroup => Boolean(group));
};

const addSelectedToReverseList = async () => {
  if (selectedSearchItems.value.length === 0) {
    showResultMessage('请先选择要冲销的记录');
    return;
  }

  const groupsToAdd = resolveReverseGroupsFromSelection(selectedSearchItems.value, inventoryDetailList.value);
  if (!groupsToAdd.length) {
    showResultMessage('未解析到可冲销的分组');
    return;
  }

  const reversedItems = groupsToAdd.filter((item) => isInventoryMovementReversed(item));
  if (reversedItems.length > 0) {
    showResultMessage('已冲销记录不能加入冲销列表');
    return;
  }

  const selectedVouchers = new Set(groupsToAdd.filter((item) => String(item.sapMaterialOrderNo ?? '').trim()).map((item) => buildGroupKey(item, false)));
  if (selectedVouchers.size === 0) {
    showResultMessage('所选记录缺少物料凭证号');
    return;
  }
  if (selectedVouchers.size > 1) {
    showResultMessage('冲销列表只能包含一个物料凭证号');
    return;
  }

  const selectedVoucher = [...selectedVouchers][0] || '';
  if (reverseList.value.length > 0) {
    const existingVoucher = buildGroupKey(reverseList.value[0], false);
    if (existingVoucher && selectedVoucher && existingVoucher !== selectedVoucher) {
      const existingYear = String(reverseList.value[0].sapMaterialDocYear ?? '').trim();
      const existingVoucherNo = String(reverseList.value[0].sapMaterialOrderNo ?? '').trim();
      showResultMessage(`冲销列表已锁定凭证 ${existingYear}/${existingVoucherNo}，请先清空后再加入其他凭证`);
      return;
    }
  }

  let addedCount = 0;
  for (const item of groupsToAdd) {
    const exists = reverseList.value.some((row) => row.groupKey === item.groupKey);
    if (exists) {
      continue;
    }
    const enriched = await enrichPrimaryReceiptGroupWithSubcontractChildren(item);
    const normalized = normalizeReverseGroupRow(enriched);
    reverseList.value.push({
      ...normalized,
      moveType: getMainRowMoveType(normalized)
    });
    addedCount++;
  }

  syncCancelVoucherFromReverseList();
  historyTableRef.value?.clearSelection?.();
  selectedSearchItems.value = [];
  showResultMessage(`成功加入${addedCount}条记录`, true);
};

const removeFromReverseList = (groupKey?: string) => {
  if (!groupKey) {
    return;
  }
  const index = reverseList.value.findIndex((row) => row.groupKey === groupKey);
  if (index >= 0) {
    reverseList.value.splice(index, 1);
  }
  syncCancelVoucherFromReverseList();
};

const clearReverseList = () => {
  reverseList.value = [];
  cancelForm.value.sapMaterialDocYear = undefined;
  cancelForm.value.bktxt = '';
  cancelForm.value.postingDate = null;
  resultMessage.value = '';
};

const submitCancel = async () => {
  if (reverseList.value.length === 0) {
    showResultMessage('请先加入冲销记录');
    return;
  }

  const sapMaterialOrderNo = getSingleReverseVoucherNo();
  if (!sapMaterialOrderNo) {
    showResultMessage('冲销列表只能包含一个物料凭证号');
    return;
  }

  const rowsForCancel = reverseList.value.map((row) => {
    const fromHistory = inventoryDetailList.value.find((item) => item.groupKey === row.groupKey);
    return normalizeReverseGroupRow(fromHistory ? { ...fromHistory, ...row } : row);
  });

  const cancelItemError = validateReverseCancelSapItems(rowsForCancel);
  if (cancelItemError) {
    showResultMessage(cancelItemError);
    return;
  }

  const sapMaterialItems = collectCancelSapMaterialItemsFromGroups(rowsForCancel);
  if (sapMaterialItems.length === 0) {
    showResultMessage('冲销列表缺少物料凭证项次');
    return;
  }

  buttonLoading.value = true;
  resultMessage.value = '';
  try {
    const payload = buildInventoryCancelPayloadByVoucher(sapMaterialOrderNo, {
      sapMaterialDocYear: cancelForm.value.sapMaterialDocYear,
      sapMaterialItems,
      lfsnr: cancelForm.value.lfsnr,
      mtsnr: cancelForm.value.mtsnr,
      bktxt: cancelForm.value.bktxt,
      postingDate: formatPostingDate(cancelForm.value.postingDate)
    });
    const res: any = await cancelInventoryMovement(payload);
    if (res.code !== HttpStatus.SUCCESS) {
      resultStatus.value = false;
      resultMessage.value = res.msg || '冲销失败';
      return;
    }
    resultStatus.value = true;
    resultMessage.value = res.msg || res.data || `凭证 ${sapMaterialOrderNo} 项次 ${sapMaterialItems.join(',')} 冲销成功`;
    reverseList.value = [];
    cancelForm.value.sapMaterialDocYear = undefined;
    cancelForm.value.lfsnr = '';
    cancelForm.value.mtsnr = '';
    cancelForm.value.bktxt = '';
    cancelForm.value.postingDate = null;
    await getList();
  } catch (error: any) {
    resultStatus.value = false;
    resultMessage.value = error.message || '冲销失败';
  } finally {
    buttonLoading.value = false;
  }
};

onMounted(() => {
  getList();
});
</script>

<style scoped>
.purchase-reverse-page {
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

.header-title,
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

.result-alert {
  margin: 0;
}
</style>
