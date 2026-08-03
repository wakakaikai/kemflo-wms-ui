<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="所属应用" prop="appId">
              <el-select v-model="queryParams.appId" placeholder="请选择应用" clearable filterable>
                <el-option v-for="item in appOptions" :key="item.id" :label="item.appName" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="表名" prop="tableName">
              <el-input v-model="queryParams.tableName" placeholder="请输入数据库表名" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="显示名称" prop="displayName">
              <el-input v-model="queryParams.displayName" placeholder="请输入显示名称" clearable @keyup.enter="handleQuery" />
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
            <el-button v-hasPermi="['lowcode:worksheet:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['lowcode:worksheet:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['lowcode:worksheet:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button icon="Back" @click="goBack">返回</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="worksheetList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="显示名称" align="center" prop="displayName" min-width="140">
          <template #default="scope">
            <router-link :to="'/lowcode/field/index/' + scope.row.id" class="link-type">
              <span>{{ scope.row.displayName }}</span>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column label="数据库表名" align="center" prop="tableName" min-width="140" />
        <el-table-column label="所属应用" align="center" prop="appId" min-width="120">
          <template #default="scope">
            <span>{{ appNameMap[scope.row.appId?.toString() || ''] || scope.row.appId }}</span>
          </template>
        </el-table-column>
        <el-table-column label="描述" align="center" prop="description" min-width="180" show-overflow-tooltip />
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
            <el-tooltip content="字段管理" placement="top">
              <el-button v-hasPermi="['lowcode:field:list']" link type="primary" icon="List" @click="handleField(scope.row)" />
            </el-tooltip>
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['lowcode:worksheet:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['lowcode:worksheet:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="560px" append-to-body>
      <el-form ref="worksheetFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="所属应用" prop="appId">
          <el-select v-model="form.appId" placeholder="请选择应用" clearable filterable class="w-full">
            <el-option v-for="item in appOptions" :key="item.id" :label="item.appName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据库表名" prop="tableName">
          <el-input v-model="form.tableName" placeholder="请输入数据库表名" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="显示名称" prop="displayName">
          <el-input v-model="form.displayName" placeholder="请输入显示名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
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

<script setup name="LcWorksheet" lang="ts">
import { listWorksheet, getWorksheet, delWorksheet, addWorksheet, updateWorksheet } from '@/api/lowcode/worksheet';
import { WorksheetForm, WorksheetQuery, WorksheetVO } from '@/api/lowcode/worksheet/types';
import { listApp } from '@/api/lowcode/app';
import { AppVO } from '@/api/lowcode/app/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_normal_disable'));
const route = useRoute();
const router = useRouter();

const appOptions = ref<AppVO[]>([]);
const appNameMap = computed(() => {
  const map: Record<string, string> = {};
  appOptions.value.forEach((item) => {
    if (item.id != null) {
      map[String(item.id)] = item.appName || '';
    }
  });
  return map;
});

const worksheetList = ref<WorksheetVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const worksheetFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({ visible: false, title: '' });

const initFormData: WorksheetForm = {
  id: undefined,
  appId: undefined,
  tableName: undefined,
  displayName: undefined,
  description: undefined,
  status: '0'
};

const data = reactive<PageData<WorksheetForm, WorksheetQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    appId: route.query.appId as string || undefined,
    tableName: undefined,
    displayName: undefined,
    status: undefined
  },
  rules: {
    appId: [{ required: true, message: '所属应用不能为空', trigger: 'change' }],
    tableName: [{ required: true, message: '数据库表名不能为空', trigger: 'blur' }],
    displayName: [{ required: true, message: '显示名称不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const getList = async () => {
  loading.value = true;
  try {
    const res = await listWorksheet(queryParams.value);
    worksheetList.value = res.data.rows ?? res.data;
    total.value = res.data.total ?? res.data.length;
  } finally { loading.value = false; }
};

const getAppOptions = async () => {
  const res = await listApp({ pageNum: 1, pageSize: 999 } as AppQuery);
  appOptions.value = res.data.rows ?? res.data;
};

const goBack = () => router.push({ path: '/lowcode/app' });
const cancel = () => { reset(); dialog.visible = false; };
const reset = () => { form.value = { ...initFormData }; worksheetFormRef.value?.resetFields(); };
const handleQuery = () => { queryParams.value.pageNum = 1; getList(); };
const resetQuery = () => { queryFormRef.value?.resetFields(); handleQuery(); };

const handleSelectionChange = (selection: WorksheetVO[]) => {
  ids.value = selection.map((item) => item.id!);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

const handleAdd = () => { reset(); dialog.visible = true; dialog.title = '添加工作表'; };

const handleUpdate = async (row?: WorksheetVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getWorksheet(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工作表';
};

const handleField = (row: WorksheetVO) => {
  router.push('/lowcode/field/index/' + row.id);
};

const submitForm = () => {
  worksheetFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      try {
        if (form.value.id) {
          await updateWorksheet(form.value);
        } else {
          await addWorksheet(form.value);
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

const handleDelete = async (row?: WorksheetVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工作表编号为"' + _ids + '"的数据项？');
  await delWorksheet(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

onMounted(() => {
  getAppOptions();
  getList();
});
</script>