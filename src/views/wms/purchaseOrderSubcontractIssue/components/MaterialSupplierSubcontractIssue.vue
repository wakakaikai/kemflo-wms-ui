<template>
  <el-row :gutter="20">
    <el-col :span="24">
      <el-card shadow="never" class="search-card">
        <template #header>
          <span>物料 + 供应商发料</span>
        </template>

        <el-form ref="addFormRef" :model="addForm" :rules="addRules" :inline="true" label-width="auto">
          <el-form-item label="物料" prop="materialCode">
            <HistoryInput v-model="addForm.materialCode" :config="materialConfig" placeholder="物料号/物料描述">
              <template #append>
                <el-button icon="Search" @click="showItemDialog"></el-button>
              </template>
            </HistoryInput>
          </el-form-item>
          <el-form-item label="物料描述">
            <el-input v-model="addForm.materialDesc" placeholder="物料描述" disabled style="width: 220px" />
          </el-form-item>
          <el-form-item label="供应商" prop="supplierCode">
            <HistoryInput v-model="addForm.supplierCode" :config="supplierConfig" placeholder="供应商/供应商名称">
              <template #append>
                <el-button icon="Search" @click="showSupplierDialog"></el-button>
              </template>
            </HistoryInput>
          </el-form-item>
          <el-form-item label="供应商名称">
            <el-input v-model="addForm.supplierName" placeholder="供应商名称" disabled style="width: 220px" />
          </el-form-item>
          <el-form-item label="发料数量" prop="issueQuantity">
            <el-input-number v-model="addForm.issueQuantity" :min="0" :precision="3" controls-position="right" />
          </el-form-item>
          <el-form-item label="单位">
            <el-input v-model="addForm.unit" placeholder="单位" style="width: 100px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Plus" @click="addToIssueList">添加明细</el-button>
            <el-button icon="Refresh" @click="resetAddForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-col>

    <el-col :span="24" class="mt-3">
      <el-card shadow="never">
        <template #header>
          <div class="transfer-header">
            <span class="header-title">发料清单</span>
            <div class="header-actions">
              <el-radio-group v-model="issueMode">
                <el-radio-button label="fixed">统一库位</el-radio-button>
                <el-radio-button label="multiple">按行库位</el-radio-button>
              </el-radio-group>
              <el-button type="danger" @click="clearIssueList" :disabled="issueList.length === 0">清空清单</el-button>
            </div>
          </div>
        </template>

        <el-form :model="fixedIssueForm" label-width="auto" :inline="true">
          <el-row :gutter="20">
            <el-col :sm="24" :md="8" :lg="8" v-if="issueMode === 'fixed'">
              <el-form-item label="库位编码" prop="locationCode">
                <HistoryInput
                  v-model="fixedIssueForm.locationCode"
                  :config="locationCodeConfig"
                  placeholder="请输入库位编码"
                  @keydown.tab.prevent="locationCodeKeyDownTab(fixedIssueForm.locationCode)"
                  @keydown.enter.prevent="locationCodeKeyDownTab(fixedIssueForm.locationCode)"
                >
                  <template #append>
                    <el-button icon="Search" @click="showStorageLocationDialog(-1)"></el-button>
                  </template>
                </HistoryInput>
              </el-form-item>
            </el-col>
            <el-col :sm="24" :md="8" :lg="8">
              <el-form-item label="过账日期" prop="postingDate">
                <el-date-picker clearable v-model="fixedIssueForm.postingDate" type="date" :disabled-date="disabledFutureDate" value-format="YYYY-MM-DD" placeholder="请选择过账日期" />
              </el-form-item>
            </el-col>
            <el-col :sm="24" :md="8" :lg="8">
              <el-form-item label="物料凭证" prop="mtsnr">
                <HistoryInput v-model="fixedIssueForm.mtsnr" :config="mtsnrConfig" placeholder="请输入物料凭证" />
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
          <el-table-column label="库位编码" width="220" v-if="issueMode === 'multiple'">
            <template #default="scope">
              <TableHistoryInput v-model="scope.row.locationCode" :config="locationCodeConfig" placeholder="请输入库位编码">
                <template #append>
                  <el-button icon="Search" @click="showStorageLocationDialog(scope.$index)"></el-button>
                </template>
              </TableHistoryInput>
            </template>
          </el-table-column>
          <el-table-column label="发料数量" align="center" width="160">
            <template #default="scope">
              <el-input-number v-model="scope.row.issueQuantity" :min="0" :precision="3" size="small" controls-position="right" />
            </template>
          </el-table-column>
          <el-table-column label="单位" prop="unit" width="80" />
          <el-table-column label="操作" width="80" align="center">
            <template #default="scope">
              <el-button type="danger" link icon="Delete" @click="removeFromIssueList(scope.$index)"></el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="margin-top: 20px; text-align: center">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm" :disabled="issueList.length === 0" v-hasPermi="['wms:purchaseOrder:subcontractIssue']">提交发料</el-button>
        </div>
      </el-card>
    </el-col>
  </el-row>

  <ItemDialog ref="itemDialogRef" @item-select-call-back="itemSelectCallBack" />
  <SupplierDialog ref="supplierDialogRef" @supplier-select-call-back="supplierSelectCallBack" />
  <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
</template>

<script setup name="MaterialSupplierSubcontractIssue" lang="ts">
import { subcontractIssue } from '@/api/wms/purchaseOrderSubcontractIssue';
import HistoryInput from '@/components/HistoryInput/index.vue';
import TableHistoryInput from '@/components/TableHistoryInput/index.vue';
import ItemDialog from '@/views/wms/item/components/itemDialog.vue';
import SupplierDialog from '@/views/wms/supplier/components/supplierDialog.vue';
import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import { Bell } from '@element-plus/icons-vue';
import { HttpStatus } from '@/enums/RespEnum';
import { listStorageLocation } from '@/api/wms/storageLocation';
import { HistoryConfig } from '@/types/history';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const itemDialogRef = ref<InstanceType<typeof ItemDialog>>();
const supplierDialogRef = ref<InstanceType<typeof SupplierDialog>>();
const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();
const addFormRef = ref<ElFormInstance>();
const currenIndex = ref(0);
const resultMessage = ref('');
const resultStatus = ref(false);
const buttonLoading = ref(false);
const issueList = ref<any[]>([]);
const issueMode = ref<'fixed' | 'multiple'>('fixed');
const fixedIssueForm = ref({
  locationCode: '',
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
const locationCodeConfig: HistoryConfig = {
  key: 'locationCode',
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
  addFormRef.value?.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    if (!addForm.value.issueQuantity || Number(addForm.value.issueQuantity) <= 0) {
      proxy?.$modal.msgWarning('发料数量必须大于 0');
      return;
    }
    issueList.value.push({
      issueMode: 'MATERIAL',
      materialCode: addForm.value.materialCode,
      materialDesc: addForm.value.materialDesc,
      supplierCode: addForm.value.supplierCode,
      supplierName: addForm.value.supplierName,
      issueQuantity: addForm.value.issueQuantity,
      unit: addForm.value.unit,
      locationCode: ''
    });
    proxy?.$modal.msgSuccess('发料明细已添加');
    resetAddForm();
  });
};

const removeFromIssueList = (index: number) => {
  issueList.value.splice(index, 1);
};

const clearIssueList = () => {
  issueList.value = [];
  fixedIssueForm.value.locationCode = '';
  fixedIssueForm.value.postingDate = null;
  fixedIssueForm.value.mtsnr = '';
};

const showStorageLocationDialog = (index: number) => {
  storageLocationDialogRef.value?.openDialog();
  storageLocationDialogRef.value?.handleQuery();
  currenIndex.value = index;
};

const storageLocationSelectCallBack = (record: any) => {
  resultMessage.value = '';
  if (issueMode.value === 'fixed') {
    fixedIssueForm.value.locationCode = record.locationCode;
  } else if (currenIndex.value >= 0 && currenIndex.value < issueList.value.length) {
    issueList.value[currenIndex.value].locationCode = record.locationCode;
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
      resultMessage.value = `库位 ${locationCode} 不存在`;
      resultStatus.value = false;
    }
  }
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
  if (issueMode.value === 'fixed') {
    if (!fixedIssueForm.value.locationCode) {
      resultMessage.value = '请输入库位编码';
      resultStatus.value = false;
      return;
    }
    validList.forEach((item) => {
      item.locationCode = fixedIssueForm.value.locationCode;
      item.postingDate = fixedIssueForm.value.postingDate ? fixedIssueForm.value.postingDate + ' 00:00:00' : undefined;
    });
  } else {
    const invalidItems = validList.filter((item) => !item.locationCode);
    if (invalidItems.length > 0) {
      resultMessage.value = '请为所有发料明细填写库位编码';
      resultStatus.value = false;
      return;
    }
    validList.forEach((item) => {
      item.postingDate = fixedIssueForm.value.postingDate ? fixedIssueForm.value.postingDate + ' 00:00:00' : undefined;
    });
  }

  buttonLoading.value = true;
  try {
    const res: any = await subcontractIssue({
      purchaseOrderSubcontractIssueBoList: validList,
      postingDate: fixedIssueForm.value.postingDate ? fixedIssueForm.value.postingDate + ' 00:00:00' : undefined,
      mtsnr: fixedIssueForm.value.mtsnr || undefined,
      bktxt: '委外发料 541'
    });
    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg;
      resultStatus.value = false;
      return;
    }
    resultMessage.value = res.msg || `发料成功，共 ${validList.length} 条`;
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
.mt-3 {
  margin-top: 12px;
}
.m-y-2 {
  margin: 8px 0;
}
</style>
