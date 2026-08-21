<template>
  <div class="p-2">
    <el-card shadow="never">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="采购单" name="po">
          <PoSubcontractIssue />
        </el-tab-pane>
        <el-tab-pane label="物料+供应商" name="material" lazy>
          <MaterialSupplierSubcontractIssue />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup name="PurchaseOrderSubcontractIssue" lang="ts">
import PoSubcontractIssue from '@/views/wms/purchaseOrderSubcontractIssue/components/PoSubcontractIssue.vue';
import MaterialSupplierSubcontractIssue from '@/views/wms/purchaseOrderSubcontractIssue/components/MaterialSupplierSubcontractIssue.vue';

const activeTab = ref('po');
</script>
