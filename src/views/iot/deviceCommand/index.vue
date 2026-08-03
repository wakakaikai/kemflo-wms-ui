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
        <el-table-column label="参数" prop="commandParamsJson" min-width="150" show-overflow-tooltip />
        <el-table-column label="状态" align="center" width="110">
          <template #default="scope">
            <dict-tag :options="iot_command_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="发送时间" align="center" width="170" prop="sentTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.sentTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="响应" prop="responseJson" min-width="200" show-overflow-tooltip />
        <el-table-column label="创建时间" align="center" width="170" prop="createTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.createTime) }}</span>
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
  </div>
</template>

<script setup name="IotDeviceCommand" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs } from 'vue';
import { ElFormInstance } from 'element-plus';
import { DeviceCommandForm, DeviceCommandQuery, DeviceCommandVO } from '@/api/iot/deviceCommand/types';
import { useRoute, useRouter } from 'vue-router';
import request from '@/utils/request';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();
const { iot_command_status } = toRefs<any>(proxy?.useDict('iot_command_status'));

const commandList = ref<DeviceCommandVO[]>([]);
const total = ref(0);
const loading = ref(true);

const dialog = reactive<DialogOption>({ visible: false, title: '' });
const formRef = ref<ElFormInstance>();

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

const getList = async () => {
  loading.value = true;
  try {
    const res = await request({ url: '/iot/deviceCommand/list', method: 'get', params: queryParams });
    commandList.value = res.data.rows ?? res.data;
    total.value = res.data.total ?? res.data.length;
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
      await request({ url: '/iot/deviceCommand', method: 'post', data: form });
      proxy?.$modal.msgSuccess('命令已发送');
      dialog.visible = false;
      await getList();
    }
  });
};

const handleLogs = (row: DeviceCommandVO) => {
  router.push({ path: '/iot/deviceCommandLog', query: { commandId: row.id } });
};

onMounted(() => { getList(); });
</script>