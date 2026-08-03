<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover" class="container-difference-header-card">
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
            <el-form-item label="移动时间" prop="dateTimeRange">
              <el-date-picker v-model="queryParams.dateTimeRange" type="datetimerange" :shortcuts="shortcuts" value-format="YYYY-MM-DD HH:mm:ss" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]" />
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
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:containerDiff:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="containerDiffList" style="width: 100%" border>
        <el-table-column label="物料编码" align="left" prop="itemCode" min-width="120" />
        <el-table-column label="物料名称" align="left" prop="itemName" min-width="180" show-overflow-tooltip />
        <el-table-column label="仓库编码" align="center" prop="warehouseCode" min-width="100" />
        <el-table-column label="目标编码" align="center" prop="businessCode" min-width="100" />
        <el-table-column label="目标名称" align="center" prop="businessName" min-width="100" />
        <el-table-column label="入库数量" align="right" prop="inboundQuantity" min-width="100" />
        <el-table-column label="出库数量" align="right" prop="outboundQuantity" min-width="100" />
        <el-table-column label="差异数量" align="right" prop="diffQuantity" min-width="100">
          <template #default="scope">
            <span :class="{ 'text-red': scope.row.diffQuantity > 0, 'text-green': scope.row.diffQuantity === 0, 'text-warn': scope.row.diffQuantity < 0 }">
              {{ scope.row.diffQuantity }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <BatchInputDialog ref="batchInputDialogRef" v-model="batchInputDialogVisible" title="批量录入物料编码" placeholder="请输入物料编码，支持多行粘贴" @confirm="handleBatchInputConfirm" />
  </div>
</template>

<script setup name="ContainerDiff" lang="ts">
import { listContainerDiff } from '@/api/wms/containerDiff';
import { ContainerDiffVO, ContainerDiffQuery } from '@/api/wms/containerDiff/types';
import { ref } from 'vue';
import HistoryInput from '@/components/HistoryInput/index.vue';
import type { HistoryConfig } from '@/types/history';
import BatchInputDialog from '@/components/BatchInputDialog/index.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const showSearch = ref(true);
const containerDiffList = ref<ContainerDiffVO[]>([]);
const loading = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const batchInputDialogVisible = ref(false);
const batchInputDialogRef = ref<InstanceType<typeof BatchInputDialog>>();

const data = reactive<PageData<any, ContainerDiffQuery>>({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    itemCodeStr: undefined,
    itemCodeList: [],
    itemName: undefined,
    warehouseCode: undefined,
    dateTimeRange: undefined,
    params: {}
  },
  rules: {}
});
const { queryParams } = toRefs(data);

// 物料编码缓存配置
const itemCodeConfig: HistoryConfig = {
  key: 'containerDiffItemCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'containerDiff',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};

// 仓库编码缓存配置
const warehouseCodeConfig: HistoryConfig = {
  key: 'containerDiffWarehouseCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'containerDiff',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};

// 快捷时间选择
const shortcuts = [
  { text: '今天', value: () => [new Date(new Date().toDateString()), new Date(new Date().toDateString() + ' 23:59:59')] },
  {
    text: '昨天',
    value: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return [start, end];
    }
  },
  {
    text: '最近7天',
    value: () => {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      return [start, end];
    }
  },
  {
    text: '最近30天',
    value: () => {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      return [start, end];
    }
  }
];

/** 查询容器进出差异列表 */
const getList = async () => {
  loading.value = true;
  // 将 itemCodeStr 拆分为 itemCodeList 数组传给后端，itemCodeStr 本身不传参
  const str = String(queryParams.value.itemCodeStr || '').trim();
  queryParams.value.itemCodeList = str ? str.split(/[,;，；\s]+/).filter(Boolean) : [];
  const params = { ...queryParams.value };
  delete params.itemCodeStr;
  const res = await listContainerDiff(params);
  containerDiffList.value = res.rows;
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

/** 打开批量录入物料编码对话框 */
const openBatchInputDialog = () => {
  batchInputDialogVisible.value = true;
};

/** 批量录入回填 */
const handleBatchInputConfirm = (values: string[]) => {
  queryParams.value.itemCodeStr = values.join(',');
  handleQuery();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('wms/inventoryMovement/container/diff/export', { ...queryParams.value }, `container_diff_${new Date().getTime()}.xlsx`);
};

onMounted(() => {
  const tenantId = localStorage.getItem('tenantId');
  queryParams.value.warehouseCode = tenantId === '000000' ? 'CN00' : 'CN10';
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

.container-difference-header-card {
  overflow: visible;
}

.container-difference-header-card :deep(.el-card__body) {
  overflow: visible;
}
</style>
