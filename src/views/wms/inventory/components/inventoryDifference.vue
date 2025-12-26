<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="物料编码" prop="itemCode">
              <el-input v-model="queryParams.itemCode" placeholder="请输入物料编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="仓库编码" prop="warehouseCode">
              <el-input v-model="queryParams.warehouseCode" placeholder="请输入仓库编码" clearable @keyup.enter="handleQuery">
                <template #append>
                  <el-button icon="Search" type="primary" @click="showWarehouseDialog" />
                </template>
              </el-input>
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
          <el-col :span="3">
            <el-button type="warning" plain icon="Download" @click="exportData" v-hasPermi="['wms:inventoryDifference:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="inventoryDiffList" style="width: 100%" border>
        <el-table-column label="物料编码" align="left" prop="itemCode" min-width="100" />
        <el-table-column label="物料名称" align="left" prop="itemName" min-width="200" show-overflow-tooltip />
        <el-table-column label="仓库编码" align="center" prop="warehouseCode" min-width="100" />
        <el-table-column label="SAP库存" align="center" prop="sapQuantity" min-width="120" />
        <el-table-column label="WMS库存" align="center" prop="totalQuantity" min-width="120" />
        <el-table-column label="差异数量" align="center" prop="diffQuantity" min-width="120">
          <template #default="scope">
            <span :class="{ 'text-warn': scope.row.diffQuantity < 0, 'text-green': scope.row.diffQuantity == 0, 'text-red': scope.row.diffQuantity > 0 }">
              {{ scope.row.diffQuantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="单位" align="center" prop="unit" min-width="80" />
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 库位选择对话框 -->
    <WarehouseDialog ref="warehouseDialogRef" @warehouse-select-call-back="warehouseSelectCallBack" />
  </div>
</template>

<script setup name="InventoryDifference" lang="ts">
import { listInventoryDiff } from '@/api/wms/InventoryDifference';
import WarehouseDialog from '@/views/wms/warehouse/components/warehouseDialog.vue';
import { listWarehouse } from '@/api/wms/warehouse';
import { WarehouseForm, WarehouseQuery } from '@/api/wms/warehouse/types';

const warehouseDialogRef = ref<InstanceType<typeof WarehouseDialog>>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const showSearch = ref(true);
const inventoryDiffList = ref<InventoryDiffVO[]>([]);
const loading = ref(true);
const total = ref(0);

const initFormData: WarehouseForm = {
  id: undefined,
  warehouseCode: undefined,
  warehouseName: undefined,
  enableFlag: undefined,
  enableFlagBoolean: true,
  remark: undefined
};
const data = reactive<PageData<WarehouseForm, WarehouseQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    warehouseCode: undefined,
    warehouseName: undefined,
    enableFlag: undefined,
    enableFlagBoolean: undefined,
    params: {}
  },
  rules: {}
});
const { queryParams, form } = toRefs(data);

/** 查询库存差异列表 */
const getList = async () => {
  loading.value = true;
  const res = await listInventoryDiff(queryParams.value);
  inventoryDiffList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 查询按钮操作 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 显示库位选择对话框 */
const showWarehouseDialog = () => {
  warehouseDialogRef.value.openDialog();
  warehouseDialogRef.value.handleQuery();
};
/** 库位选择回调 */
const warehouseSelectCallBack = (record: any) => {
  queryParams.value.warehouseCode = record.warehouseCode;
};

const warehouseCodeKeyDownTab = async () => {
  if (form.value.locationCode) {
    form.value.locationCode = form.value.locationCode.trim();
    const res = await listWarehouse({ warehouseCode: form.value.warehouseCode });
    if (res.data) {
      form.value.warehouseCode = res.data.warehouseCode;
      form.value.areaCode = res.data.areaCode;
      form.value.locationCode = res.data.locationCode;
    } else {
      ElMessage.error('未找到库位及仓库信息');
      return;
    }
  }
};
/** 导出数据 */
const exportData = () => {
  proxy?.download(
    'wms/inventory/difference/export',
    {
      ...queryParams.value
    },
    `inventory_diff_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
.text-red {
  color: red;
}

.text-warn {
  color: #e6a23c;
}

.text-green {
  color: green;
}
</style>
