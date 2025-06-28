<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="入库单号" prop="receiptOrderNo">
              <el-input v-model="queryParams.receiptOrderNo" placeholder="请输入入库单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="入库类型" prop="receiptOrderType">
              <el-select v-model="queryParams.receiptOrderType" placeholder="请选择入库类型" clearable>
                <el-option v-for="dict in wms_receipt_order_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="订单号" prop="orderNo">
              <el-input v-model="queryParams.orderNo" placeholder="请输入订单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="供应商" prop="supplierId">
              <el-input v-model="queryParams.supplierId" placeholder="请输入供应商" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="入库状态" prop="receiptOrderStatus">
              <el-select v-model="queryParams.receiptOrderStatus" placeholder="请选择入库状态" clearable>
                <el-option v-for="dict in wms_receipt_order_status" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="批次号" prop="batchNo">
              <el-input v-model="queryParams.batchNo" placeholder="请输入批次号" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:receiptOrder:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:receiptOrder:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:receiptOrder:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:receiptOrder:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="receiptOrderList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="入库单号" align="center" prop="receiptOrderNo" />
        <el-table-column label="入库类型" align="center" prop="receiptOrderType">
          <template #default="scope">
            <dict-tag :options="wms_receipt_order_type" :value="scope.row.receiptOrderType" />
          </template>
        </el-table-column>
        <el-table-column label="订单号" align="center" prop="orderNo" />
        <el-table-column label="供应商" align="center" prop="supplierId" />
        <el-table-column label="入库状态" align="center" prop="receiptOrderStatus">
          <template #default="scope">
            <dict-tag :options="wms_receipt_order_status" :value="scope.row.receiptOrderStatus" />
          </template>
        </el-table-column>
        <el-table-column label="批次号" align="center" prop="batchNo" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:receiptOrder:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:receiptOrder:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改入库单对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="receiptOrderFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="入库单号" prop="receiptOrderNo">
          <el-input v-model="form.receiptOrderNo" placeholder="请输入入库单号" />
        </el-form-item>
        <el-form-item label="入库类型" prop="receiptOrderType">
          <el-radio-group v-model="form.receiptOrderType">
            <el-radio v-for="dict in wms_receipt_order_type" :key="dict.value" :value="parseInt(dict.value)">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="订单号" prop="orderNo">
          <el-input v-model="form.orderNo" placeholder="请输入订单号" />
        </el-form-item>
        <el-form-item label="供应商" prop="supplierId">
          <el-input v-model="form.supplierId" placeholder="请输入供应商" />
        </el-form-item>
        <el-form-item label="入库状态 1：未发货 2：在途" prop="receiptOrderStatus">
          <el-radio-group v-model="form.receiptOrderStatus">
            <el-radio v-for="dict in wms_receipt_order_status" :key="dict.value" :value="parseInt(dict.value)">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="批次号" prop="batchNo">
          <el-input v-model="form.batchNo" placeholder="请输入批次号" />
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

<script setup name="ReceiptOrder" lang="ts">
import { listReceiptOrder, getReceiptOrder, delReceiptOrder, addReceiptOrder, updateReceiptOrder } from '@/api/wms/receiptOrder';
import { ReceiptOrderVO, ReceiptOrderQuery, ReceiptOrderForm } from '@/api/wms/receiptOrder/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_receipt_order_status, wms_receipt_order_type } = toRefs<any>(proxy?.useDict('wms_receipt_order_status', 'wms_receipt_order_type'));

const receiptOrderList = ref<ReceiptOrderVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const receiptOrderFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ReceiptOrderForm = {
  id: undefined,
  receiptOrderNo: undefined,
  receiptOrderType: undefined,
  orderNo: undefined,
  supplierId: undefined,
  receiptOrderStatus: undefined,
  batchNo: undefined,
  remark: undefined
};
const data = reactive<PageData<ReceiptOrderForm, ReceiptOrderQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    receiptOrderNo: undefined,
    receiptOrderType: undefined,
    orderNo: undefined,
    supplierId: undefined,
    receiptOrderStatus: undefined,
    batchNo: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    receiptOrderNo: [{ required: true, message: '入库单号不能为空', trigger: 'blur' }],
    receiptOrderType: [{ required: true, message: '入库类型：1: 采购入库 2：生产入库 3：其他入库不能为空', trigger: 'change' }],
    orderNo: [{ required: true, message: '订单号不能为空', trigger: 'blur' }],
    supplierId: [{ required: true, message: '供应商不能为空', trigger: 'blur' }],
    receiptOrderStatus: [{ required: true, message: '入库状态 1：未发货 2：在途不能为空', trigger: 'change' }],
    batchNo: [{ required: true, message: '批次号不能为空', trigger: 'blur' }],
    remark: [{ required: true, message: '备注不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询入库单列表 */
const getList = async () => {
  loading.value = true;
  const res = await listReceiptOrder(queryParams.value);
  receiptOrderList.value = res.rows;
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
  receiptOrderFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: ReceiptOrderVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加入库单';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: ReceiptOrderVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getReceiptOrder(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改入库单';
};

/** 提交按钮 */
const submitForm = () => {
  receiptOrderFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateReceiptOrder(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addReceiptOrder(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: ReceiptOrderVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除入库单编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delReceiptOrder(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/receiptOrder/export',
    {
      ...queryParams.value
    },
    `receiptOrder_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
