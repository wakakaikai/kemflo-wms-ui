<template>
  <div class="p-2 work-order-return-page">
    <el-card shadow="never" class="history-card" :class="{ 'is-history-collapsed': !historyExpanded }">
      <template #header>
        <div class="history-card-header">
          <div class="history-header-left" @click="historyExpanded = !historyExpanded">
            <el-icon class="history-collapse-icon" :class="{ 'is-expanded': historyExpanded }">
              <ArrowRight />
            </el-icon>
            <span class="history-header-title">工单凭证记录</span>
          </div>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
        </div>
      </template>

      <div v-show="historyExpanded" class="history-card-body">
        <el-form v-show="showSearch" ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
          <!-- 默认显示的搜索项 -->
          <el-form-item label="物料凭证号" prop="sapMaterialOrderNo">
            <HistoryInput v-model="queryParams.sapMaterialOrderNo" :config="sapMaterialOrderNoConfig" placeholder="请输入物料凭证号" @keydown.tab.prevent="handleQuery" @keydown.enter.prevent="handleQuery" />
          </el-form-item>
          <el-form-item label="工单号" prop="sourceDocCode">
            <HistoryInput v-model="queryParams.sourceDocCode" :config="sourceDocCodeConfig" placeholder="请输入工单号" @keydown.tab.prevent="handleQuery" @keydown.enter.prevent="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery" :loading="loading">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 搜索结果列表 -->
        <div class="search-result">
          <el-table ref="inventoryTableRef" :data="inventoryDetailList" height="300" border v-loading="loading" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center" :selectable="isVoucherRowSelectable" />
            <el-table-column v-if="columns[0].visible" label="物料凭证号" align="left" prop="sapMaterialOrderNo" />
            <el-table-column v-if="columns[1].visible" label="凭证项次" align="left" prop="sapMaterialItem" />
            <el-table-column v-if="columns[2].visible" label="工单号" align="left" prop="sourceDocCode" />
            <el-table-column v-if="columns[3].visible" label="物料编码" align="left" prop="itemCode" />
            <el-table-column v-if="columns[4].visible" label="物料名称" align="left" prop="itemName" show-overflow-tooltip />
            <el-table-column v-if="columns[5].visible" label="批次号" align="center" prop="batchCode" />
            <el-table-column v-if="columns[6].visible" label="数量" align="center">
              <template #default="scope">{{ formatQtyWithUnit(scope.row.quantity, scope.row.unit) }}</template>
            </el-table-column>
            <el-table-column v-if="columns[7].visible" label="冲销标识" align="center" prop="reversalFlag" width="100">
              <template #default="scope">
                <el-tag :type="getInventoryMovementReversalTagType(scope.row.reversalFlag)" size="small">
                  {{ formatInventoryMovementReversalFlag(scope.row.reversalFlag) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column v-if="columns[8].visible" label="特殊库存" align="center" prop="specialInventoryFlag">
              <template #default="scope">
                <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
              </template>
            </el-table-column>
            <el-table-column v-if="columns[9].visible" label="业务伙伴" align="center" prop="businessCode" />
            <el-table-column v-if="columns[10].visible" label="伙伴名称" align="center" prop="businessName" show-overflow-tooltip />
            <el-table-column v-if="columns[11].visible" label="仓库编码" align="center" prop="warehouseCode" />
            <el-table-column v-if="columns[12].visible" label="库区编码" align="center" prop="areaCode" />
            <el-table-column v-if="columns[13].visible" label="库位编码" align="center" prop="locationCode" fixed="right" />
          </el-table>

          <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
        </div>
      </div>
    </el-card>

    <div class="add-transfer-bar">
      <el-button type="primary" :disabled="selectedSearchItems.length === 0" @click="addSelectedToTransferList" circle class="rotate-button">
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
            <span class="header-title">工单冲销列表</span>
          </div>
          <div class="header-actions" @click.stop>
            <el-button type="danger" @click="clearTransferList" :disabled="transferList.length === 0">清空列表</el-button>
            <right-toolbar :search="false" :columns="transferColumns" />
          </div>
        </div>
      </template>

      <div v-show="transferExpanded" class="transfer-card-body">
        <!-- 固定库位模式下的统一当前库位输入 -->
        <div style="padding: 10px; background-color: #f5f7fa; border-radius: 4px">
          <el-form :model="fixedTransferForm" ref="fixedTransferFormRef" label-width="auto" :inline="true">
            <el-row :gutter="20">
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="凭证抬头文本">
                  <HistoryInput v-model="fixedTransferForm.bktxt" :config="bktxtConfig" placeholder="请输入凭证抬头文本" />
                </el-form-item>
              </el-col>
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="过账日期" prop="postingDate">
                  <el-date-picker clearable v-model="fixedTransferForm.postingDate" type="date" :disabled-date="disabledFutureDate" value-format="YYYY-MM-DD" placeholder="请选择接收日期" />
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

        <el-table :data="transferList" border style="width: 100%" v-loading="tableLoading" max-height="400">
          <el-table-column type="index" width="50" align="center" />
          <el-table-column v-if="transferColumns[0].visible" label="物料凭证号" prop="sapMaterialOrderNo" min-width="110" />
          <el-table-column v-if="transferColumns[1].visible" label="凭证项次" prop="sapMaterialItem" />
          <el-table-column v-if="transferColumns[2].visible" label="物料编码" prop="materialCode" />
          <el-table-column v-if="transferColumns[3].visible" label="物料名称" prop="itemName" show-overflow-tooltip />
          <el-table-column v-if="transferColumns[4].visible" label="批次号" prop="batchCode" show-overflow-tooltip />
          <el-table-column v-if="transferColumns[5].visible" label="源库位信息" min-width="120">
            <template #default="scope">
              <div>
                <div>仓库: {{ scope.row.sourceWarehouseCode }}</div>
                <div>库区: {{ scope.row.sourceAreaCode }}</div>
                <div>库位: {{ scope.row.sourceLocationCode }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column v-if="transferColumns[6].visible" label="库存标识" align="center" prop="specialInventoryFlag" min-width="100">
            <template #default="scope">
              <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
            </template>
          </el-table-column>
          <el-table-column v-if="transferColumns[7].visible" label="业务伙伴" align="center">
            <template #default="scope">
              <el-input v-model="scope.row.supplierCode" placeholder="供应商寄售编码" v-if="scope.row.specialInventoryFlag == 'K'" />
              <el-input v-model="scope.row.customerCode" placeholder="客户寄售编码" v-else-if="scope.row.specialInventoryFlag == 'W'" />
              <span v-else />
            </template>
          </el-table-column>

          <el-table-column v-if="transferColumns[8].visible" label="退货数量" align="center">
            <template #default="scope">{{ formatQtyWithUnit(scope.row.returnQuantity, scope.row.unit) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="scope">
              <el-button type="danger" link icon="Delete" @click="removeFromTransferList(scope.$index)"></el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="margin-top: 20px; text-align: center">
          <el-button v-hasPermi="['wms:inventoryDetail:workOrderReturn']" :loading="buttonLoading" type="primary" @click="submitTransfer" :disabled="transferList.length === 0">工单冲销</el-button>
        </div>
      </div>
    </el-card>

    <!-- 库位选择对话框 -->
    <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
  </div>
</template>

<script setup name="WorkOrderReverse" lang="ts">
import { ref, reactive } from 'vue';
import { listInventoryMovement } from '@/api/wms/inventoryMovement';
import { InventoryMovementVO, InventoryMovementQuery, InventoryMovementForm } from '@/api/wms/inventoryMovement/types';
// 导入图标组件
import { ArrowRight, Bell, Switch } from '@element-plus/icons-vue';

import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import {
  buildWorkOrderCancelLineBo,
  buildWorkOrderCancelPayload,
  enrichWorkOrderReturnRow,
  formatInventoryMovementReversalFlag,
  getInventoryMovementReversalTagType,
  isInventoryMovementReversed,
  returnWorkOrderInventory
} from '@/api/wms/workOrderReturn';
import { HttpStatus } from '@/enums/RespEnum';
import { formatQty } from '@/utils/ruoyi';
import { listStorageLocation } from '@/api/wms/storageLocation';
import { HistoryConfig } from '@/types/history';
import HistoryInput from '@/components/HistoryInput/index.vue';
import TableHistoryInput from '@/components/TableHistoryInput/index.vue';
const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));

const showSearch = ref(true);
const historyExpanded = ref(true);
const transferExpanded = ref(true);
// 响应式数据
const loading = ref(false);
const tableLoading = ref(false);
const buttonLoading = ref(false);
const inventoryDetailList = ref<InventoryMovementVO[]>([]);
const selectedSearchItems = ref<InventoryMovementVO[]>([]);
const transferList = ref<any[]>([]);
const showAdvancedSearch = ref(false); // 控制高级搜索显示状态
const total = ref(0);
const currenIndex = ref(0);
const resultMessage = ref('');
const resultStatus = ref(false);

// 移转模式：fixed-固定库位，multiple-多库位
const transferMode = ref<'fixed' | 'multiple'>('fixed');

// 固定库位模式下的表单数据
const fixedTransferForm = ref({
  targetLocationCode: '',
  bktxt: '',
  postingDate: null as string | null
});

// 表单引用
const queryFormRef = ref<any>(null);
const fixedTransferFormRef = ref<any>(null);

const inventoryTableRef = ref(null);

const initFormData: InventoryMovementForm = {
  id: undefined,
  moveType: undefined,
  itemCode: undefined,
  itemName: undefined,
  batchCode: undefined,
  inventoryDirection: undefined,
  relatedMoveId: undefined,
  quantity: undefined,
  unit: undefined,
  sourceDocType: undefined,
  sourceDocCode: undefined,
  warehouseCode: undefined,
  warehouseName: undefined,
  areaCode: undefined,
  areaName: undefined,
  locationCode: undefined,
  locationName: undefined,
  palletCode: undefined,
  packingCode: undefined,
  specialInventoryFlag: undefined,
  moveDate: undefined,
  businessCode: undefined,
  businessName: undefined,
  sapMaterialDocYear: undefined,
  sapMaterialOrderNo: undefined,
  sapMaterialItem: undefined,
  remark: undefined
};
const data = reactive<PageData<InventoryMovementForm, InventoryMovementQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    moveType: '',
    itemCode: undefined,
    itemName: undefined,
    batchCode: undefined,
    inventoryDirection: undefined,
    relatedMoveId: undefined,
    quantity: undefined,
    unit: undefined,
    sourceDocType: 'WO',
    sourceDocCode: undefined,
    warehouseCode: undefined,
    warehouseName: undefined,
    areaCode: undefined,
    areaName: undefined,
    locationCode: undefined,
    locationName: undefined,
    palletCode: undefined,
    packingCode: undefined,
    specialInventoryFlag: undefined,
    moveDate: undefined,
    businessCode: undefined,
    businessName: undefined,
    sapMaterialDocYear: undefined,
    sapMaterialOrderNo: undefined,
    sapMaterialItem: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

const sapMaterialOrderNoConfig: HistoryConfig = {
  key: 'sapMaterialOrderNo',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'workOrderReverse',
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
  page: 'workOrderReverse',
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

// 列显隐信息
const columns = ref<FieldOption[]>([
  { key: 0, label: `物料凭证号`, visible: true, children: [] },
  { key: 1, label: `凭证项次`, visible: true, children: [] },
  { key: 2, label: `工单号`, visible: true, children: [] },
  { key: 3, label: `物料编码`, visible: true, children: [] },
  { key: 4, label: `物料名称`, visible: true, children: [] },
  { key: 5, label: `批次号`, visible: true, children: [] },
  { key: 6, label: `数量`, visible: true, children: [] },
  { key: 7, label: `冲销标识`, visible: true, children: [] },
  { key: 8, label: `特殊库存`, visible: false, children: [] },
  { key: 9, label: `业务伙伴`, visible: false, children: [] },
  { key: 10, label: `伙伴名称`, visible: false, children: [] },
  { key: 11, label: `仓库编码`, visible: false, children: [] },
  { key: 12, label: `库区编码`, visible: false, children: [] },
  { key: 13, label: `库位编码`, visible: true, children: [] }
]);

const transferColumns = ref<FieldOption[]>([
  { key: 0, label: `物料凭证号`, visible: true, children: [] },
  { key: 1, label: `凭证项次`, visible: true, children: [] },
  { key: 2, label: `物料编码`, visible: true, children: [] },
  { key: 3, label: `物料名称`, visible: true, children: [] },
  { key: 4, label: `批次号`, visible: true, children: [] },
  { key: 5, label: `源库位信息`, visible: true, children: [] },
  { key: 6, label: `库存标识`, visible: true, children: [] },
  { key: 7, label: `业务伙伴`, visible: true, children: [] },
  { key: 8, label: `退货数量`, visible: true, children: [] }
]);

const formatQtyWithUnit = (qty?: number | string | null, unit?: string) => {
  const text = formatQty(qty);
  if (!text) {
    return unit || '';
  }
  return unit ? `${text} ${unit}` : text;
};

// 禁用未来的时间
const disabledFutureDate = (time: Date) => {
  // 获取当前时间，并将毫秒设为0以确保精确到秒
  const now = new Date();
  // 加上指定秒数（默认3秒）
  now.setSeconds(now.getSeconds() + 3);
  now.setMilliseconds(0);

  // 禁止选择当前时间之后的日期
  return time.getTime() > now.getTime();
};

// 添加一个方法用于计算库存数量
const calculateInventoryQuantity = (row) => {
  row.inventoryQuantity = ((row.returnQuantity || 0) * (row.conversionRatio || 1)).toFixed(3);
};

// 监听收货数量变化的处理方法
const handleReturnPoQuantityChange = (row) => {
  // 如果输入为空，则库存数量也设为0
  if (row.quantity === null || row.quantity === undefined || row.quantity === '') {
    row.inventoryQuantity = 0;
  } else {
    calculateInventoryQuantity(row);
  }
};

/** 切换高级搜索显示状态 */
const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value;
};

/** 查询工单凭证记录 */
const getList = async () => {
  if (!queryParams.value.sapMaterialOrderNo && !queryParams.value.sourceDocCode) {
    return;
  }
  loading.value = true;
  try {
    const res = await listInventoryMovement(queryParams.value);
    inventoryDetailList.value = res.rows;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

/** 搜索按钮操作 */
const handleQuery = () => {
  if (!queryParams.value.sapMaterialOrderNo && !queryParams.value.sourceDocCode) {
    proxy.$modal.msgWarning('请输入物料凭证号或工单号');
    return;
  }
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置搜索 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.sourceDocType = 'WO';
  inventoryTableRef.value?.clearSelection();
  selectedSearchItems.value = [];
  inventoryDetailList.value = [];
  total.value = 0;
};

/** 已冲销记录不可勾选 */
const isVoucherRowSelectable = (row: InventoryMovementVO) => !isInventoryMovementReversed(row);

/** 搜索结果选择变化 */
const handleSelectionChange = (selection: InventoryMovementVO[]) => {
  selectedSearchItems.value = selection.filter((item) => isVoucherRowSelectable(item));
};

/** 添加选中项到冲销列表 */
const addSelectedToTransferList = () => {
  if (selectedSearchItems.value.length === 0) {
    proxy.$modal.msgWarning('请先选择要冲销的记录');
    return;
  }

  if (selectedSearchItems.value.some((item) => isInventoryMovementReversed(item))) {
    proxy.$modal.msgWarning('已冲销的记录不能加入冲销列表');
    return;
  }

  const newItems = selectedSearchItems.value.map((item) =>
    enrichWorkOrderReturnRow({
      ...item,
      materialCode: item.itemCode,
      materialName: item.itemName,
      currentQuantity: item.availableQuantity || 0,
      availableQuantity: item.availableQuantity,
      inspectionQuantity: item.inspectionQuantity,
      blockedQuantity: item.blockedQuantity,
      unit: item.unit,
      sourceWarehouseCode: item.warehouseCode,
      sourceAreaCode: item.areaCode,
      sourceLocationCode: item.locationCode,
      targetWarehouseCode: item.warehouseCode,
      targetAreaCode: item.areaCode,
      targetLocationCode: item.locationCode,
      specialInventoryFlag: item.specialInventoryFlag,
      returnQuantity: item.quantity,
      inventoryQuantity: (item.quantity * (item.conversionRatio || 1)).toFixed(3),
      inventoryUnit: item.unit
    })
  );

  let addedCount = 0;

  const newMaterialOrderNos = [...new Set(newItems.map((item) => item.sapMaterialOrderNo))];

  if (newMaterialOrderNos.length > 1) {
    proxy.$modal.msgError('请选择相同物料凭证号的项次');
    return;
  }

  const currentMaterialOrderNo = transferList.value.length > 0 ? transferList.value[0].sapMaterialOrderNo : null;
  const allowedMaterialOrderNo = currentMaterialOrderNo || newItems[0]?.sapMaterialOrderNo;

  if (currentMaterialOrderNo && newMaterialOrderNos[0] !== currentMaterialOrderNo) {
    proxy.$modal.msgError(`只能添加物料凭证号 ${currentMaterialOrderNo} 的项次`);
    return;
  }

  const itemsToAdd = newItems.filter((newItem) => {
    const isSameVoucher = newItem.sapMaterialOrderNo === allowedMaterialOrderNo;
    const isNotDuplicate = !transferList.value.some((item) => item.sapMaterialOrderNo === newItem.sapMaterialOrderNo && item.sapMaterialItem === newItem.sapMaterialItem);
    return isSameVoucher && isNotDuplicate;
  });

  itemsToAdd.forEach((item) => {
    transferList.value.push(item);
    addedCount++;
  });

  if (addedCount > 0) {
    proxy.$modal.msgSuccess(`成功添加 ${addedCount} 个项次`);
    inventoryTableRef.value?.clearSelection();
    selectedSearchItems.value = [];
  } else {
    proxy.$modal.msgWarning('没有新项次可添加，可能都已存在');
  }

  transferList.value.sort((a, b) => parseInt(a.sapMaterialItem) - parseInt(b.sapMaterialItem));
};

/** 从移转列表中移除 */
const removeFromTransferList = (index: number) => {
  transferList.value.splice(index, 1);
};

/** 清空移转列表 */
const clearTransferList = () => {
  transferList.value = [];
  if (transferMode.value === 'fixed') {
    fixedTransferForm.value.targetLocationCode = '';
    fixedTransferForm.value.bktxt = '';
  }
};

const locationCodeKeyDownTab = async (locationCode: any) => {
  if (locationCode) {
    const res = await listStorageLocation({
      pageNum: 1,
      pageSize: 10,
      locationCode: locationCode
    });
    resultMessage.value = '';
    if ((res.rows || []).length == 0) {
      resultMessage.value = `库位${locationCode}不存在`;
      resultStatus.value = false;
    }
  }
};

/** 显示库位选择对话框 */
const showStorageLocationDialog = (index: number) => {
  storageLocationDialogRef.value.openDialog();
  storageLocationDialogRef.value.handleQuery();
  currenIndex.value = index;
};

/** 处理移转模式切换 */
const handleTransferModeChange = (mode: 'fixed' | 'multiple') => {
  if (mode === 'fixed') {
    transferList.value.forEach((item) => {
      item.targetLocationCode = '';
    });
  } else {
    fixedTransferForm.value.targetLocationCode = '';
  }
};

/** 库位选择回调 */
const storageLocationSelectCallBack = (record: any) => {
  if (transferMode.value === 'fixed') {
    // 固定库位模式，设置统一的当前库位
    fixedTransferForm.value.targetLocationCode = record.locationCode;
  } else {
    // 多库位模式，设置对应行的当前库位
    if (currenIndex.value >= 0 && currenIndex.value < transferList.value.length) {
      const currentItem = transferList.value[currenIndex.value];
      currentItem.targetLocationCode = record.locationCode;
    }
  }
};

/** 提交移转 */
const submitTransfer = async () => {
  const validTransfers = transferList.value.filter((item) => item.returnQuantity > 0);
  resultStatus.value = true;
  resultMessage.value = '';
  if (validTransfers.length === 0) {
    resultMessage.value = '没有有效的移转记录';
    resultStatus.value = false;
    return;
  }

  const overQuantityItems = validTransfers.filter((item) => item.returnQuantity > item.quantity);
  if (overQuantityItems.length > 0) {
    resultMessage.value = '退货数量不能超过当前可用数量';
    resultStatus.value = false;
    return;
  }

  buttonLoading.value = true;
  try {
    const cancelLines = validTransfers.map((item) => buildWorkOrderCancelLineBo(item));

    const res: any = await returnWorkOrderInventory(
      buildWorkOrderCancelPayload(cancelLines, {
        returnType: 2,
        bktxt: fixedTransferForm.value.bktxt,
        postingDate: fixedTransferForm.value.postingDate
      })
    );

    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg;
      resultStatus.value = false;
      return;
    }
    resultMessage.value = res.msg || `成功移转${validTransfers.length}条记录`;
    resultStatus.value = true;
    transferList.value = [];
    fixedTransferForm.value.targetLocationCode = '';
    fixedTransferForm.value.bktxt = '';
    fixedTransferForm.value.postingDate = null;
    handleQuery();
  } catch (error: any) {
    loading.value = false;
    resultMessage.value = error.message || '移转失败';
    resultStatus.value = false;
  } finally {
    buttonLoading.value = false;
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

.transfer-main-card {
  flex: 1 1 auto;
}

.transfer-main-card.is-transfer-collapsed :deep(.el-card__body) {
  display: none;
}

.transfer-card-body {
  padding: 12px 16px 16px;
}

.transfer-main-card :deep(.el-card__header) {
  padding: 10px 16px;
}

.vertical-layout {
  flex-direction: column;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-result {
    min-height: 150px;
  }
}
.transfer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.rotate-button {
  transform: rotate(90deg);
  margin: 0 auto;
}

/* 响应式调整 - 在小屏幕上的显示 */
@media (max-width: 768px) {
  .transfer-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
