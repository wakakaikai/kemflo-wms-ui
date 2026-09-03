<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="映射条码" prop="sfc">
              <el-input v-model="queryParams.sfc" placeholder="请输入映射条码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="固定值" prop="fixedSfc">
              <el-input v-model="queryParams.fixedSfc" placeholder="请输入固定值" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:sfcFixedSfc:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:sfcFixedSfc:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:sfcFixedSfc:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:sfcFixedSfc:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="sfcFixedSfcList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="映射条码" align="center" prop="sfc" />
        <el-table-column label="固定值" align="center" prop="fixedSfc" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="创建者" align="center" prop="creator" />
        <el-table-column label="创建时间" align="center" prop="createTime" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:sfcFixedSfc:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:sfcFixedSfc:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="sfcFixedSfcFormRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="映射条码" prop="sfc">
          <el-input v-model="form.sfc" placeholder="请输入映射条码" />
        </el-form-item>
        <el-form-item label="固定值" prop="fixedSfc">
          <el-input v-model="form.fixedSfc" placeholder="请输入固定值" />
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

<script setup name="SfcFixedSfc" lang="ts">
import { listSfcFixedSfc, getSfcFixedSfc, delSfcFixedSfc, addSfcFixedSfc, updateSfcFixedSfc } from '@/api/mes/sfcFixedSfc';
import { SfcFixedSfcVO, SfcFixedSfcQuery, SfcFixedSfcForm } from '@/api/mes/sfcFixedSfc/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const sfcFixedSfcList = ref<SfcFixedSfcVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const sfcFixedSfcFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: SfcFixedSfcForm = {
  id: undefined,
  sfc: undefined,
  fixedSfc: undefined,
  remark: undefined
};

const data = reactive<PageData<SfcFixedSfcForm, SfcFixedSfcQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    sfc: undefined,
    fixedSfc: undefined,
    params: {}
  },
  rules: {
    sfc: [{ required: true, message: '映射条码不能为空', trigger: 'blur' }],
    fixedSfc: [{ required: true, message: '固定值不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const getList = async () => {
  loading.value = true;
  const res = await listSfcFixedSfc(queryParams.value);
  sfcFixedSfcList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = { ...initFormData };
  sfcFixedSfcFormRef.value?.resetFields();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: SfcFixedSfcVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加条码固定码映射';
};

const handleUpdate = async (row?: SfcFixedSfcVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getSfcFixedSfc(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改条码固定码映射';
};

const submitForm = () => {
  sfcFixedSfcFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateSfcFixedSfc(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addSfcFixedSfc(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

const handleDelete = async (row?: SfcFixedSfcVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除条码固定码映射编号为"' + _ids + '"的数据项？');
  await delSfcFixedSfc(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

const handleExport = () => {
  proxy?.download(
    'mes/sfcFixedSfc/export',
    {
      ...queryParams.value
    },
    `sfcFixedSfc_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
