<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="产品料号" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入产品料号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="产品描述" prop="itemDesc">
              <el-input v-model="queryParams.itemDesc" placeholder="请输入产品描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="入库检" prop="checkEnable">
              <el-select v-model="queryParams.checkEnable" placeholder="请选择入库检" clearable>
                <el-option v-for="dict in wms_work_order_check_enable" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="计划开工日期" prop="plannedStartDate">
              <el-date-picker v-model="queryParams.plannedStartDate" clearable type="date" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择计划开工日期" />
            </el-form-item>
            <el-form-item label="计划完工日期" prop="plannedEndDate">
              <el-date-picker v-model="queryParams.plannedEndDate" clearable type="date" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择计划完工日期" />
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
            <el-button v-hasPermi="['wms:workOrder:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:workOrder:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:workOrder:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:workOrder:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="workOrderList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="工单号" align="center" prop="workOrderNo">
          <template #default="scope">
            <router-link :to="'/warehouse/workOrder/detail/' + scope.row.workOrderNo" class="link-type">
              <span>{{ scope.row.workOrderNo }}</span>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column label="产品料号" align="center" prop="item" />
        <el-table-column label="产品描述" align="center" prop="itemDesc" />
        <el-table-column label="入库检" align="center" prop="checkEnable">
          <template #default="scope">
            <dict-tag :options="wms_work_order_check_enable" :value="scope.row.checkEnable" />
          </template>
        </el-table-column>
        <el-table-column label="计划开工日期" align="center" prop="plannedStartDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.plannedStartDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="计划完工日期" align="center" prop="plannedEndDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.plannedEndDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="计划数量" align="center" prop="plannedQty" />
        <el-table-column label="已交货数量" align="center" prop="deliveredQty" />
        <el-table-column label="单位" align="center" prop="unit" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['wms:workOrder:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['wms:workOrder:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <!-- 添加或修改工单信息对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="workOrderFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="工单号" prop="workOrderNo">
          <el-input v-model="form.workOrderNo" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="产品料号" prop="item">
          <el-input v-model="form.item" placeholder="请输入产品料号" />
        </el-form-item>
        <el-form-item label="产品描述" prop="itemDesc">
          <el-input v-model="form.itemDesc" placeholder="请输入产品描述" />
        </el-form-item>
        <el-form-item label="入库检" prop="checkEnable">
          <el-radio-group v-model="form.checkEnable">
            <el-radio v-for="dict in wms_work_order_check_enable" :key="dict.value" :value="parseInt(dict.value)">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="计划开工日期" prop="plannedStartDate">
          <el-date-picker v-model="form.plannedStartDate" clearable type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择计划开工日期"> </el-date-picker>
        </el-form-item>
        <el-form-item label="计划完工日期" prop="plannedEndDate">
          <el-date-picker v-model="form.plannedEndDate" clearable type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择计划完工日期"> </el-date-picker>
        </el-form-item>
        <el-form-item label="计划数量" prop="plannedQty">
          <el-input v-model="form.plannedQty" placeholder="请输入计划数量" />
        </el-form-item>
        <el-form-item label="已交货数量" prop="deliveredQty">
          <el-input v-model="form.deliveredQty" placeholder="请输入已交货数量" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="WorkOrder" lang="ts">
import { listWorkOrder, getWorkOrder, delWorkOrder, addWorkOrder, updateWorkOrder } from '@/api/wms/workOrder';
import { WorkOrderVO, WorkOrderQuery, WorkOrderForm } from '@/api/wms/workOrder/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_work_order_check_enable } = toRefs<any>(proxy?.useDict('wms_work_order_check_enable'));

const workOrderList = ref<WorkOrderVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const workOrderFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

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
    waitStockQty: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    workOrderNo: [{ required: true, message: '工单号不能为空', trigger: 'blur' }],
    item: [{ required: true, message: '产品料号不能为空', trigger: 'blur' }],
    itemDesc: [{ required: true, message: '产品描述不能为空', trigger: 'blur' }],
    checkEnable: [{ required: true, message: '入库检不能为空', trigger: 'change' }],
    plannedStartDate: [{ required: true, message: '计划开工日期不能为空', trigger: 'blur' }],
    plannedEndDate: [{ required: true, message: '计划完工日期不能为空', trigger: 'blur' }],
    plannedQty: [{ required: true, message: '计划数量不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询工单信息列表 */
const getList = async () => {
  loading.value = true;
  const res = await listWorkOrder(queryParams.value);
  workOrderList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  workOrderFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: WorkOrderVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加工单信息';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: WorkOrderVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getWorkOrder(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工单信息';
};

/** 提交按钮 */
const submitForm = () => {
  workOrderFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateWorkOrder(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addWorkOrder(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: WorkOrderVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工单信息编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delWorkOrder(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/workOrder/export',
    {
      ...queryParams.value
    },
    `workOrder_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
