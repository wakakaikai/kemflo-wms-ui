<template>
  <div class="p-2 inventory-reverse-page">
    <el-card shadow="never" class="history-card" :class="{ 'is-history-collapsed': !historyExpanded }">
      <template #header>
        <div class="history-card-header">
          <div class="history-header-left" @click="historyExpanded = !historyExpanded">
            <el-icon class="history-collapse-icon" :class="{ 'is-expanded': historyExpanded }">
              <ArrowRight />
            </el-icon>
            <span class="history-header-title">库存移动历史</span>
          </div>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList" />
        </div>
      </template>

      <div v-show="historyExpanded" class="history-card-body">
        <el-form v-show="showSearch" ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
          <el-form-item label="移动类型" prop="moveType">
            <HistoryInput v-model="searchMoveType" :config="moveTypeConfig" placeholder="请输入移动类型" @keydown.enter.prevent="handleQuery" @keydown.tab.prevent="handleQuery" />
          </el-form-item>
          <el-form-item label="物料凭证号" prop="sapMaterialOrderNo">
            <HistoryInput v-model="searchSapMaterialOrderNo" :config="sapMaterialOrderNoConfig" placeholder="请输入物料凭证号" @keydown.enter.prevent="handleQuery" @keydown.tab.prevent="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" :loading="loading" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="search-result">
          <el-table ref="historyTableRef" :data="groupedRows" row-key="groupKey" height="300" border v-loading="loading" @selection-change="handleSelectionChange" @row-click="handleHistoryRowClick">
            <el-table-column type="selection" width="55" align="center" :selectable="isRowSelectable" />
            <el-table-column type="expand" width="48">
              <template #default="{ row }">
                <div class="movement-detail-panel">
                  <div v-if="row.outMovement" class="detail-section detail-from">
                    <div class="detail-section-title">从（出库）</div>
                    <MovementDetailBlock :movement="row.outMovement" />
                  </div>
                  <div v-if="row.inMovement" class="detail-section detail-to">
                    <div class="detail-section-title">目的地（入库）</div>
                    <MovementDetailBlock :movement="row.inMovement" />
                  </div>
                  <div v-if="!row.outMovement && !row.inMovement" class="detail-empty">暂无进出明细</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column v-if="columns[0].visible" label="移动类型" prop="moveType" width="90" />
            <el-table-column v-if="columns[1].visible" label="物料凭证号" prop="sapMaterialOrderNo" min-width="120" />
            <el-table-column v-if="columns[2].visible" label="凭证项次" prop="sapMaterialItem" width="90" />
            <el-table-column v-if="columns[3].visible" label="来源单号" prop="sourceDocCode" min-width="120" />
            <el-table-column v-if="columns[4].visible" label="物料编码" prop="itemCode" min-width="120" />
            <el-table-column v-if="columns[5].visible" label="物料名称" prop="itemName" min-width="140" show-overflow-tooltip />
            <el-table-column v-if="columns[6].visible" label="批次号" prop="batchCode" min-width="100" />
            <el-table-column v-if="columns[7].visible" label="数量" align="center" width="120">
              <template #default="scope">
                {{ formatQtyWithUnit(scope.row.quantity, scope.row.unit) }}
              </template>
            </el-table-column>
            <el-table-column v-if="columns[8].visible" label="进出" align="center" width="110">
              <template #default="scope">
                <el-tag v-if="scope.row.hasPair" size="small" type="warning">出+入</el-tag>
                <el-tag v-else-if="scope.row.outMovement" size="small" type="danger">出库</el-tag>
                <el-tag v-else size="small" type="success">入库</el-tag>
              </template>
            </el-table-column>
            <el-table-column v-if="columns[9].visible" label="冲销标识" align="center" width="100">
              <template #default="scope">
                <el-tag :type="getInventoryMovementReversalTagType(scope.row.reversalFlag)" size="small">
                  {{ formatInventoryMovementReversalFlag(scope.row.reversalFlag) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
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
            <span class="header-title">库存冲销列表</span>
          </div>
          <div class="header-actions" @click.stop>
            <el-button type="danger" @click="clearReverseList" :disabled="reverseList.length === 0">清空列表</el-button>
            <right-toolbar :search="false" :columns="reverseColumns" />
          </div>
        </div>
      </template>

      <div v-show="transferExpanded" class="transfer-card-body">
        <div class="query-panel">
          <el-form ref="cancelFormRef" :model="cancelForm" :rules="cancelRules" label-width="auto" :inline="true">
            <el-row :gutter="20">
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="抬头文本" prop="bktxt">
                  <HistoryInput v-model="cancelForm.bktxt" :config="bktxtConfig" placeholder="请输入抬头文本" />
                </el-form-item>
              </el-col>
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="过账日期" prop="postingDate">
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

        <el-table :data="reverseList" border style="width: 100%" max-height="520" row-key="groupKey">
          <el-table-column type="index" width="50" align="center" />
          <el-table-column v-if="reverseColumns[0].visible" label="物料凭证号" prop="sapMaterialOrderNo" min-width="120" />
          <el-table-column v-if="reverseColumns[1].visible" label="凭证项次" prop="sapMaterialItem" width="90" />
          <el-table-column v-if="reverseColumns[2].visible" label="来源单号" prop="sourceDocCode" min-width="120" />
          <el-table-column v-if="reverseColumns[3].visible" label="物料编码" prop="itemCode" min-width="120" />
          <el-table-column v-if="reverseColumns[4].visible" label="物料名称" prop="itemName" min-width="140" show-overflow-tooltip />
          <el-table-column v-if="reverseColumns[5].visible" label="批次号" prop="batchCode" min-width="100" />
          <el-table-column v-if="reverseColumns[6].visible" label="数量" align="center" width="120">
            <template #default="scope">
              {{ formatQtyWithUnit(scope.row.quantity, scope.row.unit) }}
            </template>
          </el-table-column>
          <el-table-column v-if="reverseColumns[7].visible" label="进出" align="center" width="110">
            <template #default="scope">
              <el-tag v-if="scope.row.hasPair" size="small" type="warning">出+入</el-tag>
              <el-tag v-else-if="scope.row.outMovement" size="small" type="danger">出库</el-tag>
              <el-tag v-else size="small" type="success">入库</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template #default="scope">
              <el-button type="danger" link icon="Delete" @click.stop="removeFromReverseList(scope.$index)"></el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="text-align: center">
          <el-button :loading="buttonLoading" type="primary" @click="submitCancel" :disabled="reverseList.length === 0">提交冲销</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup name="InventoryReverse" lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ArrowRight, Bell, Switch } from '@element-plus/icons-vue';
import { listInventoryMovement } from '@/api/wms/inventoryMovement';
import { syncSapMaterialOrderNoEmptyFilter } from '@/api/wms/inventoryMovement/query';
import { InventoryMovementQuery, InventoryMovementVO } from '@/api/wms/inventoryMovement/types';
import { buildInventoryCancelPayloadByVoucher, cancelInventoryMovement } from '@/api/wms/inventoryDetail';
import { formatInventoryMovementReversalFlag, getInventoryMovementReversalTagType, isInventoryMovementReversed } from '@/api/wms/workOrderReturn';
import { HttpStatus } from '@/enums/RespEnum';
import { formatQty } from '@/utils/ruoyi';
import { HistoryConfig } from '@/types/history';
import HistoryInput from '@/components/HistoryInput/index.vue';
import MovementDetailBlock from './components/MovementDetailBlock.vue';

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
  poItemNo?: string;
  quantity?: number | string;
  unit?: string;
  reversalFlag?: number;
  hasPair: boolean;
  outMovement?: InventoryMovementVO;
  inMovement?: InventoryMovementVO;
  movements: InventoryMovementVO[];
}

const showSearch = ref(true);
const historyExpanded = ref(true);
const transferExpanded = ref(true);
const loading = ref(false);
const buttonLoading = ref(false);
const total = ref(0);
const inventoryDetailList = ref<InventoryMovementVO[]>([]);
const selectedSearchItems = ref<VoucherItemGroup[]>([]);
const reverseList = ref<VoucherItemGroup[]>([]);
const resultMessage = ref('');
const resultStatus = ref(false);
const historyTableRef = ref();
const queryFormRef = ref();
const cancelFormRef = ref<ElFormInstance>();
const searchMoveType = ref('');
const searchSapMaterialOrderNo = ref('');

const queryParams = ref<InventoryMovementQuery>({
  pageNum: 1,
  pageSize: 20,
  moveType: undefined,
  sapMaterialOrderNo: undefined,
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

const cancelRules = {};

const columns = ref<FieldOption[]>([
  { key: 0, label: '移动类型', visible: true, children: [] },
  { key: 1, label: '物料凭证号', visible: true, children: [] },
  { key: 2, label: '凭证项次', visible: true, children: [] },
  { key: 3, label: '来源单号', visible: true, children: [] },
  { key: 4, label: '物料编码', visible: true, children: [] },
  { key: 5, label: '物料名称', visible: true, children: [] },
  { key: 6, label: '批次号', visible: true, children: [] },
  { key: 7, label: '数量', visible: true, children: [] },
  { key: 8, label: '进出', visible: true, children: [] },
  { key: 9, label: '冲销标识', visible: true, children: [] }
]);

const reverseColumns = ref<FieldOption[]>([
  { key: 0, label: '物料凭证号', visible: true, children: [] },
  { key: 1, label: '凭证项次', visible: true, children: [] },
  { key: 2, label: '来源单号', visible: true, children: [] },
  { key: 3, label: '物料编码', visible: true, children: [] },
  { key: 4, label: '物料名称', visible: true, children: [] },
  { key: 5, label: '批次号', visible: true, children: [] },
  { key: 6, label: '数量', visible: true, children: [] },
  { key: 7, label: '进出', visible: true, children: [] }
]);

const historyPage = 'inventoryReverse';
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

const bktxtConfig: HistoryConfig = {
  key: 'bktxt',
  storage: 'indexedDB',
  maxSize: 10,
  page: historyPage,
  autoSave: true,
  component: historyComponentConfig
};

const groupedRows = computed(() => buildGroupedRows(inventoryDetailList.value));

const formatQtyWithUnit = (qty?: number | string | null, unit?: string) => {
  const text = formatQty(qty);
  if (!text) {
    return unit || '';
  }
  return unit ? `${text} ${unit}` : text;
};

const resolveRowQuantity = (row: InventoryMovementVO & Record<string, any>) => row.quantity ?? row.poQuantity;
const resolveRowUnit = (row: InventoryMovementVO & Record<string, any>) => row.unit ?? row.poUnit;

const isOutMovement = (row: InventoryMovementVO) => Number(row.inventoryDirection) === -1;
const isInMovement = (row: InventoryMovementVO) => Number(row.inventoryDirection) === 1;

function buildGroupKey(row: InventoryMovementVO) {
  return `${row.sapMaterialOrderNo ?? ''}|${row.sapMaterialItem ?? ''}`;
}

function buildGroupedRows(rows: InventoryMovementVO[]): VoucherItemGroup[] {
  const groupMap = new Map<string, VoucherItemGroup>();
  for (const row of rows) {
    const groupKey = buildGroupKey(row);
    let group = groupMap.get(groupKey);
    if (!group) {
      group = {
        groupKey,
        sapMaterialOrderNo: row.sapMaterialOrderNo,
        sapMaterialItem: row.sapMaterialItem,
        sapMaterialDocYear: row.sapMaterialDocYear,
        moveType: row.moveType,
        itemCode: row.itemCode,
        itemName: row.itemName,
        batchCode: row.batchCode,
        sourceDocCode: row.sourceDocCode,
        poItemNo: row.poItemNo,
        quantity: resolveRowQuantity(row),
        unit: resolveRowUnit(row),
        reversalFlag: row.reversalFlag,
        hasPair: false,
        movements: []
      };
      groupMap.set(groupKey, group);
    }
    group.movements.push(row);
    if (isOutMovement(row)) {
      group.outMovement = row;
    } else if (isInMovement(row)) {
      group.inMovement = row;
    }
    if (!group.moveType) {
      group.moveType = row.moveType;
    }
    if (isInventoryMovementReversed(row)) {
      group.reversalFlag = row.reversalFlag;
    }
  }

  return Array.from(groupMap.values())
    .map((group) => {
      const primary = group.outMovement ?? group.inMovement ?? group.movements[0];
      if (primary) {
        group.quantity = resolveRowQuantity(primary);
        group.unit = resolveRowUnit(primary);
        group.moveType = primary.moveType ?? group.moveType;
        group.itemCode = primary.itemCode ?? group.itemCode;
        group.itemName = primary.itemName ?? group.itemName;
        group.batchCode = primary.batchCode ?? group.batchCode;
        group.sourceDocCode = primary.sourceDocCode ?? group.sourceDocCode;
        group.poItemNo = primary.poItemNo ?? group.poItemNo;
      }
      group.hasPair = Boolean(group.outMovement && group.inMovement);
      return group;
    })
    .sort((a, b) => String(a.sapMaterialItem ?? '').localeCompare(String(b.sapMaterialItem ?? ''), undefined, { numeric: true }));
}

const disabledFutureDate = (time: Date) => {
  const now = new Date();
  now.setSeconds(now.getSeconds() + 3);
  now.setMilliseconds(0);
  return time.getTime() > now.getTime();
};

function showResultMessage(message: string, status = false) {
  resultStatus.value = status;
  resultMessage.value = message;
}

function formatPostingDate(postingDate?: string | null): string | undefined {
  if (!postingDate) {
    return undefined;
  }
  return postingDate.includes(' ') ? postingDate : `${postingDate} 00:00:00`;
}

const isRowSelectable = (row: VoucherItemGroup) => !isInventoryMovementReversed(row);

function syncCancelVoucherFromReverseList() {
  const voucherSet = new Set(reverseList.value.map((row) => String(row.sapMaterialOrderNo ?? '').trim()).filter(Boolean));
  const sapMaterialOrderNo = voucherSet.size === 1 ? [...voucherSet][0] : '';
  const matched = reverseList.value.find((row) => String(row.sapMaterialOrderNo ?? '').trim() === sapMaterialOrderNo);
  cancelForm.value.sapMaterialDocYear = matched?.sapMaterialDocYear;
}

function getSingleReverseVoucherNo(): string {
  const voucherSet = new Set(reverseList.value.map((item) => String(item.sapMaterialOrderNo ?? '').trim()).filter(Boolean));
  return voucherSet.size === 1 ? [...voucherSet][0] : '';
}

function handleHistoryRowClick(row: VoucherItemGroup, _column: any, event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.closest('.el-checkbox, .el-table__expand-icon, .el-button')) {
    return;
  }
  historyTableRef.value?.toggleRowExpansion(row);
}

const getList = async () => {
  syncSapMaterialOrderNoEmptyFilter(queryParams.value);
  loading.value = true;
  try {
    const res = await listInventoryMovement(queryParams.value);
    inventoryDetailList.value = res.rows || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
};

const handleQuery = async () => {
  const moveType = String(searchMoveType.value ?? '').trim();
  const voucherNo = String(searchSapMaterialOrderNo.value ?? '').trim();
  queryParams.value.moveType = moveType || undefined;
  queryParams.value.sapMaterialOrderNo = voucherNo || undefined;
  queryParams.value.pageNum = 1;
  resultMessage.value = '';
  await getList();
};

const resetQuery = () => {
  searchMoveType.value = '';
  searchSapMaterialOrderNo.value = '';
  queryParams.value.moveType = undefined;
  queryParams.value.sapMaterialOrderNo = undefined;
  queryParams.value.sapMaterialOrderNoEmpty = true;
  selectedSearchItems.value = [];
  historyTableRef.value?.clearSelection?.();
  resultMessage.value = '';
  handleQuery();
};

const handleSelectionChange = (selection: VoucherItemGroup[]) => {
  selectedSearchItems.value = selection;
};

const addSelectedToReverseList = () => {
  if (selectedSearchItems.value.length === 0) {
    showResultMessage('请先选择要冲销的记录');
    return;
  }

  const reversedItems = selectedSearchItems.value.filter((item) => isInventoryMovementReversed(item));
  if (reversedItems.length > 0) {
    showResultMessage('已冲销记录不能加入冲销列表');
    return;
  }

  const selectedVouchers = new Set(selectedSearchItems.value.map((item) => String(item.sapMaterialOrderNo ?? '').trim()).filter(Boolean));
  if (selectedVouchers.size === 0) {
    showResultMessage('所选记录缺少物料凭证号');
    return;
  }
  if (selectedVouchers.size > 1) {
    showResultMessage('一次只能加入同一物料凭证号的记录');
    return;
  }

  const selectedVoucher = [...selectedVouchers][0] || '';
  if (reverseList.value.length > 0) {
    const existingVoucher = String(reverseList.value[0].sapMaterialOrderNo ?? '').trim();
    if (existingVoucher && selectedVoucher && existingVoucher !== selectedVoucher) {
      showResultMessage(`冲销列表已锁定凭证 ${existingVoucher}，请先清空后再加入其他凭证`);
      return;
    }
  }

  let addedCount = 0;
  selectedSearchItems.value.forEach((item) => {
    const exists = reverseList.value.some((row) => row.groupKey === item.groupKey);
    if (!exists) {
      reverseList.value.push({ ...item, movements: [...item.movements] });
      addedCount++;
    }
  });

  syncCancelVoucherFromReverseList();
  historyTableRef.value?.clearSelection?.();
  selectedSearchItems.value = [];
  showResultMessage(`成功加入${addedCount}条记录`, true);
};

const removeFromReverseList = (index: number) => {
  reverseList.value.splice(index, 1);
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
  const valid = await cancelFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  if (reverseList.value.length === 0) {
    showResultMessage('请先加入冲销记录');
    return;
  }
  const sapMaterialOrderNo = getSingleReverseVoucherNo();
  if (!sapMaterialOrderNo) {
    showResultMessage('冲销列表只能包含一个物料凭证号');
    return;
  }

  const sapMaterialItems = reverseList.value.map((item) => String(item.sapMaterialItem ?? '').trim()).filter(Boolean);
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
.inventory-reverse-page {
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
  font-size: 14px;
  color: var(--el-text-color-secondary);
  transition: transform 0.2s;
}

.history-collapse-icon.is-expanded {
  transform: rotate(90deg);
}

.header-title,
.history-header-title {
  font-size: 14px;
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

.movement-detail-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 8px 12px 12px;
  background: var(--el-fill-color-blank);
}

.detail-section {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px 14px;
  background: #fff;
}

.detail-from {
  border-left: 3px solid var(--el-color-danger);
}

.detail-to {
  border-left: 3px solid var(--el-color-success);
}

.detail-section-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
}

.detail-empty {
  grid-column: 1 / -1;
  color: var(--el-text-color-secondary);
  text-align: center;
  padding: 12px 0;
}

@media (max-width: 992px) {
  .movement-detail-panel {
    grid-template-columns: 1fr;
  }
}
</style>
