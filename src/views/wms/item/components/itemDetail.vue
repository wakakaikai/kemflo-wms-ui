<template>
  <div class="item-detail">
    <el-tabs v-model="activeTab" class="item-tabs">
      <!-- 计量单位 Tab -->
      <el-tab-pane label="计量单位" name="unit">
        <MaterialUnitConversion :item-code="itemCode" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import MaterialUnitConversion from '@/views/wms/materialUnitConversion/index.vue';

const route = useRoute();

// 从路由参数中获取物料代码
const itemCode = computed(() => {
  return (route.params.materialCode as string) || (route.query.materialCode as string) || ''
});

const activeTab = ref('unit');
</script>

<style scoped>
.item-tabs {
  margin: 15px;
}
</style>
