<template>
  <div class="p-2 packing-return-page">
    <el-card shadow="never" class="history-card" :class="{ 'is-history-collapsed': !historyExpanded }">
      <template #header>
        <div class="history-card-header">
          <div class="history-header-left" @click="historyExpanded = !historyExpanded">
            <el-icon class="history-collapse-icon" :class="{ 'is-expanded': historyExpanded }">
              <ArrowRight />
            </el-icon>
            <span class="history-header-title">打包明细</span>
          </div>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList" />
        </div>
      </template>

      <div v-show="historyExpanded" class="history-card-body">
        <el-form v-show="showSearch" ref="queryFormRef" :model="queryParams" label-width="auto" class="packing-return-search-form">
          <el-row :gutter="16">
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="栈板编号" prop="palletCode">
                <HistoryInput v-model="queryParams.palletCode" :config="palletCodeConfig" placeholder="请输入栈板编号" @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="打包编号" prop="packingCode">
                <HistoryInput v-model="queryParams.packingCode" :config="packingCodeConfig" placeholder="请输入打包编号" @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="工单号" prop="workOrderNo">
                <HistoryInput v-model="queryParams.workOrderNo" :config="workOrderNoConfig" placeholder="请输入工单号" @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="标签码" prop="sn">
                <HistoryInput v-model="queryParams.sn" :config="snConfig" placeholder="请输入标签码" @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="料号" prop="item">
                <HistoryInput v-model="queryParams.item" :config="itemConfig" placeholder="请输入料号" @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item class="search-actions">
                <el-button type="primary" icon="Search" :loading="loading" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <div class="search-result">
          <el-table
            ref="packingTableRef"
            v-loading="loading"
            :data="packingDetailList"
            height="300"
            border
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" align="center" :selectable="isRowSelectable" />
            <el-table-column v-if="columns[0].visible" label="打包编号" align="center" prop="packingCode" min-width="140" />
            <el-table-column v-if="columns[1].visible" label="栈板编号" align="center" prop="palletCode" min-width="120" />
            <el-table-column v-if="columns[2].visible" label="工单号" align="center" prop="workOrderNo" min-width="120" />
            <el-table-column v-if="columns[3].visible" label="标签码" align="center" prop="sn" min-width="130" />
            <el-table-column v-if="columns[4].visible" label="料号" align="center" prop="item" min-width="140" />
            <el-table-column v-if="columns[5].visible" label="数量" align="center" prop="packingQty" width="100" />
            <el-table-column v-if="columns[6].visible" label="物料凭证号" align="center" prop="materialOrderNo" min-width="120" />
            <el-table-column v-if="columns[7].visible" label="凭证项次" align="center" prop="materialItem" width="90" />
            <el-table-column v-if="columns[8].visible" label="凭证年度" align="center" prop="materialDocYear" width="90" />
          </el-table>
          <pagination
            v-show="total > 0"
            :total="total"
            v-model:page="queryParams.pageNum"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </div>
    </el-card>

    <div class="add-transfer-bar">
      <el-button type="primary" circle class="rotate-button" :disabled="selectedItems.length === 0" @click="addSelectedToReturnList">
        <el-icon><Switch /></el-icon>
      </el-button>
    </div>

    <el-card shadow="never" class="transfer-main-card" :class="{ 'is-transfer-collapsed': !transferExpanded }">
      <template #header>
        <div class="transfer-header">
          <div class="history-header-left" @click="transferExpanded = !transferExpanded">
            <el-icon class="history-collapse-icon" :class="{ 'is-expanded': transferExpanded }">
              <ArrowRight />
            </el-icon>
            <span class="header-title">退货列表</span>
          </div>
          <div class="header-actions" @click.stop>
            <el-button type="danger" :disabled="returnList.length === 0" @click="clearReturnList">清空列表</el-button>
          </div>
        </div>
      </template>

      <div v-show="transferExpanded" class="transfer-card-body">
        <div v-if="resultMessage" class="m-y-2">
          <el-alert show-icon center :title="resultMessage" :type="resultStatus ? 'success' : 'error'" :closable="true" />
        </div>

        <el-table :data="returnList" border max-height="400" style="width: 100%">
          <el-table-column type="index" width="50" align="center" />
          <el-table-column label="打包编号" align="center" prop="packingCode" min-width="140" />
          <el-table-column label="栈板编号" align="center" prop="palletCode" min-width="120" />
          <el-table-column label="工单号" align="center" prop="workOrderNo" min-width="120" />
          <el-table-column label="标签码" align="center" prop="sn" min-width="130" />
          <el-table-column label="料号" align="center" prop="item" min-width="140" />
          <el-table-column label="数量" align="center" prop="packingQty" width="100" />
          <el-table-column label="物料凭证号" align="center" prop="materialOrderNo" min-width="120" />
          <el-table-column label="凭证项次" align="center" prop="materialItem" width="90" />
          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template #default="scope">
              <el-button type="danger" link icon="Delete" @click="removeFromReturnList(scope.$index)" />
            </template>
          </el-table-column>
        </el-table>

        <div class="submit-bar">
          <el-button
            v-hasPermi="['wms:packingDetail:return']"
            type="primary"
            :loading="buttonLoading"
            :disabled="returnList.length === 0"
            @click="submitReturn"
          >
            提交退货
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup name="ProductionReturn" lang="ts">
import { reactive, ref } from 'vue';
import { ArrowRight, Switch } from '@element-plus/icons-vue';
import { listPackingDetail, returnPackingDetail } from '@/api/wms/packingDetail';
import { PackingDetailQuery, PackingDetailVO } from '@/api/wms/packingDetail/types';
import { HttpStatus } from '@/enums/RespEnum';
import HistoryInput from '@/components/HistoryInput/index.vue';
import { HistoryConfig } from '@/types/history';

const props = withDefaults(
  defineProps<{
    historyPage?: string;
  }>(),
  {
    historyPage: 'inventoryReturn'
  }
);

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const showSearch = ref(true);
const historyExpanded = ref(true);
const transferExpanded = ref(true);
const loading = ref(false);
const buttonLoading = ref(false);
const packingDetailList = ref<PackingDetailVO[]>([]);
const selectedItems = ref<PackingDetailVO[]>([]);
const returnList = ref<PackingDetailVO[]>([]);
const total = ref(0);
const resultMessage = ref('');
const resultStatus = ref(false);

const queryFormRef = ref<ElFormInstance>();
const packingTableRef = ref();

const queryParams = reactive<PackingDetailQuery>({
  pageNum: 1,
  pageSize: 100,
  packingCode: undefined,
  palletCode: undefined,
  workOrderNo: undefined,
  sn: undefined,
  item: undefined,
  params: {}
});

const historyComponentConfig = {
  showDropdown: true,
  showTime: false,
  showDelete: true,
  dropdownMaxHeight: '300px'
};

const palletCodeConfig: HistoryConfig = {
  key: 'palletCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: props.historyPage,
  autoSave: true,
  component: historyComponentConfig
};

const packingCodeConfig: HistoryConfig = {
  key: 'packingCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: props.historyPage,
  autoSave: true,
  component: historyComponentConfig
};

const workOrderNoConfig: HistoryConfig = {
  key: 'workOrderNo',
  storage: 'indexedDB',
  maxSize: 10,
  page: props.historyPage,
  autoSave: true,
  component: historyComponentConfig
};

const snConfig: HistoryConfig = {
  key: 'sn',
  storage: 'indexedDB',
  maxSize: 10,
  page: props.historyPage,
  autoSave: true,
  component: historyComponentConfig
};

const itemConfig: HistoryConfig = {
  key: 'item',
  storage: 'indexedDB',
  maxSize: 10,
  page: props.historyPage,
  autoSave: true,
  component: historyComponentConfig
};

const columns = ref<FieldOption[]>([
  { key: 0, label: '打包编号', visible: true, children: [] },
  { key: 1, label: '栈板编号', visible: true, children: [] },
  { key: 2, label: '工单号', visible: true, children: [] },
  { key: 3, label: '标签码', visible: true, children: [] },
  { key: 4, label: '料号', visible: true, children: [] },
  { key: 5, label: '数量', visible: true, children: [] },
  { key: 6, label: '物料凭证号', visible: true, children: [] },
  { key: 7, label: '凭证项次', visible: true, children: [] },
  { key: 8, label: '凭证年度', visible: true, children: [] }
]);

const isRowSelectable = (row: PackingDetailVO) => Number(row.packingQty) > 0;

const getList = async () => {
  loading.value = true;
  try {
    const res = await listPackingDetail(queryParams);
    packingDetailList.value = res.rows;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  packingTableRef.value?.clearSelection();
  selectedItems.value = [];
  handleQuery();
};

const handleSelectionChange = (selection: PackingDetailVO[]) => {
  selectedItems.value = selection.filter((item) => isRowSelectable(item));
};

const addSelectedToReturnList = () => {
  if (selectedItems.value.length === 0) {
    proxy?.$modal.msgWarning('请先选择要退货的打包明细');
    return;
  }

  let addedCount = 0;
  selectedItems.value.forEach((item) => {
    const exists = returnList.value.some((row) => row.id === item.id);
    if (!exists) {
      returnList.value.push({ ...item });
      addedCount++;
    }
  });

  if (addedCount > 0) {
    proxy?.$modal.msgSuccess(`成功添加 ${addedCount} 条到退货列表`);
    packingTableRef.value?.clearSelection();
    selectedItems.value = [];
  } else {
    proxy?.$modal.msgWarning('选中记录已在退货列表中');
  }
};

const removeFromReturnList = (index: number) => {
  returnList.value.splice(index, 1);
};

const clearReturnList = () => {
  returnList.value = [];
  resultMessage.value = '';
  resultStatus.value = false;
};

const submitReturn = async () => {
  if (returnList.value.length === 0) {
    proxy?.$modal.msgWarning('请先将打包明细加入退货列表');
    return;
  }

  try {
    await proxy?.$modal.confirm(`确认对退货列表中的 ${returnList.value.length} 条打包明细提交退货？`);
  } catch {
    return;
  }

  buttonLoading.value = true;
  resultMessage.value = '';
  try {
    const ids = returnList.value.map((item) => item.id);
    const res: any = await returnPackingDetail(ids);
    if (res.code !== HttpStatus.SUCCESS) {
      resultStatus.value = false;
      resultMessage.value = res.msg || '退货失败';
      return;
    }
    resultStatus.value = true;
    resultMessage.value = res.msg || res.data || `成功退货${ids.length}条`;
    returnList.value = [];
    packingTableRef.value?.clearSelection();
    selectedItems.value = [];
    await getList();
  } catch (error: any) {
    resultStatus.value = false;
    resultMessage.value = error.message || '退货失败';
  } finally {
    buttonLoading.value = false;
  }
};

onMounted(() => {
  getList();
});
</script>

<style scoped>
.packing-return-page {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-card {
  flex: 0 0 auto;
}

.history-card :deep(.el-card__header) {
  padding: 10px 16px;
}

.history-card :deep(.el-card__body) {
  padding: 0;
}

.history-card.is-history-collapsed :deep(.el-card__body) {
  display: none;
}

.history-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.history-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.history-collapse-icon {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  transition: transform 0.2s;
}

.history-collapse-icon.is-expanded {
  transform: rotate(90deg);
}

.history-header-title {
  font-size: 14px;
  font-weight: 600;
}

.history-card-body {
  padding: 12px 16px 16px;
}

.packing-return-search-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.packing-return-search-form :deep(.el-form-item__content) {
  flex: 1;
}

.packing-return-search-form .search-actions :deep(.el-form-item__content) {
  flex-wrap: wrap;
}

.search-result {
  overflow: auto;
}

.add-transfer-bar {
  text-align: center;
  padding: 4px 0;
}

.rotate-button {
  transform: rotate(90deg);
}

.transfer-main-card {
  flex: 1 1 auto;
}

.transfer-main-card :deep(.el-card__header) {
  padding: 10px 16px;
}

.transfer-main-card.is-transfer-collapsed :deep(.el-card__body) {
  display: none;
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
}

.submit-bar {
  margin-top: 20px;
  text-align: center;
}

.m-y-2 {
  margin: 8px 0;
}
</style>
