<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="设备" prop="deviceId">
              <el-select v-model="queryParams.deviceId" placeholder="请选择设备" clearable filterable>
                <el-option v-for="item in deviceOptions" :key="item.id" :label="`${item.deviceCode} - ${item.deviceName}`" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="参数编码" prop="paramCode">
              <el-input v-model="queryParams.paramCode" placeholder="请输入参数编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="参数名称" prop="paramName">
              <el-input v-model="queryParams.paramName" placeholder="请输入参数名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="数据类型" prop="dataType">
              <el-select v-model="queryParams.dataType" placeholder="请选择数据类型" clearable>
                <el-option v-for="dict in sc_collect_data_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
                <el-option v-for="dict in scCollectStatusOptions" :key="dict.value" :label="dict.label" :value="Number(dict.value)" />
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

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:scCollectParam:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:scCollectParam:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:scCollectParam:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:scCollectParam:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="paramList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="设备" align="center" min-width="140">
          <template #default="scope">{{ scope.row.deviceCode }} - {{ scope.row.deviceName }}</template>
        </el-table-column>
        <el-table-column label="协议" align="center" prop="protocolCode" width="110">
          <template #default="scope">
            <dict-tag :options="sc_collect_protocol" :value="scope.row.protocolCode" />
          </template>
        </el-table-column>
        <el-table-column label="参数编码" align="center" prop="paramCode" min-width="100" />
        <el-table-column label="参数名称" align="center" prop="paramName" min-width="100" />
        <el-table-column label="点位地址" align="center" prop="tagAddress" min-width="140" show-overflow-tooltip />
        <el-table-column label="数据类型" align="center" prop="dataType" width="90">
          <template #default="scope">
            <dict-tag :options="sc_collect_data_type" :value="scope.row.dataType" />
          </template>
        </el-table-column>
        <el-table-column label="单位" align="center" prop="unit" width="70" />
        <el-table-column label="单位描述" align="center" prop="unitDesc" min-width="90" />
        <el-table-column label="状态" align="center" prop="status" width="80">
          <template #default="scope">
            <dict-tag :options="scCollectStatusOptions" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:scCollectParam:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:scCollectParam:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <el-dialog :title="dialog.title" v-model="dialog.visible" width="760px" append-to-body>
      <el-form ref="paramFormRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备" prop="deviceId">
              <el-select v-model="form.deviceId" placeholder="请选择设备" filterable class="w-full">
                <el-option v-for="item in deviceOptions" :key="item.id" :label="`${item.deviceCode} - ${item.deviceName}`" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="参数编码" prop="paramCode">
              <el-input v-model="form.paramCode" placeholder="请输入参数编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="参数名称" prop="paramName">
              <el-input v-model="form.paramName" placeholder="请输入参数名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="点位地址" prop="tagAddress">
              <el-input v-model="form.tagAddress" placeholder="PLC4X地址，如 holding-register:1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据类型" prop="dataType">
              <el-select v-model="form.dataType" placeholder="请选择数据类型" class="w-full">
                <el-option v-for="dict in sc_collect_data_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据长度" prop="dataLength">
              <el-input-number v-model="form.dataLength" :min="1" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="form.unit" placeholder="如 ℃、bar" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位描述" prop="unitDesc">
              <el-input v-model="form.unitDesc" placeholder="如 摄氏度" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="缩放系数" prop="scaleFactor">
              <el-input-number v-model="form.scaleFactor" :precision="6" :step="0.1" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="偏移值" prop="offsetValue">
              <el-input-number v-model="form.offsetValue" :precision="6" :step="0.1" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number v-model="form.sortOrder" :min="0" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in scCollectStatusOptions" :key="dict.value" :value="Number(dict.value)">{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="参数描述" prop="description">
              <el-input v-model="form.description" type="textarea" placeholder="请输入参数描述" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
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

<script setup name="ScCollectParam" lang="ts">
import { listScCollectParam, getScCollectParam, delScCollectParam, addScCollectParam, updateScCollectParam } from '@/api/wms/dataCollection/param';
import { ScCollectParamVO, ScCollectParamQuery, ScCollectParamForm } from '@/api/wms/dataCollection/param/types';
import { listScCollectDevice } from '@/api/wms/dataCollection/device';
import { ScCollectDeviceVO } from '@/api/wms/dataCollection/device/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sc_collect_data_type, sc_collect_protocol } = toRefs<any>(proxy?.useDict('sc_collect_data_type', 'sc_collect_protocol'));

/** 状态：0-停用 1-启用（与后端一致，勿用 sys_normal_disable） */
const scCollectStatusOptions = [
  { label: '启用', value: '1', elTagType: 'success' },
  { label: '停用', value: '0', elTagType: 'danger' }
];

const paramList = ref<ScCollectParamVO[]>([]);
const deviceOptions = ref<ScCollectDeviceVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const paramFormRef = ref<ElFormInstance>();
const dialog = reactive<DialogOption>({ visible: false, title: '' });

const initFormData: ScCollectParamForm = {
  id: undefined,
  deviceId: undefined,
  paramCode: undefined,
  paramName: undefined,
  description: undefined,
  tagAddress: undefined,
  dataType: 'REAL',
  dataLength: 1,
  unit: undefined,
  unitDesc: undefined,
  scaleFactor: 1,
  offsetValue: 0,
  sortOrder: 0,
  status: 1,
  remark: undefined
};

const data = reactive<PageData<ScCollectParamForm, ScCollectParamQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deviceId: undefined,
    paramCode: undefined,
    paramName: undefined,
    dataType: undefined,
    status: undefined,
    params: {}
  },
  rules: {
    deviceId: [{ required: true, message: '设备不能为空', trigger: 'change' }],
    paramCode: [{ required: true, message: '参数编码不能为空', trigger: 'blur' }],
    paramName: [{ required: true, message: '参数名称不能为空', trigger: 'blur' }],
    tagAddress: [{ required: true, message: '点位地址不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const loadDeviceOptions = async () => {
  const res = await listScCollectDevice({ pageNum: 1, pageSize: 1000 });
  deviceOptions.value = res.rows || [];
};

const getList = async () => {
  loading.value = true;
  const res = await listScCollectParam(queryParams.value);
  paramList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = { ...initFormData };
  paramFormRef.value?.resetFields();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: ScCollectParamVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加采集参数';
};

const handleUpdate = async (row?: ScCollectParamVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getScCollectParam(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改采集参数';
};

const submitForm = () => {
  paramFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateScCollectParam(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addScCollectParam(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

const handleDelete = async (row?: ScCollectParamVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除选中的采集参数？');
  await delScCollectParam(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

const handleExport = () => {
  proxy?.download('wms/dataCollection/param/export', { ...queryParams.value }, `scCollectParam_${new Date().getTime()}.xlsx`);
};

onMounted(async () => {
  await loadDeviceOptions();
  await getList();
});
</script>
