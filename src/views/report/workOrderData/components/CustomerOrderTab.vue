<template>
  <div>
    <el-table v-loading="loading" :data="customerOrderList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" width="60">
        <template #default="{ $index }">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + $index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="客户订单" align="center" prop="customerOrder" width="150" />
      <el-table-column label="客户名称" align="center" prop="customerName" width="150" />
      <el-table-column label="工单数量" align="center" prop="workOrderCount" width="100" />
      <el-table-column label="产品料号" align="center" prop="material" width="150" />
      <el-table-column label="产品描述" align="left" prop="materialDesc" min-width="200" />
      <el-table-column label="订单数量" align="center" prop="orderQty" width="100" />
      <el-table-column label="已交付数量" align="center" prop="deliveredQty" width="100" />
      <el-table-column label="未交付数量" align="center" prop="undeliveredQty" width="100" />
      <el-table-column label="交付率" align="center" prop="deliveryRate" width="120">
        <template #default="scope">
          <el-progress :percentage="parseFloat(scope.row.deliveryRate || 0)" :color="getProgressColor(scope.row.deliveryRate)" />
        </template>
      </el-table-column>
      <el-table-column label="订单日期" align="center" prop="orderDate" width="120" />
      <el-table-column label="要求交期" align="center" prop="requiredDate" width="120" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :options="mes_customer_order_status" :value="scope.row.status" />
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { listCustomerOrder } from '@/api/report/workOrder';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { mes_customer_order_status } = toRefs<any>(proxy?.useDict('mes_customer_order_status'));

const props = defineProps<{
  queryParams: any;
}>();

const emit = defineEmits(['update-count']);

const loading = ref(false);
const total = ref(0);
const customerOrderList = ref<any[]>([]);

const getProgressColor = (percentage: string | number) => {
  const num = parseFloat(percentage as string);
  if (num >= 100) return '#67c23a';
  if (num >= 80) return '#409eff';
  if (num >= 60) return '#e6a23c';
  return '#f56c6c';
};

const handleSelectionChange = (selection: any[]) => {
  console.log('选中数据:', selection);
};

const getList = async () => {
  loading.value = true;
  try {
    const res = await listCustomerOrder(props.queryParams);
    customerOrderList.value = res.rows;
    total.value = res.total;
    emit('update-count', res.total);
  } catch (error) {
    console.error('查询客户订单失败:', error);
  } finally {
    loading.value = false;
  }
};

watch(() => props.queryParams.pageNum, () => {
  getList();
});

getList();
</script>
