<template>
  <el-dialog title="容器出库" v-model="visible" width="500px" append-to-body>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="auto">
      <el-form-item label="物料编码">
        <el-input v-model="form.itemCode" readonly />
      </el-form-item>
      <el-form-item label="物料名称">
        <el-input v-model="form.itemName" readonly />
      </el-form-item>
      <el-form-item label="库位编码">
        <el-input v-model="form.locationCode" readonly />
      </el-form-item>
      <el-form-item label="库存数量">
        <el-input v-model="currentStock" readonly />
      </el-form-item>
      <el-form-item label="出库数量" prop="quantity">
        <el-input-number v-model="form.quantity" placeholder="请输入出库数量" :precision="3" :max="maxQuantity" style="width: 100%" />
      </el-form-item>
      <el-form-item label="业务伙伴">
        <el-radio-group v-model="businessPartnerType" @change="handleBusinessPartnerTypeChange">
          <el-radio value="customer">客户</el-radio>
          <el-radio value="supplier">托外供应商</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="businessPartnerType === 'customer'" label="客户" prop="businessCode">
        <HistoryInput v-model="form.businessCode" :config="customerCodeConfig" placeholder="请输入客户代码">
          <template #append>
            <el-button icon="Search" @click="showCustomerDialog()" />
          </template>
        </HistoryInput>
      </el-form-item>
      <el-form-item v-else label="托外供应商" prop="businessCode">
        <HistoryInput v-model="form.businessCode" :config="supplierCodeConfig" placeholder="请输入托外供应商代码">
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
    <CustomerDialog ref="customerDialogRef" @customer-select-call-back="customerSelectCallBack" />
    <SupplierDialog ref="supplierDialogRef" @supplier-select-call-back="supplierSelectCallBack" />
  </el-dialog>
</template>

<script setup lang="ts">
import { containerOutbound, getInventoryDetail } from '@/api/wms/inventoryDetail';
import { InventoryDetailForm, InventoryDetailVO } from '@/api/wms/inventoryDetail/types';
import HistoryInput from '@/components/HistoryInput/index.vue';
import { HistoryConfig } from '@/types/history';
import CustomerDialog from '@/views/wms/customer/components/customerDialog.vue';
import SupplierDialog from '@/views/wms/supplier/components/supplierDialog.vue';

defineOptions({ name: 'ContainerOutDialog' });

const emit = defineEmits<{
  success: [];
}>();

const visible = defineModel<boolean>({ default: false });

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const buttonLoading = ref(false);
const businessPartnerType = ref<'customer' | 'supplier'>('customer');
const formRef = ref<ElFormInstance>();
const customerDialogRef = ref<InstanceType<typeof CustomerDialog>>();
const supplierDialogRef = ref<InstanceType<typeof SupplierDialog>>();

const form = reactive<InventoryDetailForm>({
  id: undefined,
  itemCode: undefined,
  itemName: undefined,
  batchCode: undefined,
  locationCode: undefined,
  availableQuantity: undefined,
  inspectionQuantity: undefined,
  blockedQuantity: undefined,
  inventoryType: 'N',
  quantity: undefined,
  businessCode: undefined,
  businessName: undefined,
  remark: undefined
});

const rules = computed(() => ({
  quantity: [{ required: true, message: '出库数量不能为空', trigger: 'blur' }],
  businessCode: [
    {
      required: true,
      message: businessPartnerType.value === 'customer' ? '客户编码不能为空' : '托外供应商编码不能为空',
      trigger: 'blur'
    }
  ]
}));

const customerCodeConfig: HistoryConfig = {
  key: 'customerCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'containerOut',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};

const supplierCodeConfig: HistoryConfig = {
  key: 'supplierCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'containerOut',
  autoSave: true,
  component: { showDropdown: true, showTime: false, showDelete: true, dropdownMaxHeight: '300px' }
};


const currentStock = computed(() => {
  switch (form.inventoryType) {
    case 'S':
      return form.blockedQuantity || 0;
    case 'X':
      return form.inspectionQuantity || 0;
    default:
      return form.availableQuantity || 0;
  }
});

const maxQuantity = computed(() => currentStock.value);

const showCustomerDialog = () => {
  customerDialogRef.value?.openDialog();
  customerDialogRef.value?.handleQuery();
};

const customerSelectCallBack = (record: any) => {
  form.businessCode = record.customerCode;
  form.businessName = record.customerName;
};

const showSupplierDialog = () => {
  supplierDialogRef.value?.openDialog();
  supplierDialogRef.value?.handleQuery();
};

const supplierSelectCallBack = (record: any) => {
  form.businessCode = record.supplierCode;
  form.businessName = record.supplierName;
};

const handleBusinessPartnerTypeChange = () => {
  form.businessCode = undefined;
  form.businessName = undefined;
  formRef.value?.clearValidate('businessCode');
};

const open = async (row: InventoryDetailVO) => {
  if (!row?.id) return;
  const res = await getInventoryDetail(row.id);
  Object.assign(form, res.data);
  form.quantity = undefined;
  businessPartnerType.value = 'customer';
  form.businessCode = undefined;
  form.businessName = undefined;
  visible.value = true;
};

const submitForm = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      if (form.quantity > currentStock.value) {
        proxy?.$modal.msgError(`出库数量不能超过当前库存数量 ${currentStock.value}`);
        return;
      }
      buttonLoading.value = true;
      try {
        await containerOutbound({
          id: form.id,
          itemCode: form.itemCode,
          inventoryType: form.inventoryType,
          availableQuantity: form.quantity,
          locationCode: form.locationCode,
          businessCode: form.businessCode,
          businessName: form.businessName,
          remark: form.remark,
          itemType: 3
        } as InventoryDetailForm).finally(() => {
          buttonLoading.value = false;
        });
        proxy?.$modal.msgSuccess('容器出库成功');
        visible.value = false;
        emit('success');
      } catch {
        buttonLoading.value = false;
      }
    }
  });
};

defineExpose({ open });
</script>
