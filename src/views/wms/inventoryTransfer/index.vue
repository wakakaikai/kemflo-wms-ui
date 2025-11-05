<template>
  <div class="p-2">
    <el-card shadow="never">
      <el-row :gutter="20">
        <!-- 上方搜索区域 -->
        <el-col :span="24">
          <el-card shadow="never" class="search-card">
            <template #header>
              <span>库存明细</span>
            </template>

            <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
              <!-- 默认显示的搜索项 -->
              <el-form-item label="物料编码" prop="itemCode">
                <el-input v-model="queryParams.itemCode" placeholder="请输入物料编码" clearable @keyup.enter="handleQuery" />
              </el-form-item>

              <el-form-item label="库位编码" prop="locationCode">
                <el-input v-model="queryParams.locationCode" placeholder="请输入库位编码" clearable @keyup.enter="handleQuery" />
              </el-form-item>

              <!-- 高级搜索项，默认隐藏 -->
              <div v-show="showAdvancedSearch">
                <el-form-item label="物料名称" prop="itemName">
                  <el-input v-model="queryParams.itemName" placeholder="请输入物料名称" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="批次号" prop="batchCode">
                  <el-input v-model="queryParams.batchCode" placeholder="请输入批次号" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="仓库编码" prop="warehouseCode">
                  <el-input v-model="queryParams.warehouseCode" placeholder="请输入仓库编码" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="特殊库存标识" prop="specialInventoryFlag">
                  <el-select v-model="queryParams.specialInventoryFlag" placeholder="请选择特殊库存标识" filterable clearable>
                    <el-option v-for="dict in wms_inventory_special_flag" :key="dict.value" :label="dict.label" :value="dict.value" />
                  </el-select>
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
                <el-table-column label="物料编码" prop="itemCode" show-overflow-tooltip />
                <el-table-column label="物料名称" prop="itemName" show-overflow-tooltip />
                <el-table-column label="批次号" prop="batchCode" show-overflow-tooltip />
                <el-table-column label="非限制数量" prop="availableQuantity" align="center" />
                <el-table-column label="质检数量" prop="inspectionQuantity" align="center" />
                <el-table-column label="冻结数量" prop="blockedQuantity" align="center" />
                <el-table-column label="单位" prop="unit" align="center" />
                <el-table-column label="特殊库存标识" align="center" prop="specialInventoryFlag">
                  <template #default="scope">
                    <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
                  </template>
                </el-table-column>
                <el-table-column label="仓库" prop="warehouseCode" show-overflow-tooltip />
                <el-table-column label="库区" prop="areaCode" show-overflow-tooltip />
                <el-table-column label="库位" prop="locationCode" show-overflow-tooltip />
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
                <span class="header-title">移转列表</span>
                <div class="header-actions">
                  <el-radio-group v-model="transferMode" @change="handleTransferModeChange">
                    <el-radio-button label="fixed">固定库位</el-radio-button>
                    <el-radio-button label="multiple">多库位</el-radio-button>
                  </el-radio-group>
                  <el-button type="danger" @click="clearTransferList" :disabled="transferList.length === 0">清空列表</el-button>
                </div>
              </div>
            </template>

            <!-- 固定库位模式下的统一目标库位输入 -->
            <div v-if="transferMode === 'fixed'" style="padding: 10px; background-color: #f5f7fa; border-radius: 4px">
              <el-form :model="fixedTransferForm" ref="fixedTransferFormRef" label-width="100px" :inline="true">
                <el-form-item label="目标库位" prop="targetLocationCode" :rules="[{ required: true, message: '请输入目标库位编码', trigger: 'blur' }]">
                  <el-input v-model="fixedTransferForm.targetLocationCode" placeholder="请输入目标库位编码" clearable style="width: 200px">
                    <template #append>
                      <el-button icon="Search" @click="showStorageLocationDialog(-1)"></el-button>
                    </template>
                  </el-input>
                </el-form-item>
                <!--                <el-form-item label="备注">
                  <el-input v-model="fixedTransferForm.remark" placeholder="请输入备注" style="width: 200px" />
                </el-form-item>-->
              </el-form>
            </div>
            <div v-if="resultMessage" class="m-y-2">
              <el-alert show-icon center :title="resultMessage" :type="resultStatus ? 'success' : 'error'">
                <template #icon>
                  <Bell />
                </template>
              </el-alert>
            </div>

            <!--            <el-alert v-if="transferMode === 'fixed'" title="提示：所有记录将移转到同一目标库位" type="info" show-icon style="margin-bottom: 15px" />-->
            <!--            <el-alert v-else title="提示：您可以为每个源库位设置不同的目标库位" type="info" show-icon style="margin-bottom: 15px" />-->

            <el-table :data="transferList" border style="width: 100%" v-loading="tableLoading" max-height="400">
              <el-table-column type="index" width="50" align="center" />
              <el-table-column label="物料编码" prop="itemCode" />
              <el-table-column label="物料名称" prop="itemName" show-overflow-tooltip />
              <el-table-column label="批次号" prop="batchCode" show-overflow-tooltip />
              <el-table-column label="源库位信息" width="180">
                <template #default="scope">
                  <div>
                    <div>仓库: {{ scope.row.sourceWarehouseCode }}</div>
                    <div>库区: {{ scope.row.sourceAreaCode }}</div>
                    <div>库位: {{ scope.row.sourceLocationCode }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="数量" max-width="200">
                <template #default="scope">
                  <div>
                    <div>非限制数量: {{ scope.row.availableQuantity }}</div>
                    <div>质 检 数 量: {{ scope.row.inspectionQuantity }}</div>
                    <div>冻 结 数 量: {{ scope.row.blockedQuantity }}</div>
                  </div>
                </template>
              </el-table-column>
              <!--              <el-table-column label="非限制数量" prop="availableQuantity" align="center" min-width="90" />-->
              <!--              <el-table-column label="质检数量" prop="inspectionQuantity" align="center" />-->
              <!--              <el-table-column label="冻结数量" prop="blockedQuantity" align="center" />-->
              <el-table-column label="单位" prop="unit" align="center" />
              <el-table-column label="特殊库存标识" align="center" prop="specialInventoryFlag" min-width="100">
                <template #default="scope">
                  <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
                </template>
              </el-table-column>
              <el-table-column label="库存类型" prop="inventoryType" min-width="130">
                <template #default="scope">
                  <el-select v-model="scope.row.inventoryType" placeholder="请选择库存类型" style="width: 100%" @change="handleInventoryTypeChange(scope.$index, scope.row)">
                    <el-option label="非限制库存" value="N"></el-option>
                    <el-option label="质检库存" value="X"></el-option>
                    <el-option label="冻结库存" value="S"></el-option>
                  </el-select>
                </template>
              </el-table-column>

              <!-- 多库位模式下显示独立的目标库位设置 -->
              <el-table-column label="目标库位" width="220" v-if="transferMode === 'multiple'">
                <template #default="scope">
                  <el-input v-model="scope.row.targetLocationCode" placeholder="请输入目标库位编码" clearable>
                    <template #append>
                      <el-button icon="Search" @click="showStorageLocationDialog(scope.$index)"></el-button>
                    </template>
                  </el-input>
                </template>
              </el-table-column>

              <el-table-column label="移转数量" width="130">
                <template #default="scope">
                  <el-input-number
                    v-model="scope.row.transferQuantity"
                    :min="0"
                    :max="scope.row.currentQuantity ? parseFloat(scope.row.currentQuantity) : scope.row.currentQuantity"
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
              <el-button :loading="buttonLoading" type="primary" @click="submitTransfer" :disabled="transferList.length === 0">确定移转</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
    <!-- 库位选择对话框 -->
    <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
  </div>
</template>

<script setup name="InventoryTransfer" lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { listInventoryDetail } from '@/api/wms/inventoryDetail';
import { InventoryDetailForm, InventoryDetailQuery, InventoryDetailVO } from '@/api/wms/inventoryDetail/types';
// 导入图标组件
import { ArrowDown, ArrowUp, Bell } from '@element-plus/icons-vue';

import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import { transferInventory } from '@/api/wms/inventoryDetail';
import { HttpStatus } from '@/enums/RespEnum';
const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_type, wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_type', 'wms_inventory_special_flag'));
// 响应式数据
const loading = ref(false);
const tableLoading = ref(false);
const buttonLoading = ref(false);
const inventoryDetailList = ref<InventoryDetailVO[]>([]);
const selectedSearchItems = ref<InventoryDetailVO[]>([]);
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
  remark: ''
});

// 表单引用
const queryFormRef = ref<any>(null);
const fixedTransferFormRef = ref<any>(null);

const inventoryTableRef = ref(null);

const initFormData: InventoryDetailForm = {
  id: undefined,
  itemType: undefined,
  itemCode: undefined,
  itemName: undefined,
  batchCode: undefined,
  availableQuantity: undefined,
  inspectionQuantity: undefined,
  blockedQuantity: undefined,
  unit: undefined,
  specialInventoryFlag: undefined,
  warehouseCode: undefined,
  areaCode: undefined,
  locationCode: undefined,
  businessCode: undefined,
  businessName: undefined,
  remark: undefined
};
const data = reactive<PageData<InventoryDetailForm, InventoryDetailQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    itemType: undefined,
    itemCode: undefined,
    itemName: undefined,
    batchCode: undefined,
    availableQuantity: undefined,
    inspectionQuantity: undefined,
    blockedQuantity: undefined,
    unit: undefined,
    specialInventoryFlag: undefined,
    warehouseCode: undefined,
    areaCode: undefined,
    locationCode: undefined,
    businessCode: undefined,
    businessName: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    itemCode: [{ required: true, message: '物料编码/设备编号不能为空', trigger: 'blur' }],
    itemName: [{ required: true, message: '物料名称/设备名称不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 切换高级搜索显示状态 */
const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value;
};

/** 查询库存明细记录列表 */
const getList = async () => {
  loading.value = true;
  const res = await listInventoryDetail(queryParams.value);
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
const handleSelectionChange = (selection: InventoryDetailVO[]) => {
  selectedSearchItems.value = selection;
};

/** 添加选中项到移转列表 */
const addSelectedToTransferList = () => {
  if (selectedSearchItems.value.length === 0) {
    proxy.$modal.msgWarning('请先选择要添加的库存');
    return;
  }

  const newItems = selectedSearchItems.value.map((item) => ({
    id: item.id,
    itemCode: item.itemCode,
    itemName: item.itemName,
    batchCode: item.batchCode,
    currentQuantity: item.availableQuantity || 0,
    availableQuantity: item.availableQuantity,
    inspectionQuantity: item.inspectionQuantity,
    blockedQuantity: item.blockedQuantity,
    unit: item.unit,
    sourceWarehouseCode: item.warehouseCode,
    sourceAreaCode: item.areaCode,
    sourceLocationCode: item.locationCode,
    targetWarehouseCode: '',
    targetAreaCode: '',
    targetLocationCode: '',
    specialInventoryFlag: item.specialInventoryFlag,
    inventoryType: 'N',
    transferQuantity: item.availableQuantity || 0,
    remark: ''
  }));

  // 避免重复添加
  let addedCount = 0;
  newItems.forEach((newItem) => {
    // const exists = transferList.value.some((item) => item.id === newItem.id);
    // if (!exists) {
    //   transferList.value.push(newItem);
    //   addedCount++;
    // }
    transferList.value.push(newItem);
    addedCount++;
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

/** 显示库位选择对话框 */
const showStorageLocationDialog = (index: number) => {
  storageLocationDialogRef.value.openDialog();
  storageLocationDialogRef.value.handleQuery();
  currenIndex.value = index;
};

/** 处理移转模式切换 */
const handleTransferModeChange = (mode: 'fixed' | 'multiple') => {
  if (mode === 'fixed') {
    // 切换到固定库位模式时，清空所有行的目标库位
    transferList.value.forEach((item) => {
      item.targetLocationCode = '';
      item.remark = '';
    });
  } else {
    // 切换到多库位模式时，清空固定库位的目标库位
    fixedTransferForm.value.targetLocationCode = '';
    fixedTransferForm.value.remark = '';
  }
};

/** 库位选择回调 */
const storageLocationSelectCallBack = (record: any) => {
  if (transferMode.value === 'fixed') {
    // 固定库位模式，设置统一的目标库位
    fixedTransferForm.value.targetLocationCode = record.locationCode;
    fixedTransferForm.value.targetWarehouseCode = record.warehouseCode;
    fixedTransferForm.value.targetAreaCode = record.areaCode;
  } else {
    // 多库位模式，设置对应行的目标库位
    if (currenIndex.value >= 0 && currenIndex.value < transferList.value.length) {
      const currentItem = transferList.value[currenIndex.value];
      currentItem.targetWarehouseCode = record.warehouseCode;
      currentItem.targetAreaCode = record.areaCode;
      currentItem.targetLocationCode = record.locationCode;
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
const submitTransfer = async () => {
  const validTransfers = transferList.value.filter((item) => item.transferQuantity > 0);
  resultStatus.value = true;
  resultMessage.value = '';
  if (validTransfers.length === 0) {
    resultMessage.value = '没有有效的移转记录';
    resultStatus.value = false;
    return;
  }

  if (transferMode.value === 'fixed') {
    // 固定库位模式验证
    if (!fixedTransferForm.value.targetLocationCode) {
      resultMessage.value = '请输入目标库位编码';
      resultStatus.value = false;
      return;
    }

    // 为所有记录设置统一的目标库位和备注
    validTransfers.forEach((item) => {
      item.targetLocationCode = fixedTransferForm.value.targetLocationCode;
      item.targetWarehouseCode = fixedTransferForm.value.targetWarehouseCode || '';
      item.targetAreaCode = fixedTransferForm.value.targetAreaCode || '';
      item.remark = fixedTransferForm.value.remark;
    });
  } else {
    // 多库位模式验证
    const invalidItems = validTransfers.filter((item) => !item.targetLocationCode);
    if (invalidItems.length > 0) {
      resultMessage.value = '请填写所有移转记录的目标库位';
      resultStatus.value = false;
      return;
    }
  }

  // 验证移转数量是否超过当前数量
  const overQuantityItems = validTransfers.filter((item) => item.transferQuantity > item.currentQuantity);
  if (overQuantityItems.length > 0) {
    resultMessage.value = '移转数量不能超过当前可用数量';
    resultStatus.value = false;
    return;
  }

  buttonLoading.value = true;
  try {
    // 构造移转请求参数
    const transferRequests = validTransfers.map((item) => ({
      ...item,
      inventoryDetailId: item.id,
      targetWarehouseCode: item.targetWarehouseCode,
      targetAreaCode: item.targetAreaCode,
      targetLocationCode: item.targetLocationCode,
      transferQuantity: item.transferQuantity,
      specialInventoryFlag: item.specialInventoryFlag,
      remark: item.remark
    }));
    debugger;
    const res: any = await transferInventory({
      inventoryTransferBoList: transferRequests
    });

    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg;
      resultStatus.value = false;
      return;
    }
    resultMessage.value = `成功移转${validTransfers.length}条记录`;
    resultStatus.value = true;
    transferList.value = [];
    // 清空固定库位表单
    if (transferMode.value === 'fixed') {
      fixedTransferForm.value.targetLocationCode = '';
      fixedTransferForm.value.remark = '';
    }
    handleQuery();
  } catch (error) {
    loading.value = false;
    resultMessage.value = error.message || '移转失败';
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
