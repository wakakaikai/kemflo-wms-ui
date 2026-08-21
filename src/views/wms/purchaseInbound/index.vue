<template>
  <div class="p-2">
    <el-card shadow="never">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="采购收货" name="po">
          <PurchaseReceive />
        </el-tab-pane>
        <el-tab-pane label="STO收货" name="sto" lazy>
          <StoReceive />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup name="PurchaseInbound" lang="ts">
import PurchaseReceive from '@/views/wms/purchaseInbound/components/PurchaseReceive.vue';
import StoReceive from '@/views/wms/purchaseInbound/components/StoReceive.vue';

const activeTab = ref('po');
</script>
