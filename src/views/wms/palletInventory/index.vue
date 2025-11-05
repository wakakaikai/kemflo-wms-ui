<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="栈板编号" prop="palletCode">
              <el-input v-model="queryParams.palletCode" placeholder="请输入栈板编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料标识卡条码" prop="materialSn">
              <el-input v-model="queryParams.materialSn" placeholder="请输入物料标识卡条码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="批次号" prop="batchCode">
              <el-input v-model="queryParams.batchCode" placeholder="请输入批次号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="非限制数量" prop="availableQuantity">
              <el-input v-model="queryParams.availableQuantity" placeholder="请输入非限制数量" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="质检数量" prop="inspectionQuantity">
              <el-input v-model="queryParams.inspectionQuantity" placeholder="请输入质检数量" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="冻结数量" prop="blockedQuantity">
              <el-input v-model="queryParams.blockedQuantity" placeholder="请输入冻结数量" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="数量-报废" prop="scrappedQuantity">
              <el-input v-model="queryParams.scrappedQuantity" placeholder="请输入数量-报废" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="单位" prop="unit">
              <el-input v-model="queryParams.unit" placeholder="请输入单位" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="料号" prop="itemCode">
              <el-input v-model="queryParams.itemCode" placeholder="请输入料号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料名称" prop="itemName">
              <el-input v-model="queryParams.itemName" placeholder="请输入物料名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="库存类型" prop="inventoryType">
              <el-select v-model="queryParams.inventoryType" placeholder="请选择库存类型" clearable>
                <el-option v-for="dict in wms_inventory_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="库存状态" prop="inventoryStatus">
              <el-select v-model="queryParams.inventoryStatus" placeholder="请选择库存状态" clearable>
                <el-option v-for="dict in wms_inventory_status" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="入库状态" prop="stockInStatus">
              <el-select v-model="queryParams.stockInStatus" placeholder="请选择入库状态" clearable>
                <el-option v-for="dict in wms_stock_in_status" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="凭证年度" prop="materialDocYear">
              <el-input v-model="queryParams.materialDocYear" placeholder="请输入凭证年度" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料凭证号" prop="materialOrderNo">
              <el-input v-model="queryParams.materialOrderNo" placeholder="请输入物料凭证号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="生产日期" prop="productDate">
              <el-date-picker clearable v-model="queryParams.productDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择生产日期" />
            </el-form-item>
            <el-form-item label="失效日期" prop="expireDate">
              <el-date-picker clearable v-model="queryParams.expireDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择失效日期" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:palletInventory:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:palletInventory:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:palletInventory:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:palletInventory:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="palletInventoryList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />
        <el-table-column label="栈板编号" align="center" prop="palletCode" />
        <el-table-column label="工单号" align="center" prop="workOrderNo" />
        <el-table-column label="物料标识卡条码" align="center" prop="materialSn" />
        <el-table-column label="批次号" align="center" prop="batchCode" />
        <el-table-column label="非限制数量" align="center" prop="availableQuantity" />
        <el-table-column label="质检数量" align="center" prop="inspectionQuantity" />
        <el-table-column label="冻结数量" align="center" prop="blockedQuantity" />
        <el-table-column label="数量-报废" align="center" prop="scrappedQuantity" />
        <el-table-column label="单位" align="center" prop="unit" />
        <el-table-column label="料号" align="center" prop="itemCode" />
        <el-table-column label="物料名称" align="center" prop="itemName" />
        <el-table-column label="库存类型" align="center" prop="inventoryType">
          <template #default="scope">
            <dict-tag :options="wms_inventory_type" :value="scope.row.inventoryType" />
          </template>
        </el-table-column>
        <el-table-column label="库存状态" align="center" prop="inventoryStatus">
          <template #default="scope">
            <dict-tag :options="wms_inventory_status" :value="scope.row.inventoryStatus" />
          </template>
        </el-table-column>
        <el-table-column label="入库状态" align="center" prop="stockInStatus">
          <template #default="scope">
            <dict-tag :options="wms_stock_in_status" :value="scope.row.stockInStatus" />
          </template>
        </el-table-column>
        <el-table-column label="凭证年度" align="center" prop="materialDocYear" />
        <el-table-column label="物料凭证号" align="center" prop="materialOrderNo" />
        <el-table-column label="物料文件项次" align="center" prop="materialItem" />
        <el-table-column label="生产日期" align="center" prop="productDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.productDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="失效日期" align="center" prop="expireDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.expireDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:palletInventory:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:palletInventory:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改栈板库存明细对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="palletInventoryFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="栈板编号" prop="palletCode">
          <el-input v-model="form.palletCode" placeholder="请输入栈板编号" />
        </el-form-item>
        <el-form-item label="工单号" prop="workOrderNo">
          <el-input v-model="form.workOrderNo" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="物料标识卡条码" prop="materialSn">
          <el-input v-model="form.materialSn" placeholder="请输入物料标识卡条码" />
        </el-form-item>
        <el-form-item label="批次号" prop="batchCode">
          <el-input v-model="form.batchCode" placeholder="请输入批次号" />
        </el-form-item>
        <el-form-item label="非限制数量" prop="availableQuantity">
          <el-input v-model="form.availableQuantity" placeholder="请输入非限制数量" />
        </el-form-item>
        <el-form-item label="质检数量" prop="inspectionQuantity">
          <el-input v-model="form.inspectionQuantity" placeholder="请输入质检数量" />
        </el-form-item>
        <el-form-item label="冻结数量" prop="blockedQuantity">
          <el-input v-model="form.blockedQuantity" placeholder="请输入冻结数量" />
        </el-form-item>
        <el-form-item label="数量-报废" prop="scrappedQuantity">
          <el-input v-model="form.scrappedQuantity" placeholder="请输入数量-报废" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="料号" prop="itemCode">
          <el-input v-model="form.itemCode" placeholder="请输入料号" />
        </el-form-item>
        <el-form-item label="物料名称" prop="itemName">
          <el-input v-model="form.itemName" placeholder="请输入物料名称" />
        </el-form-item>
        <el-form-item label="库存类型" prop="inventoryType">
          <el-select v-model="form.inventoryType" placeholder="请选择库存类型">
            <el-option v-for="dict in wms_inventory_type" :key="dict.value" :label="dict.label" :value="dict.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="库存状态" prop="inventoryStatus">
          <el-select v-model="form.inventoryStatus" placeholder="请选择库存状态">
            <el-option v-for="dict in wms_inventory_status" :key="dict.value" :label="dict.label" :value="parseInt(dict.value)"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="入库状态" prop="stockInStatus">
          <el-select v-model="form.stockInStatus" placeholder="请选择入库状态">
            <el-option v-for="dict in wms_stock_in_status" :key="dict.value" :label="dict.label" :value="parseInt(dict.value)"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="凭证年度" prop="materialDocYear">
          <el-input v-model="form.materialDocYear" placeholder="请输入凭证年度" />
        </el-form-item>
        <el-form-item label="物料凭证号" prop="materialOrderNo">
          <el-input v-model="form.materialOrderNo" placeholder="请输入物料凭证号" />
        </el-form-item>
        <el-form-item label="物料文件项次" prop="materialItem">
          <el-input v-model="form.materialItem" placeholder="请输入物料文件项次" />
        </el-form-item>
        <el-form-item label="生产日期" prop="productDate">
          <el-date-picker clearable v-model="form.productDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择生产日期"> </el-date-picker>
        </el-form-item>
        <el-form-item label="失效日期" prop="expireDate">
          <el-date-picker clearable v-model="form.expireDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择失效日期"> </el-date-picker>
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

<script setup name="PalletInventory" lang="ts">
import { listPalletInventory, getPalletInventory, delPalletInventory, addPalletInventory, updatePalletInventory } from '@/api/wms/palletInventory';
import { PalletInventoryVO, PalletInventoryQuery, PalletInventoryForm } from '@/api/wms/palletInventory/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_status, wms_stock_in_status, wms_inventory_type } = toRefs<any>(proxy?.useDict('wms_inventory_status', 'wms_stock_in_status', 'wms_inventory_type'));

const palletInventoryList = ref<PalletInventoryVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const palletInventoryFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: PalletInventoryForm = {
  id: undefined,
  palletCode: undefined,
  workOrderNo: undefined,
  materialSn: undefined,
  batchCode: undefined,
  availableQuantity: undefined,
  inspectionQuantity: undefined,
  blockedQuantity: undefined,
  scrappedQuantity: undefined,
  unit: undefined,
  itemCode: undefined,
  itemName: undefined,
  inventoryType: undefined,
  inventoryStatus: undefined,
  stockInStatus: undefined,
  materialDocYear: undefined,
  materialOrderNo: undefined,
  materialItem: undefined,
  productDate: undefined,
  expireDate: undefined,
  remark: undefined
};
const data = reactive<PageData<PalletInventoryForm, PalletInventoryQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    palletCode: undefined,
    workOrderNo: undefined,
    materialSn: undefined,
    batchCode: undefined,
    availableQuantity: undefined,
    inspectionQuantity: undefined,
    blockedQuantity: undefined,
    scrappedQuantity: undefined,
    unit: undefined,
    itemCode: undefined,
    itemName: undefined,
    inventoryType: undefined,
    inventoryStatus: undefined,
    stockInStatus: undefined,
    materialDocYear: undefined,
    materialOrderNo: undefined,
    materialItem: undefined,
    productDate: undefined,
    expireDate: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    palletCode: [{ required: true, message: '栈板编号不能为空', trigger: 'blur' }],
    workOrderNo: [{ required: true, message: '工单号不能为空', trigger: 'blur' }],
    materialSn: [{ required: true, message: '物料标识卡条码不能为空', trigger: 'blur' }],
    batchCode: [{ required: true, message: '批次号不能为空', trigger: 'blur' }],
    availableQuantity: [{ required: true, message: '非限制数量不能为空', trigger: 'blur' }],
    inspectionQuantity: [{ required: true, message: '质检数量不能为空', trigger: 'blur' }],
    blockedQuantity: [{ required: true, message: '冻结数量不能为空', trigger: 'blur' }],
    scrappedQuantity: [{ required: true, message: '数量-报废不能为空', trigger: 'blur' }],
    unit: [{ required: true, message: '单位不能为空', trigger: 'blur' }],
    itemCode: [{ required: true, message: '料号不能为空', trigger: 'blur' }],
    itemName: [{ required: true, message: '物料名称/设备名称不能为空', trigger: 'blur' }],
    inventoryType: [{ required: true, message: '库存类型: N-正常, K-供应商寄售, W-客户寄售, P-工单库存WIP不能为空', trigger: 'change' }],
    inventoryStatus: [{ required: true, message: '库存状态不能为空', trigger: 'change' }],
    stockInStatus: [{ required: true, message: '入库状态不能为空', trigger: 'change' }],
    materialDocYear: [{ required: true, message: '凭证年度不能为空', trigger: 'blur' }],
    materialOrderNo: [{ required: true, message: '物料凭证号不能为空', trigger: 'blur' }],
    materialItem: [{ required: true, message: '物料文件项次不能为空', trigger: 'blur' }],
    productDate: [{ required: true, message: '生产日期不能为空', trigger: 'blur' }],
    expireDate: [{ required: true, message: '失效日期不能为空', trigger: 'blur' }],
    remark: [{ required: true, message: '备注不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询栈板库存明细列表 */
const getList = async () => {
  loading.value = true;
  const res = await listPalletInventory(queryParams.value);
  palletInventoryList.value = res.rows;
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
  palletInventoryFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: PalletInventoryVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加栈板库存明细';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: PalletInventoryVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getPalletInventory(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改栈板库存明细';
};

/** 提交按钮 */
const submitForm = () => {
  palletInventoryFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updatePalletInventory(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addPalletInventory(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: PalletInventoryVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除栈板库存明细编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delPalletInventory(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/palletInventory/export',
    {
      ...queryParams.value
    },
    `palletInventory_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
