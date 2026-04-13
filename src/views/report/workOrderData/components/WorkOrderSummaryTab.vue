<template>
  <div>
    <el-table v-loading="loading" :data="summaryList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" width="60">
        <template #default="{ $index }">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + $index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="客户订单" align="center" prop="customerOrder" width="150" />
      <el-table-column label="工单号" align="center" prop="workOrderNo" width="150" />
      <el-table-column label="产品料号" align="center" prop="material" width="150" />
      <el-table-column label="产品描述" align="left" prop="materialDesc" min-width="200" />
      <el-table-column label="工单类型" align="center" prop="workOrderType" width="120">
        <template #default="scope">
          <dict-tag :options="mes_work_order_type" :value="scope.row.workOrderType" />
        </template>
      </el-table-column>
      <el-table-column label="计划数量" align="center" prop="plannedQty" width="100" />
      <el-table-column label="已完工数量" align="center" prop="finishedQty" width="100" />
      <el-table-column label="在制数量" align="center" prop="wipQty" width="100" />
      <el-table-column label="不良数量" align="center" prop="defectQty" width="100" />
      <el-table-column label="开工日期" align="center" prop="startDate" width="120" />
      <el-table-column label="完工日期" align="center" prop="endDate" width="120" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :options="wms_work_order_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="left" prop="remark" min-width="150" />
    </el-table>

    <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { listWorkOrderSummary } from '@/api/report/workOrder';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_work_order_status, mes_work_order_type } = toRefs<any>(proxy?.useDict('wms_work_order_status', 'mes_work_order_type'));

const props = defineProps<{
  queryParams: any;
}>();

const emit = defineEmits(['update-count']);

const loading = ref(false);
const total = ref(0);
const summaryList = ref<any[]>([]);

const handleSelectionChange = (selection: any[]) => {
  console.log('选中数据:', selection);
};

const getList = async () => {
  loading.value = true;
  try {
    const res = await listWorkOrderSummary(props.queryParams);
    summaryList.value = res.rows;
    total.value = res.total;
    emit('update-count', res.total);
  } catch (error) {
    console.error('查询工单汇总信息失败:', error);
  } finally {
    loading.value = false;
  }
};

watch(() => props.queryParams.pageNum, () => {
  getList();
});

getList();
</script>
