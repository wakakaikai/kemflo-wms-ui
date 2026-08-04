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
            <el-form-item label="产品" prop="productId">
              <el-select v-model="queryParams.productId" placeholder="请选择产品" clearable filterable style="width: 180px">
                <el-option v-for="item in productOptions" :key="item.id" :label="item.productName" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="在线状态" prop="onlineStatus">
              <el-select v-model="queryParams.onlineStatus" placeholder="在线状态" clearable style="width: 120px">
                <el-option v-for="item in onlineStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
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
          <el-col :span="1.5">
            <el-button v-hasPermi="['iot:device:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" :data="deviceList" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="设备编码" prop="deviceCode" min-width="140" />
        <el-table-column label="设备名称" prop="deviceName" min-width="160" />
        <el-table-column label="产品" prop="productName" min-width="140" />
        <el-table-column label="在线状态" align="center" width="100">
          <template #default="scope">
            <dict-tag :options="onlineStatusOptions" :value="scope.row.onlineStatus" />
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
        <el-table-column fixed="right" align="center" label="操作" width="220">
          <template #default="scope">
            <el-button v-hasPermi="['iot:device:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button v-hasPermi="['iot:device:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
            <el-dropdown trigger="click" @command="(cmd: string) => handleMoreAction(cmd, scope.row)">
              <el-button link type="primary" icon="ArrowDown">更多</el-button>
              <template #dropdown>
                <el-dropdown-item command="connection" icon="Link">连接配置</el-dropdown-item>
                <el-dropdown-item command="devicePoint" icon="Coin">设备点位</el-dropdown-item>
                <el-dropdown-item command="deviceShadow" icon="CopyDocument">设备影子</el-dropdown-item>
                <el-dropdown-item command="deviceEvent" icon="Bell">设备事件</el-dropdown-item>
                <el-dropdown-item command="deviceCommand" icon="Cpu">设备命令</el-dropdown-item>
              </template>
            </el-dropdown>
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
        <el-form-item label="产品" prop="productId">
          <el-select v-model="form.productId" placeholder="请选择产品" filterable style="width: 100%">
            <el-option v-for="item in productOptions" :key="item.id" :label="item.productName" :value="item.id" />
          </el-select>
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
import { getCurrentInstance, ComponentInternalInstance, reactive, ref, toRefs, computed, onMounted } from 'vue';
import { ElFormInstance } from 'element-plus';
import { listDevice, getDevice, addDevice, updateDevice, delDevice } from '@/api/iot/device';
import { DeviceForm, DeviceQuery, DeviceVO } from '@/api/iot/device/types';
import { listProduct } from '@/api/iot/product';
import { ProductVO } from '@/api/iot/product/types';
import { useRouter } from 'vue-router';
import { IOT_ONLINE_STATUS_OPTIONS, resolveDictOptions } from '@/views/iot/options';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const router = useRouter();
const { sys_normal_disable, iot_online_status } = toRefs<any>(proxy?.useDict('sys_normal_disable', 'iot_online_status'));
const onlineStatusOptions = computed(() => resolveDictOptions(iot_online_status.value, IOT_ONLINE_STATUS_OPTIONS));

const deviceList = ref<DeviceVO[]>([]);
const productOptions = ref<ProductVO[]>([]);
const total = ref(0);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const multiple = ref(true);

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
    productId: undefined,
    onlineStatus: undefined,
    status: undefined,
  },
  rules: {
    deviceCode: [{ required: true, message: '设备编码不能为空', trigger: 'blur' }],
    deviceName: [{ required: true, message: '设备名称不能为空', trigger: 'blur' }],
    productId: [{ required: true, message: '产品不能为空', trigger: 'change' }],
  },
});

const { queryParams, form, rules } = toRefs(data);

const loadProductOptions = async () => {
  const res = await listProduct({ pageNum: 1, pageSize: 100 });
  productOptions.value = (res as any).rows ?? [];
};

const getList = async () => {
  loading.value = true;
  try {
    const res = await listDevice(queryParams.value);
    deviceList.value = (res as any).rows ?? [];
    total.value = (res as any).total ?? 0;
  } finally {
    loading.value = false;
  }
};

const handleSelectionChange = (selection: DeviceVO[]) => {
  ids.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = { ...initFormData };
  formRef.value?.resetFields();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

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

const handleMoreAction = (command: string, row: DeviceVO) => {
  const query = { deviceId: row.id, deviceName: row.deviceName };
  const routes: Record<string, string> = {
    connection: '/iot/connection',
    devicePoint: '/iot/devicePoint',
    deviceShadow: '/iot/deviceShadow',
    deviceEvent: '/iot/deviceEvent',
    deviceCommand: '/iot/deviceCommand',
  };
  const path = routes[command];
  if (path) {
    router.push({ path, query });
  }
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

const handleDelete = async (row?: DeviceVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除选中的设备?');
  await delDevice(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

onMounted(async () => {
  await loadProductOptions();
  await getList();
});
</script>
