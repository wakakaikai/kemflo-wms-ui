<template>
  <div class="p-2">
    <el-row :gutter="20">
      <!-- 上方搜索区域 -->
      <el-col :span="24">
        <el-card shadow="never" class="search-card">
          <template #header>
            <el-row :gutter="10" class="mb8">
              <el-col :span="1.5">
                <span>栈板库存明细</span>
              </el-col>
              <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
            </el-row>
          </template>

          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <!-- 默认显示的搜索项 -->
            <el-form-item label="栈板编号" prop="palletCode">
              <!--              <el-input v-model="queryParams.palletCode" placeholder="请输入栈板编号" clearable @keyup.enter="handleQuery" />-->
              <HistoryInput v-model="queryParams.palletCode" :config="palletCodeConfig" placeholder="请输入栈板编号" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料标识卡" prop="materialSn">
              <!--              <el-input v-model="queryParams.materialSn" placeholder="请输入物料标识卡" clearable @keyup.enter="handleQuery" />-->
              <HistoryInput v-model="queryParams.materialSn" :config="materialSnConfig" placeholder="请输入物料标识卡" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery" :loading="loading">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 搜索结果列表 -->
          <div class="search-result">
            <el-table ref="inventoryTableRef" :data="palletInventoryList" height="300" border v-loading="loading" @selection-change="handleSelectionChange">
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column v-if="columns[0].visible" label="栈板编号" align="center" prop="palletCode" fixed="left" min-width="150" />
              <el-table-column v-if="columns[1].visible" label="工单号" align="center" prop="workOrderNo" fixed="left" />
              <el-table-column v-if="columns[2].visible" label="物料标识卡" align="center" prop="materialSn" fixed="left" min-width="120" />
              <el-table-column v-if="columns[3].visible" label="物料编码" align="left" prop="itemCode" fixed="left" min-width="160" />
              <el-table-column v-if="columns[4].visible" label="物料名称" align="left" prop="itemName" max-width="150" fixed="left" show-overflow-tooltip />
              <el-table-column v-if="columns[5].visible" label="批次号" align="center" prop="batchCode" min-width="110" fixed="left" />
              <el-table-column v-if="columns[6].visible" label="非限制数量" align="center" prop="availableQuantity" fixed="left" min-width="90" />
              <el-table-column v-if="columns[7].visible" label="质检数量" align="center" prop="inspectionQuantity" fixed="left" />
              <el-table-column v-if="columns[8].visible" label="冻结数量" align="center" prop="blockedQuantity" fixed="left" />
              <el-table-column v-if="columns[9].visible" label="在途数量" align="center" prop="transitQuantity" fixed="left" />
              <el-table-column v-if="columns[10].visible" label="特殊库存" align="center" prop="specialInventoryFlag">
                <template #default="scope">
                  <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
                </template>
              </el-table-column>
              <el-table-column v-if="columns[11].visible" label="单位" align="center" prop="unit" />
              <el-table-column v-if="columns[12].visible" label="仓库编码" align="center" prop="warehouseCode" />
              <el-table-column v-if="columns[13].visible" label="库区编码" align="center" prop="areaCode" />
              <el-table-column v-if="columns[14].visible" label="库位编码" align="center" prop="locationCode" />
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
      <!-- 下方退货列表 -->
      <el-col :span="24">
        <el-card shadow="never">
          <template #header>
            <div class="transfer-header">
              <span class="header-title">生产退货列表</span>
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
            <el-table-column label="栈板编号" align="center" prop="palletCode" />
            <el-table-column label="工单号" align="center" prop="workOrderNo" />
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
            <el-table-column label="数量" min-width="160">
              <template #default="scope">
                <div>
                  <div>非限制数量: {{ scope.row.availableQuantity }}</div>
                  <div>质 检 数 量: {{ scope.row.inspectionQuantity }}</div>
                  <div>冻 结 数 量: {{ scope.row.blockedQuantity }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="单位" prop="unit" align="center" />
            <el-table-column label="库存标识" align="center" prop="specialInventoryFlag" min-width="100">
              <template #default="scope">
                <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
              </template>
            </el-table-column>
            <!--            <el-table-column label="业务伙伴编码" align="center" min-width="130">
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
                  :max="scope.row.currentQuantity ? parseFloat(scope.row.currentQuantity) : scope.row.currentQuantity"
                  :precision="3"
                  controls-position="right"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="scope">
                <el-button type="danger" link icon="Delete" @click="removeFromTransferList(scope.$index)"></el-button>
              </template>
            </el-table-column>
          </el-table>

          <div style="margin-top: 20px; text-align: center">
            <el-button v-hasPermi="['wms:inventoryDetail:palletReturn']" :loading="buttonLoading" type="primary" @click="submit" :disabled="transferList.length === 0">生产退货102</el-button>
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

<script setup name="ProductionReturn" lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { listPalletInventory } from '@/api/wms/palletInventory';
import { PalletInventoryVO, PalletInventoryQuery, PalletInventoryForm } from '@/api/wms/palletInventory/types';
// 导入图标组件
import { ArrowDown, ArrowUp, Bell } from '@element-plus/icons-vue';

import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import UserCollectionsDialog from '@/views/wms/userCollections/components/userCollectionsDialog.vue';
import { returnPalletInventory, transferInventory } from '@/api/wms/inventoryDetail';
import { HttpStatus } from '@/enums/RespEnum';
import { listStorageLocation } from '@/api/wms/storageLocation';
import { listUserCollections } from '@/api/wms/userCollections';
import HistoryInput from '@/components/HistoryInput/index.vue';
import TableHistoryInput from '@/components/TableHistoryInput/index.vue';
import { HistoryConfig } from '@/types/history';
const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();
const userCollectionsDialogRef = ref<InstanceType<typeof UserCollectionsDialog>>();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_type, wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_type', 'wms_inventory_special_flag'));

const showSearch = ref(true);
// 响应式数据
const loading = ref(false);
const tableLoading = ref(false);
const buttonLoading = ref(false);
const palletInventoryList = ref<PalletInventoryVO[]>([]);
const selectedSearchItems = ref<PalletInventoryVO[]>([]);
const transferList = ref<any[]>([]);
const showAdvancedSearch = ref(false); // 控制高级搜索显示状态
const total = ref(0);
const currenIndex = ref(0);
const resultMessage = ref('');
const resultStatus = ref(false);

// 退货模式：fixed-固定库位，multiple-多库位
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

const initFormData: PalletInventoryForm = {
  id: undefined,
  palletCode: undefined,
  workOrderNo: undefined,
  materialSn: undefined,
  batchCode: undefined,
  availableQuantity: undefined,
  inspectionQuantity: undefined,
  blockedQuantity: undefined,
  scrappedQuantity: undefined,
  unit: undefined,
  itemCode: undefined,
  itemName: undefined,
  inventoryType: undefined,
  inventoryStatus: undefined,
  stockInStatus: undefined,
  materialDocYear: undefined,
  materialOrderNo: undefined,
  materialItem: undefined,
  productDate: undefined,
  expireDate: undefined,
  remark: undefined
};
const data = reactive<PageData<PalletInventoryForm, PalletInventoryQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 100,
    palletCode: undefined,
    workOrderNo: undefined,
    materialSn: undefined,
    batchCode: undefined,
    availableQuantity: undefined,
    inspectionQuantity: undefined,
    blockedQuantity: undefined,
    scrappedQuantity: undefined,
    unit: undefined,
    itemCode: undefined,
    itemName: undefined,
    inventoryType: undefined,
    inventoryStatus: undefined,
    stockInStatus: undefined,
    materialDocYear: undefined,
    materialOrderNo: undefined,
    materialItem: undefined,
    productDate: undefined,
    expireDate: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

const palletCodeConfig: HistoryConfig = {
  key: 'palletCode',
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

const materialSnConfig: HistoryConfig = {
  key: 'materialSn',
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
  { key: 0, label: `栈板编号`, visible: true, children: [] },
  { key: 1, label: `工单号`, visible: true, children: [] },
  { key: 2, label: `物料标识卡`, visible: true, children: [] },
  { key: 3, label: `物料编码`, visible: true, children: [] },
  { key: 4, label: `物料名称`, visible: true, children: [] },
  { key: 5, label: `批次号`, visible: true, children: [] },
  { key: 6, label: `非限制数量`, visible: true, children: [] },
  { key: 7, label: `质检数量`, visible: true, children: [] },
  { key: 8, label: `冻结数量`, visible: false, children: [] },
  { key: 9, label: `在途数量`, visible: false, children: [] },
  { key: 10, label: `特殊库存`, visible: false, children: [] },
  { key: 11, label: `单位`, visible: true, children: [] },
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

/** 切换高级搜索显示状态 */
const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value;
};

/** 查询库存明细记录列表 */
const getList = async () => {
  loading.value = true;
  const res = await listPalletInventory(queryParams.value);
  res.rows.forEach((item) => {
    item.workOrderNo = item.sourceDocCode;
  });
  palletInventoryList.value = res.rows;
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
const handleSelectionChange = (selection: PalletInventoryVO[]) => {
  selectedSearchItems.value = selection;
};

/** 添加选中项到退货列表 */
const addSelectedToTransferList = () => {
  if (selectedSearchItems.value.length === 0) {
    proxy.$modal.msgWarning('请先选择要添加的库存');
    return;
  }

  const newItems = selectedSearchItems.value.map((item) => ({
    ...item,
    id: item.id,
    currentQuantity: item.availableQuantity || 0,
    sourceWarehouseCode: item.warehouseCode,
    sourceAreaCode: item.areaCode,
    sourceLocationCode: item.locationCode,
    targetWarehouseCode: item.warehouseCode,
    targetAreaCode: item.areaCode,
    targetLocationCode: item.locationCode,
    specialInventoryFlag: item.specialInventoryFlag,
    inventoryType: 'N',
    returnQuantity: item.availableQuantity,
    remark: ''
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

  proxy.$modal.msgSuccess(`成功添加${addedCount}条记录到退货列表`);
};

/** 从退货列表中移除 */
const removeFromTransferList = (index: number) => {
  transferList.value.splice(index, 1);
};

/** 清空退货列表 */
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

/** 处理退货模式切换 */
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
    fixedTransferForm.value.targetWarehouseCode = record.warehouseCode;
    fixedTransferForm.value.targetAreaCode = record.areaCode;
  } else {
    // 多库位模式，设置对应行的当前库位
    if (currenIndex.value >= 0 && currenIndex.value < transferList.value.length) {
      const currentItem = transferList.value[currenIndex.value];
      currentItem.targetWarehouseCode = record.warehouseCode;
      currentItem.targetAreaCode = record.areaCode;
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

/** 提交 */
const submit = async () => {
  const validTransfers = transferList.value.filter((item) => item.returnQuantity > 0);
  resultStatus.value = true;
  resultMessage.value = '';
  if (validTransfers.length === 0) {
    resultMessage.value = '没有有效的退货记录';
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
      resultMessage.value = '请填写所有退货记录的当前库位';
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
  const overQuantityItems = validTransfers.filter((item) => item.returnQuantity > item.currentQuantity);
  if (overQuantityItems.length > 0) {
    resultMessage.value = '退货数量不能超过当前可用数量';
    resultStatus.value = false;
    return;
  }

  buttonLoading.value = true;
  try {
    // 构造请求参数
    const transferRequests = validTransfers.map((item) => ({
      id: item.id,
      palletCode: item.palletCode,
      packingCode: item.packingCode,
      workOrderNo: item.workOrderNo,
      materialSn: item.materialSn,
      batchCode: item.batchCode,
      itemCode: item.itemCode,
      itemName: item.itemName,
      inventoryType: item.inventoryType,
      inventoryUnit: item.unit,
      returnQuantity: item.returnQuantity,
      specialInventoryFlag: item.specialInventoryFlag,
      targetLocationCode: item.targetLocationCode,
      targetUserName: item.targetUserName,
      postingDate: item.postingDate
    }));

    const res: any = await returnPalletInventory({
      wmsPalletInventoryBoList: transferRequests
    });

    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg;
      resultStatus.value = false;
      return;
    }
    resultMessage.value = res.msg || `栈板退货成功${transferRequests.length}条记录`;
    resultStatus.value = true;
    transferList.value = [];
    fixedTransferForm.value.targetLocationCode = '';
    fixedTransferForm.value.targetUserName = '';
    fixedTransferForm.value.postingDate = null;
    fixedTransferForm.value.remark = '';
    handleQuery();
  } catch (error) {
    loading.value = false;
    resultMessage.value = error.message || '退货失败';
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
