<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="销售订单号" prop="salesOrderNo">
              <el-input v-model="queryParams.salesOrderNo" placeholder="请输入销售订单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="订单项次" prop="salesItemNo">
              <el-input v-model="queryParams.salesItemNo" placeholder="请输入销售订单项次" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:salesOrderDetail:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:salesOrderDetail:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:salesOrderDetail:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:salesOrderDetail:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="salesOrderDetailList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <!--        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />-->
        <el-table-column label="销售订单号" align="center" prop="salesOrderNo" />
        <el-table-column label="销售订单项次" align="center" prop="salesItemNo" />
        <el-table-column label="物料号" align="center" prop="materialCode" />
        <el-table-column label="物料描述" align="center" prop="materialDesc" show-overflow-tooltip />
        <el-table-column label="订单数量" align="center" prop="orderQuantity" />
        <el-table-column label="订单单位" align="center" prop="orderUnit" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:salesOrderDetail:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:salesOrderDetail:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改销售订单明细对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="salesOrderDetailFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="销售订单号" prop="salesOrderNo">
          <el-input v-model="form.salesOrderNo" placeholder="请输入销售订单号" />
        </el-form-item>
        <el-form-item label="订单项次" prop="salesItemNo">
          <el-input v-model="form.salesItemNo" placeholder="请输入销售订单项次" />
        </el-form-item>
        <el-form-item label="物料号" prop="materialCode">
          <el-input v-model="form.materialCode" placeholder="请输入物料号" />
        </el-form-item>
        <el-form-item label="物料描述" prop="materialDesc">
          <el-input v-model="form.materialDesc" placeholder="请输入物料描述" />
        </el-form-item>
        <el-form-item label="订单数量" prop="orderQuantity">
          <el-input v-model="form.orderQuantity" placeholder="请输入订单数量" />
        </el-form-item>
        <el-form-item label="订单单位" prop="orderUnit">
          <el-input v-model="form.orderUnit" placeholder="请输入订单单位" />
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

<script setup name="SalesOrderDetail" lang="ts">
import { listSalesOrderDetail, getSalesOrderDetail, delSalesOrderDetail, addSalesOrderDetail, updateSalesOrderDetail } from '@/api/wms/salesOrderDetail';
import { SalesOrderDetailVO, SalesOrderDetailQuery, SalesOrderDetailForm } from '@/api/wms/salesOrderDetail/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const salesOrderDetailList = ref<SalesOrderDetailVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const salesOrderDetailFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: SalesOrderDetailForm = {
  id: undefined,
  salesOrderNo: undefined,
  salesItemNo: undefined,
  materialCode: undefined,
  materialDesc: undefined,
  orderQuantity: undefined,
  orderUnit: undefined
};
const data = reactive<PageData<SalesOrderDetailForm, SalesOrderDetailQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    salesOrderNo: undefined,
    salesItemNo: undefined,
    materialCode: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    salesOrderNo: [{ required: true, message: '销售订单号不能为空', trigger: 'blur' }],
    salesItemNo: [{ required: true, message: '销售订单项次不能为空', trigger: 'blur' }],
    materialCode: [{ required: true, message: '物料号不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询销售订单明细列表 */
const getList = async () => {
  loading.value = true;
  const res = await listSalesOrderDetail(queryParams.value);
  salesOrderDetailList.value = res.rows;
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
  salesOrderDetailFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: SalesOrderDetailVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加销售订单明细';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: SalesOrderDetailVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getSalesOrderDetail(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改销售订单明细';
};

/** 提交按钮 */
const submitForm = () => {
  salesOrderDetailFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateSalesOrderDetail(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addSalesOrderDetail(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: SalesOrderDetailVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除销售订单明细编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delSalesOrderDetail(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/salesOrderDetail/export',
    {
      ...queryParams.value
    },
    `salesOrderDetail_${new Date().getTime()}.xlsx`
  );
};

/** 监听路由参数变化 */
watch(
  () => route.query.salesOrderNo,
  (newVal) => {
    if (newVal) {
      queryParams.value.salesOrderNo = newVal as string;
      queryParams.value.pageNum = 1;
      getList();
    }
  }
);

onMounted(() => {
  if (route.query.salesOrderNo) {
    queryParams.value.salesOrderNo = route.query.salesOrderNo as string;
    queryParams.value.pageNum = 1;
  }
  getList();
});
</script>
