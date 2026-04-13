<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:workOrderProcess:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="workOrderProcessList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="工单号" align="center" prop="workOrderNo" />
        <el-table-column label="工序" align="center" prop="process" />
        <el-table-column label="工序描述" align="center" prop="processShortDesc" />
        <el-table-column label="工作中心" align="center" prop="workCenter" />
        <el-table-column label="产品料号" align="center" prop="item" />
        <el-table-column label="产品描述" align="center" prop="itemDesc" />000130088979
        <el-table-column label="客户订单" align="center" prop="salesOrderNo" />
        <el-table-column label="订单项次" align="center" prop="salesOrderItem" />
        <el-table-column label="客户交期" align="center" prop="soDeliveryDate" />
        <el-table-column label="工单数量" align="center" prop="plannedQty" />
        <el-table-column label="报工数量" align="center" prop="reportQty" />
        <el-table-column label="入库数量" align="center" prop="deliveredQty" />
        <el-table-column label="预计开工" align="center" prop="plannedStartDate" />
        <el-table-column label="预计完工" align="center" prop="plannedEndDate" />
        <el-table-column label="预计生产时长" align="center" prop="plannedDuration" />
        <el-table-column label="实际开工" align="center" prop="actualStartDate" />
        <el-table-column label="实际完工" align="center" prop="actualEndDate" />
        <el-table-column label="实际已生产时长" align="center" prop="actualDuration" />
        <el-table-column label="状态" align="center" prop="productStatus" />
        <el-table-column label="下制程工单号" align="center" prop="nextWorkOrderNo" />
        <el-table-column label="下制程工序" align="center" prop="nextProcessNo" />
        <el-table-column label="下制程工作中心" align="center" prop="nextWorkCenter" />
        <el-table-column label="下制程预计开工时间" align="center" prop="nextPlannedStartDate" />
        <el-table-column label="前制程工单号" align="center" prop="previousWorkOrderNo" />
        <el-table-column label="前制程工序" align="center" prop="previousProcessNo" />
        <el-table-column label="前制程工作中心" align="center" prop="previousWorkCenter" />
        <el-table-column label="前制程预计完工时间" align="center" prop="previousEndDate" />
        <el-table-column label="前制程已报工数量" align="center" prop="previousReportQty" />
        <el-table-column label="前制程已入库数量" align="center" prop="previousDeliveredQty" />
        <el-table-column label="前制程报工完工时间" align="center" prop="previousActualReportEndDate" />
        <el-table-column label="前制程入库完工时间" align="center" prop="previousActualDeliveredDate" />
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup name="WorkOrderProcess" lang="ts">
import { listWorkOrderProcess } from '@/api/report/workOrder';
import { WorkOrderProcessVO, WorkOrderProcessQuery, WorkOrderProcessForm } from '@/api/wms/workOrderProcess/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const workOrderProcessList = ref<WorkOrderProcessVO[]>([]);

const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const workOrderProcessFormRef = ref<ElFormInstance>();

const initFormData: WorkOrderProcessForm = {
  id: undefined,
  workOrderNo: undefined,
  router: undefined,
  process: undefined,
  processShortDesc: undefined,
  workCenter: undefined,
  processStatus: undefined,
  baseQty: undefined,
  personNumber: undefined,
  machineTime: undefined,
  machineTimeUnit: undefined,
  personTime: undefined,
  personTimeUnit: undefined,
  schedulingTime: undefined,
  schedulingTimeUnit: undefined,
  moduleQty: undefined,
  moduleUnit: undefined,
  remark: undefined
};
const data = reactive<PageData<WorkOrderProcessForm, WorkOrderProcessQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    workOrderNo: undefined,
    router: undefined,
    process: undefined,
    processShortDesc: undefined,
    workCenter: undefined,
    processStatus: undefined,
    baseQty: undefined,
    personNumber: undefined,
    machineTime: undefined,
    machineTimeUnit: undefined,
    personTime: undefined,
    personTimeUnit: undefined,
    schedulingTime: undefined,
    schedulingTimeUnit: undefined,
    moduleQty: undefined,
    moduleUnit: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

/** 查询工单工序列表 */
const getList = async () => {
  loading.value = true;
  const res = await listWorkOrderProcess(queryParams.value);
  workOrderProcessList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  workOrderProcessFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: WorkOrderProcessVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/workOrderProcess/export',
    {
      ...queryParams.value
    },
    `workOrderProcess_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
