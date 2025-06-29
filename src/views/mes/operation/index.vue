<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="工序编码" prop="operation">
              <el-input v-model="queryParams.operation" placeholder="请输入工序编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="描述" prop="description">
              <el-input v-model="queryParams.description" placeholder="请输入描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工序类型" prop="resourceTypeBo">
              <el-input v-model="queryParams.resourceTypeBo" placeholder="请输入" clearable @keyup.enter="handleQuery" />
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
            <el-button v-hasPermi="['mes:operation:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['mes:operation:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['mes:operation:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['mes:operation:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="operationList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="工序编码" align="center" prop="operation" />
        <el-table-column label="描述" align="center" prop="description" />
        <el-table-column label="状态" align="center" prop="status" />
        <el-table-column label="工序类型" align="center" prop="type" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="创建者" align="center" prop="creator" />
        <el-table-column label="创建时间" align="center" prop="createTime" />
        <el-table-column label="更新者" align="center" prop="updater" />
        <el-table-column label="更新时间" align="center" prop="modifyTime" width="180" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['mes:operation:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['mes:operation:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <!-- 添加或修改工序对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="operationFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="数据行索引" prop="handle">
          <el-input v-model="form.handle" placeholder="请输入数据行索引" />
        </el-form-item>
        <el-form-item label="工序编码" prop="operation">
          <el-input v-model="form.operation" placeholder="请输入工序编码" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="资源类型" prop="resourceTypeBo">
          <el-input v-model="form.resourceTypeBo" placeholder="请输入" />
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

<script setup name="Operation" lang="ts">
import { listOperation, getOperation, delOperation, addOperation, updateOperation } from '@/api/mes/operation';
import { OperationVO, OperationQuery, OperationForm } from '@/api/mes/operation/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const operationList = ref<OperationVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const operationFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: OperationForm = {
  id: undefined,
  handle: undefined,
  operation: undefined,
  description: undefined,
  status: undefined,
  type: undefined,
  specialRouterBo: undefined,
  defaultResourceBo: undefined,
  resourceTypeBo: undefined,
  maxLoop: undefined,
  beforeIntervalDuration: undefined,
  requiredTimeInProcess: undefined,
  remark: undefined,
};
const data = reactive<PageData<OperationForm, OperationQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    handle: undefined,
    operation: undefined,
    description: undefined,
    status: undefined,
    type: undefined,
    specialRouterBo: undefined,
    defaultResourceBo: undefined,
    resourceTypeBo: undefined,
    maxLoop: undefined,
    beforeIntervalDuration: undefined,
    requiredTimeInProcess: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '记录唯一ID不能为空', trigger: 'blur' }],
    handle: [{ required: true, message: '数据行索引不能为空', trigger: 'blur' }],
    operation: [{ required: true, message: '工序编码不能为空', trigger: 'blur' }],
    description: [{ required: true, message: '描述不能为空', trigger: 'blur' }],
    status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
    type: [{ required: true, message: '工序类型不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询工序列表 */
const getList = async () => {
  loading.value = true;
  const res = await listOperation(queryParams.value);
  operationList.value = res.rows;
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
  operationFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: OperationVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加工序';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: OperationVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getOperation(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工序';
};

/** 提交按钮 */
const submitForm = () => {
  operationFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateOperation(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addOperation(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: OperationVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工序编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delOperation(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/operation/export',
    {
      ...queryParams.value
    },
    `operation_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
