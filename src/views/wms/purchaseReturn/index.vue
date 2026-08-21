<template>
  <div class="p-2">
    <el-tabs v-model="activeTab" :tab-position="'top'" @tab-click="handleTabClick">
      <el-tab-pane name="purchase-return" label="采购退货">
        <PurchaseReturn />
      </el-tab-pane>
      <el-tab-pane name="purchase-reverse" label="采购冲销">
        <PurchaseReverse />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup name="PurchaseReturnPage" lang="ts">
import { ref } from 'vue';
import PurchaseReturn from '@/views/wms/purchaseReturn/components/purchaseReturn.vue';
import PurchaseReverse from '@/views/wms/purchaseReturn/components/purchaseReverse.vue';

const activeTab = ref('purchase-return');

const handleTabClick = (tab: any) => {
  activeTab.value = tab.paneName;
};
</script>

<style scoped>
.p-2 {
  padding: 0.5rem;
}
</style>
