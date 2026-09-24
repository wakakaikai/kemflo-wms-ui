<template>
  <div class="p-2 purchase-return-page">
    <el-card shadow="never" class="history-card" :class="{ 'is-history-collapsed': !historyExpanded }">
      <template #header>
        <div class="history-card-header">
          <div class="history-header-left" @click="historyExpanded = !historyExpanded">
            <el-icon class="history-collapse-icon" :class="{ 'is-expanded': historyExpanded }">
              <ArrowRight />
            </el-icon>
            <span class="history-header-title">采购入库历史</span>
          </div>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
        </div>
      </template>

      <div v-show="historyExpanded" class="history-card-body">
        <el-form v-show="showSearch" ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
          <!-- 默认显示的搜索项 -->
          <el-form-item label="物料凭证号" prop="sapMaterialOrderNo">
            <HistoryInput v-model="queryParams.sapMaterialOrderNo" :config="sapMaterialOrderNoConfig" placeholder="请输入物料凭证号" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="采购单号" prop="sourceDocCode">
            <HistoryInput v-model="queryParams.sourceDocCode" :config="sourceDocCodeConfig" placeholder="请输入采购单号" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery" :loading="loading">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 搜索结果列表 -->
        <div class="search-result">
          <ReverseMovementTreeTable ref="inventoryTableRef" :groups="groupedRows" layout="purchase" :columns="columns" height="300" :loading="loading" :show-reversal="true" :default-expand-all="false" @selection-change="handleSelectionChange" />
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
            <span class="header-title">采购退货列表</span>
          </div>
          <div class="header-actions" @click.stop>
            <el-radio-group v-model="transferMode" @change="handleTransferModeChange">
              <el-radio-button label="fixed">固定库位</el-radio-button>
              <el-radio-button label="multiple">多库位</el-radio-button>
            </el-radio-group>
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
              <el-col :sm="24" :md="8" :lg="8" v-if="transferMode === 'fixed'">
                <el-form-item label="当前库位" prop="targetLocationCode">
                  <HistoryInput v-model.trim="fixedTransferForm.targetLocationCode" :config="locationCodeConfig" placeholder="请输入当前库位编码" @keydown.tab.prevent="locationCodeKeyDownTab(fixedTransferForm.targetLocationCode)" @keydown.enter.prevent="locationCodeKeyDownTab(fixedTransferForm.targetLocationCode)">
                    <template #append>
                      <el-button icon="Search" @click="showStorageLocationDialog(-1)"></el-button>
                    </template>
                  </HistoryInput>
                </el-form-item>
              </el-col>
              <!--              <el-col :sm="24" :md="6" :lg="6">
                <el-form-item label="交货单">
                  <HistoryInput v-model="fixedTransferForm.lfsnr" :config="lfsnrConfig" placeholder="请输入交货单" />
                </el-form-item>
              </el-col>-->
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="抬头文本" prop="bktxt">
                  <HistoryInput v-model="fixedTransferForm.bktxt" :config="bktxtConfig" placeholder="请输入抬头文本" />
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

        <el-table
          ref="transferTableRef"
          :data="transferTreeData"
          row-key="rowKey"
          border
          style="width: 100%"
          v-loading="tableLoading"
          max-height="400"
          default-expand-all
          :tree-props="{ children: 'children' }"
          :row-class-name="resolveTransferRowClassName"
        >
<!--          <el-table-column width="50" align="center">
            <template #default="scope">
              <span v-if="isTreeParentRow(scope.row)">{{ transferList.findIndex((item) => item.transferRowKey === scope.row.transferRowKey) + 1 || '' }}</span>
            </template>
          </el-table-column>-->
          <!--            <el-table-column label="物料凭证号" prop="sapMaterialOrderNo" />
            <el-table-column label="凭证项次" prop="sapMaterialItem" />-->
<!--          <el-table-column label="移动类型" prop="moveType" width="88" align="center" />-->
          <el-table-column v-if="transferColumns[0].visible" label="采购单号" prop="sourceDocCode" min-width="120" />
          <el-table-column v-if="transferColumns[1].visible" label="采购项次" prop="poItemNo" width="88" align="center">
            <template #default="scope">
              <span>{{ scope.row.poItemNo ?? scope.row.sourceDocItem ?? '' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="transferColumns[2].visible" label="物料编码" prop="itemCode" min-width="130" />
          <el-table-column v-if="transferColumns[3].visible" label="物料名称" prop="itemName" min-width="160" show-overflow-tooltip />
          <el-table-column v-if="transferColumns[5].visible" label="源库位信息" min-width="200">
            <template #default="scope">
              <div class="source-location-cell">
                <div>
                  <div>仓库: {{ scope.row.sourceWarehouseCode || scope.row.warehouseCode || '-' }}</div>
                  <div>库位: {{ scope.row.sourceLocationCode || scope.row.locationCode || '-' }}</div>
                  <div>批次: {{ scope.row.batchCode || '-' }}</div>
                </div>
                <el-button v-if="isTreeParentRow(scope.row)" link type="primary" icon="Search" @click="openInventoryDialog(scope.row)"></el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column v-if="transferColumns[6].visible" label="库存标识" align="center" prop="specialInventoryFlag" min-width="100">
            <template #default="scope">
              <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
            </template>
          </el-table-column>
          <el-table-column v-if="transferColumns[7].visible" label="业务伙伴" align="center" min-width="120">
            <template #default="scope">
              <el-input v-model="scope.row.supplierCode" placeholder="供应商寄售编码" v-if="scope.row.specialInventoryFlag == 'K'" />
              <el-input v-model="scope.row.customerCode" placeholder="客户寄售编码" v-else-if="scope.row.specialInventoryFlag == 'W'" />
              <span v-else />
            </template>
          </el-table-column>

          <el-table-column v-if="transferColumns[8].visible" label="库存类型" prop="inventoryType" align="center" min-width="130">
            <template #default="scope">
              <el-select v-model="scope.row.inventoryType" placeholder="请选择库存类型" style="width: 100%" @change="handleInventoryTypeChange(scope.row)">
                <el-option v-for="dict in wms_inventory_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column v-if="transferColumns[9].visible && transferMode === 'multiple'" label="当前库位" width="220">
            <template #default="scope">
              <TableHistoryInput v-if="isTreeParentRow(scope.row)" v-model="scope.row.targetLocationCode" :config="locationCodeConfig" placeholder="请输入当前库位编码" @keydown.tab.prevent="locationCodeKeyDownTab(scope.row.targetLocationCode)" @keydown.enter.prevent="locationCodeKeyDownTab(scope.row.targetLocationCode)">
                <template #append>
                  <el-button icon="Search" @click="showStorageLocationDialog(resolveTransferParentIndex(scope.row))"></el-button>
                </template>
              </TableHistoryInput>
            </template>
          </el-table-column>

          <el-table-column v-if="transferColumns[10].visible" label="退货数量" width="200" align="center">
            <template #default="scope">
              <template v-if="isTreeParentRow(scope.row)">
                <el-input-number v-model="scope.row.returnQuantity" :min="0" :max="parseFloat(scope.row.originQuantity || scope.row.orderQuantity || scope.row.poQuantity || scope.row.quantity || 0)" :precision="3" size="small" controls-position="right" @change="handleParentReturnQuantityChange(scope.row)" />
                <span class="issue-qty-unit">{{ scope.row.poUnit || scope.row.orderUnit || scope.row.unit || '' }}</span>
              </template>
              <template v-else>
                <el-input-number v-model="scope.row.returnQuantity" :min="0" :max="parseFloat(scope.row.originQuantity || scope.row.orderQuantity || scope.row.poQuantity || scope.row.quantity || 0)" :precision="3" size="small" controls-position="right" @change="handleChildReturnQuantityChange(scope.row)" />
                <span class="issue-qty-unit">{{ scope.row.poUnit || scope.row.orderUnit || scope.row.unit || '' }}</span>
              </template>
            </template>
          </el-table-column>
          <el-table-column v-if="transferColumns[11].visible" label="库存单位数量" min-width="100" align="center">
            <template #default="scope">
              {{ formatQtyWithUnit(scope.row.inventoryQuantity, scope.row.inventoryUnit || scope.row.unit) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="scope">
              <el-button v-if="isTreeParentRow(scope.row)" type="danger" link icon="Delete" @click.stop="removeFromTransferList(scope.row.transferRowKey)"></el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="margin-top: 20px; text-align: center">
          <el-button :loading="buttonLoading1" type="primary" @click="submitTransfer('102')" :disabled="transferList.length === 0">
            采购退货102
            <el-tooltip content="主要用于处理因操作人员人为原因产生的错误（如录入数量等等）" placement="top">
              <el-icon class="ml-1"><QuestionFilled /></el-icon>
            </el-tooltip>
          </el-button>
          <el-button :loading="buttonLoading2" type="primary" @click="submitTransfer('122')" :disabled="transferList.length === 0">
            采购退货122
            <el-tooltip content="主要用于处理当月因供应商送来货物的质量问题等原因，需要进行退货" placement="top">
              <el-icon class="ml-1"><QuestionFilled /></el-icon>
            </el-tooltip>
          </el-button>
        </div>
      </div>
    </el-card>
    <!-- 库位选择对话框 -->
    <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
    <InventorySelectionDialog v-model="inventoryDialog.visible" :material-code="inventoryDialog.row?.itemCode || inventoryDialog.row?.materialCode || ''" :material-desc="inventoryDialog.row?.itemName || inventoryDialog.row?.materialName || ''" :issue-qty="inventoryDialog.issueQty" :unit="inventoryDialog.row?.inventoryUnit || inventoryDialog.row?.unit || inventoryDialog.row?.poUnit || inventoryDialog.row?.orderUnit || ''" :general-only="false" @confirm="applyInventorySelection" />
  </div>
</template>

<script setup name="PurchaseReturn" lang="ts">
import { computed, ref, reactive, onMounted } from 'vue';
import { listInventoryMovement } from '@/api/wms/inventoryMovement';
import ReverseMovementTreeTable from '@/views/wms/inventoryReverse/components/ReverseMovementTreeTable.vue';
import {
  buildMovementDisplayGroups,
  buildPrimaryReceiptGroupKey,
  buildReverseTreeTableData,
  enrichPrimaryReceiptGroupWithSubcontractChildren,
  isTreeParentRow,
  MovementExpandRow,
  resolvePurchaseReturnSubmitMoveType,
  ReverseTreeRow
} from '@/views/wms/inventoryReverse/utils/reverseMovement';
import { createReverseColumnOptions } from '@/views/wms/inventoryReverse/utils/reverseTableLayout';
import { syncSapMaterialOrderNoEmptyFilter } from '@/api/wms/inventoryMovement/query';
import { InventoryMovementVO, InventoryMovementQuery, InventoryMovementForm } from '@/api/wms/inventoryMovement/types';
// 导入图标组件
import { ArrowDown, ArrowRight, ArrowUp, Bell, QuestionFilled, Switch } from '@element-plus/icons-vue';

import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import InventorySelectionDialog from '@/views/wms/inventoryDetail/components/InventorySelectionDialog.vue';
import { returnPurchaseInventory } from '@/api/wms/inventoryDetail';
import { PurchaseOrderReturnBo, PurchaseOrderReturnBatchForm } from '@/api/wms/purchaseOrder/types';
import { HttpStatus } from '@/enums/RespEnum';
import { listStorageLocation } from '@/api/wms/storageLocation';
import { HistoryConfig } from '@/types/history';
import HistoryInput from '@/components/HistoryInput/index.vue';
import TableHistoryInput from '@/components/TableHistoryInput/index.vue';
import { formatQty, formatQtyWithUnit } from '@/utils/ruoyi';
const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_type, wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_type', 'wms_inventory_special_flag'));

const showSearch = ref(true);
const historyExpanded = ref(true);
const transferExpanded = ref(true);
// 响应式数据
const loading = ref(false);
const tableLoading = ref(false);
const buttonLoading1 = ref(false);
const buttonLoading2 = ref(false);
const inventoryDetailList = ref<MovementExpandRow[]>([]);
const groupedRows = computed(() => inventoryDetailList.value);
const selectedSearchItems = ref<ReverseTreeRow[]>([]);
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
  lfsnr: '',
  bktxt: '',
  postingDate: null,
  remark: ''
});

// 表单引用
const queryFormRef = ref<any>(null);
const fixedTransferFormRef = ref<any>(null);

const inventoryTableRef = ref(null);
const transferTableRef = ref(null);

const transferTreeData = computed(() => buildReverseTreeTableData(transferList.value as MovementExpandRow[]));

const resolveTransferRowClassName = ({ row }: { row: ReverseTreeRow }) => (row.children?.length ? 'return-tree-parent-row' : '');

const flattenTransferList = (list: any[]) => {
  const rows: any[] = [];
  list.forEach((group) => {
    rows.push(group);
    (group.childMovementList || []).forEach((child: any) => rows.push(child));
  });
  return rows;
};

const resolveTransferParentIndex = (row: ReverseTreeRow | any) => {
  if (isTreeParentRow(row)) {
    return transferList.value.findIndex((item) => item.transferRowKey === row.transferRowKey || item.groupKey === row.groupKey);
  }
  const groupKey = row.groupKey;
  return transferList.value.findIndex((item) => item.groupKey === groupKey || item.transferRowKey === groupKey);
};

/** 树表为 computed 浅拷贝，数量等编辑需写回 transferList 中的源对象 */
const resolveTransferRowRef = (displayRow: ReverseTreeRow | any) => {
  if (isTreeParentRow(displayRow)) {
    const index = resolveTransferParentIndex(displayRow);
    return index >= 0 ? transferList.value[index] : displayRow;
  }
  const parentIndex = resolveTransferParentIndex(displayRow);
  if (parentIndex < 0) {
    return displayRow;
  }
  const parent = transferList.value[parentIndex];
  const originId = displayRow.originId ?? displayRow.id;
  const child = (parent.childMovementList || []).find(
    (item: any) => item === displayRow || item.originId === originId || item.id === originId
  );
  return child || displayRow;
};

const syncParentReturnQuantityFields = (parent: any, returnQuantity: unknown) => {
  parent.returnQuantity = returnQuantity;
  if (parent.mainMovement && parent.mainMovement !== parent) {
    parent.mainMovement.returnQuantity = returnQuantity;
  }
};

const syncParentInventoryQuantityFields = (parent: any) => {
  calculateInventoryQuantity(parent);
  if (parent.mainMovement && parent.mainMovement !== parent) {
    parent.mainMovement.inventoryQuantity = parent.inventoryQuantity;
  }
};

const buildReturnRowFromMovement = (movement: any, extra: Record<string, any> = {}) => {
  const orderQuantity = movement.orderQuantity ?? movement.poQuantity ?? movement.quantity;
  const orderUnit = movement.orderUnit ?? movement.poUnit ?? movement.unit;
  const poItemNo = movement.sourceDocItem ?? movement.poItemNo;
  const conversionRatio = Number(movement.conversionRatio || 1) || 1;
  return {
    ...movement,
    originId: movement.id,
    originQuantity: orderQuantity,
    poItemNo,
    poUnit: orderUnit,
    orderQuantity,
    currentQuantity: movement.availableQuantity || 0,
    availableQuantity: movement.availableQuantity,
    inspectionQuantity: movement.inspectionQuantity,
    blockedQuantity: movement.blockedQuantity,
    unit: movement.unit,
    sourceWarehouseCode: movement.warehouseCode,
    sourceAreaCode: movement.areaCode,
    sourceLocationCode: movement.locationCode,
    targetWarehouseCode: movement.warehouseCode,
    targetAreaCode: movement.areaCode,
    targetLocationCode: movement.locationCode,
    specialInventoryFlag: movement.specialInventoryFlag,
    inventoryType: movement.inventoryType,
    returnQuantity: orderQuantity,
    conversionRatio,
    inventoryQuantity: (Number(orderQuantity || 0) * conversionRatio).toFixed(3),
    inventoryUnit: movement.unit,
    ...extra
  };
};

const inventoryDialog = reactive<{
  visible: boolean;
  index: number;
  row: any | null;
  issueQty: number;
}>({
  visible: false,
  index: -1,
  row: null,
  issueQty: 0
});

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
    moveType: '101',
    itemCode: undefined,
    itemName: undefined,
    batchCode: undefined,
    inventoryDirection: undefined,
    relatedMoveId: undefined,
    quantity: undefined,
    unit: undefined,
    sourceDocTypeList: ['PO', 'STO'],
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
    sapMaterialOrderNoEmpty: true,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

const moveTypeConfig: HistoryConfig = {
  key: 'moveType',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryReturn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const sapMaterialOrderNoConfig: HistoryConfig = {
  key: 'sapMaterialOrderNo',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryReturn',
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
  page: 'inventoryReturn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const sapMaterialDocYearConfig: HistoryConfig = {
  key: 'sapMaterialDocYear',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryReturn',
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
  page: 'inventoryReturn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const itemNoConfig: HistoryConfig = {
  key: 'itemNo',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryReturn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const locationCodeConfig: HistoryConfig = {
  key: 'locationCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryReturn',
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
  page: 'inventoryReturn',
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
  page: 'inventoryReturn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const columns = ref<FieldOption[]>(createReverseColumnOptions('purchase'));

const transferColumns = ref<FieldOption[]>([
  { key: 0, label: `采购单号`, visible: true, children: [] },
  { key: 1, label: `采购项次`, visible: true, children: [] },
  { key: 2, label: `物料编码`, visible: true, children: [] },
  { key: 3, label: `物料名称`, visible: true, children: [] },
  { key: 4, label: `批次号`, visible: true, children: [] },
  { key: 5, label: `源库位信息`, visible: true, children: [] },
  { key: 6, label: `库存标识`, visible: true, children: [] },
  { key: 7, label: `业务伙伴`, visible: true, children: [] },
  { key: 8, label: `库存类型`, visible: true, children: [] },
  { key: 9, label: `当前库位`, visible: true, children: [] },
  { key: 10, label: `退货数量`, visible: true, children: [] },
  { key: 11, label: `库存单位数量`, visible: true, children: [] }
]);

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

function formatPostingDate(postingDate?: string | null): string | undefined {
  if (!postingDate) {
    return undefined;
  }
  return postingDate.includes(' ') ? postingDate : `${postingDate} 00:00:00`;
}

// 添加一个方法用于计算库存单位数量
const calculateInventoryQuantity = (row) => {
  row.inventoryQuantity = ((row.returnQuantity || 0) * (row.conversionRatio || 1)).toFixed(3);
};

const getChildReturnQuantityByParentRatio = (parent: any, child: any) => {
  const parentOpen = resolveOrderOpenQuantity(parent);
  const parentReturn = toNumber(parent.returnQuantity);
  const childOpen = resolveOrderOpenQuantity(child);
  const ratio = parentOpen > 0 ? parentReturn / parentOpen : 1;
  return roundQty(childOpen * ratio);
};

/** 主行退货数量变化时，按原入库比例同步 543 子行（已选手工库存拆行则跳过） */
const syncChildReturnQuantity = (parent: any) => {
  (parent.childMovementList || []).forEach((child: any) => {
    if (child.inventoryDetailId || child.inventorySplitKey) {
      return;
    }
    child.returnQuantity = getChildReturnQuantityByParentRatio(parent, child);
    calculateInventoryQuantity(child);
  });
  parent.childMovements = parent.childMovementList;
};

const clearReturnRowInventorySelection = (row: any) => {
  row.inventoryDetailId = undefined;
  row.inventorySplitKey = undefined;
};

const applyReturnQuantityChange = (displayRow: any, returnQuantity: unknown) => {
  const row = resolveTransferRowRef(displayRow);
  if (returnQuantity === null || returnQuantity === undefined || returnQuantity === '') {
    row.returnQuantity = 0;
    row.inventoryQuantity = 0;
  } else {
    row.returnQuantity = returnQuantity;
    calculateInventoryQuantity(row);
  }
  return row;
};

const handleParentReturnQuantityChange = (displayRow: any) => {
  const parent = resolveTransferRowRef(displayRow);
  syncParentReturnQuantityFields(parent, displayRow.returnQuantity);
  if (displayRow.returnQuantity === null || displayRow.returnQuantity === undefined || displayRow.returnQuantity === '') {
    parent.returnQuantity = 0;
    parent.inventoryQuantity = 0;
    if (parent.mainMovement && parent.mainMovement !== parent) {
      parent.mainMovement.returnQuantity = 0;
      parent.mainMovement.inventoryQuantity = 0;
    }
  } else {
    syncParentInventoryQuantityFields(parent);
  }
  syncChildReturnQuantity(parent);
};

const handleChildReturnQuantityChange = (displayRow: any) => {
  const row = applyReturnQuantityChange(displayRow, displayRow.returnQuantity);
  if (row.inventoryDetailId || row.inventorySplitKey) {
    clearReturnRowInventorySelection(row);
  }
};

/** 切换高级搜索显示状态 */
const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value;
};

/** 查询库存明细记录列表 */
const getList = async () => {
  syncSapMaterialOrderNoEmptyFilter(queryParams.value);
  loading.value = true;
  try {
    const res = await listInventoryMovement(queryParams.value);
    inventoryDetailList.value = buildMovementDisplayGroups((res.rows || []) as InventoryMovementVO[]);
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置搜索 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.sapMaterialOrderNoEmpty = true;
  // 清除表格选中状态
  inventoryTableRef.value?.clearSelection();
  handleQuery();
};

/** 仅可选主行（101 等），543 子行由 parent_move_id 挂在树下展示 */
const handleSelectionChange = (selection: ReverseTreeRow[]) => {
  selectedSearchItems.value = selection.filter(isTreeParentRow);
};

/** 添加选中项到移转列表（101 主行 + 接口 childMovementList 的 543 子行） */
const addSelectedToTransferList = async () => {
  if (selectedSearchItems.value.length === 0) {
    proxy.$modal.msgWarning('请先选择要退货的记录');
    return;
  }

  let addedCount = 0;
  for (const item of selectedSearchItems.value) {
    const group =
      inventoryDetailList.value.find((g) => g.groupKey && g.groupKey === item.groupKey) ||
      inventoryDetailList.value.find((g) => String(g.mainMovement?.id ?? g.id) === String(item.mainMovement?.id ?? item.id));
    const enriched = group ? await enrichPrimaryReceiptGroupWithSubcontractChildren(group) : item;
    const mainMovement = (enriched.mainMovement ?? enriched) as InventoryMovementVO;
    const transferRowKey = enriched.groupKey || buildPrimaryReceiptGroupKey(mainMovement.id!);
    const exists = transferList.value.some((row) => row.transferRowKey === transferRowKey || (row.originId || row.id) === mainMovement.id);
    if (exists) {
      continue;
    }
    const parentRow = buildReturnRowFromMovement(mainMovement, { transferRowKey, groupKey: transferRowKey });
    const childMovementList = (enriched.childMovementList || []).map((child) => buildReturnRowFromMovement(child, { groupKey: transferRowKey }));
    transferList.value.push({
      ...parentRow,
      mainMovement: parentRow,
      childMovementList,
      childMovements: childMovementList
    });
    addedCount++;
  }

  inventoryTableRef.value?.clearSelection?.();
  selectedSearchItems.value = [];
  proxy.$modal.msgSuccess(`成功添加${addedCount}条记录到移转列表`);
};

/** 从移转列表中移除整组（101 + 543 子行） */
const removeFromTransferList = (transferRowKey?: string) => {
  if (!transferRowKey) {
    return;
  }
  const index = transferList.value.findIndex((row) => row.transferRowKey === transferRowKey);
  if (index >= 0) {
    transferList.value.splice(index, 1);
  }
};

/** 清空移转列表 */
const clearTransferList = () => {
  transferList.value = [];
  if (transferMode.value === 'fixed') {
    fixedTransferForm.value.targetLocationCode = '';
  }
  fixedTransferForm.value.lfsnr = '';
  fixedTransferForm.value.bktxt = '';
  fixedTransferForm.value.postingDate = null;
  fixedTransferForm.value.remark = '';
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
    // 切换到固定库位模式时，清空所有行的当前库位
    transferList.value.forEach((item) => {
      item.targetLocationCode = '';
      item.remark = '';
    });
  } else {
    // 切换到多库位模式时，清空固定库位的当前库位
    fixedTransferForm.value.targetLocationCode = '';
  }
  fixedTransferForm.value.lfsnr = '';
  fixedTransferForm.value.bktxt = '';
  fixedTransferForm.value.postingDate = null;
  fixedTransferForm.value.remark = '';
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

const handleInventoryTypeChange = (row: any) => {
  const item = row;
  if (item.inventoryType === 'N') {
    item.currentQuantity = item.availableQuantity || 0;
  } else if (item.inventoryType === 'X') {
    item.currentQuantity = item.inspectionQuantity || 0;
  } else if (item.inventoryType === 'S') {
    item.currentQuantity = item.blockedQuantity || 0;
  }
};

const toNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const roundQty = (value: number) => Number(value.toFixed(3));

const resolveDemandKey = (row: any) => String(row.originId || row.id || `${row.sourceDocCode || ''}_${row.poItemNo || row.sourceDocItem || ''}_${row.itemCode || ''}`);

const resolveOrderOpenQuantity = (row: any) => toNumber(row.originQuantity ?? row.orderQuantity ?? row.poQuantity);

const resolveInventoryOpenQuantity = (row: any) => {
  const ratio = toNumber(row.conversionRatio, 1) || 1;
  return roundQty(resolveOrderOpenQuantity(row) * ratio);
};

const resolveAllocatedReturnQuantity = (row: any, excludeRow?: any) => {
  const key = resolveDemandKey(row);
  return roundQty(
    flattenTransferList(transferList.value).reduce((sum, item) => {
      if (excludeRow && item === excludeRow) {
        return sum;
      }
      if (resolveDemandKey(item) !== key) {
        return sum;
      }
      return sum + toNumber(item.returnQuantity);
    }, 0)
  );
};

const resolveRemainingReturnQuantity = (row: any, excludeRow?: any) => {
  return Math.max(0, roundQty(resolveOrderOpenQuantity(row) - resolveAllocatedReturnQuantity(row, excludeRow)));
};

const openInventoryDialog = (row: any) => {
  if (!isTreeParentRow(row)) {
    return;
  }
  if (!String(row.itemCode || row.materialCode || '').trim()) {
    proxy.$modal.msgWarning('请先选择物料');
    return;
  }
  const remainingOrderQty = resolveRemainingReturnQuantity(row, row);
  const ratio = toNumber(row.conversionRatio, 1) || 1;
  inventoryDialog.index = resolveTransferParentIndex(row);
  inventoryDialog.row = row;
  inventoryDialog.issueQty = remainingOrderQty > 0 ? roundQty(remainingOrderQty * ratio) : resolveInventoryOpenQuantity(row);
  inventoryDialog.visible = true;
};

const applyInventorySelection = (payload: { locations: any[] }) => {
  const source = inventoryDialog.row;
  const locations = payload.locations || [];
  if (!source || !locations.length) {
    return;
  }

  const originId = source.originId || source.id;
  const originQuantity = resolveOrderOpenQuantity(source);
  const ratio = toNumber(source.conversionRatio, 1) || 1;
  let remainDemandInv = roundQty(resolveRemainingReturnQuantity(source, source) * ratio) || resolveInventoryOpenQuantity(source);

  const splitRows = locations
    .map((location, locationIndex) => {
      const available = toNumber(location.availableQuantity);
      const requested = toNumber(location.pickQty);
      const inventoryQuantity = roundQty(Math.max(0, Math.min(requested, available, remainDemandInv)));
      remainDemandInv = Math.max(0, roundQty(remainDemandInv - inventoryQuantity));
      const returnQuantity = roundQty(inventoryQuantity / ratio);
      const specialInventoryFlag = location.specialInventoryFlag || source.specialInventoryFlag || '';
      const businessCode = location.businessCode || '';
      const businessName = location.businessName || '';
      return {
        ...source,
        originId,
        originQuantity,
        inventoryDetailId: location.id,
        batchCode: location.batchCode || '',
        warehouseCode: location.warehouseCode,
        areaCode: location.areaCode,
        locationCode: location.locationCode,
        sourceWarehouseCode: location.warehouseCode,
        sourceAreaCode: location.areaCode,
        sourceLocationCode: location.locationCode,
        specialInventoryFlag,
        inventoryType: location.inventoryType || source.inventoryType || 'N',
        availableQuantity: available,
        inspectionQuantity: toNumber(location.inspectionQuantity ?? location.inspectionQty),
        blockedQuantity: toNumber(location.blockedQuantity ?? location.blockedQty),
        currentQuantity: available,
        returnQuantity,
        inventoryQuantity,
        inventoryUnit: location.unit || source.inventoryUnit || source.unit,
        unit: location.unit || source.unit,
        businessCode,
        businessName,
        supplierCode: specialInventoryFlag === 'K' ? businessCode : source.supplierCode,
        customerCode: specialInventoryFlag === 'W' ? businessCode : source.customerCode,
        inventorySplitKey: `${originId}_${location.rowKey || location.id || locationIndex}`
      };
    })
    .filter((row) => toNumber(row.returnQuantity) > 0 || toNumber(row.inventoryQuantity) > 0);

  if (!splitRows.length) {
    proxy.$modal.msgWarning('退货数量必须大于 0');
    return;
  }

  if (isTreeParentRow(source)) {
    const parentIndex = resolveTransferParentIndex(source);
    if (parentIndex < 0) {
      return;
    }
    transferList.value.splice(
      parentIndex,
      1,
      ...splitRows.map((splitRow) => ({
        ...splitRow,
        transferRowKey: splitRow.inventorySplitKey || `${splitRow.originId}_${splitRow.batchCode || ''}`,
        groupKey: splitRow.inventorySplitKey || `${splitRow.originId}_${splitRow.batchCode || ''}`,
        mainMovement: splitRow,
        childMovementList: [],
        childMovements: []
      }))
    );
  } else {
    const parentIndex = resolveTransferParentIndex(source);
    const parent = transferList.value[parentIndex];
    if (!parent?.childMovementList) {
      return;
    }
    const childIndex = parent.childMovementList.findIndex((child: any) => child === source || child.originId === source.originId);
    if (childIndex < 0) {
      return;
    }
    parent.childMovementList.splice(childIndex, 1, ...splitRows);
    parent.childMovements = parent.childMovementList;
  }

  inventoryDialog.visible = false;
  inventoryDialog.index = -1;
  inventoryDialog.row = null;
  inventoryDialog.issueQty = 0;
};

/** 提交移转 */
const submitTransfer = async (moveType: any) => {
  const validTransfers = flattenTransferList(transferList.value).filter((item) => toNumber(item.returnQuantity) > 0);
  resultStatus.value = true;
  resultMessage.value = '';
  if (validTransfers.length === 0) {
    resultMessage.value = '没有有效的移转记录';
    resultStatus.value = false;
    return;
  }

  if (transferMode.value === 'fixed') {
    // 固定库位模式验证
    // if (!fixedTransferForm.value.targetLocationCode) {
    //   resultMessage.value = '请输入当前库位编码';
    //   resultStatus.value = false;
    //   return;
    // }

    // 为所有记录设置统一的当前库位、交货单、抬头文本、过账日期、备注
    validTransfers.forEach((item) => {
      item.targetLocationCode = fixedTransferForm.value.targetLocationCode ? fixedTransferForm.value.targetLocationCode : item.locationCode;
      item.lfsnr = fixedTransferForm.value.lfsnr || '';
      item.bktxt = fixedTransferForm.value.bktxt || '';
      item.postingDate = formatPostingDate(fixedTransferForm.value.postingDate) || '';
      item.remark = fixedTransferForm.value.remark;
    });
  } else {
    // 多库位模式验证
    const invalidItems = validTransfers.filter((item) => !item.targetLocationCode);
    if (invalidItems.length > 0) {
      resultMessage.value = '请填写所有移转记录的当前库位';
      resultStatus.value = false;
      return;
    }
    // 为所有记录设置统一的交货单、抬头文本、过账日期、备注
    validTransfers.forEach((item) => {
      item.lfsnr = fixedTransferForm.value.lfsnr || '';
      item.bktxt = fixedTransferForm.value.bktxt || '';
      item.postingDate = formatPostingDate(fixedTransferForm.value.postingDate) || '';
      item.remark = fixedTransferForm.value.remark;
    });
  }

  // 验证退货数量是否超过当前数量
  const overQuantityItems = validTransfers.filter((item) => item.returnQuantity > resolveOrderOpenQuantity(item));
  if (overQuantityItems.length > 0) {
    resultMessage.value = '退货数量不能超过当前可用数量';
    resultStatus.value = false;
    return;
  }
  const demandTotals = new Map<string, { originQuantity: number; returnQuantity: number }>();
  for (const item of validTransfers) {
    const key = resolveDemandKey(item);
    const current = demandTotals.get(key) || { originQuantity: resolveOrderOpenQuantity(item), returnQuantity: 0 };
    current.returnQuantity = roundQty(current.returnQuantity + toNumber(item.returnQuantity));
    current.originQuantity = resolveOrderOpenQuantity(item) || current.originQuantity;
    demandTotals.set(key, current);
  }
  if ([...demandTotals.values()].some((item) => item.originQuantity > 0 && item.returnQuantity > item.originQuantity)) {
    resultMessage.value = '同一来源行的退货数量合计不能超过可用数量';
    resultStatus.value = false;
    return;
  }
  if (moveType === '102') {
    buttonLoading1.value = true;
  } else if (moveType === '122') {
    buttonLoading2.value = true;
  }

  try {
    // 构造移转请求参数
    const transferRequests: PurchaseOrderReturnBo[] = validTransfers.map((item) => ({
      id: item.id,
      moveType: resolvePurchaseReturnSubmitMoveType(item, moveType),
      batchCode: item.batchCode,
      businessCode: item.businessCode,
      businessName: item.businessName,
      itemCode: item.itemCode,
      itemName: item.itemName,
      inventoryType: item.inventoryType,
      inventoryQuantity: item.inventoryQuantity,
      inventoryUnit: item.inventoryUnit,
      sourceDocCode: item.sourceDocCode,
      sourceDocType: item.sourceDocType,
      poItemNo: item.poItemNo,
      returnQuantity: item.returnQuantity,
      poUnit: item.poUnit,
      conversionRatio: item.conversionRatio,
      sapMaterialDocYear: item.sapMaterialDocYear,
      sapMaterialOrderNo: item.sapMaterialOrderNo,
      sapMaterialItem: item.sapMaterialItem,
      specialInventoryFlag: item.specialInventoryFlag,
      targetLocationCode: item.targetLocationCode,
      lfsnr: item.lfsnr,
      bktxt: item.bktxt,
      postingDate: item.postingDate
    }));

    const payload: PurchaseOrderReturnBatchForm = {
      purchaseOrderReturnBoList: transferRequests,
      returnType: 1
    };

    const res: any = await returnPurchaseInventory(payload);

    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg;
      resultStatus.value = false;
      return;
    }
    resultMessage.value = res.msg || `成功移转${validTransfers.length}条记录`;
    resultStatus.value = true;
    transferList.value = [];
    fixedTransferForm.value.targetLocationCode = '';
    fixedTransferForm.value.lfsnr = '';
    fixedTransferForm.value.bktxt = '';
    fixedTransferForm.value.postingDate = null;
    fixedTransferForm.value.remark = '';
    handleQuery();
  } catch (error) {
    loading.value = false;
    resultMessage.value = error.message || '移转失败';
    resultStatus.value = false;
  } finally {
    buttonLoading1.value = false;
    buttonLoading2.value = false;
  }
};

onMounted(() => {
  getList();
});
</script>

<style scoped>
.purchase-return-page {
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
  font-size: 16px;
  color: var(--el-text-color-secondary);
  transition: transform 0.2s;
}

.history-collapse-icon.is-expanded {
  transform: rotate(90deg);
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

.issue-qty-unit {
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.source-location-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

:deep(.return-tree-parent-row) {
  font-weight: 500;
}

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
