<template>
  <div v-loading="loading" class="router-edit p-2">
    <el-card shadow="never" class="mb-2">
      <template #header>
        <el-space>
          <el-button icon="Back" @click="goBack">返回</el-button>
          <el-button type="primary" icon="Check" :loading="buttonLoading" @click="handleSave">保存</el-button>
        </el-space>
      </template>
      <el-form ref="routerFormRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="工艺路线" prop="router">
              <el-input v-model="form.router" placeholder="请输入工艺路线" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="版本" prop="revision">
              <el-input v-model="form.revision" placeholder="请输入版本" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" placeholder="请输入描述" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="当前版本" prop="currentRevision">
              <el-switch v-model="form.currentRevision" active-value="true" inactive-value="false" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="类型" prop="routerType">
              <el-select v-model="form.routerType" placeholder="请选择类型" clearable>
                <el-option v-for="item in routerTypeOptions" :key="item.dictValue" :label="item.dictLabel" :value="item.dictValue" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" clearable>
                <el-option v-for="item in statusOptions" :key="item.dictValue" :label="item.dictLabel" :value="item.dictValue" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card shadow="never" class="designer-card mb-2">
      <template #header>
        <div class="card-header-row">
          <span>工艺路线设计</span>
          <span class="card-header-tip">从左侧工序库拖拽到画布进行编排</span>
        </div>
      </template>
      <div class="designer-wrap">
        <RoutingDesigner ref="routingRef" :definition="routingData" :processes="operations" />
      </div>
    </el-card>

    <el-collapse v-if="extFields.length" v-model="extFieldsExpanded" class="ext-fields-collapse">
      <el-collapse-item title="扩展字段数据" name="extFields">
        <el-table :data="extFields" border size="small">
          <el-table-column label="自定义字段" prop="attributeDesc" min-width="160">
            <template #default="scope">
              <span class="required-mark">{{ scope.row.required === 'true' ? '*' : '' }}</span>{{ scope.row.attributeDesc || scope.row.description }}
            </template>
          </el-table-column>
          <el-table-column label="类型" prop="fieldTypeDesc" width="180" />
          <el-table-column label="值" prop="value" min-width="220">
            <template #default="scope">
              <el-input v-model="scope.row.value" placeholder="请输入值" />
            </template>
          </el-table-column>
        </el-table>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup name="RouterEdit" lang="ts">
import { getDicts } from '@/api/system/dict/data';
import { listExtFieldDef } from '@/api/mes/extFieldDef';
import { listAllOperation } from '@/api/mes/operation';
import { addRouter, getRouter, updateRouter } from '@/api/mes/router';
import { ExtFieldRow, RouterForm } from '@/api/mes/router/types';
import RoutingDesigner from './components/routing-designer.vue';
import { ROUTING_EDGE_NAME, ROUTING_NODE_NAME } from './components/routing-config';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const vueRouter = useRouter();

const id = computed(() => route.params.id as string | undefined);
const isEdit = computed(() => Boolean(id.value));
const loading = ref(false);
const buttonLoading = ref(false);
const routingRef = ref<any>();
const operations = ref<any[]>([]);
const routingData = ref<any>({});
const extFields = ref<ExtFieldRow[]>([]);
const extFieldsExpanded = ref(['extFields']);
const routerTypeOptions = ref<any[]>([]);
const statusOptions = ref<any[]>([]);
const routerFormRef = ref<ElFormInstance>();

const form = reactive<RouterForm>({
  id: undefined,
  handle: undefined,
  router: undefined,
  revision: undefined,
  description: undefined,
  currentRevision: 'true',
  routerType: 'U',
  status: 'RELEASABLE',
  remark: undefined
});

const rules = {
  router: [{ required: true, message: '工艺路线不能为空', trigger: 'blur' }],
  revision: [{ required: true, message: '版本不能为空', trigger: 'blur' }],
  description: [{ required: true, message: '描述不能为空', trigger: 'blur' }],
  routerType: [{ required: true, message: '类型不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
};

const goBack = () => {
  vueRouter.back();
};

const loadExtFieldDefs = async () => {
  const res = await listExtFieldDef({ tableName: 'ROUTER', pageNum: 1, pageSize: 999 } as any);
  extFields.value = (res.rows || []).map((item: any) => ({
    attribute: item.fieldName,
    attributeDesc: item.description,
    fieldType: item.fieldType,
    fieldTypeDesc: item.fieldTypeDesc || item.fieldType,
    required: item.required,
    value: undefined
  }));
};

const loadDetail = async () => {
  if (!id.value) {
    await loadExtFieldDefs();
    return;
  }
  loading.value = true;
  try {
    const res = await getRouter(id.value);
    Object.assign(form, res.data);
    routingData.value = res.data || {};
    extFields.value = res.data?.extFieldsVOList || [];
  } finally {
    loading.value = false;
  }
};

const normalizeBooleanText = (value: unknown) => (value === true || value === 'true' ? 'true' : 'false');

const buildStepId = (sequence: string | number | undefined) => {
  const value = String(sequence || '');
  return `0000${value}`.substring(value.length);
};

const handleSave = () => {
  routerFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      return;
    }
    const graph = routingRef.value?.graph?.value || routingRef.value?.graph;
    const graphData = graph?.toJSON?.() || { cells: [] };
    const cells = graphData.cells || [];
    const stepList = cells
      .filter((cell: any) => cell.shape === ROUTING_NODE_NAME)
      .map((cell: any) => {
        const routingNode = cell.data.routingNode || {};
        const sequence = String(routingNode.sequence || routingNode.number * 10);
        return {
          cellId: cell.id,
          id: routingNode.persistedId,
          sequence,
          startStep: normalizeBooleanText(routingNode.startStep),
          endStep: normalizeBooleanText(routingNode.endStep),
          isReportingStep: normalizeBooleanText(routingNode.isReportingStep),
          reportingStep: routingNode.reportingStep,
          reportingCenterRef: routingNode.reportingCenterRef,
          stepId: buildStepId(sequence),
          stepType: routingNode.stepType,
          operationRef: routingNode.handle
        };
      });
    const nextStepList = cells
      .filter((cell: any) => cell.shape === ROUTING_EDGE_NAME)
      .map((cell: any) => ({
        routerStepId: stepList.find((item: any) => item.cellId === cell.source.cell)?.stepId,
        nextStepId: stepList.find((item: any) => item.cellId === cell.target.cell)?.stepId,
        sequence: cell?.labels?.[0]?.attrs?.text?.text === 'Y' ? 0 : cell?.labels?.[0]?.attrs?.text?.text === 'N' ? -1 : undefined
      }))
      .filter((item: any) => item.routerStepId && item.nextStepId);

    const payload: RouterForm = {
      ...form,
      id: id.value,
      entryRouterStepId: stepList.find((item: any) => item.startStep === 'true')?.stepId,
      routerContent: JSON.stringify(graphData),
      routerStepSaveVOList: stepList,
      routerNextStepSaveVOList: nextStepList,
      extFieldsSaveVOList: extFields.value
    };

    buttonLoading.value = true;
    try {
      if (id.value) {
        await updateRouter(payload);
      } else {
        await addRouter(payload);
      }
      proxy?.$modal.msgSuccess('保存成功');
      vueRouter.push('/mes/router');
    } finally {
      buttonLoading.value = false;
    }
  });
};

const loadOperations = async () => {
  const res = await listAllOperation({ status: 'RELEASABLE' } as any);
  let list = res.data || [];
  if (!list.length) {
    const fallbackRes = await listAllOperation();
    list = fallbackRes.data || [];
  }
  operations.value = list;
};

onMounted(async () => {
  const [routerTypeRes, statusRes] = await Promise.all([getDicts('ROUTER_TYPE'), getDicts('ROUTER_STATUS')]);
  await loadOperations();
  routerTypeOptions.value = routerTypeRes.data || [];
  statusOptions.value = statusRes.data || [];
  await loadDetail();
});
</script>

<style scoped>
.router-edit {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 96px);
}

.designer-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.designer-card :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  padding: 12px;
}

.designer-wrap {
  height: 100%;
  min-height: 560px;
}

.card-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-header-tip {
  color: #909399;
  font-size: 12px;
  font-weight: 400;
}

.ext-fields-collapse {
  margin-top: 8px;
  border: none;
}

.ext-fields-collapse :deep(.el-collapse-item__header) {
  padding-left: 4px;
  font-weight: 600;
}

.required-mark {
  color: #f56c6c;
}
</style>
