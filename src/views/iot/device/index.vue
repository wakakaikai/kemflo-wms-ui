<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="设备编码" prop="deviceCode">
              <el-input v-model="queryParams.deviceCode" placeholder="请输入设备编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="设备名称" prop="deviceName">
              <el-input v-model="queryParams.deviceName" placeholder="请输入设备名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="在线状态" prop="onlineStatus">
              <el-select v-model="queryParams.onlineStatus" placeholder="在线状态" clearable style="width: 120px">
                <el-option label="在线" value="1" />
                <el-option label="离线" value="0" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="设备状态" clearable style="width: 120px">
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
            <el-button v-hasPermi="['iot:device:add']" type="primary" plain icon="Plus" @click="handleAdd()">新增</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" :data="deviceList" border>
        <el-table-column label="设备编码" prop="deviceCode" min-width="140" />
        <el-table-column label="设备名称" prop="deviceName" min-width="160" />
        <el-table-column label="产品ID" align="center" width="100" prop="productId" />
        <el-table-column label="在线状态" align="center" width="100">
          <template #default="scope">
            <dict-tag :options="iot_online_status" :value="scope.row.onlineStatus" />
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="90">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="设备位置" prop="deviceLocation" min-width="140" />
        <el-table-column label="最后在线" align="center" width="170" prop="lastOnlineTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.lastOnlineTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" width="170" prop="createTime">
          <template #default="scope">
            <span>{{ proxy?.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" align="center" label="操作" width="250">
          <template #default="scope">
            <el-button v-hasPermi="['iot:device:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button v-hasPermi="['iot:deviceCommand:list']" link type="primary" icon="Cpu" @click="handleCommands(scope.row)">命令</el-button>
            <el-button v-hasPermi="['iot:device:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
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
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="设备编码" prop="deviceCode">
          <el-input v-model="form.deviceCode" placeholder="请输入设备编码" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="设备名称" prop="deviceName">
          <el-input v-model="form.deviceName" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="产品ID" prop="productId">
          <el-input-number v-model="form.productId" :min="0" style="width: 100%" placeholder="请选择产品" />
        </el-form-item>
        <el-form-item label="设备位置" prop="deviceLocation">
          <el-input v-model="form.deviceLocation" placeholder="请输入设备位置" />
        </el-form-item>
        <el-form-item label="设备状态" prop="status">
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

<script setup name="IotDevice" lang="ts">
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs } from 'vue';
import { ElFormInstance } from 'element-plus';
import { listDevice, getDevice, addDevice, updateDevice, delDevice } from '@/api/iot/device';
import { DeviceForm, DeviceQuery, DeviceVO } from '@/api/iot/device/types';
import { useRouter } from 'vue-router';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const router = useRouter();
const { sys_normal_disable, iot_online_status } = toRefs<any>(proxy?.useDict('sys_normal_disable', 'iot_online_status'));

const deviceList = ref<DeviceVO[]>([]);
const total = ref(0);
const loading = ref(true);
const showSearch = ref(true);

const dialog = reactive<DialogOption>({ visible: false, title: '' });
const queryFormRef = ref<ElFormInstance>();
const formRef = ref<ElFormInstance>();

const initFormData: DeviceForm = {
  deviceCode: undefined,
  deviceName: undefined,
  productId: undefined,
  deviceLocation: undefined,
  status: '0',
};

const data = reactive<PageData<DeviceForm, DeviceQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deviceCode: undefined,
    deviceName: undefined,
    onlineStatus: undefined,
    status: undefined,
  },
  rules: {
    deviceCode: [{ required: true, message: '设备编码不能为空', trigger: 'blur' }],
    deviceName: [{ required: true, message: '设备名称不能为空', trigger: 'blur' }],
    productId: [{ required: true, message: '产品不能为空', trigger: 'blur' }],
  },
});

const { queryParams, form, rules } = toRefs(data);

const getList = async () => {
  loading.value = true;
  try {
    const res = await listDevice(queryParams.value);
    deviceList.value = res.data.rows ?? res.data;
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
  dialog.title = '新增设备';
};

const handleUpdate = async (row: DeviceVO) => {
  reset();
  const res = await getDevice(row.id);
  form.value = res.data;
  dialog.visible = true;
  dialog.title = '修改设备';
};

const handleCommands = (row: DeviceVO) => {
  router.push({ path: '/iot/deviceCommand', query: { deviceId: row.id, deviceName: row.deviceName } });
};

const submitForm = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.id ? await updateDevice(form.value) : await addDevice(form.value);
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

const handleDelete = async (row: DeviceVO) => {
  await proxy?.$modal.confirm('是否确认删除设备"' + row.deviceName + '"?');
  await delDevice(row.id);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

onMounted(() => { getList(); });
</script>