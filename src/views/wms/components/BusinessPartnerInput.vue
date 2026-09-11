<template>
  <el-input v-if="selectionType === 'salesOrder'" :model-value="businessCode" placeholder="请选择销售订单明细" readonly clearable @clear="clearBusiness">
    <template #append>
      <el-button icon="Search" @click="openSalesOrderDialog"></el-button>
    </template>
  </el-input>
  <el-input v-else-if="selectionType === 'customer'" :model-value="businessCode" placeholder="请选择客户" readonly clearable @clear="clearBusiness">
    <template #append>
      <el-button icon="Search" @click="openCustomerDialog"></el-button>
    </template>
  </el-input>
  <el-input v-else-if="selectionType === 'supplier'" :model-value="businessCode" placeholder="请选择供应商" readonly clearable @clear="clearBusiness">
    <template #append>
      <el-button icon="Search" @click="openSupplierDialog"></el-button>
    </template>
  </el-input>
  <el-input
    v-else
    :model-value="businessCode"
    placeholder="请输入业务伙伴"
    clearable
    :disabled="isManualInputDisabled"
    @input="onManualInput"
    @clear="clearBusiness"
  />

  <CustomerDialog ref="customerDialogRef" @customer-select-call-back="customerSelectCallBack" />
  <SupplierDialog ref="supplierDialogRef" @supplier-select-call-back="supplierSelectCallBack" />
  <SalesOrderDetailDialog ref="salesOrderDetailDialogRef" @sales-order-detail-select-call-back="salesOrderDetailSelectCallBack" />
</template>

<script setup name="BusinessPartnerInput" lang="ts">
import { computed, ref, watch } from 'vue';
import CustomerDialog from '@/views/wms/customer/components/CustomerDialog.vue';
import SupplierDialog from '@/views/wms/supplier/components/SupplierDialog.vue';
import SalesOrderDetailDialog from '@/views/wms/salesOrderDetail/components/SalesOrderDetailDialog.vue';
import type { SalesOrderDetailVO } from '@/api/wms/salesOrderDetail/types';

const props = defineProps<{
  specialInventoryFlag?: string;
  businessCode?: string;
  businessName?: string;
  materialCode?: string;
}>();

const emit = defineEmits<{
  'update:businessCode': [value?: string];
  'update:businessName': [value?: string];
}>();

const customerDialogRef = ref<InstanceType<typeof CustomerDialog>>();
const supplierDialogRef = ref<InstanceType<typeof SupplierDialog>>();
const salesOrderDetailDialogRef = ref<InstanceType<typeof SalesOrderDetailDialog>>();

const normalizedFlag = computed(() =>
  String(props.specialInventoryFlag || '')
    .trim()
    .toUpperCase()
);

const selectionType = computed(() => {
  const flag = normalizedFlag.value;
  if (flag === 'E') {
    return 'salesOrder';
  }
  if (flag === 'K' || flag === 'O') {
    return 'supplier';
  }
  if (flag === 'B' || flag === 'W') {
    return 'customer';
  }
  return 'manual';
});

/** 特殊库存标识为 N 且业务伙伴为空时，不允许手工输入 */
const isManualInputDisabled = computed(() => {
  if (normalizedFlag.value !== 'N') {
    return false;
  }
  return !String(props.businessCode ?? '').trim();
});

watch(
  () => props.specialInventoryFlag,
  () => clearBusiness()
);

const clearBusiness = () => {
  emit('update:businessCode', undefined);
  emit('update:businessName', undefined);
};

const onManualInput = (value: string) => {
  if (isManualInputDisabled.value) {
    return;
  }
  emit('update:businessCode', value);
  emit('update:businessName', undefined);
};

const openCustomerDialog = () => {
  customerDialogRef.value?.openDialog();
  customerDialogRef.value?.handleQuery();
};

const customerSelectCallBack = (record: any) => {
  emit('update:businessCode', record?.customerCode);
  emit('update:businessName', record?.customerName);
};

const openSupplierDialog = () => {
  supplierDialogRef.value?.openDialog();
  supplierDialogRef.value?.handleQuery();
};

const supplierSelectCallBack = (record: any) => {
  emit('update:businessCode', record?.supplierCode);
  emit('update:businessName', record?.supplierName);
};

const openSalesOrderDialog = () => {
  salesOrderDetailDialogRef.value?.openDialog({
    materialCode: props.materialCode
  });
  salesOrderDetailDialogRef.value?.handleQuery();
};

const salesOrderDetailSelectCallBack = (record: SalesOrderDetailVO) => {
  emit('update:businessCode', `${record.salesOrderNo}-${record.salesItemNo}`);
  emit('update:businessName', undefined);
};
</script>
