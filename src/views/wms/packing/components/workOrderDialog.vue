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
          <el-table-column label="已交货数量" align="center" width="130" prop="deliveredQty" />
          <el-table-column label="待入库数量" align="center" width="130" prop="waitStockQty" />
        </el-table>

        <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getWorkOrderList" />
      </el-card>
      <template #footer>
        <!--        <el-button @click="workOrderDialogVisible = false">取消</el-button>-->
        <!--        <el-button type="primary" @click="confirmWorkOrder"> 确认 </el-button>-->
        <el-button @click="cancel">取 消</el-button>
        <el-button :loading="buttonLoading" type="primary" :disabled="!selectedWorkOrder" @click="confirmWorkOrder">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 工单打包选择对话框 -->
    <el-dialog v-model="inboundDialogVisible" :title="`打包工单（工单号: ${form.workOrderNo}）`" width="70%">
      <el-form ref="recordFormRef" :model="form" :rules="rules" label-width="auto">
        <el-row :gutter="24">
          <el-col :lg="12" :md="8" :sm="24">
            <el-form-item label="产品料号">
              <el-text> {{ form.item }}</el-text>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="8" :sm="24">
            <el-form-item label="品名描述">
              <el-text> {{ form.itemDesc }}</el-text>
            </el-form-item>
          </el-col>

          <el-col :lg="12" :md="8" :sm="24">
            <el-form-item label="需求数量">
              <el-text> {{ form.plannedQty }}</el-text>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="8" :sm="24">
            <el-form-item label="已交货数量">
              <el-text> {{ form.deliveredQty }}</el-text>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="8" :sm="24">
            <el-form-item label="已打包数量">
              <el-text> {{ form.waitStockQty }}</el-text>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="8" :sm="24">
            <el-form-item label="最大可入库数量">
              <el-text>{{ getMaxInboundQty }}</el-text>
            </el-form-item>
          </el-col>

          <el-form-item label="打包数量" prop="packingQty">
            <el-input-number v-model="form.packingQty" v-focus-select :min="0" :max="getMaxInboundQty" :precision="0" placeholder="请输入数量" />
            <div class="el-form-item__tip">最大可入库数量: {{ getMaxInboundQty }}</div>
          </el-form-item>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="inboundDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">提 交</el-button>
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
const emit = defineEmits(['packingDetailListCallBack']);
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
  rules: {
    packingQty: [
      { required: true, message: '请输入工单打包数量', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          const maxInboundQty = Math.max(form.value.plannedQty - form.value.deliveredQty, 0);
          if (value > maxInboundQty) {
            callback(new Error(`工单打包数量不能超过${maxInboundQty}`));
          } else {
            callback();
          }
        },
        trigger: 'blur'
      }
    ]
  }
});

const { title, visible, openDialog, closeDialog } = useDialog({
  title: '选择工单'
});

// 计算剩余数量
const getMaxInboundQty = computed(() => {
  return Math.max(form.value.plannedQty - form.value.deliveredQty - form.value.waitStockQty, 0);
});

const { queryParams, form, rules } = toRefs(data);
// 记录列表
const records = ref([]);
const workOrderFilter = ref('');
// 计算筛选后的数据
const filteredData = computed(() => {
  if (!workOrderFilter.value) return records.value;
  return records.value.filter((item) => item.workOrderNo.includes(workOrderFilter.value));
});
// 工单列表
const workOrderList = ref([]);
const total = ref(0);
const beforeInStockQty = ref(0);
const loading = ref(false);

/** 取消按钮 */
const cancel = () => {
  visible.value = false;
};

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

// 确认工单选择
const confirmWorkOrder = () => {
  if (selectedWorkOrder.value) {
    form.value = selectedWorkOrder.value;
    inboundDialogVisible.value = true;
    recordFormRef.value?.resetFields();
    const existingIndex = records.value.findIndex((r) => r.workOrderNo === form.value.workOrderNo);
    if (existingIndex !== -1) {
      beforeInStockQty.value = records.value[existingIndex].packingQty;
    }
    closeDialog();
  }
};

// 提交表单
const submitForm = () => {
  recordFormRef.value.validate((valid) => {
    if (valid) {
      // 检查工单号是否已存在
      const existingIndex = records.value.findIndex((r) => r.workOrderNo === form.value.workOrderNo);
      if (existingIndex !== -1) {
        // 累加入库值并保留最大可入库数量限制
        const newValue = Number(records.value[existingIndex].packingQty) + Number(form.value.packingQty);
        const maxAllowed = form.value.plannedQty;

        if (maxAllowed && newValue > maxAllowed) {
          proxy?.$modal.msgError(`工单${form.value.workOrderNo}打包数量不能超过最大可入库数量：${maxAllowed}`);
          records.value[existingIndex].packingQty = maxAllowed;
          inboundDialogVisible.value = false;
          resetForm();
          return;
        }

        records.value[existingIndex].packingQty = newValue;
        proxy?.$modal.msgSuccess(`工单${form.value.workOrderNo}打包数量已累加，总打包数量：${form.value.packingQty}`);
      } else {
        // 添加新记录
        records.value.push({ ...form.value });
        proxy?.$modal.msgSuccess(`工单${form.value.workOrderNo}，总打包数量：${form.value.packingQty}`);
      }
      inboundDialogVisible.value = false;
      resetForm();
    }
  });
};

// 重置表单
const resetForm = () => {
  if (queryFormRef.value) {
    queryFormRef.value.resetFields();
  }
  if (recordFormRef.value) {
    recordFormRef.value.resetFields();
  }
  selectedWorkOrder.value = initFormData;
};

onMounted(() => {});
const initWorkOrderDialog = (packingDetailList: any) => {
  records.value = packingDetailList;
  getWorkOrderList();
};

defineExpose({
  openDialog,
  closeDialog,
  initWorkOrderDialog
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
