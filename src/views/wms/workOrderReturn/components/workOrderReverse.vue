<template>
  <div class="p-2 work-order-reverse-page">
    <el-card shadow="never" class="main-card" :class="{ 'is-collapsed': !pageExpanded }">
      <template #header>
        <div class="card-header">
          <div class="card-header-left" @click="pageExpanded = !pageExpanded">
            <el-icon class="collapse-icon" :class="{ 'is-expanded': pageExpanded }">
              <ArrowRight />
            </el-icon>
            <span class="card-title">工单冲销</span>
          </div>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList" />
        </div>
      </template>

      <div v-show="pageExpanded" class="card-body">
        <div class="cancel-toolbar">
          <el-form ref="cancelFormRef" :model="cancelForm" :rules="cancelRules" label-width="auto" class="cancel-form">
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12" :md="6" :lg="6">
                <el-form-item label="物料凭证号">
                  <HistoryInput
                    v-model="searchSapMaterialOrderNo"
                    :config="sapMaterialOrderNoConfig"
                    placeholder="请输入物料凭证号"
                    @keydown.enter.prevent="handleQuery"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6" :lg="6">
                <el-form-item label="工单号">
                  <HistoryInput
                    v-model="searchSourceDocCode"
                    :config="sourceDocCodeConfig"
                    placeholder="请输入工单号"
                    @keydown.enter.prevent="handleQuery"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="12" :lg="12">
                <el-form-item label=" ">
                  <el-button type="primary" icon="Search" :loading="loading" @click="handleQuery">搜索</el-button>
                  <el-button icon="Refresh" @click="resetAll">重置</el-button>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item label="冲销凭证号" prop="sapMaterialOrderNo">
                  <el-input v-model="cancelForm.sapMaterialOrderNo" placeholder="搜索后锁定，用于提交" readonly />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item label="抬头文本" prop="bktxt">
                  <HistoryInput v-model="cancelForm.bktxt" :config="bktxtConfig" placeholder="抬头文本" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item label="过账日期" prop="postingDate">
                  <el-date-picker
                    v-model="cancelForm.postingDate"
                    clearable
                    type="date"
                    value-format="YYYY-MM-DD"
                    :disabled-date="disabledFutureDate"
                    placeholder="过账日期"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item label=" ">
                  <el-button type="primary" :loading="buttonLoading" @click="submitCancel">提交冲销</el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div v-if="resultMessage" class="result-alert">
          <el-alert show-icon center :title="resultMessage" :type="resultStatus ? 'success' : 'error'" :closable="true" />
        </div>

        <el-table
          ref="tableRef"
          :data="groupedRows"
          row-key="groupKey"
          height="420"
          border
          v-loading="loading"
          highlight-current-row
          class="group-table"
          @row-click="handleRowClick"
        >
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
          <el-table-column v-if="columns[0].visible" label="物料凭证号" prop="sapMaterialOrderNo" min-width="120" />
          <el-table-column v-if="columns[1].visible" label="凭证项次" prop="sapMaterialItem" width="90" />
          <el-table-column v-if="columns[2].visible" label="移动类型" prop="moveType" width="90" />
          <el-table-column v-if="columns[3].visible" label="工单号" prop="sourceDocCode" min-width="120" />
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
      </div>
    </el-card>
  </div>
</template>

<script setup name="WorkOrderReverse" lang="ts">
import { computed, ref } from 'vue';
import { ArrowRight } from '@element-plus/icons-vue';
import { listInventoryMovement } from '@/api/wms/inventoryMovement';
import { InventoryMovementQuery, InventoryMovementVO } from '@/api/wms/inventoryMovement/types';
import { buildInventoryCancelPayloadByVoucher, cancelInventoryMovement } from '@/api/wms/inventoryDetail';
import { formatInventoryMovementReversalFlag, getInventoryMovementReversalTagType, isInventoryMovementReversed } from '@/api/wms/workOrderReturn';
import { HttpStatus } from '@/enums/RespEnum';
import { formatQty } from '@/utils/ruoyi';
import { HistoryConfig } from '@/types/history';
import HistoryInput from '@/components/HistoryInput/index.vue';
import MovementDetailBlock from '@/views/wms/inventoryReverse/components/MovementDetailBlock.vue';

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

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const showSearch = ref(true);
const pageExpanded = ref(true);
const loading = ref(false);
const buttonLoading = ref(false);
const inventoryDetailList = ref<InventoryMovementVO[]>([]);
const resultMessage = ref('');
const resultStatus = ref(false);
const tableRef = ref();

const cancelFormRef = ref<ElFormInstance>();
const searchSapMaterialOrderNo = ref('');
const searchSourceDocCode = ref('');

const queryParams = ref<InventoryMovementQuery>({
  pageNum: 1,
  pageSize: 10000,
  sourceDocType: 'WO',
  sapMaterialOrderNo: undefined,
  sourceDocCode: undefined,
  params: {}
});

const cancelForm = ref({
  sapMaterialOrderNo: '',
  sapMaterialDocYear: undefined as number | string | undefined,
  lfsnr: '',
  mtsnr: '',
  bktxt: '',
  postingDate: null as string | null
});

const cancelRules = {
  sapMaterialOrderNo: [{ required: true, message: '请先搜索并确认物料凭证号', trigger: 'change' }]
};

const columns = ref<FieldOption[]>([
  { key: 0, label: '物料凭证号', visible: true, children: [] },
  { key: 1, label: '凭证项次', visible: true, children: [] },
  { key: 2, label: '移动类型', visible: true, children: [] },
  { key: 3, label: '工单号', visible: true, children: [] },
  { key: 4, label: '物料编码', visible: true, children: [] },
  { key: 5, label: '物料名称', visible: true, children: [] },
  { key: 6, label: '批次号', visible: true, children: [] },
  { key: 7, label: '数量', visible: true, children: [] },
  { key: 8, label: '进出', visible: true, children: [] },
  { key: 9, label: '冲销标识', visible: true, children: [] }
]);

const historyPage = 'workOrderReverse';
const historyComponentConfig = {
  showDropdown: true,
  showTime: false,
  showDelete: true,
  dropdownMaxHeight: '300px'
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

function formatPostingDate(postingDate?: string | null): string | undefined {
  if (!postingDate) {
    return undefined;
  }
  return postingDate.includes(' ') ? postingDate : `${postingDate} 00:00:00`;
}

function syncCancelVoucherFromList() {
  const voucherNo = String(searchSapMaterialOrderNo.value ?? '').trim();
  if (voucherNo) {
    cancelForm.value.sapMaterialOrderNo = voucherNo;
  } else {
    const voucherSet = new Set(
      inventoryDetailList.value.map((row) => String(row.sapMaterialOrderNo ?? '').trim()).filter(Boolean)
    );
    cancelForm.value.sapMaterialOrderNo = voucherSet.size === 1 ? [...voucherSet][0] : '';
  }
  const matchedRow = inventoryDetailList.value.find(
    (row) => String(row.sapMaterialOrderNo ?? '').trim() === cancelForm.value.sapMaterialOrderNo
  );
  if (matchedRow?.sapMaterialDocYear != null) {
    cancelForm.value.sapMaterialDocYear = matchedRow.sapMaterialDocYear;
  } else if (!cancelForm.value.sapMaterialOrderNo) {
    cancelForm.value.sapMaterialDocYear = undefined;
  }
}

function toggleRowExpand(row: VoucherItemGroup) {
  tableRef.value?.toggleRowExpansion(row);
}

function handleRowClick(row: VoucherItemGroup) {
  toggleRowExpand(row);
}

const getList = async () => {
  if (!queryParams.value.sapMaterialOrderNo && !queryParams.value.sourceDocCode) {
    return;
  }
  loading.value = true;
  try {
    const res = await listInventoryMovement(queryParams.value);
    inventoryDetailList.value = res.rows;
    syncCancelVoucherFromList();
  } finally {
    loading.value = false;
  }
};

const handleQuery = async () => {
  const voucherNo = String(searchSapMaterialOrderNo.value ?? '').trim();
  const sourceDocCode = String(searchSourceDocCode.value ?? '').trim();
  if (!voucherNo && !sourceDocCode) {
    proxy?.$modal.msgWarning('请输入物料凭证号或工单号');
    return;
  }
  queryParams.value.sapMaterialOrderNo = voucherNo || undefined;
  queryParams.value.sourceDocCode = sourceDocCode || undefined;
  queryParams.value.sourceDocType = 'WO';
  queryParams.value.pageNum = 1;
  await getList();
};

const resetAll = () => {
  cancelFormRef.value?.resetFields();
  searchSapMaterialOrderNo.value = '';
  searchSourceDocCode.value = '';
  cancelForm.value = {
    sapMaterialOrderNo: '',
    sapMaterialDocYear: undefined,
    lfsnr: '',
    mtsnr: '',
    bktxt: '',
    postingDate: null
  };
  queryParams.value.sapMaterialOrderNo = undefined;
  queryParams.value.sourceDocCode = undefined;
  queryParams.value.sourceDocType = 'WO';
  inventoryDetailList.value = [];
  resultMessage.value = '';
  resultStatus.value = false;
};

const submitCancel = async () => {
  const valid = await cancelFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  if (!String(cancelForm.value.sapMaterialOrderNo ?? '').trim()) {
    proxy?.$modal.msgWarning('请先搜索物料凭证号后再提交冲销');
    return;
  }

  buttonLoading.value = true;
  resultMessage.value = '';
  try {
    const payload = buildInventoryCancelPayloadByVoucher(cancelForm.value.sapMaterialOrderNo, {
      sapMaterialDocYear: cancelForm.value.sapMaterialDocYear,
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
    resultMessage.value = res.msg || res.data || `凭证 ${payload.sapMaterialOrderNo} 冲销成功`;
    cancelForm.value.lfsnr = '';
    cancelForm.value.mtsnr = '';
    cancelForm.value.bktxt = '';
    cancelForm.value.postingDate = null;
    if (queryParams.value.sapMaterialOrderNo || queryParams.value.sourceDocCode) {
      await getList();
    }
  } catch (error: any) {
    resultStatus.value = false;
    resultMessage.value = error.message || '冲销失败';
  } finally {
    buttonLoading.value = false;
  }
};
</script>

<style scoped>
.work-order-reverse-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.main-card :deep(.el-card__header) {
  padding: 10px 16px;
}

.main-card :deep(.el-card__body) {
  padding: 0;
}

.main-card.is-collapsed :deep(.el-card__body) {
  display: none;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.collapse-icon {
  font-size: 14px;
  transition: transform 0.2s;
}

.collapse-icon.is-expanded {
  transform: rotate(90deg);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
}

.card-body {
  padding: 12px 16px 16px;
}

.cancel-toolbar {
  margin-bottom: 12px;
  padding: 12px 14px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.cancel-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.cancel-form :deep(.el-form-item__content) {
  flex: 1;
}

.cancel-form :deep(.el-date-editor.el-input) {
  width: 100%;
}

.result-alert {
  margin: 10px 0;
}

.group-table :deep(.el-table__row) {
  cursor: pointer;
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
