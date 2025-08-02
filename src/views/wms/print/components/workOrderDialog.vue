<template>
  <div>
    <!-- 工单选择对话框 -->
    <el-dialog v-model="visible" :title="title" width="70%">
      <el-card>
        <template #header>
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto" class="mt-[18px]">
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>

            <el-form-item label="产品料号" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入产品料号" clearable @keyup.enter="handleQuery" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </template>
        <el-table v-loading="loading" :data="workOrderList" style="width: 100%" border highlight-current-row @row-click="handleWorkOrderListSelect">
          <!-- 单选列（通过高亮行实现） -->
          <el-table-column width="55">
            <template #default="checkedDataScope">
              <el-radio v-model="selectedWorkOrder.id" :label="checkedDataScope.row.id" class="radio-no-label">
                <span class="el-radio__label"></span>
              </el-radio>
            </template>
          </el-table-column>
          <el-table-column label="工单号" align="center" width="130" prop="workOrderNo" />
          <el-table-column label="产品料号" align="center" width="150" prop="item" />
          <el-table-column label="产品描述" align="left" prop="itemDesc" />
          <el-table-column label="计划数量" align="center" width="130" prop="plannedQty" />
          <!--          <el-table-column label="已交货数量" align="center" width="130" prop="deliveredQty" />-->
          <!--          <el-table-column label="已打包数量" align="center" width="130" prop="waitStockQty" />-->
        </el-table>

        <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getWorkOrderList" />
      </el-card>
      <template #footer>
        <el-button @click="cancel">取 消</el-button>
        <el-button :loading="buttonLoading" type="primary" :disabled="!selectedWorkOrder" @click="submit">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="WorkOrderDialog" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { listWorkOrder } from '@/api/wms/workOrder';
import { WorkOrderForm, WorkOrderQuery } from '@/api/wms/workOrder/types';
import useDialog from '@/hooks/useDialog';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const queryFormRef = ref<ElFormInstance>();
const buttonLoading = ref(false);

const emit = defineEmits(['workOrderCallBack']);
// 表单数据
const initFormData: WorkOrderForm = {
  id: undefined,
  workOrderNo: undefined,
  item: undefined,
  itemDesc: undefined,
  checkEnable: undefined,
  plannedStartDate: undefined,
  plannedEndDate: undefined,
  plannedQty: undefined,
  deliveredQty: undefined,
  waitStockQty: undefined,
  packingQty: undefined,
  remark: undefined
};
const data = reactive<PageData<WorkOrderForm, WorkOrderQuery>>({
  form: { ...initFormData },

  queryParams: {
    pageNum: 1,
    pageSize: 10,
    workOrderNo: undefined,
    item: undefined,
    itemDesc: undefined,
    checkEnable: undefined,
    plannedStartDate: undefined,
    plannedEndDate: undefined,
    plannedQty: undefined,
    deliveredQty: undefined,
    waitStockQty: null,
    packingQty: null,
    params: {}
  },
  rules: {}
});

const { title, visible, openDialog, closeDialog } = useDialog({
  title: '选择工单'
});

const { queryParams, form, rules } = toRefs(data);

// 工单列表
const workOrderList = ref([]);
const total = ref(0);
const loading = ref(false);

/** 查询工单信息列表 */
const getWorkOrderList = async () => {
  loading.value = true;
  const res = await listWorkOrder(queryParams.value);
  workOrderList.value = res.rows.map((item) => ({
    ...item,
    waitStockQty: Number(item.waitStockQty)
  }));
  total.value = res.total;
  loading.value = false;
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getWorkOrderList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  selectedWorkOrder.value = initFormData;
  handleQuery();
};

// 对话框控制
const inboundDialogVisible = ref(false);
const selectedWorkOrder = ref<WorkOrderForm>(initFormData);
const recordFormRef = ref(null);

// 处理工单选择
const handleWorkOrderListSelect = (val) => {
  selectedWorkOrder.value = val;
  form.value = selectedWorkOrder.value;
};

/** 取消按钮 */
const cancel = () => {
  visible.value = false;
};

// 确认工单选择
const submit = () => {
  emit('workOrderCallBack', selectedWorkOrder.value);
  queryFormRef.value?.resetFields();
  closeDialog();
};

onMounted(() => {
  resetQuery();
  handleQuery();
});

defineExpose({
  openDialog,
  closeDialog
});
</script>

<style scoped lang="scss">
h2 {
  color: #333;
  margin-bottom: 20px;
}

.el-form-item__tip {
  font-size: 12px;
  color: #999;
  line-height: 1;
  padding-top: 4px;
}

.radio-no-label {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -12px;
  .el-radio__label {
    display: none;
  }
}
</style>
