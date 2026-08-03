<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover" class="inventory-difference-header-card">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="物料编码" prop="itemCodeStr">
              <HistoryInput v-model="queryParams.itemCodeStr" :config="itemCodeConfig" placeholder="请输入物料编码" @keyup.enter="handleQuery()">
                <template #append>
                  <el-button icon="CopyDocument" @click="openBatchInputDialog" title="批量录入物料编码" />
                </template>
              </HistoryInput>
            </el-form-item>
            <el-form-item label="仓库编码" prop="warehouseCode" :rules="[{ required: true, message: '仓别为必填项', trigger: 'blur' }]">
              <HistoryInput v-model="queryParams.warehouseCode" :config="warehouseCodeConfig" placeholder="请输入仓库编码" @keyup.enter="handleQuery()">
                <template #append>
                  <el-button icon="Search" type="primary" @click="showWarehouseDialog" />
                </template>
              </HistoryInput>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery()">搜索</el-button>
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
            <el-button type="warning" plain icon="Download" @click="exportData" v-hasPermi="['wms:inventoryDifference:export']">导出</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Download" @click="exportDiffData" v-hasPermi="['wms:inventoryDifference:export']">导出差异物料</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-switch v-model="onlyShowDiff" active-text="只显示差异" inactive-text="显示全部" inline-prompt @change="handleQuery()" />
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="mb-2" style="margin-top: -10px;">
        <el-tab-pane label="SAP->WMS库存差异" name="sap" />
        <el-tab-pane label="WMS->SAP库存差异" name="wms" />
      </el-tabs>

      <el-table v-loading="loading" :data="displayList" style="width: 100%" border>
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
        <el-table-column label="操作" align="center" width="100" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="goToInventoryDetail(scope.row)">库存明细</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-if="activeTab === 'sap'" v-show="sapTotal > 0" v-model:page="sapPageNum" v-model:limit="sapPageSize" :total="sapTotal" @pagination="() => {}" />
      <pagination v-if="activeTab === 'wms'" v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 库位选择对话框 -->
    <WarehouseDialog ref="warehouseDialogRef" @warehouse-select-call-back="warehouseSelectCallBack" />
    <!-- 物料编码批量输入对话框 -->
    <BatchInputDialog ref="batchInputDialogRef" v-model="batchInputDialogVisible" title="批量录入物料编码" placeholder="请输入物料编码，支持多行粘贴" @confirm="handleBatchInputConfirm" />
  </div>
</template>

<script setup name="InventoryDifference" lang="ts">
import { listInventoryDiff } from '@/api/wms/InventoryDifference';
import { InventoryDiffVO, InventoryDiffQuery } from '@/api/wms/InventoryDifference/types';
import WarehouseDialog from '@/views/wms/warehouse/components/warehouseDialog.vue';
import HistoryInput from '@/components/HistoryInput/index.vue';
import BatchInputDialog from '@/components/BatchInputDialog/index.vue';
import { HistoryConfig } from '@/types/history';

const warehouseDialogRef = ref<InstanceType<typeof WarehouseDialog>>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const showSearch = ref(true);
const inventoryDiffList = ref<InventoryDiffVO[]>([]);
const loading = ref(true);
const total = ref(0);
const sapRawList = ref<InventoryDiffVO[]>([]);
const sapPageNum = ref(1);
const sapPageSize = ref(10);
const queryFormRef = ref<any>(null);
const batchInputDialogVisible = ref(false);
const batchInputDialogRef = ref<InstanceType<typeof BatchInputDialog>>();

const activeTab = ref('sap');
const onlyShowDiff = ref(false);

const data = reactive<PageData<any, InventoryDiffQuery>>({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    itemCodeStr: undefined,
    itemCodeList: [],
    warehouseCode: undefined,
    params: {}
  },
  rules: {}
});
const { queryParams } = toRefs(data);

const itemCodeConfig: HistoryConfig = {
  key: 'itemCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryDifference',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const warehouseCodeConfig: HistoryConfig = {
  key: 'warehouseCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryDifference',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

/** SAP前端分页总条数 */
const sapTotal = computed(() => {
  if (!onlyShowDiff.value) return sapRawList.value.length;
  return sapRawList.value.filter((item) => item.diffQuantity !== 0).length;
});

/** 经过筛选与分页的显示列表 */
const displayList = computed(() => {
  if (activeTab.value === 'sap') {
    let list = sapRawList.value;
    if (onlyShowDiff.value) {
      list = list.filter((item) => item.diffQuantity !== 0);
    }
    const start = (sapPageNum.value - 1) * sapPageSize.value;
    const end = start + sapPageSize.value;
    return list.slice(start, end);
  }
  if (!onlyShowDiff.value) return inventoryDiffList.value;
  return inventoryDiffList.value.filter((item) => item.diffQuantity !== 0);
});

/** 查询库存差异列表 */
const getList = async () => {
  // 未选择仓别时不执行查询
  if (!queryParams.value.warehouseCode) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    if (activeTab.value === 'sap') {
      // SAP页签：全量加载，前端分页
      const params = { ...queryParams.value, pageNum: 1, pageSize: 99999 };
      delete params.itemCodeStr;
      const res = await listInventoryDiff(params);
      sapRawList.value = res.rows || [];
    } else {
      // WMS页签：后端分页
      const params = { ...queryParams.value };
      delete params.itemCodeStr;
      const res = await listInventoryDiff(params);
      inventoryDiffList.value = res.rows;
      total.value = res.total;
    }
  } finally {
    loading.value = false;
  }
};

/** 查询按钮操作 */
const handleQuery = () => {
  queryFormRef.value?.validate((valid: boolean) => {
    if (!valid) return;
    doQuery();
  });
};

/** 执行查询（内部方法，不校验） */
const doQuery = () => {
  queryParams.value.pageNum = 1;
  sapPageNum.value = 1;
  const str = String(queryParams.value.itemCodeStr || '').trim();
  queryParams.value.itemCodeList = str ? str.split(/[,;，；\s]+/).filter(Boolean) : [];
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.itemCodeStr = undefined;
  queryParams.value.itemCodeList = [];
  batchInputDialogRef.value?.resetInput();
  doQuery();
};

/** 显示库位选择对话框 */
const showWarehouseDialog = () => {
  warehouseDialogRef.value.openDialog();
  warehouseDialogRef.value.handleQuery();
};
/** 仓库选择回调 */
const warehouseSelectCallBack = (record: any) => {
  queryParams.value.warehouseCode = record.warehouseCode;
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

/** 跳转到库存明细页面 */
const router = useRouter();
const goToInventoryDetail = (row: InventoryDiffVO) => {
  router.push({
    path: '/inventory/inventoryDetail',
    query: { itemCode: row.itemCode, warehouseCode: row.warehouseCode }
  });
};

/** Tab切换 */
const handleTabChange = (tab: string) => {
  queryParams.value.compareDimension = tab;
  handleQuery();
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

/** 导出差异物料 */
const exportDiffData = () => {
  proxy?.download('wms/inventory/difference/export', { ...queryParams.value, diffFlag: true }, `inventory_diff_only_${new Date().getTime()}.xlsx`);
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

.inventory-difference-header-card {
  overflow: visible;
}

.inventory-difference-header-card :deep(.el-card__body) {
  overflow: visible;
}
</style>
