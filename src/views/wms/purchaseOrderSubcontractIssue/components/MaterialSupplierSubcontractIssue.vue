<template>
  <el-row :gutter="20">
    <el-col :span="24">
      <el-card shadow="never" class="issue-card">
        <template #header>
          <div class="issue-card-header">
            <span class="header-title">物料+供应商发料</span>
            <el-button type="danger" @click="clearIssueList" :disabled="issueList.length === 0">清空列表</el-button>
          </div>
        </template>

        <el-form :model="fixedIssueForm" label-width="auto" :inline="true">
          <el-row :gutter="20">
            <el-col :sm="24" :md="8" :lg="8">
              <el-form-item label="物料单" prop="mtsnr">
                <HistoryInput v-model="fixedIssueForm.mtsnr" :config="mtsnrConfig" placeholder="请输入物料单" />
              </el-form-item>
            </el-col>
            <el-col :sm="24" :md="8" :lg="8">
              <el-form-item label="抬头文本" prop="bktxt">
                <HistoryInput v-model="fixedIssueForm.bktxt" :config="bktxtConfig" placeholder="请输入抬头文本" />
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

        <el-table :data="issueList" border style="width: 100%" max-height="420">
          <el-table-column type="index" width="50" align="center" />
          <el-table-column label="物料编码" min-width="135">
            <template #default="scope">
              <el-link type="primary" :underline="false" @click="openItemDialog(scope.row)">
                {{ scope.row.materialCode || '选择物料' }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column label="物料描述" prop="materialDesc" show-overflow-tooltip min-width="160" />
          <el-table-column label="供应商代码" min-width="120">
            <template #default="scope">
              <el-link type="primary" :underline="false" @click="openSupplierDialog(scope.row)">
                {{ scope.row.supplierCode || '选择供应商' }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column label="供应商名称" prop="supplierName" show-overflow-tooltip min-width="140" />
          <el-table-column label="库存来源" min-width="200">
            <template #default="scope">
              <div class="inventory-source-cell">
                <div v-if="scope.row.locationCode">
                  <div>仓库: {{ scope.row.warehouseCode || '-' }}</div>
                  <div>库位: {{ scope.row.locationCode || '-' }}</div>
                  <div>批次: {{ scope.row.batchCode || '-' }}</div>
                </div>
                <el-tag v-else type="warning" size="small">未选择库存</el-tag>
                <el-button type="primary" link icon="Search" @click="openInventoryDialog(scope.$index, scope.row)"></el-button>
              </div>
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
              <el-input-number v-model="scope.row.issueQuantity" :min="0" :max="resolveIssueQuantityMax(scope.row)" :precision="3" size="small" controls-position="right" @change="handleIssueQuantityChange(scope.row)" />
            </template>
          </el-table-column>
          <el-table-column label="单位" prop="unit" width="70" />
          <el-table-column label="操作" width="80" align="center">
            <template #default="scope">
              <el-button type="danger" link icon="Delete" @click="removeFromIssueList(scope.$index)"></el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="list-footer-actions">
          <el-button type="primary" circle icon="Plus" @click="addManualIssueRow" />
        </div>

        <div style="margin-top: 20px; text-align: center">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm" :disabled="issueList.length === 0" v-hasPermi="['wms:purchaseOrder:subcontractIssue']">541发料</el-button>
        </div>
      </el-card>
    </el-col>
  </el-row>

  <ItemDialog ref="itemDialogRef" @item-select-call-back="itemSelectCallBack" />
  <SupplierDialog ref="supplierDialogRef" @supplier-select-call-back="supplierSelectCallBack" />
  <InventorySelectionDialog
    v-model="inventoryDialogVisible"
    :material-code="inventoryDialogMaterial.materialCode"
    :material-desc="inventoryDialogMaterial.materialDesc"
    :issue-qty="inventoryDialogMaterial.issueQty"
    :unit="inventoryDialogMaterial.unit"
    @confirm="handleInventoryConfirm"
  />
</template>

<script setup name="MaterialSupplierSubcontractIssue" lang="ts">
import { subcontractIssue } from '@/api/wms/purchaseOrderSubcontractIssue';
import HistoryInput from '@/components/HistoryInput/index.vue';
import ItemDialog from '@/views/wms/item/components/itemDialog.vue';
import SupplierDialog from '@/views/wms/supplier/components/SupplierDialog.vue';
import InventorySelectionDialog from '@/views/wms/inventoryDetail/components/InventorySelectionDialog.vue';
import { Bell } from '@element-plus/icons-vue';
import { HttpStatus } from '@/enums/RespEnum';
import { HistoryConfig } from '@/types/history';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const itemDialogRef = ref<InstanceType<typeof ItemDialog>>();
const supplierDialogRef = ref<InstanceType<typeof SupplierDialog>>();
const currentItemRow = ref<any>(null);
const currentSupplierRow = ref<any>(null);
const resultMessage = ref('');
const resultStatus = ref(false);
const buttonLoading = ref(false);
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

const bktxtConfig: HistoryConfig = {
  key: 'bktxt',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseOrderSubcontractIssueMaterial',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};
const mtsnrConfig: HistoryConfig = {
  key: 'mtsnr',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseOrderSubcontractIssueMaterial',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};

const disabledFutureDate = (time: Date) => {
  const now = new Date();
  now.setSeconds(now.getSeconds() + 3);
  return time.getTime() > now.getTime();
};

function formatPostingDate(postingDate?: string | null): string | undefined {
  if (!postingDate) {
    return undefined;
  }
  return postingDate.includes(' ') ? postingDate : `${postingDate} 00:00:00`;
}

const createEmptyIssueRow = () => ({
  id: `manual_${Date.now()}_${issueList.value.length}`,
  issueMode: 'MATERIAL',
  manualAdd: true,
  materialCode: '',
  materialDesc: '',
  supplierCode: '',
  supplierName: '',
  issueQuantity: undefined,
  openQuantity: undefined,
  unit: ''
});

const addManualIssueRow = () => {
  issueList.value.push(createEmptyIssueRow());
};

const openItemDialog = (row: any) => {
  currentItemRow.value = row;
  itemDialogRef.value?.openDialog();
  itemDialogRef.value?.handleQuery();
};

const itemSelectCallBack = (record: any) => {
  const row = currentItemRow.value;
  if (!row || !record) {
    return;
  }
  row.materialCode = record.item || '';
  row.materialDesc = record.itemDesc || '';
  row.unit = record.unit || '';
  currentItemRow.value = null;
};

const openSupplierDialog = (row: any) => {
  currentSupplierRow.value = row;
  supplierDialogRef.value?.openDialog();
  supplierDialogRef.value?.handleQuery();
};

const supplierSelectCallBack = (record: any) => {
  const row = currentSupplierRow.value;
  if (!row || !record) {
    return;
  }
  row.supplierCode = record.supplierCode || '';
  row.supplierName = record.supplierName || '';
  currentSupplierRow.value = null;
};

const removeFromIssueList = (index: number) => {
  issueList.value.splice(index, 1);
};

const handleIssueQuantityChange = (row: any) => {
  row.openQuantity = row.issueQuantity;
};

const resolveIssueQuantityMax = (row: any) => {
  const available = Number(row.inventoryAvailableQuantity ?? 0);
  return available > 0 ? available : undefined;
};

const openInventoryDialog = (index: number, row: any) => {
  if (!String(row.materialCode || '').trim()) {
    proxy?.$modal.msgWarning('请先选择物料');
    return;
  }
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
    openQuantity: Number(location.pickQty ?? 0),
    unit: location.unit || source.unit,
    warehouseCode: location.warehouseCode,
    areaCode: location.areaCode,
    locationCode: location.locationCode,
    batchCode: location.batchCode,
    specialInventoryFlag: location.specialInventoryFlag || 'N',
    inventoryAvailableQuantity: Number(location.availableQuantity ?? 0),
    inventoryRowId: location.id,
    inventorySplitKey: `${source.materialCode || ''}_${source.supplierCode || ''}_${location.rowKey || locationIndex}`
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
  const missingMaterial = validList.filter((item) => !String(item.materialCode || '').trim());
  if (missingMaterial.length > 0) {
    resultMessage.value = '请先为所有发料明细选择物料';
    resultStatus.value = false;
    return;
  }
  const missingSupplier = validList.filter((item) => !String(item.supplierCode || '').trim());
  if (missingSupplier.length > 0) {
    resultMessage.value = '请先为所有发料明细选择供应商';
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
    postingDate: formatPostingDate(fixedIssueForm.value.postingDate)
  }));

  buttonLoading.value = true;
  try {
    const res: any = await subcontractIssue({
      purchaseOrderSubcontractIssueBoList: submitList,
      postingDate: formatPostingDate(fixedIssueForm.value.postingDate),
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
  } catch (error: any) {
    resultMessage.value = error.message || '提交发料失败';
    resultStatus.value = false;
  } finally {
    buttonLoading.value = false;
  }
};
</script>

<style scoped>
.issue-card {
  width: 100%;
}
.issue-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-title {
  font-size: 16px;
  font-weight: 600;
}
.m-y-2 {
  margin: 8px 0;
}
.inventory-source-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.list-footer-actions {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}
</style>
