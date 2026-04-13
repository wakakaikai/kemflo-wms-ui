<template>
  <div>
    <el-table v-loading="loading" :data="reportList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" width="60">
        <template #default="{ $index }">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + $index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="工单号" align="center" prop="workOrderNo" width="150" />
      <el-table-column label="产品料号" align="center" prop="material" width="150" />
      <el-table-column label="产品描述" align="left" prop="materialDesc" min-width="150" />
      <el-table-column label="工序名称" align="center" prop="processName" width="120" />
      <el-table-column label="报工数量" align="center" prop="reportQty" width="100" />
      <el-table-column label="合格数量" align="center" prop="qualifiedQty" width="100" />
      <el-table-column label="不良数量" align="center" prop="defectQty" width="100" />
      <el-table-column label="不良原因" align="center" prop="defectReason" width="120" />
      <el-table-column label="报工人" align="center" prop="reportBy" width="100" />
      <el-table-column label="报工时间" align="center" prop="reportTime" width="160" />
      <el-table-column label="工作中心" align="center" prop="workCenter" width="120" />
      <el-table-column label="设备编号" align="center" prop="equipmentCode" width="120" />
      <el-table-column label="备注" align="left" prop="remark" min-width="150" />
    </el-table>

    <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { listWorkOrderReport } from '@/api/report/workOrder';

const props = defineProps<{
  queryParams: any;
}>();

const emit = defineEmits(['update-count']);

const loading = ref(false);
const total = ref(0);
const reportList = ref<any[]>([]);

const handleSelectionChange = (selection: any[]) => {
  console.log('选中数据:', selection);
};

const getList = async () => {
  loading.value = true;
  try {
    const res = await listWorkOrderReport(props.queryParams);
    reportList.value = res.rows;
    total.value = res.total;
    emit('update-count', res.total);
  } catch (error) {
    console.error('查询工单报工信息失败:', error);
  } finally {
    loading.value = false;
  }
};

watch(() => props.queryParams.pageNum, () => {
  getList();
});

getList();
</script>
