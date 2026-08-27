<template>
  <el-row :gutter="20">
    <el-col :span="24">
      <el-card shadow="never" class="issue-card">
        <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="auto" class="add-form">
          <div class="add-form-row">
            <el-form-item label="物料" prop="materialCode">
              <HistoryInput v-model="addForm.materialCode" :config="materialConfig" placeholder="物料号/物料描述" @keydown.enter.prevent="handleMaterialEnter">
                <template #append>
                  <el-button icon="Search" @click="showItemDialog"></el-button>
                </template>
              </HistoryInput>
            </el-form-item>
            <el-form-item label="供应商" prop="supplierCode">
              <HistoryInput v-model="addForm.supplierCode" :config="supplierConfig" placeholder="供应商/供应商名称" @keydown.enter.prevent="handleSupplierEnter">
                <template #append>
                  <el-button icon="Search" @click="showSupplierDialog"></el-button>
                </template>
              </HistoryInput>
            </el-form-item>
            <el-form-item label="发料数量" prop="issueQuantity">
              <el-input-number v-model="addForm.issueQuantity" :min="0" :precision="3" controls-position="right" />
            </el-form-item>
            <div class="add-toolbar">
              <el-form-item class="add-actions">
                <el-button type="primary" icon="Plus" @click="addToIssueList">添加明细</el-button>
                <el-button icon="Refresh" @click="resetAddForm">重置</el-button>
              </el-form-item>
              <el-form-item class="clear-actions">
                <el-button type="danger" @click="clearIssueList" :disabled="issueList.length === 0">清空列表</el-button>
              </el-form-item>
            </div>
          </div>
        </el-form>

        <el-divider class="section-divider" />

        <el-form :model="fixedIssueForm" label-width="auto" :inline="true">
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

        <el-table :data="issueList" border style="width: 100%" max-height="420">
          <el-table-column type="index" width="50" align="center" />
          <el-table-column label="物料编码" prop="materialCode" min-width="135" />
          <el-table-column label="物料描述" prop="materialDesc" show-overflow-tooltip min-width="160" />
          <el-table-column label="供应商代码" prop="supplierCode" min-width="120" />
          <el-table-column label="供应商名称" prop="supplierName" show-overflow-tooltip min-width="140" />
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
import { listItem } from '@/api/wms/item';
import { listSupplier } from '@/api/wms/supplier';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const itemDialogRef = ref<InstanceType<typeof ItemDialog>>();
const supplierDialogRef = ref<InstanceType<typeof SupplierDialog>>();
const addFormRef = ref<ElFormInstance>();
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

const addForm = ref({
  materialCode: '',
  materialDesc: '',
  supplierCode: '',
  supplierName: '',
  issueQuantity: 0,
  unit: ''
});

const addRules = {
  materialCode: [{ required: true, message: '请选择物料', trigger: 'blur' }],
  supplierCode: [{ required: true, message: '请选择供应商', trigger: 'blur' }],
  issueQuantity: [{ required: true, message: '请输入发料数量', trigger: 'change' }]
};

const materialConfig: HistoryConfig = {
  key: 'materialCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseOrderSubcontractIssueMaterial',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};
const supplierConfig: HistoryConfig = {
  key: 'supplierCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseOrderSubcontractIssueMaterial',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};
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

const showItemDialog = () => {
  itemDialogRef.value?.openDialog();
  itemDialogRef.value?.handleQuery();
};

const itemSelectCallBack = (record: any) => {
  addForm.value.materialCode = record.item;
  addForm.value.materialDesc = record.itemDesc;
  addForm.value.unit = record.unit || '';
};

const showSupplierDialog = () => {
  supplierDialogRef.value?.openDialog();
  supplierDialogRef.value?.handleQuery();
};

const supplierSelectCallBack = (record: any) => {
  addForm.value.supplierCode = record.supplierCode;
  addForm.value.supplierName = record.supplierName;
};

const resetAddForm = () => {
  addFormRef.value?.resetFields();
  addForm.value = {
    materialCode: '',
    materialDesc: '',
    supplierCode: '',
    supplierName: '',
    issueQuantity: 0,
    unit: ''
  };
};

const addToIssueList = () => {
  addFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      return;
    }
    if (!addForm.value.issueQuantity || Number(addForm.value.issueQuantity) <= 0) {
      proxy?.$modal.msgWarning('发料数量必须大于 0');
      return;
    }
    const materialValid = await ensureMaterial();
    if (!materialValid) {
      return;
    }
    const supplierValid = await ensureSupplier();
    if (!supplierValid) {
      return;
    }
    issueList.value.push({
      issueMode: 'MATERIAL',
      materialCode: addForm.value.materialCode,
      materialDesc: addForm.value.materialDesc,
      supplierCode: addForm.value.supplierCode,
      supplierName: addForm.value.supplierName,
      issueQuantity: addForm.value.issueQuantity,
      openQuantity: addForm.value.issueQuantity,
      unit: addForm.value.unit
    });
    proxy?.$modal.msgSuccess('发料明细已添加');
    resetAddForm();
  });
};

const removeFromIssueList = (index: number) => {
  issueList.value.splice(index, 1);
};

const resolveRows = (res: any) => res?.rows ?? res?.data ?? res ?? [];

const ensureMaterial = async () => {
  if (addForm.value.materialDesc) {
    return true;
  }
  const materialCode = addForm.value.materialCode?.trim();
  if (!materialCode) {
    return false;
  }
  const res = await listItem({
    pageNum: 1,
    pageSize: 10,
    item: materialCode,
    params: {}
  } as any);
  const rows = resolveRows(res);
  const material = rows.find((item: any) => item.item === materialCode) ?? rows[0];
  if (!material) {
    proxy?.$modal.msgWarning(`物料 ${materialCode} 不存在`);
    return false;
  }
  addForm.value.materialCode = material.item || materialCode;
  addForm.value.materialDesc = material.itemDesc || '';
  addForm.value.unit = material.unit || '';
  return true;
};

const ensureSupplier = async () => {
  if (addForm.value.supplierName) {
    return true;
  }
  const supplierCode = addForm.value.supplierCode?.trim();
  if (!supplierCode) {
    return false;
  }
  const res = await listSupplier({
    pageNum: 1,
    pageSize: 10,
    supplierCode,
    params: {}
  });
  const rows = resolveRows(res);
  const supplier = rows.find((item: any) => item.supplierCode === supplierCode) ?? rows[0];
  if (!supplier) {
    proxy?.$modal.msgWarning(`供应商 ${supplierCode} 不存在`);
    return false;
  }
  addForm.value.supplierCode = supplier.supplierCode || supplierCode;
  addForm.value.supplierName = supplier.supplierName || '';
  return true;
};

const handleMaterialEnter = async () => {
  if (!addForm.value.materialDesc) {
    await ensureMaterial();
  }
};

const handleSupplierEnter = async () => {
  if (!addForm.value.supplierName) {
    await ensureSupplier();
  }
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
.add-form {
  margin-bottom: 8px;
}
.add-form-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}
.add-form-row :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 12px;
}
.add-form-row :deep(.el-form-item__content) {
  min-width: 220px;
}
.add-toolbar {
  display: flex;
  flex: 1;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  min-width: 260px;
}
.add-actions :deep(.el-form-item__content) {
  min-width: auto;
}
.clear-actions :deep(.el-form-item__content) {
  min-width: auto;
}
.section-divider {
  margin: 16px 0;
}
.m-y-2 {
  margin: 8px 0;
}
@media (max-width: 768px) {
  .add-toolbar {
    width: 100%;
  }
}
</style>
