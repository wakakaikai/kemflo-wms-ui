<template>
  <el-dialog v-model="visible" :title="title" width="70%" append-to-body @opened="handleDialogOpen">
    <el-card>
      <template #header>
        <el-form ref="workOrderProcessFormRef" :model="queryParams" :inline="true" label-width="auto" class="mt-[18px]">
          <el-row>
            <el-col :lg="8" :md="8" :sm="24">
              <el-form-item label="工序" prop="process">
                <el-input v-model="queryParams.process" placeholder="请输入工序" clearable @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :lg="8" :md="8" :sm="24">
              <el-form-item label="工序描述" prop="processShortDesc">
                <el-input v-model="queryParams.processShortDesc" placeholder="请输入工序描述" clearable @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :lg="8" :md="8" :sm="24">
              <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </template>

      <el-table ref="tableRef" v-loading="loading" :data="workOrderProcessList" style="width: 100%" border @selection-change="handleSelectionChange">
        <!-- 多选列 -->
        <el-table-column type="selection" width="55" />
        <el-table-column label="工单号" align="center" prop="workOrderNo" />
        <el-table-column label="工序" align="center" prop="process" />
        <el-table-column label="工序描述" align="center" prop="processShortDesc" />
        <el-table-column label="控制码" align="center" prop="controlCode" />
        <el-table-column label="工艺路线" align="center" prop="router" />
        <el-table-column label="工作中心" align="center" prop="workCenter" />
        <el-table-column label="基本数量" align="center" prop="baseQty" />
        <el-table-column label="员工人数" align="center" prop="personNumber" />
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="WorkOrderProcessDialog" lang="ts">
import useDialog from '@/hooks/useDialog';
import { listWorkOrderProcess } from '@/api/wms/workOrderProcess';
import { WorkOrderProcessVO, WorkOrderProcessQuery, WorkOrderProcessForm } from '@/api/wms/workOrderProcess/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const workOrderProcessList = ref<WorkOrderProcessVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const total = ref(0);
const tableRef = ref(null);

const queryFormRef = ref<ElFormInstance>();
const workOrderProcessFormRef = ref<ElFormInstance>();

const { title, visible, openDialog, closeDialog } = useDialog({
  title: '选择工单工序'
});

const props = defineProps({
  workOrderNo: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['workOrderProcessSelectCallBack']);

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

const { queryParams, form } = toRefs(data);

/** 查询工单工序列表 */
const getList = async () => {
  loading.value = true;
  queryParams.value.workOrderNo = props.workOrderNo;
  const res = await listWorkOrderProcess(queryParams.value);
  workOrderProcessList.value = res.rows.filter((process) => process.controlCode && (process.controlCode.startsWith('PP') || process.controlCode.startsWith('ZP'))) || [];
  total.value = res.total;
  loading.value = false;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  closeDialog();
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
const selectedRows = ref<WorkOrderProcessVO[]>([]);
const handleSelectionChange = (selection: WorkOrderProcessVO[]) => {
  selectedRows.value = selection;
};

/** 提交按钮 */
const submitForm = () => {
  if (selectedRows.value.length === 0) {
    proxy?.$modal.msgWarning('请至少选择一条数据');
    return;
  }
  emit('workOrderProcessSelectCallBack', selectedRows.value);
  closeDialog();
};

const handleDialogOpen = () => {
  reset();
  getList();
};

onMounted(() => {});

defineExpose({
  openDialog,
  closeDialog,
  handleQuery
});
</script>

<style lang="scss" scoped>
</style>
