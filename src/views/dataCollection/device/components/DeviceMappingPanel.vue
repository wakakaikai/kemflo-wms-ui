<template>
  <div>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:scCollectParamMapping:add']">新增映射</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:scCollectParamMapping:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-form v-show="showSearch" ref="queryFormRef" :model="queryParams" :inline="true" class="mb-2" label-width="auto">
      <el-form-item label="采集参数" prop="collectParamId">
        <el-select v-model="queryParams.collectParamId" placeholder="采集参数" clearable filterable>
          <el-option v-for="item in paramOptions" :key="item.id" :label="`${item.paramCode} - ${item.paramName}`" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="后台系统" prop="backendSystem">
        <el-select v-model="queryParams.backendSystem" placeholder="后台系统" clearable>
          <el-option v-for="dict in sc_collect_backend_system" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="后台参数编码" prop="backendParamCode">
        <el-input v-model="queryParams.backendParamCode" placeholder="后台参数编码" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="mappingList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="采集参数" align="center" min-width="140">
        <template #default="scope">{{ scope.row.collectParamCode }} - {{ scope.row.collectParamName }}</template>
      </el-table-column>
      <el-table-column label="后台系统" align="center" prop="backendSystem" width="100">
        <template #default="scope">
          <dict-tag :options="sc_collect_backend_system" :value="scope.row.backendSystem" />
        </template>
      </el-table-column>
      <el-table-column label="后台参数编码" align="center" prop="backendParamCode" min-width="120" />
      <el-table-column label="后台参数名称" align="center" prop="backendParamName" min-width="120" />
      <el-table-column label="转换类型" align="center" prop="transformType" width="100">
        <template #default="scope">
          <dict-tag :options="sc_collect_transform_type" :value="scope.row.transformType" />
        </template>
      </el-table-column>
      <el-table-column label="转换表达式" align="center" prop="transformExpr" min-width="120" show-overflow-tooltip />
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="scope">
          <dict-tag :options="scCollectStatusOptions" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-tooltip content="修改" placement="top">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:scCollectParamMapping:edit']"></el-button>
          </el-tooltip>
          <el-tooltip content="删除" placement="top">
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:scCollectParamMapping:remove']"></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="dialog.title" v-model="dialog.visible" width="720px" append-to-body>
      <el-form ref="mappingFormRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="采集参数" prop="collectParamId">
              <el-select v-model="form.collectParamId" placeholder="请选择采集参数" filterable class="w-full">
                <el-option v-for="item in paramOptions" :key="item.id" :label="`${item.paramCode} - ${item.paramName}`" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="后台系统" prop="backendSystem">
              <el-select v-model="form.backendSystem" placeholder="请选择后台系统" class="w-full">
                <el-option v-for="dict in sc_collect_backend_system" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="后台参数编码" prop="backendParamCode">
              <el-input v-model="form.backendParamCode" placeholder="请输入后台参数编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="后台参数名称" prop="backendParamName">
              <el-input v-model="form.backendParamName" placeholder="请输入后台参数名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="转换类型" prop="transformType">
              <el-select v-model="form.transformType" placeholder="请选择转换类型" class="w-full">
                <el-option v-for="dict in sc_collect_transform_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
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
            <el-form-item label="转换表达式" prop="transformExpr">
              <el-input v-model="form.transformExpr" type="textarea" placeholder="如 value * 0.1" />
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

<script setup lang="ts">
import {
  listScCollectParamMapping,
  getScCollectParamMapping,
  delScCollectParamMapping,
  addScCollectParamMapping,
  updateScCollectParamMapping
} from '@/api/wms/dataCollection/paramMapping';
import { ScCollectParamMappingVO, ScCollectParamMappingQuery, ScCollectParamMappingForm } from '@/api/wms/dataCollection/paramMapping/types';
import { listScCollectParam } from '@/api/wms/dataCollection/param';
import { ScCollectParamVO } from '@/api/wms/dataCollection/param/types';

const props = defineProps<{
  deviceId: string | number;
}>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sc_collect_backend_system, sc_collect_transform_type } = toRefs<any>(
  proxy?.useDict('sc_collect_backend_system', 'sc_collect_transform_type')
);

const scCollectStatusOptions = [
  { label: '启用', value: '1', elTagType: 'success' },
  { label: '停用', value: '0', elTagType: 'danger' }
];

const mappingList = ref<ScCollectParamMappingVO[]>([]);
const paramOptions = ref<ScCollectParamVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(false);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const mappingFormRef = ref<ElFormInstance>();
const dialog = reactive<DialogOption>({ visible: false, title: '' });

const initFormData: ScCollectParamMappingForm = {
  id: undefined,
  deviceId: undefined,
  collectParamId: undefined,
  backendSystem: 'WMS',
  backendParamCode: undefined,
  backendParamName: undefined,
  transformType: 'direct',
  transformExpr: undefined,
  status: 1,
  remark: undefined
};

const queryParams = ref<ScCollectParamMappingQuery>({
  pageNum: 1,
  pageSize: 10,
  deviceId: props.deviceId,
  collectParamId: undefined,
  backendSystem: undefined,
  backendParamCode: undefined,
  status: undefined,
  params: {}
});

const form = ref<ScCollectParamMappingForm>({ ...initFormData });
const rules = {
  collectParamId: [{ required: true, message: '采集参数不能为空', trigger: 'change' }],
  backendParamCode: [{ required: true, message: '后台参数编码不能为空', trigger: 'blur' }]
};

const loadParamOptions = async () => {
  if (!props.deviceId) {
    paramOptions.value = [];
    return;
  }
  const res = await listScCollectParam({ pageNum: 1, pageSize: 1000, deviceId: props.deviceId });
  paramOptions.value = res.rows || [];
};

const getList = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  queryParams.value.deviceId = props.deviceId;
  const res = await listScCollectParamMapping(queryParams.value);
  mappingList.value = res.rows || [];
  total.value = res.total;
  loading.value = false;
};

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = { ...initFormData, deviceId: props.deviceId };
  mappingFormRef.value?.resetFields();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: ScCollectParamMappingVO[]) => {
  ids.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

const handleAdd = async () => {
  reset();
  await loadParamOptions();
  dialog.visible = true;
  dialog.title = '添加参数映射';
};

const handleUpdate = async (row?: ScCollectParamMappingVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getScCollectParamMapping(_id);
  Object.assign(form.value, res.data);
  await loadParamOptions();
  dialog.visible = true;
  dialog.title = '修改参数映射';
};

const submitForm = () => {
  mappingFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    buttonLoading.value = true;
    form.value.deviceId = props.deviceId;
    try {
      if (form.value.id) {
        await updateScCollectParamMapping(form.value);
      } else {
        await addScCollectParamMapping(form.value);
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    } finally {
      buttonLoading.value = false;
    }
  });
};

const handleDelete = async (row?: ScCollectParamMappingVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除选中的参数映射？');
  await delScCollectParamMapping(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

const refresh = async () => {
  await loadParamOptions();
  await getList();
};

watch(
  () => props.deviceId,
  () => {
    queryParams.value.pageNum = 1;
    refresh();
  },
  { immediate: true }
);

defineExpose({ getList, refresh, loadParamOptions });
</script>
