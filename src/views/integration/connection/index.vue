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
            <el-form-item label="连接名称" prop="connectionName">
              <el-input v-model="queryParams.connectionName" placeholder="请输入连接名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="状态" clearable>
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
            <el-button v-hasPermi="['integration:connection:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['integration:connection:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">
              修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['integration:connection:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="connectionList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="连接名称" align="center" prop="connectionName" :show-overflow-tooltip="true" />
        <el-table-column label="所属连接器" align="center" prop="connectorName" :show-overflow-tooltip="true" />
        <el-table-column label="配置信息" align="center" prop="configJson" :show-overflow-tooltip="true" />
        <el-table-column label="凭证名称" align="center" prop="credentialName" :show-overflow-tooltip="true" />
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['integration:connection:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['integration:connection:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 添加或修改连接配置对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="600px" append-to-body>
      <el-form ref="connectionFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="连接器" prop="connectorId">
          <el-select v-model="form.connectorId" placeholder="请选择连接器" clearable filterable>
            <el-option v-for="item in connectorOptions" :key="item.connectorId" :label="item.connectorName" :value="item.connectorId" />
          </el-select>
        </el-form-item>
        <el-form-item label="连接名称" prop="connectionName">
          <el-input v-model="form.connectionName" placeholder="请输入连接名称" />
        </el-form-item>
        <el-form-item label="配置信息" prop="configJson">
          <el-input v-model="form.configJson" type="textarea" :rows="4" placeholder="请输入配置信息（JSON格式）" />
        </el-form-item>
        <el-form-item label="凭证" prop="credentialId">
          <el-select v-model="form.credentialId" placeholder="请选择凭证" clearable filterable>
            <el-option v-for="item in credentialOptions" :key="item.credentialId" :label="item.credentialName" :value="item.credentialId" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
              {{ dict.label }}
            </el-radio>
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

<script setup name="Connection" lang="ts">
import { listConnection, getConnection, delConnection, addConnection, updateConnection } from '@/api/integration/connection';
import { ConnectionForm, ConnectionQuery, ConnectionVO } from '@/api/integration/connection/types';
import { listConnector } from '@/api/integration/connector';
import { listCredential } from '@/api/integration/credential';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_normal_disable'));

const connectorOptions = ref<any[]>([]);
const credentialOptions = ref<any[]>([]);
const connectionList = ref<ConnectionVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const connectionFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ConnectionForm = {
  connectionId: undefined,
  connectorId: undefined,
  connectionName: '',
  configJson: '',
  credentialId: undefined,
  status: '0'
};
const data = reactive<PageData<ConnectionForm, ConnectionQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    connectorId: undefined,
    connectionName: '',
    status: ''
  },
  rules: {
    connectorId: [{ required: true, message: '连接器不能为空', trigger: 'change' }],
    connectionName: [{ required: true, message: '连接名称不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询连接配置列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listConnection(queryParams.value);
    connectionList.value = res.rows;
    total.value = res.total;
  } finally { loading.value = false; }
};

/** 查询连接器列表 */
const getConnectorList = async () => {
  const res = await listConnector({ pageNum: 1, pageSize: 999, connectorCode: '', connectorName: '', connectorType: '', status: '' });
  connectorOptions.value = res.rows;
};

/** 查询凭证列表 */
const getCredentialList = async () => {
  const res = await listCredential({ pageNum: 1, pageSize: 999, credentialName: '', credentialType: '', status: '' });
  credentialOptions.value = res.rows;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  connectionFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: ConnectionVO[]) => {
  ids.value = selection.map((item) => item.connectionId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加连接配置';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: ConnectionVO) => {
  reset();
  const _connectionId = row?.connectionId || ids.value[0];
  const res = await getConnection(_connectionId);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改连接配置';
};

/** 提交按钮 */
const submitForm = () => {
  connectionFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.connectionId) {
        await updateConnection(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addConnection(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: ConnectionVO) => {
  const _connectionIds = row?.connectionId || ids.value;
  await proxy?.$modal.confirm('是否确认删除连接配置编号为"' + _connectionIds + '"的数据项？');
  await delConnection(_connectionIds);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

onMounted(() => {
  getList();
  getConnectorList();
  getCredentialList();
});
</script>
