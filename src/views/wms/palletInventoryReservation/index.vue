NEW_FILE_CODE
<template>
  <div class="p-2">
    <el-card shadow="never">
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
              <el-form-item label="仓库编码" prop="warehouseCode">
                <el-input v-model="queryParams.warehouseCode" placeholder="请输入仓库编码" clearable @keyup.enter="handleQuery" />
              </el-form-item>

              <el-form-item label="工单号" prop="workOrderNoStr">
                <el-input v-model="queryParams.workOrderNoStr" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" readonly>
                  <template #append>
                    <el-button icon="CopyDocument" @click="openBatchInputDialog" title="批量录入工单号" />
                  </template>
                </el-input>
              </el-form-item>

              <!-- 高级搜索项，默认隐藏 -->
              <div v-show="showAdvancedSearch">
                <el-form-item label="物料编码" prop="itemCode">
                  <el-input v-model="queryParams.itemCode" placeholder="请输入物料编码" clearable @keyup.enter="handleQuery" />
                </el-form-item>
<!--                <el-form-item label="工单号" prop="workOrderNo">
                  <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="物料名称" prop="itemName">
                  <el-input v-model="queryParams.itemName" placeholder="请输入物料名称" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="批次号" prop="batchCode">
                  <el-input v-model="queryParams.batchCode" placeholder="请输入批次号" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="特殊库存标识" prop="specialInventoryFlag">
                  <el-select v-model="queryParams.specialInventoryFlag" placeholder="请选择特殊库存标识" filterable clearable>
                    <el-option v-for="dict in wms_inventory_special_flag" :key="dict.value" :label="dict.label" :value="dict.value" />
                  </el-select>
                </el-form-item>-->
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
              <el-table ref="inventoryTableRef" :data="palletInventoryList" height="300" border v-loading="loading" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column v-if="columns[0].visible" label="栈板编号" align="center" prop="palletCode" fixed="left" />
                <el-table-column v-if="columns[1].visible" label="物料编码" align="left" prop="itemCode" />
                <el-table-column v-if="columns[2].visible" label="物料名称" align="center" prop="itemName" max-width="200" show-overflow-tooltip />
                <el-table-column v-if="columns[3].visible" label="批次号" align="center" prop="batchCode" />
                <el-table-column v-if="columns[4].visible" label="下制程" align="center" prop="nextStepOrderNo">
                  <template #default="scope">
                    <span>{{ scope.row.nextStepOrderNo || '-' }} {{ scope.row.nextStepWorkCenter || '' }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="columns[5].visible" label="下制程单位" align="center" prop="nextStepOrderNo">
                  <template #default="scope">
                    <span>{{ scope.row.nextStepOrderNo ? scope.row.nextStepDeptName : '-' }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="columns[6].visible" label="非限制数量" align="center" prop="availableQuantity" min-width="90" />
                <el-table-column v-if="columns[7].visible" label="质检数量" align="center" prop="inspectionQuantity" />
                <el-table-column v-if="columns[8].visible" label="冻结数量" align="center" prop="blockedQuantity" />
                <el-table-column v-if="columns[9].visible" label="特殊库存" align="center" prop="specialInventoryFlag">
                  <template #default="scope">
                    <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
                  </template>
                </el-table-column>
                <el-table-column v-if="columns[10].visible" label="业务伙伴" align="center" prop="businessCode" />
                <el-table-column v-if="columns[11].visible" label="伙伴名称" align="center" prop="businessName" show-overflow-tooltip />
                <el-table-column v-if="columns[12].visible" label="单位" align="center" prop="unit" />
                <el-table-column v-if="columns[13].visible" label="仓库编码" align="center" prop="warehouseCode" />
                <el-table-column v-if="columns[14].visible" label="库区编码" align="center" prop="areaCode" />
                <el-table-column v-if="columns[15].visible" label="库位编码" align="center" prop="locationCode" />
              </el-table>

              <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
            </div>
          </el-card>
        </el-col>

        <div style="margin: 20px 0; text-align: center; width: 100%">
          <el-button type="primary" @click="addSelectedToReservationList" circle class="rotate-button">
            <el-icon><Switch /></el-icon>
          </el-button>
        </div>

        <!-- 下方预约列表 -->
        <el-col :span="24">
          <el-card shadow="never">
            <template #header>
              <div class="reservation-header">
                <span class="header-title">预约列表</span>
                <div class="header-actions">
                  <el-radio-group v-model="reservationMode" @change="handleReservationModeChange">
                    <el-radio-button label="fixed">固定库位</el-radio-button>
                    <el-radio-button label="multiple">多库位</el-radio-button>
                  </el-radio-group>
                  <el-button type="danger" @click="clearReservationList" :disabled="reservationList.length === 0">清空列表</el-button>
                </div>
              </div>
            </template>

            <!-- 固定库位模式下的统一目标库位输入 -->
            <div style="padding: 10px; background-color: #f5f7fa; border-radius: 4px">
              <el-form :model="fixedReservationForm" ref="fixedReservationFormRef" label-width="auto" :inline="true">
                <el-row :gutter="20">
                  <el-col :sm="24" :md="8" :lg="8" v-if="reservationMode === 'fixed'">
                    <el-form-item label="目标库位" prop="targetLocationCode" :rules="[{ required: true, message: '请输入目标库位编码', trigger: 'blur' }]">
                      <el-input
                        v-model.trim="fixedReservationForm.targetLocationCode"
                        placeholder="请输入目标库位编码"
                        clearable
                        @keydown.tab.prevent="locationCodeKeyDownTab(fixedReservationForm.targetLocationCode)"
                        @keydown.enter.prevent="locationCodeKeyDownTab(fixedReservationForm.targetLocationCode)"
                      >
                        <template #append>
                          <el-button icon="Search" @click="showStorageLocationDialog(-1)"></el-button>
                        </template>
                      </el-input>
                    </el-form-item>
                  </el-col>
                  <!--                  <el-col :sm="24" :md="8" :lg="8">
                    <el-form-item label="备注">
                      <el-input v-model="fixedReservationForm.remark" placeholder="请输入备注" clearable />
                    </el-form-item>
                  </el-col>-->
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

            <el-table :data="reservationList" border style="width: 100%" v-loading="tableLoading" max-height="400">
              <el-table-column type="index" width="50" align="center" />
              <el-table-column label="栈板编号" prop="palletCode" />
              <!--              <el-table-column label="工单号" prop="workOrderNo" />-->
              <el-table-column label="物料编码" prop="itemCode" />
              <el-table-column label="物料名称" prop="itemName" show-overflow-tooltip />
              <el-table-column label="批次号" prop="batchCode" show-overflow-tooltip />
              <el-table-column label="源库位信息" width="200">
                <template #default="scope">
                  <div>
                    <div>仓库：{{ scope.row.warehouseCode }}</div>
                    <div>库区：{{ scope.row.areaCode }}</div>
                    <div>库位：{{ scope.row.locationCode }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="可用数量" prop="availableQuantity" align="center" min-width="90" />
              <el-table-column label="单位" prop="unit" align="center" />

              <!-- 多库位模式下显示独立的目标库位设置 -->
              <el-table-column label="目标库位" width="220" v-if="reservationMode === 'multiple'">
                <template #default="scope">
                  <el-input
                    v-model.trim="scope.row.targetLocationCode"
                    placeholder="请输入目标库位编码"
                    clearable
                    @keydown.tab.prevent="locationCodeKeyDownTab(scope.row.targetLocationCode)"
                    @keydown.enter.prevent="locationCodeKeyDownTab(scope.row.targetLocationCode)"
                  >
                    <template #append>
                      <el-button icon="Search" @click="showStorageLocationDialog(scope.$index)"></el-button>
                    </template>
                  </el-input>
                </template>
              </el-table-column>

              <el-table-column label="预约数量" width="130">
                <template #default="scope">
                  <el-input-number v-model="scope.row.reservationQuantity" :min="0" :max="scope.row.availableQuantity" :precision="3" controls-position="right" style="width: 100%" />
                </template>
              </el-table-column>
              <!--              <el-table-column label="备注" prop="remark" show-overflow-tooltip />-->
              <el-table-column label="操作" width="80" align="center">
                <template #default="scope">
                  <el-button type="danger" link icon="Delete" @click="removeFromReservationList(scope.$index)"></el-button>
                </template>
              </el-table-column>
            </el-table>

            <div style="margin-top: 20px; text-align: center">
              <el-button :loading="buttonLoading" type="primary" @click="submitReservation" :disabled="reservationList.length === 0">提交预约</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 批量输入对话框 -->
    <BatchInputDialog ref="batchInputDialogRef" v-model="batchInputDialogVisible" title="批量录入工单号" placeholder="请输入工单号，支持多行粘贴" @confirm="handleBatchInputConfirm" />

    <!-- 库位选择对话框 -->
    <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
  </div>
</template>

<script setup name="PalletInventoryReservation" lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { listPalletInventory } from '@/api/wms/palletInventory';
import { PalletInventoryVO, PalletInventoryQuery } from '@/api/wms/palletInventory/types';
import { addBatchPalletInventoryReservationHistory } from '@/api/wms/palletInventoryReservationHistory';

import { ArrowDown, ArrowUp, Bell, Switch } from '@element-plus/icons-vue';
import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';

import { listStorageLocation } from '@/api/wms/storageLocation';
import { HttpStatus } from '@/enums/RespEnum';
import BatchInputDialog from '@/components/BatchInputDialog/index.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));

const showSearch = ref(true);
const loading = ref(false);
const tableLoading = ref(false);
const buttonLoading = ref(false);
const palletInventoryList = ref<PalletInventoryVO[]>([]);
const selectedSearchItems = ref<PalletInventoryVO[]>([]);
const reservationList = ref<any[]>([]);
const showAdvancedSearch = ref(false);
const total = ref(0);
const currentIndex = ref(0);
const resultMessage = ref('');
const resultStatus = ref(false);

const batchInputDialogVisible = ref(false);
const batchInputDialogRef = ref<InstanceType<typeof BatchInputDialog>>();

// 预约模式：fixed-固定库位，multiple-多库位
const reservationMode = ref<'fixed' | 'multiple'>('fixed');

// 固定库位模式下的表单数据
const fixedReservationForm = ref({
  targetLocationCode: '',
  remark: ''
});

// 表单引用
const queryFormRef = ref<any>(null);
const fixedReservationFormRef = ref<any>(null);
const inventoryTableRef = ref(null);
const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();

const initFormData: PalletInventoryVO = {
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
  warehouseCode: undefined,
  areaCode: undefined,
  locationCode: undefined,
  specialInventoryFlag: undefined,
  remark: undefined
};

const data = reactive<PageData<PalletInventoryVO, PalletInventoryQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
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
    warehouseCode: 'KB10',
    areaCode: undefined,
    locationCode: undefined,
    specialInventoryFlag: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

// 列显隐信息
const columns = ref<FieldOption[]>([
  { key: 1, label: '栈板编号', visible: true },
  { key: 2, label: '物料编码', visible: true },
  { key: 3, label: '物料名称', visible: true },
  { key: 4, label: '批次号', visible: true },
  { key: 5, label: '下制程', visible: true },
  { key: 6, label: '下制程单位', visible: true },
  { key: 7, label: '非限制数量', visible: true },
  { key: 8, label: '质检数量', visible: false },
  { key: 9, label: '冻结数量', visible: false },
  { key: 10, label: '特殊库存', visible: true },
  { key: 11, label: '业务伙伴', visible: true },
  { key: 12, label: '伙伴名称', visible: false },
  { key: 13, label: '单位', visible: false },
  { key: 14, label: '仓库编码', visible: false },
  { key: 15, label: '库区编码', visible: false },
  { key: 16, label: '库位编码', visible: true }
]);

/** 切换高级搜索显示状态 */
const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value;
};

/** 查询栈板库存列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listPalletInventory(queryParams.value);
    res.rows.forEach((item) => {
      item.workOrderNo = item.sourceDocCode;
    });
    palletInventoryList.value = res.rows;
    total.value = res.total;
  } catch (error) {
    console.error(error);
    proxy?.$modal.msgError('查询库存失败');
  } finally {
    loading.value = false;
  }
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  delete queryParams.value.workOrderNoStr;
  getList();
};

/** 重置搜索 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  inventoryTableRef.value?.clearSelection();
  queryParams.value.workOrderNoList = [];
  batchInputDialogRef.value?.resetInput();
  handleQuery();
};

/** 搜索结果选择变化 */
const handleSelectionChange = (selection: PalletInventoryVO[]) => {
  selectedSearchItems.value = selection;
};

/** 添加选中项到预约列表 */
const addSelectedToReservationList = () => {
  if (selectedSearchItems.value.length === 0) {
    proxy?.$modal.msgWarning('请先选择要添加的库存');
    return;
  }

  const newItems = selectedSearchItems.value.map((item) => ({
    ...item,
    reservationQuantity: item.availableQuantity || 0,
    targetLocationCode: '',
    remark: ''
  }));

  // 避免重复添加
  let addedCount = 0;
  newItems.forEach((newItem) => {
    const exists = reservationList.value.some((item) => item.id === newItem.id);
    if (!exists) {
      reservationList.value.push(newItem);
      addedCount++;
    }
  });

  proxy?.$modal.msgSuccess(`成功添加${addedCount}条记录到预约列表`);
};

/** 从预约列表中移除 */
const removeFromReservationList = (index: number) => {
  reservationList.value.splice(index, 1);
};

/** 清空预约列表 */
const clearReservationList = () => {
  reservationList.value = [];
  if (reservationMode.value === 'fixed') {
    fixedReservationForm.value.targetLocationCode = '';
    fixedReservationForm.value.remark = '';
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
  storageLocationDialogRef.value?.openDialog();
  storageLocationDialogRef.value?.handleQuery();
  currentIndex.value = index;
};

/** 处理预约模式切换 */
const handleReservationModeChange = (mode: 'fixed' | 'multiple') => {
  if (mode === 'fixed') {
    // 切换到固定库位模式时，清空所有行的目标库位
    reservationList.value.forEach((item) => {
      item.targetLocationCode = '';
      item.remark = '';
    });
  } else {
    // 切换到多库位模式时，清空固定库位的目标库位
    fixedReservationForm.value.targetLocationCode = '';
    fixedReservationForm.value.remark = '';
  }
};

/** 库位选择回调 */
const storageLocationSelectCallBack = (record: any) => {
  if (reservationMode.value === 'fixed') {
    // 固定库位模式，设置统一的目标库位
    fixedReservationForm.value.targetLocationCode = record.locationCode;
  } else {
    // 多库位模式，设置对应行的目标库位
    if (currentIndex.value >= 0 && currentIndex.value < reservationList.value.length) {
      const currentItem = reservationList.value[currentIndex.value];
      currentItem.targetLocationCode = record.locationCode;
    }
  }
};

/** 提交预约 */
const submitReservation = async () => {
  const validReservations = reservationList.value.filter((item) => item.reservationQuantity > 0);

  resultStatus.value = true;
  resultMessage.value = '';

  if (validReservations.length === 0) {
    resultMessage.value = '没有有效的预约记录';
    resultStatus.value = false;
    return;
  }

  if (reservationMode.value === 'fixed') {
    // 固定库位模式验证
    if (!fixedReservationForm.value.targetLocationCode) {
      resultMessage.value = '请输入目标库位编码';
      resultStatus.value = false;
      return;
    }

    // 为所有记录设置统一的目标库位和备注
    validReservations.forEach((item) => {
      item.targetLocationCode = fixedReservationForm.value.targetLocationCode;
      item.remark = fixedReservationForm.value.remark;
    });
  } else {
    // 多库位模式验证
    const invalidItems = validReservations.filter((item) => !item.targetLocationCode);
    if (invalidItems.length > 0) {
      resultMessage.value = '请填写所有预约记录的目标库位';
      resultStatus.value = false;
      return;
    }
    // 为所有记录设置统一的备注
    validReservations.forEach((item) => {
      item.remark = fixedReservationForm.value.remark;
    });
  }

  // 验证目标库位和预约数量
  const invalidItems = validReservations.filter((item) => {
    if (!item.targetLocationCode || !item.targetLocationCode.trim()) {
      return true;
    }
    if (!item.reservationQuantity || item.reservationQuantity <= 0) {
      return true;
    }
    if (item.reservationQuantity > item.availableQuantity) {
      return true;
    }
    return false;
  });

  if (invalidItems.length > 0) {
    resultMessage.value = '请确保所有记录都填写了目标库位且预约数量不超过可用数量';
    resultStatus.value = false;
    return;
  }

  buttonLoading.value = true;
  try {
    const transferRequests = validReservations.map((item) => ({
      ...item,
      id: null,
      palletInventoryId: item.id
    }));

    const res: any = await addBatchPalletInventoryReservationHistory({
      palletInventoryReservationHistoryBoList: transferRequests
    });
    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg;
      resultStatus.value = false;
      return;
    }
    resultMessage.value = resultMessage.value = res.msg || `成功预约${validReservations.length}条记录`;
    resultStatus.value = true;
    reservationList.value = [];
    fixedReservationForm.value.targetLocationCode = '';
    fixedReservationForm.value.remark = '';
    getList();
  } catch (error) {
    console.error(error);
    resultMessage.value = '批量预约失败';
    resultStatus.value = false;
  } finally {
    buttonLoading.value = false;
  }
};

// 打开批量录入条码弹框
const openBatchInputDialog = () => {
  batchInputDialogVisible.value = true;
};
// 弹框确定的回调
const handleBatchInputConfirm = (values: string[]) => {
  // 将批量输入的值合并到查询参数中
  queryParams.value.workOrderNoStr = values.join(',');
  queryParams.value.workOrderNoList = values;
  handleQuery(); // 执行查询
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

.reservation-header {
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

@media (max-width: 768px) {
  .search-card {
    min-height: 250px;
  }

  .search-result {
    min-height: 150px;
  }

  .reservation-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
