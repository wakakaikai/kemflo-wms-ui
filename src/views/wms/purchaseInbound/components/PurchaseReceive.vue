<template>
  <el-row :gutter="20">
    <el-col :span="24">
      <el-card shadow="never" class="search-card">
        <template #header>
          <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
              <span>采购订单明细</span>
            </el-col>
            <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
          </el-row>
        </template>

        <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
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
          <el-table ref="purchaseTableRef" :data="purchaseOrderDetailList" height="300" border v-loading="loading" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column v-if="columns[0].visible" label="采购单" align="left" prop="poNumber" fixed="left" min-width="120" />
            <el-table-column v-if="columns[1].visible" label="项次" align="left" prop="itemNumber" fixed="left" min-width="65" />
            <el-table-column v-if="columns[17].visible" label="采购类别" align="center" prop="poCategory" min-width="100">
              <template #default="scope">
                <dict-tag :options="wms_purchase_category" :value="scope.row.poCategory" />
              </template>
            </el-table-column>
            <el-table-column label="交货状态" align="center" width="100" fixed="left">
              <template #default="scope">
                <el-tooltip :content="getEarlyDeliveryTooltip(scope.row)" placement="top">
                  <el-tag :type="getEarlyDeliveryTagType(scope.row)">
                    {{ getEarlyDeliveryText(scope.row) }}
                  </el-tag>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column v-if="columns[2].visible" label="排程" align="left" prop="scheduleNumber" min-width="60" />
            <el-table-column v-if="columns[3].visible" label="交货日期" align="center" prop="deliveryDate" min-width="100" />
            <el-table-column v-if="columns[4].visible" label="料号" align="left" prop="materialCode" min-width="135" />
            <el-table-column v-if="columns[5].visible" label="旧料号" align="left" prop="oldMaterialCode" />
            <el-table-column v-if="columns[6].visible" label="物料描述" align="left" prop="materialDesc" show-overflow-tooltip />
            <el-table-column v-if="columns[7].visible" label="订单数量" align="left" prop="orderQuantity" min-width="100" />
            <el-table-column v-if="columns[8].visible" label="已收数量" align="left" prop="receivedQuantity" min-width="100" />
            <el-table-column v-if="columns[9].visible" label="未清数量" align="left" prop="openQuantity" min-width="100" />
            <el-table-column v-if="columns[10].visible" label="订单单位" align="center" prop="orderUnit" />
            <el-table-column v-if="columns[11].visible" label="需质检" align="center" prop="inspectionFlag" />
            <el-table-column v-if="columns[13].visible" label="库存单位" align="center" prop="inventoryUnit" />
            <el-table-column v-if="columns[14].visible" label="换算比例" align="center" prop="conversionRatio" />
            <el-table-column v-if="columns[15].visible" label="供应商代码" align="center" prop="supplierCode" min-width="120" />
            <el-table-column v-if="columns[16].visible" label="供应商名称" align="center" prop="supplierName" show-overflow-tooltip min-width="100" />
          </el-table>
          <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
        </div>
      </el-card>
    </el-col>

    <div style="margin: 20px 0; text-align: center; width: 100%">
      <el-button type="primary" @click="addSelectedToInboundList" circle class="rotate-button">
        <el-icon><Switch /></el-icon>
      </el-button>
    </div>

    <el-col :span="24">
      <el-card shadow="never">
        <template #header>
          <div class="transfer-header">
            <span class="header-title">入库列表</span>
            <div class="header-actions">
              <el-radio-group v-model="inboundMode">
                <el-radio-button label="fixed">固定库位</el-radio-button>
                <el-radio-button label="multiple">多库位</el-radio-button>
              </el-radio-group>
              <el-button type="danger" @click="clearInboundList" :disabled="inboundList.length === 0">清空列表</el-button>
            </div>
          </div>
        </template>

        <el-form :model="fixedInboundForm" ref="fixedInboundFormRef" label-width="auto" :inline="true">
          <el-row :gutter="20">
            <el-col :sm="24" :md="6" :lg="6" v-if="inboundMode === 'fixed'">
              <el-form-item label="目标库位" prop="locationCode" :rules="[{ required: true, message: '请输入目标库位编码', trigger: 'blur' }]">
                <HistoryInput
                  v-model="fixedInboundForm.locationCode"
                  :config="locationCodeConfig"
                  placeholder="请输入目标库位编码"
                  @keydown.tab.prevent="locationCodeKeyDownTab(fixedInboundForm.locationCode)"
                  @keydown.enter.prevent="locationCodeKeyDownTab(fixedInboundForm.locationCode)"
                >
                  <template #append>
                    <el-button icon="Search" @click="showStorageLocationDialog(-1)"></el-button>
                  </template>
                </HistoryInput>
              </el-form-item>
            </el-col>
            <el-col :sm="24" :md="6" :lg="6">
              <el-form-item label="收货人">
                <HistoryInput v-model="fixedInboundForm.targetUserName" :config="targetUserNameConfig" placeholder="请输入收货人">
                  <template #append>
                    <el-button icon="Search" @click="showUserCollectionsDialog(-1)"></el-button>
                  </template>
                </HistoryInput>
              </el-form-item>
            </el-col>
            <el-col :sm="24" :md="6" :lg="6">
              <el-form-item label="发票号" prop="invoiceNo">
                <HistoryInput v-model="fixedInboundForm.invoiceNo" :config="invoiceNoConfig" placeholder="请输入发票号"> </HistoryInput>
              </el-form-item>
            </el-col>
            <el-col :sm="24" :md="6" :lg="6">
              <el-form-item label="过账日期" prop="postingDate">
                <el-date-picker clearable v-model="fixedInboundForm.postingDate" type="date" :disabled-date="disabledFutureDate" value-format="YYYY-MM-DD" placeholder="请选择接收日期" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <div v-if="resultMessage" class="m-y-2">
          <el-alert show-icon center :title="resultMessage" :type="resultStatus ? 'success' : 'error'">
            <template #icon>
              <Bell />
            </template>
          </el-alert>
        </div>

        <el-table :data="inboundList" border style="width: 100%" v-loading="tableLoading" max-height="400">
          <el-table-column type="index" width="50" align="center" />
          <el-table-column label="采购单" prop="poNumber" />
          <el-table-column label="项次" prop="itemNumber" />
          <el-table-column label="采购类别" prop="poCategory" align="center">
            <template #default="scope">
              <dict-tag :options="wms_purchase_category" :value="scope.row.poCategory" />
            </template>
          </el-table-column>
          <el-table-column label="料号" prop="materialCode" />
          <el-table-column label="物料描述" prop="materialDesc" show-overflow-tooltip />
          <el-table-column label="订单数量" align="left" prop="orderQuantity" min-width="100" />
          <el-table-column label="未清数量" prop="openQuantity" />
          <el-table-column label="目标库位" width="220" v-if="inboundMode === 'multiple'">
            <template #default="scope">
              <TableHistoryInput
                v-model="scope.row.locationCode"
                :config="locationCodeConfig"
                placeholder="请输入目标库位编码"
                @keydown.tab.prevent="locationCodeKeyDownTab(scope.row.locationCode)"
                @keydown.enter.prevent="locationCodeKeyDownTab(scope.row.locationCode)"
              >
                <template #append>
                  <el-button icon="Search" @click="showStorageLocationDialog(scope.$index)"></el-button>
                </template>
              </TableHistoryInput>
            </template>
          </el-table-column>
          <el-table-column label="收货数量" align="center" width="150">
            <template #default="scope">
              <el-input-number
                v-model="scope.row.receivePoQuantity"
                :min="0"
                :max="parseFloat(scope.row.openQuantity || 0)"
                :precision="3"
                size="small"
                controls-position="right"
                @change="handleReceivePoQuantityChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="库存数量" prop="inventoryQuantity" />
          <el-table-column label="库存单位" prop="inventoryUnit" />
          <el-table-column label="操作" width="80" align="center">
            <template #default="scope">
              <el-button type="danger" link icon="Delete" @click="removeFromInboundList(scope.$index)"></el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="margin-top: 20px; text-align: center">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm" :disabled="inboundList.length === 0">采购收货</el-button>
        </div>
      </el-card>
    </el-col>
  </el-row>

  <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
  <UserCollectionsDialog ref="userCollectionsDialogRef" @user-collections-call-back="userCollectionsSelectCallBack" />
</template>

<script setup name="PurchaseReceive" lang="ts">
import { addPurchaseInbound, listPurchaseOrderDetail } from '@/api/wms/purchaseOrderDetail';
import { PurchaseOrderDetailVO, PurchaseOrderDetailQuery, PurchaseOrderDetailForm } from '@/api/wms/purchaseOrderDetail/types';
import HistoryInput from '@/components/HistoryInput/index.vue';
import TableHistoryInput from '@/components/TableHistoryInput/index.vue';
import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import UserCollectionsDialog from '@/views/wms/userCollections/components/userCollectionsDialog.vue';
import { Bell, Switch } from '@element-plus/icons-vue';
import { HttpStatus } from '@/enums/RespEnum';
import { listStorageLocation } from '@/api/wms/storageLocation';
import { HistoryConfig } from '@/types/history';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_purchase_category } = toRefs<any>(proxy?.useDict('wms_purchase_category'));

const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();
const userCollectionsDialogRef = ref<InstanceType<typeof UserCollectionsDialog>>();
const purchaseOrderDetailList = ref<PurchaseOrderDetailVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const currenIndex = ref(0);
const resultMessage = ref('');
const resultStatus = ref(false);
const buttonLoading = ref(false);
const tableLoading = ref(false);
const selectedSearchItems = ref<PurchaseOrderDetailVO[]>([]);
const inboundList = ref<any[]>([]);
const inboundMode = ref<'fixed' | 'multiple'>('fixed');
const fixedInboundForm = ref({
  locationCode: '',
  targetUserName: '',
  invoiceNo: '',
  postingDate: null
});
const queryFormRef = ref<ElFormInstance>();
const purchaseTableRef = ref<ElTableInstance>();

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
const targetUserNameConfig: HistoryConfig = {
  key: 'targetUserName',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseInbound',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};
const invoiceNoConfig: HistoryConfig = {
  key: 'invoiceNo',
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
  { key: 12, label: `库存数量`, visible: false, children: [] },
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

const handleReceivePoQuantityChange = (row) => {
  if (row.receivePoQuantity === null || row.receivePoQuantity === undefined || row.receivePoQuantity === '') {
    row.inventoryQuantity = 0;
  } else {
    calculateInventoryQuantity(row);
  }
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

const handleSelectionChange = (selection: PurchaseOrderDetailVO[]) => {
  selectedSearchItems.value = selection;
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

const addSelectedToInboundList = () => {
  if (selectedSearchItems.value.length === 0) {
    proxy?.$modal.msgWarning('请先选择要添加的采购订单明细');
    return;
  }
  const newItems = selectedSearchItems.value.map((item) => ({
    ...item,
    receivePoQuantity: item.openQuantity,
    storageLocation: '',
    conversionRatio: item.conversionRatio || 1,
    inventoryQuantity: (item.openQuantity * (item.conversionRatio || 1)).toFixed(3)
  }));
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
  fixedInboundForm.value.targetUserName = '';
  fixedInboundForm.value.invoiceNo = '';
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
    fixedInboundForm.value.targetUserName = record.nickName;
  } else if (inboundMode.value === 'multiple') {
    if (currenIndex.value >= 0 && currenIndex.value < inboundList.value.length) {
      inboundList.value[currenIndex.value].targetUserName = record.nickName;
    }
  }
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
      item.targetUserName = fixedInboundForm.value.targetUserName || '';
      item.invoiceNo = fixedInboundForm.value.invoiceNo || '';
      item.postingDate = fixedInboundForm.value.postingDate ? fixedInboundForm.value.postingDate + ' 00:00:00' : '';
    });
  } else {
    const invalidItems = validPurchaseInboundList.filter((item) => !item.locationCode);
    if (invalidItems.length > 0) {
      resultMessage.value = '请填写所有入库记录的目标库位';
      resultStatus.value = false;
      return;
    }
    validPurchaseInboundList.forEach((item) => {
      item.targetUserName = fixedInboundForm.value.targetUserName || '';
      item.invoiceNo = fixedInboundForm.value.invoiceNo || '';
      item.postingDate = fixedInboundForm.value.postingDate ? fixedInboundForm.value.postingDate + ' 00:00:00' : '';
    });
  }

  const overQuantityItems = validPurchaseInboundList.filter((item) => item.receivePoQuantity > item.openQuantity);
  if (overQuantityItems.length > 0) {
    resultMessage.value = '收货数量不能超过未清数量';
    resultStatus.value = false;
    return;
  }

  buttonLoading.value = true;
  try {
    const purchaseInboundRequests = validPurchaseInboundList.map((item) => ({
      ...item,
      receivePoQuantity: item.receivePoQuantity,
      receivePoUnit: item.orderUnit,
      receiveQuantity: item.inventoryQuantity,
      receiveUnit: item.inventoryUnit
    }));
    const res: any = await addPurchaseInbound({
      purchaseOrderInboundBoList: purchaseInboundRequests
    });
    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg;
      resultStatus.value = false;
      return;
    }
    resultMessage.value = res.msg || `采购入库成功${purchaseInboundRequests.length}条记录`;
    resultStatus.value = true;
    inboundList.value = [];
    fixedInboundForm.value.locationCode = '';
    fixedInboundForm.value.targetUserName = '';
    fixedInboundForm.value.invoiceNo = '';
    fixedInboundForm.value.postingDate = null;
    handleQuery();
  } catch (error) {
    resultMessage.value = error.message || '入库失败';
    resultStatus.value = false;
  } finally {
    buttonLoading.value = false;
  }
};

onMounted(() => {
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
.search-result {
  flex: 1;
  overflow: auto;
  min-height: 200px;
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
</style>
