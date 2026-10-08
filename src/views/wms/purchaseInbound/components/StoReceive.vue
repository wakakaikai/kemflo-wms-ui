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
              <span class="history-header-title">STO订单明细</span>
            </div>
            <right-toolbar v-model:showSearch="showStoSearch" :columns="stoColumns" @queryTable="getStoList"></right-toolbar>
          </div>
        </template>

        <div v-show="historyExpanded" class="history-card-body">
          <el-form v-show="showStoSearch" ref="stoQueryFormRef" :model="stoQueryParams" :rules="stoRules" :inline="true" label-width="auto">
            <el-form-item label="交货单号" prop="deliveryOrderNo">
              <HistoryInput v-model="stoQueryParams.deliveryOrderNo" :config="deliveryOrderNoConfig" placeholder="请输入交货单号" @keydown.tab.prevent="handleStoQuery" @keydown.enter.prevent="handleStoQuery"> </HistoryInput>
            </el-form-item>
            <el-form-item label="交货单项次" prop="deliveryItemNo">
              <HistoryInput v-model="stoQueryParams.deliveryItemNo" :config="deliveryItemNoConfig" placeholder="请输入交货单项次" @keydown.tab.prevent="handleStoQuery" @keydown.enter.prevent="handleStoQuery" />
            </el-form-item>
            <el-form-item label="显示已收货" prop="showOpenQuantityZero">
              <el-checkbox v-model="stoQueryParams.showOpenQuantityZero" @change="handleShowReceivedChange" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleStoQuery" :loading="stoLoading">搜索</el-button>
              <el-button icon="Refresh" @click="resetStoQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="search-result">
            <el-table ref="stoTableRef" :data="stoOrderDetailList" height="300" border v-loading="stoLoading" @selection-change="handleStoSelectionChange">
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column v-if="stoColumns[0].visible" label="交货单号" align="left" prop="deliveryOrderNo" min-width="100" />
              <el-table-column v-if="stoColumns[1].visible" label="交货项次" align="left" prop="deliveryItemNo" />
              <el-table-column v-if="stoColumns[2].visible" label="采购单号" align="left" prop="purchaseOrderNo" min-width="100" />
              <el-table-column v-if="stoColumns[3].visible" label="采购项次" align="left" prop="purchaseItemNo" />
              <el-table-column v-if="stoColumns[17]?.visible" label="采购类别" align="center" prop="poCategory" min-width="100">
                <template #default="scope">
                  <dict-tag :options="wms_purchase_category" :value="scope.row.poCategory" />
                </template>
              </el-table-column>
              <el-table-column v-if="stoColumns[4].visible" label="交货日期" align="center" prop="deliveryDate" />
              <el-table-column v-if="stoColumns[5].visible" label="料号" align="left" prop="materialCode" />
              <el-table-column v-if="stoColumns[6].visible" label="旧料号" align="left" prop="oldMaterialCode" />
              <el-table-column v-if="stoColumns[7].visible" label="物料描述" align="left" prop="materialDesc" show-overflow-tooltip />
              <el-table-column v-if="stoColumns[18].visible" label="批次号" align="center" prop="batchCode" />
              <el-table-column v-if="stoColumns[8].visible" label="订单数量" align="left" prop="orderQuantity" />
              <el-table-column v-if="stoColumns[9].visible" label="已收数量" align="left" prop="receivedQuantity" />
              <el-table-column v-if="stoColumns[10].visible" label="未清数量" align="left" prop="openQuantity" />
              <el-table-column v-if="stoColumns[11].visible" label="订单单位" align="center" prop="orderUnit" />
              <el-table-column v-if="stoColumns[12].visible" label="需质检" align="center" prop="inspectionFlag" />
              <el-table-column v-if="stoColumns[13].visible" label="库存单位" align="center" prop="inventoryUnit" />
              <el-table-column v-if="stoColumns[14].visible" label="换算比例" align="center" prop="conversionRatio" />
              <el-table-column v-if="stoColumns[15].visible" label="供应商代码" align="center" prop="supplierCode" />
              <el-table-column v-if="stoColumns[16].visible" label="供应商名称" align="center" prop="supplierName" show-overflow-tooltip min-width="120" />
            </el-table>
            <pagination v-show="stoTotal > 0" :total="stoTotal" v-model:page="stoQueryParams.pageNum" v-model:limit="stoQueryParams.pageSize" @pagination="getStoList" />
          </div>
        </div>
      </el-card>
    </el-col>

    <div style="margin: 20px 0; text-align: center; width: 100%">
      <el-button type="primary" @click="addSelectedToStoInboundList" circle class="rotate-button">
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
              <span class="header-title">STO入库列表</span>
            </div>
            <div class="header-actions" @click.stop>
              <el-radio-group v-model="stoInboundMode">
                <el-radio-button label="fixed">固定库位</el-radio-button>
                <el-radio-button label="multiple">多库位</el-radio-button>
              </el-radio-group>
              <el-button type="danger" @click="clearStoInboundList" :disabled="stoInboundList.length === 0">清空列表</el-button>
            </div>
          </div>
        </template>

        <div v-show="transferExpanded" class="transfer-card-body">
          <el-form :model="stoFixedInboundForm" ref="stoFixedInboundFormRef" label-width="auto" :inline="true">
            <el-row :gutter="20">
              <el-col :sm="24" :md="8" :lg="8" v-if="stoInboundMode === 'fixed'">
                <el-form-item label="目标库位" prop="locationCode" :rules="[{ required: true, message: '请输入目标库位编码', trigger: 'blur' }]">
                  <HistoryInput v-model.trim="stoFixedInboundForm.locationCode" :config="locationCodeConfig" placeholder="请输入目标库位编码" @keydown.tab.prevent="locationCodeKeyDownTab(stoFixedInboundForm.locationCode)" @keydown.enter.prevent="locationCodeKeyDownTab(stoFixedInboundForm.locationCode)">
                    <template #append>
                      <el-button icon="Search" @click="showStorageLocationDialog(-1)"></el-button>
                    </template>
                  </HistoryInput>
                </el-form-item>
              </el-col>
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="抬头文本" prop="bktxt">
                  <HistoryInput v-model="stoFixedInboundForm.bktxt" :config="bktxtConfig" placeholder="请输入抬头文本" />
                </el-form-item>
              </el-col>
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="过账日期" prop="postingDate">
                  <el-date-picker clearable v-model="stoFixedInboundForm.postingDate" type="date" :disabled-date="disabledFutureDate" value-format="YYYY-MM-DD" placeholder="请选择接收日期" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>

          <div v-if="stoResultMessage" class="m-y-2">
            <el-alert show-icon center :title="stoResultMessage" :type="stoResultStatus ? 'success' : 'error'">
              <template #icon>
                <Bell />
              </template>
            </el-alert>
          </div>

          <PurchaseOrderDetailTreeTable :rows="stoInboundList" mode="operation" :selectable="false" :default-expand-all="true" max-height="400" :loading="stoTableLoading">
            <template #columns>
              <el-table-column label="序号" width="60" align="center">
                <template #default="scope">
                  {{ isPoDetailParentRow(scope.row) ? stoInboundList.findIndex((item) => item.inboundRowKey === scope.row.inboundRowKey) + 1 : '' }}
                </template>
              </el-table-column>
              <el-table-column label="移动类型" prop="moveType" width="90" align="center" />
              <el-table-column label="交货单号" min-width="120">
                <template #default="scope">{{ isPoDetailParentRow(scope.row) ? scope.row.deliveryOrderNo : '' }}</template>
              </el-table-column>
              <el-table-column label="交货项次" width="90" align="center">
                <template #default="scope">{{ isPoDetailParentRow(scope.row) ? scope.row.deliveryItemNo : '' }}</template>
              </el-table-column>
              <el-table-column label="采购订单号" prop="poNumber" min-width="120" />
              <el-table-column label="采购项次" prop="itemNumber" width="90" align="center" />
              <el-table-column label="计划行" prop="scheduleNumber" width="80" align="center">
                <template #default="scope">
                  <el-tag v-if="!isPoDetailParentRow(scope.row)" size="small" type="info">{{ scope.row.scheduleNumber }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="料号" prop="materialCode" min-width="135" />
              <el-table-column label="物料描述" prop="materialDesc" min-width="170" show-overflow-tooltip />
              <el-table-column label="未清/未发数量" min-width="140" align="right">
                <template #default="scope">
                  <div class="qty-display-cell">
                    <span class="qty-display-value">{{ formatQty(scope.row.openQuantity) || '-' }}</span>
                    <span class="qty-display-unit">{{ (isPoDetailParentRow(scope.row) ? scope.row.orderUnit : scope.row.inventoryUnit) || '' }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="批次" min-width="160">
                <template #default="scope">
                  <div v-if="!isPoDetailParentRow(scope.row)" class="inventory-source-cell">
                    <span v-if="scope.row.batchCode" class="batch-code-text">{{ scope.row.batchCode }}</span>
                    <el-tag v-else type="warning" size="small">未选择批次</el-tag>
                    <el-button type="primary" link icon="Search" @click="openBomInventoryDialog(findOperationParentRow(stoInboundList, scope.row), scope.row)" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column v-if="stoInboundMode === 'multiple'" label="目标库位" width="220">
                <template #default="scope">
                  <TableHistoryInput v-if="isPoDetailParentRow(scope.row)" v-model="scope.row.locationCode" :config="locationCodeConfig" placeholder="请输入目标库位编码" @keydown.tab.prevent="locationCodeKeyDownTab(scope.row.locationCode)" @keydown.enter.prevent="locationCodeKeyDownTab(scope.row.locationCode)">
                    <template #append>
                      <el-button icon="Search" @click="showStorageLocationDialog(stoInboundList.findIndex((item) => item.inboundRowKey === scope.row.inboundRowKey))"></el-button>
                    </template>
                  </TableHistoryInput>
                </template>
              </el-table-column>
              <el-table-column label="收货/扣料数量" align="right" width="210">
                <template #default="scope">
                  <template v-if="isPoDetailParentRow(scope.row)">
                    <div class="qty-convert-cell">
                      <el-input-number v-model="scope.row.receivePoQuantity" :min="0" :max="parseFloat(scope.row.openQuantity || 0)" :precision="3" size="small" controls-position="right" @change="handleReceivePoQuantityChange(scope.row)" />
                      <span class="qty-convert-unit">{{ scope.row.orderUnit || '' }}</span>
                    </div>
                  </template>
                  <template v-else>
                    <div class="qty-convert-cell">
                      <el-input-number v-model="scope.row.consumeQuantity" :min="0" :precision="3" size="small" controls-position="right" @change="handleBomConsumeQuantityChange(scope.row)" />
                      <span class="qty-convert-unit">{{ scope.row.orderUnit || '' }}</span>
                    </div>
                  </template>
                </template>
              </el-table-column>
              <el-table-column label="库存数量" min-width="140" align="right">
                <template #default="scope">
                  <div class="qty-display-cell">
                    <span class="qty-display-value">{{ formatQty(scope.row.inventoryQuantity) || '-' }}</span>
                    <span class="qty-display-unit">{{ scope.row.inventoryUnit || '' }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center">
                <template #default="scope">
                  <el-button v-if="isPoDetailParentRow(scope.row)" type="danger" link icon="Delete" @click="removeFromStoInboundList(stoInboundList.findIndex((item) => item.inboundRowKey === scope.row.inboundRowKey))"></el-button>
                </template>
              </el-table-column>
            </template>
          </PurchaseOrderDetailTreeTable>

          <div style="margin-top: 20px; text-align: center">
            <el-button :loading="stoButtonLoading" type="primary" @click="submitStoForm" :disabled="stoInboundList.length === 0">STO收货</el-button>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>

  <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
  <InventorySelectionDialog v-model="bomInventoryDialog.visible" :material-code="bomInventoryDialog.materialCode" :material-desc="bomInventoryDialog.materialDesc" :issue-qty="bomInventoryDialog.issueQty" :unit="bomInventoryDialog.unit" :general-only="false" special-inventory-flag="O" :business-code="bomInventoryDialog.supplierCode" @confirm="applyBomInventorySelection" />
</template>

<script setup name="StoReceive" lang="ts">
import { addPurchaseInbound } from '@/api/wms/purchaseOrderDetail';
import { listDeliveryOrderDetail } from '@/api/wms/deliveryOrderDetail';
import { DeliveryOrderDetailVO } from '@/api/wms/deliveryOrderDetail/types';
import type { PurchaseOrderBomVO } from '@/api/wms/purchaseOrderDetail/types';
import HistoryInput from '@/components/HistoryInput/index.vue';
import TableHistoryInput from '@/components/TableHistoryInput/index.vue';
import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import InventorySelectionDialog from '@/views/wms/inventoryDetail/components/InventorySelectionDialog.vue';
import PurchaseOrderDetailTreeTable from '@/views/wms/purchaseOrderDetail/components/PurchaseOrderDetailTreeTable.vue';
import { findOperationParentRow, inheritPoItemNumberOnBom, isOutsourcingCategory, isPoDetailParentRow } from '@/views/wms/purchaseOrderDetail/utils/purchaseOrderDetailTree';
import { ArrowRight, Bell, Switch } from '@element-plus/icons-vue';
import { HttpStatus } from '@/enums/RespEnum';
import { listStorageLocation } from '@/api/wms/storageLocation';
import { HistoryConfig } from '@/types/history';
import { formatQty } from '@/utils/ruoyi';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_purchase_category } = toRefs<any>(proxy?.useDict('wms_purchase_category'));

const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();
const stoOrderDetailList = ref<DeliveryOrderDetailVO[]>([]);
const stoLoading = ref(false);
const showStoSearch = ref(true);
const historyExpanded = ref(true);
const transferExpanded = ref(true);
const stoTotal = ref(0);
const stoSelectedItems = ref<DeliveryOrderDetailVO[]>([]);
const stoInboundList = ref<any[]>([]);
const stoInboundMode = ref<'fixed' | 'multiple'>('fixed');
const stoResultMessage = ref('');
const stoResultStatus = ref(false);
const stoButtonLoading = ref(false);
const stoTableLoading = ref(false);
const currenIndex = ref(0);
let inboundRowKeySeq = 0;
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
const stoFixedInboundForm = ref({
  locationCode: '',
  lfsnr: '',
  bktxt: '',
  postingDate: null
});
const stoQueryFormRef = ref<ElFormInstance>();
const stoTableRef = ref<ElTableInstance>();
const stoQueryParams = ref({
  pageNum: 1,
  pageSize: 1000,
  deliveryOrderNo: undefined as string | undefined,
  deliveryItemNo: undefined as string | undefined,
  poNumber: undefined,
  itemNumber: undefined,
  materialCode: undefined,
  enableSapSync: true,
  receiveType: 2,
  showOpenQuantityZero: false
});
const stoRules = {
  deliveryOrderNo: [{ required: true, message: '交货单号不能为空', trigger: [] }]
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
const deliveryOrderNoConfig: HistoryConfig = {
  key: 'deliveryOrderNo',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseInbound',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};
const deliveryItemNoConfig: HistoryConfig = {
  key: 'deliveryItemNo',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseInbound',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};

const stoColumns = ref([
  { key: 0, label: `交货单号`, visible: true, children: [] },
  { key: 1, label: `交货单项次`, visible: true, children: [] },
  { key: 2, label: `采购单号`, visible: true, children: [] },
  { key: 3, label: `采购单项次`, visible: true, children: [] },
  { key: 4, label: `交货日期`, visible: false, children: [] },
  { key: 5, label: `料号`, visible: true, children: [] },
  { key: 6, label: `旧料号`, visible: false, children: [] },
  { key: 7, label: `物料描述`, visible: true, children: [] },
  { key: 8, label: `订单数量`, visible: true, children: [] },
  { key: 9, label: `已收数量`, visible: true, children: [] },
  { key: 10, label: `未清数量`, visible: true, children: [] },
  { key: 11, label: `订单单位`, visible: false, children: [] },
  { key: 12, label: `需质检`, visible: false, children: [] },
  { key: 13, label: `库存单位`, visible: false, children: [] },
  { key: 14, label: `换算比例`, visible: false, children: [] },
  { key: 15, label: `供应商代码`, visible: true, children: [] },
  { key: 16, label: `供应商名称`, visible: true, children: [] },
  { key: 17, label: `采购类别`, visible: true, children: [] },
  { key: 18, label: `批次号`, visible: false, children: [] }
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

const locationCodeKeyDownTab = async (locationCode: any) => {
  if (locationCode) {
    const res = await listStorageLocation({
      pageNum: 1,
      pageSize: 10,
      locationCode: locationCode
    });
    stoResultMessage.value = '';
    if ((res.rows || []).length == 0) {
      stoResultMessage.value = `库位${locationCode}不存在`;
      stoResultStatus.value = false;
    }
  }
};

const calculateInventoryQuantity = (row) => {
  row.inventoryQuantity = ((row.receivePoQuantity || 0) * (row.conversionRatio || 1)).toFixed(3);
};

const toNumber = (value: unknown) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const roundQty = (value: number) => Number(value.toFixed(3));
const createInboundRowKey = () => `sto-inbound-${Date.now()}-${++inboundRowKeySeq}`;
/** STO 主行：托外加工 101，其余默认 109 */
const resolveStoParentMoveType = (poCategory: string | number | undefined | null) => (isOutsourcingCategory(poCategory) ? '101' : '109');
const getBomConversionRatio = (bom: PurchaseOrderBomVO) => {
  const ratio = toNumber(bom.conversionRatio || 1);
  return ratio > 0 ? ratio : 1;
};
const getPoItemKey = (row: any) => `${row.poNumber || row.purchaseOrderNo || ''}|${row.itemNumber || row.purchaseItemNo || ''}`;
const getScheduleKey = (bom: PurchaseOrderBomVO) => String(bom.scheduleNumber || '');
const getBomOriginKey = (bom: PurchaseOrderBomVO, index = 0) => bom.originBomKey || `${getScheduleKey(bom)}_${bom.componentMaterial || ''}_${bom.id ?? index}`;

interface BomScheduleGroup {
  scheduleNumber: string;
  capacity: number;
  boms: PurchaseOrderBomVO[];
}

const buildScheduleGroups = (row: any): BomScheduleGroup[] => {
  return (row.stoScheduleSourceList || [])
    .map((schedule: any) => ({
      scheduleNumber: String(schedule.scheduleNumber || ''),
      capacity: Math.max(0, toNumber(schedule.openQuantity ?? schedule.orderQuantity)),
      boms: schedule.purchaseOrderBomScheduleVoList || []
    }))
    .sort((a, b) => a.scheduleNumber.localeCompare(b.scheduleNumber, undefined, { numeric: true }));
};

const preserveBomInventorySelection = (candidate: PurchaseOrderBomVO, oldRows: PurchaseOrderBomVO[]) => {
  if (!oldRows.length || oldRows.some((row) => !row.batchCode)) return [candidate];
  const oldInventoryQuantity = roundQty(oldRows.reduce((sum, row) => sum + toNumber(row.inventoryQuantity), 0));
  if (Math.abs(oldInventoryQuantity - toNumber(candidate.inventoryQuantity)) > 0.001) return [candidate];
  return oldRows.map((row) => ({ ...row, consumeQuantity: row.consumeQuantity, inventoryQuantity: row.inventoryQuantity }));
};

/**
 * 同一采购单项次下按计划行号顺序分配收货数量。
 * 每个 STO 父行只挂载本次实际命中的计划行 BOM，未命中的 BOM 不展示也不提交。
 */
const syncAllStoBomAllocations = () => {
  const remainingByPoItem = new Map<string, Map<string, number>>();

  stoInboundList.value.forEach((row) => {
    if (!isOutsourcingCategory(row.poCategory)) {
      row.purchaseOrderBomScheduleVoList = [];
      row.stoBomAllocationShortage = 0;
      return;
    }

    const scheduleGroups = buildScheduleGroups(row);
    const poItemKey = getPoItemKey(row);
    if (!remainingByPoItem.has(poItemKey)) {
      remainingByPoItem.set(poItemKey, new Map(scheduleGroups.map((group) => [group.scheduleNumber, group.capacity])));
    }
    const scheduleRemaining = remainingByPoItem.get(poItemKey)!;
    const oldRowsByOrigin = new Map<string, PurchaseOrderBomVO[]>();
    (row.purchaseOrderBomScheduleVoList || []).forEach((bom: PurchaseOrderBomVO, index: number) => {
      const originKey = getBomOriginKey(bom, index);
      if (!oldRowsByOrigin.has(originKey)) oldRowsByOrigin.set(originKey, []);
      oldRowsByOrigin.get(originKey)!.push(bom);
    });

    let receiptRemaining = Math.max(0, toNumber(row.receivePoQuantity));
    const selectedBoms: PurchaseOrderBomVO[] = [];
    scheduleGroups.forEach((group) => {
      if (receiptRemaining <= 0) return;
      const available = Math.max(0, scheduleRemaining.get(group.scheduleNumber) ?? group.capacity);
      const allocatedReceipt = roundQty(Math.min(receiptRemaining, available));
      if (allocatedReceipt <= 0 || group.capacity <= 0) return;

      group.boms.forEach((sourceBom, bomIndex) => {
        const sourceInventoryQuantity = toNumber(sourceBom.openQuantity ?? sourceBom.componentQty);
        // 分段公式：本计划行 BOM 未发数量 × 本计划行分配到的收货数量 ÷ 本计划行未清数量。
        // 例：计划行 001 为 100 / BOM 400，收货 50 时扣 50 / 100 × 400 = 200。
        const inventoryQuantity = roundQty((sourceInventoryQuantity * allocatedReceipt) / group.capacity);
        if (inventoryQuantity <= 0) return;
        const conversionRatio = getBomConversionRatio(sourceBom);
        const originBomKey = getBomOriginKey(sourceBom, bomIndex);
        const candidate = inheritPoItemNumberOnBom(
          {
            ...sourceBom,
            moveType: '543',
            conversionRatio,
            originBomKey,
            consumeQuantity: roundQty(inventoryQuantity / conversionRatio),
            inventoryQuantity: inventoryQuantity.toFixed(3)
          },
          row
        );
        selectedBoms.push(...preserveBomInventorySelection(candidate, oldRowsByOrigin.get(originBomKey) || []));
      });

      receiptRemaining = roundQty(receiptRemaining - allocatedReceipt);
      scheduleRemaining.set(group.scheduleNumber, roundQty(available - allocatedReceipt));
    });

    row.purchaseOrderBomScheduleVoList = selectedBoms;
    row.stoBomAllocationShortage = receiptRemaining;
  });
};

const handleReceivePoQuantityChange = (row) => {
  if (row.receivePoQuantity === null || row.receivePoQuantity === undefined || row.receivePoQuantity === '') {
    row.inventoryQuantity = 0;
  } else {
    calculateInventoryQuantity(row);
  }
  syncAllStoBomAllocations();
};

const calculateBomInventoryQuantity = (bom: PurchaseOrderBomVO) => {
  bom.inventoryQuantity = (toNumber(bom.consumeQuantity) * getBomConversionRatio(bom)).toFixed(3);
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

const handleBomConsumeQuantityChange = (bom: PurchaseOrderBomVO) => {
  bom.consumeQuantity = toNumber(bom.consumeQuantity);
  calculateBomInventoryQuantity(bom);
  if (bom.inventoryDetailId || bom.batchCode) clearBomInventorySelection(bom);
};

const openBomInventoryDialog = (parentRow: any, bomRow: PurchaseOrderBomVO) => {
  if (!parentRow || !bomRow) return;
  const inboundIndex = stoInboundList.value.findIndex((item) => item.inboundRowKey === parentRow.inboundRowKey);
  const bomIndex = parentRow.purchaseOrderBomScheduleVoList?.indexOf(bomRow) ?? -1;
  if (inboundIndex < 0 || bomIndex < 0) return;
  if (!String(bomRow.componentMaterial || '').trim()) {
    proxy?.$modal.msgWarning('请先确认组件料号');
    return;
  }
  if (!String(parentRow.supplierCode || '').trim()) {
    proxy?.$modal.msgWarning('缺少供应商代码，无法选择转包库存');
    return;
  }
  Object.assign(bomInventoryDialog, {
    visible: true,
    inboundIndex,
    bomIndex,
    materialCode: bomRow.componentMaterial || '',
    materialDesc: bomRow.componentDesc || '',
    issueQty: toNumber(bomRow.inventoryQuantity) || toNumber(bomRow.openQuantity),
    unit: bomRow.inventoryUnit || '',
    supplierCode: parentRow.supplierCode || ''
  });
};

const applyBomInventorySelection = ({ locations }: { locations: any[] }) => {
  const parent = stoInboundList.value[bomInventoryDialog.inboundIndex];
  const source = parent?.purchaseOrderBomScheduleVoList?.[bomInventoryDialog.bomIndex];
  if (!parent || !source || !locations?.length) return;

  const conversionRatio = getBomConversionRatio(source);
  let remainingDemand = roundQty(toNumber(source.inventoryQuantity) || toNumber(source.openQuantity));
  const originBomKey = getBomOriginKey(source, bomInventoryDialog.bomIndex);
  const splitRows = locations
    .map((location, index) => {
      const inventoryQuantity = roundQty(Math.max(0, Math.min(toNumber(location.pickQty), toNumber(location.availableQuantity), remainingDemand)));
      remainingDemand = roundQty(Math.max(0, remainingDemand - inventoryQuantity));
      const batchCode = location.batchCode || '';
      return inheritPoItemNumberOnBom(
        {
          ...source,
          originBomKey,
          inventoryDetailId: location.id,
          warehouseCode: location.warehouseCode,
          areaCode: location.areaCode,
          locationCode: location.locationCode,
          batchCode,
          specialInventoryFlag: location.specialInventoryFlag || 'O',
          businessCode: location.businessCode || parent.supplierCode || '',
          consumeQuantity: roundQty(inventoryQuantity / conversionRatio),
          inventoryQuantity: inventoryQuantity.toFixed(3),
          inventorySplitKey: `${originBomKey}_${batchCode || 'batch'}_${location.rowKey || location.id || index}`
        },
        parent
      );
    })
    .filter((bom) => toNumber(bom.inventoryQuantity) > 0);
  if (!splitRows.length || remainingDemand > 0.001) {
    proxy?.$modal.msgWarning(remainingDemand > 0.001 ? `所选批次还差 ${remainingDemand}` : '扣料数量必须大于0');
    return;
  }
  parent.purchaseOrderBomScheduleVoList.splice(bomInventoryDialog.bomIndex, 1, ...splitRows);
  Object.assign(bomInventoryDialog, { visible: false, inboundIndex: -1, bomIndex: -1, issueQty: 0 });
};

const getStoList = async (needValidate = false) => {
  const deliveryOrderNo = String(stoQueryParams.value.deliveryOrderNo ?? '').trim();
  if (!deliveryOrderNo) {
    if (needValidate) {
      await stoQueryFormRef.value?.validate().catch(() => false);
    }
    return;
  }
  if (needValidate) {
    const valid = await stoQueryFormRef.value?.validate().catch(() => false);
    if (!valid) {
      return;
    }
  }
  stoLoading.value = true;
  try {
    const res = await listDeliveryOrderDetail(stoQueryParams.value);
    stoOrderDetailList.value = (res.rows || []).map((row) => {
      const poCategory = String(row.poCategory ?? '').trim();
      return {
        ...row,
        poCategory,
        poNumber: row.purchaseOrderNo,
        itemNumber: row.purchaseItemNo,
        moveType: resolveStoParentMoveType(poCategory)
      };
    }) as DeliveryOrderDetailVO[];
    stoTotal.value = res.total;
  } finally {
    stoLoading.value = false;
  }
};

const handleStoQuery = () => {
  stoQueryParams.value.pageNum = 1;
  getStoList(true);
};

const handleShowReceivedChange = () => {
  if (!stoQueryParams.value.deliveryOrderNo) {
    return;
  }
  handleStoQuery();
};

const resetStoQuery = () => {
  stoQueryFormRef.value?.resetFields();
  stoQueryFormRef.value?.clearValidate();
  stoTableRef.value?.clearSelection();
  stoOrderDetailList.value = [];
  stoTotal.value = 0;
};

const handleStoSelectionChange = (selection: DeliveryOrderDetailVO[]) => {
  stoSelectedItems.value = selection;
};

const addSelectedToStoInboundList = () => {
  if (stoSelectedItems.value.length === 0) {
    proxy?.$modal.msgWarning('请先选择要添加的STO订单明细');
    return;
  }
  const newItems = stoSelectedItems.value.map((item) => {
    const sourceSchedules = isOutsourcingCategory(item.poCategory)
      ? (item.purchaseOrderScheduleVoList || []).map((schedule) => ({
          ...schedule,
          purchaseOrderBomScheduleVoList: (schedule.purchaseOrderBomScheduleVoList || []).map((bom, index) => ({
            ...bom,
            moveType: '543',
            originBomKey: getBomOriginKey(bom, index),
            conversionRatio: getBomConversionRatio(bom)
          }))
        }))
      : [];
    return {
      ...item,
      inboundRowKey: createInboundRowKey(),
      moveType: resolveStoParentMoveType(item.poCategory),
      poNumber: item.purchaseOrderNo,
      itemNumber: item.purchaseItemNo,
      stoScheduleSourceList: sourceSchedules,
      purchaseOrderBomScheduleVoList: [],
      receivePoQuantity: item.openQuantity,
      receiveQuantity: item.openQuantity,
      receiveUnit: item.orderUnit,
      conversionRatio: item.conversionRatio || 1,
      inventoryQuantity: (Number(item.openQuantity || 0) * (item.conversionRatio || 1)).toFixed(3)
    };
  });
  stoInboundList.value.push(...newItems);
  syncAllStoBomAllocations();
  proxy?.$modal.msgSuccess(`成功添加${newItems.length}条记录到STO入库列表`);
  stoTableRef.value?.clearSelection();
};

const removeFromStoInboundList = (index: number) => {
  stoInboundList.value.splice(index, 1);
  syncAllStoBomAllocations();
};

const clearStoInboundList = () => {
  stoInboundList.value = [];
  stoFixedInboundForm.value.locationCode = '';
  stoFixedInboundForm.value.lfsnr = '';
  stoFixedInboundForm.value.bktxt = '';
  stoFixedInboundForm.value.postingDate = null;
};

const showStorageLocationDialog = (index: number) => {
  storageLocationDialogRef.value?.openDialog();
  storageLocationDialogRef.value?.handleQuery();
  currenIndex.value = index;
};

const storageLocationSelectCallBack = (record: any) => {
  stoResultMessage.value = '';
  if (stoInboundMode.value === 'fixed') {
    stoFixedInboundForm.value.locationCode = record.locationCode;
  } else if (stoInboundMode.value === 'multiple') {
    if (currenIndex.value >= 0 && currenIndex.value < stoInboundList.value.length) {
      stoInboundList.value[currenIndex.value].locationCode = record.locationCode;
    }
  }
};

const buildMissingBatchBomMessage = (items: any[]) => {
  const details: string[] = [];
  items.forEach((item) => {
    const rowNo = stoInboundList.value.indexOf(item) + 1;
    (item.purchaseOrderBomScheduleVoList || []).forEach((bom: PurchaseOrderBomVO) => {
      if (toNumber(bom.inventoryQuantity) > 0 && !String(bom.batchCode || '').trim()) {
        details.push(`序号${rowNo} 计划行${bom.scheduleNumber || '-'} 组件${bom.componentMaterial || '-'}`);
      }
    });
  });
  return details.length ? `请先为以下543扣料明细选择批次：\n${details.join('\n')}` : '';
};

const submitStoForm = async () => {
  const validStoInboundList = stoInboundList.value.filter((item) => item.receivePoQuantity > 0);
  stoResultStatus.value = true;
  stoResultMessage.value = '';
  if (validStoInboundList.length === 0) {
    stoResultMessage.value = '收货数量不能都为0';
    stoResultStatus.value = false;
    return;
  }

  const allocationShortageItems = validStoInboundList.filter((item) => toNumber(item.stoBomAllocationShortage) > 0.001);
  if (allocationShortageItems.length) {
    stoResultMessage.value = `收货数量超过可用采购计划行未清数量，请检查序号：${allocationShortageItems.map((item) => stoInboundList.value.indexOf(item) + 1).join('、')}`;
    stoResultStatus.value = false;
    return;
  }

  const poCategories = [...new Set(validStoInboundList.map((item) => String(item.poCategory || '')))];
  if (poCategories.includes('3') && poCategories.some((category) => category !== '3')) {
    stoResultMessage.value = '托外加工收货不允许和其他采购类型一起提交';
    stoResultStatus.value = false;
    return;
  }

  if (stoInboundMode.value === 'fixed') {
    if (!stoFixedInboundForm.value.locationCode) {
      stoResultMessage.value = '请输入目标库位编码';
      stoResultStatus.value = false;
      return;
    }
    validStoInboundList.forEach((item) => {
      item.locationCode = stoFixedInboundForm.value.locationCode || '';
      item.lfsnr = stoFixedInboundForm.value.lfsnr || '';
      item.bktxt = stoFixedInboundForm.value.bktxt || '';
      item.postingDate = formatPostingDate(stoFixedInboundForm.value.postingDate) || '';
    });
  } else {
    const invalidItems = validStoInboundList.filter((item) => !item.locationCode);
    if (invalidItems.length > 0) {
      stoResultMessage.value = '请填写所有入库记录的目标库位';
      stoResultStatus.value = false;
      return;
    }
    validStoInboundList.forEach((item) => {
      item.lfsnr = stoFixedInboundForm.value.lfsnr || '';
      item.bktxt = stoFixedInboundForm.value.bktxt || '';
      item.postingDate = formatPostingDate(stoFixedInboundForm.value.postingDate) || '';
    });
  }

  const overQuantityItems = validStoInboundList.filter((item) => item.receivePoQuantity > item.openQuantity);
  if (overQuantityItems.length > 0) {
    stoResultMessage.value = '收货数量不能超过未清数量';
    stoResultStatus.value = false;
    return;
  }

  if (poCategories.includes('3')) {
    const missingBatchMessage = buildMissingBatchBomMessage(validStoInboundList);
    if (missingBatchMessage) {
      stoResultMessage.value = missingBatchMessage;
      stoResultStatus.value = false;
      return;
    }
  }

  stoButtonLoading.value = true;
  try {
    const stoInboundRequests = validStoInboundList.map((item) => {
      const { children, isPoDetailHead, rowKey, stoScheduleSourceList, stoBomAllocationShortage, purchaseOrderScheduleVoList, purchaseOrderBomScheduleVoList, ...itemRest } = item;
      return {
        ...itemRest,
        purchaseOrderBomScheduleBoList: (purchaseOrderBomScheduleVoList || []).map((bom: PurchaseOrderBomVO) => {
          const { children: bomChildren, isPoDetailHead: bomHead, rowKey: bomRowKey, parentInboundRowKey, ...bomRest } = bom as Record<string, any>;
          return inheritPoItemNumberOnBom({ ...bomRest } as PurchaseOrderBomVO, item);
        }),
        receivePoQuantity: item.receivePoQuantity,
        receivePoUnit: item.orderUnit,
        receiveQuantity: item.inventoryQuantity,
        receiveUnit: item.inventoryUnit
      };
    });
    const res: any = await addPurchaseInbound({
      receiveType: '2',
      bktxt: stoFixedInboundForm.value.bktxt || '',
      postingDate: formatPostingDate(stoFixedInboundForm.value.postingDate) || '',
      purchaseOrderInboundBoList: stoInboundRequests
    });
    if (res.code !== HttpStatus.SUCCESS) {
      stoResultMessage.value = res.msg;
      stoResultStatus.value = false;
      return;
    }
    stoResultMessage.value = `STO入库成功，物料凭证号${res.msg}`;
    stoResultStatus.value = true;
    stoInboundList.value = [];
    stoFixedInboundForm.value.locationCode = '';
    stoFixedInboundForm.value.lfsnr = '';
    stoFixedInboundForm.value.bktxt = '';
    stoFixedInboundForm.value.postingDate = null;
    if (stoQueryParams.value.deliveryOrderNo) {
      getStoList(false);
    }
  } catch (error) {
    stoResultMessage.value = error.message || '入库失败';
    stoResultStatus.value = false;
  } finally {
    stoButtonLoading.value = false;
  }
};
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
.rotate-button {
  transform: rotate(90deg);
  margin: 0 auto;
}
.inventory-source-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}
.qty-convert-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
}
.qty-convert-cell :deep(.el-input-number) {
  width: 132px;
  flex: 0 0 132px;
}
.qty-convert-cell :deep(.el-input__inner) {
  font-variant-numeric: tabular-nums;
}
.qty-convert-unit {
  width: 32px;
  flex: 0 0 32px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  text-align: left;
}
.qty-display-cell {
  display: inline-grid;
  grid-template-columns: minmax(0, 74px) 32px;
  align-items: baseline;
  column-gap: 6px;
  width: 112px;
  max-width: 100%;
}
.qty-display-value {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.qty-display-unit {
  text-align: left;
  white-space: nowrap;
  color: var(--el-text-color-regular);
}
.batch-code-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
