<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover" class="container-inout-header-card">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="物料编码" prop="itemCodeStr">
              <HistoryInput v-model="queryParams.itemCodeStr" :config="itemCodeConfig" placeholder="请输入物料编码" @keyup.enter="handleQuery">
                <template #append>
                  <el-button icon="CopyDocument" @click="openBatchInputDialog" title="批量录入物料编码" />
                </template>
              </HistoryInput>
            </el-form-item>
            <el-form-item label="仓库编码" prop="warehouseCode">
              <HistoryInput v-model="queryParams.warehouseCode" :config="warehouseCodeConfig" placeholder="请输入仓库编码" @save="handleQuery" @select="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleContainerIn"> 容器入库 </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="TopRight" :disabled="single" @click="handleContainerOut"> 容器出库 </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport"> 导出 </el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="containerList" @selection-change="handleSelectionChange" border>
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="物料编码" align="left" prop="itemCode" min-width="150" />
        <el-table-column label="物料名称" align="left" prop="itemName" min-width="180" show-overflow-tooltip />
        <el-table-column label="批次号" align="center" prop="batchCode" min-width="110" />
        <el-table-column label="非限制数量" align="center" prop="availableQuantity" min-width="90" />
        <el-table-column label="质检数量" align="center" prop="inspectionQuantity" min-width="90" />
        <el-table-column label="冻结数量" align="center" prop="blockedQuantity" min-width="90" />
        <el-table-column label="特殊库存" align="center" prop="specialInventoryFlag" min-width="90">
          <template #default="scope">
            <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
          </template>
        </el-table-column>
        <el-table-column label="仓库编码" align="center" prop="warehouseCode" min-width="100" />
        <el-table-column label="库区编码" align="center" prop="areaCode" min-width="100" />
        <el-table-column label="库位编码" align="center" prop="locationCode" min-width="100" />
        <el-table-column label="单位" align="center" prop="unit" min-width="80" />
        <el-table-column label="业务伙伴" align="center" prop="businessCode" min-width="100" />
        <el-table-column label="伙伴名称" align="center" prop="businessName" min-width="100" show-overflow-tooltip />
        <el-table-column label="备注" align="center" prop="remark" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" align="center" fixed="right" width="100">
          <template #default="scope">
            <el-tooltip content="容器出库" placement="top">
              <el-button link type="warning" icon="TopRight" @click="handleContainerOut(scope.row)"> 出库 </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <BatchInputDialog ref="batchInputDialogRef" v-model="batchInputDialogVisible" title="批量录入物料编码" placeholder="请输入物料编码，支持多行粘贴" @confirm="handleBatchInputConfirm" />
    <ContainerInDialog ref="containerInDialogRef" v-model="containerInDialogVisible" :container-material-code-dict="wms_container_material_code" @success="containerInSuccess" />
    <ContainerOutDialog ref="containerOutDialogRef" v-model="containerOutDialogVisible" @success="containerOutSuccess" />
  </div>
</template>

<script setup name="ContainerInOut" lang="ts">
import { listContainerInOut, getInventoryDetail } from '@/api/wms/containerInOut';
import type { ContainerInOutQuery } from '@/api/wms/containerInOut/types';
import type { InventoryDetailVO } from '@/api/wms/inventoryDetail/types';
import HistoryInput from '@/components/HistoryInput/index.vue';
import type { HistoryConfig } from '@/types/history';
import BatchInputDialog from '@/components/BatchInputDialog/index.vue';
import ContainerInDialog from './components/ContainerInDialog.vue';
import ContainerOutDialog from './components/ContainerOutDialog.vue';
import { ref } from 'vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag, wms_container_material_code } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag', 'wms_container_material_code'));

const containerList = ref<InventoryDetailVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const buttonLoading = ref(false);

const queryFormRef = ref<ElFormInstance>();
const batchInputDialogVisible = ref(false);
const batchInputDialogRef = ref<InstanceType<typeof BatchInputDialog>>();
const containerInDialogRef = ref<InstanceType<typeof ContainerInDialog>>();
const containerOutDialogRef = ref<InstanceType<typeof ContainerOutDialog>>();
const containerInDialogVisible = ref(false);
const containerOutDialogVisible = ref(false);

const data = reactive<PageData<any, ContainerInOutQuery>>({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    itemCodeStr: undefined,
    itemCodeList: [],
    itemName: undefined,
    batchCode: undefined,
    warehouseCode: undefined,
    areaCode: undefined,
    locationCode: undefined,
    specialInventoryFlag: undefined,
    params: {}
  },
  rules: {}
});
const { queryParams } = toRefs(data);

// 物料编码缓存配置
const itemCodeConfig: HistoryConfig = {
  key: 'containerInOutItemCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'containerInOut',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};

// 仓库编码缓存配置
const warehouseCodeConfig: HistoryConfig = {
  key: 'containerInOutWarehouseCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'containerInOut',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};

/** 查询容器列表 */
const getList = async () => {
  loading.value = true;
  // 将 itemCodeStr 拆分为 itemCodeList 数组，itemCodeStr 本身不传参
  const str = String(queryParams.value.itemCodeStr || '').trim();
  queryParams.value.itemCodeList = str ? str.split(/[,;，；\s]+/).filter(Boolean) : [];
  const params = { ...queryParams.value, itemType: 3 };
  delete params.itemCodeStr;
  params.itemType = 3;
  const res = await listContainerInOut(params);
  containerList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.dateTimeRange = undefined;
  queryParams.value.itemCodeStr = undefined;
  queryParams.value.itemCodeList = [];
  batchInputDialogRef.value?.resetInput();
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: InventoryDetailVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
};

/** 打开批量录入物料编码对话框 */
const openBatchInputDialog = () => {
  batchInputDialogVisible.value = true;
};

/** 批量录入回填 */
const handleBatchInputConfirm = (values: string[]) => {
  queryParams.value.itemCodeStr = values.join(',');
  handleQuery();
};

/** 容器入库 */
const handleContainerIn = () => {
  containerInDialogVisible.value = true;
};

/** 容器入库成功回调 */
const containerInSuccess = () => {
  getList();
};

/** 容器出库 */
const handleContainerOut = async (row?: InventoryDetailVO) => {
  if (row?.id) {
    containerOutDialogRef.value?.open(row);
    return;
  }
  const _id = ids.value[0];
  if (!_id) return;
  const res = await getInventoryDetail(_id);
  containerOutDialogRef.value?.open(res.data);
};

/** 容器出库成功回调 */
const containerOutSuccess = () => {
  getList();
};

/** 删除按钮操作 */
const handleDelete = async (row?: InventoryDetailVO) => {
  const _ids = row?.id || ids.value;
  if (!_ids || (Array.isArray(_ids) && _ids.length === 0)) return;
  await proxy?.$modal.confirm('是否确认删除容器编号为"' + _ids + '"的数据项？');
  const { delInventoryDetail } = await import('@/api/wms/inventoryDetail');
  await delInventoryDetail(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  const params = { ...queryParams.value, itemType: 3 };
  delete params.itemCodeStr;
  proxy?.download('wms/inventoryDetail/export', params, `container_inout_${new Date().getTime()}.xlsx`);
};

onMounted(() => {
  const tenantId = localStorage.getItem('tenantId');
  queryParams.value.warehouseCode = tenantId === '000000' ? 'CN00' : 'CN10';
  getList();
});
</script>

<style lang="scss" scoped>
.container-inout-header-card {
  overflow: visible;
}
.container-inout-header-card :deep(.el-card__body) {
  overflow: visible;
}
</style>
