<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="成本中心" prop="costCenter">
              <el-input v-model="queryParams.costCenter" placeholder="请输入成本中心" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="成本中心名称" prop="costCenterName">
              <el-input v-model="queryParams.costCenterName" placeholder="请输入成本中心名称" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:costCenterMoveType:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:costCenterMoveType:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:costCenterMoveType:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:costCenterMoveType:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="costCenterMoveTypeList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />
        <el-table-column label="移动类型" align="center" prop="moveType" />
        <el-table-column label="成本中心" align="center" prop="costCenter" />
        <el-table-column label="成本中心名称" align="center" prop="costCenterName" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:costCenterMoveType:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:costCenterMoveType:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改成本中心移动类型对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="costCenterMoveTypeFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="成本中心" prop="costCenter">
          <el-input v-model="form.costCenter" placeholder="请输入成本中心" />
        </el-form-item>
        <el-form-item label="成本中心名称" prop="costCenterName">
          <el-input v-model="form.costCenterName" placeholder="请输入成本中心名称" />
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

<script setup name="CostCenterMoveType" lang="ts">
import { listCostCenterMoveType, getCostCenterMoveType, delCostCenterMoveType, addCostCenterMoveType, updateCostCenterMoveType } from '@/api/wms/costCenterMoveType';
import { CostCenterMoveTypeVO, CostCenterMoveTypeQuery, CostCenterMoveTypeForm } from '@/api/wms/costCenterMoveType/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const costCenterMoveTypeList = ref<CostCenterMoveTypeVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const costCenterMoveTypeFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: CostCenterMoveTypeForm = {
  id: undefined,
  moveType: undefined,
  costCenter: undefined,
  costCenterName: undefined,
}
const data = reactive<PageData<CostCenterMoveTypeForm, CostCenterMoveTypeQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    moveType: undefined,
    costCenter: undefined,
    costCenterName: undefined,
    params: {
    }
  },
  rules: {
    id: [
      { required: true, message: "唯一ID不能为空", trigger: "blur" }
    ],
    costCenter: [
      { required: true, message: "成本中心不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询成本中心移动类型列表 */
const getList = async () => {
  loading.value = true;
  const res = await listCostCenterMoveType(queryParams.value);
  costCenterMoveTypeList.value = res.rows;
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
  costCenterMoveTypeFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: CostCenterMoveTypeVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加成本中心移动类型";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: CostCenterMoveTypeVO) => {
  reset();
  const _id = row?.id || ids.value[0]
  const res = await getCostCenterMoveType(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改成本中心移动类型";
}

/** 提交按钮 */
const submitForm = () => {
  costCenterMoveTypeFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateCostCenterMoveType(form.value).finally(() =>  buttonLoading.value = false);
      } else {
        await addCostCenterMoveType(form.value).finally(() =>  buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: CostCenterMoveTypeVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除成本中心移动类型编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
  await delCostCenterMoveType(_ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('wms/costCenterMoveType/export', {
    ...queryParams.value
  }, `costCenterMoveType_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>
