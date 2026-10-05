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
              <span class="history-header-title">采购订单明细</span>
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
            <el-form-item label="显示已收货" prop="showOpenQuantityZero">
              <el-checkbox v-model="queryParams.showOpenQuantityZero" @change="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery" :loading="loading">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="search-result">
            <PurchaseOrderDetailTreeTable ref="purchaseTableRef" :rows="purchaseOrderDetailList" mode="history" :columns="columns" :loading="loading" height="300" show-move-type :wms_purchase_category="wms_purchase_category" @selection-change="handleSelectionChange">
              <template #after-category>
                <el-table-column label="交货状态" align="center" width="100">
                  <template #default="scope">
                    <template v-if="isPoDetailParentRow(scope.row)">
                      <el-tooltip :content="getEarlyDeliveryTooltip(scope.row)" placement="top">
                        <el-tag :type="getEarlyDeliveryTagType(scope.row)">
                          {{ getEarlyDeliveryText(scope.row) }}
                        </el-tag>
                      </el-tooltip>
                    </template>
                  </template>
                </el-table-column>
              </template>
            </PurchaseOrderDetailTreeTable>
            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
          </div>
        </div>
      </el-card>
    </el-col>

    <div style="margin: 20px 0; text-align: center; width: 100%">
      <el-button type="primary" @click="addSelectedToInboundList" circle class="rotate-button">
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
              <span class="header-title">入库列表</span>
            </div>
            <div class="header-actions" @click.stop>
              <el-radio-group v-model="inboundMode">
                <el-radio-button label="fixed">固定库位</el-radio-button>
                <el-radio-button label="multiple">多库位</el-radio-button>
              </el-radio-group>
              <el-button @click="openStagingDialog">持有数据{{ stagingSummaries.length ? `(${stagingSummaries.length})` : '' }}</el-button>
              <el-button type="danger" @click="clearInboundList" :disabled="inboundList.length === 0">清空列表</el-button>
            </div>
          </div>
        </template>

        <div v-show="transferExpanded" class="transfer-card-body">
          <el-form :model="fixedInboundForm" ref="fixedInboundFormRef" label-width="auto" :inline="true">
            <el-row :gutter="20">
              <el-col :sm="24" :md="8" :lg="8" v-if="inboundMode === 'fixed'">
                <el-form-item label="目标库位" prop="locationCode" :rules="[{ required: true, message: '请输入目标库位编码', trigger: 'blur' }]">
                  <HistoryInput v-model="fixedInboundForm.locationCode" :config="locationCodeConfig" placeholder="请输入目标库位编码" @keydown.tab.prevent="locationCodeKeyDownTab(fixedInboundForm.locationCode)" @keydown.enter.prevent="locationCodeKeyDownTab(fixedInboundForm.locationCode)">
                    <template #append>
                      <el-button icon="Search" @click="showStorageLocationDialog(-1)"></el-button>
                    </template>
                  </HistoryInput>
                </el-form-item>
              </el-col>
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="交货单">
                  <HistoryInput v-model="fixedInboundForm.lfsnr" :config="lfsnrConfig" placeholder="请输入交货单" />
                </el-form-item>
              </el-col>
              <el-col :sm="24" :md="inboundMode === 'fixed' ? 7 : 8" :lg="inboundMode === 'fixed' ? 7 : 8">
                <el-form-item label="抬头文本" prop="bktxt">
                  <HistoryInput v-model="fixedInboundForm.bktxt" :config="bktxtConfig" placeholder="请输入抬头文本" />
                </el-form-item>
              </el-col>
              <el-col v-if="inboundMode === 'fixed'" :sm="1" :md="1" :lg="1" class="posting-date-toggle-col">
                <el-form-item label-width="0" class="posting-date-toggle-item">
                  <el-icon class="posting-date-toggle-icon" @click.stop="postingDateVisible = !postingDateVisible">
                    <ArrowUp v-if="postingDateVisible" />
                    <ArrowDown v-else />
                  </el-icon>
                </el-form-item>
              </el-col>
              <el-col v-show="inboundMode === 'multiple' || postingDateVisible" :sm="24" :md="8" :lg="8">
                <el-form-item label="过账日期" prop="postingDate">
                  <el-date-picker clearable v-model="fixedInboundForm.postingDate" type="date" :disabled-date="disabledFutureDate" value-format="YYYY-MM-DD" placeholder="请选择接收日期" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>

          <div v-if="resultMessage" class="m-y-2">
            <el-alert show-icon center :type="resultStatus ? 'success' : 'error'" class="submit-result-alert">
              <template #icon>
                <Bell />
              </template>
              <div class="submit-result-text">{{ resultMessage }}</div>
            </el-alert>
          </div>

          <PurchaseOrderDetailTreeTable :rows="inboundList" mode="operation" :selectable="false" :default-expand-all="true" max-height="400" :loading="tableLoading">
            <template #columns>
              <el-table-column label="序号" width="80" align="center">
                <template #default="scope">
                  {{ inboundList.findIndex((item) => item.inboundRowKey === (isPoDetailParentRow(scope.row) ? scope.row.inboundRowKey : scope.row.parentInboundRowKey)) + 1 || '' }}
                </template>
              </el-table-column>
              <el-table-column label="移动类型" prop="moveType" width="88" align="center" />
              <el-table-column label="采购单" prop="poNumber" min-width="120" />
              <el-table-column label="项次" prop="itemNumber" width="70">
                <template #default="scope">
                  <span>{{ scope.row.itemNumber ?? '' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="采购类别" prop="poCategory" align="center" width="100">
                <template #default="scope">
                  <dict-tag v-if="isPoDetailParentRow(scope.row)" :options="wms_purchase_category" :value="scope.row.poCategory" />
                </template>
              </el-table-column>
              <el-table-column label="料号" prop="materialCode" min-width="135" />
              <el-table-column label="物料描述" prop="materialDesc" min-width="160" show-overflow-tooltip />
              <el-table-column label="未清/未发数量" min-width="150" align="center">
                <template #default="scope">
                  <template v-if="isPoDetailParentRow(scope.row)">
                    {{ formatQtyWithUnit(scope.row.openQuantity, scope.row.orderUnit) }}
                  </template>
                  <template v-else>
                    {{ formatQtyWithUnit(scope.row.openQuantity, scope.row.inventoryUnit) }}
                  </template>
                </template>
              </el-table-column>
              <el-table-column label="批次" min-width="160">
                <template #default="scope">
                  <div v-if="!isPoDetailParentRow(scope.row)" class="inventory-source-cell">
                    <span v-if="scope.row.batchCode" class="batch-code-text">{{ scope.row.batchCode }}</span>
                    <el-tag v-else type="warning" size="small">未选择批次</el-tag>
                    <el-button type="primary" link icon="Search" @click="openBomInventoryDialog(findOperationParentRow(inboundList, scope.row), scope.row)" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="目标库位" width="220" v-if="inboundMode === 'multiple'">
                <template #default="scope">
                  <TableHistoryInput v-if="isPoDetailParentRow(scope.row)" v-model="scope.row.locationCode" :config="locationCodeConfig" placeholder="请输入目标库位编码" @keydown.tab.prevent="locationCodeKeyDownTab(scope.row.locationCode)" @keydown.enter.prevent="locationCodeKeyDownTab(scope.row.locationCode)">
                    <template #append>
                      <el-button icon="Search" @click="showStorageLocationDialog(inboundList.findIndex((item) => item.inboundRowKey === scope.row.inboundRowKey))"></el-button>
                    </template>
                  </TableHistoryInput>
                </template>
              </el-table-column>
              <el-table-column label="收货/扣料数量" align="center" width="200">
                <template #default="scope">
                  <template v-if="isPoDetailParentRow(scope.row)">
                    <el-input-number v-model="scope.row.receivePoQuantity" :min="0" :max="parseFloat(scope.row.openQuantity || 0)" :precision="3" size="small" controls-position="right" @change="handleReceivePoQuantityChange(scope.row)" />
                    <span class="issue-qty-unit">{{ scope.row.orderUnit || '' }}</span>
                  </template>
                  <template v-else>
                    <div class="qty-convert-cell">
                      <el-input-number v-model="scope.row.consumeQuantity" :min="0" :precision="3" size="small" controls-position="right" @change="handleBomConsumeQuantityChange(scope.row)" />
                      <span class="qty-convert-unit">{{ scope.row.orderUnit || '' }}</span>
                    </div>
                  </template>
                </template>
              </el-table-column>
              <el-table-column label="库存数量" min-width="100" align="center">
                <template #default="scope">
                  {{ formatQtyWithUnit(scope.row.inventoryQuantity, scope.row.inventoryUnit) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center">
                <template #default="scope">
                  <el-button v-if="isPoDetailParentRow(scope.row)" type="danger" link icon="Delete" @click="removeFromInboundList(inboundList.findIndex((item) => item.inboundRowKey === scope.row.inboundRowKey))"></el-button>
                </template>
              </el-table-column>
            </template>
          </PurchaseOrderDetailTreeTable>

          <div style="margin-top: 20px; text-align: center" class="inbound-submit-bar">
            <el-button :loading="stagingLoading" :disabled="inboundList.length === 0" @click="handleSaveStaging">暂存</el-button>
            <el-button :loading="buttonLoading" type="primary" @click="submitForm" :disabled="inboundList.length === 0">采购收货</el-button>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>

  <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
  <UserCollectionsDialog ref="userCollectionsDialogRef" @user-collections-call-back="userCollectionsSelectCallBack" />
  <InventorySelectionDialog v-model="bomInventoryDialog.visible" :material-code="bomInventoryDialog.materialCode" :material-desc="bomInventoryDialog.materialDesc" :issue-qty="bomInventoryDialog.issueQty" :unit="bomInventoryDialog.unit" :general-only="false" special-inventory-flag="O" :business-code="bomInventoryDialog.supplierCode" @confirm="applyBomInventorySelection" />

  <el-dialog v-model="stagingDialogVisible" title="持有数据（供应商编码 + 过账日期）" width="80%" append-to-body destroy-on-close>
    <el-table :data="stagingSummaries" border max-height="360" empty-text="暂无暂存数据">
      <el-table-column label="供应商编码" prop="supplierCode" min-width="120" />
      <el-table-column label="供应商名称" prop="supplierName" min-width="160" show-overflow-tooltip />
      <el-table-column label="过账日期" prop="postingDate" width="110" align="center" />
      <el-table-column label="行数" prop="lineCount" width="70" align="center" />
      <el-table-column label="暂存时间" min-width="160" align="center">
        <template #default="scope">{{ parseTime(scope.row.savedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" align="center" fixed="right">
        <template #default="scope">
          <el-button type="primary" link @click="handleLoadStaging(scope.row)">加载</el-button>
          <el-button type="danger" link @click="handleDeleteStaging(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup name="PurchaseReceive" lang="ts">
import { addPurchaseInbound, listPurchaseOrderDetail } from '@/api/wms/purchaseOrderDetail';
import { PurchaseOrderBomVO, PurchaseOrderDetailVO, PurchaseOrderDetailQuery, PurchaseOrderDetailForm } from '@/api/wms/purchaseOrderDetail/types';
import HistoryInput from '@/components/HistoryInput/index.vue';
import TableHistoryInput from '@/components/TableHistoryInput/index.vue';
import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import UserCollectionsDialog from '@/views/wms/userCollections/components/userCollectionsDialog.vue';
import InventorySelectionDialog from '@/views/wms/inventoryDetail/components/InventorySelectionDialog.vue';
import { ArrowDown, ArrowRight, ArrowUp, Bell, Switch } from '@element-plus/icons-vue';
import { HttpStatus } from '@/enums/RespEnum';
import { listStorageLocation } from '@/api/wms/storageLocation';
import { HistoryConfig } from '@/types/history';
import { formatQty, formatQtyWithUnit, parseTime } from '@/utils/ruoyi';
import { buildPurchaseInboundStagingKey, listPurchaseInboundStagings, loadPurchaseInboundStaging, normalizeStagingPostingDate, PurchaseInboundStagingSummary, removePurchaseInboundStaging, resolveInboundStagingSupplier, savePurchaseInboundStaging } from '@/views/wms/purchaseInbound/utils/purchaseInboundStaging';
import { formatApiErrorMessage } from '@/utils/formatApiErrorMessage';
import PurchaseOrderDetailTreeTable from '@/views/wms/purchaseOrderDetail/components/PurchaseOrderDetailTreeTable.vue';
import { cloneInboundListForPersist, findOperationParentRow, inheritPoItemNumberOnBom, isOutsourcingCategory, isPoDetailParentRow, normalizeInboundListAfterLoad, PoDetailTreeRow } from '@/views/wms/purchaseOrderDetail/utils/purchaseOrderDetailTree';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_purchase_category } = toRefs<any>(proxy?.useDict('wms_purchase_category'));

const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();
const userCollectionsDialogRef = ref<InstanceType<typeof UserCollectionsDialog>>();
const purchaseOrderDetailList = ref<PurchaseOrderDetailVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const historyExpanded = ref(true);
const transferExpanded = ref(true);
const postingDateVisible = ref(false);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const currenIndex = ref(0);
const resultMessage = ref('');
const resultStatus = ref(false);
const buttonLoading = ref(false);
const stagingLoading = ref(false);
const stagingDialogVisible = ref(false);
const stagingSummaries = ref<PurchaseInboundStagingSummary[]>([]);
const tableLoading = ref(false);
const selectedSearchItems = ref<PurchaseOrderDetailVO[]>([]);
const inboundList = ref<any[]>([]);
let inboundRowKeySeq = 0;
const inboundMode = ref<'fixed' | 'multiple'>('fixed');
const fixedInboundForm = ref({
  locationCode: '',
  lfsnr: '',
  bktxt: '',
  postingDate: null
});
const queryFormRef = ref<ElFormInstance>();
const purchaseTableRef = ref<InstanceType<typeof PurchaseOrderDetailTreeTable>>();

const bomInventoryDialog = reactive({
  visible: false,
  inboundIndex: -1,
  bomIndex: -1,
  materialCode: '',
  materialDesc: '',
  issueQty: 0,
  unit: '',
  supplierCode: ''
});

const toNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const roundQty = (value: number) => Number(value.toFixed(3));

const initFormData: PurchaseOrderDetailForm = {
  id: undefined,
  poNumber: undefined,
  itemNumber: undefined,
  materialCode: undefined,
  materialDesc: undefined,
  shortText: undefined,
  orderQuantity: undefined,
  orderUnit: undefined,
  returnFlag: undefined,
  openQuantity: undefined,
  itemDeleteFlag: undefined,
  completedFlag: undefined,
  enableSapSync: true,
  showOpenQuantityZero: false,
  receiveType: '1',
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
    returnFlag: undefined,
    openQuantity: undefined,
    itemDeleteFlag: undefined,
    completedFlag: undefined,
    enableSapSync: true,
    showOpenQuantityZero: false,
    receiveType: '1',
    params: {}
  },
  rules: {}
});

const { queryParams } = toRefs(data);

const poNumberConfig: HistoryConfig = {
  key: 'poNumber',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseInbound',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};
const locationCodeConfig: HistoryConfig = {
  key: 'locationCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseInbound',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};
const lfsnrConfig: HistoryConfig = {
  key: 'lfsnr',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseInbound',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};
const bktxtConfig: HistoryConfig = {
  key: 'bktxt',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseInbound',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};
const itemNoConfig: HistoryConfig = {
  key: 'itemNo',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseInbound',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};

const columns = ref<FieldOption[]>([
  { key: 0, label: `采购单`, visible: true, children: [] },
  { key: 1, label: `项次`, visible: true, children: [] },
  { key: 2, label: `排程`, visible: true, children: [] },
  { key: 3, label: `交货日期`, visible: true, children: [] },
  { key: 4, label: `料号`, visible: true, children: [] },
  { key: 5, label: `旧料号`, visible: false, children: [] },
  { key: 6, label: `物料描述`, visible: true, children: [] },
  { key: 7, label: `订单数量`, visible: true, children: [] },
  { key: 8, label: `已收数量`, visible: true, children: [] },
  { key: 9, label: `未清数量`, visible: true, children: [] },
  { key: 10, label: `订单单位`, visible: true, children: [] },
  { key: 11, label: `需质检`, visible: false, children: [] },
  { key: 12, label: `库存单位数量`, visible: false, children: [] },
  { key: 13, label: `库存单位`, visible: false, children: [] },
  { key: 14, label: `换算比例`, visible: false, children: [] },
  { key: 15, label: `供应商代码`, visible: true, children: [] },
  { key: 16, label: `供应商名称`, visible: true, children: [] },
  { key: 17, label: `采购类别`, visible: true, children: [] }
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

const getEarlyDeliveryText = (row) => {
  if (isEarlyDeliveryForbidden(row)) {
    return '禁止';
  }
  return '允许';
};

const getEarlyDeliveryTagType = (row) => {
  if (isEarlyDeliveryForbidden(row)) {
    return 'danger';
  }
  return 'success';
};

const getEarlyDeliveryTooltip = (row) => {
  if (isEarlyDeliveryForbidden(row)) {
    return '禁止厂商提前三个工作日交货';
  }
  return '允许提前交货';
};

const isEarlyDeliveryForbidden = (row) => {
  const isSupplierNotTWZ0 = row.supplierCode !== 'TWZ0';
  const isProjectCategoryNot2 = row.projectCategory !== '2';
  if (!row.deliveryDate) {
    return false;
  }
  const earlyDeliveryDate = new Date(row.earlyDeliveryDate);
  const isPostingTooEarly = earlyDeliveryDate > new Date();
  return isSupplierNotTWZ0 && isProjectCategoryNot2 && isPostingTooEarly;
};

const getList = async () => {
  loading.value = true;
  try {
    const res = await listPurchaseOrderDetail(queryParams.value);
    purchaseOrderDetailList.value = res.rows;
    total.value = res.total;
  } finally {
    loading.value = false;
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

const calculateInventoryQuantity = (row) => {
  row.inventoryQuantity = ((row.receivePoQuantity || 0) * (row.conversionRatio || 1)).toFixed(3);
};

const createInboundRowKey = () => `inbound-${Date.now()}-${++inboundRowKeySeq}`;

const getBomConversionRatio = (bom: PurchaseOrderBomVO) => {
  const ratio = Number(bom.conversionRatio || 1);
  return ratio > 0 ? ratio : 1;
};

/** 本次扣料按发料单位默认值：未发库存数量按收货比例换算后再除以换算比例。 */
const getBomConsumptionQuantity = (row: any, bom: PurchaseOrderBomVO) => {
  const parentOpenQuantity = Number(row.openQuantity || 0);
  const receiveQuantity = Number(row.receivePoQuantity || 0);
  const bomOpenInventoryQuantity = Number(bom.openQuantity ?? bom.componentQty ?? 0);
  const ratio = parentOpenQuantity > 0 ? receiveQuantity / parentOpenQuantity : 1;
  const inventoryQuantity = bomOpenInventoryQuantity * ratio;
  return Number((inventoryQuantity / getBomConversionRatio(bom)).toFixed(3));
};

const calculateBomInventoryQuantity = (bom: PurchaseOrderBomVO) => {
  bom.inventoryQuantity = (Number(bom.consumeQuantity || 0) * getBomConversionRatio(bom)).toFixed(3);
};

const clearBomInventorySelection = (bom: PurchaseOrderBomVO) => {
  bom.inventoryDetailId = undefined;
  bom.warehouseCode = undefined;
  bom.areaCode = undefined;
  bom.locationCode = undefined;
  bom.batchCode = undefined;
  bom.specialInventoryFlag = undefined;
  bom.businessCode = undefined;
  bom.inventorySplitKey = undefined;
};

const syncBomConsumeQuantity = (row: any) => {
  (row.purchaseOrderBomScheduleVoList || []).forEach((bom: PurchaseOrderBomVO) => {
    if (bom.inventoryDetailId || bom.batchCode) {
      return;
    }
    bom.consumeQuantity = getBomConsumptionQuantity(row, bom);
    calculateBomInventoryQuantity(bom);
  });
};

const openBomInventoryDialog = (parentRow: any, bomRow: PurchaseOrderBomVO) => {
  if (!parentRow || !bomRow) {
    return;
  }
  const inboundIndex = inboundList.value.findIndex((item) => item.inboundRowKey === parentRow.inboundRowKey);
  const bomIndex = parentRow.purchaseOrderBomScheduleVoList?.indexOf(bomRow) ?? -1;
  if (inboundIndex < 0 || bomIndex < 0) {
    return;
  }
  if (!String(bomRow.componentMaterial || '').trim()) {
    proxy?.$modal.msgWarning('请先确认组件料号');
    return;
  }
  if (!String(parentRow.supplierCode || '').trim()) {
    proxy?.$modal.msgWarning('缺少供应商代码，无法选择转包库存');
    return;
  }
  bomInventoryDialog.inboundIndex = inboundIndex;
  bomInventoryDialog.bomIndex = bomIndex;
  bomInventoryDialog.materialCode = bomRow.componentMaterial || '';
  bomInventoryDialog.materialDesc = bomRow.componentDesc || '';
  bomInventoryDialog.unit = bomRow.inventoryUnit || '';
  bomInventoryDialog.supplierCode = parentRow.supplierCode || '';
  const demand = roundQty(toNumber(bomRow.inventoryQuantity));
  bomInventoryDialog.issueQty = demand > 0 ? demand : roundQty(toNumber(bomRow.openQuantity));
  bomInventoryDialog.visible = true;
};

const applyBomInventorySelection = ({ locations }: { locations: any[] }) => {
  const inboundIndex = bomInventoryDialog.inboundIndex;
  const bomIndex = bomInventoryDialog.bomIndex;
  const parent = inboundList.value[inboundIndex];
  const source = parent?.purchaseOrderBomScheduleVoList?.[bomIndex];
  if (!parent || !source || !locations?.length) {
    return;
  }

  const ratio = getBomConversionRatio(source);
  let remainDemandInv = roundQty(toNumber(source.inventoryQuantity));
  if (remainDemandInv <= 0) {
    remainDemandInv = roundQty(toNumber(source.openQuantity));
  }
  const originBomKey = source.originBomKey || `${source.scheduleNumber || ''}_${source.componentMaterial || ''}_${source.id ?? bomIndex}`;

  const splitRows = locations
    .map((location, locationIndex) => {
      const available = toNumber(location.availableQuantity);
      const requested = toNumber(location.pickQty);
      const inventoryQuantity = roundQty(Math.max(0, Math.min(requested, available, remainDemandInv)));
      remainDemandInv = Math.max(0, roundQty(remainDemandInv - inventoryQuantity));
      const consumeQuantity = ratio > 0 ? roundQty(inventoryQuantity / ratio) : 0;
      const batchCode = location.batchCode || '';
      return inheritPoItemNumberOnBom(
        {
        ...source,
        originBomKey,
        moveType: '543',
        inventoryDetailId: location.id,
        warehouseCode: location.warehouseCode,
        areaCode: location.areaCode,
        locationCode: location.locationCode,
        batchCode,
        specialInventoryFlag: location.specialInventoryFlag || 'O',
        businessCode: location.businessCode || parent.supplierCode || '',
        consumeQuantity,
        inventoryQuantity: inventoryQuantity.toFixed(3),
        inventorySplitKey: `${originBomKey}_${batchCode || 'batch'}_${location.rowKey || location.id || locationIndex}`
      } as PurchaseOrderBomVO,
        parent
      );
    })
    .filter((row) => toNumber(row.inventoryQuantity) > 0);

  if (!splitRows.length) {
    proxy?.$modal.msgWarning('扣料数量必须大于 0');
    return;
  }

  parent.purchaseOrderBomScheduleVoList.splice(bomIndex, 1, ...splitRows);
  bomInventoryDialog.visible = false;
  bomInventoryDialog.inboundIndex = -1;
  bomInventoryDialog.bomIndex = -1;
  bomInventoryDialog.issueQty = 0;
};

const handleBomConsumeQuantityChange = (bom: PurchaseOrderBomVO) => {
  if (bom.consumeQuantity === null || bom.consumeQuantity === undefined) {
    bom.consumeQuantity = 0;
  }
  calculateBomInventoryQuantity(bom);
  if (bom.inventoryDetailId || bom.batchCode) {
    clearBomInventorySelection(bom);
  }
};

const handleReceivePoQuantityChange = (row) => {
  if (row.receivePoQuantity === null || row.receivePoQuantity === undefined || row.receivePoQuantity === '') {
    row.inventoryQuantity = 0;
  } else {
    calculateInventoryQuantity(row);
  }
  syncBomConsumeQuantity(row);
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  purchaseTableRef.value?.clearSelection();
  handleQuery();
};

const handleSelectionChange = (selection: PoDetailTreeRow[]) => {
  const parents = selection.filter(isPoDetailParentRow) as PurchaseOrderDetailVO[];
  selectedSearchItems.value = parents;
  ids.value = parents.map((item) => item.id);
  single.value = parents.length != 1;
  multiple.value = !parents.length;
};

const addSelectedToInboundList = () => {
  if (selectedSearchItems.value.length === 0) {
    proxy?.$modal.msgWarning('请先选择要添加的采购订单明细');
    return;
  }
  const newItems = selectedSearchItems.value.map((item) => {
    const outsourcing = isOutsourcingCategory(item.poCategory);
    const bomList = outsourcing
      ? (item.purchaseOrderBomScheduleVoList || []).map((bom) => {
          const consumeQuantity = getBomConsumptionQuantity({ ...item, receivePoQuantity: item.openQuantity }, bom);
          const conversionRatio = getBomConversionRatio(bom);
          const originBomKey = `${bom.scheduleNumber || ''}_${bom.componentMaterial || ''}_${bom.id ?? ''}`;
          return inheritPoItemNumberOnBom(
            {
              ...bom,
              moveType: '543',
              conversionRatio,
              originBomKey,
              consumeQuantity,
              inventoryQuantity: (consumeQuantity * conversionRatio).toFixed(3)
            },
            item
          );
        })
      : [];
    return {
      ...item,
      inboundRowKey: createInboundRowKey(),
      // 外层收货行默认 101；托外加工才保留下方 543 BOM。
      moveType: '101',
      purchaseOrderBomScheduleVoList: bomList,
      receivePoQuantity: item.openQuantity,
      storageLocation: '',
      conversionRatio: item.conversionRatio || 1,
      inventoryQuantity: (item.openQuantity * (item.conversionRatio || 1)).toFixed(3)
    };
  });
  inboundList.value.push(...newItems);
  proxy?.$modal.msgSuccess(`成功添加${newItems.length}条记录到入库列表`);
  purchaseTableRef.value?.clearSelection();
};

const removeFromInboundList = (index: number) => {
  inboundList.value.splice(index, 1);
};

const clearInboundList = () => {
  inboundList.value = [];
  fixedInboundForm.value.locationCode = '';
  fixedInboundForm.value.lfsnr = '';
  fixedInboundForm.value.bktxt = '';
  fixedInboundForm.value.postingDate = null;
};

const showStorageLocationDialog = (index: number) => {
  storageLocationDialogRef.value?.openDialog();
  storageLocationDialogRef.value?.handleQuery();
  currenIndex.value = index;
};

const storageLocationSelectCallBack = (record: any) => {
  resultMessage.value = '';
  if (inboundMode.value === 'fixed') {
    fixedInboundForm.value.locationCode = record.locationCode;
  } else if (inboundMode.value === 'multiple') {
    if (currenIndex.value >= 0 && currenIndex.value < inboundList.value.length) {
      inboundList.value[currenIndex.value].locationCode = record.locationCode;
    }
  }
};

const showUserCollectionsDialog = (index: number) => {
  userCollectionsDialogRef.value?.openDialog();
  userCollectionsDialogRef.value?.handleQuery();
  currenIndex.value = index;
};

const userCollectionsSelectCallBack = (record: any) => {
  if (inboundMode.value === 'fixed') {
    fixedInboundForm.value.lfsnr = record.nickName;
  } else if (inboundMode.value === 'multiple') {
    if (currenIndex.value >= 0 && currenIndex.value < inboundList.value.length) {
      inboundList.value[currenIndex.value].lfsnr = record.nickName;
    }
  }
};

const buildMissingBatchBomMessage = (items: any[]) => {
  const detailLines: string[] = [];
  items.forEach((item) => {
    const rowNo = inboundList.value.findIndex((row) => row === item) + 1;
    (item.purchaseOrderBomScheduleVoList || []).forEach((bom: PurchaseOrderBomVO, bomIndex: number) => {
      const needBatch = (toNumber(bom.consumeQuantity) > 0 || toNumber(bom.inventoryQuantity) > 0) && !String(bom.batchCode || '').trim();
      if (!needBatch) {
        return;
      }
      detailLines.push(`序号${rowNo || '-'} 料号 ${item.materialCode || '-'}\n  组件 ${bom.componentMaterial || '-'}（BOM第${bomIndex + 1}行）`);
    });
  });
  if (!detailLines.length) {
    return '';
  }
  return `请先为以下543扣料明细选择批次：\n${detailLines.join('\n')}`;
};

const refreshStagingSummaries = async () => {
  stagingSummaries.value = await listPurchaseInboundStagings();
};

const openStagingDialog = async () => {
  await refreshStagingSummaries();
  stagingDialogVisible.value = true;
};

const applyStagingPayload = (payload: ReturnType<typeof loadPurchaseInboundStaging>) => {
  if (!payload) {
    return false;
  }
  inboundMode.value = payload.inboundMode;
  fixedInboundForm.value = { ...payload.fixedInboundForm };
  inboundList.value = normalizeInboundListAfterLoad(JSON.parse(JSON.stringify(payload.inboundList)));
  resultMessage.value = '';
  resultStatus.value = false;
  return true;
};

const handleSaveStaging = async () => {
  if (inboundList.value.length === 0) {
    proxy?.$modal.msgWarning('入库列表为空，无法暂存');
    return;
  }
  const supplier = resolveInboundStagingSupplier(inboundList.value);
  if (!supplier) {
    proxy?.$modal.msgWarning('暂存要求同一供应商：请确保入库列表中的供应商编码一致');
    return;
  }
  const postingDate = normalizeStagingPostingDate(fixedInboundForm.value.postingDate);
  if (!fixedInboundForm.value.postingDate) {
    fixedInboundForm.value.postingDate = postingDate;
  }
  stagingLoading.value = true;
  try {
    const summary = await savePurchaseInboundStaging(
      {
        receiveType: '1',
        inboundMode: inboundMode.value,
        fixedInboundForm: { ...fixedInboundForm.value, postingDate },
        inboundList: cloneInboundListForPersist(inboundList.value)
      },
      supplier.supplierCode,
      supplier.supplierName
    );
    await refreshStagingSummaries();
    resultStatus.value = true;
    resultMessage.value = `已暂存：${summary.supplierCode} / ${summary.postingDate}（${summary.lineCount} 行）`;
    proxy?.$modal.msgSuccess('暂存成功');
  } finally {
    stagingLoading.value = false;
  }
};

const handleLoadStaging = async (row: PurchaseInboundStagingSummary) => {
  const payload = await loadPurchaseInboundStaging(row.storageKey);
  if (!payload) {
    proxy?.$modal.msgWarning('暂存数据不存在或已损坏');
    await refreshStagingSummaries();
    return;
  }
  if (inboundList.value.length > 0) {
    try {
      await proxy?.$modal.confirm(`将加载暂存 ${row.supplierCode} / ${row.postingDate}，是否覆盖当前入库列表？`);
    } catch {
      return;
    }
  }
  applyStagingPayload(payload);
  stagingDialogVisible.value = false;
  transferExpanded.value = true;
  proxy?.$modal.msgSuccess('已加载暂存数据');
};

const handleDeleteStaging = async (row: PurchaseInboundStagingSummary) => {
  try {
    await proxy?.$modal.confirm(`确认删除暂存 ${row.supplierCode} / ${row.postingDate}？`);
  } catch {
    return;
  }
  await removePurchaseInboundStaging(row.storageKey);
  await refreshStagingSummaries();
  proxy?.$modal.msgSuccess('已删除暂存');
};

const clearCurrentStagingIfPosted = async () => {
  const supplier = resolveInboundStagingSupplier(inboundList.value);
  if (!supplier) {
    return;
  }
  const postingDate = normalizeStagingPostingDate(fixedInboundForm.value.postingDate);
  await removePurchaseInboundStaging(buildPurchaseInboundStagingKey(supplier.supplierCode, postingDate));
  await refreshStagingSummaries();
};

const submitForm = async () => {
  const validPurchaseInboundList = inboundList.value.filter((item) => item.receivePoQuantity > 0);
  resultStatus.value = true;
  resultMessage.value = '';
  if (validPurchaseInboundList.length === 0) {
    resultMessage.value = '收货数量不能都为0';
    resultStatus.value = false;
    return;
  }

  const poCategories = [...new Set(validPurchaseInboundList.map((item) => item.poCategory))];
  const hasOutsourcing = poCategories.includes('3');
  const hasOtherTypes = poCategories.some((category) => category !== '3');
  if (hasOutsourcing && hasOtherTypes) {
    resultMessage.value = '托外加工收货，不允许和其他类型一起收货';
    resultStatus.value = false;
    return;
  }

  if (inboundMode.value === 'fixed') {
    if (!fixedInboundForm.value.locationCode) {
      resultMessage.value = '请输入目标库位编码';
      resultStatus.value = false;
      return;
    }
    validPurchaseInboundList.forEach((item) => {
      item.locationCode = fixedInboundForm.value.locationCode || '';
    });
  } else {
    const invalidItems = validPurchaseInboundList.filter((item) => !item.locationCode);
    if (invalidItems.length > 0) {
      resultMessage.value = '请填写所有入库记录的目标库位';
      resultStatus.value = false;
      return;
    }
  }

  const overQuantityItems = validPurchaseInboundList.filter((item) => item.receivePoQuantity > item.openQuantity);
  if (overQuantityItems.length > 0) {
    resultMessage.value = '收货数量不能超过未清数量';
    resultStatus.value = false;
    return;
  }

  if (hasOutsourcing) {
    const missingBatchMessage = buildMissingBatchBomMessage(validPurchaseInboundList);
    if (missingBatchMessage) {
      resultMessage.value = missingBatchMessage;
      resultStatus.value = false;
      return;
    }
  }

  buttonLoading.value = true;
  try {
    const purchaseInboundRequests = validPurchaseInboundList.map((item) => {
      const { children, isPoDetailHead, rowKey, purchaseOrderBomScheduleVoList, ...itemRest } = item;
      return {
        ...itemRest,
        purchaseOrderBomScheduleBoList: (purchaseOrderBomScheduleVoList || []).map((bom) => {
          const { children: bomChildren, isPoDetailHead: bomHead, rowKey: bomRowKey, parentInboundRowKey, ...bomRest } = bom as Record<string, any>;
          const withItem = inheritPoItemNumberOnBom({ ...bomRest } as PurchaseOrderBomVO, item);
          return {
            ...withItem,
            inventoryQuantity: bom.inventoryQuantity ?? (Number(bom.consumeQuantity || 0) * getBomConversionRatio(bom)).toFixed(3)
          };
        }),
        receivePoQuantity: item.receivePoQuantity,
        receivePoUnit: item.orderUnit,
        receiveQuantity: item.inventoryQuantity,
        receiveUnit: item.inventoryUnit
      };
    });
    const res: any = await addPurchaseInbound({
      receiveType: '1',
      lfsnr: fixedInboundForm.value.lfsnr || '',
      bktxt: fixedInboundForm.value.bktxt || '',
      postingDate: formatPostingDate(fixedInboundForm.value.postingDate) || '',
      purchaseOrderInboundBoList: purchaseInboundRequests
    });
    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = formatApiErrorMessage(res.msg) || '入库失败';
      resultStatus.value = false;
      return;
    }
    resultMessage.value = res.msg || `采购入库成功${purchaseInboundRequests.length}条记录`;
    resultStatus.value = true;
    await clearCurrentStagingIfPosted();
    inboundList.value = [];
    fixedInboundForm.value.locationCode = '';
    fixedInboundForm.value.lfsnr = '';
    fixedInboundForm.value.bktxt = '';
    fixedInboundForm.value.postingDate = null;
    handleQuery();
  } catch (error: any) {
    const raw = typeof error === 'string' ? error : error?.message;
    resultMessage.value = formatApiErrorMessage(raw) || '入库失败';
    resultStatus.value = false;
  } finally {
    buttonLoading.value = false;
  }
};

onMounted(() => {
  void refreshStagingSummaries();
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
.search-result {
  flex: 1;
  overflow: auto;
  min-height: 200px;
}
.transfer-card-body {
  padding: 12px 16px 16px;
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
.posting-date-toggle-col {
  display: flex;
  align-items: center;
}
.posting-date-toggle-item {
  margin: 0 0 20px 0;
}
.posting-date-toggle-item :deep(.el-form-item__content) {
  margin-left: 0 !important;
  line-height: 32px;
}
.posting-date-toggle-icon {
  color: var(--el-color-primary);
  cursor: pointer;
  font-size: 16px;
}
.inbound-submit-bar {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.rotate-button {
  transform: rotate(90deg);
  margin: 0 auto;
}

.issue-qty-unit {
  color: var(--el-text-color-regular);
  white-space: nowrap;
  margin-left: 2px;
}

.qty-convert-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
}

.qty-convert-cell :deep(.el-input-number) {
  width: 132px;
}

.qty-convert-unit {
  flex-shrink: 0;
  min-width: 24px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  text-align: left;
}

.qty-convert-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.qty-convert-result {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  min-width: 88px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--el-fill-color);
  line-height: 22px;
}

.qty-convert-value {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.inventory-source-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.batch-code-text {
  font-weight: 600;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.submit-result-text {
  white-space: pre-line;
  text-align: left;
  line-height: 1.6;
  word-break: break-word;
}
</style>
