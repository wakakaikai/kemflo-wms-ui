<template>
  <div class="p-2 work-order-return-page">
    <el-card shadow="never" class="history-card" :class="{ 'is-history-collapsed': !historyExpanded }">
      <template #header>
        <div class="history-card-header">
          <div class="history-header-left" @click="historyExpanded = !historyExpanded">
            <el-icon class="history-collapse-icon" :class="{ 'is-expanded': historyExpanded }">
              <ArrowRight />
            </el-icon>
            <span class="history-header-title">工单入库历史</span>
          </div>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
        </div>
      </template>

      <div v-show="historyExpanded" class="history-card-body">
        <el-form v-show="showSearch" ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
          <el-form-item label="移动类型" prop="moveType">
            <HistoryInput v-model="queryParams.moveType" :config="moveTypeConfig" placeholder="请输入移动类型" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="物料凭证号" prop="sapMaterialOrderNo">
            <HistoryInput v-model="queryParams.sapMaterialOrderNo" :config="sapMaterialOrderNoConfig" placeholder="请输入物料凭证号" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="物料凭证项次" prop="sapMaterialItem">
            <HistoryInput v-model="queryParams.sapMaterialItem" :config="sapMaterialItemConfig" placeholder="请输入物料凭证项次" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="工单号" prop="sourceDocCode">
            <HistoryInput v-model="queryParams.sourceDocCode" :config="sourceDocCodeConfig" placeholder="请输入工单号" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="物料编码" prop="itemCode">
            <HistoryInput v-model="queryParams.itemCode" :config="itemCodeConfig" placeholder="请输入物料编码" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery" :loading="loading">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="search-result">
          <el-table ref="inventoryTableRef" :data="inventoryDetailList" height="300" border v-loading="loading" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column v-if="columns[0].visible" label="移动类型" align="center" prop="moveType" width="90" />
            <el-table-column v-if="columns[1].visible" label="物料凭证号" align="left" prop="sapMaterialOrderNo" />
            <el-table-column v-if="columns[2].visible" label="凭证项次" align="left" prop="sapMaterialItem" />
            <el-table-column v-if="columns[3].visible" label="工单号" align="left" prop="sourceDocCode" />
            <el-table-column v-if="columns[4].visible" label="物料编码" align="left" prop="itemCode" />
            <el-table-column v-if="columns[5].visible" label="物料名称" align="left" prop="itemName" show-overflow-tooltip />
            <el-table-column v-if="columns[6].visible" label="批次号" align="center" prop="batchCode" />
            <el-table-column v-if="columns[7].visible" label="数量" align="center">
              <template #default="scope">{{ formatQtyWithUnit(scope.row.quantity, scope.row.unit) }}</template>
            </el-table-column>
            <el-table-column v-if="columns[8].visible" label="特殊库存" align="center" prop="specialInventoryFlag">
              <template #default="scope">
                <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
              </template>
            </el-table-column>
            <el-table-column v-if="columns[9].visible" label="业务伙伴" align="center" prop="businessCode" />
            <el-table-column v-if="columns[10].visible" label="伙伴名称" align="center" prop="businessName" show-overflow-tooltip />
            <el-table-column v-if="columns[11].visible" label="仓库编码" align="center" prop="warehouseCode" />
            <el-table-column v-if="columns[12].visible" label="库区编码" align="center" prop="areaCode" />
            <el-table-column v-if="columns[13].visible" label="库位编码" align="center" prop="locationCode" fixed="right" />
          </el-table>

          <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
        </div>
      </div>
    </el-card>

    <div class="add-transfer-bar">
      <el-button type="primary" @click="addSelectedToTransferList" circle class="rotate-button">
        <el-icon><Switch /></el-icon>
      </el-button>
    </div>

    <el-card shadow="never" class="transfer-main-card" :class="{ 'is-transfer-collapsed': !transferExpanded }">
      <template #header>
        <div class="transfer-header">
          <div class="history-header-left" @click="transferExpanded = !transferExpanded">
            <el-icon class="history-collapse-icon" :class="{ 'is-expanded': transferExpanded }">
              <ArrowRight />
            </el-icon>
            <span class="header-title">工单退货列表</span>
          </div>
          <div class="header-actions" @click.stop>
            <el-button type="danger" @click="clearTransferList" :disabled="transferList.length === 0">清空列表</el-button>
            <right-toolbar :search="false" :columns="transferColumns" />
          </div>
        </div>
      </template>

      <div v-show="transferExpanded" class="transfer-card-body">
        <div class="query-panel">
          <el-form :model="fixedTransferForm" ref="fixedTransferFormRef" label-width="auto" :inline="true">
            <el-row :gutter="20">
<!--              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="交货单">
                  <HistoryInput v-model="fixedTransferForm.lfsnr" :config="lfsnrConfig" placeholder="请输入交货单" />
                </el-form-item>
              </el-col>-->
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="抬头文本" prop="bktxt">
                  <HistoryInput v-model="fixedTransferForm.bktxt" :config="bktxtConfig" placeholder="请输入抬头文本" />
                </el-form-item>
              </el-col>
              <el-col :sm="24" :md="8" :lg="8">
                <el-form-item label="过账日期" prop="postingDate">
                  <el-date-picker clearable v-model="fixedTransferForm.postingDate" type="date" :disabled-date="disabledFutureDate" value-format="YYYY-MM-DD" placeholder="请选择过账日期" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div v-if="resultMessage" class="m-y-2">
          <el-alert show-icon center :title="resultMessage" :type="resultStatus ? 'success' : 'error'">
            <template #icon>
              <Bell />
            </template>
          </el-alert>
        </div>

        <el-table :data="transferList" border style="width: 100%" v-loading="tableLoading" max-height="520">
          <el-table-column type="index" width="50" align="center" />
          <el-table-column v-if="transferColumns[0].visible" label="工单号" min-width="120">
            <template #default="scope">
              <el-link type="primary" :underline="false" @click="openWorkOrderDialog(scope.row)">
                {{ scope.row.workOrderNo || '选择工单号' }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column v-if="transferColumns[1].visible" label="物料编码" min-width="150">
            <template #default="scope">
              <el-dropdown v-if="canEditMaterial(scope.row) && getMaterialSourceOptions(scope.row).length > 1" trigger="click" @command="(cmd) => handleMaterialSourceCommand(scope.row, cmd)">
                <el-link type="primary" :underline="false">
                  {{ scope.row.itemCode || '选择物料' }}
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-link>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-for="opt in getMaterialSourceOptions(scope.row)" :key="opt.value" :command="opt.value">{{ opt.label }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-link v-else-if="canEditMaterial(scope.row)" type="primary" :underline="false" @click="openMaterialPicker(scope.row)">
                {{ scope.row.itemCode || '选择物料' }}
              </el-link>
              <span v-else>{{ scope.row.itemCode }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="transferColumns[2].visible" label="物料名称" prop="itemName" min-width="140" show-overflow-tooltip />
          <el-table-column v-if="transferColumns[3].visible" label="源库位信息" min-width="200">
            <template #default="scope">
              <div class="source-location-cell">
                <div>
                  <div>仓库: {{ scope.row.sourceWarehouseCode || '' }}</div>
                  <div>库位: {{ scope.row.sourceLocationCode || '' }}</div>
                  <div>批次: {{ scope.row.batchCode || '' }}</div>
                </div>
                <el-button link type="primary" icon="Search" @click="openInventoryDialog(scope.$index, scope.row)"></el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column v-if="transferColumns[4].visible" label="库存标识" align="center" prop="specialInventoryFlag" min-width="100">
            <template #default="scope">
              <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
            </template>
          </el-table-column>
          <el-table-column v-if="transferColumns[5].visible" label="业务伙伴" align="center" min-width="180">
            <template #default="scope">
              <span>{{ scope.row.businessCode || '' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="transferColumns[6].visible" label="退货数量" width="180">
            <template #default="scope">
              <div class="qty-with-unit-cell">
                <el-input-number v-model="scope.row.returnQuantity" :min="0" :max="resolveReturnQuantityMax(scope.row)" :precision="3" size="small" controls-position="right" @change="handleReturnPoQuantityChange(scope.row)" />
                <span v-if="scope.row.unit" class="qty-unit-text">{{ scope.row.unit }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template #default="scope">
              <el-button type="danger" link icon="Delete" @click="removeFromTransferList(scope.$index)"></el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="list-footer-actions">
          <el-button type="primary" circle icon="Plus" @click="addManualTransferRow" />
        </div>

        <div style="text-align: center">
          <el-button v-hasPermi="['wms:workOrder:return']" :loading="buttonLoading1" type="primary" @click="submitTransfer" :disabled="transferList.length === 0"> 工单入库取消 </el-button>
        </div>
      </div>
    </el-card>

    <InventorySelectionDialog
      v-model="inventoryDialog.visible"
      :material-code="inventoryDialog.row?.materialCode || inventoryDialog.row?.itemCode || ''"
      :material-desc="inventoryDialog.row?.materialName || inventoryDialog.row?.itemName || ''"
      :issue-qty="inventoryDialog.issueQty"
      :unit="inventoryDialog.row?.unit || inventoryDialog.row?.inventoryUnit || ''"
      :general-only="false"
      @confirm="applyInventorySelection"
    />
    <WorkOrderSelectionDialog v-model="workOrderDialog.visible" :selected-orders="[]" :show-bom-action="false" :single-select="true" @confirm="handleWorkOrderSelection" />
    <ItemDialog ref="itemDialogRef" @item-select-call-back="itemSelectCallBack" />
    <el-dialog v-model="bomDialogVisible" :title="`选择BOM物料 - ${materialEditRow?.workOrderNo || materialEditRow?.sourceDocCode || ''}`" width="860px" destroy-on-close append-to-body>
      <el-input v-model="bomKeyword" placeholder="按物料编码/描述过滤" clearable class="bom-filter" style="margin-bottom: 12px" />
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
        <el-table-column prop="unit" label="单位" width="70" align="center" />
      </el-table>
      <template #footer>
        <el-button @click="bomDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!bomDialogSelectedCode" @click="confirmBomSelect">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="WorkOrderReturn" lang="ts">
import { ref, reactive, computed, getCurrentInstance, toRefs } from 'vue';
import { ArrowDown, ArrowRight, ArrowUp, Bell, Switch } from '@element-plus/icons-vue';
import { listInventoryMovement } from '@/api/wms/inventoryMovement';
import { syncSapMaterialOrderNoEmptyFilter } from '@/api/wms/inventoryMovement/query';
import type { InventoryMovementQuery, InventoryMovementVO } from '@/api/wms/inventoryMovement/types';
import { buildWorkOrderReturnBo, enrichWorkOrderReturnRow, workOrderOutbound } from '@/api/wms/workOrderReturn';
import { listWorkOrder } from '@/api/wms/workOrder';
import { listWorkOrderBom } from '@/api/wms/workOrderBom';
import type { WorkOrderBomVO } from '@/api/wms/workOrderBom/types';
import { HttpStatus } from '@/enums/RespEnum';
import { formatQty } from '@/utils/ruoyi';
import { HistoryConfig } from '@/types/history';
import HistoryInput from '@/components/HistoryInput/index.vue';
import InventorySelectionDialog from '@/views/wms/inventoryDetail/components/InventorySelectionDialog.vue';
import WorkOrderSelectionDialog from '@/views/wms/workOrder/components/WorkOrderSelectionDialog.vue';
import ItemDialog from '@/views/wms/item/components/itemDialog.vue';
const showAdvancedSearch = ref(false); // 控制高级搜索显示状态
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));

type MaterialSource = 'workOrder' | 'bom' | 'all';

interface ReturnMaterialRule {
  canEditMaterial: boolean;
  defaultSource: MaterialSource;
  sources: MaterialSource[];
  useWorkOrderItemAsDefault: boolean;
  filterAllByBom?: boolean;
}

const MATERIAL_SOURCE_LABELS: Record<MaterialSource, string> = {
  workOrder: '工单料号',
  bom: 'BOM料号',
  all: '所有料号'
};

/**
 * 特殊工单类型物料可改（对齐打印规则）
 * ZP92：所有料号（排除 BOM）；ZP93：工单/BOM；ZP94：工单/BOM/所有料号
 */
const WORK_ORDER_RETURN_MATERIAL_RULES: Record<string, ReturnMaterialRule> = {
  ZP92: {
    canEditMaterial: true,
    defaultSource: 'all',
    sources: ['all'],
    useWorkOrderItemAsDefault: false,
    filterAllByBom: true
  },
  ZP93: {
    canEditMaterial: true,
    defaultSource: 'workOrder',
    sources: ['workOrder', 'bom'],
    useWorkOrderItemAsDefault: true
  },
  ZP94: {
    canEditMaterial: true,
    defaultSource: 'workOrder',
    sources: ['workOrder', 'bom', 'all'],
    useWorkOrderItemAsDefault: true
  }
};

const resolveWorkOrderType = (type?: string) =>
  String(type || '')
    .trim()
    .toUpperCase();

const getReturnMaterialRule = (type?: string) => WORK_ORDER_RETURN_MATERIAL_RULES[resolveWorkOrderType(type)];

const canEditMaterial = (row: any) => !!getReturnMaterialRule(row?.workOrderType)?.canEditMaterial;

const getMaterialSourceOptions = (row: any) => {
  const rule = getReturnMaterialRule(row?.workOrderType);
  if (!rule) return [];
  return rule.sources.map((value) => ({ value, label: MATERIAL_SOURCE_LABELS[value] }));
};

const showSearch = ref(true);
const historyExpanded = ref(true);
const transferExpanded = ref(true);
const loading = ref(false);
const tableLoading = ref(false);
const buttonLoading1 = ref(false);
const inventoryDetailList = ref<InventoryMovementVO[]>([]);
const selectedSearchItems = ref<InventoryMovementVO[]>([]);
const transferList = ref<any[]>([]);
const total = ref(0);
const resultMessage = ref('');
const resultStatus = ref(false);
const queryFormRef = ref<any>(null);
const inventoryTableRef = ref<any>(null);
const fixedTransferFormRef = ref<any>(null);

const fixedTransferForm = ref({
  lfsnr: '',
  bktxt: '',
  postingDate: null as string | null
});

const queryParams = ref<InventoryMovementQuery>({
  pageNum: 1,
  pageSize: 10,
  moveType: '',
  sourceDocType: 'WO',
  sourceDocCode: undefined,
  itemCode: undefined,
  sapMaterialOrderNo: undefined,
  sapMaterialItem: undefined,
  sapMaterialOrderNoEmpty: true,
  params: {}
});

const inventoryDialog = reactive<{
  visible: boolean;
  index: number;
  row: any | null;
  issueQty: number;
}>({
  visible: false,
  index: -1,
  row: null,
  issueQty: 0
});

const workOrderDialog = reactive<{
  visible: boolean;
  row: any | null;
}>({
  visible: false,
  row: null
});

const itemDialogRef = ref<InstanceType<typeof ItemDialog>>();
const materialEditRow = ref<any | null>(null);
const workOrderTypeCache = new Map<string, { workOrderType: string; item?: string; itemDesc?: string; unit?: string }>();
const bomList = ref<WorkOrderBomVO[]>([]);
const bomLoading = ref(false);
const bomDialogVisible = ref(false);
const bomKeyword = ref('');
const bomDialogSelectedCode = ref('');
const filterAllByBom = ref(false);

const filteredBomList = computed(() => {
  const keyword = bomKeyword.value.trim().toUpperCase();
  if (!keyword) return bomList.value;
  return bomList.value.filter((row) => {
    const code = String(row.componentMaterial || '').toUpperCase();
    const desc = String(row.componentDesc || '').toUpperCase();
    return code.includes(keyword) || desc.includes(keyword);
  });
});

const moveTypeConfig: HistoryConfig = {
  key: 'moveType',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'workOrderReturn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const sapMaterialOrderNoConfig: HistoryConfig = {
  key: 'sapMaterialOrderNo',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'workOrderReturn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const sapMaterialItemConfig: HistoryConfig = {
  key: 'sapMaterialItem',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'workOrderReturn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const sourceDocCodeConfig: HistoryConfig = {
  key: 'sourceDocCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'workOrderReturn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const itemCodeConfig: HistoryConfig = {
  key: 'itemCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'workOrderReturn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const lfsnrConfig: HistoryConfig = {
  key: 'lfsnr',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'workOrderReturn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const bktxtConfig: HistoryConfig = {
  key: 'bktxt',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'workOrderReturn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const columns = ref<FieldOption[]>([
  { key: 0, label: `移动类型`, visible: true, children: [] },
  { key: 1, label: `物料凭证号`, visible: true, children: [] },
  { key: 2, label: `凭证项次`, visible: true, children: [] },
  { key: 3, label: `工单号`, visible: true, children: [] },
  { key: 4, label: `物料编码`, visible: true, children: [] },
  { key: 5, label: `物料名称`, visible: true, children: [] },
  { key: 6, label: `批次号`, visible: true, children: [] },
  { key: 7, label: `数量`, visible: true, children: [] },
  { key: 8, label: `特殊库存`, visible: true, children: [] },
  { key: 9, label: `业务伙伴`, visible: true, children: [] },
  { key: 10, label: `伙伴名称`, visible: false, children: [] },
  { key: 11, label: `仓库编码`, visible: false, children: [] },
  { key: 12, label: `库区编码`, visible: false, children: [] },
  { key: 13, label: `库位编码`, visible: true, children: [] }
]);

const transferColumns = ref<FieldOption[]>([
  { key: 0, label: `工单号`, visible: true, children: [] },
  { key: 1, label: `物料编码`, visible: true, children: [] },
  { key: 2, label: `物料名称`, visible: true, children: [] },
  { key: 3, label: `源库位信息`, visible: true, children: [] },
  { key: 4, label: `库存标识`, visible: true, children: [] },
  { key: 5, label: `业务伙伴`, visible: true, children: [] },
  { key: 6, label: `退货数量`, visible: true, children: [] }
]);

const formatQtyWithUnit = (qty?: number | string | null, unit?: string) => {
  const text = formatQty(qty);
  if (!text) {
    return unit || '';
  }
  return unit ? `${text} ${unit}` : text;
};

const disabledFutureDate = (time: Date) => {
  const now = new Date();
  now.setSeconds(now.getSeconds() + 3);
  now.setMilliseconds(0);
  return time.getTime() > now.getTime();
};

function formatPostingDate(postingDate?: string | null): string | undefined {
  if (!postingDate) {
    return undefined;
  }
  return postingDate.includes(' ') ? postingDate : `${postingDate} 00:00:00`;
}

const buildTransferRow = (item: InventoryMovementVO) =>
  enrichWorkOrderReturnRow({
    ...item,
    originId: item.id,
    originQuantity: item.quantity,
    materialCode: item.itemCode,
    materialName: item.itemName,
    quantity: item.quantity,
    currentQuantity: item.quantity || 0,
    returnQuantity: item.quantity,
    inventoryQuantity: item.quantity,
    inventoryUnit: item.unit
  });

const getList = async () => {
  syncSapMaterialOrderNoEmptyFilter(queryParams.value);
  loading.value = true;
  resultMessage.value = '';
  try {
    const res = await listInventoryMovement(queryParams.value);
    const rows = res.rows || [];
    inventoryDetailList.value = rows;
    total.value = res.total || 0;
  } catch (error: any) {
    inventoryDetailList.value = [];
    total.value = 0;
    resultStatus.value = false;
    resultMessage.value = error.message || '查询失败';
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  inventoryDetailList.value = [];
  selectedSearchItems.value = [];
  total.value = 0;
  inventoryTableRef.value?.clearSelection?.();
  resultMessage.value = '';
};

const handleSelectionChange = (selection: InventoryMovementVO[]) => {
  selectedSearchItems.value = selection;
};

const addSelectedToTransferList = async () => {
  if (selectedSearchItems.value.length === 0) {
    proxy.$modal.msgWarning('请先选择要加入的记录');
    return;
  }

  const newItems = selectedSearchItems.value.map(buildTransferRow);
  let addedCount = 0;
  for (const newItem of newItems) {
    const exists = transferList.value.some((item) => item.id === newItem.id);
    if (!exists) {
      transferList.value.push(newItem);
      addedCount++;
      await ensureWorkOrderType(newItem);
    }
  }
  inventoryTableRef.value?.clearSelection?.();
  selectedSearchItems.value = [];
  proxy.$modal.msgSuccess(`成功加入${addedCount}条记录`);
};

const handleReturnPoQuantityChange = (row: any) => {
  row.inventoryQuantity = row.returnQuantity || 0;
};

const removeFromTransferList = (index: number) => {
  transferList.value.splice(index, 1);
};

const clearTransferList = () => {
  transferList.value = [];
  fixedTransferForm.value.lfsnr = '';
  fixedTransferForm.value.bktxt = '';
  resultMessage.value = '';
};

const addManualTransferRow = () => {
  transferList.value.push({
    id: `manual_${Date.now()}_${transferList.value.length}`,
    originId: `manual_${Date.now()}_${transferList.value.length}`,
    originQuantity: 0,
    manualAdd: true,
    sourceDocType: 'WO',
    workOrderNo: '',
    sourceDocCode: '',
    materialCode: '',
    materialName: '',
    itemName: '',
    batchCode: '',
    quantity: 0,
    returnQuantity: undefined,
    unit: '',
    specialInventoryFlag: undefined,
    businessCode: undefined,
    businessName: undefined,
    warehouseCode: undefined,
    areaCode: undefined,
    locationCode: undefined,
    sourceWarehouseCode: undefined,
    sourceAreaCode: undefined,
    sourceLocationCode: undefined
  });
};

const openWorkOrderDialog = (row: any) => {
  workOrderDialog.row = row;
  workOrderDialog.visible = true;
};

const clearInventoryFields = (row: any) => {
  row.batchCode = '';
  row.inventoryDetailId = undefined;
  row.warehouseCode = undefined;
  row.areaCode = undefined;
  row.locationCode = undefined;
  row.sourceWarehouseCode = undefined;
  row.sourceAreaCode = undefined;
  row.sourceLocationCode = undefined;
  row.specialInventoryFlag = undefined;
  row.businessCode = undefined;
  row.businessName = undefined;
  row.availableQuantity = 0;
  row.currentQuantity = 0;
  const originQty = Number(row.originQuantity ?? row.quantity);
  if (row.manualAdd || !Number.isFinite(originQty) || originQty <= 0) {
    row.quantity = 0;
    row.originQuantity = 0;
    row.returnQuantity = undefined;
    row.inventoryQuantity = 0;
  }
};

const applyMaterialToRow = (row: any, materialCode: string, materialName?: string, unit?: string) => {
  row.materialCode = materialCode || '';
  row.itemCode = materialCode || '';
  row.materialName = materialName || '';
  row.itemName = materialName || '';
  if (unit) {
    row.unit = unit;
    row.inventoryUnit = unit;
  }
  clearInventoryFields(row);
};

const ensureWorkOrderType = async (row: any) => {
  const workOrderNo = String(row.workOrderNo || row.sourceDocCode || '').trim();
  if (!workOrderNo) {
    return null;
  }
  const cached = workOrderTypeCache.get(workOrderNo);
  if (cached) {
    row.workOrderType = cached.workOrderType;
    row.workOrderItem = cached.item;
    row.workOrderItemDesc = cached.itemDesc;
    row.workOrderUnit = cached.unit;
    return cached;
  }
  if (row.workOrderType) {
    const info = {
      workOrderType: row.workOrderType,
      item: row.workOrderItem || '',
      itemDesc: row.workOrderItemDesc || '',
      unit: row.workOrderUnit || row.unit || ''
    };
    workOrderTypeCache.set(workOrderNo, info);
    return info;
  }
  try {
    const res = await listWorkOrder({ workOrderNo, pageNum: 1, pageSize: 1 } as any);
    const order = (res.rows || [])[0];
    const info = {
      workOrderType: order?.workOrderType || '',
      item: order?.item || '',
      itemDesc: order?.itemDesc || '',
      unit: order?.unit || ''
    };
    workOrderTypeCache.set(workOrderNo, info);
    row.workOrderType = info.workOrderType;
    row.workOrderItem = info.item;
    row.workOrderItemDesc = info.itemDesc;
    row.workOrderUnit = info.unit;
    return info;
  } catch {
    return null;
  }
};

const loadBomList = async (workOrderNo: string) => {
  if (!workOrderNo) {
    bomList.value = [];
    return;
  }
  bomLoading.value = true;
  try {
    const res = await listWorkOrderBom({ workOrderNo, pageNum: 1, pageSize: 2000 } as any);
    bomList.value = res.rows || [];
  } catch {
    bomList.value = [];
  } finally {
    bomLoading.value = false;
  }
};

const isBomMaterialCode = (code: string) => {
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
};

const applyWorkOrderItemMaterial = (row: any) => {
  const code = String(row.workOrderItem || '').trim();
  if (!code) {
    proxy.$modal.msgWarning('当前工单无产品料号');
    return;
  }
  applyMaterialToRow(row, code, row.workOrderItemDesc || '', row.workOrderUnit || row.unit);
};

const openBomMaterialDialog = async (row: any) => {
  const workOrderNo = String(row.workOrderNo || row.sourceDocCode || '').trim();
  if (!workOrderNo) {
    proxy.$modal.msgWarning('请先选择工单号');
    return;
  }
  materialEditRow.value = row;
  bomKeyword.value = '';
  bomDialogSelectedCode.value = row.itemCode || row.materialCode || '';
  await loadBomList(workOrderNo);
  bomDialogVisible.value = true;
};

const onBomRowChange = (row: WorkOrderBomVO | null) => {
  bomDialogSelectedCode.value = row?.componentMaterial || '';
};

const confirmBomSelect = () => {
  const code = bomDialogSelectedCode.value;
  const row = materialEditRow.value;
  if (!row) return;
  if (!code) {
    proxy.$modal.msgWarning('请选择BOM物料');
    return;
  }
  const bom = bomList.value.find((b) => b.componentMaterial === code);
  if (!bom) {
    proxy.$modal.msgWarning('未找到所选BOM物料');
    return;
  }
  applyMaterialToRow(row, bom.componentMaterial, bom.componentDesc || '', bom.unit || row.unit);
  bomDialogVisible.value = false;
  materialEditRow.value = null;
};

const openAllMaterialDialog = async (row: any) => {
  const rule = getReturnMaterialRule(row.workOrderType);
  filterAllByBom.value = !!rule?.filterAllByBom;
  materialEditRow.value = row;
  if (filterAllByBom.value) {
    const workOrderNo = String(row.workOrderNo || row.sourceDocCode || '').trim();
    if (!workOrderNo) {
      proxy.$modal.msgWarning('请先选择工单号');
      return;
    }
    await loadBomList(workOrderNo);
  }
  itemDialogRef.value?.openDialog();
  itemDialogRef.value?.handleQuery();
};

const handleMaterialSourceCommand = async (row: any, source: MaterialSource) => {
  await ensureWorkOrderType(row);
  if (!canEditMaterial(row)) {
    proxy.$modal.msgWarning('当前工单类型不支持修改物料');
    return;
  }
  if (source === 'workOrder') {
    applyWorkOrderItemMaterial(row);
    return;
  }
  if (source === 'bom') {
    await openBomMaterialDialog(row);
    return;
  }
  await openAllMaterialDialog(row);
};

const openMaterialPicker = async (row: any) => {
  await ensureWorkOrderType(row);
  const rule = getReturnMaterialRule(row.workOrderType);
  if (!rule?.canEditMaterial) {
    proxy.$modal.msgWarning('当前工单类型不支持修改物料');
    return;
  }
  const source = rule.sources.length === 1 ? rule.sources[0] : rule.defaultSource;
  await handleMaterialSourceCommand(row, source);
};

const itemSelectCallBack = (record: any) => {
  const row = materialEditRow.value;
  if (!row || !record) {
    return;
  }
  const code = record.item || '';
  if (filterAllByBom.value && isBomMaterialCode(code)) {
    proxy.$modal.msgWarning(`物料 ${code} 属于当前工单 BOM，请勿在「所有料号」中选择`);
    return;
  }
  applyMaterialToRow(row, code, record.itemDesc || '', record.unit || row.unit);
  materialEditRow.value = null;
  filterAllByBom.value = false;
};

const handleWorkOrderSelection = async (orders: any[]) => {
  const selected = orders?.[0];
  const row = workOrderDialog.row;
  if (row && selected) {
    row.workOrderNo = selected.workOrderNo;
    row.sourceDocType = 'WO';
    row.sourceDocCode = selected.workOrderNo;
    row.workOrderType = selected.workOrderType || '';
    row.workOrderItem = selected.item || '';
    row.workOrderItemDesc = selected.itemDesc || '';
    row.workOrderUnit = selected.unit || '';
    workOrderTypeCache.set(String(selected.workOrderNo), {
      workOrderType: row.workOrderType,
      item: row.workOrderItem,
      itemDesc: row.workOrderItemDesc,
      unit: row.workOrderUnit
    });
    const rule = getReturnMaterialRule(row.workOrderType);
    if (rule?.useWorkOrderItemAsDefault || !rule?.canEditMaterial) {
      row.materialCode = selected.item || row.materialCode;
      row.itemCode = selected.item || row.itemCode;
      row.materialName = selected.itemDesc || row.materialName;
      row.itemName = selected.itemDesc || row.itemName;
      row.unit = selected.unit || row.unit;
      row.inventoryUnit = selected.unit || row.inventoryUnit || row.unit;
    } else if (rule?.canEditMaterial && !rule.useWorkOrderItemAsDefault) {
      // ZP92 等默认不带工单成品料号
      row.materialCode = '';
      row.itemCode = '';
      row.materialName = '';
      row.itemName = '';
      clearInventoryFields(row);
    }
  }
  workOrderDialog.visible = false;
};

const toNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const roundQty = (value: number) => Number(value.toFixed(3));

const resolveDemandKey = (row: any) =>
  String(row.originId || row.id || `${row.workOrderNo || row.sourceDocCode || ''}_${row.itemCode || row.materialCode || ''}`);

const resolveAllocatedReturnQuantity = (row: any, excludeIndex?: number) => {
  const key = resolveDemandKey(row);
  return roundQty(
    transferList.value.reduce((sum, item, index) => {
      if (excludeIndex != null && index === excludeIndex) {
        return sum;
      }
      if (resolveDemandKey(item) !== key) {
        return sum;
      }
      return sum + toNumber(item.returnQuantity);
    }, 0)
  );
};

const resolveRemainingReturnQuantity = (row: any, excludeIndex?: number) => {
  const maxQty = toNumber(row.originQuantity ?? row.quantity);
  return Math.max(0, roundQty(maxQty - resolveAllocatedReturnQuantity(row, excludeIndex)));
};

/** 无来源数量上限（手动新增行）时，按所选库存生成退货数量 */
const isUnlimitedReturnDemand = (row: any) => !!row.manualAdd || toNumber(row.originQuantity ?? row.quantity) <= 0;

const resolveReturnQuantityMax = (row: any) => {
  const maxQty = toNumber(row.originQuantity ?? row.quantity ?? row.availableQuantity);
  return maxQty > 0 ? maxQty : undefined;
};

const openInventoryDialog = (index: number, row: any) => {
  if (!String(row.materialCode || row.itemCode || '').trim()) {
    proxy.$modal.msgWarning('请先选择工单号或填写物料编码');
    return;
  }
  inventoryDialog.index = index;
  inventoryDialog.row = row;
  // 手动行 / 无来源数量：不传需求上限，按用户勾选库存自动带出数量
  if (isUnlimitedReturnDemand(row)) {
    inventoryDialog.issueQty = 0;
  } else {
    const remainingQty = resolveRemainingReturnQuantity(row, index);
    inventoryDialog.issueQty = remainingQty > 0 ? remainingQty : toNumber(row.returnQuantity || row.quantity);
  }
  inventoryDialog.visible = true;
};

const applyInventorySelection = (payload: { locations: any[] }) => {
  const index = inventoryDialog.index;
  const source = transferList.value[index];
  const locations = payload.locations || [];
  if (!source || !locations.length) {
    return;
  }

  const unlimitedDemand = isUnlimitedReturnDemand(source);
  const originId = source.originId || source.id;
  const originQuantity = toNumber(source.originQuantity ?? source.quantity);
  let remainDemand = unlimitedDemand
    ? Number.POSITIVE_INFINITY
    : resolveRemainingReturnQuantity(source, index) || toNumber(source.returnQuantity || source.quantity);

  const splitRows = locations
    .map((location, locationIndex) => {
      const available = toNumber(location.availableQuantity);
      const requested = toNumber(location.pickQty);
      const returnQuantity = roundQty(Math.max(0, Math.min(requested, available, remainDemand)));
      if (!unlimitedDemand) {
        remainDemand = Math.max(0, roundQty(remainDemand - returnQuantity));
      }
      const rowOriginQuantity = unlimitedDemand ? available : originQuantity || available;
      const rowOriginId = unlimitedDemand ? `${originId}_${location.rowKey || location.id || locationIndex}` : originId;
      return {
        ...source,
        id: unlimitedDemand ? rowOriginId : source.id,
        originId: rowOriginId,
        originQuantity: rowOriginQuantity,
        inventoryDetailId: location.id,
        materialCode: location.itemCode || source.materialCode,
        itemCode: location.itemCode || source.itemCode,
        materialName: location.itemName || source.materialName,
        itemName: location.itemName || source.itemName,
        sourceDocType: 'WO',
        sourceDocCode: String(source.workOrderNo || source.sourceDocCode || '').trim(),
        batchCode: location.batchCode || '',
        warehouseCode: location.warehouseCode,
        areaCode: location.areaCode,
        locationCode: location.locationCode,
        sourceWarehouseCode: location.warehouseCode,
        sourceAreaCode: location.areaCode,
        sourceLocationCode: location.locationCode,
        specialInventoryFlag: location.specialInventoryFlag || '',
        quantity: rowOriginQuantity,
        currentQuantity: available,
        inventoryQuantity: returnQuantity,
        availableQuantity: available,
        returnQuantity,
        unit: location.unit || source.unit,
        inventoryUnit: location.unit || source.inventoryUnit || source.unit,
        businessCode: location.businessCode || '',
        businessName: location.businessName || '',
        inventorySplitKey: `${originId}_${location.rowKey || location.id || locationIndex}`
      };
    })
    .filter((row) => toNumber(row.returnQuantity) > 0);

  if (!splitRows.length) {
    proxy.$modal.msgWarning('请选择库存并填写本次数量');
    return;
  }

  transferList.value.splice(index, 1, ...splitRows);
  inventoryDialog.visible = false;
  inventoryDialog.index = -1;
  inventoryDialog.row = null;
  inventoryDialog.issueQty = 0;
};

const submitTransfer = async () => {
  const validTransfers = transferList.value.filter((item) => Number(item.returnQuantity || 0) > 0);
  resultStatus.value = true;
  resultMessage.value = '';
  if (validTransfers.length === 0) {
    resultMessage.value = '没有有效的入库取消记录';
    resultStatus.value = false;
    return;
  }
  const missingWorkOrderItems = validTransfers.filter((item) => !String(item.workOrderNo || item.sourceDocCode || '').trim());
  if (missingWorkOrderItems.length > 0) {
    resultMessage.value = '请填写所有入库取消行的工单号';
    resultStatus.value = false;
    return;
  }
  const missingLocationItems = validTransfers.filter((item) => !item.locationCode);
  if (missingLocationItems.length > 0) {
    resultMessage.value = '请为所有入库取消行选择源库存明细';
    resultStatus.value = false;
    return;
  }
  const overQuantityItems = validTransfers.filter((item) => {
    const maxQty = toNumber(item.originQuantity || item.quantity || item.availableQuantity);
    return maxQty > 0 && Number(item.returnQuantity || 0) > maxQty;
  });
  if (overQuantityItems.length > 0) {
    resultMessage.value = '退货数量不能超过当前可用数量';
    resultStatus.value = false;
    return;
  }
  const demandTotals = new Map<string, { originQuantity: number; returnQuantity: number }>();
  for (const item of validTransfers) {
    if (item.manualAdd || isUnlimitedReturnDemand(item)) {
      continue;
    }
    const key = resolveDemandKey(item);
    const current = demandTotals.get(key) || { originQuantity: toNumber(item.originQuantity ?? item.quantity), returnQuantity: 0 };
    current.returnQuantity = roundQty(current.returnQuantity + toNumber(item.returnQuantity));
    current.originQuantity = toNumber(item.originQuantity ?? item.quantity) || current.originQuantity;
    demandTotals.set(key, current);
  }
  if ([...demandTotals.values()].some((item) => item.originQuantity > 0 && item.returnQuantity > item.originQuantity)) {
    resultMessage.value = '同一来源行的退货数量合计不能超过可用数量';
    resultStatus.value = false;
    return;
  }
  buttonLoading1.value = true;
  try {
    const transferRequests = validTransfers.map((item) =>
      buildWorkOrderReturnBo(
        {
          ...item,
          sourceDocType: 'WO',
          sourceDocCode: String(item.workOrderNo || item.sourceDocCode || '').trim(),
          workOrderNo: String(item.workOrderNo || item.sourceDocCode || '').trim()
        },
        {}
      )
    );
    const res: any = await workOrderOutbound({
      lfsnr: fixedTransferForm.value.lfsnr,
      bktxt: fixedTransferForm.value.bktxt,
      postingDate: formatPostingDate(fixedTransferForm.value.postingDate),
      workOrderInOutBoundList: transferRequests
    });

    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg;
      resultStatus.value = false;
      return;
    }
    resultMessage.value = res.msg || `成功取消${validTransfers.length}条入库记录`;
    resultStatus.value = true;
    transferList.value = [];
    fixedTransferForm.value.lfsnr = '';
    fixedTransferForm.value.bktxt = '';
    fixedTransferForm.value.postingDate = null;
  } catch (error: any) {
    resultMessage.value = error.message || '入库取消失败';
    resultStatus.value = false;
  } finally {
    buttonLoading1.value = false;
  }
};
</script>

<style scoped>
.work-order-return-page {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-card {
  flex: 0 0 auto;
}

.history-card :deep(.el-card__header) {
  padding: 10px 16px;
}

.history-card :deep(.el-card__body) {
  padding: 0;
}

.history-card.is-history-collapsed :deep(.el-card__body) {
  display: none;
}

.history-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.transfer-main-card {
  flex: 1 1 auto;
}

.transfer-main-card :deep(.el-card__header) {
  padding: 10px 16px;
}

.transfer-main-card.is-transfer-collapsed :deep(.el-card__body) {
  display: none;
}

.transfer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.history-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.history-collapse-icon {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  transition: transform 0.2s;
}

.history-collapse-icon.is-expanded {
  transform: rotate(90deg);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.history-header-title {
  font-size: 16px;
  font-weight: 600;
}

.history-card-body {
  padding: 12px 16px 16px;
}

.search-result {
  overflow: auto;
}

.add-transfer-bar {
  text-align: center;
  padding: 4px 0;
}

.rotate-button {
  transform: rotate(90deg);
  margin: 0 auto;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.transfer-card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.query-panel {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.source-location-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.list-footer-actions {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.qty-with-unit-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.qty-unit-text {
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.radio-no-label :deep(.el-radio__label) {
  display: none;
}
</style>
