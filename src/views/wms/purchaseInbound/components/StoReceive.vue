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
              <el-table-column v-if="stoColumns[4].visible" label="交货日期" align="center" prop="deliveryDate" />
              <el-table-column v-if="stoColumns[5].visible" label="料号" align="left" prop="materialCode" />
              <el-table-column v-if="stoColumns[6].visible" label="旧料号" align="left" prop="oldMaterialCode" />
              <el-table-column v-if="stoColumns[7].visible" label="物料描述" align="left" prop="materialDesc" show-overflow-tooltip />
              <el-table-column v-if="stoColumns[17].visible" label="批次号" align="center" prop="batchCode" />
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

          <el-table :data="stoInboundList" border style="width: 100%" v-loading="stoTableLoading" max-height="400">
            <el-table-column type="index" width="50" align="center" />
            <el-table-column label="交货单号" prop="deliveryOrderNo" />
            <el-table-column label="交货项次" prop="deliveryItemNo" />
            <el-table-column label="采购订单号" prop="poNumber" />
            <el-table-column label="采购项次" prop="itemNumber" />
            <el-table-column label="料号" prop="materialCode" min-width="100" />
            <el-table-column label="物料描述" prop="materialDesc" show-overflow-tooltip />
            <el-table-column label="未清数量" prop="openQuantity" align="center">
              <template #default="scope">
                {{ formatQtyWithUnit(scope.row.openQuantity, scope.row.orderUnit) }}
              </template>
            </el-table-column>
            <el-table-column label="目标库位" width="220" v-if="stoInboundMode === 'multiple'">
              <template #default="scope">
                <TableHistoryInput v-model="scope.row.locationCode" :config="locationCodeConfig" placeholder="请输入目标库位编码" @keydown.tab.prevent="locationCodeKeyDownTab(scope.row.locationCode)" @keydown.enter.prevent="locationCodeKeyDownTab(scope.row.locationCode)">
                  <template #append>
                    <el-button icon="Search" @click="showStorageLocationDialog(scope.$index)"></el-button>
                  </template>
                </TableHistoryInput>
              </template>
            </el-table-column>
            <el-table-column label="收货数量" align="center" width="200">
              <template #default="scope">
                <el-input-number v-model="scope.row.receivePoQuantity" :min="0" :max="parseFloat(scope.row.openQuantity || 0)" :precision="3" size="small" controls-position="right" @change="handleReceivePoQuantityChange(scope.row)" />
                <span class="issue-qty-unit">{{ scope.row.orderUnit || '' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="库存数量" min-width="100" align="center">
              <template #default="scope">
                {{ formatQtyWithUnit(scope.row.inventoryQuantity, scope.row.inventoryUnit) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="scope">
                <el-button type="danger" link icon="Delete" @click="removeFromStoInboundList(scope.$index)"></el-button>
              </template>
            </el-table-column>
          </el-table>

          <div style="margin-top: 20px; text-align: center">
            <el-button :loading="stoButtonLoading" type="primary" @click="submitStoForm" :disabled="stoInboundList.length === 0">STO收货</el-button>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>

  <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
</template>

<script setup name="StoReceive" lang="ts">
import { addPurchaseInbound } from '@/api/wms/purchaseOrderDetail';
import { listDeliveryOrderDetail } from '@/api/wms/deliveryOrderDetail';
import { DeliveryOrderDetailVO } from '@/api/wms/deliveryOrderDetail/types';
import HistoryInput from '@/components/HistoryInput/index.vue';
import TableHistoryInput from '@/components/TableHistoryInput/index.vue';
import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import { ArrowRight, Bell, Switch } from '@element-plus/icons-vue';
import { HttpStatus } from '@/enums/RespEnum';
import { listStorageLocation } from '@/api/wms/storageLocation';
import { HistoryConfig } from '@/types/history';
import { formatQtyWithUnit } from '@/utils/ruoyi';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

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
  { key: 17, label: `批次号`, visible: false, children: [] }
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

const handleReceivePoQuantityChange = (row) => {
  if (row.receivePoQuantity === null || row.receivePoQuantity === undefined || row.receivePoQuantity === '') {
    row.inventoryQuantity = 0;
  } else {
    calculateInventoryQuantity(row);
  }
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
    stoOrderDetailList.value = res.rows;
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
  const newItems = stoSelectedItems.value.map((item) => ({
    ...item,
    poNumber: item.purchaseOrderNo,
    itemNumber: item.purchaseItemNo,
    receivePoQuantity: item.openQuantity,
    receiveQuantity: item.openQuantity,
    receiveUnit: item.orderUnit,
    conversionRatio: item.conversionRatio || 1,
    inventoryQuantity: (Number(item.openQuantity || 0) * (item.conversionRatio || 1)).toFixed(3)
  }));
  stoInboundList.value.push(...newItems);
  proxy?.$modal.msgSuccess(`成功添加${newItems.length}条记录到STO入库列表`);
  stoTableRef.value?.clearSelection();
};

const removeFromStoInboundList = (index: number) => {
  stoInboundList.value.splice(index, 1);
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

const submitStoForm = async () => {
  const validStoInboundList = stoInboundList.value.filter((item) => item.receivePoQuantity > 0);
  stoResultStatus.value = true;
  stoResultMessage.value = '';
  if (validStoInboundList.length === 0) {
    stoResultMessage.value = '收货数量不能都为0';
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

  stoButtonLoading.value = true;
  try {
    const stoInboundRequests = validStoInboundList.map((item) => ({
      ...item,
      receivePoQuantity: item.receivePoQuantity,
      receivePoUnit: item.orderUnit,
      receiveQuantity: item.inventoryQuantity,
      receiveUnit: item.inventoryUnit
    }));
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
.issue-qty-unit {
  color: var(--el-text-color-regular);
  white-space: nowrap;
  margin-left: 2px;
}
</style>
