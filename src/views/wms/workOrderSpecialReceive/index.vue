<template>
  <div class="p-2 special-receive-page">
    <el-card shadow="never" class="page-card">
      <template #header>
        <div class="page-header">
          <div>
            <h2 class="page-title">特殊工单入库</h2>
            <p class="page-subtitle">按工单类型匹配移动规则，添加入库物料并确认目标库位</p>
          </div>
          <el-tag v-if="workOrder" type="primary" effect="light">{{ currentReceiveRule.moveType }} · {{ currentReceiveRule.moveTypeName }}</el-tag>
        </div>
      </template>
      <div class="zp-panel">
        <!-- 结果提示 -->
        <div v-if="resultMessage" class="result-alert">
          <el-alert show-icon :type="resultSuccess ? 'success' : 'error'" :closable="true" @close="resultMessage = ''">
            {{ resultMessage }}
          </el-alert>
        </div>

        <!-- 工单选择与摘要 -->
        <div class="workflow-action-bar">
          <div class="workflow-action-summary">
            <span class="workflow-action-icon"
              ><el-icon><Tickets /></el-icon
            ></span>
            <div>
              <div class="workflow-action-title">选择特殊工单</div>
              <div class="workflow-action-desc">
                <template v-if="workOrder">当前工单 {{ workOrder.workOrderNo }}，可继续添加本次入库物料</template>
                <template v-else>请选择一个特殊工单，系统将自动匹配入库移动规则</template>
              </div>
            </div>
          </div>
          <el-button type="primary" class="primary-workflow-button" @click="showOrderDialog = true">
            <el-icon><Plus /></el-icon>
            {{ workOrder ? '更换工单' : '选择工单' }}
          </el-button>
        </div>

        <div v-if="workOrder" class="work-order-meta">
          <span class="meta-item"
            ><span>工单号</span><strong>{{ workOrder.workOrderNo }}</strong></span
          >
          <span class="meta-item"
            ><span>工单类型</span><strong>{{ workOrder.workOrderType || '-' }}</strong></span
          >
          <span class="meta-item"
            ><span>移动类型</span><strong>{{ currentReceiveRule.moveType }} {{ currentReceiveRule.moveTypeName }}</strong></span
          >
          <span class="meta-item"
            ><span>产品料号</span><strong>{{ workOrder.item || '-' }}</strong></span
          >
          <span class="meta-item meta-item-wide"
            ><span>产品描述</span><strong>{{ workOrder.itemDesc || '-' }}</strong></span
          >
        </div>

        <!-- 添加物料行 -->
        <div v-if="workOrder" class="material-entry-panel">
          <div class="material-entry-title">
            <el-icon><Box /></el-icon><span>添加入库物料</span>
          </div>
          <div class="material-add-row">
            <el-radio-group v-model="materialSource" class="material-source-radio" @change="onMaterialSourceChange">
              <el-radio-button v-for="option in materialSourceOptions" :key="option.value" :value="option.value">{{ option.label }}</el-radio-button>
            </el-radio-group>
            <el-input v-if="materialSource === 'workOrder'" :model-value="workOrderItemDisplay" readonly placeholder="当前工单无产品料号" class="material-input" />
            <el-input v-else-if="materialSource === 'bom'" v-model="selectedBomDisplay" readonly placeholder="请选择BOM物料" class="material-input">
              <template #append>
                <el-button icon="Search" @click="openBomDialog" />
              </template>
            </el-input>
            <HistoryInput v-else v-model="manualMaterialCode" :config="materialCodeConfig" placeholder="请输入物料编码" class="manual-material-input" @keydown.enter.prevent="handleAddMaterial">
              <template #append>
                <el-button icon="Search" @click="showItemDialog" />
              </template>
            </HistoryInput>
            <el-input-number v-model="addQty" :min="0" :precision="3" :step="1" controls-position="right" placeholder="数量" class="quantity-input" />
            <el-button type="primary" :loading="loadingAdd" :disabled="!canAdd" @click="handleAddMaterial">添加到清单</el-button>
          </div>
        </div>

        <!-- 入库清单 -->
        <div class="list-toolbar">
          <div class="list-heading">
            <span class="list-title">入库清单</span>
            <el-tag type="info" effect="plain">{{ receiveLines.length }} 条</el-tag>
          </div>
          <div class="list-actions">
            <el-button type="danger" plain :disabled="!receiveLines.length" @click="receiveLines = []">清空</el-button>
            <el-button type="primary" class="submit-button" :loading="submitting" :disabled="!receiveLines.length" @click="handleSubmit">
              <el-icon><UploadFilled /></el-icon>
              提交入库
            </el-button>
          </div>
        </div>

        <el-table :data="receiveLines" border stripe height="100%" class="receive-table" empty-text="请选择工单后添加入库物料">
          <el-table-column type="index" label="序号" width="56" align="center" />
          <el-table-column prop="moveType" label="移动类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag>{{ row.moveType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="materialCode" label="物料编码" min-width="120" />
          <el-table-column prop="materialName" label="物料描述" min-width="150" show-overflow-tooltip />
          <el-table-column prop="unit" label="单位" width="70" align="center" />
          <el-table-column label="入库数量" min-width="130">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="0.001" :precision="3" :step="1" controls-position="right" size="small" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="库位编码" min-width="180">
            <template #default="{ row, $index }">
              <TableHistoryInput v-model="row.locationCode" :config="locationCodeConfig" placeholder="请输入库位编码" @keydown.tab.prevent="locationCodeKeyDownTab(row)" @keydown.enter.prevent="locationCodeKeyDownTab(row)">
                <template #append>
                  <el-button icon="Search" @click="showStorageLocationDialog($index)" />
                </template>
              </TableHistoryInput>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="70" align="center" fixed="right">
            <template #default="{ $index }">
              <el-button type="danger" link @click="receiveLines.splice($index, 1)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 工单选择弹窗 -->
        <work-order-selection-dialog v-model="showOrderDialog" :selected-orders="[]" :show-bom-action="false" :single-select="true" @confirm="handleOrderSelection" />

        <!-- 物料选择弹窗 -->
        <ItemDialog ref="itemDialogRef" @item-select-call-back="itemSelectCallBack" />

        <!-- BOM料号选择弹窗 -->
        <el-dialog v-model="bomDialogVisible" :title="`选择BOM物料 - ${workOrder?.workOrderNo || ''}`" width="860px" destroy-on-close append-to-body>
          <el-input v-model="bomKeyword" placeholder="按物料编码/描述过滤" clearable class="bom-filter" />
          <el-table v-loading="bomLoading" :data="filteredBomList" border stripe max-height="420" highlight-current-row @current-change="onBomRowChange" @row-dblclick="confirmBomSelect">
            <el-table-column width="55" align="center">
              <template #default="scope">
                <el-radio v-model="bomDialogSelectedCode" :label="scope.row.componentMaterial" class="radio-no-label">
                  <span class="el-radio__label"></span>
                </el-radio>
              </template>
            </el-table-column>
            <el-table-column prop="componentMaterial" label="物料编码" min-width="130" />
            <el-table-column prop="componentDesc" label="物料描述" min-width="160" show-overflow-tooltip />
            <el-table-column prop="componentQty" label="BOM数量" width="100" align="right" />
            <el-table-column prop="issuedQty" label="已发料" width="90" align="right" />
            <el-table-column prop="unit" label="单位" width="70" align="center" />
          </el-table>
          <template #footer>
            <el-button @click="bomDialogVisible = false">取消</el-button>
            <el-button type="primary" :disabled="!bomDialogSelectedCode" @click="confirmBomSelect">确定</el-button>
          </template>
        </el-dialog>

        <!-- 库位选择弹窗 -->
        <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Plus, Tickets, Box, UploadFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { HistoryConfig } from '@/types/history';
import { listWorkOrderBom } from '@/api/wms/workOrderBom';
import type { WorkOrderBomVO } from '@/api/wms/workOrderBom/types';
import { listItem } from '@/api/wms/item';
import type { ItemVO, ItemQuery } from '@/api/wms/item/types';
import { listStorageLocation } from '@/api/wms/storageLocation';
import { submitWorkOrderSpecialReceive } from '@/api/wms/workOrderSpecialReceive';
import HistoryInput from '@/components/HistoryInput/index.vue';
import TableHistoryInput from '@/components/TableHistoryInput/index.vue';
import WorkOrderSelectionDialog from '@/views/wms/workOrder/components/WorkOrderSelectionDialog.vue';
import ItemDialog from '@/views/wms/item/components/itemDialog.vue';
import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';

interface ReceiveLine {
  moveType: string;
  materialCode: string;
  materialName: string;
  unit: string;
  quantity: number;
  locationCode: string;
  warehouseCode?: string;
  areaCode?: string;
  batchCode: string;
  remark: string;
}

interface WorkOrderVO {
  workOrderNo: string;
  workOrderType?: string;
  item?: string;
  itemDesc?: string;
  unit?: string;
  plannedQty?: number;
  deliveredQty?: number;
  [key: string]: unknown;
}

type MaterialSource = 'workOrder' | 'bom' | 'all';

interface ReceiveRule {
  moveType: string;
  moveTypeName: string;
  defaultSource: MaterialSource;
  sources: MaterialSource[];
  autoAddWorkOrderItem: boolean;
  /** 「所有料号」中排除当前工单 BOM 料号 */
  excludeBomFromAll?: boolean;
}

const MATERIAL_SOURCE_LABELS: Record<MaterialSource, string> = {
  workOrder: '工单料号',
  bom: 'BOM料号',
  all: '所有料号'
};

const DEFAULT_RECEIVE_RULE: ReceiveRule = {
  moveType: '101',
  moveTypeName: '入库',
  defaultSource: 'workOrder',
  sources: ['workOrder'],
  autoAddWorkOrderItem: true,
  excludeBomFromAll: false
};

const WORK_ORDER_RECEIVE_RULES: Record<string, ReceiveRule> = {
  ZP83: {
    moveType: '262',
    moveTypeName: '入库',
    defaultSource: 'workOrder',
    sources: ['workOrder'],
    autoAddWorkOrderItem: true
  },
  ZP92: {
    moveType: '262',
    moveTypeName: '入库',
    defaultSource: 'all',
    sources: ['all'],
    autoAddWorkOrderItem: false,
    excludeBomFromAll: true
  },
  ZP93: {
    moveType: '531',
    moveTypeName: '次料入库',
    defaultSource: 'bom',
    sources: ['workOrder', 'bom'],
    autoAddWorkOrderItem: false
  },
  ZP94: {
    moveType: '262',
    moveTypeName: '入库',
    defaultSource: 'workOrder',
    sources: ['workOrder', 'bom'],
    autoAddWorkOrderItem: true
  }
};

const showOrderDialog = ref(false);
const workOrder = ref<WorkOrderVO | null>(null);
const bomList = ref<WorkOrderBomVO[]>([]);
const materialSource = ref<MaterialSource>('workOrder');
const selectedBomMaterial = ref('');
const selectedBomDisplay = ref('');
const manualMaterialCode = ref('');
const addQty = ref(0);
const loadingAdd = ref(false);
const receiveLines = ref<ReceiveLine[]>([]);
const submitting = ref(false);
const resultMessage = ref('');
const resultSuccess = ref(false);
const currentLocationIndex = ref(-1);
const itemDialogRef = ref<InstanceType<typeof ItemDialog>>();
const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();
const bomDialogVisible = ref(false);
const bomLoading = ref(false);
const bomKeyword = ref('');
const bomDialogSelectedCode = ref('');

const workOrderItemDisplay = computed(() => {
  if (!workOrder.value?.item) return '';
  const code = workOrder.value.item;
  const desc = workOrder.value.itemDesc || '';
  return desc ? `${code} - ${desc}` : code;
});

const filteredBomList = computed(() => {
  const keyword = bomKeyword.value.trim().toUpperCase();
  if (!keyword) return bomList.value;
  return bomList.value.filter((row) => {
    const code = String(row.componentMaterial || '').toUpperCase();
    const desc = String(row.componentDesc || '').toUpperCase();
    return code.includes(keyword) || desc.includes(keyword);
  });
});

const currentReceiveRule = computed(() => {
  const type = String(workOrder.value?.workOrderType || '')
    .trim()
    .toUpperCase();
  return WORK_ORDER_RECEIVE_RULES[type] || DEFAULT_RECEIVE_RULE;
});

const shouldExcludeBomFromAll = computed(() => !!currentReceiveRule.value.excludeBomFromAll && materialSource.value === 'all');

const materialSourceOptions = computed(() =>
  currentReceiveRule.value.sources.map((value) => ({
    value,
    label: MATERIAL_SOURCE_LABELS[value]
  }))
);

const materialCodeConfig: HistoryConfig = {
  key: 'materialCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'workOrderSpecialReceive',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const locationCodeConfig: HistoryConfig = {
  key: 'locationCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'workOrderSpecialReceive',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

function applyLocationToLine(line: ReceiveLine, record: { warehouseCode?: string; areaCode?: string; locationCode?: string }) {
  line.locationCode = record.locationCode || '';
  line.warehouseCode = record.warehouseCode || '';
  line.areaCode = record.areaCode || '';
}

function resolveWorkOrderItemDefaultQty(order: WorkOrderVO): number {
  const planned = Number(order.plannedQty) || 0;
  const delivered = Number(order.deliveredQty) || 0;
  const remain = planned - delivered;
  return remain > 0 ? remain : planned;
}

function normalizeBomList(rows: WorkOrderBomVO[]): WorkOrderBomVO[] {
  if (currentReceiveRule.value.moveType === '531') return rows;
  return rows.filter((row) => !(Number(row.componentQty) < 0));
}

function resolveBomDefaultQty(row: WorkOrderBomVO): number {
  const componentQty = Number(row.componentQty) || 0;
  const issuedQty = Number(row.issuedQty) || 0;
  if (currentReceiveRule.value.moveType === '531') {
    const remain = Math.abs(componentQty) - Math.abs(issuedQty);
    return remain > 0 ? remain : Math.abs(componentQty);
  }
  return Math.max(0, componentQty - issuedQty);
}

function appendReceiveLine(matCode: string, matName: string, matUnit: string, qty: number, moveType = currentReceiveRule.value.moveType) {
  const existing = receiveLines.value.findIndex((r) => r.materialCode === matCode && r.moveType === moveType);
  if (existing >= 0) {
    receiveLines.value[existing].quantity = qty;
    receiveLines.value[existing].materialName = matName || receiveLines.value[existing].materialName;
    receiveLines.value[existing].unit = matUnit || receiveLines.value[existing].unit;
    ElMessage.success('已更新数量');
    return;
  }
  receiveLines.value.push({
    moveType,
    materialCode: matCode,
    materialName: matName,
    unit: matUnit,
    quantity: qty,
    locationCode: '',
    warehouseCode: '',
    areaCode: '',
    batchCode: '',
    remark: ''
  });
  ElMessage.success('已添加入库清单');
}

const canAdd = computed(() => {
  if (!workOrder.value) return false;
  if (addQty.value <= 0) return false;
  if (!currentReceiveRule.value.sources.includes(materialSource.value)) return false;
  if (materialSource.value === 'workOrder') return !!workOrder.value.item;
  if (materialSource.value === 'bom') return !!selectedBomMaterial.value;
  return !!manualMaterialCode.value?.trim();
});

const onMaterialSourceChange = () => {
  if (!currentReceiveRule.value.sources.includes(materialSource.value)) {
    materialSource.value = currentReceiveRule.value.defaultSource;
  }
  selectedBomMaterial.value = '';
  selectedBomDisplay.value = '';
  manualMaterialCode.value = '';
  if (materialSource.value === 'workOrder' && workOrder.value) {
    addQty.value = resolveWorkOrderItemDefaultQty(workOrder.value);
  } else {
    addQty.value = 0;
  }
};

const appendWorkOrderItemLine = async (order: WorkOrderVO, moveType: string) => {
  const matCode = String(order.item || '').trim();
  if (!matCode) return;

  let matName = String(order.itemDesc || '').trim();
  let matUnit = String(order.unit || '').trim();
  if (!matName || !matUnit) {
    const item = await resolveMaterial(matCode);
    matName = item?.itemDesc || matName;
    matUnit = item?.unit || matUnit;
  }

  appendReceiveLine(matCode, matName, matUnit, resolveWorkOrderItemDefaultQty(order), moveType);
};

const handleOrderSelection = async (orders: WorkOrderVO[]) => {
  showOrderDialog.value = false;
  if (!orders.length) return;
  const order = orders[0];
  workOrder.value = order;
  receiveLines.value = [];
  bomList.value = [];
  selectedBomMaterial.value = '';
  selectedBomDisplay.value = '';
  manualMaterialCode.value = '';
  materialSource.value = currentReceiveRule.value.defaultSource;
  addQty.value = materialSource.value === 'workOrder' ? resolveWorkOrderItemDefaultQty(order) : 0;

  bomLoading.value = true;
  try {
    const res = await listWorkOrderBom({ workOrderNo: order.workOrderNo, pageNum: 1, pageSize: 2000 } as any);
    bomList.value = normalizeBomList(res.rows || []);
  } catch {
    bomList.value = [];
  } finally {
    bomLoading.value = false;
  }

  if (currentReceiveRule.value.autoAddWorkOrderItem) {
    loadingAdd.value = true;
    try {
      await appendWorkOrderItemLine(order, currentReceiveRule.value.moveType);
    } finally {
      loadingAdd.value = false;
    }
  }
};

const openBomDialog = async () => {
  if (!workOrder.value) {
    ElMessage.warning('请先选择工单');
    return;
  }
  bomKeyword.value = '';
  bomDialogSelectedCode.value = selectedBomMaterial.value || '';
  if (!bomList.value.length) {
    bomLoading.value = true;
    try {
      const res = await listWorkOrderBom({ workOrderNo: workOrder.value.workOrderNo, pageNum: 1, pageSize: 2000 } as any);
      bomList.value = normalizeBomList(res.rows || []);
    } catch {
      bomList.value = [];
    } finally {
      bomLoading.value = false;
    }
  }
  bomDialogVisible.value = true;
};

const onBomRowChange = (row: WorkOrderBomVO | null) => {
  bomDialogSelectedCode.value = row?.componentMaterial || '';
};

const confirmBomSelect = () => {
  const code = bomDialogSelectedCode.value;
  if (!code) {
    ElMessage.warning('请选择BOM物料');
    return;
  }
  const bom = bomList.value.find((b) => b.componentMaterial === code);
  if (!bom) {
    ElMessage.warning('未找到所选BOM物料');
    return;
  }
  selectedBomMaterial.value = bom.componentMaterial;
  selectedBomDisplay.value = `${bom.componentMaterial}${bom.componentDesc ? ` - ${bom.componentDesc}` : ''}`;
  addQty.value = resolveBomDefaultQty(bom);
  bomDialogVisible.value = false;
};

async function resolveMaterial(code: string): Promise<ItemVO | null> {
  const res = await listItem({ item: code, pageNum: 1, pageSize: 50 } as ItemQuery);
  if (res.code !== 200) return null;
  const rows = (res.rows || []) as ItemVO[];
  const normalized = code.trim().toUpperCase();
  return (
    rows.find(
      (r) =>
        String(r.item || '')
          .trim()
          .toUpperCase() === normalized
    ) || null
  );
}

function isBomMaterialCode(code: string) {
  const normalized = String(code || '')
    .trim()
    .toUpperCase();
  if (!normalized) return false;
  return bomList.value.some(
    (row) =>
      String(row.componentMaterial || '')
        .trim()
        .toUpperCase() === normalized
  );
}

async function ensureBomListLoaded() {
  if (!workOrder.value?.workOrderNo) {
    ElMessage.warning('请先选择工单');
    return false;
  }
  if (bomList.value.length) {
    return true;
  }
  bomLoading.value = true;
  try {
    const res = await listWorkOrderBom({ workOrderNo: workOrder.value.workOrderNo, pageNum: 1, pageSize: 2000 } as any);
    bomList.value = normalizeBomList(res.rows || []);
  } catch {
    bomList.value = [];
  } finally {
    bomLoading.value = false;
  }
  return true;
}

const handleAddMaterial = async () => {
  if (!workOrder.value) {
    ElMessage.warning('请先选择工单');
    return;
  }
  const qty = Number(addQty.value) || 0;
  if (qty <= 0) {
    ElMessage.warning('请输入入库数量');
    return;
  }
  if (!currentReceiveRule.value.sources.includes(materialSource.value)) {
    ElMessage.warning('当前工单类型不支持该物料来源');
    return;
  }

  let matCode = '';
  let matName = '';
  let matUnit = '';

  if (materialSource.value === 'workOrder') {
    matCode = String(workOrder.value.item || '').trim();
    matName = String(workOrder.value.itemDesc || '').trim();
    matUnit = String(workOrder.value.unit || '').trim();
  } else if (materialSource.value === 'bom') {
    matCode = selectedBomMaterial.value;
    const bom = bomList.value.find((b) => b.componentMaterial === matCode);
    matName = bom?.componentDesc || '';
    matUnit = bom?.unit || '';
  } else {
    matCode = (manualMaterialCode.value || '').trim();
  }

  if (!matCode) {
    ElMessage.warning(materialSource.value === 'workOrder' ? '当前工单无产品料号' : '请选择或输入物料编码');
    return;
  }

  if (shouldExcludeBomFromAll.value) {
    const ready = await ensureBomListLoaded();
    if (!ready) return;
    if (isBomMaterialCode(matCode)) {
      ElMessage.warning(`物料 ${matCode} 属于当前工单 BOM，请勿在「所有料号」中选择`);
      return;
    }
  }

  if ((materialSource.value === 'all' || materialSource.value === 'workOrder') && (!matName || !matUnit)) {
    loadingAdd.value = true;
    try {
      const item = await resolveMaterial(matCode);
      if (!item) {
        ElMessage.error(`物料 ${matCode} 不存在`);
        return;
      }
      matName = item.itemDesc || matName;
      matUnit = item.unit || matUnit;
    } finally {
      loadingAdd.value = false;
    }
  }

  appendReceiveLine(matCode, matName, matUnit, qty, currentReceiveRule.value.moveType);

  if (materialSource.value === 'bom') {
    selectedBomMaterial.value = '';
    selectedBomDisplay.value = '';
    addQty.value = 0;
  } else if (materialSource.value === 'all') {
    manualMaterialCode.value = '';
    addQty.value = 0;
  }
};

const handleSubmit = async () => {
  if (!workOrder.value) return;
  const lines = receiveLines.value.filter((r) => r.quantity > 0);
  if (!lines.length) {
    ElMessage.warning('请添加入库物料');
    return;
  }
  const missingLocation = lines.find((r) => !r.locationCode?.trim());
  if (missingLocation) {
    ElMessage.warning(`物料 ${missingLocation.materialCode} 未填写库位编码`);
    return;
  }

  try {
    await ElMessageBox.confirm(`将对 ${lines.length} 条物料执行入库，是否确认？`, '确认入库', { type: 'warning' });
  } catch {
    return;
  }

  submitting.value = true;
  resultMessage.value = '';
  try {
    const res = await submitWorkOrderSpecialReceive({
      workOrderInOutBoundList: lines.map((line) => ({
        workOrderNo: workOrder.value!.workOrderNo,
        workOrderType: workOrder.value!.workOrderType,
        moveType: line.moveType,
        materialCode: line.materialCode,
        materialName: line.materialName,
        quantity: line.quantity,
        unit: line.unit,
        batchCode: line.batchCode || undefined,
        locationCode: line.locationCode,
        warehouseCode: line.warehouseCode || undefined,
        areaCode: line.areaCode || undefined,
        remark: line.remark || undefined
      }))
    });
    resultSuccess.value = true;
    resultMessage.value = res.msg || '入库成功';
    receiveLines.value = [];
  } catch (error) {
    resultSuccess.value = false;
    resultMessage.value = (error as Error)?.message || '入库失败';
  } finally {
    submitting.value = false;
  }
};

const showItemDialog = async () => {
  if (shouldExcludeBomFromAll.value) {
    const ready = await ensureBomListLoaded();
    if (!ready) return;
  }
  itemDialogRef.value?.openDialog();
  itemDialogRef.value?.handleQuery();
};

const itemSelectCallBack = (record: any) => {
  const code = record.item || '';
  if (shouldExcludeBomFromAll.value && isBomMaterialCode(code)) {
    ElMessage.warning(`物料 ${code} 属于当前工单 BOM，请勿在「所有料号」中选择`);
    return;
  }
  manualMaterialCode.value = code;
};

const locationCodeKeyDownTab = async (row: ReceiveLine) => {
  const locationCode = row.locationCode?.trim();
  if (!locationCode) {
    return;
  }
  const res: any = await listStorageLocation({
    pageNum: 1,
    pageSize: 10,
    locationCode
  });
  const rows = res.rows || [];
  const matched = rows.find((item: any) => item.locationCode === locationCode) || rows[0];
  if (!matched) {
    row.warehouseCode = '';
    row.areaCode = '';
    ElMessage.warning(`库位${locationCode}不存在`);
    return;
  }
  applyLocationToLine(row, matched);
};

const showStorageLocationDialog = (index: number) => {
  currentLocationIndex.value = index;
  storageLocationDialogRef.value?.openDialog();
  storageLocationDialogRef.value?.handleQuery();
};

const storageLocationSelectCallBack = (record: any) => {
  if (currentLocationIndex.value < 0 || currentLocationIndex.value >= receiveLines.value.length) {
    return;
  }
  applyLocationToLine(receiveLines.value[currentLocationIndex.value], record);
};
</script>

<style scoped>
.special-receive-page {
  display: flex;
  height: calc(100vh - 84px);
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
}
.page-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.page-card :deep(> .el-card__body) {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.page-title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
}
.page-subtitle {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.zp-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
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
.workflow-action-summary {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}
.workflow-action-icon {
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
.workflow-action-title {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
}
.workflow-action-desc {
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.primary-workflow-button,
.submit-button {
  border: 0;
  font-weight: 600;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, #6b8cff 100%);
  box-shadow: 0 3px 10px rgb(64 158 255 / 22%);
}
.work-order-meta {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 22px;
  padding: 9px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-extra-light);
}
.meta-item {
  display: inline-flex;
  min-width: 120px;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;
}
.meta-item > span {
  color: var(--el-text-color-secondary);
}
.meta-item > strong {
  color: var(--el-text-color-primary);
  font-weight: 600;
}
.meta-item-wide {
  min-width: 260px;
  flex: 1;
}
.material-entry-panel {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.material-entry-title {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}
.material-add-row {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.material-source-radio {
  margin-right: 4px;
}
.material-input {
  width: 320px;
}
.manual-material-input {
  width: 240px;
}
.quantity-input {
  width: 150px;
}
.bom-filter {
  margin-bottom: 10px;
  max-width: 320px;
}
.radio-no-label :deep(.el-radio__label) {
  display: none;
}
.list-toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 2px 0;
}
.list-heading {
  display: flex;
  align-items: center;
  gap: 8px;
}
.list-title {
  font-size: 15px;
  font-weight: 600;
}
.list-actions {
  display: flex;
  gap: 8px;
}
.receive-table {
  flex: 1;
  min-height: 0;
}
.result-alert {
  flex-shrink: 0;
}
.result-alert :deep(.el-alert) {
  padding: 7px 10px;
}
@media (max-width: 1200px) {
  .workflow-action-bar,
  .material-entry-panel {
    align-items: flex-start;
    flex-direction: column;
  }
  .material-entry-title {
    padding-top: 4px;
  }
}
</style>
