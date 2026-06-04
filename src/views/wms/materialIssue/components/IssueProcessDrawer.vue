<template>
  <el-drawer v-model="visible" :title="drawerTitle" size="72%" destroy-on-close @close="handleClose">
    <div v-loading="loading" class="issue-drawer">
      <template v-if="detail">
        <div class="issue-summary">
          <div class="summary-main">
            <span class="issue-no">{{ detail.issue.issueNo }}</span>
            <el-tag :type="statusTag(detail.issue.issueStatus)" effect="dark" size="small">
              {{ statusLabel(detail.issue.issueStatus) }}
            </el-tag>
            <el-tag v-if="detail.issue.issueType === 'EMERGENCY'" type="danger" size="small">紧急</el-tag>
          </div>
          <div class="summary-meta">
            <span>工单：{{ detail.issue.workOrderNo }}</span>
            <span v-if="detail.progress">进度：{{ detail.progress.issuedLines }} / {{ detail.progress.totalLines }} 行</span>
          </div>
          <el-progress
            v-if="detail.progress && detail.progress.totalLines > 0"
            :percentage="Math.round((detail.progress.issuedLines / detail.progress.totalLines) * 100)"
            :status="detail.issue.issueStatus === 'COMPLETED' ? 'success' : undefined"
            :stroke-width="8"
            class="progress-bar"
          />
        </div>

        <el-steps :active="currentStep" finish-status="success" align-center class="issue-steps">
          <el-step title="登记领料人" />
          <el-step title="确认发料" />
          <el-step title="完成" />
        </el-steps>

        <div v-show="currentStep === 0" class="step-panel">
          <el-alert
            v-if="detail.issue.issueStatus === 'PENDING'"
            type="info"
            :closable="false"
            show-icon
            title="请先登记领料人，再开始发料作业"
            class="mb-3"
          />
          <el-form :model="receiverForm" label-width="88px" class="receiver-form">
            <el-form-item label="领料人" required>
              <el-input v-model="receiverForm.receiverName" placeholder="领料人姓名" />
            </el-form-item>
            <el-form-item label="领料部门">
              <el-input v-model="receiverForm.receiverDept" placeholder="部门（选填）" />
            </el-form-item>
          </el-form>
        </div>

        <div v-show="currentStep === 1" class="step-panel">
          <div class="toolbar">
            <el-button type="primary" size="small" :disabled="!canOperate" @click="fillAllQty">按需求数量填充</el-button>
            <el-button type="success" size="small" :disabled="pendingCount === 0 || !canOperate" @click="confirmAllPending">
              确认全部待发 ({{ pendingCount }})
            </el-button>
          </div>
          <el-table
            :data="detail.details"
            border
            size="small"
            max-height="calc(100vh - 340px)"
            @selection-change="onSelectionChange"
          >
            <el-table-column type="selection" width="42" :selectable="rowSelectable" />
            <el-table-column prop="materialCode" label="物料" min-width="120" show-overflow-tooltip />
            <el-table-column prop="batchCode" label="批次" width="110" />
            <el-table-column prop="locationCode" label="库位" width="90" />
            <el-table-column label="需求" width="90" align="right">
              <template #default="{ row }">{{ formatQty(row.requiredQuantity) }}</template>
            </el-table-column>
            <el-table-column label="实发" width="120" align="center">
              <template #default="{ row }">
                <el-input-number
                  v-if="row.issueStatus === 'PENDING' && canOperate"
                  v-model="row._editQty"
                  :min="0"
                  :max="Number(row.requiredQuantity)"
                  :precision="3"
                  size="small"
                  controls-position="right"
                  class="qty-input"
                />
                <span v-else class="issued-qty">{{ formatQty(row.issuedQuantity) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="72" align="center">
              <template #default="{ row }">
                <el-tag :type="row.issueStatus === 'ISSUED' ? 'success' : 'info'" size="small">
                  {{ row.issueStatus === 'ISSUED' ? '已发' : '待发' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-show="currentStep === 2" class="step-panel step-done">
          <el-result
            v-if="detail.issue.issueStatus === 'COMPLETED'"
            icon="success"
            title="发料已完成"
            :sub-title="`发料单 ${detail.issue.issueNo} 已结案`"
          />
          <el-result
            v-else-if="canComplete"
            icon="warning"
            title="确认完成发料"
            sub-title="所有明细已确认后，点击完成将回写 BOM 并记录库存移动"
          >
            <template #extra>
              <el-checkbox v-model="allowShortIssue">允许短装完成</el-checkbox>
            </template>
          </el-result>
          <el-result v-else icon="info" title="请先完成发料明细确认" />
        </div>
      </template>

      <el-empty v-else-if="!loading" description="未加载发料单数据" />
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleClose">关闭</el-button>
        <template v-if="detail && !isTerminal">
          <el-button v-if="currentStep > 0" @click="currentStep--">上一步</el-button>
          <el-button v-if="currentStep === 0" type="primary" :loading="saving" @click="saveAndNext">保存并继续</el-button>
          <el-button
            v-else-if="currentStep === 1"
            type="primary"
            :disabled="selectedRows.length === 0"
            :loading="confirming"
            @click="confirmSelected"
          >
            确认选中 ({{ selectedRows.length }})
          </el-button>
          <el-button v-if="currentStep === 1 && allIssued" type="primary" @click="currentStep = 2">下一步</el-button>
          <el-button v-if="currentStep === 2 && canComplete" type="warning" :loading="completing" @click="doComplete">
            完成发料
          </el-button>
          <el-button v-if="canCancel" type="danger" plain @click="handleCancel">取消发料单</el-button>
        </template>
        <el-button v-if="isCompleted" type="primary" @click="handleSyncSap">同步 SAP</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/store/modules/user';
import {
  getMaterialIssueDetail,
  assignMaterialIssueReceiver,
  startMaterialIssue,
  confirmMaterialIssueDetails,
  completeMaterialIssue,
  cancelMaterialIssue,
  syncMaterialIssueSap
} from '@/api/wms/materialIssue';
import type { MaterialIssueWithDetailsVO, MaterialIssueDetailLineVO } from '@/api/wms/materialIssue/types';

type DetailRow = MaterialIssueDetailLineVO & { _editQty?: number };

const props = defineProps<{
  modelValue: boolean;
  issueId?: number | string | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [boolean];
  success: [];
}>();

const userStore = useUserStore();
const visible = ref(false);
const loading = ref(false);
const saving = ref(false);
const confirming = ref(false);
const completing = ref(false);
const currentStep = ref(0);
const allowShortIssue = ref(false);
const detail = ref<MaterialIssueWithDetailsVO | null>(null);
const selectedRows = ref<DetailRow[]>([]);

const receiverForm = reactive({
  receiverName: '',
  receiverDept: ''
});

const drawerTitle = computed(() => (detail.value ? `工单领料 · ${detail.value.issue.issueNo}` : '工单领料'));

const isTerminal = computed(() => ['COMPLETED', 'CANCELLED'].includes(detail.value?.issue.issueStatus || ''));
const isCompleted = computed(() => detail.value?.issue.issueStatus === 'COMPLETED');
const canOperate = computed(() => ['PENDING', 'ISSUING'].includes(detail.value?.issue.issueStatus || ''));
const canComplete = computed(() => detail.value?.issue.issueStatus === 'ISSUING');
const canCancel = computed(() => ['PENDING', 'ISSUING'].includes(detail.value?.issue.issueStatus || ''));

const pendingCount = computed(() => detail.value?.details.filter((d) => d.issueStatus === 'PENDING').length ?? 0);
const allIssued = computed(() => detail.value != null && detail.value.details.length > 0 && pendingCount.value === 0);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val && props.issueId) {
      currentStep.value = 0;
      loadDetail();
    }
  }
);

watch(visible, (val) => emit('update:modelValue', val));

watch(
  () => props.issueId,
  (id) => {
    if (visible.value && id) {
      currentStep.value = 0;
      loadDetail();
    }
  }
);

function formatQty(v: unknown) {
  if (v == null) return '0';
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: 3 });
}

const statusLabel = (s: string) => {
  const m: Record<string, string> = { PENDING: '待发料', ISSUING: '发料中', COMPLETED: '已完成', CANCELLED: '已取消' };
  return m[s] || s;
};

const statusTag = (s: string) => {
  const m: Record<string, string> = { PENDING: 'info', ISSUING: 'warning', COMPLETED: 'success', CANCELLED: 'danger' };
  return m[s] || 'info';
};

const rowSelectable = (row: DetailRow) => row.issueStatus === 'PENDING' && canOperate.value;

const onSelectionChange = (rows: DetailRow[]) => {
  selectedRows.value = rows;
};

function syncStepByStatus() {
  if (!detail.value) return;
  const st = detail.value.issue.issueStatus;
  if (st === 'COMPLETED' || st === 'CANCELLED') {
    currentStep.value = 2;
  } else if (st === 'ISSUING') {
    currentStep.value = pendingCount.value > 0 ? 1 : 2;
  } else {
    currentStep.value = detail.value.issue.receiverName ? 1 : 0;
  }
}

const loadDetail = async () => {
  if (!props.issueId) return;
  loading.value = true;
  try {
    const res = await getMaterialIssueDetail(props.issueId);
    detail.value = res.data;
    detail.value.details = (detail.value.details || []).map((d) => ({
      ...d,
      _editQty:
        d.issuedQuantity && Number(d.issuedQuantity) > 0
          ? Number(d.issuedQuantity)
          : Number(d.requiredQuantity)
    }));
    receiverForm.receiverName = detail.value.issue.receiverName || userStore.nickname || '';
    receiverForm.receiverDept = detail.value.issue.receiverDept || '';
    syncStepByStatus();
  } finally {
    loading.value = false;
  }
};

const saveAndNext = async () => {
  if (!props.issueId || !receiverForm.receiverName?.trim()) {
    ElMessage.warning('请填写领料人姓名');
    return;
  }
  saving.value = true;
  try {
    await assignMaterialIssueReceiver(props.issueId, {
      receiverId: userStore.userId,
      receiverName: receiverForm.receiverName.trim(),
      receiverDept: receiverForm.receiverDept
    });
    if (detail.value?.issue.issueStatus === 'PENDING') {
      await startMaterialIssue(props.issueId);
    }
    ElMessage.success('已保存');
    await loadDetail();
    currentStep.value = 1;
  } finally {
    saving.value = false;
  }
};

const buildPayload = (rows: DetailRow[]) => ({
  details: rows.map((r) => ({
    detailId: r.id,
    issuedQuantity: r._editQty ?? r.requiredQuantity,
    remark: r.remark
  }))
});

const fillAllQty = () => {
  detail.value?.details.forEach((d) => {
    if (d.issueStatus === 'PENDING') {
      (d as DetailRow)._editQty = Number(d.requiredQuantity);
    }
  });
};

const confirmSelected = async () => {
  if (!props.issueId || selectedRows.value.length === 0) return;
  confirming.value = true;
  try {
    await confirmMaterialIssueDetails(props.issueId, buildPayload(selectedRows.value));
    ElMessage.success('确认成功');
    await loadDetail();
    emit('success');
    if (pendingCount.value === 0) currentStep.value = 2;
  } finally {
    confirming.value = false;
  }
};

const confirmAllPending = async () => {
  if (!props.issueId || !detail.value) return;
  const pending = detail.value.details.filter((d) => d.issueStatus === 'PENDING') as DetailRow[];
  if (pending.length === 0) return;
  confirming.value = true;
  try {
    await confirmMaterialIssueDetails(props.issueId, buildPayload(pending));
    ElMessage.success('已全部确认');
    await loadDetail();
    emit('success');
    currentStep.value = 2;
  } finally {
    confirming.value = false;
  }
};

const doComplete = async () => {
  if (!props.issueId) return;
  await ElMessageBox.confirm(
    allowShortIssue.value ? '确认短装完成发料？' : '确认完成发料？完成后将回写 BOM。',
    '完成发料',
    { type: 'warning' }
  );
  completing.value = true;
  try {
    await completeMaterialIssue(props.issueId, allowShortIssue.value);
    ElMessage.success('发料已完成');
    await loadDetail();
    emit('success');
  } finally {
    completing.value = false;
  }
};

const handleCancel = async () => {
  if (!props.issueId) return;
  try {
    const { value } = await ElMessageBox.prompt('请输入取消原因', '取消发料单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    });
    await cancelMaterialIssue(props.issueId, { reason: value });
    ElMessage.success('已取消');
    await loadDetail();
    emit('success');
  } catch {
    /* user cancelled */
  }
};

const handleSyncSap = async () => {
  if (!props.issueId) return;
  const res = await syncMaterialIssueSap(props.issueId);
  ElMessage.success(res.data?.message || '已提交 SAP 同步');
};

const handleClose = () => {
  visible.value = false;
  detail.value = null;
};
</script>

<style scoped>
.issue-drawer {
  min-height: 200px;
  padding: 0 4px;
}
.issue-summary {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}
.summary-main {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.issue-no {
  font-size: 18px;
  font-weight: 600;
}
.summary-meta {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}
.progress-bar {
  max-width: 400px;
}
.issue-steps {
  margin-bottom: 24px;
}
.step-panel {
  min-height: 280px;
}
.toolbar {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}
.qty-input {
  width: 100%;
}
.issued-qty {
  font-weight: 500;
  color: var(--el-color-success);
}
.step-done {
  padding-top: 24px;
}
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}
.mb-3 {
  margin-bottom: 12px;
}
</style>
