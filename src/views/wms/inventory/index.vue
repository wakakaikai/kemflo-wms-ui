<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="物料编码" prop="itemCode">
              <el-input v-model="queryParams.itemCode" placeholder="请输入物料编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料名称" prop="itemName">
              <el-input v-model="queryParams.itemName" placeholder="请输入物料名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <!--            <el-form-item label="库存状态" prop="inventoryStatus">
              <el-select v-model="queryParams.inventoryStatus" placeholder="请选择库存状态" clearable>
                <el-option v-for="dict in wms_inventory_status" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>-->
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:inventory:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:inventory:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:inventory:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:inventory:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="inventoryList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="columns[0].visible" label="物料编码" align="center" prop="itemCode" fixed="left" min-width="150" />
        <el-table-column v-if="columns[1].visible" label="物料名称" align="center" prop="itemName" fixed="left" max-width="200" show-overflow-tooltip />
        <el-table-column v-if="columns[2].visible" label="非限制数量" align="center" prop="availableQuantity" fixed="left" min-width="90" />
        <el-table-column v-if="columns[3].visible" label="质检数量" align="center" prop="inspectionQuantity" fixed="left" />
        <el-table-column v-if="columns[4].visible" label="冻结数量" align="center" prop="blockedQuantity" fixed="left" />
        <el-table-column v-if="columns[5].visible" label="单位" align="center" prop="unit" />
        <el-table-column v-if="columns[6].visible" label="特殊库存" align="center" prop="specialInventoryFlag">
          <template #default="scope">
            <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[7].visible" label="仓库编码" align="center" prop="warehouseCode" />
        <el-table-column v-if="columns[8].visible" label="库区编码" align="center" prop="areaCode" />
        <el-table-column v-if="columns[9].visible" label="库位编码" align="center" prop="locationCode" />
        <el-table-column v-if="columns[10].visible" label="创建者" align="center" prop="createByName" />
        <el-table-column v-if="columns[11].visible" label="创建时间" align="center" prop="createTime" width="180" />
        <el-table-column v-if="columns[12].visible" label="更新者" align="center" prop="updateByName" />
        <el-table-column v-if="columns[13].visible" label="更新时间" align="center" prop="updateTime" width="180" />
        <el-table-column v-if="columns[14].visible" label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:inventory:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:inventory:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改库存记录对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="inventoryFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="物料编码" prop="itemCode">
          <el-input v-model="form.itemCode" placeholder="请输入物料编码/设备编号" />
        </el-form-item>
        <el-form-item label="物料名称" prop="itemName">
          <el-input v-model="form.itemName" placeholder="请输入物料名称/设备名称" />
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

<script setup name="Inventory" lang="ts">
import { listInventory, getInventory, delInventory, addInventory, updateInventory } from '@/api/wms/inventory';
import { InventoryVO, InventoryQuery, InventoryForm } from '@/api/wms/inventory/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag, wms_inventory_type } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag', 'wms_inventory_type'));
const inventoryList = ref<InventoryVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const inventoryFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: InventoryForm = {
  id: undefined,
  itemType: undefined,
  itemCode: undefined,
  itemName: undefined,
  availableQuantity: undefined,
  inspectionQuantity: undefined,
  blockedQuantity: undefined,
  scrappedQuantity: undefined,
  unit: undefined,
  inventoryType: undefined,
  inventoryStatus: undefined,
  stockInStatus: undefined,
  warehouseCode: undefined,
  warehouseName: undefined,
  areaCode: undefined,
  areaName: undefined,
  locationCode: undefined,
  locationName: undefined,
  remark: undefined
};
const data = reactive<PageData<InventoryForm, InventoryQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    itemType: undefined,
    itemCode: undefined,
    itemName: undefined,
    availableQuantity: undefined,
    inspectionQuantity: undefined,
    blockedQuantity: undefined,
    scrappedQuantity: undefined,
    unit: undefined,
    inventoryType: undefined,
    inventoryStatus: undefined,
    stockInStatus: undefined,
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
    itemType: [{ required: true, message: '材料类型: 1-物料, 2-设备不能为空', trigger: 'change' }],
    itemCode: [{ required: true, message: '物料编码/设备编号不能为空', trigger: 'blur' }],
    itemName: [{ required: true, message: '物料名称/设备名称不能为空', trigger: 'blur' }],
    availableQuantity: [{ required: true, message: '非限制数量不能为空', trigger: 'blur' }],
    inspectionQuantity: [{ required: true, message: '质检数量不能为空', trigger: 'blur' }],
    blockedQuantity: [{ required: true, message: '冻结数量不能为空', trigger: 'blur' }],
    scrappedQuantity: [{ required: true, message: '数量-报废不能为空', trigger: 'blur' }],
    unit: [{ required: true, message: '单位不能为空', trigger: 'blur' }],
    warehouseCode: [{ required: true, message: '仓库编码不能为空', trigger: 'blur' }],
    areaCode: [{ required: true, message: '库区编码不能为空', trigger: 'blur' }],
    locationCode: [{ required: true, message: '库位编码不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

// 列显隐信息
const columns = ref<FieldOption[]>([
  { key: 0, label: `物料编码`, visible: true, children: [] },
  { key: 1, label: `物料名称`, visible: true, children: [] },
  { key: 2, label: `非限制数量`, visible: true, children: [] },
  { key: 3, label: `质检数量`, visible: true, children: [] },
  { key: 4, label: `冻结数量`, visible: true, children: [] },
  { key: 5, label: `单位`, visible: true, children: [] },
  { key: 6, label: `特殊库存`, visible: true, children: [] },
  { key: 7, label: `仓库编码`, visible: false, children: [] },
  { key: 8, label: `库区编码`, visible: false, children: [] },
  { key: 9, label: `库位编码`, visible: true, children: [] },
  { key: 10, label: `创建时间`, visible: false, children: [] },
  { key: 11, label: `创建者`, visible: false, children: [] },
  { key: 12, label: `更新时间`, visible: false, children: [] },
  { key: 13, label: `更新者`, visible: false, children: [] },
  { key: 14, label: `备注`, visible: false, children: [] }
]);

/** 查询库存记录列表 */
const getList = async () => {
  loading.value = true;
  const res = await listInventory(queryParams.value);
  inventoryList.value = res.rows;
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
  inventoryFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: InventoryVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加库存记录';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: InventoryVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getInventory(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改库存记录';
};

/** 提交按钮 */
const submitForm = () => {
  inventoryFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateInventory(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addInventory(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: InventoryVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除库存记录编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delInventory(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/inventory/export',
    {
      ...queryParams.value
    },
    `inventory_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
