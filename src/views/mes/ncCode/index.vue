<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="不合格代码" prop="ncCode">
              <el-input v-model="queryParams.ncCode" placeholder="请输入不合格代码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="描述" prop="description">
              <el-input v-model="queryParams.description" placeholder="请输入描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-input v-model="queryParams.status" placeholder="请输入状态" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:ncCode:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:ncCode:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:ncCode:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:ncCode:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="ncCodeList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="不合格代码" align="center" prop="ncCode" />
        <el-table-column label="描述" align="center" prop="description" />
        <el-table-column label="状态" align="center" prop="status" />
        <el-table-column label="不合格类别" align="center" prop="ncCategory" />
        <el-table-column label="不合格分类" align="center" prop="ncType" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:ncCode:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:ncCode:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <el-dialog :title="dialog.title" v-model="dialog.visible" width="560px" append-to-body>
      <el-form ref="ncCodeFormRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="不合格代码" prop="ncCode">
          <el-input v-model="form.ncCode" placeholder="请输入不合格代码" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-input v-model="form.status" placeholder="请输入状态" />
        </el-form-item>
        <el-form-item label="不合格类别" prop="ncCategory">
          <el-input v-model="form.ncCategory" placeholder="请输入不合格类别" />
        </el-form-item>
        <el-form-item label="不合格分类" prop="ncType">
          <el-input v-model="form.ncType" placeholder="请输入不合格分类" />
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

<script setup name="NcCode" lang="ts">
import { listNcCode, getNcCode, delNcCode, addNcCode, updateNcCode } from '@/api/mes/ncCode';
import { NcCodeVO, NcCodeQuery, NcCodeForm } from '@/api/mes/ncCode/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const ncCodeList = ref<NcCodeVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const ncCodeFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: NcCodeForm = {
  id: undefined,
  ncCode: undefined,
  description: undefined,
  status: undefined,
  ncCategory: undefined,
  ncType: undefined,
  remark: undefined
};

const data = reactive<PageData<NcCodeForm, NcCodeQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    ncCode: undefined,
    description: undefined,
    status: undefined,
    params: {}
  },
  rules: {
    ncCode: [{ required: true, message: '不合格代码不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const getList = async () => {
  loading.value = true;
  const res = await listNcCode(queryParams.value);
  ncCodeList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = { ...initFormData };
  ncCodeFormRef.value?.resetFields();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: NcCodeVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加不合格代码';
};

const handleUpdate = async (row?: NcCodeVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getNcCode(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改不合格代码';
};

const submitForm = () => {
  ncCodeFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateNcCode(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addNcCode(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

const handleDelete = async (row?: NcCodeVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除不合格代码编号为"' + _ids + '"的数据项？');
  await delNcCode(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

const handleExport = () => {
  proxy?.download(
    'mes/ncCode/export',
    {
      ...queryParams.value
    },
    `ncCode_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
