<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="交货单号" prop="deliveryOrderNo">
              <el-input v-model="queryParams.deliveryOrderNo" placeholder="请输入交货单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="交货单行号" prop="deliveryItemNo">
              <el-input v-model="queryParams.deliveryItemNo" placeholder="请输入交货单行号" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:deliveryOrderDetail:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:deliveryOrderDetail:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:deliveryOrderDetail:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:deliveryOrderDetail:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="deliveryOrderDetailList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <!--        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />-->
        <el-table-column label="交货单号" align="center" prop="deliveryOrderNo" min-width="120" />
        <el-table-column label="交货单行号" align="center" prop="deliveryItemNo" min-width="120" />
        <el-table-column label="项目类别" align="center" prop="itemCategory" />
        <el-table-column label="采购单号" align="center" prop="purchaseOrderNo" />
        <el-table-column label="采购单行号" align="center" prop="purchaseItemNo" min-width="120" />
        <el-table-column label="物料号" align="center" prop="materialCode" min-width="140" />
        <el-table-column label="物料描述" align="left" prop="materialDesc" show-overflow-tooltip min-width="300" />
        <el-table-column label="供应商代码" align="center" prop="supplierCode" min-width="120" />
        <el-table-column label="供应商名称" align="center" prop="supplierName" show-overflow-tooltip min-width="200" />
        <el-table-column label="交货日期" align="center" prop="deliveryDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.deliveryDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="采购组" align="center" prop="purchasingGroup" />
        <el-table-column label="采购组织" align="center" prop="purchasingOrg" />
        <el-table-column label="订单数量" align="center" prop="orderQuantity" />
        <el-table-column label="订单单位" align="center" prop="orderUnit" />
        <el-table-column label="已收数量" align="center" prop="receivedQuantity" />
        <el-table-column label="未清数量" align="center" prop="openQuantity" />
        <el-table-column label="库存单位" align="center" prop="inventoryUnit" />
        <el-table-column label="换算比例" align="center" prop="conversionRatio" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:deliveryOrderDetail:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:deliveryOrderDetail:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改STO交货单明细对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="deliveryOrderDetailFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="交货单号" prop="deliveryOrderNo">
          <el-input v-model="form.deliveryOrderNo" placeholder="请输入交货单号" />
        </el-form-item>
        <el-form-item label="交货单行号" prop="deliveryItemNo">
          <el-input v-model="form.deliveryItemNo" placeholder="请输入交货单行号" />
        </el-form-item>
        <el-form-item label="交货项目类别" prop="itemCategory">
          <el-input v-model="form.itemCategory" placeholder="请输入交货项目类别" />
        </el-form-item>
        <el-form-item label="采购单号" prop="purchaseOrderNo">
          <el-input v-model="form.purchaseOrderNo" placeholder="请输入采购单号" />
        </el-form-item>
        <el-form-item label="采购单行号" prop="purchaseItemNo">
          <el-input v-model="form.purchaseItemNo" placeholder="请输入采购单行号" />
        </el-form-item>
        <el-form-item label="物料号" prop="materialCode">
          <el-input v-model="form.materialCode" placeholder="请输入物料号" />
        </el-form-item>
        <el-form-item label="物料描述" prop="materialDesc">
          <el-input v-model="form.materialDesc" placeholder="请输入物料描述" />
        </el-form-item>
        <el-form-item label="交货日期" prop="deliveryDate">
          <el-date-picker clearable v-model="form.deliveryDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择交货日期"> </el-date-picker>
        </el-form-item>
        <el-form-item label="订单数量" prop="orderQuantity">
          <el-input v-model="form.orderQuantity" placeholder="请输入订单数量" />
        </el-form-item>
        <el-form-item label="订单单位" prop="orderUnit">
          <el-input v-model="form.orderUnit" placeholder="请输入订单单位" />
        </el-form-item>
        <el-form-item label="已收数量" prop="receivedQuantity">
          <el-input v-model="form.receivedQuantity" placeholder="请输入已收数量" />
        </el-form-item>
        <el-form-item label="未清数量" prop="openQuantity">
          <el-input v-model="form.openQuantity" placeholder="请输入未清数量" />
        </el-form-item>
        <el-form-item label="库存单位" prop="inventoryUnit">
          <el-input v-model="form.inventoryUnit" placeholder="请输入库存单位" />
        </el-form-item>
        <el-form-item label="换算比例" prop="conversionRatio">
          <el-input v-model="form.conversionRatio" placeholder="请输入换算比例" />
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

<script setup name="DeliveryOrderDetail" lang="ts">
import { listDeliveryOrderDetail, getDeliveryOrderDetail, delDeliveryOrderDetail, addDeliveryOrderDetail, updateDeliveryOrderDetail } from '@/api/wms/deliveryOrderDetail';
import { DeliveryOrderDetailVO, DeliveryOrderDetailQuery, DeliveryOrderDetailForm } from '@/api/wms/deliveryOrderDetail/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const deliveryOrderDetailList = ref<DeliveryOrderDetailVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const deliveryOrderDetailFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: DeliveryOrderDetailForm = {
  id: undefined,
  deliveryOrderNo: undefined,
  deliveryItemNo: undefined,
  itemCategory: undefined,
  purchaseOrderNo: undefined,
  purchaseItemNo: undefined,
  materialCode: undefined,
  materialDesc: undefined,
  deliveryDate: undefined,
  orderQuantity: undefined,
  orderUnit: undefined,
  receivedQuantity: undefined,
  openQuantity: undefined,
  inventoryUnit: undefined,
  conversionRatio: undefined,
  remark: undefined
};
const data = reactive<PageData<DeliveryOrderDetailForm, DeliveryOrderDetailQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deliveryOrderNo: undefined,
    deliveryItemNo: undefined,
    itemCategory: undefined,
    purchaseOrderNo: undefined,
    purchaseItemNo: undefined,
    materialCode: undefined,
    materialDesc: undefined,
    deliveryDate: undefined,
    orderQuantity: undefined,
    orderUnit: undefined,
    receivedQuantity: undefined,
    openQuantity: undefined,
    inventoryUnit: undefined,
    conversionRatio: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    deliveryOrderNo: [{ required: true, message: '交货单号不能为空', trigger: 'blur' }],
    deliveryItemNo: [{ required: true, message: '交货单行号不能为空', trigger: 'blur' }],
    itemCategory: [{ required: true, message: '交货项目类别不能为空', trigger: 'blur' }],
    purchaseOrderNo: [{ required: true, message: '采购单号不能为空', trigger: 'blur' }],
    purchaseItemNo: [{ required: true, message: '采购单行号不能为空', trigger: 'blur' }],
    materialCode: [{ required: true, message: '物料号不能为空', trigger: 'blur' }],
    materialDesc: [{ required: true, message: '物料描述不能为空', trigger: 'blur' }],
    deliveryDate: [{ required: true, message: '交货日期不能为空', trigger: 'blur' }],
    orderQuantity: [{ required: true, message: '订单数量不能为空', trigger: 'blur' }],
    orderUnit: [{ required: true, message: '订单单位不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询STO交货单明细列表 */
const getList = async () => {
  loading.value = true;
  const res = await listDeliveryOrderDetail(queryParams.value);
  deliveryOrderDetailList.value = res.rows;
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
  deliveryOrderDetailFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: DeliveryOrderDetailVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加STO交货单明细';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: DeliveryOrderDetailVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getDeliveryOrderDetail(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改STO交货单明细';
};

/** 提交按钮 */
const submitForm = () => {
  deliveryOrderDetailFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateDeliveryOrderDetail(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addDeliveryOrderDetail(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: DeliveryOrderDetailVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除STO交货单明细编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delDeliveryOrderDetail(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/deliveryOrderDetail/export',
    {
      ...queryParams.value
    },
    `deliveryOrderDetail_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
