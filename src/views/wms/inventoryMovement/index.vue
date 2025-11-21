<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="移动类型" prop="moveType">
              <el-input v-model="queryParams.moveType" placeholder="请输入移动类型" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料编码" prop="itemCode">
              <el-input v-model="queryParams.itemCode" placeholder="请输入物料编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料名称" prop="itemName">
              <el-input v-model="queryParams.itemName" placeholder="请输入物料名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="批次号" prop="batchNo">
              <el-input v-model="queryParams.batchNo" placeholder="请输入批次号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="单据编号" prop="sourceDocCode">
              <el-input v-model="queryParams.sourceDocCode" placeholder="请输入单据编号" clearable @keyup.enter="handleQuery" />
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
            <el-form-item label="栈板编号" prop="palletCode">
              <el-input v-model="queryParams.palletCode" placeholder="请输入栈板编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="特殊库存标识" prop="specialInventoryFlag">
              <el-input v-model="queryParams.specialInventoryFlag" placeholder="请输入特殊库存标识" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="移动时间" prop="moveDate">
              <el-date-picker clearable v-model="queryParams.moveDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择移动时间" />
            </el-form-item>
            <el-form-item label="SAP凭证年度" prop="sapMaterialDocYear">
              <el-input v-model="queryParams.sapMaterialDocYear" placeholder="请输入SAP凭证年度" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="SAP物料凭证号" prop="sapMaterialOrderNo">
              <el-input v-model="queryParams.sapMaterialOrderNo" placeholder="请输入SAP物料凭证号" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:inventoryMovement:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:inventoryMovement:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:inventoryMovement:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:inventoryMovement:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="inventoryMovementList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
<!--        <el-table-column label="移动记录ID" align="center" prop="id" v-if="true" />-->
        <el-table-column label="移动类型" align="center" prop="moveType" />
        <el-table-column label="物料编码" align="center" prop="itemCode" />
        <el-table-column label="物料名称" align="center" prop="itemName" :show-overflow-tooltip="true" />
        <el-table-column label="批次号" align="center" prop="batchNo" />
        <el-table-column label="库存方向" align="center" prop="inventoryDirection" />
        <el-table-column label="关联的移动ID" align="center" prop="relatedMoveId" />
        <el-table-column label="数量" align="center" prop="quantity" />
        <el-table-column label="基本单位" align="center" prop="unit" />
        <el-table-column label="单据类型" align="center" prop="sourceDocType" />
        <el-table-column label="单据编号" align="center" prop="sourceDocCode" />
        <el-table-column label="仓库编码" align="center" prop="warehouseCode" />
        <el-table-column label="仓库名称" align="center" prop="warehouseName" />
        <el-table-column label="库区编码" align="center" prop="areaCode" />
        <el-table-column label="库区名称" align="center" prop="areaName" />
        <el-table-column label="库位编码" align="center" prop="locationCode" />
        <el-table-column label="库位名称" align="center" prop="locationName" />
        <el-table-column label="栈板编号" align="center" prop="palletCode" />
        <el-table-column label="打包编号" align="center" prop="packingCode" />
        <el-table-column label="特殊库存标识" align="center" prop="specialInventoryFlag" />
        <el-table-column label="移动时间" align="center" prop="moveDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.moveDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="业务伙伴" align="center" prop="businessCode" />
        <el-table-column label="业务伙伴名称" align="center" prop="businessName" />
        <el-table-column label="SAP凭证年度" align="center" prop="sapMaterialDocYear" />
        <el-table-column label="SAP物料凭证号" align="center" prop="sapMaterialOrderNo" />
        <el-table-column label="SAP物料文件项次" align="center" prop="sapMaterialItem" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:inventoryMovement:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:inventoryMovement:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改库存移动记录对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="inventoryMovementFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="物料编码" prop="itemCode">
          <el-input v-model="form.itemCode" placeholder="请输入物料编码" />
        </el-form-item>
        <el-form-item label="物料名称" prop="itemName">
          <el-input v-model="form.itemName" placeholder="请输入物料名称" />
        </el-form-item>
        <el-form-item label="批次号" prop="batchNo">
          <el-input v-model="form.batchNo" placeholder="请输入批次号" />
        </el-form-item>
        <el-form-item label="库存方向" prop="inventoryDirection">
          <el-input v-model="form.inventoryDirection" placeholder="请输入库存方向" />
        </el-form-item>
        <el-form-item label="关联的移动ID" prop="relatedMoveId">
          <el-input v-model="form.relatedMoveId" placeholder="请输入关联的移动ID" />
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input v-model="form.quantity" placeholder="请输入数量" />
        </el-form-item>
        <el-form-item label="基本单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入基本单位" />
        </el-form-item>
        <el-form-item label="单据编号" prop="sourceDocCode">
          <el-input v-model="form.sourceDocCode" placeholder="请输入单据编号" />
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
        <el-form-item label="栈板编号" prop="palletCode">
          <el-input v-model="form.palletCode" placeholder="请输入栈板编号" />
        </el-form-item>
        <el-form-item label="打包编号" prop="packingCode">
          <el-input v-model="form.packingCode" placeholder="请输入打包编号" />
        </el-form-item>
        <el-form-item label="特殊库存标识" prop="specialInventoryFlag">
          <el-input v-model="form.specialInventoryFlag" placeholder="请输入特殊库存标识" />
        </el-form-item>
        <el-form-item label="移动时间" prop="moveDate">
          <el-date-picker clearable v-model="form.moveDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择移动时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="业务伙伴" prop="businessCode">
          <el-input v-model="form.businessCode" placeholder="请输入业务伙伴" />
        </el-form-item>
        <el-form-item label="业务伙伴名称" prop="businessName">
          <el-input v-model="form.businessName" placeholder="请输入业务伙伴名称" />
        </el-form-item>
        <el-form-item label="SAP凭证年度" prop="sapMaterialDocYear">
          <el-input v-model="form.sapMaterialDocYear" placeholder="请输入SAP凭证年度" />
        </el-form-item>
        <el-form-item label="SAP物料凭证号" prop="sapMaterialOrderNo">
          <el-input v-model="form.sapMaterialOrderNo" placeholder="请输入SAP物料凭证号" />
        </el-form-item>
        <el-form-item label="SAP物料文件项次" prop="sapMaterialItem">
          <el-input v-model="form.sapMaterialItem" placeholder="请输入SAP物料文件项次" />
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

<script setup name="InventoryMovement" lang="ts">
import { listInventoryMovement, getInventoryMovement, delInventoryMovement, addInventoryMovement, updateInventoryMovement } from '@/api/wms/inventoryMovement';
import { InventoryMovementVO, InventoryMovementQuery, InventoryMovementForm } from '@/api/wms/inventoryMovement/types';
import { dayjs } from 'element-plus';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const inventoryMovementList = ref<InventoryMovementVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const inventoryMovementFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: InventoryMovementForm = {
  id: undefined,
  moveType: undefined,
  itemCode: undefined,
  itemName: undefined,
  batchNo: undefined,
  inventoryDirection: undefined,
  relatedMoveId: undefined,
  quantity: undefined,
  unit: undefined,
  sourceDocType: undefined,
  sourceDocCode: undefined,
  warehouseCode: undefined,
  warehouseName: undefined,
  areaCode: undefined,
  areaName: undefined,
  locationCode: undefined,
  locationName: undefined,
  palletCode: undefined,
  packingCode: undefined,
  specialInventoryFlag: undefined,
  moveDate: undefined,
  businessCode: undefined,
  businessName: undefined,
  sapMaterialDocYear: undefined,
  sapMaterialOrderNo: undefined,
  sapMaterialItem: undefined,
  remark: undefined
};
const data = reactive<PageData<InventoryMovementForm, InventoryMovementQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    moveType: undefined,
    itemCode: undefined,
    itemName: undefined,
    batchNo: undefined,
    inventoryDirection: undefined,
    relatedMoveId: undefined,
    quantity: undefined,
    unit: undefined,
    sourceDocType: undefined,
    sourceDocCode: undefined,
    warehouseCode: undefined,
    warehouseName: undefined,
    areaCode: undefined,
    areaName: undefined,
    locationCode: undefined,
    locationName: undefined,
    palletCode: undefined,
    packingCode: undefined,
    specialInventoryFlag: undefined,
    moveDate: undefined,
    businessCode: undefined,
    businessName: undefined,
    sapMaterialDocYear: undefined,
    sapMaterialOrderNo: undefined,
    sapMaterialItem: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '移动记录ID不能为空', trigger: 'blur' }],
    moveType: [{ required: true, message: '移动类型不能为空', trigger: 'change' }],
    itemCode: [{ required: true, message: '物料编码不能为空', trigger: 'blur' }],
    itemName: [{ required: true, message: '物料名称不能为空', trigger: 'blur' }],
    batchNo: [{ required: true, message: '批次号不能为空', trigger: 'blur' }],
    inventoryDirection: [{ required: true, message: '库存方向不能为空', trigger: 'blur' }],
    relatedMoveId: [{ required: true, message: '关联的移动ID不能为空', trigger: 'blur' }],
    quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }],
    unit: [{ required: true, message: '基本单位不能为空', trigger: 'blur' }],
    sourceDocType: [{ required: true, message: '单据类型不能为空', trigger: 'change' }],
    sourceDocCode: [{ required: true, message: '单据编号不能为空', trigger: 'blur' }],
    warehouseCode: [{ required: true, message: '仓库编码不能为空', trigger: 'blur' }],
    warehouseName: [{ required: true, message: '仓库名称不能为空', trigger: 'blur' }],
    areaCode: [{ required: true, message: '库区编码不能为空', trigger: 'blur' }],
    areaName: [{ required: true, message: '库区名称不能为空', trigger: 'blur' }],
    locationCode: [{ required: true, message: '库位编码不能为空', trigger: 'blur' }],
    locationName: [{ required: true, message: '库位名称不能为空', trigger: 'blur' }],
    palletCode: [{ required: true, message: '栈板编号不能为空', trigger: 'blur' }],
    packingCode: [{ required: true, message: '打包编号不能为空', trigger: 'blur' }],
    specialInventoryFlag: [{ required: true, message: '特殊库存标识不能为空', trigger: 'blur' }],
    moveDate: [{ required: true, message: '移动时间不能为空', trigger: 'blur' }],
    businessCode: [{ required: true, message: '业务伙伴不能为空', trigger: 'blur' }],
    businessName: [{ required: true, message: '业务伙伴名称不能为空', trigger: 'blur' }],
    sapMaterialDocYear: [{ required: true, message: 'SAP凭证年度不能为空', trigger: 'blur' }],
    sapMaterialOrderNo: [{ required: true, message: 'SAP物料凭证号不能为空', trigger: 'blur' }],
    sapMaterialItem: [{ required: true, message: 'SAP物料文件项次不能为空', trigger: 'blur' }],
    remark: [{ required: true, message: '备注不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询库存移动记录列表 */
const getList = async () => {
  loading.value = true;
  if (queryParams.value.moveDate) {
    queryParams.value.moveDate = dayjs(queryParams.value.moveDate).format('YYYY-MM-DD HH:mm:ss');
  }
  const res = await listInventoryMovement(queryParams.value);
  inventoryMovementList.value = res.rows;
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
  inventoryMovementFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: InventoryMovementVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加库存移动记录';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: InventoryMovementVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getInventoryMovement(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改库存移动记录';
};

/** 提交按钮 */
const submitForm = () => {
  inventoryMovementFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateInventoryMovement(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addInventoryMovement(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: InventoryMovementVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除库存移动记录编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delInventoryMovement(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/inventoryMovement/export',
    {
      ...queryParams.value
    },
    `inventoryMovement_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
