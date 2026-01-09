<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="物料编码" prop="itemCode">
              <el-input v-model="queryParams.itemCode" placeholder="请输入物料编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="供应商批次号" prop="supplierBatchNo">
              <el-input v-model="queryParams.supplierBatchNo" placeholder="请输入供应商批次号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="批次号" prop="batchCode">
              <el-input v-model="queryParams.batchCode" placeholder="请输入批次号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="根批次号" prop="rootBatchCode">
              <el-input v-model="queryParams.rootBatchCode" placeholder="请输入根批次号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="接收日期" prop="receivedDate">
              <el-date-picker clearable v-model="queryParams.receivedDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择接收日期" />
            </el-form-item>
            <el-form-item label="过期日期" prop="expirationDate">
              <el-date-picker clearable v-model="queryParams.expirationDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择过期日期" />
            </el-form-item>
            <el-form-item label="业务伙伴" prop="businessCode">
              <el-input v-model="queryParams.businessCode" placeholder="请输入业务伙伴" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="来源单号" prop="orderNo">
              <el-input v-model="queryParams.orderNo" placeholder="请输入来源单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="仓库编码" prop="warehouseCode">
              <el-input v-model="queryParams.warehouseCode" placeholder="请输入仓库编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="库区编码" prop="areaCode">
              <el-input v-model="queryParams.areaCode" placeholder="请输入库区编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="库位编码" prop="locationCode">
              <el-input v-model="queryParams.locationCode" placeholder="请输入库位编码" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:batch:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:batch:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:batch:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:batch:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="batchList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
<!--        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />-->
        <el-table-column label="物料编码" align="center" prop="itemCode" fixed="left" min-width="150" />
        <el-table-column label="物料名称" align="center" prop="itemName" fixed="left" max-width="200" show-overflow-tooltip />
        <el-table-column label="数量" align="center" prop="quantity" />
        <el-table-column label="单位" align="center" prop="unit" />
        <el-table-column label="供应商批次" align="center" prop="supplierBatchNo" min-width="110" />
        <el-table-column label="批次号" align="center" prop="batchCode" min-width="110" />
        <el-table-column label="根批次号" align="center" prop="rootBatchCode" min-width="110" />
        <el-table-column label="序号" align="center" prop="sequence" />
        <el-table-column label="批次状态" align="center" prop="batchStatus" />
        <el-table-column label="接收日期" align="center" prop="receivedDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.receivedDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="过期日期" align="center" prop="expirationDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.expirationDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="业务伙伴" align="center" prop="businessCode" />
        <el-table-column label="伙伴名称" align="center" prop="businessName" />
        <el-table-column label="单号类型" align="center" prop="orderType" />
        <el-table-column label="来源单号" align="center" prop="orderNo" />
        <el-table-column label="仓库编码" align="center" prop="warehouseCode" />
        <el-table-column label="仓库名称" align="center" prop="warehouseName" />
        <el-table-column label="库区编码" align="center" prop="areaCode" />
        <el-table-column label="库区名称" align="center" prop="areaName" />
        <el-table-column label="库位编码" align="center" prop="locationCode" />
        <el-table-column label="库位名称" align="center" prop="locationName" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:batch:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:batch:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改批次对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="batchFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="物料编码" prop="itemCode">
          <el-input v-model="form.itemCode" placeholder="请输入物料编码" />
        </el-form-item>
        <el-form-item label="物料名称" prop="itemName">
          <el-input v-model="form.itemName" placeholder="请输入物料名称" />
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input v-model="form.quantity" placeholder="请输入数量" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="供应商批次号" prop="supplierBatchNo">
          <el-input v-model="form.supplierBatchNo" placeholder="请输入供应商批次号" />
        </el-form-item>
        <el-form-item label="批次号" prop="batchCode">
          <el-input v-model="form.batchCode" placeholder="请输入批次号" />
        </el-form-item>
        <el-form-item label="根批次号" prop="rootBatchCode">
          <el-input v-model="form.rootBatchCode" placeholder="请输入根批次号" />
        </el-form-item>
        <el-form-item label="序号" prop="sequence">
          <el-input v-model="form.sequence" placeholder="请输入序号" />
        </el-form-item>
        <el-form-item label="接收日期" prop="receivedDate">
          <el-date-picker clearable v-model="form.receivedDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择接收日期"> </el-date-picker>
        </el-form-item>
        <el-form-item label="过期日期" prop="expirationDate">
          <el-date-picker clearable v-model="form.expirationDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择过期日期"> </el-date-picker>
        </el-form-item>
        <el-form-item label="业务伙伴" prop="businessCode">
          <el-input v-model="form.businessCode" placeholder="请输入业务伙伴" />
        </el-form-item>
        <el-form-item label="业务伙伴名称" prop="businessName">
          <el-input v-model="form.businessName" placeholder="请输入业务伙伴名称" />
        </el-form-item>
        <el-form-item label="来源单号" prop="orderNo">
          <el-input v-model="form.orderNo" placeholder="请输入来源单号" />
        </el-form-item>
        <el-form-item label="仓库编码" prop="warehouseCode">
          <el-input v-model="form.warehouseCode" placeholder="请输入仓库编码" />
        </el-form-item>
        <el-form-item label="仓库名称" prop="warehouseName">
          <el-input v-model="form.warehouseName" placeholder="请输入仓库名称" />
        </el-form-item>
        <el-form-item label="库区编码" prop="areaCode">
          <el-input v-model="form.areaCode" placeholder="请输入库区编码" />
        </el-form-item>
        <el-form-item label="库区名称" prop="areaName">
          <el-input v-model="form.areaName" placeholder="请输入库区名称" />
        </el-form-item>
        <el-form-item label="库位编码" prop="locationCode">
          <el-input v-model="form.locationCode" placeholder="请输入库位编码" />
        </el-form-item>
        <el-form-item label="库位名称" prop="locationName">
          <el-input v-model="form.locationName" placeholder="请输入库位名称" />
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

<script setup name="Batch" lang="ts">
import { listBatch, getBatch, delBatch, addBatch, updateBatch } from '@/api/wms/batch';
import { BatchVO, BatchQuery, BatchForm } from '@/api/wms/batch/types';
import { dayjs } from 'element-plus';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const batchList = ref<BatchVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const batchFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: BatchForm = {
  id: undefined,
  itemCode: undefined,
  itemName: undefined,
  quantity: undefined,
  unit: undefined,
  supplierBatchNo: undefined,
  batchCode: undefined,
  rootBatchCode: undefined,
  sequence: undefined,
  batchStatus: undefined,
  receivedDate: undefined,
  expirationDate: undefined,
  businessCode: undefined,
  businessName: undefined,
  orderType: undefined,
  orderNo: undefined,
  warehouseCode: undefined,
  warehouseName: undefined,
  areaCode: undefined,
  areaName: undefined,
  locationCode: undefined,
  locationName: undefined,
  remark: undefined
};
const data = reactive<PageData<BatchForm, BatchQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    itemCode: undefined,
    itemName: undefined,
    quantity: undefined,
    unit: undefined,
    supplierBatchNo: undefined,
    batchCode: undefined,
    rootBatchCode: undefined,
    sequence: undefined,
    batchStatus: undefined,
    receivedDate: undefined,
    expirationDate: undefined,
    businessCode: undefined,
    businessName: undefined,
    orderType: undefined,
    orderNo: undefined,
    warehouseCode: undefined,
    warehouseName: undefined,
    areaCode: undefined,
    areaName: undefined,
    locationCode: undefined,
    locationName: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    itemCode: [{ required: true, message: '物料编码不能为空', trigger: 'blur' }],
    itemName: [{ required: true, message: '物料名称不能为空', trigger: 'blur' }],
    quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }],
    unit: [{ required: true, message: '单位不能为空', trigger: 'blur' }],
    supplierBatchNo: [{ required: true, message: '供应商批次号不能为空', trigger: 'blur' }],
    batchCode: [{ required: true, message: '批次号不能为空', trigger: 'blur' }],
    rootBatchCode: [{ required: true, message: '根批次号不能为空', trigger: 'blur' }],
    sequence: [{ required: true, message: '序号不能为空', trigger: 'blur' }],

    receivedDate: [{ required: true, message: '接收日期不能为空', trigger: 'blur' }],
    expirationDate: [{ required: true, message: '过期日期不能为空', trigger: 'blur' }],
    businessCode: [{ required: true, message: '业务伙伴不能为空', trigger: 'blur' }],
    businessName: [{ required: true, message: '业务伙伴名称不能为空', trigger: 'blur' }],

    orderNo: [{ required: true, message: '来源单号不能为空', trigger: 'blur' }],
    warehouseCode: [{ required: true, message: '仓库编码不能为空', trigger: 'blur' }],
    warehouseName: [{ required: true, message: '仓库名称不能为空', trigger: 'blur' }],
    areaCode: [{ required: true, message: '库区编码不能为空', trigger: 'blur' }],
    areaName: [{ required: true, message: '库区名称不能为空', trigger: 'blur' }],
    locationCode: [{ required: true, message: '库位编码不能为空', trigger: 'blur' }],
    locationName: [{ required: true, message: '库位名称不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询批次列表 */
const getList = async () => {
  loading.value = true;
  if (queryParams.value.receivedDate) {
    queryParams.value.receivedDate = dayjs(queryParams.value.receivedDate).format('YYYY-MM-DD HH:mm:ss');
  }
  if (queryParams.value.expirationDate) {
    queryParams.value.expirationDate = dayjs(queryParams.value.expirationDate).format('YYYY-MM-DD HH:mm:ss');
  }
  const res = await listBatch(queryParams.value);
  batchList.value = res.rows;
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
  batchFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: BatchVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加批次';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: BatchVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getBatch(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改批次';
};

/** 提交按钮 */
const submitForm = () => {
  batchFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateBatch(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addBatch(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: BatchVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除批次编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delBatch(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/batch/export',
    {
      ...queryParams.value
    },
    `batch_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
