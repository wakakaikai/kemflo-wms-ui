<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="交货单号" prop="deliveryOrderNo">
              <el-input v-model="queryParams.deliveryOrderNo" placeholder="请输入交货单号" clearable @keydown.tab.prevent="handleQuery" @keydown.enter.prevent="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:deliveryOrder:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:deliveryOrder:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:deliveryOrder:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:deliveryOrder:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="deliveryOrderList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <!--        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />-->
        <el-table-column label="交货单号" align="center" prop="deliveryOrderNo" width="150">
          <template #default="scope">
            <router-link :to="'/basic/warehouse/deliveryOrderDetail?id=' + scope.row.id" class="link-type">
              <span>{{ scope.row.deliveryOrderNo }}</span>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column label="客户编号" align="center" prop="customerNo" />
        <el-table-column label="售达方" align="center" prop="recipient" />
        <el-table-column label="销售组织" align="center" prop="salesOrg" />
        <el-table-column label="收货点" align="center" prop="shippingPoint" />
        <el-table-column label="装运条件" align="center" prop="shippingCondition" />
        <el-table-column label="凭证类型" align="center" prop="docType" />
        <el-table-column label="交货日期" align="center" prop="deliveryDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.deliveryDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="拣配日期" align="center" prop="pickingDate" width="180" />
        <el-table-column label="装货日期" align="center" prop="loadingDate" width="180" />
        <el-table-column label="运输计划日期" align="center" prop="transportPlanDate" width="180" />
        <el-table-column label="发货日期" align="center" prop="goodsIssueDate" width="180" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:deliveryOrder:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:deliveryOrder:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改STO交货单对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="deliveryOrderFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="交货单号" prop="deliveryOrderNo">
          <el-input v-model="form.deliveryOrderNo" placeholder="请输入交货单号" />
        </el-form-item>
        <el-form-item label="客户编号" prop="customerNo">
          <el-input v-model="form.customerNo" placeholder="请输入客户编号" />
        </el-form-item>
        <el-form-item label="售达方" prop="recipient">
          <el-input v-model="form.recipient" placeholder="请输入售达方" />
        </el-form-item>
        <el-form-item label="销售组织" prop="salesOrg">
          <el-input v-model="form.salesOrg" placeholder="请输入销售组织" />
        </el-form-item>
        <el-form-item label="收货点" prop="shippingPoint">
          <el-input v-model="form.shippingPoint" placeholder="请输入收货点" />
        </el-form-item>
        <el-form-item label="装运条件" prop="shippingCondition">
          <el-input v-model="form.shippingCondition" placeholder="请输入装运条件" />
        </el-form-item>
        <el-form-item label="拣配日期" prop="pickingDate">
          <el-date-picker clearable v-model="form.pickingDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择拣配日期"> </el-date-picker>
        </el-form-item>
        <el-form-item label="装货日期" prop="loadingDate">
          <el-date-picker clearable v-model="form.loadingDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择装货日期"> </el-date-picker>
        </el-form-item>
        <el-form-item label="交货日期" prop="deliveryDate">
          <el-date-picker clearable v-model="form.deliveryDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择交货日期"> </el-date-picker>
        </el-form-item>
        <el-form-item label="运输计划日期" prop="transportPlanDate">
          <el-date-picker clearable v-model="form.transportPlanDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择运输计划日期"> </el-date-picker>
        </el-form-item>
        <el-form-item label="发货日期" prop="goodsIssueDate">
          <el-date-picker clearable v-model="form.goodsIssueDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择发货日期"> </el-date-picker>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DeliveryOrder" lang="ts">
import { listDeliveryOrder, getDeliveryOrder, delDeliveryOrder, addDeliveryOrder, updateDeliveryOrder } from '@/api/wms/deliveryOrder';
import { DeliveryOrderVO, DeliveryOrderQuery, DeliveryOrderForm } from '@/api/wms/deliveryOrder/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const deliveryOrderList = ref<DeliveryOrderVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const deliveryOrderFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: DeliveryOrderForm = {
  id: undefined,
  deliveryOrderNo: undefined,
  customerNo: undefined,
  recipient: undefined,
  salesOrg: undefined,
  shippingPoint: undefined,
  shippingCondition: undefined,
  docType: undefined,
  pickingDate: undefined,
  loadingDate: undefined,
  deliveryDate: undefined,
  transportPlanDate: undefined,
  goodsIssueDate: undefined,
  remark: undefined
};
const data = reactive<PageData<DeliveryOrderForm, DeliveryOrderQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deliveryOrderNo: undefined,
    customerNo: undefined,
    recipient: undefined,
    salesOrg: undefined,
    shippingPoint: undefined,
    shippingCondition: undefined,
    docType: undefined,
    pickingDate: undefined,
    loadingDate: undefined,
    deliveryDate: undefined,
    transportPlanDate: undefined,
    goodsIssueDate: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    deliveryOrderNo: [{ required: true, message: '交货单号不能为空', trigger: 'blur' }],
    customerNo: [{ required: true, message: '客户编号不能为空', trigger: 'blur' }],
    recipient: [{ required: true, message: '售达方不能为空', trigger: 'blur' }],
    salesOrg: [{ required: true, message: '销售组织不能为空', trigger: 'blur' }],
    shippingPoint: [{ required: true, message: '收货点不能为空', trigger: 'blur' }],
    shippingCondition: [{ required: true, message: '装运条件不能为空', trigger: 'blur' }],
    docType: [{ required: true, message: '凭证类型不能为空', trigger: 'change' }],
    pickingDate: [{ required: true, message: '拣配日期不能为空', trigger: 'blur' }],
    loadingDate: [{ required: true, message: '装货日期不能为空', trigger: 'blur' }],
    deliveryDate: [{ required: true, message: '交货日期不能为空', trigger: 'blur' }],
    transportPlanDate: [{ required: true, message: '运输计划日期不能为空', trigger: 'blur' }],
    goodsIssueDate: [{ required: true, message: '发货日期不能为空', trigger: 'blur' }],
    remark: [{ required: true, message: '备注不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询STO交货单列表 */
const getList = async () => {
  loading.value = true;
  const res = await listDeliveryOrder(queryParams.value);
  deliveryOrderList.value = res.rows;
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
  deliveryOrderFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: DeliveryOrderVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加STO交货单';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: DeliveryOrderVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getDeliveryOrder(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改STO交货单';
};

/** 提交按钮 */
const submitForm = () => {
  deliveryOrderFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateDeliveryOrder(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addDeliveryOrder(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: DeliveryOrderVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除STO交货单编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delDeliveryOrder(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/deliveryOrder/export',
    {
      ...queryParams.value
    },
    `deliveryOrder_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
