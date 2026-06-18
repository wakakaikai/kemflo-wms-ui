<template>
  <div class="p-2 migo-page">
    <el-card shadow="never" class="toolbar-card">
      <div class="migo-toolbar">
        <div class="toolbar-left">
          <el-button v-hasPermi="['wms:goodsMovement:check']" type="primary" plain icon="CircleCheck" :loading="checkLoading" @click="handleCheck">检查</el-button>
          <el-button v-hasPermi="['wms:goodsMovement:post']" type="success" plain icon="Finished" :loading="postLoading" :disabled="isReadonly" @click="handlePost">过账</el-button>
          <el-button icon="Refresh" @click="handleRefresh">刷新</el-button>
        </div>
        <div class="toolbar-right">
          <span class="page-title">货物移动 (MIGO)</span>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="selection-card">
      <el-form :inline="true" label-width="auto" class="selection-form">
        <el-form-item label="操作">
          <el-select v-model="header.actionType" style="width: 160px" @change="handleActionChange">
            <el-option v-for="item in actionTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="参考凭证">
          <el-select v-model="header.referenceType" style="width: 160px" @change="handleReferenceChange">
            <el-option v-for="item in referenceTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isDisplayMode" label="物料凭证号">
          <HistoryInput v-model="header.referenceNo" :config="materialDocConfig" placeholder="请输入物料凭证号" style="width: 200px" @keydown.enter.prevent="handleExecute" />
        </el-form-item>
        <el-form-item v-if="isTransferMode" label="移动类型">
          <el-select v-model="header.moveType" style="width: 100px" @change="handleMoveTypeChange">
            <el-option v-for="item in moveTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <span class="move-type-desc">{{ moveTypeDesc }}</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" :loading="loading" @click="handleExecute">执行</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="header-card">
      <template #header>
        <span>抬头数据</span>
      </template>
      <el-tabs v-model="headerTab">
        <el-tab-pane label="常规" name="general">
          <el-form :model="header" :inline="true" label-width="90px" class="header-form">
            <el-form-item label="凭证日期">
              <el-date-picker v-model="header.documentDate" type="date" value-format="YYYY-MM-DD" :disabled="isReadonly" placeholder="凭证日期" />
            </el-form-item>
            <el-form-item label="过账日期">
              <el-date-picker v-model="header.postingDate" type="date" value-format="YYYY-MM-DD" :disabled="isReadonly" :disabled-date="disabledFutureDate" placeholder="过账日期" />
            </el-form-item>
            <el-form-item label="物料凭证">
              <el-input v-model="header.materialDocNo" placeholder="过账后自动生成" readonly style="width: 180px" />
            </el-form-item>
            <el-form-item label="抬头文本">
              <el-input v-model="header.headerText" :disabled="isReadonly" placeholder="凭证抬头文本" style="width: 240px" />
            </el-form-item>
            <el-form-item v-if="!isReadonly" label="接收方">
              <el-input v-model="receiver" placeholder="接收方" style="width: 160px">
                <template #append>
                  <el-button icon="Search" @click="showUserCollectionsDialog" />
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-card v-if="isTransferMode" shadow="never" class="search-card">
      <template #header>
        <span>库存选择</span>
      </template>
      <el-form :model="inventoryQuery" :inline="true" label-width="auto">
        <el-form-item label="物料编码">
          <el-input v-model="inventoryQuery.itemCode" placeholder="物料编码" clearable @keyup.enter="searchInventory" />
        </el-form-item>
        <el-form-item label="库位编码">
          <el-input v-model="inventoryQuery.locationCode" placeholder="库位编码" clearable @keyup.enter="searchInventory" />
        </el-form-item>
        <el-form-item label="批次号">
          <el-input v-model="inventoryQuery.batchCode" placeholder="批次号" clearable @keyup.enter="searchInventory" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" :loading="inventoryLoading" @click="searchInventory">搜索</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="inventoryList" border height="220" v-loading="inventoryLoading" @selection-change="handleInventorySelection">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="物料编码" prop="itemCode" min-width="130" />
        <el-table-column label="物料名称" prop="itemName" min-width="150" show-overflow-tooltip />
        <el-table-column label="批次号" prop="batchCode" width="110" />
        <el-table-column label="非限制" prop="availableQuantity" width="80" align="center" />
        <el-table-column label="质检" prop="inspectionQuantity" width="70" align="center" />
        <el-table-column label="冻结" prop="blockedQuantity" width="70" align="center" />
        <el-table-column label="库位" prop="locationCode" width="100" />
        <el-table-column label="特殊库存" prop="specialInventoryFlag" width="90" align="center">
          <template #default="scope">
            <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
          </template>
        </el-table-column>
      </el-table>
      <div class="add-line-action">
        <el-button type="primary" circle @click="addSelectedToLines">
          <el-icon><Plus /></el-icon>
        </el-button>
        <span class="add-line-hint">添加到行项目</span>
      </div>
    </el-card>

    <el-card shadow="never" class="overview-card">
      <template #header>
        <div class="overview-header">
          <span>行项目概览</span>
          <el-button v-if="isTransferMode" type="danger" link :disabled="lines.length === 0" @click="clearLines">清空行项目</el-button>
        </div>
      </template>

      <div v-if="resultMessage" class="result-alert">
        <el-alert :title="resultMessage" :type="resultSuccess ? 'success' : 'error'" show-icon center />
      </div>

      <el-table :data="lines" border highlight-current-row max-height="280" v-loading="loading" @current-change="handleLineSelect">
        <el-table-column label="行" type="index" width="50" align="center" />
        <el-table-column label="移动类型" prop="moveType" width="80" align="center" />
        <el-table-column label="物料短文本" prop="itemName" min-width="180" show-overflow-tooltip />
        <el-table-column label="物料" prop="itemCode" width="130" />
        <el-table-column label="数量" prop="qty" width="90" align="center" />
        <el-table-column label="单位" prop="unit" width="60" align="center" />
        <el-table-column label="存储地点" prop="sourceLocationCode" width="100" />
        <el-table-column label="目标地点" prop="targetLocationCode" width="100" />
        <el-table-column label="批次" prop="batchCode" width="100" />
        <el-table-column label="特殊库存" prop="specialInventoryFlag" width="90" align="center">
          <template #default="scope">
            <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
          </template>
        </el-table-column>
        <el-table-column v-if="isTransferMode" label="操作" width="70" align="center" fixed="right">
          <template #default="scope">
            <el-button type="danger" link icon="Delete" @click="removeLine(scope.$index)" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <MigoItemDetail
      v-if="currentLine"
      :line="currentLine"
      :editable="isTransferMode"
      :show-target-location="isLocationTransferMove"
      :show-source-inventory-type="isStockStatusMove"
      :show-target-inventory-type="isStockStatusMove"
      :special-flag-options="wms_inventory_special_flag"
      @pick-location="openLocationDialog"
      @location-tab="handleLocationTab"
      @search-inventory="searchInventory"
    />

    <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="onLocationSelected" />
    <UserCollectionsDialog ref="userCollectionsDialogRef" @user-collections-call-back="onUserSelected" />
  </div>
</template>

<script setup name="GoodsMovement" lang="ts">
import { computed, getCurrentInstance, onMounted, ref } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import HistoryInput from '@/components/HistoryInput/index.vue';
import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import UserCollectionsDialog from '@/views/wms/userCollections/components/userCollectionsDialog.vue';
import { listInventoryDetail, transferInventory } from '@/api/wms/inventoryDetail';
import type { InventoryDetailQuery, InventoryDetailVO } from '@/api/wms/inventoryDetail/types';
import { listInventoryMovement } from '@/api/wms/inventoryMovement';
import type { InventoryMovementVO } from '@/api/wms/inventoryMovement/types';
import { checkGoodsMovement, postGoodsMovement } from '@/api/wms/goodsMovement';
import type { GoodsMovementLineVO, GoodsMovementPostForm } from '@/api/wms/goodsMovement/types';
import { HttpStatus } from '@/enums/RespEnum';
import { parseTime } from '@/utils/ruoyi';
import { listStorageLocation } from '@/api/wms/storageLocation';
import MigoItemDetail from './components/MigoItemDetail.vue';
import {
  getMoveTypeDesc,
  isDisplayMode as checkDisplayMode,
  isLocationTransfer,
  isStockStatusTransfer,
  isTransferPostingMode,
  MIGO_ACTION_TYPES,
  MIGO_MOVE_TYPES,
  MIGO_REFERENCE_TYPES
} from './utils/movementConfig';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));

const actionTypes = MIGO_ACTION_TYPES;
const referenceTypes = MIGO_REFERENCE_TYPES;
const moveTypes = MIGO_MOVE_TYPES;
const today = parseTime(new Date(), '{y}-{m}-{d}');

const header = ref({
  actionType: 'A04',
  referenceType: 'R02',
  referenceNo: '',
  moveType: '411',
  documentDate: today,
  postingDate: today,
  materialDocNo: '',
  headerText: '',
  printSlip: '1'
});

const headerTab = ref('general');
const receiver = ref('');
const lines = ref<GoodsMovementLineVO[]>([]);
const currentLine = ref<GoodsMovementLineVO | null>(null);
const selectedInventory = ref<InventoryDetailVO[]>([]);
const loading = ref(false);
const checkLoading = ref(false);
const postLoading = ref(false);
const inventoryLoading = ref(false);
const resultMessage = ref('');
const resultSuccess = ref(false);

const inventoryList = ref<InventoryDetailVO[]>([]);
const inventoryQuery = ref<InventoryDetailQuery>({
  pageNum: 1,
  pageSize: 20,
  itemCode: undefined,
  locationCode: undefined,
  batchCode: undefined
});

const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();
const userCollectionsDialogRef = ref<InstanceType<typeof UserCollectionsDialog>>();
const locationPickSide = ref<'source' | 'target'>('target');
const materialDocConfig = { storageKey: 'migo_material_doc_no', maxHistory: 10 };

const isDisplayMode = computed(() => checkDisplayMode(header.value.actionType, header.value.referenceType));
const isTransferMode = computed(() => isTransferPostingMode(header.value.actionType));
const isReadonly = computed(() => isDisplayMode.value);
const moveTypeDesc = computed(() => getMoveTypeDesc(header.value.moveType));
const isLocationTransferMove = computed(() => isLocationTransfer(header.value.moveType));
const isStockStatusMove = computed(() => isStockStatusTransfer(header.value.moveType));

const disabledFutureDate = (time: Date) => {
  const now = new Date();
  now.setSeconds(now.getSeconds() + 3);
  now.setMilliseconds(0);
  return time.getTime() > now.getTime();
};

const resetResult = () => {
  resultMessage.value = '';
  resultSuccess.value = false;
};

const handleActionChange = () => {
  resetResult();
  lines.value = [];
  currentLine.value = null;
  header.value.materialDocNo = '';
  header.value.referenceType = isTransferMode.value ? 'R10' : 'R02';
};

const handleReferenceChange = () => {
  resetResult();
  lines.value = [];
  currentLine.value = null;
};

const handleMoveTypeChange = () => {
  lines.value.forEach((line) => {
    line.moveType = header.value.moveType;
    if (isStockStatusTransfer(header.value.moveType)) {
      line.sourceInventoryType = 'S';
      line.targetInventoryType = 'N';
      line.targetLocationCode = line.sourceLocationCode;
    }
  });
};

const mapMovementToLine = (row: InventoryMovementVO, index: number): GoodsMovementLineVO => ({
  lineNo: index + 1,
  moveType: row.moveType,
  itemCode: row.itemCode,
  itemName: row.itemName,
  batchCode: row.batchCode,
  qty: row.qty,
  unit: row.unit,
  plantCode: 'CN00',
  sourceWarehouseCode: row.warehouseCode,
  sourceAreaCode: row.areaCode,
  sourceLocationCode: row.locationCode,
  sourceLocationName: row.locationName,
  specialInventoryFlag: row.specialInventoryFlag,
  businessCode: row.vendorCode || row.customerCode,
  businessName: row.vendorName || row.customerName,
  sourceDocType: row.sourceDocType,
  sourceDocCode: row.sourceDocCode,
  sapMaterialOrderNo: row.sapMaterialOrderNo,
  sapMaterialItem: row.sapMaterialItem,
  sapMaterialDocYear: row.sapMaterialDocYear,
  remark: row.remark
});

const mapInventoryToLine = (row: InventoryDetailVO): GoodsMovementLineVO => {
  const sourceType = isStockStatusMove.value ? 'S' : 'N';
  const qty = sourceType === 'S' ? row.blockedQuantity : row.availableQuantity;
  return {
    lineNo: lines.value.length + 1,
    moveType: header.value.moveType,
    itemCode: row.itemCode,
    itemName: row.itemName,
    batchCode: row.batchCode,
    qty: qty || 0,
    unit: row.unit,
    plantCode: 'CN00',
    sourceWarehouseCode: row.warehouseCode,
    sourceAreaCode: row.areaCode,
    sourceLocationCode: row.locationCode,
    targetLocationCode: isStockStatusMove.value ? row.locationCode : '',
    sourceInventoryType: sourceType,
    targetInventoryType: isStockStatusMove.value ? 'N' : sourceType,
    specialInventoryFlag: row.specialInventoryFlag,
    businessCode: row.businessCode,
    businessName: row.businessName,
    inventoryDetailId: row.id
  };
};

const loadDisplayDocument = async () => {
  if (!header.value.referenceNo?.trim()) {
    proxy?.$modal.msgWarning('请输入物料凭证号');
    return;
  }
  loading.value = true;
  resetResult();
  try {
    const res = await listInventoryMovement({
      sapMaterialOrderNo: header.value.referenceNo.trim(),
      pageNum: 1,
      pageSize: 500
    });
    const rows = res.rows || [];
    if (rows.length === 0) {
      proxy?.$modal.msgWarning('未找到该物料凭证的记录');
      lines.value = [];
      currentLine.value = null;
      return;
    }
    lines.value = rows.map(mapMovementToLine);
    header.value.materialDocNo = header.value.referenceNo.trim();
    currentLine.value = lines.value[0];
    resultMessage.value = `已加载 ${lines.value.length} 条行项目`;
    resultSuccess.value = true;
  } finally {
    loading.value = false;
  }
};

const searchInventory = async () => {
  inventoryLoading.value = true;
  try {
    const res = await listInventoryDetail(inventoryQuery.value);
    inventoryList.value = res.rows || [];
  } finally {
    inventoryLoading.value = false;
  }
};

const handleInventorySelection = (selection: InventoryDetailVO[]) => {
  selectedInventory.value = selection;
};

const addSelectedToLines = () => {
  if (selectedInventory.value.length === 0) {
    proxy?.$modal.msgWarning('请先选择库存记录');
    return;
  }
  selectedInventory.value.forEach((row) => {
    if (!lines.value.some((line) => line.inventoryDetailId === row.id)) {
      lines.value.push(mapInventoryToLine(row));
    }
  });
  if (!currentLine.value && lines.value.length > 0) currentLine.value = lines.value[0];
  selectedInventory.value = [];
};

const handleLineSelect = (row: GoodsMovementLineVO | null) => {
  currentLine.value = row;
};
const removeLine = (index: number) => {
  lines.value.splice(index, 1);
  lines.value.forEach((line, idx) => {
    line.lineNo = idx + 1;
  });
  currentLine.value = lines.value[0] ?? null;
};
const clearLines = () => {
  lines.value = [];
  currentLine.value = null;
};

const handleExecute = () => {
  if (isDisplayMode.value) loadDisplayDocument();
  else searchInventory();
};

const handleRefresh = () => {
  resetResult();
  if (isDisplayMode.value && header.value.referenceNo) loadDisplayDocument();
  else if (isTransferMode.value) searchInventory();
};

const buildPostForm = (): GoodsMovementPostForm => ({
  header: { ...header.value },
  lines: lines.value.map((line) => ({ ...line }))
});

const validateLines = (): string | null => {
  if (lines.value.length === 0) return '请至少添加一条行项目';
  if (!header.value.postingDate) return '请选择过账日期';
  for (const line of lines.value) {
    if (!line.itemCode) return '行项目物料编码不能为空';
    if (!line.qty || line.qty <= 0) return `物料 ${line.itemCode} 数量必须大于0`;
    if (!line.sourceLocationCode) return `物料 ${line.itemCode} 源库位不能为空`;
    if (isLocationTransferMove.value && !line.targetLocationCode) return `物料 ${line.itemCode} 目标库位不能为空`;
  }
  return null;
};

const handleCheck = async () => {
  if (isReadonly.value) {
    proxy?.$modal.msgWarning('显示模式下无需检查');
    return;
  }
  const error = validateLines();
  if (error) {
    resultMessage.value = error;
    resultSuccess.value = false;
    return;
  }
  checkLoading.value = true;
  resetResult();
  try {
    const res = await checkGoodsMovement(buildPostForm());
    const data = res.data;
    if (data?.valid) {
      const warnings = data.warnings?.length ? `（${data.warnings.join('；')}）` : '';
      resultMessage.value = `检查通过${warnings}`;
      resultSuccess.value = true;
    } else {
      resultMessage.value = data?.messages?.join('；') || res.msg || '检查未通过';
      resultSuccess.value = false;
    }
  } catch {
    resultMessage.value = '检查通过（本地校验）';
    resultSuccess.value = true;
  } finally {
    checkLoading.value = false;
  }
};

const postByTransferApi = async () => {
  const transferRequests = lines.value.map((line) => ({
    id: line.inventoryDetailId,
    inventoryDetailId: line.inventoryDetailId,
    itemCode: line.itemCode,
    itemName: line.itemName,
    batchCode: line.batchCode,
    unit: line.unit,
    specialInventoryFlag: line.specialInventoryFlag,
    sourceWarehouseCode: line.sourceWarehouseCode,
    sourceAreaCode: line.sourceAreaCode,
    sourceLocationCode: line.sourceLocationCode,
    targetWarehouseCode: line.targetWarehouseCode,
    targetAreaCode: line.targetAreaCode,
    targetLocationCode: line.targetLocationCode,
    transferQuantity: line.qty,
    inventoryType: line.sourceInventoryType || 'N',
    currentQuantity: line.qty,
    postingDate: header.value.postingDate ? `${header.value.postingDate} 00:00:00` : '',
    targetUserName: receiver.value,
    remark: line.remark || header.value.headerText
  }));
  return transferInventory({ inventoryTransferBoList: transferRequests, transferType: 0 });
};

const handlePost = async () => {
  const error = validateLines();
  if (error) {
    resultMessage.value = error;
    resultSuccess.value = false;
    return;
  }
  postLoading.value = true;
  resetResult();
  try {
    const res: any = isLocationTransferMove.value ? await postByTransferApi() : await postGoodsMovement(buildPostForm());
    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg || '过账失败';
      resultSuccess.value = false;
      return;
    }
    resultMessage.value = res.msg || res.data?.message || '过账成功';
    resultSuccess.value = true;
    if (res.data?.sapMaterialOrderNo) header.value.materialDocNo = res.data.sapMaterialOrderNo;
    lines.value = [];
    currentLine.value = null;
    searchInventory();
  } catch (err: any) {
    resultMessage.value = err?.message || '过账失败';
    resultSuccess.value = false;
  } finally {
    postLoading.value = false;
  }
};

const openLocationDialog = (side: 'source' | 'target') => {
  locationPickSide.value = side;
  storageLocationDialogRef.value?.openDialog();
  storageLocationDialogRef.value?.handleQuery();
};

const onLocationSelected = (record: any) => {
  if (!currentLine.value) return;
  if (locationPickSide.value === 'source') {
    currentLine.value.sourceWarehouseCode = record.warehouseCode;
    currentLine.value.sourceAreaCode = record.areaCode;
    currentLine.value.sourceLocationCode = record.locationCode;
    currentLine.value.sourceLocationName = record.locationName;
  } else {
    currentLine.value.targetWarehouseCode = record.warehouseCode;
    currentLine.value.targetAreaCode = record.areaCode;
    currentLine.value.targetLocationCode = record.locationCode;
    currentLine.value.targetLocationName = record.locationName;
  }
};

const handleLocationTab = async (side: 'source' | 'target') => {
  if (!currentLine.value) return;
  const code = side === 'source' ? currentLine.value.sourceLocationCode : currentLine.value.targetLocationCode;
  if (!code?.trim()) return;
  const res = await listStorageLocation({ pageNum: 1, pageSize: 1, locationCode: code.trim() });
  const record = (res.rows || [])[0];
  if (!record) {
    proxy?.$modal.msgWarning(`库位 ${code} 不存在`);
    return;
  }
  onLocationSelected(record);
};

const showUserCollectionsDialog = () => {
  userCollectionsDialogRef.value?.openDialog();
  userCollectionsDialogRef.value?.handleQuery();
};

const onUserSelected = (record: any) => {
  receiver.value = record.nickName;
};

onMounted(() => {
  if (isTransferMode.value) searchInventory();
});
</script>

<style scoped lang="scss">
.migo-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.migo-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.move-type-desc {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.selection-card,
.header-card,
.search-card,
.overview-card {
  :deep(.el-card__header) {
    padding: 10px 16px;
    font-weight: 600;
  }
}
.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.add-line-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}
.add-line-hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.result-alert {
  margin-bottom: 12px;
}
.header-form {
  padding-top: 4px;
}
</style>
