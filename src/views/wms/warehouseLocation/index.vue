<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="100px">
            <el-form-item label="编码" prop="code">
              <el-input v-model="queryParams.code" placeholder="请输入编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="名称" prop="name">
              <el-input v-model="queryParams.name" placeholder="请输入名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="仓库类型" prop="warehouseType">
              <el-select v-model="queryParams.warehouseType" placeholder="请选择仓库类型" clearable>
                <el-option v-for="dict in wms_warehouse_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
                <el-option v-for="dict in wms_warehouse_status" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="允许产品混放" prop="productMixing">
              <el-select v-model="queryParams.productMixing" placeholder="请选择是否允许批次混放" clearable>
                <el-option v-for="dict in sys_yes_no" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="允许批次混放" prop="batchMixing">
              <el-select v-model="queryParams.batchMixing" placeholder="请选择是否允许批次混放" clearable>
                <el-option v-for="dict in sys_yes_no" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="是否启用" prop="enableFlag">
              <el-select v-model="queryParams.enableFlag" placeholder="请选择是否允许批次混放" clearable>
                <el-option v-for="dict in sys_yes_no" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
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
            <el-button v-hasPermi="['wms:warehouseLocation:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:warehouseLocation:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:warehouseLocation:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:warehouseLocation:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="warehouseLocationList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" prop="" width="55" label="序号" align="center">
          <template #default="scope">
            <span>{{ scope.$index + 1 + (queryParams.pageNum - 1) * queryParams.pageSize }}</span>
          </template>
        </el-table-column>

        <el-table-column label="编码" align="left" prop="code" />
        <el-table-column label="名称" align="left" prop="name" width="200" />
        <el-table-column label="库位条码" align="left" prop="barcode" width="140" />
        <el-table-column label="显示顺序" align="center" prop="orderNum" />
        <el-table-column label="层级" align="center" prop="level">
          <template #default="scope">
            <dict-tag :options="wms_warehouse_level" :value="scope.row.level" />
          </template>
        </el-table-column>
        <el-table-column label="仓库类型" align="center" prop="warehouseType">
          <template #default="scope">
            <dict-tag :options="wms_warehouse_type" :value="scope.row.warehouseType" />
          </template>
        </el-table-column>

        <el-table-column label="允许产品混放" align="center" prop="productMixing" width="110">
          <template #default="scope">
            <dict-tag :options="sys_yes_no" :value="scope.row.productMixing" />
          </template>
        </el-table-column>
        <el-table-column label="允许批次混放" align="center" prop="batchMixing" width="110">
          <template #default="scope">
            <dict-tag :options="sys_yes_no" :value="scope.row.batchMixing" />
          </template>
        </el-table-column>
        <el-table-column label="启用" align="center" prop="enableFlag">
          <template #default="scope">
            <dict-tag :options="sys_yes_no" :value="scope.row.enableFlag" />
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <dict-tag :options="wms_warehouse_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="X坐标" align="center" prop="xAxis" />
        <el-table-column label="Y坐标" align="center" prop="yAxis" />
        <el-table-column label="Z坐标" align="center" prop="zAxis" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="260" fixed="right">
          <template #default="scope">
            <el-button v-if="queryParams.level == 1" v-hasPermi="['wms:warehouseLocation:list']" link type="primary" icon="Shop" @click="handleStorageArea(scope.row)">库区管理</el-button>
            <el-button v-if="queryParams.level == 2" v-hasPermi="['wms:warehouseLocation:list']" link type="primary" icon="Shop" @click="handleShelf(scope.row)">货架管理</el-button>
            <el-button v-if="queryParams.level == 3" v-hasPermi="['wms:warehouseLocation:list']" link type="primary" icon="Shop" @click="handleWarehouseLocation(scope.row)">库位管理</el-button>
            <el-divider direction="vertical" />
            <el-button v-hasPermi="['wms:warehouseLocation:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
            <el-divider direction="vertical" />
            <el-button v-hasPermi="['wms:warehouseLocation:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <!-- 添加或修改仓位信息对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="50%" append-to-body>
      <el-form ref="warehouseLocationFormRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入编码" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="显示顺序" prop="orderNum">
          <el-input-number v-model="form.orderNum" controls-position="right" :min="1" />
        </el-form-item>
        <el-form-item label="仓库类型" prop="warehouseType">
          <el-select v-model="form.warehouseType" placeholder="请选择仓库类型">
            <el-option v-for="dict in wms_warehouse_type" :key="dict.value" :label="dict.label" :value="parseInt(dict.value)"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="库位条码" prop="barcode">
          <el-input v-model="form.barcode" placeholder="请输入库位条码" />
        </el-form-item>
        <el-form-item label="允许产品混放" prop="productMixing">
          <el-radio-group v-model="form.productMixing">
            <el-radio v-for="dict in sys_yes_no" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="允许批次混放" prop="batchMixing">
          <el-radio-group v-model="form.batchMixing">
            <el-radio v-for="dict in sys_yes_no" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="启用" prop="enableFlag">
          <el-radio-group v-model="form.enableFlag">
            <el-radio v-for="dict in sys_yes_no" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option v-for="dict in wms_warehouse_status" :key="dict.value" :label="dict.label" :value="parseInt(dict.value)"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="X坐标" prop="xAxis">
          <el-input v-model="form.xAxis" placeholder="请输入X坐标" />
        </el-form-item>
        <el-form-item label="Y坐标" prop="yAxis">
          <el-input v-model="form.yAxis" placeholder="请输入Y坐标" />
        </el-form-item>
        <el-form-item label="Z坐标" prop="zAxis">
          <el-input v-model="form.zAxis" placeholder="请输入Z坐标" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
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

<script setup name="WarehouseLocation" lang="ts">
import { pageWarehouseLocation, getWarehouseLocation, delWarehouseLocation, addWarehouseLocation, updateWarehouseLocation } from '@/api/wms/warehouseLocation';
import { WarehouseLocationVO, WarehouseLocationQuery, WarehouseLocationForm } from '@/api/wms/warehouseLocation/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_warehouse_level, wms_warehouse_status, wms_warehouse_type, sys_yes_no } = toRefs<any>(proxy?.useDict('wms_warehouse_level', 'wms_warehouse_status', 'wms_warehouse_type', 'sys_yes_no'));
const route = useRoute();
const warehouseLocationList = ref<WarehouseLocationVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const warehouseLocationFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: WarehouseLocationForm = {
  id: undefined,
  code: undefined,
  name: undefined,
  parentId: 0,
  ancestors: undefined,
  orderNum: undefined,
  level: 1,
  warehouseType: undefined,
  barcode: undefined,
  productMixing: undefined,
  batchMixing: undefined,
  enableFlag: undefined,
  status: undefined,
  xAxis: undefined,
  yAxis: undefined,
  zAxis: undefined,
  remark: undefined
};
const data = reactive<PageData<WarehouseLocationForm, WarehouseLocationQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    code: undefined,
    name: undefined,
    parentId: 0,
    ancestors: undefined,
    orderNum: undefined,
    level: undefined,
    warehouseType: undefined,
    barcode: undefined,
    productMixing: undefined,
    batchMixing: undefined,
    enableFlag: undefined,
    status: undefined,
    xAxis: undefined,
    yAxis: undefined,
    zAxis: undefined,
    params: {}
  },
  rules: {
    // id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    code: [{ required: true, message: '编码不能为空', trigger: 'blur' }],
    name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
    // parentId: [{ required: true, message: '父ID不能为空', trigger: 'blur' }],
    // ancestors: [{ required: true, message: '祖级列表不能为空', trigger: 'blur' }],
    orderNum: [{ required: true, message: '显示顺序不能为空', trigger: 'blur' }],
    // level: [{ required: true, message: '层级不能为空', trigger: 'change' }],
    warehouseType: [{ required: true, message: '仓库类型不能为空', trigger: 'change' }],
    // barcode: [{ required: true, message: '库位条码不能为空', trigger: 'blur' }],
    productMixing: [{ required: true, message: '是否允许产品混放不能为空', trigger: 'change' }],
    batchMixing: [{ required: true, message: '是否允许批次混放不能为空', trigger: 'change' }],
    enableFlag: [{ required: true, message: '是否启用不能为空', trigger: 'change' }],
    status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
    // xAxis: [{ required: true, message: 'X坐标不能为空', trigger: 'blur' }],
    // yAxis: [{ required: true, message: 'Y坐标不能为空', trigger: 'blur' }],
    // zAxis: [{ required: true, message: 'Z坐标不能为空', trigger: 'blur' }],
    // remark: [{ required: true, message: '备注不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询仓位信息列表 */
const getList = async () => {
  loading.value = true;
  const res = await pageWarehouseLocation(queryParams.value);
  warehouseLocationList.value = res.rows;
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
  warehouseLocationFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: WarehouseLocationVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  getRouterParams();
  console.log(form.value);
  dialog.visible = true;
  dialog.title = '添加仓位信息';
};

/** 库区按钮操作 */
const handleStorageArea = async (row?: WarehouseLocationVO) => {
  const warehouseLocateIds = row?.id || ids.value[0];
  proxy.$router.push({
    path: '/warehouse/storage/index/' + warehouseLocateIds,
    query: {
      // id: warehouseLocateIds,
      level: 2,
      ancestors: row.ancestors,
      name: row.name
    }
  });
};

/** 货架按钮操作 */
const handleShelf = async (row?: WarehouseLocationVO) => {
  const warehouseLocateIds = row?.id || ids.value[0];
  proxy.$router.push({
    path: '/warehouse/shelf/index/' + warehouseLocateIds,
    query: {
      // id: warehouseLocateIds,
      level: 3,
      ancestors: row.ancestors,
      name: row.name
    }
  });
};

/** 库位按钮操作 */
const handleWarehouseLocation = async (row?: WarehouseLocationVO) => {
  const warehouseLocateIds = row?.id || ids.value[0];
  proxy.$router.push({
    path: '/warehouse/location/index/' + warehouseLocateIds,
    query: {
      // id: warehouseLocateIds,
      level: 4,
      ancestors: row.ancestors,
      name: row.name
    }
  });
};

/** 修改按钮操作 */
const handleUpdate = async (row?: WarehouseLocationVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getWarehouseLocation(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改仓位信息';
};

/** 提交按钮 */
const submitForm = () => {
  warehouseLocationFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateWarehouseLocation(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addWarehouseLocation(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: WarehouseLocationVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除仓位信息编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delWarehouseLocation(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/warehouseLocation/export',
    {
      ...queryParams.value
    },
    `warehouseLocation_${new Date().getTime()}.xlsx`
  );
};
/** 获取路由数据 */
const getRouterParams = async () => {
  if (route.params && route.params.warehouseLocateIds) {
    queryParams.value.parentId = route.params.warehouseLocateIds;
    form.value.parentId = route.params.warehouseLocateIds;
  }
  if (route.query) {
    if (route.query.level) {
      queryParams.value.level = route.query.level;
      form.value.level = route.query.level;
    }
    if (route.query.ancestors) {
      // queryParams.value.ancestors = route.query.ancestors;
      form.value.ancestors = route.query.ancestors;
    }
  }
};
onMounted(() => {
  queryParams.value.level = 1;
  form.value.level = 1;
  form.value.parentId = 0;
  getRouterParams();
  getList();
});
</script>
