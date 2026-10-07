<template>
  <div v-loading="loading" class="route-change-page">
    <div class="action-bar">
      <el-button icon="ArrowLeft" :disabled="saving" @click="goBack">返回</el-button>
      <el-button type="primary" icon="Check" :loading="saving" :disabled="!ready || loading || stepsLoading || !selectedRouter" @click="save">保存</el-button>
      <span v-if="context" class="order-label">工单：{{ context.shopOrder }}</span>
    </div>
    <el-alert v-if="loadFailed" title="工单工序信息加载失败，请重新加载后操作" type="error" show-icon :closable="false">
      <el-button type="primary" link @click="loadData">重新加载</el-button>
    </el-alert>
    <el-card v-else shadow="never">
      <template #header><div class="section-title">工单工序信息</div></template>
      <el-form label-width="150px" :disabled="saving">
        <el-row :gutter="40">
          <el-col :xs="24" :lg="12">
            <el-form-item label="当前工艺路线"><el-input :model-value="context?.plannedRouter" disabled /></el-form-item>
            <el-form-item label="当前工艺路线版本"><el-input :model-value="context?.plannedRouterRevision" disabled /></el-form-item>
          </el-col>
          <el-col :xs="24" :lg="12">
            <el-form-item label="新工艺路线" required>
              <el-input :model-value="selectedRouter?.router" readonly placeholder="请选择新的计划工艺路线">
                <template #append><el-button icon="Search" :disabled="!ready || saving || stepsLoading" @click="openPicker" /></template>
              </el-input>
            </el-form-item>
            <el-form-item label="新工艺路线版本"><el-input :model-value="selectedRouter?.revision" disabled /></el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <el-table v-loading="stepsLoading" :data="rows" :row-key="rowKey" border max-height="560">
        <el-table-column label="步骤ID" prop="stepId" width="100" align="center" />
        <el-table-column label="工序" prop="operation" min-width="140" />
        <el-table-column label="工序描述" prop="operationDescription" min-width="160" show-overflow-tooltip />
        <el-table-column label="工艺路线版本" min-width="180" align="center"
          ><template #default="{ row }">{{ row.router }}/{{ row.routerRevision }}</template></el-table-column
        >
        <el-table-column label="排队中数量" prop="qtyInQueue" width="120" align="center" />
        <el-table-column label="在制数量" prop="qtyInWork" width="110" align="center" />
        <el-table-column label="已完成数量" prop="qtyCompleted" width="120" align="center" />
        <el-table-column label="新排队工序" min-width="260">
          <template #default="{ row }">
            <el-select v-model="row.newStepId" filterable clearable class="w-full" :disabled="saving || stepsLoading || !selectedRouter || !hasLiveQty(row)" :placeholder="hasLiveQty(row) ? '请选择新排队工序' : '无排队或在制数量'">
              <el-option v-for="step in newSteps" :key="step.stepId" :value="step.stepId" :label="`${step.stepId} · ${step.operation}${step.operationDescription ? ' — ' + step.operationDescription : ''}`" />
            </el-select>
          </template>
        </el-table-column>
      </el-table>
      <p class="mapping-tip">排队或在制数量大于 0 的工序必须选择新排队工序；保存会同步切换工单及所属条码的工艺路线。</p>
    </el-card>

    <el-dialog v-model="pickerVisible" title="选择新工艺路线" width="850px" append-to-body :close-on-click-modal="false">
      <el-input v-model="search" clearable prefix-icon="Search" placeholder="搜索工艺路线、版本或描述" class="mb-3" @input="pickerPage = 1" />
      <el-table :data="pickerRows" border highlight-current-row height="360" @current-change="pickerSelection = $event" @row-dblclick="chooseRouter">
        <el-table-column label="工艺路线" prop="router" min-width="160" />
        <el-table-column label="版本" prop="revision" width="100" />
        <el-table-column label="描述" prop="description" min-width="240" show-overflow-tooltip />
      </el-table>
      <pagination :total="filteredRouters.length" v-model:page="pickerPage" v-model:limit="pickerSize" />
      <template #footer><el-button @click="pickerVisible = false">取消</el-button><el-button type="primary" :disabled="!pickerSelection" @click="chooseRouter(pickerSelection)">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="ShopOrderChangeRouter" lang="ts">
import { changeShopOrderRouter, getShopOrderRouterChange, listShopOrderRouterOptions, listShopOrderRouterSteps } from '@/api/mes/shopOrder';
import type { ImmediateOperationVO, ShopOrderRouterChangeVO } from '@/api/mes/shopOrder/types';
import type { RouterVO } from '@/api/mes/router/types';

type MappingRow = ImmediateOperationVO & { newStepId?: string };
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const ready = ref(false);
const loadFailed = ref(false);
const stepsLoading = ref(false);
const context = ref<ShopOrderRouterChangeVO>();
const rows = ref<MappingRow[]>([]);
const routeOptions = ref<RouterVO[]>([]);
const selectedRouter = ref<RouterVO>();
const newSteps = ref<ImmediateOperationVO[]>([]);
const pickerVisible = ref(false);
const pickerSelection = ref<RouterVO>();
const search = ref('');
const pickerPage = ref(1);
const pickerSize = ref(10);
const filteredRouters = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return routeOptions.value.filter((item) => item.handle !== context.value?.plannedRouterBo && (!keyword || `${item.router} ${item.revision} ${item.description || ''}`.toLowerCase().includes(keyword)));
});
const pickerRows = computed(() => filteredRouters.value.slice((pickerPage.value - 1) * pickerSize.value, pickerPage.value * pickerSize.value));
const rowKey = (row: MappingRow) => JSON.stringify([row.routerBo, row.stepId, row.operationBo]);
const hasLiveQty = (row: ImmediateOperationVO) => Number(row.qtyInQueue || 0) > 0 || Number(row.qtyInWork || 0) > 0;

const loadData = async () => {
  loading.value = true;
  ready.value = false;
  loadFailed.value = false;
  try {
    const [detail, options] = await Promise.all([getShopOrderRouterChange(route.params.id as string), listShopOrderRouterOptions()]);
    context.value = detail.data;
    rows.value = (detail.data.operations || []).map((row) => ({ ...row, newStepId: undefined }));
    routeOptions.value = options.data || [];
    selectedRouter.value = undefined;
    newSteps.value = [];
    ready.value = true;
  } catch {
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
};

const openPicker = () => {
  pickerSelection.value = undefined;
  search.value = '';
  pickerPage.value = 1;
  pickerVisible.value = true;
};

const chooseRouter = async (choice?: RouterVO) => {
  if (!choice || saving.value || stepsLoading.value) return;
  pickerVisible.value = false;
  if (choice.handle === selectedRouter.value?.handle) return;
  selectedRouter.value = undefined;
  newSteps.value = [];
  rows.value.forEach((row) => {
    row.newStepId = undefined;
  });
  stepsLoading.value = true;
  try {
    const response = await listShopOrderRouterSteps(choice.handle);
    newSteps.value = response.data || [];
    selectedRouter.value = choice;
  } finally {
    stepsLoading.value = false;
  }
};

const save = async () => {
  if (!ready.value || !context.value || !selectedRouter.value || saving.value || stepsLoading.value) return;
  const missing = rows.value.find((row) => hasLiveQty(row) && !newSteps.value.some((step) => step.stepId === row.newStepId));
  if (missing) {
    proxy?.$modal.msgWarning(`原工序 ${missing.stepId} / ${missing.operation} 未选择新的排队工序`);
    return;
  }
  saving.value = true;
  try {
    await proxy?.$modal.confirm(`确认将工单 ${context.value.shopOrder} 的工艺路线切换为 ${selectedRouter.value.router}/${selectedRouter.value.revision}？`);
    await changeShopOrderRouter({
      id: context.value.id,
      plannedRouterBo: context.value.plannedRouterBo,
      newPlannedRouterBo: selectedRouter.value.handle,
      operationMappingList: rows.value.map((row) => ({ routerBo: row.routerBo, stepId: row.stepId, operationBo: row.operationBo, newStepId: row.newStepId }))
    });
    proxy?.$modal.msgSuccess('工艺路线修改成功');
    if (proxy?.$tab) proxy.$tab.closeOpenPage({ path: '/mes/shopOrder' });
    else await router.push('/mes/shopOrder');
  } catch {
    // 取消确认或接口错误时保留映射，接口错误由请求拦截器提示。
  } finally {
    saving.value = false;
  }
};

const goBack = () => {
  if (proxy?.$tab) proxy.$tab.closeOpenPage({ path: '/mes/shopOrder' });
  else router.push('/mes/shopOrder');
};
onMounted(loadData);
</script>

<style scoped lang="scss">
.route-change-page {
  padding: 12px;
  background: #f3f4f7;
  min-height: calc(100vh - 84px);
}
.action-bar {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  margin-bottom: 10px;
  background: #fff;
}
.order-label {
  margin-left: 20px;
  color: #606266;
}
.section-title {
  border-left: 4px solid #315eb5;
  padding-left: 10px;
  font-size: 17px;
  font-weight: 600;
  color: #244a90;
}
.mapping-tip {
  font-size: 13px;
  color: #909399;
  margin-bottom: 0;
}
:deep(.el-table th.el-table__cell) {
  background: #f1f4fa;
  color: #303133;
}
</style>
