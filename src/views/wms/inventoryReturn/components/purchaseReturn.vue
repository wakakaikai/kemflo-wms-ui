<template>
  <div class="p-2">
    <el-row :gutter="20">
      <!-- 上方搜索区域 -->
      <el-col :span="24">
        <el-card shadow="never" class="search-card">
          <template #header>
            <el-row :gutter="10" class="mb8">
              <el-col :span="1.5">
                <span>采购入库历史</span>
              </el-col>
              <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
            </el-row>
          </template>

          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <!-- 默认显示的搜索项 -->
            <el-form-item label="物料凭证号" prop="sapMaterialOrderNo">
              <!--                <el-input v-model="queryParams.sapMaterialOrderNo" placeholder="请输入物料凭证号" clearable @keyup.enter="handleQuery" />-->
              <HistoryInput v-model="queryParams.sapMaterialOrderNo" :config="sapMaterialOrderNoConfig" placeholder="请输入物料凭证号" @keyup.enter="handleQuery" />
            </el-form-item>

            <el-form-item label="采购单号" prop="sourceDocCode">
              <!--              <el-input v-model="queryParams.sourceDocCode" placeholder="请输入采购单号" clearable @keyup.enter="handleQuery" />-->
              <HistoryInput v-model="queryParams.sourceDocCode" :config="sourceDocCodeConfig" placeholder="请输入采购单号" @keyup.enter="handleQuery" />
            </el-form-item>
            <!-- 高级搜索项，默认隐藏 -->
            <div v-show="showAdvancedSearch">
              <el-form-item label="物料凭证项次" prop="sapMaterialItem">
                <HistoryInput v-model="queryParams.sapMaterialItem" :config="sapMaterialItemConfig" placeholder="请输入物料凭证项次" @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="采购单项次" prop="itemNumber">
                <HistoryInput v-model="queryParams.itemNumber" :config="itemNoConfig" placeholder="请输入采购单项次" @keyup.enter="handleQuery" />
              </el-form-item>
            </div>

            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery" :loading="loading">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
              <el-button link type="primary" @click="toggleAdvancedSearch">
                {{ showAdvancedSearch ? '收起' : '高级搜索' }}
                <el-icon class="el-icon--right">
                  <ArrowDown v-if="!showAdvancedSearch" />
                  <ArrowUp v-else />
                </el-icon>
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 搜索结果列表 -->
          <div class="search-result">
            <el-table ref="inventoryTableRef" :data="inventoryDetailList" height="300" border v-loading="loading" @selection-change="handleSelectionChange">
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column v-if="columns[0].visible" label="物料凭证号" align="left" prop="sapMaterialOrderNo" />
              <el-table-column v-if="columns[1].visible" label="凭证项次" align="left" prop="sapMaterialItem" />
              <el-table-column v-if="columns[2].visible" label="采购单号" align="left" prop="sourceDocCode" />
              <el-table-column v-if="columns[3].visible" label="采购项次" align="left" prop="poItemNo" />
              <el-table-column v-if="columns[4].visible" label="物料编码" align="left" prop="itemCode" />
              <el-table-column v-if="columns[5].visible" label="物料名称" align="left" prop="itemName" show-overflow-tooltip />
              <el-table-column v-if="columns[6].visible" label="批次号" align="center" prop="batchCode" />
              <el-table-column v-if="columns[7].visible" label="数量" align="center" prop="poQuantity" />
              <el-table-column v-if="columns[8].visible" label="单位" align="center" prop="poUnit" />
              <el-table-column v-if="columns[9].visible" label="特殊库存" align="center" prop="specialInventoryFlag">
                <template #default="scope">
                  <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
                </template>
              </el-table-column>
              <el-table-column v-if="columns[10].visible" label="业务伙伴" align="center" prop="businessCode" />
              <el-table-column v-if="columns[11].visible" label="伙伴名称" align="center" prop="businessName" show-overflow-tooltip />
              <el-table-column v-if="columns[12].visible" label="仓库编码" align="center" prop="warehouseCode" />
              <el-table-column v-if="columns[13].visible" label="库区编码" align="center" prop="areaCode" />
              <el-table-column v-if="columns[14].visible" label="库位编码" align="center" prop="locationCode" fixed="right" />
            </el-table>

            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
          </div>
        </el-card>
      </el-col>
      <div style="margin: 20px 0; text-align: center; width: 100%">
        <el-button type="primary" @click="addSelectedToTransferList" circle class="rotate-button">
          <el-icon><Switch /></el-icon>
        </el-button>
      </div>
      <!-- 下方移转列表 -->
      <el-col :span="24">
        <el-card shadow="never">
          <template #header>
            <div class="transfer-header">
              <span class="header-title">采购退料列表</span>
              <div class="header-actions">
                <el-radio-group v-model="transferMode" @change="handleTransferModeChange">
                  <el-radio-button label="fixed">固定库位</el-radio-button>
                  <el-radio-button label="multiple">多库位</el-radio-button>
                </el-radio-group>
                <el-button type="danger" @click="clearTransferList" :disabled="transferList.length === 0">清空列表</el-button>
              </div>
            </div>
          </template>

          <!-- 固定库位模式下的统一当前库位输入 -->
          <div style="padding: 10px; background-color: #f5f7fa; border-radius: 4px">
            <el-form :model="fixedTransferForm" ref="fixedTransferFormRef" label-width="auto" :inline="true">
              <el-row :gutter="20">
                <el-col :sm="24" :md="8" :lg="8" v-if="transferMode === 'fixed'">
                  <el-form-item label="当前库位" prop="targetLocationCode">
                    <!--                    <el-input
                      v-model.trim="fixedTransferForm.targetLocationCode"
                      placeholder="请输入当前库位编码"
                      clearable
                      @keydown.tab.prevent="locationCodeKeyDownTab(fixedTransferForm.targetLocationCode)"
                      @keydown.enter.prevent="locationCodeKeyDownTab(fixedTransferForm.targetLocationCode)"
                    >
                      <template #append>
                        <el-button icon="Search" @click="showStorageLocationDialog(-1)"></el-button>
                      </template>
                    </el-input>-->
                    <HistoryInput
                      v-model.trim="fixedTransferForm.targetLocationCode"
                      :config="locationCodeConfig"
                      placeholder="请输入当前库位编码"
                      @keydown.tab.prevent="locationCodeKeyDownTab(fixedTransferForm.targetLocationCode)"
                      @keydown.enter.prevent="locationCodeKeyDownTab(fixedTransferForm.targetLocationCode)"
                    >
                      <template #append>
                        <el-button icon="Search" @click="showStorageLocationDialog(-1)"></el-button>
                      </template>
                    </HistoryInput>
                  </el-form-item>
                </el-col>
                <el-col :sm="24" :md="8" :lg="8">
                  <el-form-item label="接收方">
                    <!--                    <el-input v-model="fixedTransferForm.targetUserName" placeholder="请输入接收方">
                      <template #append>
                        <el-button icon="Search" @click="showUserCollectionsDialog(-1)"></el-button>
                      </template>
                    </el-input>-->
                    <HistoryInput v-model="fixedTransferForm.targetUserName" :config="targetUserNameConfig" placeholder="请输入接收方" />
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
            <!--            <el-table-column label="物料凭证号" prop="sapMaterialOrderNo" />
            <el-table-column label="凭证项次" prop="sapMaterialItem" />-->
            <el-table-column label="采购单号" prop="sourceDocCode" />
            <el-table-column label="采购项次" prop="poItemNo" />
            <el-table-column label="物料编码" prop="itemCode" />
            <el-table-column label="物料名称" prop="itemName" show-overflow-tooltip />
            <el-table-column label="批次号" prop="batchCode" show-overflow-tooltip />
            <el-table-column label="源库位信息" min-width="120">
              <template #default="scope">
                <div>
                  <div>仓库: {{ scope.row.sourceWarehouseCode }}</div>
                  <div>库区: {{ scope.row.sourceAreaCode }}</div>
                  <div>库位: {{ scope.row.sourceLocationCode }}</div>
                </div>
              </template>
            </el-table-column>
            <!--              <el-table-column label="数量" min-width="180">
              <template #default="scope">
                <div>
                  <div>非限制数量: {{ scope.row.availableQuantity }}</div>
                  <div>质 检 数 量: {{ scope.row.inspectionQuantity }}</div>
                  <div>冻 结 数 量: {{ scope.row.blockedQuantity }}</div>
                </div>
              </template>
            </el-table-column>-->
            <el-table-column label="库存标识" align="center" prop="specialInventoryFlag" min-width="100">
              <template #default="scope">
                <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
              </template>
            </el-table-column>
            <!--            <el-table-column label="业务伙伴" align="center">
              <template #default="scope">
                <el-input v-model="scope.row.supplierCode" placeholder="供应商寄售编码" v-if="scope.row.specialInventoryFlag == 'K'" />
                <el-input v-model="scope.row.customerCode" placeholder="客户寄售编码" v-else-if="scope.row.specialInventoryFlag == 'W'" />
                <span v-else />
              </template>
            </el-table-column>-->

            <el-table-column label="库存类型" prop="inventoryType" align="center" min-width="130">
              <template #default="scope">
                <el-select v-model="scope.row.inventoryType" placeholder="请选择库存类型" style="width: 100%" @change="handleInventoryTypeChange(scope.$index, scope.row)">
                  <el-option v-for="dict in wms_inventory_type" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
              </template>
            </el-table-column>

            <!-- 多库位模式下显示独立的当前库位设置 -->
            <el-table-column label="当前库位" width="220" v-if="transferMode === 'multiple'">
              <template #default="scope">
                <!--                <el-input
                  v-model.trim="scope.row.targetLocationCode"
                  placeholder="请输入当前库位编码"
                  clearable
                  @keydown.tab.prevent="locationCodeKeyDownTab(scope.row.targetLocationCode)"
                  @keydown.enter.prevent="locationCodeKeyDownTab(scope.row.targetLocationCode)"
                >
                  <template #append>
                    <el-button icon="Search" @click="showStorageLocationDialog(scope.$index)"></el-button>
                  </template>
                </el-input>-->
                <TableHistoryInput
                  v-model="scope.row.targetLocationCode"
                  :config="locationCodeConfig"
                  placeholder="请输入当前库位编码"
                  @keydown.tab.prevent="locationCodeKeyDownTab(scope.row.targetLocationCode)"
                  @keydown.enter.prevent="locationCodeKeyDownTab(scope.row.targetLocationCode)"
                >
                  <template #append>
                    <el-button icon="Search" @click="showStorageLocationDialog(scope.$index)"></el-button>
                  </template>
                </TableHistoryInput>
              </template>
            </el-table-column>

            <el-table-column label="退货数量" width="140">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.returnQuantity"
                  :min="0"
                  :max="parseFloat(scope.row.poQuantity || 0)"
                  :precision="3"
                  size="small"
                  controls-position="right"
                  @change="handleReturnPoQuantityChange(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="单位" align="center" prop="poUnit" />
            <el-table-column label="库存数量" prop="inventoryQuantity" align="center" />
            <el-table-column label="库存单位" prop="inventoryUnit" align="center" />
            <el-table-column label="操作" width="80" align="center">
              <template #default="scope">
                <el-button type="danger" link icon="Delete" @click="removeFromTransferList(scope.$index)"></el-button>
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
            <el-button :loading="buttonLoading3" type="primary" @click="submitTransfer('161')" :disabled="transferList.length === 0">
              采购退货161
              <el-tooltip content="主要用于跨月向供应商退货的业务" placement="top">
                <el-icon class="ml-1"><QuestionFilled /></el-icon>
              </el-tooltip>
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <!-- 库位选择对话框 -->
    <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
    <!-- 用户收藏 -->
    <UserCollectionsDialog ref="userCollectionsDialogRef" @user-collections-call-back="userCollectionsSelectCallBack" />
  </div>
</template>

<script setup name="PurchaseReturn" lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { listInventoryMovement } from '@/api/wms/inventoryMovement';
import { InventoryMovementVO, InventoryMovementQuery, InventoryMovementForm } from '@/api/wms/inventoryMovement/types';
// 导入图标组件
import { ArrowDown, ArrowUp, Bell } from '@element-plus/icons-vue';

import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import UserCollectionsDialog from '@/views/wms/userCollections/components/userCollectionsDialog.vue';
import { returnPurchaseInventory } from '@/api/wms/inventoryDetail';
import { HttpStatus } from '@/enums/RespEnum';
import { listStorageLocation } from '@/api/wms/storageLocation';
import { listUserCollections } from '@/api/wms/userCollections';
import { HistoryConfig } from '@/types/history';
import HistoryInput from '@/components/HistoryInput/index.vue';
import TableHistoryInput from '@/components/TableHistoryInput/index.vue';
const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();
const userCollectionsDialogRef = ref<InstanceType<typeof UserCollectionsDialog>>();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_type, wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_type', 'wms_inventory_special_flag'));

const showSearch = ref(true);
// 响应式数据
const loading = ref(false);
const tableLoading = ref(false);
const buttonLoading1 = ref(false);
const buttonLoading2 = ref(false);
const buttonLoading3 = ref(false);
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
  targetUserName: '',
  postingDate: null,
  remark: ''
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
    moveType: '101',
    itemCode: undefined,
    itemName: undefined,
    batchCode: undefined,
    inventoryDirection: undefined,
    relatedMoveId: undefined,
    quantity: undefined,
    unit: undefined,
    sourceDocType: 'PO',
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

const targetUserNameConfig: HistoryConfig = {
  key: 'targetUserName',
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

// 列显隐信息
const columns = ref<FieldOption[]>([
  { key: 0, label: `物料凭证号`, visible: true, children: [] },
  { key: 1, label: `凭证项次`, visible: true, children: [] },
  { key: 2, label: `采购单号`, visible: true, children: [] },
  { key: 3, label: `项次`, visible: true, children: [] },
  { key: 4, label: `物料编码`, visible: true, children: [] },
  { key: 5, label: `物料名称`, visible: true, children: [] },
  { key: 6, label: `批次号`, visible: true, children: [] },
  { key: 7, label: `数量`, visible: true, children: [] },
  { key: 8, label: `单位`, visible: true, children: [] },
  { key: 9, label: `特殊库存`, visible: false, children: [] },
  { key: 10, label: `业务伙伴`, visible: false, children: [] },
  { key: 11, label: `伙伴名称`, visible: false, children: [] },
  { key: 12, label: `仓库编码`, visible: false, children: [] },
  { key: 13, label: `库区编码`, visible: false, children: [] },
  { key: 14, label: `库位编码`, visible: true, children: [] }
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

// 添加一个方法用于计算库存数量
const calculateInventoryQuantity = (row) => {
  row.inventoryQuantity = ((row.returnQuantity || 0) * (row.conversionRatio || 1)).toFixed(3);
};

// 监听收货数量变化的处理方法
const handleReturnPoQuantityChange = (row) => {
  // 如果输入为空，则库存数量也设为0
  if (row.poQuantity === null || row.poQuantity === undefined || row.poQuantity === '') {
    row.inventoryQuantity = 0;
  } else {
    calculateInventoryQuantity(row);
  }
};

/** 切换高级搜索显示状态 */
const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value;
};

/** 查询库存明细记录列表 */
const getList = async () => {
  loading.value = true;
  const res = await listInventoryMovement(queryParams.value);
  inventoryDetailList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置搜索 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  // 清除表格选中状态
  inventoryTableRef.value?.clearSelection();
  handleQuery();
};

/** 搜索结果选择变化 */
const handleSelectionChange = (selection: InventoryMovementVO[]) => {
  selectedSearchItems.value = selection;
};

/** 添加选中项到移转列表 */
const addSelectedToTransferList = () => {
  if (selectedSearchItems.value.length === 0) {
    proxy.$modal.msgWarning('请先选择要退货的记录');
    return;
  }

  const newItems = selectedSearchItems.value.map((item) => ({
    ...item,
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
    inventoryType: item.sapCheckFlag ? 'N' : 'X',
    returnQuantity: item.poQuantity,
    inventoryQuantity: (item.poQuantity * (item.conversionRatio || 1)).toFixed(3),
    inventoryUnit: item.unit
  }));

  // 避免重复添加
  let addedCount = 0;
  newItems.forEach((newItem) => {
    const exists = transferList.value.some((item) => item.id === newItem.id);
    if (!exists) {
      transferList.value.push(newItem);
      addedCount++;
    }
  });

  proxy.$modal.msgSuccess(`成功添加${addedCount}条记录到移转列表`);
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
    fixedTransferForm.value.remark = '';
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
    // 切换到固定库位模式时，清空所有行的当前库位
    transferList.value.forEach((item) => {
      item.targetLocationCode = '';
      item.remark = '';
    });
  } else {
    // 切换到多库位模式时，清空固定库位的当前库位
    fixedTransferForm.value.targetLocationCode = '';
    fixedTransferForm.value.remark = '';
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

/** 显示用户收藏选择对话框 */
const showUserCollectionsDialog = (index: number) => {
  userCollectionsDialogRef.value.openDialog();
  userCollectionsDialogRef.value.handleQuery();
  currenIndex.value = index;
};

/** 用户收藏回调 **/
const userCollectionsSelectCallBack = (record: any) => {
  console.log(record);
  if (transferMode.value === 'fixed') {
    // 固定库位模式，设置统一的目标用户
    fixedTransferForm.value.targetUserName = record.nickName;
  } else {
    // 多库位模式，设置对应行的目标用户
    if (currenIndex.value >= 0 && currenIndex.value < transferList.value.length) {
      const currentItem = transferList.value[currenIndex.value];
      currentItem.targetUserName = record.nickName;
    }
  }
};

const targetUserNameKeyDownTab = async () => {
  if (fixedTransferForm.value.targetUserName) {
    fixedTransferForm.value.targetUserName = fixedTransferForm.value.targetUserName.trim();
    const res = await listUserCollections({
      pageNum: 1,
      pageSize: 10,
      nickName: fixedTransferForm.value.targetUserName
    });
    resultMessage.value = '';
    if ((res.rows || []).length == 0) {
      resultMessage.value = `收藏用户${fixedTransferForm.value.targetUserName}不存在`;
      resultStatus.value = false;
    }
  }
};

const handleInventoryTypeChange = (index: number, value: any) => {
  const item = transferList.value[index];
  if (item.inventoryType === 'N') {
    item.currentQuantity = item.availableQuantity || 0;
  } else if (item.inventoryType === 'X') {
    item.currentQuantity = item.inspectionQuantity || 0;
  } else if (item.inventoryType === 'S') {
    item.currentQuantity = item.blockedQuantity || 0;
  }
};

/** 提交移转 */
const submitTransfer = async (moveType: any) => {
  const validTransfers = transferList.value.filter((item) => item.returnQuantity > 0);
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

    // 为所有记录设置统一的当前库位、接收方、过账日期、备注
    validTransfers.forEach((item) => {
      item.targetLocationCode = fixedTransferForm.value.targetLocationCode ? fixedTransferForm.value.targetLocationCode : item.locationCode;
      item.targetUserName = fixedTransferForm.value.targetUserName || '';
      item.postingDate = fixedTransferForm.value.postingDate ? fixedTransferForm.value.postingDate + ' 00:00:00' : '';
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
    // 为所有记录设置统一的接收方、过账日期、备注
    validTransfers.forEach((item) => {
      item.targetUserName = fixedTransferForm.value.targetUserName || '';
      item.postingDate = fixedTransferForm.value.postingDate ? fixedTransferForm.value.postingDate + ' 00:00:00' : '';
      item.remark = fixedTransferForm.value.remark;
    });
  }

  // 验证退货数量是否超过当前数量
  const overQuantityItems = validTransfers.filter((item) => item.returnQuantity > item.poQuantity);
  if (overQuantityItems.length > 0) {
    resultMessage.value = '退货数量不能超过当前可用数量';
    resultStatus.value = false;
    return;
  }
  switch (moveType) {
    case '102':
      buttonLoading1.value = true;
      break;
    case '122':
      buttonLoading2.value = true;
      break;
    case '161':
      buttonLoading3.value = true;
      break;
  }

  try {
    // 构造移转请求参数
    const transferRequests = validTransfers.map((item) => ({
      id: item.id,
      moveType: moveType,
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
      specialInventoryFlag: item.specialInventoryFlag,
      targetLocationCode: item.targetLocationCode,
      targetUserName: item.targetUserName,
      postingDate: item.postingDate
    }));

    const res: any = await returnPurchaseInventory({
      purchaseOrderReturnBoList: transferRequests,
      returnType: 1
    });

    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg;
      resultStatus.value = false;
      return;
    }
    resultMessage.value = res.msg || `成功移转${validTransfers.length}条记录`;
    resultStatus.value = true;
    transferList.value = [];
    fixedTransferForm.value.targetLocationCode = '';
    fixedTransferForm.value.targetUserName = '';
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
    buttonLoading3.value = false;
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

.vertical-layout {
  flex-direction: column;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-card {
    min-height: 250px;
  }

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
