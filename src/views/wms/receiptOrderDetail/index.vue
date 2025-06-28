<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="入库单号" prop="receiptOrderId">
              <el-input v-model="queryParams.receiptOrderId" placeholder="请输入入库单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入物料" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="计划数量" prop="planQuantity">
              <el-input v-model="queryParams.planQuantity" placeholder="请输入计划数量" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="收货数量" prop="realQuantity">
              <el-input v-model="queryParams.realQuantity" placeholder="请输入收货数量" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="计量单位" prop="unit">
              <el-input v-model="queryParams.unit" placeholder="请输入计量单位" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="入库状态" prop="receiptOrderStatus">
              <el-select v-model="queryParams.receiptOrderStatus" placeholder="请选择入库状态" clearable >
                <el-option v-for="dict in wms_receipt_order_status" :key="dict.value" :label="dict.label" :value="dict.value"/>
              </el-select>
            </el-form-item>
            <el-form-item label="所属仓库" prop="warehouseId">
              <el-input v-model="queryParams.warehouseId" placeholder="请输入所属仓库" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="所属库区" prop="areaId">
              <el-input v-model="queryParams.areaId" placeholder="请输入所属库区" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="所属货架" prop="rackId">
              <el-input v-model="queryParams.rackId" placeholder="请输入所属货架" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:receiptOrderDetail:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:receiptOrderDetail:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:receiptOrderDetail:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:receiptOrderDetail:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="receiptOrderDetailList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />
        <el-table-column label="入库单号" align="center" prop="receiptOrderId" />
        <el-table-column label="物料" align="center" prop="item" />
        <el-table-column label="计划数量" align="center" prop="planQuantity" />
        <el-table-column label="收货数量" align="center" prop="realQuantity" />
        <el-table-column label="计量单位" align="center" prop="unit" />
        <el-table-column label="入库状态" align="center" prop="receiptOrderStatus">
          <template #default="scope">
            <dict-tag :options="wms_receipt_order_status" :value="scope.row.receiptOrderStatus"/>
          </template>
        </el-table-column>
        <el-table-column label="所属仓库" align="center" prop="warehouseId" />
        <el-table-column label="所属库区" align="center" prop="areaId" />
        <el-table-column label="所属货架" align="center" prop="rackId" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:receiptOrderDetail:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:receiptOrderDetail:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改入库单详情对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="receiptOrderDetailFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="入库单号" prop="receiptOrderId">
          <el-input v-model="form.receiptOrderId" placeholder="请输入入库单号" />
        </el-form-item>
        <el-form-item label="物料" prop="item">
          <el-input v-model="form.item" placeholder="请输入物料" />
        </el-form-item>
        <el-form-item label="计划数量" prop="planQuantity">
          <el-input v-model="form.planQuantity" placeholder="请输入计划数量" />
        </el-form-item>
        <el-form-item label="收货数量" prop="realQuantity">
          <el-input v-model="form.realQuantity" placeholder="请输入收货数量" />
        </el-form-item>
        <el-form-item label="计量单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入计量单位" />
        </el-form-item>
        <el-form-item label="入库状态" prop="receiptOrderStatus">
          <el-radio-group v-model="form.receiptOrderStatus">
            <el-radio
              v-for="dict in wms_receipt_order_status"
              :key="dict.value"
              :value="parseInt(dict.value)"
            >{{dict.label}}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="所属仓库" prop="warehouseId">
          <el-input v-model="form.warehouseId" placeholder="请输入所属仓库" />
        </el-form-item>
        <el-form-item label="所属库区" prop="areaId">
          <el-input v-model="form.areaId" placeholder="请输入所属库区" />
        </el-form-item>
        <el-form-item label="所属货架" prop="rackId">
          <el-input v-model="form.rackId" placeholder="请输入所属货架" />
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

<script setup name="ReceiptOrderDetail" lang="ts">
import { listReceiptOrderDetail, getReceiptOrderDetail, delReceiptOrderDetail, addReceiptOrderDetail, updateReceiptOrderDetail } from '@/api/wms/receiptOrderDetail';
import { ReceiptOrderDetailVO, ReceiptOrderDetailQuery, ReceiptOrderDetailForm } from '@/api/wms/receiptOrderDetail/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_receipt_order_status } = toRefs<any>(proxy?.useDict('wms_receipt_order_status'));

const receiptOrderDetailList = ref<ReceiptOrderDetailVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const receiptOrderDetailFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ReceiptOrderDetailForm = {
  id: undefined,
  receiptOrderId: undefined,
  item: undefined,
  planQuantity: undefined,
  realQuantity: undefined,
  unit: undefined,
  receiptOrderStatus: undefined,
  warehouseId: undefined,
  areaId: undefined,
  rackId: undefined,
  remark: undefined
}
const data = reactive<PageData<ReceiptOrderDetailForm, ReceiptOrderDetailQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    receiptOrderId: undefined,
    item: undefined,
    planQuantity: undefined,
    realQuantity: undefined,
    unit: undefined,
    receiptOrderStatus: undefined,
    warehouseId: undefined,
    areaId: undefined,
    rackId: undefined,
    params: {
    }
  },
  rules: {
    id: [
      { required: true, message: "唯一ID不能为空", trigger: "blur" }
    ],
    receiptOrderId: [
      { required: true, message: "入库单号不能为空", trigger: "blur" }
    ],
    item: [
      { required: true, message: "物料不能为空", trigger: "blur" }
    ],
    planQuantity: [
      { required: true, message: "计划数量不能为空", trigger: "blur" }
    ],
    realQuantity: [
      { required: true, message: "收货数量不能为空", trigger: "blur" }
    ],
    unit: [
      { required: true, message: "计量单位不能为空", trigger: "blur" }
    ],
    receiptOrderStatus: [
      { required: true, message: "入库状态不能为空", trigger: "change" }
    ],
    warehouseId: [
      { required: true, message: "所属仓库不能为空", trigger: "blur" }
    ],
    areaId: [
      { required: true, message: "所属库区不能为空", trigger: "blur" }
    ],
    rackId: [
      { required: true, message: "所属货架不能为空", trigger: "blur" }
    ],
    remark: [
      { required: true, message: "备注不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询入库单详情列表 */
const getList = async () => {
  loading.value = true;
  const res = await listReceiptOrderDetail(queryParams.value);
  receiptOrderDetailList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
}

/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  receiptOrderDetailFormRef.value?.resetFields();
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
}

/** 多选框选中数据 */
const handleSelectionChange = (selection: ReceiptOrderDetailVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加入库单详情";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: ReceiptOrderDetailVO) => {
  reset();
  const _id = row?.id || ids.value[0]
  const res = await getReceiptOrderDetail(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改入库单详情";
}

/** 提交按钮 */
const submitForm = () => {
  receiptOrderDetailFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateReceiptOrderDetail(form.value).finally(() =>  buttonLoading.value = false);
      } else {
        await addReceiptOrderDetail(form.value).finally(() =>  buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: ReceiptOrderDetailVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除入库单详情编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
  await delReceiptOrderDetail(_ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('wms/receiptOrderDetail/export', {
    ...queryParams.value
  }, `receiptOrderDetail_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>
