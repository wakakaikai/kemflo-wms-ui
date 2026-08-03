<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="连接器" prop="connectorId">
              <el-select v-model="queryParams.connectorId" placeholder="连接器" clearable filterable>
                <el-option v-for="item in connectorOptions" :key="item.connectorId" :label="item.connectorName" :value="item.connectorId" />
              </el-select>
            </el-form-item>
            <el-form-item label="操作编码" prop="operationCode">
              <el-input v-model="queryParams.operationCode" placeholder="请输入操作编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="操作名称" prop="operationName">
              <el-input v-model="queryParams.operationName" placeholder="请输入操作名称" clearable @keyup.enter="handleQuery" />
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
            <el-button v-hasPermi="['integration:operation:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['integration:operation:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">
              修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['integration:operation:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="operationList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="操作编码" align="center" prop="operationCode" :show-overflow-tooltip="true" />
        <el-table-column label="操作名称" align="center" prop="operationName" :show-overflow-tooltip="true" />
        <el-table-column label="所属连接器" align="center" prop="connectorName" :show-overflow-tooltip="true" />
        <el-table-column label="请求方法" align="center" prop="httpMethod">
          <template #default="scope">
            <el-tag v-if="scope.row.httpMethod === 'GET'" type="success" effect="plain">GET</el-tag>
            <el-tag v-else-if="scope.row.httpMethod === 'POST'" type="primary" effect="plain">POST</el-tag>
            <el-tag v-else-if="scope.row.httpMethod === 'PUT'" type="warning" effect="plain">PUT</el-tag>
            <el-tag v-else-if="scope.row.httpMethod === 'DELETE'" type="danger" effect="plain">DELETE</el-tag>
            <span v-else>{{ scope.row.httpMethod }}</span>
          </template>
        </el-table-column>
        <el-table-column label="请求路径" align="center" prop="httpPath" :show-overflow-tooltip="true" />
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['integration:operation:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['integration:operation:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 添加或修改操作对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="700px" append-to-body>
      <el-form ref="operationFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="连接器" prop="connectorId">
          <el-select v-model="form.connectorId" placeholder="请选择连接器" clearable filterable disabled>
            <el-option v-for="item in connectorOptions" :key="item.connectorId" :label="item.connectorName" :value="item.connectorId" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作编码" prop="operationCode">
          <el-input v-model="form.operationCode" placeholder="请输入操作编码" />
        </el-form-item>
        <el-form-item label="操作名称" prop="operationName">
          <el-input v-model="form.operationName" placeholder="请输入操作名称" />
        </el-form-item>
        <el-form-item label="请求方法" prop="httpMethod">
          <el-select v-model="form.httpMethod" placeholder="请选择请求方法">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>
        </el-form-item>
        <el-form-item label="请求路径" prop="httpPath">
          <el-input v-model="form.httpPath" placeholder="请输入请求路径" />
        </el-form-item>
        <el-form-item label="请求Schema" prop="requestSchemaJson">
          <el-input v-model="form.requestSchemaJson" type="textarea" :rows="4" placeholder="请输入请求Schema（JSON格式）" />
        </el-form-item>
        <el-form-item label="响应Schema" prop="responseSchemaJson">
          <el-input v-model="form.responseSchemaJson" type="textarea" :rows="4" placeholder="请输入响应Schema（JSON格式）" />
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
import { listOperation, getOperation, delOperation, addOperation, updateOperation } from '@/api/integration/operation';
import { OperationForm, OperationQuery, OperationVO } from '@/api/integration/operation/types';
import { listConnector } from '@/api/integration/connector';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_normal_disable'));

const connectorOptions = ref<any[]>([]);
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
  operationId: undefined,
  connectorId: undefined,
  operationCode: '',
  operationName: '',
  httpMethod: '',
  httpPath: '',
  requestSchemaJson: '',
  responseSchemaJson: '',
  inputMappingJson: '',
  outputMappingJson: '',
  status: '0'
};
const data = reactive<PageData<OperationForm, OperationQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    connectorId: undefined,
    operationCode: '',
    operationName: '',
    status: ''
  },
  rules: {
    connectorId: [{ required: true, message: '连接器不能为空', trigger: 'change' }],
    operationCode: [{ required: true, message: '操作编码不能为空', trigger: 'blur' }],
    operationName: [{ required: true, message: '操作名称不能为空', trigger: 'blur' }],
    httpMethod: [{ required: true, message: '请求方法不能为空', trigger: 'change' }],
    httpPath: [{ required: true, message: '请求路径不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询操作列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listOperation(queryParams.value);
    operationList.value = res.rows;
    total.value = res.total;
  } finally { loading.value = false; }
};

/** 查询连接器列表 */
const getConnectorList = async () => {
  const res = await listConnector({ pageNum: 1, pageSize: 999, connectorCode: '', connectorName: '', connectorType: '', status: '' });
  connectorOptions.value = res.rows;
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
  ids.value = selection.map((item) => item.operationId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加操作';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: OperationVO) => {
  reset();
  const _operationId = row?.operationId || ids.value[0];
  const res = await getOperation(_operationId);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改操作';
};

/** 提交按钮 */
const submitForm = () => {
  operationFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.operationId) {
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
  const _operationIds = row?.operationId || ids.value;
  await proxy?.$modal.confirm('是否确认删除操作编号为"' + _operationIds + '"的数据项？');
  await delOperation(_operationIds);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

onMounted(() => {
  getList();
  getConnectorList();
});
</script>
