<template>
  <el-dialog title="容器入库" v-model="visible" width="500px" append-to-body @closed="handleClosed">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="auto">
      <el-form-item label="物料编码" prop="itemCode">
        <el-select v-model="form.itemCode" placeholder="请选择容器物料" filterable clearable style="width: 100%">
          <el-option v-for="dict in containerMaterialCodeDict" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="数量" prop="quantity">
        <el-input-number v-model="form.quantity" placeholder="请输入数量" :precision="3" style="width: 100%" />
      </el-form-item>
      <el-form-item label="库位编码" prop="locationCode">
        <HistoryInput v-model="form.locationCode" :config="locationCodeConfig" placeholder="请输入库位编码">
          <template #append>
            <el-button icon="Search" @click="showStorageLocationDialog()" />
          </template>
        </HistoryInput>
      </el-form-item>
      <el-form-item label="供应商" prop="businessCode">
        <HistoryInput v-model="form.businessCode" :config="supplierCodeConfig" placeholder="请输入供应商代码">
          <template #append>
            <el-button icon="Search" @click="showSupplierDialog()" />
          </template>
        </HistoryInput>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取 消</el-button>
        <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
      </div>
    </template>
    <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
    <SupplierDialog ref="supplierDialogRef" @supplier-select-call-back="supplierSelectCallBack" />
  </el-dialog>
</template>

<script setup lang="ts">
import { containerInbound } from '@/api/wms/inventoryDetail';
import { InventoryDetailForm } from '@/api/wms/inventoryDetail/types';
import HistoryInput from '@/components/HistoryInput/index.vue';
import { HistoryConfig } from '@/types/history';
import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import SupplierDialog from '@/views/wms/supplier/components/supplierDialog.vue';

defineOptions({ name: 'ContainerInDialog' });

const props = withDefaults(
  defineProps<{
    containerMaterialCodeDict?: any[];
  }>(),
  {
    containerMaterialCodeDict: () => []
  }
);

const emit = defineEmits<{
  success: [];
}>();

const visible = defineModel<boolean>({ default: false });

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const buttonLoading = ref(false);
const formRef = ref<ElFormInstance>();
const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();
const supplierDialogRef = ref<InstanceType<typeof SupplierDialog>>();

const form = reactive<InventoryDetailForm>({
  itemCode: undefined,
  itemName: undefined,
  batchCode: undefined,
  quantity: undefined,
  unit: 'PCS',
  locationCode: undefined,
  inventoryType: 'N',
  specialInventoryFlag: 'N',
  businessCode: undefined,
  businessName: undefined,
  remark: undefined
});

const rules = {
  itemCode: [{ required: true, message: '物料编码不能为空', trigger: 'blur' }],
  quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }],
  locationCode: [{ required: true, message: '库位编码不能为空', trigger: 'blur' }],
  businessCode: [{ required: true, message: '供应商编码不能为空', trigger: 'blur' }]
};

const locationCodeConfig: HistoryConfig = {
  key: 'locationCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryDetail',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};

const supplierCodeConfig: HistoryConfig = {
  key: 'supplierCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryDetail',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};

const resetForm = () => {
  form.itemCode = undefined;
  form.itemName = undefined;
  form.batchCode = undefined;
  form.quantity = undefined;
  form.unit = 'PCS';
  form.locationCode = undefined;
  form.inventoryType = 'N';
  form.specialInventoryFlag = 'N';
  form.businessCode = undefined;
  form.businessName = undefined;
  form.remark = undefined;
};

const handleClosed = () => {
  resetForm();
};

watch(visible, (val) => {
  if (val) {
    const tenantId = localStorage.getItem('tenantId');
    form.locationCode = tenantId === '000000' ? 'CN00' : 'CN10';
  }
});

const showSupplierDialog = () => {
  supplierDialogRef.value?.openDialog();
  supplierDialogRef.value?.handleQuery();
};

const supplierSelectCallBack = (record: any) => {
  form.businessCode = record.supplierCode;
  form.businessName = record.supplierName;
};

const showStorageLocationDialog = () => {
  storageLocationDialogRef.value?.openDialog();
  storageLocationDialogRef.value?.handleQuery();
};

const storageLocationSelectCallBack = (record: any) => {
  form.locationCode = record.locationCode;
};

const submitForm = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      try {
        await containerInbound({
          itemCode: form.itemCode,
          itemName: form.itemName,
          batchCode: form.batchCode,
          quantity: form.quantity,
          unit: form.unit,
          locationCode: form.locationCode,
          inventoryType: form.inventoryType || 'N',
          specialInventoryFlag: form.specialInventoryFlag || 'N',
          businessCode: form.businessCode,
          businessName: form.businessName,
          availableQuantity: form.quantity,
          remark: form.remark,
          itemType: 3
        } as InventoryDetailForm).finally(() => {
          buttonLoading.value = false;
        });
        proxy?.$modal.msgSuccess('容器入库成功');
        visible.value = false;
        emit('success');
      } catch {
        buttonLoading.value = false;
      }
    }
  });
};
</script>
