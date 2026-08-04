<template>
  <div class="p-2">
    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" align="middle">
          <el-col :span="12">
            <span class="text-md font-bold">设备命令</span>
            <span v-if="route.query.deviceName" class="ml-2 text-gray-400">- {{ route.query.deviceName }}</span>
          </el-col>
          <el-col :span="12" class="text-right">
            <el-button v-hasPermi="['iot:deviceCommand:add']" type="primary" plain icon="Plus" @click="handleAdd()">发送命令</el-button>
            <el-button icon="Back" @click="goBack">返回</el-button>
          </el-col>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="commandList" border>
        <el-table-column label="命令编码" prop="commandCode" min-width="140" />
        <el-table-column label="参数" min-width="150">
          <template #default="scope">
            <span>{{ previewJson(scope.row.commandParamsJson) }}</span>
            <el-button v-if="scope.row.commandParamsJson" link type="primary" @click="openJson('命令参数', scope.row.commandParamsJson)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="110">
          <template #default="scope">
            <dict-tag :options="commandStatusOptions" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="发送时间" align="center" width="170" prop="sentTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.sentTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="响应" min-width="200">
          <template #default="scope">
            <span>{{ previewJson(scope.row.responseJson) }}</span>
            <el-button v-if="scope.row.responseJson" link type="primary" @click="openJson('响应数据', scope.row.responseJson)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column fixed="right" align="center" label="操作" width="120">
          <template #default="scope">
            <el-button link type="primary" icon="Tickets" @click="handleLogs(scope.row)">日志</el-button>
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

    <el-dialog v-model="dialog.visible" title="发送命令" destroy-on-close append-to-body width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="命令编码" prop="commandCode">
          <el-input v-model="form.commandCode" placeholder="请输入命令编码" />
        </el-form-item>
        <el-form-item label="参数(JSON)" prop="commandParamsJson">
          <el-input v-model="form.commandParamsJson" type="textarea" :rows="4" placeholder='{"key": "value"}' />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="jsonVisible" :title="jsonTitle" destroy-on-close append-to-body width="700px">
      <pre class="json-pre">{{ jsonContent }}</pre>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="jsonVisible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="IotDeviceCommand" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, computed, reactive, ref, toRefs } from 'vue';
import { ElFormInstance } from 'element-plus';
import { listDeviceCommand, addDeviceCommand } from '@/api/iot/deviceCommand';
import { DeviceCommandForm, DeviceCommandQuery, DeviceCommandVO } from '@/api/iot/deviceCommand/types';
import { IOT_COMMAND_STATUS_OPTIONS, resolveDictOptions } from '@/views/iot/options';
import { useRoute, useRouter } from 'vue-router';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();
const { iot_command_status } = toRefs<any>(proxy?.useDict('iot_command_status'));
const commandStatusOptions = computed(() => resolveDictOptions(iot_command_status.value, IOT_COMMAND_STATUS_OPTIONS));

const commandList = ref<DeviceCommandVO[]>([]);
const total = ref(0);
const loading = ref(true);

const dialog = reactive<DialogOption>({ visible: false, title: '' });
const formRef = ref<ElFormInstance>();

const jsonVisible = ref(false);
const jsonTitle = ref('');
const jsonContent = ref('');

const queryParams = reactive<DeviceCommandQuery>({
  pageNum: 1,
  pageSize: 10,
  deviceId: route.query.deviceId as string || undefined,
});

const initFormData: DeviceCommandForm = {
  deviceId: route.query.deviceId as string || undefined,
  commandCode: undefined,
  commandParamsJson: undefined,
};

const form = reactive<DeviceCommandForm>({ ...initFormData });
const rules: ElFormRules = {
  commandCode: [{ required: true, message: '命令编码不能为空', trigger: 'blur' }],
};

const previewJson = (raw?: string, maxLen = 50) => {
  if (!raw) return '-';
  const s = raw.replace(/\s+/g, ' ');
  return s.length > maxLen ? s.slice(0, maxLen) + '...' : s;
};

const openJson = (title: string, raw?: string) => {
  jsonTitle.value = title;
  try { jsonContent.value = raw ? JSON.stringify(JSON.parse(raw), null, 2) : ''; }
  catch { jsonContent.value = raw || ''; }
  jsonVisible.value = true;
};

const getList = async () => {
  loading.value = true;
  try {
    const res = await listDeviceCommand(queryParams);
    commandList.value = (res as any).rows ?? [];
    total.value = (res as any).total ?? 0;
  } finally { loading.value = false; }
};

const goBack = () => router.push({ path: '/iot/device' });
const cancel = () => { dialog.visible = false; };

const handleAdd = () => {
  form.deviceId = queryParams.deviceId;
  form.commandCode = undefined;
  form.commandParamsJson = undefined;
  dialog.visible = true;
};

const submitForm = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      await addDeviceCommand(form);
      proxy?.$modal.msgSuccess('命令已发送');
      dialog.visible = false;
      await getList();
    }
  });
};

const handleLogs = (row: DeviceCommandVO) => {
  router.push({
    path: '/iot/deviceCommandLog',
    query: {
      commandId: row.id,
      deviceId: route.query.deviceId,
      deviceName: route.query.deviceName,
    },
  });
};

onMounted(() => { getList(); });
</script>

<style scoped>
.json-pre {
  margin: 0;
  max-height: 500px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  font-size: 13px;
}
</style>
