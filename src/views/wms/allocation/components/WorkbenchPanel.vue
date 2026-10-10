<template>
  <div class="workbench-panel">
    <el-steps :active="stepsActive" finish-status="success" align-center class="workbench-steps">
      <el-step title="确认操作人员" :description="demandUserStepDesc" />
      <el-step title="选择工单与备料" :description="prepStepDesc" />
      <el-step title="仓别分类" description="按已分配库位仓别编码分流" />
      <el-step title="执行任务" description="按任务卡执行扣料或跟进备料/缺料" />
    </el-steps>
    <div v-if="activeStep === 0" class="step-body demand-user-step">
      <el-card shadow="never" class="demand-user-card">
        <div class="workflow-action-bar demand-user-heading">
          <span class="demand-user-icon"
            ><el-icon><UserFilled /></el-icon
          ></span>
          <div>
            <div class="demand-user-title">确认本轮备料操作人员</div>
            <div class="demand-user-desc">操作人员将用于备料计划、领料任务及后续进度跟踪</div>
          </div>
        </div>
        <el-form label-width="96px" class="demand-user-form">
          <el-form-item label="操作人员">
            <el-radio-group v-model="demandUserMode">
              <el-radio-button value="self">本人（{{ currentUserDisplay || '-' }}）</el-radio-button>
              <el-radio-button value="other">其他人员</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="demandUserMode === 'other'" label="其他人员">
            <el-select v-model="otherUserCode" placeholder="请选择其他操作人员" filterable clearable style="width: 320px">
              <el-option v-for="dict in otherUserOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
        </el-form>
        <div class="demand-user-actions">
          <el-button type="primary" class="primary-step-button" @click="confirmDemandUser">
            确认操作人员
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </el-card>
    </div>
    <div v-if="activeStep === 1" class="step-body adaptive-step prep-step">
      <div class="workflow-action-bar">
        <div class="prep-action-summary">
          <el-button link class="back-button" @click="goToDemandUserStep">
            <el-icon><ArrowLeft /></el-icon>
            上一步
          </el-button>
          <span class="prep-action-divider"></span>
          <div>
            <div class="prep-action-title">选择工单并填写备料清单</div>
            <div class="prep-action-desc">
              <template v-if="selectedOrders.length">已选 {{ selectedOrders.length }} 个工单，合并备料 {{ totalPrepLineCount }} 条</template>
              <template v-else>先选择工单，再统一填写备料清单并确认分类</template>
            </div>
          </div>
        </div>
        <div class="prep-action-buttons">
          <el-button :type="selectedOrders.length ? undefined : 'primary'" @click="showOrderDialog = true">
            <el-icon><Plus /></el-icon>
            {{ selectedOrders.length ? '调整工单选择' : '选择工单' }}
          </el-button>
          <el-button v-if="selectedOrders.length" type="primary" plain @click="openMergedPrepBom">填写合并备料清单</el-button>
          <el-button v-if="selectedOrders.length" type="primary" class="primary-workflow-button" :disabled="!canClassify" :loading="classifying" @click="confirmClassify">
            <el-icon><Sort /></el-icon>
            确认备料并分类
          </el-button>
        </div>
      </div>
      <el-table v-if="selectedOrders.length" :data="selectedOrders" border stripe size="small" height="100%" class="prep-order-table">
        <el-table-column label="序号" width="56" align="center">
          <template #default="{ $index }">{{ $index + 1 }}</template>
        </el-table-column>
        <el-table-column prop="workOrderNo" label="工单号" min-width="120" />
        <el-table-column prop="item" label="产品料号" min-width="160" show-overflow-tooltip />
        <el-table-column prop="itemDesc" label="产品描述" min-width="160" show-overflow-tooltip />
        <el-table-column label="计划数量" width="120">
          <template #default="{ row }">{{ row.plannedQty }} {{ row.unit }}</template>
        </el-table-column>
        <el-table-column label="备料清单" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="getLineCount(row) > 0" type="success" size="small">{{ getLineCount(row) }} 种</el-tag>
            <el-tag v-else type="warning" size="small">未勾选</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="plannedStartDate" label="计划开始" width="110" />
        <el-table-column label="排序" width="100" align="center" fixed="right">
          <template #default="{ $index }">
            <el-button type="primary" link size="small" :disabled="$index === 0" @click="moveOrderUp($index)">上移</el-button>
            <el-button type="primary" link size="small" :disabled="$index === selectedOrders.length - 1" @click="moveOrderDown($index)">下移</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link size="small" @click="removeOrder(row.workOrderNo)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else class="prep-empty" description="尚未选择工单">
        <template #description>
          <p>请点击右上方“选择工单”，之后可统一勾选物料、分配库位并进行仓别分类</p>
        </template>
      </el-empty>
    </div>
    <div v-if="activeStep === 2" class="step-body adaptive-step">
      <div class="workflow-action-bar classify-action-bar">
        <div class="prep-action-summary">
          <el-button link class="back-button" @click="backToPrepStep">
            <el-icon><ArrowLeft /></el-icon>
            上一步
          </el-button>
          <span class="prep-action-divider"></span>
          <div>
            <div class="prep-action-title">确认仓别分类结果</div>
            <div class="prep-action-desc">自动仓 {{ autoMaterialRows.length }} 条 · 线边仓 {{ lineMaterialRows.length }} 条 · 平面仓 {{ flatMaterialRows.length }} 条 · 缺料 {{ shortageMaterialRows.length }} 条</div>
          </div>
        </div>
        <div class="prep-action-buttons">
          <el-tag type="info" effect="plain">共 {{ planRowCount }} 条</el-tag>
          <el-button v-if="planRowCount" type="primary" class="primary-workflow-button" :loading="generatingPrep" @click="generateDemandPlan">
            <el-icon><MagicStick /></el-icon>
            生成备料需求
          </el-button>
        </div>
      </div>
      <classified-material-table v-if="isClassified" :rows="classifiedMaterialRows" @adjust="openPrepBomByNo($event.workOrderNo, $event.materialCode)" />
      <el-empty v-else description="请返回上一步完成备料并分类" />
    </div>
    <div v-if="activeStep === 3" class="step-body adaptive-step">
      <div v-if="resultMessage" class="result-alert">
        <el-alert show-icon :title="resultMessage" :type="resultStatus ? 'success' : 'error'" :closable="false">
          <template #icon>
            <Bell />
          </template>
        </el-alert>
      </div>
      <div v-if="currentDemand" class="execution-module">
        <div class="workflow-action-bar execution-overview">
          <span class="execution-section-label"
            ><el-icon><Tickets /></el-icon>需求概览</span
          >
          <div class="plan-meta">
            <span class="plan-meta-item"
              ><span>需求单号</span><strong>{{ currentDemand.demandNo }}</strong></span
            >
            <span class="plan-meta-item"
              ><span>工单数</span><strong>{{ currentDemand.workOrderCount }} 个</strong></span
            >
            <span class="plan-meta-item"
              ><span>缺料行</span><strong>{{ executionShortageCount }} 条</strong></span
            >
            <span class="plan-meta-item"
              ><span>齐套率</span><strong>{{ formatKitRate(currentDemand.kitRate) }}%</strong></span
            >
          </div>
          <div class="execution-header-actions">
            <el-tag v-if="taskExecutionFinished" type="success">本轮任务已提交</el-tag>
            <el-button v-if="currentDemand.issueId && !taskExecutionFinished" type="primary" size="small" @click="goToMaterialIssue">去领料</el-button>
            <el-button type="primary" size="default" class="next-round-button" @click="resetForNextPrepRound">
              <el-icon><RefreshRight /></el-icon>
              开始下一轮备料
            </el-button>
          </div>
        </div>
        <div v-if="hasWarehouse261Tasks && !taskExecutionFinished" class="execution-operation-row">
          <span class="warehouse261-label">261 扣料操作</span>
          <el-button v-if="prep261AutoRows.length" type="success" size="small" :loading="submittingAuto" @click="submitAutoIssue">自动仓 · 261 扣账（{{ prep261AutoRows.length }}条）</el-button>
          <el-button v-if="prep261LineRows.length" type="warning" size="small" :loading="submittingLine" @click="submitLineIssue">线边仓 · 待物料员 261 扣料（{{ prep261LineRows.length }}条）</el-button>
          <el-button v-if="canSubmitCombined261" type="primary" size="small" :loading="submittingCombined" @click="submitCombinedIssue">自动仓+线边仓 · 261 合并扣料（{{ combined261RowCount }}条）</el-button>
        </div>
        <prep-demand-execution-table :rows="prepDisplayRows" />
      </div>
      <el-empty v-else description="请在上一步生成备料需求" />
    </div>
    <work-order-selection-dialog :key="orderSelectionRoundKey" v-model="showOrderDialog" :selected-orders="selectedOrders" :show-bom-action="false" @confirm="handleOrderSelection" />
    <work-order-prep-demand-dialog v-model="showPrepBomDialog" :work-orders="prepBomOrders" :material-issues-by-work-order="prepMaterialIssuesMap" :demand-user-no="materialDemandUserCode" :initial-material-code="prepBomFilterMaterialCode" @save="onBomSave" />
    <issue-process-drawer v-model="issueDrawerVisible" :issue-id="currentIssueId" />
    <target-demand-location-dialog v-model="showTargetLocationDialog" :user-name="materialDemandUserCode" :submitting="generatingPrep" @confirm="onTargetLocationConfirm" />
  </div>
</template>
<script setup lang="ts">
import { ref, computed, getCurrentInstance, toRefs, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, MagicStick, Sort, Bell, RefreshRight, ArrowLeft, ArrowRight, UserFilled, Tickets } from '@element-plus/icons-vue';
import { HttpStatus } from '@/enums/RespEnum';
import WorkOrderSelectionDialog from '@/views/wms/workOrder/components/WorkOrderSelectionDialog.vue';
import WorkOrderPrepDemandDialog from './WorkOrderPrepDemandDialog.vue';
import ClassifiedMaterialTable from './ClassifiedMaterialTable.vue';
import PrepDemandExecutionTable from './PrepDemandExecutionTable.vue';
import IssueProcessDrawer from '@/views/wms/materialIssue/components/IssueProcessDrawer.vue';
import TargetDemandLocationDialog from './TargetDemandLocationDialog.vue';
import type { TargetDemandLocationSelection } from './TargetDemandLocationDialog.vue';
import { useUserStore } from '@/store/modules/user';
import { getPrepDemand } from '@/api/wms/workOrderPrepDemand/index';
import { buildPrepLocationRecIssueOutBoList, isIssuablePrepLocationRecRow, isPrepWarehouse261DisplayRow, prepLocationRecIssueOut } from '@/api/wms/issueTask';
import { generateAllocation, loadWarehouseRouteContext } from '@/api/wms/allocation/index';
import type { AllocationGenerateResult, MaterialDemandDetailRow, WorkOrderVO, WorkOrderMaterialIssueLine, WarehouseRouteContext } from '@/api/wms/allocation/types';
import type { WorkOrderPrepDemandVO, PrepDemandLineItem } from '@/api/wms/workOrderPrepDemand/types';
import { buildPrepDemandItems, isClassifiedShortageRow, findIssueLineForDemandDetail, formatDemandDetailPrepQty, resolvePrepDemandTargetLocationFromItems } from '@/api/wms/allocation/index';
import { classifyWorkOrders, flattenClassifiedMaterials } from '@/api/wms/allocation/index';
import { flattenPrepDemandDisplayRows, type PrepDemandDisplayRow } from '@/api/wms/workOrderPrepDemand/index';

type DemandUserMode = 'self' | 'other';
type ClassifiedMaterialDisplayRow = MaterialDemandDetailRow & {
  materialDesc: string;
  prepQtyText: string;
};

const userStore = useUserStore();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_material_user } = toRefs<any>(proxy?.useDict('wms_material_user'));

const activeStep = ref(0);
const taskExecutionFinished = ref(false);
const resultMessage = ref('');
const resultStatus = ref(false);
const stepsActive = computed(() => (taskExecutionFinished.value ? 4 : activeStep.value));
const demandUserMode = ref<DemandUserMode>('self');
const otherUserCode = ref('');
const isClassified = ref(false);
const selectedOrders = ref<WorkOrderVO[]>([]);
const showOrderDialog = ref(false);
/** 每轮备料使用新的工单选择弹窗实例，避免沿用上一轮查询条件。 */
const orderSelectionRoundKey = ref(0);
const classifying = ref(false);
const materialDemandUserCode = ref('');
const materialDemandUserLabel = ref('');
const submittingAuto = ref(false);
const submittingLine = ref(false);
const submittingCombined = ref(false);
const generatingPrep = ref(false);
const showPrepBomDialog = ref(false);
/** 备料弹窗加载的工单范围：合并填写=全部已选工单；单行调整=对应工单 */
const prepBomOrders = ref<WorkOrderVO[]>([]);
/** 单行调整时按物料编码预过滤 BOM 列表 */
const prepBomFilterMaterialCode = ref('');
const autoWarehouseCodes = ref<string[]>([]);
const lineSideWarehouseCodes = ref<string[]>([]);
const routeCtx = ref<WarehouseRouteContext>({ autoWarehouseCodes: [], lineSideWarehouseCodes: [] });
const prepDisplayRows = ref<PrepDemandDisplayRow[]>([]);
const movementType = ref('261');
const currentDemand = ref<WorkOrderPrepDemandVO | null>(null);
const currentDemandId = ref<number | null>(null);
const issueDrawerVisible = ref(false);
const currentIssueId = ref<number | string | null>(null);
const showTargetLocationDialog = ref(false);

const hasPrepLines = (order: WorkOrderVO) => order.materialIssues?.some((l) => Number(l.issueQty) > 0) ?? false;
/** 分类展示行一次性补齐描述和数量文本，表格与后续任务视图复用，避免模板重复查找。 */
const classifiedMaterialRows = computed<ClassifiedMaterialDisplayRow[]>(() => {
  const orderMap = new Map(selectedOrders.value.map((order) => [order.workOrderNo, order]));
  return flattenClassifiedMaterials(selectedOrders.value).map((row) => {
    const order = orderMap.get(row.workOrderNo);
    const issueLine = order ? findIssueLineForDemandDetail(order, row) : undefined;
    return {
      ...row,
      materialDesc: String(issueLine?.componentDesc ?? ''),
      prepQtyText: formatDemandDetailPrepQty(row, issueLine)
    };
  });
});
const autoMaterialRows = computed(() => classifiedMaterialRows.value.filter((r) => r.warehouseRoute === 'AUTO'));
const lineMaterialRows = computed(() => classifiedMaterialRows.value.filter((r) => r.warehouseRoute === 'LINE'));
const prep261AutoDisplayRows = computed(() => prepDisplayRows.value.filter((r) => isPrepWarehouse261DisplayRow(r, 'AUTO')));
const prep261LineDisplayRows = computed(() => prepDisplayRows.value.filter((r) => isPrepWarehouse261DisplayRow(r, 'LINE')));
const prep261AutoRows = computed(() => prep261AutoDisplayRows.value.filter(isIssuablePrepLocationRecRow));
const prep261LineRows = computed(() => prep261LineDisplayRows.value.filter(isIssuablePrepLocationRecRow));
const executionShortageCount = computed(() => prepDisplayRows.value.filter((row) => row.warehouseRoute === 'SHORTAGE' || row.lineType === 'SHORTAGE').length);
const flatMaterialRows = computed(() => classifiedMaterialRows.value.filter((r) => r.warehouseRoute === 'FLAT'));
const shortageMaterialRows = computed(() => classifiedMaterialRows.value.filter(isClassifiedShortageRow));
const prepLocationHints = computed(() => [...flatMaterialRows.value, ...shortageMaterialRows.value]);
const prepIssueLineHints = computed(() => {
  const lines: Array<import('@/api/wms/allocation/types').WorkOrderMaterialIssueLine & { workOrderNo: string }> = [];
  selectedOrders.value.forEach((order) => {
    order.materialIssues?.forEach((line) => {
      if (Number(line.issueQty) > 0) {
        lines.push({ ...line, workOrderNo: order.workOrderNo });
      }
    });
  });
  return lines;
});
const planRowCount = computed(() => classifiedMaterialRows.value.length);
const canSubmitCombined261 = computed(() => prep261AutoRows.value.length > 0 && prep261LineRows.value.length > 0);
const combined261RowCount = computed(() => prep261AutoRows.value.length + prep261LineRows.value.length);
const hasWarehouse261Tasks = computed(() => prep261AutoRows.value.length > 0 || prep261LineRows.value.length > 0);
const totalPrepLineCount = computed(() => selectedOrders.value.reduce((sum, o) => sum + (o.materialIssues?.filter((l) => Number(l.issueQty) > 0).length ?? 0), 0));
const canClassify = computed(() => selectedOrders.value.length > 0 && selectedOrders.value.every(hasPrepLines));
const hasRemainingClassified = computed(() => autoMaterialRows.value.length + lineMaterialRows.value.length + flatMaterialRows.value.length + shortageMaterialRows.value.length > 0);

const currentUserDisplay = computed(() => userStore.nickname || userStore.name || '');

const materialUserDictList = computed(() => (wms_material_user.value || []) as DictDataOption[]);

const resolveSelfDictOption = (): DictDataOption | undefined => {
  const userName = String(userStore.name || '').trim();
  if (!userName) return undefined;
  return materialUserDictList.value.find((d) => String(d.value) === userName);
};

const otherUserOptions = computed(() => {
  const userName = String(userStore.name || '').trim();
  if (!userName) return materialUserDictList.value;
  return materialUserDictList.value.filter((d) => String(d.value) !== userName);
});

const demandUserStepDesc = computed(() => {
  if (materialDemandUserLabel.value) {
    return `操作人员：${materialDemandUserLabel.value}`;
  }
  return '请选择本人或其他操作人员';
});

const prepStepDesc = computed(() => {
  if (selectedOrders.value.length) {
    return `已选 ${selectedOrders.value.length} 个工单，合并备料 ${totalPrepLineCount.value} 条`;
  }
  return '合并勾选备料清单并分配库位';
});

const prepMaterialIssuesMap = computed(() => {
  const map: Record<string, WorkOrderMaterialIssueLine[]> = {};
  selectedOrders.value.forEach((order) => {
    if (order.materialIssues?.length) {
      map[order.workOrderNo] = order.materialIssues;
    }
  });
  return map;
});

const applyDemandUserSelection = (): boolean => {
  if (demandUserMode.value === 'self') {
    const userName = String(userStore.name || '').trim();
    if (!userName) return false;
    materialDemandUserCode.value = userName;
    const self = resolveSelfDictOption();
    materialDemandUserLabel.value = self?.label || userStore.nickname || userName;
    return true;
  }
  const code = String(otherUserCode.value || '').trim();
  if (!code) return false;
  const hit = materialUserDictList.value.find((d) => String(d.value) === code);
  materialDemandUserCode.value = code;
  materialDemandUserLabel.value = hit?.label || code;
  return true;
};

const confirmDemandUser = () => {
  if (!applyDemandUserSelection()) {
    ElMessage.warning(demandUserMode.value === 'other' ? '请选择其他操作人员' : '无法获取登录工号（userName）');
    return;
  }
  activeStep.value = 1;
};

const goToDemandUserStep = () => {
  if (demandUserMode.value === 'other' && materialDemandUserCode.value) {
    otherUserCode.value = materialDemandUserCode.value;
  }
  activeStep.value = 0;
};

const getOrderIssues = (wn: string) => selectedOrders.value.find((o) => o.workOrderNo === wn)?.materialIssues;
const getLineCount = (row: WorkOrderVO) => row.materialIssues?.filter((l) => l.issueQty > 0).length ?? 0;
const formatKitRate = (rate?: number) => {
  const n = Number(rate ?? 0);
  return (n > 1 ? n : n * 100).toFixed(1);
};

const clearMaterialRoutes = (lines: WorkOrderMaterialIssueLine[]) => lines.map((l) => ({ ...l, warehouseRoute: undefined, recommendedWarehouse: undefined }));

const resetClassifyState = () => {
  autoWarehouseCodes.value = [];
  lineSideWarehouseCodes.value = [];
};

const onBomSave = (payload: { workOrderNo?: string; materialIssues?: WorkOrderMaterialIssueLine[]; batch?: Array<{ workOrderNo: string; materialIssues: WorkOrderMaterialIssueLine[] }> }) => {
  const updates = payload.batch ?? (payload.workOrderNo && payload.materialIssues ? [{ workOrderNo: payload.workOrderNo, materialIssues: payload.materialIssues }] : []);
  if (!updates.length) return;

  const updateMap = new Map(updates.map((item) => [item.workOrderNo, item.materialIssues]));
  selectedOrders.value = selectedOrders.value.map((o) => {
    const issues = updateMap.get(o.workOrderNo);
    if (!issues) return o;
    return {
      ...o,
      materialIssues: clearMaterialRoutes(issues),
      materialDemandDetails: [],
      warehouseRoute: undefined,
      recommendedWarehouses: []
    };
  });
  isClassified.value = false;
  if (activeStep.value > 1) activeStep.value = 1;
  resetClassifyState();
};

const handleOrderSelection = (orders: WorkOrderVO[]) => {
  showOrderDialog.value = false;
  selectedOrders.value = orders.map((o) => ({ ...o, warehouseRoute: undefined, materialDemandDetails: [] }));
  isClassified.value = false;
  if (activeStep.value < 1) activeStep.value = 1;
  resetClassifyState();
  if (!orders.length) currentDemand.value = null;
};

const confirmClassify = async () => {
  if (!materialDemandUserCode.value) {
    ElMessage.warning('请先确认操作人员');
    activeStep.value = 0;
    return;
  }
  if (!canClassify.value) {
    const missing = selectedOrders.value.filter((o) => !hasPrepLines(o)).map((o) => o.workOrderNo);
    ElMessage.warning(missing.length ? `请为工单 ${missing.join('、')} 勾选备料清单` : '请先选择工单');
    return;
  }
  classifying.value = true;
  try {
    const result = await classifyWorkOrders(selectedOrders.value);
    selectedOrders.value = result.orders;
    autoWarehouseCodes.value = result.autoWarehouseCodes;
    lineSideWarehouseCodes.value = result.lineSideWarehouseCodes;
    isClassified.value = true;
    activeStep.value = 2;
    ElMessage.success(`已按库位拆分：自动仓 ${autoMaterialRows.value.length} 条，线边仓 ${lineMaterialRows.value.length} 条，平面仓 ${flatMaterialRows.value.length} 条，缺料 ${shortageMaterialRows.value.length} 条`);
  } catch {
    ElMessage.error('物料仓别分类失败');
  } finally {
    classifying.value = false;
  }
};

const backToPrepStep = () => {
  activeStep.value = 1;
  isClassified.value = false;
  selectedOrders.value = selectedOrders.value.map((o) => ({
    ...o,
    warehouseRoute: undefined,
    recommendedWarehouses: [],
    materialIssues: clearMaterialRoutes(o.materialIssues || []),
    materialDemandDetails: []
  }));
  resetClassifyState();
};

const removeOrder = (workOrderNo: string) => {
  selectedOrders.value = selectedOrders.value.filter((o) => o.workOrderNo !== workOrderNo);
  if (!selectedOrders.value.length) {
    isClassified.value = false;
    activeStep.value = 1;
  }
};
const openMergedPrepBom = () => {
  if (!selectedOrders.value.length) {
    ElMessage.warning('请先选择工单');
    return;
  }
  if (!materialDemandUserCode.value) {
    ElMessage.warning('请先确认操作人员');
    activeStep.value = 0;
    return;
  }
  prepBomOrders.value = selectedOrders.value;
  prepBomFilterMaterialCode.value = '';
  showPrepBomDialog.value = true;
};

/** 调整单行：仅加载对应工单 BOM，并按物料编码过滤到对应行 */
const openPrepBomByNo = (workOrderNo: string, materialCode?: string) => {
  const order = selectedOrders.value.find((o) => o.workOrderNo === workOrderNo);
  if (!order) return;
  if (!materialDemandUserCode.value) {
    ElMessage.warning('请先确认操作人员');
    activeStep.value = 0;
    return;
  }
  prepBomOrders.value = [order];
  prepBomFilterMaterialCode.value = String(materialCode || '').trim();
  showPrepBomDialog.value = true;
};

const moveOrderUp = (index: number) => {
  if (index <= 0) return;
  const list = [...selectedOrders.value];
  [list[index - 1], list[index]] = [list[index], list[index - 1]];
  selectedOrders.value = list;
  isClassified.value = false;
  resetClassifyState();
};

const moveOrderDown = (index: number) => {
  if (index >= selectedOrders.value.length - 1) return;
  const list = [...selectedOrders.value];
  [list[index], list[index + 1]] = [list[index + 1], list[index]];
  selectedOrders.value = list;
  isClassified.value = false;
  resetClassifyState();
};

const removeClassifiedByRoute = (route: MaterialDemandDetailRow['warehouseRoute']) => {
  removeClassifiedByRoutes(route ? [route] : []);
};

const removeClassifiedByRoutes = (routes: Array<MaterialDemandDetailRow['warehouseRoute']>) => {
  const routeSet = new Set(routes.filter(Boolean));
  selectedOrders.value = selectedOrders.value
    .map((order) => {
      const materialDemandDetails = (order.materialDemandDetails || []).filter((line) => {
        if (line.lineType === 'SHORTAGE') return !routeSet.has('SHORTAGE');
        return !routeSet.has(line.warehouseRoute);
      });
      if (!materialDemandDetails.length) return null;
      return { ...order, materialDemandDetails, warehouseRoute: undefined, recommendedWarehouses: [] };
    })
    .filter((order) => order !== null) as WorkOrderVO[];
  isClassified.value = hasRemainingClassified.value;
};

type PrepDemand261Route = 'AUTO' | 'LINE';

const reloadPrepDisplayRows = () => {
  if (!currentDemand.value) {
    prepDisplayRows.value = [];
    return;
  }
  prepDisplayRows.value = flattenPrepDemandDisplayRows(currentDemand.value, routeCtx.value, prepLocationHints.value, prepIssueLineHints.value);
};

onMounted(async () => {
  routeCtx.value = await loadWarehouseRouteContext();
});

watch(currentDemand, () => reloadPrepDisplayRows(), { immediate: true });

const isConfirmCancelled = (error: unknown) => error === 'cancel' || (error as Error)?.message === 'cancel';

const checkTaskStepCompletion = () => {
  if (activeStep.value === 3 && currentDemand.value && !hasWarehouse261Tasks.value) {
    taskExecutionFinished.value = true;
  }
};

watch([activeStep, hasWarehouse261Tasks, currentDemand], () => checkTaskStepCompletion(), { immediate: true });

const resetForNextPrepRound = () => {
  showOrderDialog.value = false;
  orderSelectionRoundKey.value += 1;
  selectedOrders.value = [];
  currentDemand.value = null;
  currentDemandId.value = null;
  prepDisplayRows.value = [];
  isClassified.value = false;
  taskExecutionFinished.value = false;
  resultMessage.value = '';
  resultStatus.value = false;
  resetClassifyState();
  activeStep.value = 0;
};

const submitPrep261Issue = async (routeLabel: string, routes: PrepDemand261Route[]) => {
  if (!currentDemand.value?.id) {
    resultStatus.value = false;
    resultMessage.value = '请先生成备料需求';
    return;
  }
  resultStatus.value = true;
  resultMessage.value = '';
  const issueOutBoList = buildPrepLocationRecIssueOutBoList(prepDisplayRows.value, routes, { demandId: currentDemand.value.id, demandNo: currentDemand.value.demandNo });
  if (!issueOutBoList.length) {
    resultStatus.value = false;
    resultMessage.value = `没有可扣料的${routeLabel}需求`;
    return;
  }
  try {
    await ElMessageBox.confirm(`将对 ${issueOutBoList.length} 条${routeLabel}库位需求执行 ${movementType.value} 扣料，是否继续？`, `确认 ${movementType.value} 扣料`, { type: 'warning' });
    const res = await prepLocationRecIssueOut({ issueOutBoList });
    if (res.code !== HttpStatus.SUCCESS) {
      resultStatus.value = false;
      resultMessage.value = res.msg || `${movementType.value} 扣料失败`;
      return;
    }
    resultStatus.value = true;
    resultMessage.value = res.msg || `${movementType.value} 扣料成功`;
    await reloadDemandDetail();
    removeClassifiedByRoutes(routes);
    checkTaskStepCompletion();
  } catch (error) {
    if (!isConfirmCancelled(error)) {
      resultStatus.value = false;
      resultMessage.value = (error as Error)?.message || `${movementType.value} 扣料失败`;
    }
  }
};

const submitAutoIssue = async () => {
  submittingAuto.value = true;
  try {
    await submitPrep261Issue('自动仓', ['AUTO']);
  } catch {
    /* cancelled */
  } finally {
    submittingAuto.value = false;
  }
};

const submitLineIssue = async () => {
  submittingLine.value = true;
  try {
    await submitPrep261Issue('线边仓', ['LINE']);
  } catch {
    /* cancelled */
  } finally {
    submittingLine.value = false;
  }
};

const submitCombinedIssue = async () => {
  if (!currentDemand.value?.id) {
    resultStatus.value = false;
    resultMessage.value = '请先生成备料需求';
    return;
  }
  resultStatus.value = true;
  resultMessage.value = '';
  const issueOutBoList = buildPrepLocationRecIssueOutBoList(prepDisplayRows.value, ['AUTO', 'LINE'], { demandId: currentDemand.value.id, demandNo: currentDemand.value.demandNo });
  if (!issueOutBoList.length) {
    resultStatus.value = false;
    resultMessage.value = '没有可扣料的自动仓或线边仓需求';
    return;
  }
  submittingCombined.value = true;
  try {
    await ElMessageBox.confirm(`将对 ${issueOutBoList.length} 条自动仓+线边仓需求合并执行 ${movementType.value} 扣料，是否继续？`, `确认 ${movementType.value} 扣料`, { type: 'warning' });
    const res = await prepLocationRecIssueOut({ issueOutBoList });
    if (res.code !== HttpStatus.SUCCESS) {
      resultStatus.value = false;
      resultMessage.value = res.msg || `${movementType.value} 扣料失败`;
      return;
    }
    resultStatus.value = true;
    resultMessage.value = res.msg || `${movementType.value} 扣料成功`;
    await reloadDemandDetail();
    removeClassifiedByRoutes(['AUTO', 'LINE']);
    checkTaskStepCompletion();
  } catch (error) {
    if (!isConfirmCancelled(error)) {
      resultStatus.value = false;
      resultMessage.value = (error as Error)?.message || `${movementType.value} 扣料失败`;
    }
  } finally {
    submittingCombined.value = false;
  }
};

const loadDemandDetail = async (demandId: number) => {
  currentDemandId.value = demandId;
  const response = await getPrepDemand(demandId);
  if (response.code === 200 && response.data) {
    currentDemand.value = response.data;
    currentIssueId.value = response.data.issueId ?? null;
    reloadPrepDisplayRows();
  }
};

const reloadDemandDetail = async () => {
  if (currentDemandId.value) await loadDemandDetail(currentDemandId.value);
};

const applyTargetDemandLocationToAllRows = (selection: TargetDemandLocationSelection) => {
  const locationCode = String(selection.locationCode || '').trim();
  const warehouseCode = String(selection.warehouseCode || '').trim() || undefined;
  selectedOrders.value = selectedOrders.value.map((order) => ({
    ...order,
    materialDemandDetails: (order.materialDemandDetails || []).map((line) => ({
      ...line,
      targetDemandLocationCode: locationCode,
      targetDemandWarehouseCode: warehouseCode
    }))
  }));
};

const generatePrepPlan = async (prepItems: PrepDemandLineItem[], emptyHint: string) => {
  if (!prepItems.length) {
    ElMessage.warning(emptyHint);
    return;
  }
  const workOrderNos = [...new Set(prepItems.map((i) => i.workOrderNo))];
  const targetDemand = resolvePrepDemandTargetLocationFromItems(prepItems);
  const response = await generateAllocation({
    workOrderNos,
    prepItems,
    isEmergency: false,
    materialUserCode: materialDemandUserCode.value || undefined,
    materialUserName: materialDemandUserLabel.value || undefined,
    targetDemandLocationCode: targetDemand.targetDemandLocationCode,
    targetDemandWarehouseCode: targetDemand.targetDemandWarehouseCode
  });
  if (response.code !== 200) {
    ElMessage.error(response.msg || '生成需求失败');
    return;
  }
  const result = response.data as AllocationGenerateResult | undefined;
  if (result?.success === false) {
    ElMessage.error(result.message || '生成需求失败');
    return;
  }
  if (!result?.demand?.id) {
    ElMessage.warning('未生成需求');
    return;
  }
  ElMessage.success('备料需求已生成');
  taskExecutionFinished.value = false;
  resultMessage.value = '';
  resultStatus.value = false;
  await loadDemandDetail(result.demand.id);
  activeStep.value = 3;
};

const executeGenerateDemandPlan = async () => {
  generatingPrep.value = true;
  try {
    await generatePrepPlan(buildPrepDemandItems(selectedOrders.value), '没有备料需求');
  } catch {
    ElMessage.error('生成备料需求失败');
  } finally {
    generatingPrep.value = false;
  }
};

const generateDemandPlan = async () => {
  if (!planRowCount.value) {
    ElMessage.warning('没有备料需求');
    return;
  }
  showTargetLocationDialog.value = true;
};

const onTargetLocationConfirm = async (selection: TargetDemandLocationSelection) => {
  applyTargetDemandLocationToAllRows(selection);
  showTargetLocationDialog.value = false;
  await executeGenerateDemandPlan();
};

const goToMaterialIssue = () => {
  if (currentDemand.value?.issueId) {
    currentIssueId.value = currentDemand.value.issueId;
    issueDrawerVisible.value = true;
  } else ElMessage.info('暂未关联发料单');
};
</script>
<style scoped>
.workbench-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
}
.workbench-steps {
  flex-shrink: 0;
  margin: 4px 0 10px;
}
.step-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.adaptive-step {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.adaptive-step :deep(.classified-material-table),
.execution-module :deep(.execution-material-table) {
  flex: 1;
  min-height: 0;
}
.prep-step {
  gap: 10px;
}
.workflow-action-bar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--el-fill-color-blank) 0%, var(--el-color-primary-light-9) 100%);
}
.prep-action-summary,
.prep-action-buttons {
  display: flex;
  align-items: center;
}
.prep-action-summary {
  min-width: 0;
  gap: 12px;
}
.prep-action-buttons {
  flex-shrink: 0;
  gap: 8px;
}
.back-button {
  flex-shrink: 0;
  padding: 0;
}
.prep-action-divider {
  width: 1px;
  height: 32px;
  flex-shrink: 0;
  background: var(--el-border-color);
}
.prep-action-title {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
}
.prep-action-desc {
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.prep-order-table {
  flex: 1;
  min-height: 0;
}
.prep-empty {
  flex: 1;
  min-height: 0;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
}
.prep-empty p {
  margin: 0;
  color: var(--el-text-color-secondary);
}
.demand-user-step {
  width: min(760px, 100%);
  margin: 0 auto;
}
.demand-user-card {
  overflow: hidden;
  border-radius: 8px;
}
.demand-user-card :deep(> .el-card__body) {
  padding: 0;
}
.demand-user-heading {
  justify-content: flex-start;
  border: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  border-radius: 0;
}
.demand-user-icon {
  display: inline-flex;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: var(--el-color-primary);
  font-size: 20px;
  background: var(--el-color-primary-light-8);
}
.demand-user-title {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
}
.demand-user-desc {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}
.demand-user-form {
  padding: 24px 28px 8px;
}
.demand-user-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0 28px 24px;
}
.primary-workflow-button,
.primary-step-button {
  border: 0;
  font-weight: 600;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, #6b8cff 100%);
  box-shadow: 0 3px 10px rgb(64 158 255 / 22%);
}
.primary-step-button {
  min-width: 156px;
}
.execution-module {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.execution-overview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.execution-section-label {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 600;
}
.plan-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 20px;
}
.plan-meta-item {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;
}
.plan-meta-item > span {
  color: var(--el-text-color-secondary);
}
.plan-meta-item > strong {
  color: var(--el-text-color-primary);
  font-weight: 600;
}
.execution-header-actions,
.execution-operation-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.next-round-button {
  min-width: 148px;
  height: 34px;
  padding: 0 18px;
  border: 0;
  border-radius: 17px;
  font-weight: 600;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, #6b8cff 100%);
  box-shadow: 0 4px 12px rgb(64 158 255 / 28%);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}
.next-round-button:hover,
.next-round-button:focus {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgb(64 158 255 / 36%);
}
.next-round-button:active {
  transform: translateY(0);
}
.execution-operation-row {
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.warehouse261-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-right: 4px;
}
.result-alert {
  margin-bottom: 4px;
}
.result-alert :deep(.el-alert) {
  padding: 6px 10px;
}
@media (max-width: 1200px) {
  .workflow-action-bar {
    align-items: flex-start;
    flex-direction: column;
  }
  .demand-user-heading {
    align-items: center;
    flex-direction: row;
  }
  .prep-action-buttons {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
