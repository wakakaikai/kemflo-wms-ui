<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item v-if="!routeDeviceId" label="设备" prop="deviceId">
              <el-select v-model="queryParams.deviceId" placeholder="请选择设备" clearable filterable style="width: 200px">
                <el-option v-for="item in deviceOptions" :key="item.id" :label="item.deviceName" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="连接类型" prop="connectionType">
              <el-select v-model="queryParams.connectionType" placeholder="连接类型" clearable style="width: 150px">
                <el-option v-for="item in connectionTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
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
        <el-row :gutter="10" align="middle">
          <el-col :span="12">
            <span class="text-md font-bold">连接配置</span>
            <span v-if="headerDeviceName" class="ml-2 text-gray-400">- {{ headerDeviceName }}</span>
          </el-col>
          <el-col :span="12" class="text-right">
            <el-button v-hasPermi="['iot:connection:add']" type="primary" plain icon="Plus" @click="handleAdd()">新增</el-button>
            <el-button v-hasPermi="['iot:connection:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
            <el-button v-if="routeDeviceId" icon="Back" @click="goBack">返回</el-button>
            <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
          </el-col>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="connectionList" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="设备名称" prop="deviceName" min-width="140" />
        <el-table-column label="连接类型" align="center" width="130">
          <template #default="scope">
            <dict-tag :options="connectionTypeOptions" :value="scope.row.connectionType" />
          </template>
        </el-table-column>
        <el-table-column label="主机地址" prop="host" min-width="150" />
        <el-table-column label="端口" align="center" width="80" prop="port" />
        <el-table-column label="连接参数" min-width="180">
          <template #default="scope">
            <span>{{ truncateJson(scope.row.connectionParamsJson) }}</span>
            <el-button
              v-if="scope.row.connectionParamsJson"
              link
              type="primary"
              icon="View"
              @click="openJsonPreview(scope.row.connectionParamsJson)"
            >查看</el-button>
          </template>
        </el-table-column>
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
        <el-form-item label="设备" prop="deviceId">
          <el-select
            v-model="form.deviceId"
            placeholder="请选择设备"
            filterable
            style="width: 100%"
            :disabled="!!routeDeviceId && !form.id"
          >
            <el-option v-for="item in deviceOptions" :key="item.id" :label="item.deviceName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="连接类型" prop="connectionType">
          <el-select v-model="form.connectionType" placeholder="请选择连接类型" style="width: 100%">
            <el-option v-for="item in connectionTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
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

    <el-dialog v-model="jsonDialog.visible" title="连接参数 JSON" destroy-on-close append-to-body width="700px">
      <pre class="json-preview">{{ jsonDialog.content }}</pre>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="jsonDialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="IotConnection" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs, computed, onMounted } from 'vue';
import { ElFormInstance } from 'element-plus';
import { listConnection, getConnection, addConnection, updateConnection, delConnection } from '@/api/iot/connection';
import { ConnectionForm, ConnectionQuery, ConnectionVO } from '@/api/iot/connection/types';
import { listDevice } from '@/api/iot/device';
import { DeviceVO } from '@/api/iot/device/types';
import { useRoute, useRouter } from 'vue-router';
import { IOT_CONNECTION_TYPE_OPTIONS } from '@/views/iot/options';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();
const { sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_normal_disable'));

const connectionTypeOptions = IOT_CONNECTION_TYPE_OPTIONS;
const routeDeviceId = computed(() => route.query.deviceId as string | undefined);
const headerDeviceName = computed(() => (route.query.deviceName as string) || '');

const connectionList = ref<ConnectionVO[]>([]);
const deviceOptions = ref<DeviceVO[]>([]);
const total = ref(0);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const multiple = ref(true);

const dialog = reactive<DialogOption>({ visible: false, title: '' });
const jsonDialog = reactive({ visible: false, content: '' });
const queryFormRef = ref<ElFormInstance>();
const formRef = ref<ElFormInstance>();

const initFormData: ConnectionForm = {
  deviceId: route.query.deviceId ? Number(route.query.deviceId) || route.query.deviceId : undefined,
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
    deviceId: route.query.deviceId as string || undefined,
    connectionType: undefined,
    status: undefined,
  },
  rules: {
    deviceId: [{ required: true, message: '设备不能为空', trigger: 'change' }],
    connectionType: [{ required: true, message: '连接类型不能为空', trigger: 'change' }],
  },
});

const { queryParams, form, rules } = toRefs(data);

const loadDeviceOptions = async () => {
  const res = await listDevice({ pageNum: 1, pageSize: 100 });
  deviceOptions.value = (res as any).rows ?? [];
};

const getList = async () => {
  loading.value = true;
  try {
    const res = await listConnection(queryParams.value);
    connectionList.value = (res as any).rows ?? [];
    total.value = (res as any).total ?? 0;
  } finally {
    loading.value = false;
  }
};

const truncateJson = (json?: string, maxLen = 40) => {
  if (!json) return '-';
  const compact = json.replace(/\s+/g, ' ');
  return compact.length > maxLen ? compact.slice(0, maxLen) + '...' : compact;
};

const formatJsonContent = (content?: string | null) => {
  if (!content) return '';
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
};

const openJsonPreview = (json?: string) => {
  jsonDialog.content = formatJsonContent(json);
  jsonDialog.visible = true;
};

const handleSelectionChange = (selection: ConnectionVO[]) => {
  ids.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

const goBack = () => router.push({ path: '/iot/device' });

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = {
    ...initFormData,
    deviceId: routeDeviceId.value ? Number(routeDeviceId.value) || routeDeviceId.value : queryParams.value.deviceId,
  };
  formRef.value?.resetFields();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  if (routeDeviceId.value) {
    queryParams.value.deviceId = routeDeviceId.value;
  }
  handleQuery();
};

const handleAdd = () => {
  reset();
  if (routeDeviceId.value) {
    form.value.deviceId = Number(routeDeviceId.value) || routeDeviceId.value;
  }
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

const handleDelete = async (row?: ConnectionVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除选中的连接配置?');
  await delConnection(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

onMounted(async () => {
  await loadDeviceOptions();
  await getList();
});
</script>

<style scoped>
.json-preview {
  margin: 0;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  max-height: 480px;
  overflow: auto;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
