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
      <el-form-item label="客户" prop="businessCode">
        <HistoryInput v-model="form.businessCode" :config="customerCodeConfig" placeholder="请输入客户代码">
          <template #append>
            <el-button icon="Search" @click="showCustomerDialog()" />
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
  </el-dialog>
</template>

<script setup lang="ts">
import { containerOutbound, getInventoryDetail } from '@/api/wms/inventoryDetail';
import { InventoryDetailForm, InventoryDetailVO } from '@/api/wms/inventoryDetail/types';
import HistoryInput from '@/components/HistoryInput/index.vue';
import { HistoryConfig } from '@/types/history';
import CustomerDialog from '@/views/wms/customer/components/customerDialog.vue';

defineOptions({ name: 'ContainerOutDialog' });

const emit = defineEmits<{
  success: [];
}>();

const visible = defineModel<boolean>({ default: false });

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const buttonLoading = ref(false);
const formRef = ref<ElFormInstance>();
const customerDialogRef = ref<InstanceType<typeof CustomerDialog>>();

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

const rules = {
  quantity: [{ required: true, message: '出库数量不能为空', trigger: 'blur' }],
  businessCode: [{ required: true, message: '客户编码不能为空', trigger: 'blur' }]
};

const customerCodeConfig: HistoryConfig = {
  key: 'customerCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryDetail',
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

const open = async (row: InventoryDetailVO) => {
  if (!row?.id) return;
  const res = await getInventoryDetail(row.id);
  Object.assign(form, res.data);
  form.quantity = undefined;
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
