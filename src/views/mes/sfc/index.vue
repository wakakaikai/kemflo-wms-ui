<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="产品条码" prop="sfc">
              <el-input v-model="queryParams.sfc" placeholder="请输入产品条码" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:sfc:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:sfc:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:sfc:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:sfc:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="sfcList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="产品条码" align="center" prop="sfc" />
        <el-table-column label="状态" align="center" prop="status" />
        <el-table-column label="条码数量" align="center" prop="qty" />
        <el-table-column label="完成数量" align="center" prop="qtyDone" />
        <el-table-column label="报废数量" align="center" prop="qtyScrapped" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:sfc:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:sfc:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="sfcFormRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="产品条码" prop="sfc">
          <el-input v-model="form.sfc" placeholder="请输入产品条码" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-input v-model="form.status" placeholder="请输入状态" />
        </el-form-item>
        <el-form-item label="条码数量" prop="qty">
          <el-input-number v-model="form.qty" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="完成数量" prop="qtyDone">
          <el-input-number v-model="form.qtyDone" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="报废数量" prop="qtyScrapped">
          <el-input-number v-model="form.qtyScrapped" :min="0" controls-position="right" />
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

<script setup name="Sfc" lang="ts">
import { listSfc, getSfc, delSfc, addSfc, updateSfc } from '@/api/mes/sfc';
import { SfcVO, SfcQuery, SfcForm } from '@/api/mes/sfc/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const sfcList = ref<SfcVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const sfcFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: SfcForm = {
  id: undefined,
  sfc: undefined,
  status: undefined,
  qty: undefined,
  qtyDone: undefined,
  qtyScrapped: undefined,
  remark: undefined
};

const data = reactive<PageData<SfcForm, SfcQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    sfc: undefined,
    status: undefined,
    params: {}
  },
  rules: {
    sfc: [{ required: true, message: '产品条码不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const getList = async () => {
  loading.value = true;
  const res = await listSfc(queryParams.value);
  sfcList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = { ...initFormData };
  sfcFormRef.value?.resetFields();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: SfcVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加产品条码';
};

const handleUpdate = async (row?: SfcVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getSfc(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改产品条码';
};

const submitForm = () => {
  sfcFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateSfc(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addSfc(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

const handleDelete = async (row?: SfcVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除产品条码编号为"' + _ids + '"的数据项？');
  await delSfc(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

const handleExport = () => {
  proxy?.download(
    'mes/sfc/export',
    {
      ...queryParams.value
    },
    `sfc_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
