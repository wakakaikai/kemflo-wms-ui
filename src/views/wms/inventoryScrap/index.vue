<template>
  <div class="transfer-page p-2">
    <el-card shadow="never" class="inventory-card">
      <template #header>
        <div class="inventory-card-header">
          <div class="inventory-header-left" @click="inventoryExpanded = !inventoryExpanded">
            <el-icon class="inventory-collapse-icon" :class="{ 'is-expanded': inventoryExpanded }">
              <ArrowRight />
            </el-icon>
            <span class="inventory-header-title">库存明细</span>
          </div>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList" />
        </div>
      </template>

      <div v-show="inventoryExpanded" class="inventory-card-body">
        <el-form v-show="showSearch" ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto" class="compact-form">
          <el-form-item label="物料编码" prop="itemCodeStr">
            <HistoryInput v-model="queryParams.itemCodeStr" :config="itemCodeConfig" placeholder="请输入物料编码" @keyup.enter="handleQuery">
              <template #append>
                <el-button icon="CopyDocument" @click="openBatchInputDialog" title="批量录入物料编码" />
              </template>
            </HistoryInput>
          </el-form-item>
          <el-form-item label="仓库编码" prop="warehouseCode">
            <HistoryInput v-model.trim="queryParams.warehouseCode" :config="warehouseCodeConfig" placeholder="请输入仓库编码" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="库位编码" prop="locationCode">
            <HistoryInput v-model.trim="queryParams.locationCode" :config="locationCodeConfig" placeholder="请输入库位编码" @keyup.enter="handleQuery" />
          </el-form-item>
          <div v-show="showAdvancedSearch">
            <el-form-item label="特殊库存" prop="specialInventoryFlag">
              <el-select v-model="queryParams.specialInventoryFlag" placeholder="请选择特殊库存标识" filterable clearable>
                <el-option v-for="dict in wms_inventory_special_flag" :key="dict.value" :label="dict.value + ' - ' + dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="业务伙伴" prop="businessCode">
              <HistoryInput v-model="queryParams.businessCode" :config="businessCodeConfig" placeholder="请输入业务伙伴" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="批次号" prop="batchCode">
              <el-input v-model="queryParams.batchCode" placeholder="请输入批次号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
          </div>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery" :loading="loading">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            <el-button link type="primary" @click="toggleAdvancedSearch">
              {{ showAdvancedSearch ? '收起' : '高级搜索' }}
              <el-icon class="el-icon--right">
                <ArrowDown v-if="!showAdvancedSearch" />
                <ArrowUp v-else />
              </el-icon>
            </el-button>
          </el-form-item>
        </el-form>

        <div class="search-result">
          <el-table ref="inventoryTableRef" :data="inventoryDetailList" height="180" border v-loading="loading" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="40" align="center" />
            <el-table-column v-if="columns[0].visible" align="left" prop="itemCode" min-width="100" show-overflow-tooltip>
              <template #header>
                <InventorySortHeader label="物料编码" v-bind="getSortState('itemCode')" @toggle="toggleSort('itemCode')" />
              </template>
            </el-table-column>
            <el-table-column v-if="columns[1].visible" label="物料名称" align="left" prop="itemName" min-width="120" show-overflow-tooltip />
            <el-table-column v-if="columns[2].visible" align="center" prop="batchCode" min-width="90" show-overflow-tooltip>
              <template #header>
                <InventorySortHeader label="批次号" v-bind="getSortState('batchCode')" @toggle="toggleSort('batchCode')" />
              </template>
            </el-table-column>
            <el-table-column v-if="columns[3].visible" label="非限制数量" align="left" min-width="90">
              <template #default="scope">{{ formatQty(scope.row.availableQuantity) }}</template>
            </el-table-column>
            <el-table-column v-if="columns[4].visible" label="质检数量" align="left" min-width="80">
              <template #default="scope">{{ formatQty(scope.row.inspectionQuantity) }}</template>
            </el-table-column>
            <el-table-column v-if="columns[5].visible" label="冻结数量" align="left" min-width="80">
              <template #default="scope">{{ formatQty(scope.row.blockedQuantity) }}</template>
            </el-table-column>
            <el-table-column v-if="columns[6].visible" label="在途" align="right" prop="transitQuantity" min-width="70">
              <template #default="scope">{{ formatQty(scope.row.transitQuantity) }}</template>
            </el-table-column>
            <el-table-column v-if="columns[7].visible" label="特殊库存" align="center" prop="specialInventoryFlag" min-width="80">
              <template #default="scope">
                <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
              </template>
            </el-table-column>
            <el-table-column v-if="columns[8].visible && showInventoryBusinessPartnerColumn" label="业务伙伴" align="center" min-width="90">
              <template #default="scope">
                <span v-if="scope.row.specialInventoryFlag">{{ scope.row.businessCode }}</span>
              </template>
            </el-table-column>
            <el-table-column v-if="columns[9].visible && showInventoryBusinessPartnerColumn" label="伙伴名称" align="center" min-width="100" show-overflow-tooltip>
              <template #default="scope">
                <span v-if="scope.row.specialInventoryFlag && scope.row.specialInventoryFlag !== 'N'">{{ scope.row.businessName }}</span>
              </template>
            </el-table-column>
            <el-table-column v-if="columns[10].visible" label="单位" align="center" prop="unit" width="80" />
            <el-table-column v-if="columns[11].visible" align="left" prop="warehouseCode" min-width="70" show-overflow-tooltip>
              <template #header>
                <InventorySortHeader label="仓库" v-bind="getSortState('warehouseCode')" @toggle="toggleSort('warehouseCode')" />
              </template>
            </el-table-column>
            <el-table-column v-if="columns[12].visible" label="库区" align="left" prop="areaCode" min-width="70" show-overflow-tooltip />
            <el-table-column v-if="columns[13].visible" align="left" prop="locationCode" min-width="90" show-overflow-tooltip>
              <template #header>
                <InventorySortHeader label="库位" v-bind="getSortState('locationCode')" @toggle="toggleSort('locationCode')" />
              </template>
            </el-table-column>
          </el-table>
          <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" class="compact-pagination" />
        </div>
      </div>
    </el-card>

    <div class="add-transfer-bar">
      <el-button type="primary" @click="addSelectedToScrapList" circle class="rotate-button">
        <el-icon><Switch /></el-icon>
      </el-button>
    </div>

    <el-card shadow="never" class="transfer-main-card">
      <template #header>
        <div class="transfer-header">
          <span class="header-title">报废列表</span>
          <div class="header-actions">
            <el-form :inline="true" class="move-type-form">
              <el-form-item label="">
                <el-select v-model="moveType" style="width: 280px" @change="handleMoveTypeChange">
                  <el-option v-for="item in moveTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <span class="move-type-desc">{{ moveTypeDesc }}</span>
              </el-form-item>
            </el-form>
            <el-checkbox v-model="skipSap">仅WMS过账</el-checkbox>
            <el-button type="danger" @click="clearScrapList" :disabled="scrapList.length === 0">清空</el-button>
            <right-toolbar :search="false" :columns="scrapColumns" />
          </div>
        </div>
      </template>

      <div class="transfer-form-bar">
        <el-form :model="scrapForm" label-width="auto" :inline="true">
          <el-row :gutter="12">
            <el-col :sm="24" :md="8" :lg="8">
              <el-form-item label="物料单">
                <HistoryInput v-model="scrapForm.mtsnr" :config="mtsnrConfig" placeholder="请输入物料单" />
              </el-form-item>
            </el-col>
            <el-col :sm="24" :md="7" :lg="7">
              <el-form-item label="凭证抬头文本">
                <HistoryInput v-model="scrapForm.bktxt" :config="bktxtConfig" placeholder="请输入凭证抬头文本" />
              </el-form-item>
            </el-col>
            <el-col :sm="24" :md="1" :lg="1" class="transfer-more-toggle-col">
              <el-form-item label-width="0">
                <el-button link type="primary" @click="showScrapMore = !showScrapMore">
                  <el-icon class="el-icon--right">
                    <ArrowDown v-if="!showScrapMore" />
                    <ArrowUp v-else />
                  </el-icon>
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row v-show="showScrapMore" :gutter="12" class="transfer-form-more">
            <el-col :sm="24" :md="8" :lg="8">
              <el-form-item label="过账日期" prop="postingDate">
                <el-date-picker clearable v-model="scrapForm.postingDate" type="date" :disabled-date="disabledFutureDate" value-format="YYYY-MM-DD" placeholder="请选择过账日期" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div v-if="resultMessage" class="result-alert">
        <el-alert show-icon center :title="resultMessage" :type="resultStatus ? 'success' : 'error'" :closable="false">
          <template #icon>
            <Bell />
          </template>
        </el-alert>
      </div>

      <el-table :data="scrapList" border class="transfer-table" v-loading="tableLoading" :max-height="scrapTableHeight">
        <el-table-column type="index" width="40" align="center" />
        <el-table-column v-if="scrapColumns[0].visible" label="物料编码" prop="itemCode" min-width="100" show-overflow-tooltip />
        <el-table-column v-if="scrapColumns[1].visible" label="物料名称" prop="itemName" min-width="120" show-overflow-tooltip />
        <el-table-column v-if="scrapColumns[2].visible" label="批次号" prop="batchCode" min-width="90" show-overflow-tooltip />
        <el-table-column v-if="scrapColumns[3].visible" label="源库位信息" width="180">
          <template #default="scope">
            <div>
              <div>仓库: {{ scope.row.sourceWarehouseCode }}</div>
              <div>库区: {{ scope.row.sourceAreaCode }}</div>
              <div>库位: {{ scope.row.sourceLocationCode }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="scrapColumns[4].visible" label="数量" min-width="180">
          <template #default="scope">
            <div>
              <div>非限制数量: {{ formatQty(scope.row.availableQuantity) }}</div>
              <div>质 检 数 量: {{ formatQty(scope.row.inspectionQuantity) }}</div>
              <div>冻 结 数 量: {{ formatQty(scope.row.blockedQuantity) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="scrapColumns[5].visible" label="单位" prop="unit" align="center" width="80" />
        <el-table-column v-if="scrapColumns[6].visible" label="库存标识" align="center" prop="specialInventoryFlag" min-width="90">
          <template #default="scope">
            <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
          </template>
        </el-table-column>
        <el-table-column v-if="scrapColumns[7].visible && showBusinessPartnerColumn" label="业务伙伴" align="center" min-width="110">
          <template #default="scope">
            <template v-if="scope.row.specialInventoryFlag && scope.row.specialInventoryFlag !== 'N'">
              <el-input v-model="scope.row.supplierCode" placeholder="供应商寄售编码" v-if="scope.row.specialInventoryFlag === 'K'" />
              <el-input v-model="scope.row.customerCode" placeholder="客户寄售编码" v-else-if="scope.row.specialInventoryFlag === 'W'" />
              <span v-else-if="scope.row.specialInventoryFlag === 'E'">{{ scope.row.businessCode }}</span>
              <span v-else>{{ scope.row.businessCode || '-' }}</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column v-if="scrapColumns[8].visible" label="库存类型" prop="inventoryType" align="center" min-width="110">
          <template #default="scope">
            <el-select v-model="scope.row.inventoryType" placeholder="请选择库存类型" style="width: 100%" disabled>
              <el-option label="非限制库存" value="N"></el-option>
              <el-option label="质检库存" value="X"></el-option>
              <el-option label="冻结库存" value="S"></el-option>
            </el-select>
          </template>
        </el-table-column>
        <el-table-column v-if="scrapColumns[9].visible" label="报废数量" width="115">
          <template #default="scope">
            <el-input-number v-model="scope.row.transferQuantity" :min="0" :max="scope.row.currentQuantity ? parseFloat(scope.row.currentQuantity) : scope.row.currentQuantity" :precision="3" controls-position="right" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column v-if="scrapColumns[10].visible && showMoveReasonColumn" label="移动原因" min-width="180">
          <template #default="scope">
            <el-select v-model="scope.row.moveReasonCode" placeholder="请选择移动原因" clearable filterable :loading="moveTypeReasonLoading" style="width: 100%" @change="(code: string) => handleRowMoveReasonChange(scope.row, code)">
              <el-option v-for="item in moveTypeReasonOptions" :key="item.id" :label="item.moveReasonCode + ' - ' + item.moveReasonDesc" :value="item.moveReasonCode" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="scope">
            <el-button type="danger" link icon="Delete" @click="removeFromScrapList(scope.$index)"></el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="submit-bar">
        <el-button :loading="buttonLoading" type="primary" @click="submitScrap" :disabled="scrapList.length === 0">{{ moveType }} {{ moveTypeDesc }}</el-button>
        <span class="transfer-count">共 {{ scrapList.length }} 条</span>
      </div>
    </el-card>

    <BatchInputDialog ref="batchInputDialogRef" v-model="batchInputDialogVisible" title="批量录入物料编码" placeholder="请输入物料编码，支持多行粘贴" @confirm="handleBatchInputConfirm" />
  </div>
</template>

<script setup name="InventoryScrap" lang="ts">
import { computed, ref, reactive, onMounted } from 'vue';
import { listInventoryDetail, transferInventory } from '@/api/wms/inventoryDetail';
import { InventoryDetailForm, InventoryDetailQuery, InventoryDetailVO } from '@/api/wms/inventoryDetail/types';
import { ArrowDown, ArrowRight, ArrowUp, Bell, Switch } from '@element-plus/icons-vue';
import BatchInputDialog from '@/components/BatchInputDialog/index.vue';
import HistoryInput from '@/components/HistoryInput/index.vue';
import { HistoryConfig } from '@/types/history';
import { HttpStatus } from '@/enums/RespEnum';
import { listMoveTypeReason } from '@/api/wms/moveTypeReason';
import type { MoveTypeReasonVO } from '@/api/wms/moveTypeReason/types';
import { DEFAULT_SCRAP_MOVE_TYPE, getDefaultSourceInventoryType, getScrapMoveTypeDesc, INVENTORY_SCRAP_MOVE_TYPES } from './utils/scrapMoveConfig';
import InventorySortHeader from '@/views/wms/components/InventorySortHeader.vue';
import { applyInventorySortToQuery, createDefaultInventorySortRules, getInventorySortState, toggleInventorySort, type InventorySortKey, type InventorySortRule } from '@/views/wms/components/inventorySort';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));

const showSearch = ref(true);
const inventoryExpanded = ref(true);
const sortRules = ref<InventorySortRule[]>(createDefaultInventorySortRules());
const getSortState = (key: InventorySortKey) => getInventorySortState(sortRules.value, key);
const toggleSort = (key: InventorySortKey) => {
  sortRules.value = toggleInventorySort(sortRules.value, key);
};
const scrapTableHeight = 'calc(100vh - 320px)';

const loading = ref(false);
const tableLoading = ref(false);
const buttonLoading = ref(false);
const inventoryDetailList = ref<InventoryDetailVO[]>([]);
const showInventoryBusinessPartnerColumn = computed(() => inventoryDetailList.value.some((item) => item.specialInventoryFlag && item.specialInventoryFlag !== 'N'));
const selectedSearchItems = ref<InventoryDetailVO[]>([]);
const scrapList = ref<any[]>([]);
const showAdvancedSearch = ref(false);
const showScrapMore = ref(false);
const total = ref(0);
const resultMessage = ref('');
const resultStatus = ref(false);

const batchInputDialogVisible = ref(false);
const batchInputDialogRef = ref<InstanceType<typeof BatchInputDialog>>();

const moveType = ref(DEFAULT_SCRAP_MOVE_TYPE);
const moveTypeReasonOptions = ref<MoveTypeReasonVO[]>([]);
const moveTypeReasonLoading = ref(false);
const skipSap = ref(false);
const moveTypeOptions = INVENTORY_SCRAP_MOVE_TYPES;
const moveTypeDesc = computed(() => getScrapMoveTypeDesc(moveType.value));
const showBusinessPartnerColumn = computed(() => scrapList.value.some((item) => item.specialInventoryFlag && item.specialInventoryFlag !== 'N'));
const showMoveReasonColumn = computed(() => moveTypeReasonOptions.value.length > 0);

const scrapForm = ref({
  mtsnr: '',
  bktxt: '',
  postingDate: null as string | null
});

const queryFormRef = ref<any>(null);
const inventoryTableRef = ref(null);

const historyPage = 'inventoryScrap';
const buildHistoryConfig = (key: string): HistoryConfig => ({
  key,
  storage: 'indexedDB',
  maxSize: 10,
  page: historyPage,
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
});

const itemCodeConfig = buildHistoryConfig('itemCode');
const locationCodeConfig = buildHistoryConfig('locationCode');
const businessCodeConfig = buildHistoryConfig('businessCode');
const warehouseCodeConfig = buildHistoryConfig('warehouseCode');
const mtsnrConfig = buildHistoryConfig('mtsnr');
const bktxtConfig = buildHistoryConfig('bktxt');

function formatPostingDate(postingDate?: string | null): string | undefined {
  if (!postingDate) {
    return undefined;
  }
  return postingDate.includes(' ') ? postingDate : `${postingDate} 00:00:00`;
}

function resolveBatchBktxt(bktxt?: string | null): string | undefined {
  return bktxt?.trim() || undefined;
}

function resolveMtsnr(mtsnr?: string | null): string | undefined {
  return mtsnr?.trim() || undefined;
}

const initFormData: InventoryDetailForm = {
  id: undefined,
  itemType: undefined,
  itemCode: undefined,
  itemName: undefined,
  batchCode: undefined,
  availableQuantity: undefined,
  inspectionQuantity: undefined,
  blockedQuantity: undefined,
  unit: undefined,
  specialInventoryFlag: undefined,
  warehouseCode: undefined,
  areaCode: undefined,
  locationCode: undefined,
  businessCode: undefined,
  businessName: undefined,
  remark: undefined
};

const data = reactive<PageData<InventoryDetailForm, InventoryDetailQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    itemType: undefined,
    itemCode: undefined,
    itemCodeStr: undefined,
    itemCodeList: [],
    itemName: undefined,
    batchCode: undefined,
    availableQuantity: undefined,
    inspectionQuantity: undefined,
    blockedQuantity: undefined,
    unit: undefined,
    specialInventoryFlag: undefined,
    warehouseCode: undefined,
    areaCode: undefined,
    locationCode: undefined,
    businessCode: undefined,
    businessName: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    itemCode: [{ required: true, message: '物料编码不能为空', trigger: 'blur' }],
    itemName: [{ required: true, message: '物料名称不能为空', trigger: 'blur' }]
  }
});

const { queryParams } = toRefs(data);

const columns = ref<FieldOption[]>([
  { key: 0, label: `物料编码`, visible: true, children: [] },
  { key: 1, label: `物料名称`, visible: true, children: [] },
  { key: 2, label: `批次号`, visible: true, children: [] },
  { key: 3, label: `非限制数量`, visible: true, children: [] },
  { key: 4, label: `质检数量`, visible: true, children: [] },
  { key: 5, label: `冻结数量`, visible: true, children: [] },
  { key: 6, label: `在途数量`, visible: false, children: [] },
  { key: 7, label: `特殊库存`, visible: true, children: [] },
  { key: 8, label: `业务伙伴`, visible: true, children: [] },
  { key: 9, label: `伙伴名称`, visible: false, children: [] },
  { key: 10, label: `单位`, visible: true, children: [] },
  { key: 11, label: `仓库编码`, visible: false, children: [] },
  { key: 12, label: `库区编码`, visible: false, children: [] },
  { key: 13, label: `库位编码`, visible: true, children: [] }
]);

const scrapColumns = ref<FieldOption[]>([
  { key: 0, label: `物料编码`, visible: true, children: [] },
  { key: 1, label: `物料名称`, visible: true, children: [] },
  { key: 2, label: `批次号`, visible: true, children: [] },
  { key: 3, label: `源库位信息`, visible: true, children: [] },
  { key: 4, label: `数量`, visible: true, children: [] },
  { key: 5, label: `单位`, visible: false, children: [] },
  { key: 6, label: `库存标识`, visible: true, children: [] },
  { key: 7, label: `业务伙伴`, visible: true, children: [] },
  { key: 8, label: `库存类型`, visible: true, children: [] },
  { key: 9, label: `报废数量`, visible: true, children: [] },
  { key: 10, label: `移动原因`, visible: true, children: [] }
]);

const disabledFutureDate = (time: Date) => {
  const now = new Date();
  now.setSeconds(now.getSeconds() + 3);
  now.setMilliseconds(0);
  return time.getTime() > now.getTime();
};

const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value;
};

const getList = async () => {
  loading.value = true;
  applyInventorySortToQuery(queryParams.value, sortRules.value);
  const res = await listInventoryDetail(queryParams.value);
  inventoryDetailList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  const str = String(queryParams.value.itemCodeStr || '').trim();
  queryParams.value.itemCodeList = str ? str.split(/[,;，；\s]+/).filter(Boolean) : [];
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  inventoryTableRef.value?.clearSelection();
  queryParams.value.itemCodeStr = undefined;
  queryParams.value.itemCodeList = [];
  sortRules.value = createDefaultInventorySortRules();
  batchInputDialogRef.value?.resetInput();
  handleQuery();
};

const handleSelectionChange = (selection: InventoryDetailVO[]) => {
  selectedSearchItems.value = selection;
};

const addSelectedToScrapList = () => {
  if (selectedSearchItems.value.length === 0) {
    proxy.$modal.msgWarning('请先选择要添加的库存');
    return;
  }

  const sourceInventoryType = getDefaultSourceInventoryType();
  const newItems = selectedSearchItems.value.map((item) => {
    const currentQuantity = item.availableQuantity || 0;
    return {
      id: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      batchCode: item.batchCode,
      currentQuantity,
      availableQuantity: item.availableQuantity,
      inspectionQuantity: item.inspectionQuantity,
      blockedQuantity: item.blockedQuantity,
      unit: item.unit,
      sourceWarehouseCode: item.warehouseCode,
      sourceAreaCode: item.areaCode,
      sourceLocationCode: item.locationCode,
      targetWarehouseCode: item.warehouseCode,
      targetAreaCode: item.areaCode,
      targetLocationCode: item.locationCode,
      specialInventoryFlag: item.specialInventoryFlag,
      inventoryType: sourceInventoryType,
      targetInventoryType: sourceInventoryType,
      transferQuantity: null,
      businessCode: item.businessCode,
      businessName: item.businessName,
      supplierCode: item.specialInventoryFlag === 'K' ? item.businessCode : '',
      customerCode: item.specialInventoryFlag === 'W' ? item.businessCode : '',
      moveReasonCode: '',
      moveReasonDesc: ''
    };
  });

  let addedCount = 0;
  newItems.forEach((newItem) => {
    scrapList.value.push(newItem);
    addedCount++;
  });

  proxy.$modal.msgSuccess(`成功添加${addedCount}条记录到报废列表`);
};

const removeFromScrapList = (index: number) => {
  scrapList.value.splice(index, 1);
};

const clearScrapList = () => {
  scrapList.value = [];
};

function resolveMoveReasonDesc(code?: string | null): string | undefined {
  if (!code) {
    return undefined;
  }
  return moveTypeReasonOptions.value.find((item) => item.moveReasonCode === code)?.moveReasonDesc;
}

function handleRowMoveReasonChange(row: any, code: string) {
  row.moveReasonDesc = resolveMoveReasonDesc(code) || '';
}

const loadMoveTypeReasonOptions = async () => {
  if (!moveType.value) {
    moveTypeReasonOptions.value = [];
    return;
  }
  moveTypeReasonLoading.value = true;
  try {
    const res = await listMoveTypeReason({
      moveType: moveType.value,
      pageNum: 1,
      pageSize: 500
    });
    moveTypeReasonOptions.value = res.rows || [];
  } catch {
    moveTypeReasonOptions.value = [];
  } finally {
    moveTypeReasonLoading.value = false;
  }
};

const handleMoveTypeChange = async () => {
  resultMessage.value = '';
  await loadMoveTypeReasonOptions();
  const sourceInventoryType = getDefaultSourceInventoryType();
  scrapList.value.forEach((item) => {
    item.inventoryType = sourceInventoryType;
    item.targetInventoryType = sourceInventoryType;
    item.moveReasonCode = '';
    item.moveReasonDesc = '';
  });
};

const submitScrap = async () => {
  const validItems = scrapList.value.filter((item) => item.transferQuantity > 0);
  resultStatus.value = true;
  resultMessage.value = '';
  if (validItems.length === 0) {
    resultMessage.value = '没有有效的报废记录';
    resultStatus.value = false;
    return;
  }

  validItems.forEach((item) => {
    item.targetWarehouseCode = item.sourceWarehouseCode;
    item.targetAreaCode = item.sourceAreaCode;
    item.targetLocationCode = item.sourceLocationCode;
    item.targetInventoryType = item.inventoryType;
  });

  const overQuantityItems = validItems.filter((item) => item.transferQuantity > item.currentQuantity);
  if (overQuantityItems.length > 0) {
    resultMessage.value = '报废数量不能超过当前可用数量';
    resultStatus.value = false;
    return;
  }

  if (skipSap.value) {
    try {
      await proxy?.$modal.confirm('已开启「仅WMS过账」，本次将跳过 SAP 过账，是否确认继续？');
    } catch {
      return;
    }
  }

  buttonLoading.value = true;
  try {
    const transferRequests = validItems.map((item) => ({
      ...item,
      inventoryDetailId: item.id,
      moveType: moveType.value,
      targetWarehouseCode: item.targetWarehouseCode,
      targetAreaCode: item.targetAreaCode,
      targetLocationCode: item.targetLocationCode,
      targetInventoryType: item.targetInventoryType,
      transferQuantity: item.transferQuantity,
      specialInventoryFlag: item.specialInventoryFlag,
      businessCode: item.businessCode,
      businessName: item.businessName,
      moveReasonCode: item.moveReasonCode || undefined,
      moveReasonDesc: item.moveReasonDesc || resolveMoveReasonDesc(item.moveReasonCode)
    }));

    const res: any = await transferInventory({
      inventoryTransferBoList: transferRequests,
      transferType: 0,
      moveType: moveType.value,
      mtsnr: resolveMtsnr(scrapForm.value.mtsnr),
      bktxt: resolveBatchBktxt(scrapForm.value.bktxt),
      postingDate: formatPostingDate(scrapForm.value.postingDate),
      skipSap: skipSap.value || undefined
    });

    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg;
      resultStatus.value = false;
      return;
    }
    resultMessage.value = res.msg || `成功报废${transferRequests.length}条记录`;
    resultStatus.value = true;
    scrapList.value = [];
    scrapForm.value.mtsnr = '';
    scrapForm.value.bktxt = '';
    scrapForm.value.postingDate = null;
    handleQuery();
  } catch (error: any) {
    resultMessage.value = error.message || '报废失败';
    resultStatus.value = false;
  } finally {
    buttonLoading.value = false;
  }
};

const openBatchInputDialog = () => {
  batchInputDialogVisible.value = true;
};

const handleBatchInputConfirm = (values: string[]) => {
  queryParams.value.itemCodeStr = values.join(',');
  handleQuery();
};

onMounted(() => {
  loadMoveTypeReasonOptions();
  getList();
});
</script>

<style scoped>
.transfer-page {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: calc(100vh - 100px);
}

.inventory-card {
  flex: 0 0 auto;
}

.inventory-card :deep(.el-card__header) {
  padding: 10px 16px;
}

.inventory-card :deep(.el-card__body) {
  padding: 0;
}

.inventory-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.inventory-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.inventory-collapse-icon {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  transition: transform 0.2s;
}

.inventory-collapse-icon.is-expanded {
  transform: rotate(90deg);
}

.inventory-header-title {
  font-size: 14px;
  font-weight: 600;
}

.inventory-card-body {
  padding: 12px 16px 16px;
}

.compact-form :deep(.el-form-item) {
  margin-bottom: 6px;
  margin-right: 10px;
}

.search-result {
  margin-top: 4px;
}

.compact-pagination :deep(.el-pagination),
.compact-pagination :deep(.el-pagination__total),
.compact-pagination :deep(.el-pagination__jump),
.compact-pagination :deep(.el-pagination .el-select .el-input__inner),
.compact-pagination :deep(.el-pagination .btn-prev),
.compact-pagination :deep(.el-pagination .btn-next),
.compact-pagination :deep(.el-pagination .el-pager li) {
  font-size: 12px;
}

.add-transfer-bar {
  text-align: center;
  padding: 4px 0;
}

.rotate-button {
  transform: rotate(90deg);
}

.transfer-main-card {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.transfer-main-card :deep(.el-card__header) {
  padding: 8px 12px;
}

.transfer-main-card :deep(.el-card__body) {
  padding: 8px 12px 10px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.transfer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.move-type-form {
  margin-bottom: 0;
}

.move-type-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 0;
}

.move-type-desc {
  margin-left: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  white-space: nowrap;
}

.transfer-form-bar {
  padding: 6px 8px;
  margin-bottom: 6px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.transfer-form-bar :deep(.el-form-item) {
  margin-bottom: 0;
}

.transfer-more-toggle-col {
  display: flex;
  align-items: center;
}

.transfer-form-more {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.transfer-form-more :deep(.el-form-item) {
  margin-bottom: 0;
}

.result-alert {
  margin-bottom: 6px;
}

.result-alert :deep(.el-alert) {
  padding: 6px 10px;
}

.transfer-table {
  flex: 1;
}

.submit-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
  padding-top: 4px;
}

.transfer-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .transfer-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
