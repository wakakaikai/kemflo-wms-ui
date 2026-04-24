<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="销售订单号" prop="salesOrderNo">
              <el-input v-model="queryParams.salesOrderNo" placeholder="请输入销售订单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="凭证日期" prop="voucherDate">
              <el-date-picker clearable v-model="queryParams.voucherDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择凭证日期" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:salesOrder:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:salesOrder:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:salesOrder:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:salesOrder:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="salesOrderList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <!--        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />-->
        <el-table-column label="销售订单号" align="center" prop="salesOrderNo">
          <template #default="scope">
            <router-link :to="'/basic/warehouse/salesOrderDetail?salesOrderNo=' + scope.row.salesOrderNo" class="link-type">
              <span>{{ scope.row.salesOrderNo }}</span>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column label="凭证日期" align="center" prop="voucherDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.voucherDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="凭证类型" align="center" prop="voucherType" />
        <el-table-column label="销售组织" align="center" prop="salesOrg" />
        <el-table-column label="分销渠道" align="center" prop="salesChannel" />
        <el-table-column label="产品组" align="center" prop="productGroup" />
        <el-table-column label="售达方" align="center" prop="sellerParty" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:salesOrder:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:salesOrder:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改销售订单对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="salesOrderFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="销售订单号" prop="salesOrderNo">
          <el-input v-model="form.salesOrderNo" placeholder="请输入销售订单号" />
        </el-form-item>
        <el-form-item label="凭证日期" prop="voucherDate">
          <el-date-picker clearable v-model="form.voucherDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择凭证日期"> </el-date-picker>
        </el-form-item>
        <el-form-item label="销售组织" prop="salesOrg">
          <el-input v-model="form.salesOrg" placeholder="请输入销售组织" />
        </el-form-item>
        <el-form-item label="分销渠道" prop="salesChannel">
          <el-input v-model="form.salesChannel" placeholder="请输入分销渠道" />
        </el-form-item>
        <el-form-item label="产品组" prop="productGroup">
          <el-input v-model="form.productGroup" placeholder="请输入产品组" />
        </el-form-item>
        <el-form-item label="售达方" prop="sellerParty">
          <el-input v-model="form.sellerParty" placeholder="请输入售达方" />
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

<script setup name="SalesOrder" lang="ts">
import { listSalesOrder, getSalesOrder, delSalesOrder, addSalesOrder, updateSalesOrder } from '@/api/wms/salesOrder';
import { SalesOrderVO, SalesOrderQuery, SalesOrderForm } from '@/api/wms/salesOrder/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const salesOrderList = ref<SalesOrderVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const salesOrderFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: SalesOrderForm = {
  id: undefined,
  salesOrderNo: undefined,
  voucherDate: undefined,
  voucherType: undefined,
  salesOrg: undefined,
  salesChannel: undefined,
  productGroup: undefined,
  sellerParty: undefined
};
const data = reactive<PageData<SalesOrderForm, SalesOrderQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    salesOrderNo: undefined,
    voucherDate: undefined,
    voucherType: undefined,
    salesOrg: undefined,
    salesChannel: undefined,
    productGroup: undefined,
    sellerParty: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    salesOrderNo: [{ required: true, message: '销售订单号不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询销售订单列表 */
const getList = async () => {
  loading.value = true;
  const res = await listSalesOrder(queryParams.value);
  salesOrderList.value = res.rows;
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
  salesOrderFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: SalesOrderVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加销售订单';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: SalesOrderVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getSalesOrder(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改销售订单';
};

/** 提交按钮 */
const submitForm = () => {
  salesOrderFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateSalesOrder(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addSalesOrder(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: SalesOrderVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除销售订单编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delSalesOrder(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/salesOrder/export',
    {
      ...queryParams.value
    },
    `salesOrder_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
