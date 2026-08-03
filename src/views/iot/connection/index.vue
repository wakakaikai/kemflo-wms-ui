<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="连接类型" prop="connectionType">
              <el-select v-model="queryParams.connectionType" placeholder="连接类型" clearable style="width: 150px">
                <el-option label="PLC" value="PLC" />
                <el-option label="Modbus TCP" value="MODBUS_TCP" />
                <el-option label="Modbus RTU" value="MODBUS_RTU" />
                <el-option label="S7" value="S7" />
                <el-option label="OPC UA" value="OPC_UA" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="连接状态" clearable style="width: 120px">
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
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button v-hasPermi="['iot:connection:add']" type="primary" plain icon="Plus" @click="handleAdd()">新增</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" :data="connectionList" border>
        <el-table-column label="设备ID" prop="deviceId" min-width="100" />
        <el-table-column label="连接类型" align="center" width="130" prop="connectionType" />
        <el-table-column label="主机地址" prop="host" min-width="150" />
        <el-table-column label="端口" align="center" width="80" prop="port" />
        <el-table-column label="状态" align="center" width="90">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" width="170" prop="createTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="150" show-overflow-tooltip />
        <el-table-column fixed="right" align="center" label="操作" width="180">
          <template #default="scope">
            <el-button v-hasPermi="['iot:connection:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button v-hasPermi="['iot:connection:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" destroy-on-close append-to-body width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="设备ID" prop="deviceId">
          <el-input-number v-model="form.deviceId" :min="0" style="width: 100%" placeholder="请输入设备ID" />
        </el-form-item>
        <el-form-item label="连接类型" prop="connectionType">
          <el-select v-model="form.connectionType" placeholder="请选择连接类型" style="width: 100%">
            <el-option label="PLC" value="PLC" />
            <el-option label="Modbus TCP" value="MODBUS_TCP" />
            <el-option label="Modbus RTU" value="MODBUS_RTU" />
            <el-option label="S7" value="S7" />
            <el-option label="OPC UA" value="OPC_UA" />
          </el-select>
        </el-form-item>
        <el-form-item label="主机地址" prop="host">
          <el-input v-model="form.host" placeholder="请输入主机地址" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input-number v-model="form.port" :min="1" :max="65535" style="width: 100%" />
        </el-form-item>
        <el-form-item label="连接参数" prop="connectionParamsJson">
          <el-input v-model="form.connectionParamsJson" type="textarea" :rows="3" placeholder="JSON格式连接参数" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="IotConnection" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs } from 'vue';
import { ElFormInstance } from 'element-plus';
import { listConnection, getConnection, addConnection, updateConnection, delConnection } from '@/api/iot/connection';
import { ConnectionForm, ConnectionQuery, ConnectionVO } from '@/api/iot/connection/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_normal_disable'));

const connectionList = ref<ConnectionVO[]>([]);
const total = ref(0);
const loading = ref(true);
const showSearch = ref(true);

const dialog = reactive<DialogOption>({ visible: false, title: '' });
const queryFormRef = ref<ElFormInstance>();
const formRef = ref<ElFormInstance>();

const initFormData: ConnectionForm = {
  deviceId: undefined,
  connectionType: undefined,
  host: undefined,
  port: undefined,
  connectionParamsJson: undefined,
  status: '0',
};

const data = reactive<PageData<ConnectionForm, ConnectionQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    connectionType: undefined,
    status: undefined,
  },
  rules: {
    deviceId: [{ required: true, message: '设备ID不能为空', trigger: 'blur' }],
    connectionType: [{ required: true, message: '连接类型不能为空', trigger: 'change' }],
  },
});

const { queryParams, form, rules } = toRefs(data);

const getList = async () => {
  loading.value = true;
  try {
    const res = await listConnection(queryParams.value);
    connectionList.value = res.data.rows ?? res.data;
    total.value = res.data.total ?? res.data.length;
  } finally { loading.value = false; }
};

const cancel = () => { reset(); dialog.visible = false; };
const reset = () => { form.value = { ...initFormData }; formRef.value?.resetFields(); };
const handleQuery = () => { queryParams.value.pageNum = 1; getList(); };
const resetQuery = () => { queryFormRef.value?.resetFields(); handleQuery(); };

const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '新增连接配置';
};

const handleUpdate = async (row: ConnectionVO) => {
  reset();
  const res = await getConnection(row.id);
  form.value = res.data;
  dialog.visible = true;
  dialog.title = '修改连接配置';
};

const submitForm = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.id ? await updateConnection(form.value) : await addConnection(form.value);
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

const handleDelete = async (row: ConnectionVO) => {
  await proxy?.$modal.confirm('是否确认删除该连接配置?');
  await delConnection(row.id);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

onMounted(() => { getList(); });
</script>