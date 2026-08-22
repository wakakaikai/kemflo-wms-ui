<template>
  <el-row :gutter="20">
    <el-col :span="24">
      <el-card shadow="never" class="search-card history-card" :class="{ 'is-history-collapsed': !historyExpanded }">
        <template #header>
          <div class="history-card-header">
            <div class="history-header-left" @click="historyExpanded = !historyExpanded">
              <el-icon class="history-collapse-icon" :class="{ 'is-expanded': historyExpanded }">
                <ArrowRight />
              </el-icon>
              <span class="history-header-title">采购单 BOM 发料（PO+物料+供应商）</span>
            </div>
            <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
          </div>
        </template>

        <div v-show="historyExpanded" class="history-card-body">
          <el-form v-show="showSearch" ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="采购单号" prop="poNumber">
              <HistoryInput v-model="queryParams.poNumber" :config="poNumberConfig" placeholder="请输入采购单号" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="项次" prop="itemNumber">
              <HistoryInput v-model="queryParams.itemNumber" :config="itemNoConfig" placeholder="请输入项次" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="组件物料" prop="componentMaterial">
              <HistoryInput v-model="queryParams.componentMaterial" :config="materialConfig" placeholder="请输入组件物料" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="显示已发货" prop="showOpenQuantityZero">
              <el-checkbox v-model="queryParams.showOpenQuantityZero" @change="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery" :loading="loading">查询</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="search-result">
            <el-table ref="bomTableRef" :data="bomList" height="300" border v-loading="loading" @selection-change="handleSelectionChange">
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column v-if="columns[0].visible" label="采购单号" align="left" prop="poNumber" fixed="left" min-width="120" />
              <el-table-column v-if="columns[1].visible" label="项次" align="left" prop="itemNumber" fixed="left" min-width="80" />
              <el-table-column v-if="columns[2].visible" label="组件物料" align="left" prop="componentMaterial" min-width="135" />
              <el-table-column v-if="columns[3].visible" label="物料描述" align="left" prop="componentDesc" show-overflow-tooltip min-width="140" />
              <el-table-column v-if="columns[4].visible" label="需求数量" align="right" prop="componentQty" min-width="100" />
              <el-table-column v-if="columns[5].visible" label="已发数量" align="right" prop="receivedQuantity" min-width="100" />
              <el-table-column v-if="columns[6].visible" label="待发数量" align="right" prop="componentQty" min-width="100" />
              <el-table-column v-if="columns[7].visible" label="单位" align="center" prop="orderUnit" min-width="70" />
              <el-table-column v-if="columns[8].visible" label="供应商代码" align="center" prop="supplierCode" min-width="120" />
              <el-table-column v-if="columns[9].visible" label="供应商名称" align="center" prop="supplierName" show-overflow-tooltip min-width="120" />
            </el-table>
            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
          </div>
        </div>
      </el-card>
    </el-col>

    <div style="margin: 20px 0; text-align: center; width: 100%">
      <el-button type="primary" @click="addSelectedToIssueList" circle class="rotate-button">
        <el-icon><Switch /></el-icon>
      </el-button>
    </div>

    <el-col :span="24">
      <el-card shadow="never" class="transfer-main-card" :class="{ 'is-transfer-collapsed': !transferExpanded }">
        <template #header>
          <div class="transfer-header">
            <div class="history-header-left" @click="transferExpanded = !transferExpanded">
              <el-icon class="history-collapse-icon" :class="{ 'is-expanded': transferExpanded }">
                <ArrowRight />
              </el-icon>
              <span class="header-title">发料清单</span>
            </div>
            <div class="header-actions" @click.stop>
              <el-button type="danger" @click="clearIssueList" :disabled="issueList.length === 0">清空列表</el-button>
            </div>
          </div>
        </template>

        <div v-show="transferExpanded" class="transfer-card-body">
          <el-form :model="fixedIssueForm" ref="fixedIssueFormRef" label-width="auto" :inline="true">
            <el-row :gutter="20">
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="抬头文本" prop="bktxt">
                  <HistoryInput v-model="fixedIssueForm.bktxt" :config="bktxtConfig" placeholder="请输入抬头文本" />
                </el-form-item>
              </el-col>
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="物料单" prop="mtsnr">
                  <HistoryInput v-model="fixedIssueForm.mtsnr" :config="mtsnrConfig" placeholder="请输入物料单" />
                </el-form-item>
              </el-col>
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="过账日期" prop="postingDate">
                  <el-date-picker clearable v-model="fixedIssueForm.postingDate" type="date" :disabled-date="disabledFutureDate" value-format="YYYY-MM-DD" placeholder="请选择过账日期" />
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

          <el-table :data="issueList" border style="width: 100%" v-loading="tableLoading" max-height="400">
            <el-table-column type="index" width="50" align="center" />
            <el-table-column label="物料编码" prop="materialCode" min-width="135" />
            <el-table-column label="物料描述" prop="materialDesc" show-overflow-tooltip min-width="140" />
            <el-table-column label="供应商" prop="supplierCode" min-width="110" />
            <el-table-column label="供应商" prop="supplierName" show-overflow-tooltip min-width="110" />
            <el-table-column label="库存来源" min-width="180">
              <template #default="scope">
                <div v-if="scope.row.locationCode">
                  <div>仓库: {{ scope.row.warehouseCode || '-' }}</div>
                  <div>库位: {{ scope.row.locationCode || '-' }}</div>
                  <div>批次: {{ scope.row.batchCode || '-' }}</div>
                </div>
                <el-tag v-else type="warning" size="small">未选择库存</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="待发数量" prop="openQuantity" min-width="100" />
            <el-table-column label="可用库存" align="right" min-width="100">
              <template #default="scope">
                {{ scope.row.inventoryAvailableQuantity ?? '-' }}
              </template>
            </el-table-column>
            <el-table-column label="发料数量" align="center" width="160">
              <template #default="scope">
                <el-input-number v-model="scope.row.issueQuantity" :min="0" :max="resolveIssueQuantityMax(scope.row)" :precision="3" size="small" controls-position="right" />
              </template>
            </el-table-column>
            <el-table-column label="单位" prop="unit" width="70" />
            <el-table-column label="操作" width="130" align="center">
              <template #default="scope">
                <el-button type="primary" link icon="Search" @click="openInventoryDialog(scope.$index, scope.row)">选库存</el-button>
                <el-button type="danger" link icon="Delete" @click="removeFromIssueList(scope.$index)"></el-button>
              </template>
            </el-table-column>
          </el-table>

          <div style="margin-top: 20px; text-align: center">
            <el-button :loading="buttonLoading" type="primary" @click="submitForm" :disabled="issueList.length === 0" v-hasPermi="['wms:purchaseOrder:subcontractIssue']">541发料</el-button>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>

  <InventorySelectionDialog
    v-model="inventoryDialogVisible"
    :material-code="inventoryDialogMaterial.materialCode"
    :material-desc="inventoryDialogMaterial.materialDesc"
    :issue-qty="inventoryDialogMaterial.issueQty"
    :unit="inventoryDialogMaterial.unit"
    @confirm="handleInventoryConfirm"
  />

</template>

<script setup name="PoSubcontractIssue" lang="ts">
import { queryPoItemBomPageList, subcontractIssue } from '@/api/wms/purchaseOrderSubcontractIssue';
import { PurchaseOrderBomVO, PurchaseOrderBomQuery } from '@/api/wms/purchaseOrderSubcontractIssue/types';
import HistoryInput from '@/components/HistoryInput/index.vue';
import InventorySelectionDialog from '@/views/wms/inventoryDetail/components/InventorySelectionDialog.vue';
import { ArrowRight, Bell, Switch } from '@element-plus/icons-vue';
import { HttpStatus } from '@/enums/RespEnum';
import { HistoryConfig } from '@/types/history';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const bomList = ref<PurchaseOrderBomVO[]>([]);
const loading = ref(false);
const showSearch = ref(true);
const historyExpanded = ref(true);
const transferExpanded = ref(true);
const total = ref(0);
const resultMessage = ref('');
const resultStatus = ref(false);
const buttonLoading = ref(false);
const tableLoading = ref(false);
const selectedSearchItems = ref<PurchaseOrderBomVO[]>([]);
const issueList = ref<any[]>([]);
const inventoryDialogVisible = ref(false);
const inventoryDialogIndex = ref(-1);
const inventoryDialogMaterial = ref({
  materialCode: '',
  materialDesc: '',
  issueQty: 0,
  unit: ''
});
const fixedIssueForm = ref({
  bktxt: '',
  postingDate: null as string | null,
  mtsnr: ''
});
const queryFormRef = ref<ElFormInstance>();
const bomTableRef = ref<ElTableInstance>();

const queryParams = ref<PurchaseOrderBomQuery>({
  pageNum: 1,
  pageSize: 10,
  poNumber: undefined,
  itemNumber: undefined,
  componentMaterial: undefined,
  showOpenQuantityZero: false,
  params: {}
});

const poNumberConfig: HistoryConfig = {
  key: 'poNumber',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseOrderSubcontractIssue',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};
const itemNoConfig: HistoryConfig = {
  key: 'itemNo',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseOrderSubcontractIssue',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};
const materialConfig: HistoryConfig = {
  key: 'componentMaterial',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseOrderSubcontractIssue',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};
const bktxtConfig: HistoryConfig = {
  key: 'bktxt',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseOrderSubcontractIssue',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};
const mtsnrConfig: HistoryConfig = {
  key: 'mtsnr',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseOrderSubcontractIssue',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};

const columns = ref<FieldOption[]>([
  { key: 0, label: `采购单号`, visible: true, children: [] },
  { key: 1, label: `项次`, visible: true, children: [] },
  { key: 2, label: `组件物料`, visible: true, children: [] },
  { key: 3, label: `物料描述`, visible: true, children: [] },
  { key: 4, label: `需求数量`, visible: true, children: [] },
  { key: 5, label: `已发数量`, visible: true, children: [] },
  { key: 6, label: `待发数量`, visible: true, children: [] },
  { key: 7, label: `单位`, visible: true, children: [] },
  { key: 8, label: `供应商代码`, visible: true, children: [] },
  { key: 9, label: `供应商名称`, visible: true, children: [] }
]);

const disabledFutureDate = (time: Date) => {
  const now = new Date();
  now.setSeconds(now.getSeconds() + 3);
  return time.getTime() > now.getTime();
};

const getList = async () => {
  loading.value = true;
  try {
    const res = await queryPoItemBomPageList(queryParams.value);
    bomList.value = res.rows;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  bomTableRef.value?.clearSelection();
  handleQuery();
};

const handleSelectionChange = (selection: PurchaseOrderBomVO[]) => {
  selectedSearchItems.value = selection;
};

const addSelectedToIssueList = () => {
  if (selectedSearchItems.value.length === 0) {
    proxy?.$modal.msgWarning('请先选择需要发料的 BOM 行');
    return;
  }
  const missingSupplier = selectedSearchItems.value.filter((item) => !item.supplierCode);
  if (missingSupplier.length > 0) {
    proxy?.$modal.msgWarning('选中行存在未维护供应商的物料，请先维护供应商');
    return;
  }
  const newItems = selectedSearchItems.value.map((item) => ({
    issueMode: 'PO',
    poNumber: item.poNumber,
    itemNumber: item.itemNumber,
    materialCode: item.componentMaterial,
    materialDesc: item.componentDesc,
    supplierCode: item.supplierCode,
    supplierName: item.supplierName,
    openQuantity: item.openQuantity ?? item.componentQty ?? 0,
    issueQuantity: undefined,
    unit: item.orderUnit || item.inventoryUnit
  }));
  issueList.value.push(...newItems);
  proxy?.$modal.msgSuccess(`已添加 ${newItems.length} 条发料明细`);
  bomTableRef.value?.clearSelection();
};

const removeFromIssueList = (index: number) => {
  issueList.value.splice(index, 1);
};

const resolveIssueQuantityMax = (row: any) => {
  const available = Number(row.inventoryAvailableQuantity ?? 0);
  return available > 0 ? available : undefined;
};

const openInventoryDialog = (index: number, row: any) => {
  inventoryDialogIndex.value = index;
  inventoryDialogMaterial.value = {
    materialCode: row.materialCode || '',
    materialDesc: row.materialDesc || '',
    issueQty: Number(row.issueQuantity ?? row.openQuantity ?? 0),
    unit: row.unit || ''
  };
  inventoryDialogVisible.value = true;
};

const handleInventoryConfirm = ({ locations }: { locations: any[] }) => {
  const index = inventoryDialogIndex.value;
  const source = issueList.value[index];
  if (!source || !locations?.length) {
    return;
  }

  const splitRows = locations.map((location, locationIndex) => ({
    ...source,
    issueQuantity: Number(location.pickQty ?? 0),
    unit: location.unit || source.unit,
    warehouseCode: location.warehouseCode,
    areaCode: location.areaCode,
    locationCode: location.locationCode,
    batchCode: location.batchCode,
    specialInventoryFlag: location.specialInventoryFlag || 'N',
    inventoryAvailableQuantity: Number(location.availableQuantity ?? 0),
    inventoryRowId: location.id,
    inventorySplitKey: `${source.poNumber || ''}_${source.itemNumber || ''}_${source.materialCode || ''}_${location.rowKey || locationIndex}`
  }));

  issueList.value.splice(index, 1, ...splitRows);
  inventoryDialogIndex.value = -1;
};

const clearIssueList = () => {
  issueList.value = [];
  fixedIssueForm.value.bktxt = '';
  fixedIssueForm.value.postingDate = null;
  fixedIssueForm.value.mtsnr = '';
};

const submitForm = async () => {
  const validList = issueList.value.filter((item) => Number(item.issueQuantity) > 0);
  resultStatus.value = true;
  resultMessage.value = '';
  if (validList.length === 0) {
    resultMessage.value = '发料数量必须大于 0';
    resultStatus.value = false;
    return;
  }
  const missingInventory = validList.filter((item) => !item.locationCode);
  if (missingInventory.length > 0) {
    resultMessage.value = '请先为所有发料明细选择库存';
    resultStatus.value = false;
    return;
  }
  const overInventory = validList.filter((item) => Number(item.inventoryAvailableQuantity ?? 0) > 0 && Number(item.issueQuantity ?? 0) > Number(item.inventoryAvailableQuantity ?? 0));
  if (overInventory.length > 0) {
    resultMessage.value = '发料数量不能大于所选库位可用库存';
    resultStatus.value = false;
    return;
  }
  const submitList = validList.map((item) => ({
    ...item,
    postingDate: fixedIssueForm.value.postingDate ? fixedIssueForm.value.postingDate + ' 00:00:00' : undefined
  }));

  buttonLoading.value = true;
  try {
    const res: any = await subcontractIssue({
      purchaseOrderSubcontractIssueBoList: submitList,
      postingDate: fixedIssueForm.value.postingDate ? fixedIssueForm.value.postingDate + ' 00:00:00' : undefined,
      mtsnr: fixedIssueForm.value.mtsnr || undefined,
      bktxt: fixedIssueForm.value.bktxt || undefined
    });
    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg;
      resultStatus.value = false;
      return;
    }
    resultMessage.value = res.msg || `发料成功，共 ${submitList.length} 条`;
    resultStatus.value = true;
    clearIssueList();
    handleQuery();
  } catch (error: any) {
    resultMessage.value = error.message || '提交发料失败';
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
.history-card.is-history-collapsed :deep(.el-card__body),
.transfer-main-card.is-transfer-collapsed :deep(.el-card__body) {
  display: none;
}
.history-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.history-header-left {
  display: inline-flex;
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
.transfer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.rotate-button {
  transform: rotate(90deg);
}
.m-y-2 {
  margin: 8px 0;
}
</style>
