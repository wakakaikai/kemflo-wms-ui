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
            <el-form-item label="字段编码" prop="fieldCode">
              <el-input v-model="queryParams.fieldCode" placeholder="请输入字段编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="字段名称" prop="fieldName">
              <el-input v-model="queryParams.fieldName" placeholder="请输入字段名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="字段类型" prop="fieldType">
              <el-select v-model="queryParams.fieldType" placeholder="请选择字段类型" clearable style="width: 140px">
                <el-option v-for="item in fieldTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
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
            <el-button v-hasPermi="['lowcode:field:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['lowcode:field:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['lowcode:field:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Close" @click="handleClose">关闭</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="fieldList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="字段编码" align="center" prop="fieldCode" min-width="140" />
        <el-table-column label="字段名称" align="center" prop="fieldName" min-width="150" />
        <el-table-column label="字段类型" align="center" width="120" prop="fieldType">
          <template #default="scope">
            <el-tag effect="plain">{{ fieldTypeLabel(scope.row.fieldType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="必填" align="center" width="70" prop="required">
          <template #default="scope">
            <el-tag v-if="scope.row.required === 1" type="danger" size="small">是</el-tag>
            <el-tag v-else type="info" size="small">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="默认值" align="center" prop="defaultValue" width="120" show-overflow-tooltip />
        <el-table-column label="最大长度" align="center" width="90" prop="maxLength" />
        <el-table-column label="排序" align="center" width="70" prop="sortOrder" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="150">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['lowcode:field:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['lowcode:field:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="560px" append-to-body>
      <el-form ref="fieldFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="工作表" prop="worksheetId">
          <el-select v-model="form.worksheetId" placeholder="请选择工作表" clearable filterable class="w-full" :disabled="!!routeParamsWorksheetId">
            <el-option v-for="item in worksheetOptions" :key="item.id" :label="item.displayName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="字段编码" prop="fieldCode">
          <el-input v-model="form.fieldCode" placeholder="请输入字段编码" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="字段名称" prop="fieldName">
          <el-input v-model="form.fieldName" placeholder="请输入字段名称" />
        </el-form-item>
        <el-form-item label="字段类型" prop="fieldType">
          <el-select v-model="form.fieldType" placeholder="请选择字段类型" class="w-full">
            <el-option v-for="item in fieldTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否必填" prop="required">
          <el-radio-group v-model="form.required">
            <el-radio :value="1">是</el-radio>
            <el-radio :value="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="默认值" prop="defaultValue">
          <el-input v-model="form.defaultValue" placeholder="请输入默认值" />
        </el-form-item>
        <el-form-item label="最大长度" prop="maxLength">
          <el-input-number v-model="form.maxLength" :min="0" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" controls-position="right" style="width: 100%" />
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

<script setup name="LcField" lang="ts">
import { listField, getField, delField, addField, updateField } from '@/api/lowcode/field';
import { FieldForm, FieldQuery, FieldVO } from '@/api/lowcode/field/types';
import { listWorksheet } from '@/api/lowcode/worksheet';
import { WorksheetVO } from '@/api/lowcode/worksheet/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();

const fieldTypeOptions = [
  { value: 'TEXT', label: '文本' },
  { value: 'NUMBER', label: '数字' },
  { value: 'DECIMAL', label: '小数' },
  { value: 'DATE', label: '日期' },
  { value: 'DATETIME', label: '日期时间' },
  { value: 'BOOLEAN', label: '布尔' },
  { value: 'SELECT', label: '单选' },
  { value: 'MULTI_SELECT', label: '多选' },
  { value: 'TEXTAREA', label: '多行文本' },
  { value: 'JSON', label: 'JSON' }
];

const fieldTypeLabel = (type?: string) => {
  return fieldTypeOptions.find((item) => item.value === type)?.label || type || '';
};

const worksheetOptions = ref<WorksheetVO[]>([]);
const fieldList = ref<FieldVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const routeParamsWorksheetId = computed(() => route.params.worksheetId as string | undefined);

const queryFormRef = ref<ElFormInstance>();
const fieldFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({ visible: false, title: '' });

const initFormData: FieldForm = {
  id: undefined,
  worksheetId: undefined,
  fieldCode: undefined,
  fieldName: undefined,
  fieldType: 'TEXT',
  required: 0,
  defaultValue: undefined,
  maxLength: undefined,
  sortOrder: 0
};

const data = reactive<PageData<FieldForm, FieldQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    worksheetId: routeParamsWorksheetId.value,
    fieldCode: undefined,
    fieldName: undefined,
    fieldType: undefined
  },
  rules: {
    worksheetId: [{ required: true, message: '工作表不能为空', trigger: 'change' }],
    fieldCode: [{ required: true, message: '字段编码不能为空', trigger: 'blur' }],
    fieldName: [{ required: true, message: '字段名称不能为空', trigger: 'blur' }],
    fieldType: [{ required: true, message: '字段类型不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const getList = async () => {
  loading.value = true;
  try {
    const res = await listField(queryParams.value);
    fieldList.value = res.data.rows ?? res.data;
    total.value = res.data.total ?? res.data.length;
  } finally { loading.value = false; }
};

const getWorksheetOptions = async () => {
  const res = await listWorksheet({ pageNum: 1, pageSize: 999 } as WorksheetQuery);
  worksheetOptions.value = res.data.rows ?? res.data;
};

const cancel = () => { reset(); dialog.visible = false; };
const reset = () => {
  form.value = { ...initFormData, worksheetId: queryParams.value.worksheetId || routeParamsWorksheetId.value };
  fieldFormRef.value?.resetFields();
};
const handleQuery = () => { queryParams.value.pageNum = 1; getList(); };
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  if (routeParamsWorksheetId.value) {
    queryParams.value.worksheetId = routeParamsWorksheetId.value;
  }
  handleQuery();
};

const handleSelectionChange = (selection: FieldVO[]) => {
  ids.value = selection.map((item) => item.id!);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

const handleAdd = () => { reset(); dialog.visible = true; dialog.title = '添加字段'; };

const handleUpdate = async (row?: FieldVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getField(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改字段';
};

const submitForm = () => {
  fieldFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      try {
        if (form.value.id) {
          await updateField(form.value);
        } else {
          await addField(form.value);
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

const handleDelete = async (row?: FieldVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除字段编号为"' + _ids + '"的数据项？');
  await delField(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

const handleClose = () => {
  const obj = { path: '/lowcode/worksheet' };
  proxy?.$tab.closeOpenPage(obj);
};

onMounted(async () => {
  await getWorksheetOptions();
  if (routeParamsWorksheetId.value) {
    queryParams.value.worksheetId = routeParamsWorksheetId.value;
  }
  getList();
});
</script>
