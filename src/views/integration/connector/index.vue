<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="连接器编码" prop="connectorCode">
              <el-input v-model="queryParams.connectorCode" placeholder="请输入连接器编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="连接器名称" prop="connectorName">
              <el-input v-model="queryParams.connectorName" placeholder="请输入连接器名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="连接器类型" prop="connectorType">
              <el-select v-model="queryParams.connectorType" placeholder="连接器类型" clearable>
                <el-option v-for="item in connectorTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
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
            <el-button v-hasPermi="['integration:connector:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['integration:connector:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">
              修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['integration:connector:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="connectorList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="连接器编码" align="center" prop="connectorCode" :show-overflow-tooltip="true" />
        <el-table-column label="连接器名称" align="center" prop="connectorName" :show-overflow-tooltip="true" />
        <el-table-column label="连接器类型" align="center" prop="connectorType">
          <template #default="scope">
            <el-tag v-if="scope.row.connectorType === 'HTTP'" type="primary" effect="plain">HTTP</el-tag>
            <el-tag v-else-if="scope.row.connectorType === 'JDBC'" type="success" effect="plain">JDBC</el-tag>
            <el-tag v-else-if="scope.row.connectorType === 'SAP'" type="warning" effect="plain">SAP</el-tag>
            <el-tag v-else-if="scope.row.connectorType === 'MQTT'" type="info" effect="plain">MQTT</el-tag>
            <el-tag v-else-if="scope.row.connectorType === 'SFTP'" type="danger" effect="plain">SFTP</el-tag>
            <el-tag v-else-if="scope.row.connectorType === 'MAIL'" type="danger" effect="plain">MAIL</el-tag>
            <span v-else>{{ scope.row.connectorType }}</span>
          </template>
        </el-table-column>
        <el-table-column label="版本" align="center" prop="version" />
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)"></el-switch>
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
              <el-button v-hasPermi="['integration:connector:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['integration:connector:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 添加或修改连接器对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="connectorFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="连接器编码" prop="connectorCode">
          <el-input v-model="form.connectorCode" placeholder="请输入连接器编码" />
        </el-form-item>
        <el-form-item label="连接器名称" prop="connectorName">
          <el-input v-model="form.connectorName" placeholder="请输入连接器名称" />
        </el-form-item>
        <el-form-item label="连接器类型" prop="connectorType">
          <el-select v-model="form.connectorType" placeholder="请选择连接器类型">
            <el-option v-for="item in connectorTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="请输入图标" />
        </el-form-item>
        <el-form-item label="版本" prop="version">
          <el-input v-model="form.version" placeholder="请输入版本" />
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

<script setup name="Connector" lang="ts">
import { listConnector, getConnector, delConnector, addConnector, updateConnector } from '@/api/integration/connector';
import { ConnectorForm, ConnectorQuery, ConnectorVO } from '@/api/integration/connector/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_normal_disable'));

const connectorTypeOptions = [
  { value: 'HTTP', label: 'HTTP' },
  { value: 'JDBC', label: 'JDBC' },
  { value: 'SAP', label: 'SAP' },
  { value: 'MQTT', label: 'MQTT' },
  { value: 'SFTP', label: 'SFTP' },
  { value: 'MAIL', label: 'MAIL' }
];

const connectorList = ref<ConnectorVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const connectorFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ConnectorForm = {
  connectorId: undefined,
  connectorCode: '',
  connectorName: '',
  connectorType: '',
  icon: '',
  description: '',
  version: '',
  status: '0'
};
const data = reactive<PageData<ConnectorForm, ConnectorQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    connectorCode: '',
    connectorName: '',
    connectorType: '',
    status: ''
  },
  rules: {
    connectorCode: [{ required: true, message: '连接器编码不能为空', trigger: 'blur' }],
    connectorName: [{ required: true, message: '连接器名称不能为空', trigger: 'blur' }],
    connectorType: [{ required: true, message: '连接器类型不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询连接器列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listConnector(queryParams.value);
    connectorList.value = res.rows;
    total.value = res.total;
  } finally { loading.value = false; }
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  connectorFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: ConnectorVO[]) => {
  ids.value = selection.map((item) => item.connectorId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加连接器';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: ConnectorVO) => {
  reset();
  const _connectorId = row?.connectorId || ids.value[0];
  const res = await getConnector(_connectorId);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改连接器';
};

/** 提交按钮 */
const submitForm = () => {
  connectorFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.connectorId) {
        await updateConnector(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addConnector(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: ConnectorVO) => {
  const _connectorIds = row?.connectorId || ids.value;
  await proxy?.$modal.confirm('是否确认删除连接器编号为"' + _connectorIds + '"的数据项？');
  await delConnector(_connectorIds);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

/** 状态修改 */
const handleStatusChange = async (row: ConnectorVO) => {
  const text = row.status === '0' ? '启用' : '停用';
  try {
    await proxy?.$modal.confirm('确认要"' + text + '"吗?');
    await updateConnector(row);
    proxy?.$modal.msgSuccess(text + '成功');
  } catch (err) {
    row.status = row.status === '0' ? '1' : '0';
  }
};

onMounted(() => {
  getList();
});
</script>
