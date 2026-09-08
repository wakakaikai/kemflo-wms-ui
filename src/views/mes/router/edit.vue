<template>
  <div v-loading="loading" class="router-edit p-2">
    <section class="router-section mb-2">
      <div class="router-section__header">
        <span>基础信息</span>
        <el-space class="router-actions">
          <el-button plain icon="Back" @click="goBack">返回</el-button>
          <el-button type="primary" plain icon="Check" :loading="buttonLoading" @click="handleSave">保存</el-button>
        </el-space>
      </div>
      <el-form ref="routerFormRef" :model="form" :rules="rules" label-width="110px" class="router-base-form">
        <el-row :gutter="24">
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
          <el-col :span="12" />
          <el-col :span="6">
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" placeholder="请输入描述" />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="当前版本" prop="currentRevision">
              <el-switch v-model="form.currentRevision" active-value="true" inactive-value="false" />
            </el-form-item>
          </el-col>
          <el-col :span="7">
            <el-form-item label="工艺路线类型" prop="routerType">
              <el-select v-model="form.routerType" placeholder="请选择工艺路线类型" clearable>
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
        </el-row>
      </el-form>
    </section>

    <section class="router-section designer-section mb-2">
      <div class="router-section__header">
        <span>工艺路线</span>
      </div>
      <div v-loading="pageReady && !designerReady" class="designer-wrap">
        <RoutingDesigner v-if="pageReady" ref="routingRef" :definition="routingData" :processes="operations" />
      </div>
    </section>

    <el-collapse v-if="extFields.length" v-model="extFieldsExpanded" class="ext-fields-collapse">
      <el-collapse-item title="扩展字段数据" name="extFields">
        <el-table :data="extFields" border size="small">
          <el-table-column label="自定义字段" prop="attributeDesc" min-width="160">
            <template #default="scope">
              <span class="required-mark">{{ scope.row.required === 'true' ? '*' : '' }}</span
              >{{ scope.row.attributeDesc || scope.row.description }}
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
import { ROUTING_EDGE_NAME, ROUTING_NODE_NAME } from './components/routing-config';

const RoutingDesigner = defineAsyncComponent(() =>
  import('./components/routing-designer.vue').then((mod) => {
    designerReady.value = true;
    return mod;
  })
);

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const vueRouter = useRouter();

const id = computed(() => route.params.id as string | undefined);
const isEdit = computed(() => Boolean(id.value));
const loading = ref(false);
const pageReady = ref(false);
const designerReady = ref(false);
const buttonLoading = ref(false);
const routingRef = ref<any>();
const operations = ref<any[]>([]);
const routingData = ref<any>({});
const extFields = ref<ExtFieldRow[]>([]);
const extFieldsExpanded = ref(['extFields']);
const routerTypeOptions = ref<any[]>([]);
const statusOptions = ref<any[]>([]);
const stepTypeOptions = ref<any[]>([]);
const routerFormRef = ref<ElFormInstance>();

provide('stepTypeOptions', stepTypeOptions);

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
  if (proxy?.$tab?.closeOpenPage) {
    proxy.$tab.closeOpenPage({ path: '/mes/router' });
    return;
  }
  vueRouter.push('/mes/router');
};

const mapExtFieldDefs = (rows: any[] = []) =>
  rows.map((item: any) => ({
    attribute: item.fieldName,
    attributeDesc: item.description,
    fieldType: item.fieldType,
    fieldTypeDesc: item.fieldTypeDesc || item.fieldType,
    required: item.required,
    value: undefined
  }));

const fetchExtFieldDefs = async () => {
  const res = await listExtFieldDef({ tableName: 'ROUTER', pageNum: 1, pageSize: 999 } as any);
  return mapExtFieldDefs(res.rows || []);
};

const fetchOperations = async () => {
  const res = await listAllOperation({ status: 'RELEASABLE' } as any);
  if (res.data?.length) {
    return res.data;
  }
  const fallbackRes = await listAllOperation();
  return fallbackRes.data || [];
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

onMounted(async () => {
  loading.value = true;
  try {
    const [routerTypeRes, statusRes, stepTypeRes, operationList, detailResult] = await Promise.all([
      getDicts('ROUTER_TYPE'),
      getDicts('ROUTER_STATUS'),
      getDicts('ROUTER_OPERATION_TYPE'),
      fetchOperations(),
      id.value ? getRouter(id.value) : fetchExtFieldDefs()
    ]);
    routerTypeOptions.value = routerTypeRes.data || [];
    statusOptions.value = statusRes.data || [];
    stepTypeOptions.value = stepTypeRes.data || [];
    operations.value = operationList;
    if (id.value) {
      Object.assign(form, detailResult.data);
      routingData.value = detailResult.data || {};
      extFields.value = detailResult.data?.extFieldsVOList || [];
    } else {
      extFields.value = detailResult;
    }
  } finally {
    loading.value = false;
    pageReady.value = true;
  }
});
</script>

<style scoped>
.router-edit {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 96px);
  background: #fff;
}

.router-section {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #fff;
}

.router-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
  padding: 0 16px;
  border-bottom: 1px solid #e8e8e8;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.router-base-form {
  padding: 16px 16px 4px 0;
}

.router-base-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.router-base-form :deep(.el-select) {
  width: 100%;
}

.router-actions :deep(.el-button) {
  height: 30px;
  padding: 0 12px;
  border-radius: 4px;
  font-size: 12px;
}

.designer-section .router-section__header {
  background: #fff;
}

.designer-wrap {
  height: clamp(520px, calc(100vh - 280px), 720px);
  min-height: 520px;
  padding: 0;
}

.designer-wrap :deep(.routing-designer) {
  height: 100%;
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
