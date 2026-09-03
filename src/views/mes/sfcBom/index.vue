<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="条码行号" prop="sfcBo">
              <el-input v-model="queryParams.sfcBo" placeholder="请输入条码行号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="BOM行号" prop="bomBo">
              <el-input v-model="queryParams.bomBo" placeholder="请输入BOM行号" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:sfcBom:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:sfcBom:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:sfcBom:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:sfcBom:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="sfcBomList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="条码行号" align="center" prop="sfcBo" />
        <el-table-column label="BOM行号" align="center" prop="bomBo" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:sfcBom:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:sfcBom:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="sfcBomFormRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="条码行号" prop="sfcBo">
          <el-input v-model="form.sfcBo" placeholder="请输入条码行号" />
        </el-form-item>
        <el-form-item label="BOM行号" prop="bomBo">
          <el-input v-model="form.bomBo" placeholder="请输入BOM行号" />
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

<script setup name="SfcBom" lang="ts">
import { listSfcBom, getSfcBom, delSfcBom, addSfcBom, updateSfcBom } from '@/api/mes/sfcBom';
import { SfcBomVO, SfcBomQuery, SfcBomForm } from '@/api/mes/sfcBom/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const sfcBomList = ref<SfcBomVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const sfcBomFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: SfcBomForm = {
  id: undefined,
  sfcBo: undefined,
  bomBo: undefined,
  remark: undefined
};

const data = reactive<PageData<SfcBomForm, SfcBomQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    sfcBo: undefined,
    bomBo: undefined,
    params: {}
  },
  rules: {
    sfcBo: [{ required: true, message: '条码行号不能为空', trigger: 'blur' }],
    bomBo: [{ required: true, message: 'BOM行号不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const getList = async () => {
  loading.value = true;
  const res = await listSfcBom(queryParams.value);
  sfcBomList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = { ...initFormData };
  sfcBomFormRef.value?.resetFields();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: SfcBomVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加条码BOM';
};

const handleUpdate = async (row?: SfcBomVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getSfcBom(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改条码BOM';
};

const submitForm = () => {
  sfcBomFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateSfcBom(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addSfcBom(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

const handleDelete = async (row?: SfcBomVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除条码BOM编号为"' + _ids + '"的数据项？');
  await delSfcBom(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

const handleExport = () => {
  proxy?.download(
    'mes/sfcBom/export',
    {
      ...queryParams.value
    },
    `sfcBom_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
