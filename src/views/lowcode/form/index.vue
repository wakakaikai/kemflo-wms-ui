<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="工作表" prop="worksheetId">
              <el-select v-model="queryParams.worksheetId" placeholder="请选择工作表" clearable filterable @change="handleQuery" style="width: 200px">
                <el-option v-for="item in worksheetOptions" :key="item.id" :label="item.displayName" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="表单编码" prop="formCode">
              <el-input v-model="queryParams.formCode" placeholder="请输入表单编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="表单名称" prop="formName">
              <el-input v-model="queryParams.formName" placeholder="请输入表单名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
                <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
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

    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['lowcode:form:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['lowcode:form:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['lowcode:form:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="formList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="表单编码" align="center" prop="formCode" min-width="140" />
        <el-table-column label="表单名称" align="center" prop="formName" min-width="160" />
        <el-table-column label="工作表" align="center" prop="worksheetId" min-width="140">
          <template #default="scope">
            <span>{{ worksheetNameMap[scope.row.worksheetId?.toString() || ''] || scope.row.worksheetId }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="90">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200">
          <template #default="scope">
            <el-tooltip content="表单设计" placement="top">
              <el-button v-hasPermi="['lowcode:form:edit']" link type="primary" icon="EditPen" @click="handleDesign(scope.row)" />
            </el-tooltip>
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['lowcode:form:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['lowcode:form:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="560px" append-to-body>
      <el-form ref="formFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="工作表" prop="worksheetId">
          <el-select v-model="form.worksheetId" placeholder="请选择工作表" clearable filterable class="w-full">
            <el-option v-for="item in worksheetOptions" :key="item.id" :label="item.displayName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="表单编码" prop="formCode">
          <el-input v-model="form.formCode" placeholder="请输入表单编码" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="表单名称" prop="formName">
          <el-input v-model="form.formName" placeholder="请输入表单名称" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
          </el-radio-group>
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

<script setup name="LcForm" lang="ts">
import { listForm, getForm, delForm, addForm, updateForm } from '@/api/lowcode/form';
import { FormForm, FormQuery, FormVO } from '@/api/lowcode/form/types';
import { listWorksheet } from '@/api/lowcode/worksheet';
import { WorksheetVO } from '@/api/lowcode/worksheet/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_normal_disable'));
const router = useRouter();

const worksheetOptions = ref<WorksheetVO[]>([]);
const worksheetNameMap = computed(() => {
  const map: Record<string, string> = {};
  worksheetOptions.value.forEach((item) => {
    if (item.id != null) {
      map[String(item.id)] = item.displayName || '';
    }
  });
  return map;
});

const formList = ref<FormVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const formFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({ visible: false, title: '' });

const initFormData: FormForm = {
  id: undefined,
  worksheetId: undefined,
  formCode: undefined,
  formName: undefined,
  formConfigJson: undefined,
  status: '0'
};

const data = reactive<PageData<FormForm, FormQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    worksheetId: undefined,
    formCode: undefined,
    formName: undefined,
    status: undefined
  },
  rules: {
    worksheetId: [{ required: true, message: '工作表不能为空', trigger: 'change' }],
    formCode: [{ required: true, message: '表单编码不能为空', trigger: 'blur' }],
    formName: [{ required: true, message: '表单名称不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const getList = async () => {
  loading.value = true;
  try {
    const res = await listForm(queryParams.value);
    formList.value = res.data.rows ?? res.data;
    total.value = res.data.total ?? res.data.length;
  } finally { loading.value = false; }
};

const getWorksheetOptions = async () => {
  const res = await listWorksheet({ pageNum: 1, pageSize: 999 } as FormQuery);
  worksheetOptions.value = res.data.rows ?? res.data;
};

const cancel = () => { reset(); dialog.visible = false; };
const reset = () => { form.value = { ...initFormData }; formFormRef.value?.resetFields(); };
const handleQuery = () => { queryParams.value.pageNum = 1; getList(); };
const resetQuery = () => { queryFormRef.value?.resetFields(); handleQuery(); };

const handleSelectionChange = (selection: FormVO[]) => {
  ids.value = selection.map((item) => item.id!);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

const handleAdd = () => { reset(); dialog.visible = true; dialog.title = '添加表单'; };

const handleUpdate = async (row?: FormVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getForm(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改表单';
};

const handleDesign = (row: FormVO) => {
  router.push('/lowcode/form/designer/' + row.id);
};

const submitForm = () => {
  formFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      try {
        if (form.value.id) {
          await updateForm(form.value);
        } else {
          await addForm(form.value);
        }
        proxy?.$modal.msgSuccess('操作成功');
        dialog.visible = false;
        await getList();
      } finally {
        buttonLoading.value = false;
      }
    }
  });
};

const handleDelete = async (row?: FormVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除表单编号为"' + _ids + '"的数据项？');
  await delForm(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

onMounted(() => {
  getWorksheetOptions();
  getList();
});
</script>