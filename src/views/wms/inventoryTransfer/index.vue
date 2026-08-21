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
      <el-button type="primary" @click="addSelectedToTransferList" circle class="rotate-button">
        <el-icon><Switch /></el-icon>
      </el-button>
    </div>

    <!-- 移转列表：主操作区 -->
    <el-card shadow="never" class="transfer-main-card">
      <template #header>
        <div class="transfer-header">
          <span class="header-title">移转列表</span>
          <div class="header-actions">
            <el-form :inline="true" class="move-type-form">
              <el-form-item label="">
                <el-select v-model="moveType" style="width: 280px" @change="handleMoveTypeChange">
                  <el-option v-for="item in moveTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <span class="move-type-desc">{{ moveTypeDesc }}</span>
              </el-form-item>
            </el-form>
            <el-checkbox v-model="skipSap" :disabled="moveType === '321'">仅WMS移转</el-checkbox>
            <el-radio-group v-if="canSelectTargetLocationMove" v-model="transferMode" @change="handleTransferModeChange">
              <el-radio-button label="fixed">固定库位</el-radio-button>
              <el-radio-button label="multiple">多库位</el-radio-button>
            </el-radio-group>
            <el-button type="danger" @click="clearTransferList" :disabled="transferList.length === 0">清空</el-button>
            <right-toolbar :search="false" :columns="transferColumns" />
          </div>
        </div>
      </template>

      <div class="transfer-form-bar">
        <el-form :model="fixedTransferForm" ref="fixedTransferFormRef" label-width="auto" :inline="true">
          <el-row :gutter="12">
            <el-col :sm="24" :md="8" :lg="8" v-if="canSelectTargetLocationMove && transferMode === 'fixed'">
              <el-form-item label="目标库位" prop="targetLocationCode" :rules="targetLocationRules">
                <HistoryInput v-model.trim="fixedTransferForm.targetLocationCode" :config="locationCodeConfig" placeholder="请输入目标库位编码" @keydown.tab.prevent="locationCodeKeyDownTab(fixedTransferForm.targetLocationCode)" @keydown.enter.prevent="locationCodeKeyDownTab(fixedTransferForm.targetLocationCode)">
                  <template #append>
                    <el-button icon="Search" @click="showStorageLocationDialog(-1)"></el-button>
                  </template>
                </HistoryInput>
              </el-form-item>
            </el-col>
            <el-col :sm="24" :md="8" :lg="8">
              <el-form-item label="物料单">
                <HistoryInput v-model="fixedTransferForm.mtsnr" :config="mtsnrConfig" placeholder="请输入物料单" />
              </el-form-item>
            </el-col>
            <el-col :sm="24" :md="7" :lg="7">
              <el-form-item label="凭证抬头文本">
                <HistoryInput v-model="fixedTransferForm.bktxt" :config="bktxtConfig" placeholder="请输入凭证抬头文本" />
              </el-form-item>
            </el-col>
            <el-col :sm="24" :md="1" :lg="1" class="transfer-more-toggle-col">
              <el-form-item label-width="0">
                <el-button link type="primary" @click="showTransferMore = !showTransferMore">
                  <el-icon class="el-icon--right">
                    <ArrowDown v-if="!showTransferMore" />
                    <ArrowUp v-else />
                  </el-icon>
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row v-show="showTransferMore" :gutter="12" class="transfer-form-more">
            <el-col :sm="24" :md="8" :lg="8">
              <el-form-item label="过账日期" prop="postingDate">
                <el-date-picker clearable v-model="fixedTransferForm.postingDate" type="date" :disabled-date="disabledFutureDate" value-format="YYYY-MM-DD" placeholder="请选择接收日期" />
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

      <el-table :data="transferList" border class="transfer-table" v-loading="tableLoading" :max-height="transferTableHeight">
        <el-table-column type="index" width="40" align="center" />
        <el-table-column v-if="transferColumns[0].visible" label="物料编码" prop="itemCode" min-width="100" show-overflow-tooltip />
        <el-table-column v-if="transferColumns[1].visible" label="物料名称" prop="itemName" min-width="120" show-overflow-tooltip />
        <el-table-column v-if="transferColumns[2].visible" label="批次号" prop="batchCode" min-width="90" show-overflow-tooltip />
        <el-table-column v-if="transferColumns[3].visible" label="源库位信息" width="180">
          <template #default="scope">
            <div>
              <div>仓库: {{ scope.row.sourceWarehouseCode }}</div>
              <div>库区: {{ scope.row.sourceAreaCode }}</div>
              <div>库位: {{ scope.row.sourceLocationCode }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="transferColumns[4].visible" label="数量" min-width="180">
          <template #default="scope">
            <div>
              <div>非限制数量: {{ formatQty(scope.row.availableQuantity) }}</div>
              <div>质 检 数 量: {{ formatQty(scope.row.inspectionQuantity) }}</div>
              <div>冻 结 数 量: {{ formatQty(scope.row.blockedQuantity) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="transferColumns[5].visible" label="单位" prop="unit" align="center" width="80" />
        <el-table-column v-if="transferColumns[6].visible" label="库存标识" align="center" prop="specialInventoryFlag" min-width="90">
          <template #default="scope">
            <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
          </template>
        </el-table-column>
        <el-table-column v-if="transferColumns[7].visible && showBusinessPartnerColumn" label="业务伙伴" align="center" min-width="110">
          <template #default="scope">
            <template v-if="scope.row.specialInventoryFlag && scope.row.specialInventoryFlag !== 'N'">
              <el-input v-model="scope.row.supplierCode" placeholder="供应商寄售编码" v-if="scope.row.specialInventoryFlag === 'K'" />
              <el-input v-model="scope.row.customerCode" placeholder="客户寄售编码" v-else-if="scope.row.specialInventoryFlag === 'W'" />
              <span v-else-if="scope.row.specialInventoryFlag === 'E'">{{ scope.row.businessCode }}</span>
              <span v-else>{{ scope.row.businessCode || '-' }}</span>
            </template>
          </template>
        </el-table-column>

        <el-table-column v-if="transferColumns[8].visible && showInventoryTypeColumn" :label="isStockStatusMove ? '源类型' : '库存类型'" prop="inventoryType" align="center" min-width="110">
          <template #default="scope">
            <el-select v-model="scope.row.inventoryType" placeholder="请选择库存类型" style="width: 100%" :disabled="isStockStatusMove || isOutboundOnlyMove" @change="handleInventoryTypeChange(scope.$index, scope.row)">
              <el-option label="非限制库存" value="N"></el-option>
              <el-option label="质检库存" value="X"></el-option>
              <el-option label="冻结库存" value="S"></el-option>
            </el-select>
          </template>
        </el-table-column>

        <el-table-column v-if="transferColumns[9].visible && showTargetInventoryTypeColumn" label="目标类型" prop="targetInventoryType" align="center" min-width="110">
          <template #default="scope">
            <el-select v-model="scope.row.targetInventoryType" placeholder="请选择目标库存类型" style="width: 100%" :disabled="needsTargetSalesOrder || moveType === '321' || moveType === '343' || moveType === '344' || moveType === '551'">
              <el-option label="非限制库存" value="N"></el-option>
              <el-option label="质检库存" value="X"></el-option>
              <el-option label="冻结库存" value="S"></el-option>
            </el-select>
          </template>
        </el-table-column>

        <el-table-column v-if="needsTargetSalesOrder" label="目标销售订单" min-width="180">
          <template #default="scope">
            <el-input v-model="scope.row.targetBusinessCode" placeholder="请选择销售订单明细" readonly>
              <template #append>
                <el-button icon="Search" @click="showSalesOrderDetailDialog(scope.$index)"></el-button>
              </template>
            </el-input>
          </template>
        </el-table-column>

        <el-table-column v-if="isMaterialConversionMove" label="目标物料" min-width="180">
          <template #default="scope">
            <el-input v-model="scope.row.targetItemCode" placeholder="请选择目标物料" readonly>
              <template #append>
                <el-button icon="Search" @click="showTargetItemDialog(scope.$index)"></el-button>
              </template>
            </el-input>
            <div v-if="scope.row.targetItemName" class="target-item-name">{{ scope.row.targetItemName }}</div>
          </template>
        </el-table-column>

        <el-table-column v-if="isDepartmentIssueMove" label="成本中心" min-width="200">
          <template #default="scope">
            <el-select v-model="scope.row.costCenter" placeholder="请选择成本中心" filterable clearable :loading="costCenterLoading" style="width: 100%">
              <el-option v-for="item in costCenterOptions" :key="item.costCenter" :label="item.costCenter + ' - ' + item.costCenterName" :value="item.costCenter" />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column v-if="isDeptIssueZ01Move" label="订单号" min-width="140">
          <template #default="scope">
            <el-input v-model.trim="scope.row.orderNo" placeholder="可选" clearable />
          </template>
        </el-table-column>

        <el-table-column v-if="transferColumns[10].visible && canSelectTargetLocationMove && transferMode === 'multiple'" label="目标库位" min-width="160">
          <template #default="scope">
            <TableHistoryInput v-model="scope.row.targetLocationCode" :config="locationCodeConfig" placeholder="请输入目标库位编码" @keydown.tab.prevent="locationCodeKeyDownTab(scope.row.targetLocationCode)" @keydown.enter.prevent="locationCodeKeyDownTab(scope.row.targetLocationCode)">
              <template #append>
                <el-button icon="Search" @click="showStorageLocationDialog(scope.$index)"></el-button>
              </template>
            </TableHistoryInput>
          </template>
        </el-table-column>

        <el-table-column v-if="transferColumns[11].visible" label="移转数量" width="115">
          <template #default="scope">
            <el-input-number v-model="scope.row.transferQuantity" :min="0" :max="scope.row.currentQuantity ? parseFloat(scope.row.currentQuantity) : scope.row.currentQuantity" :precision="3" controls-position="right" style="width: 100%" />
          </template>
        </el-table-column>

        <el-table-column v-if="transferColumns[12].visible && showMoveReasonColumn" label="移动原因" min-width="180">
          <template #default="scope">
            <el-select v-model="scope.row.moveReasonCode" placeholder="请选择移动原因" clearable filterable :loading="moveTypeReasonLoading" style="width: 100%" @change="(code: string) => handleRowMoveReasonChange(scope.row, code)">
              <el-option v-for="item in moveTypeReasonOptions" :key="item.id" :label="item.moveReasonCode + ' - ' + item.moveReasonDesc" :value="item.moveReasonCode" />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="scope">
            <el-button type="danger" link icon="Delete" @click="removeFromTransferList(scope.$index)"></el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="submit-bar">
        <el-button :loading="buttonLoading" type="primary" @click="submitTransfer" :disabled="transferList.length === 0">{{ moveType }} {{ moveTypeDesc }}</el-button>
        <span class="transfer-count">共 {{ transferList.length }} 条</span>
      </div>
    </el-card>
    <!-- 物料编码批量输入对话框 -->
    <BatchInputDialog ref="batchInputDialogRef" v-model="batchInputDialogVisible" title="批量录入物料编码" placeholder="请输入物料编码，支持多行粘贴" @confirm="handleBatchInputConfirm" />
    <!-- 库位选择对话框 -->
    <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
    <!-- 销售订单明细选择 -->
    <SalesOrderDetailDialog ref="salesOrderDetailDialogRef" @sales-order-detail-select-call-back="salesOrderDetailSelectCallBack" />
    <!-- 目标物料选择（309） -->
    <ItemDialog ref="targetItemDialogRef" @item-select-call-back="targetItemSelectCallBack" />
  </div>
</template>

<script setup name="InventoryTransfer" lang="ts">
import { computed, ref, reactive, onMounted } from 'vue';
import { listInventoryDetail } from '@/api/wms/inventoryDetail';
import { InventoryDetailForm, InventoryDetailQuery, InventoryDetailVO } from '@/api/wms/inventoryDetail/types';
// 导入图标组件
import { ArrowDown, ArrowRight, ArrowUp, Bell, Switch } from '@element-plus/icons-vue';

import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import BatchInputDialog from '@/components/BatchInputDialog/index.vue';
import SalesOrderDetailDialog from '@/views/wms/salesOrderDetail/components/SalesOrderDetailDialog.vue';
import ItemDialog from '@/views/wms/item/components/itemDialog.vue';
import HistoryInput from '@/components/HistoryInput/index.vue';
import TableHistoryInput from '@/components/TableHistoryInput/index.vue';
import { HistoryConfig } from '@/types/history';
import { transferInventory } from '@/api/wms/inventoryDetail';
import { SalesOrderDetailVO } from '@/api/wms/salesOrderDetail/types';
import { HttpStatus } from '@/enums/RespEnum';
import { listStorageLocation } from '@/api/wms/storageLocation';
import { listMoveTypeReason } from '@/api/wms/moveTypeReason';
import { listCostCenter } from '@/api/wms/costCenter';
import type { CostCenterVO } from '@/api/wms/costCenter/types';
import type { MoveTypeReasonVO } from '@/api/wms/moveTypeReason/types';
import { DEFAULT_TRANSFER_MOVE_TYPE, canSelectTargetLocation, getDefaultSourceInventoryType, getDefaultTargetInventoryType, getTransferMoveTypeDesc, INVENTORY_TRANSFER_MOVE_TYPES, isDepartmentIssueTransfer, isDeptIssueZ01, isMaterialConversionTransfer, isOutboundOnlyTransfer, isStockStatusTransfer, needsTargetLocation } from './utils/transferMoveConfig';
import InventorySortHeader from '@/views/wms/components/InventorySortHeader.vue';
import { applyInventorySortToQuery, createDefaultInventorySortRules, getInventorySortState, toggleInventorySort, type InventorySortKey, type InventorySortRule } from '@/views/wms/components/inventorySort';

const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();
const salesOrderDetailDialogRef = ref<InstanceType<typeof SalesOrderDetailDialog>>();
const targetItemDialogRef = ref<InstanceType<typeof ItemDialog>>();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_type, wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_type', 'wms_inventory_special_flag'));

const showSearch = ref(true);
/** 库存明细展开状态，默认收起 */
const inventoryExpanded = ref(true);
const sortRules = ref<InventorySortRule[]>(createDefaultInventorySortRules());
const getSortState = (key: InventorySortKey) => getInventorySortState(sortRules.value, key);
const toggleSort = (key: InventorySortKey) => {
  sortRules.value = toggleInventorySort(sortRules.value, key);
};
const transferTableHeight = 'calc(100vh - 320px)';
// 响应式数据
const loading = ref(false);
const tableLoading = ref(false);
const buttonLoading = ref(false);
const inventoryDetailList = ref<InventoryDetailVO[]>([]);
/** 库存明细中存在非一般库存时显示业务伙伴列 */
const showInventoryBusinessPartnerColumn = computed(() => inventoryDetailList.value.some((item) => item.specialInventoryFlag && item.specialInventoryFlag !== 'N'));
const selectedSearchItems = ref<InventoryDetailVO[]>([]);
const transferList = ref<any[]>([]);
const showAdvancedSearch = ref(false); // 控制高级搜索显示状态
const showTransferMore = ref(false);
const total = ref(0);
const currenIndex = ref(0);
const resultMessage = ref('');
const resultStatus = ref(false);

const batchInputDialogVisible = ref(false);
const batchInputDialogRef = ref<InstanceType<typeof BatchInputDialog>>();

// 移转模式：fixed-固定库位，multiple-多库位
const transferMode = ref<'fixed' | 'multiple'>('fixed');
const moveType = ref(DEFAULT_TRANSFER_MOVE_TYPE);
/** 当前移动类型对应的移动原因选项 */
const moveTypeReasonOptions = ref<MoveTypeReasonVO[]>([]);
const moveTypeReasonLoading = ref(false);
/** 是否只进行 WMS 移转（跳过 SAP 过账） */
const skipSap = ref(false);
const moveTypeOptions = INVENTORY_TRANSFER_MOVE_TYPES;
const moveTypeDesc = computed(() => getTransferMoveTypeDesc(moveType.value));
const needsTargetLocationMove = computed(() => needsTargetLocation(moveType.value));
const canSelectTargetLocationMove = computed(() => canSelectTargetLocation(moveType.value));
const isStockStatusMove = computed(() => isStockStatusTransfer(moveType.value));
const isMaterialConversionMove = computed(() => isMaterialConversionTransfer(moveType.value));
const isOutboundOnlyMove = computed(() => isOutboundOnlyTransfer(moveType.value));
const isDepartmentIssueMove = computed(() => isDepartmentIssueTransfer(moveType.value));
const isDeptIssueZ01Move = computed(() => isDeptIssueZ01(moveType.value));
const costCenterOptions = ref<CostCenterVO[]>([]);
const costCenterLoading = ref(false);
/** 413 转销售订单库存须选择目标销售订单 */
const needsTargetSalesOrder = computed(() => moveType.value === '413');
const showInventoryTypeColumn = computed(() => !needsTargetSalesOrder.value);
const showTargetInventoryTypeColumn = computed(() => isStockStatusMove.value && !needsTargetSalesOrder.value);
/** 移转列表中存在非一般库存时显示业务伙伴编码列 */
const showBusinessPartnerColumn = computed(() => transferList.value.some((item) => item.specialInventoryFlag && item.specialInventoryFlag !== 'N'));
/** 当前移动类型配置了移动原因时才显示移动原因列 */
const showMoveReasonColumn = computed(() => moveTypeReasonOptions.value.length > 0);
const targetLocationRules = computed(() => (needsTargetLocationMove.value ? [{ required: true, message: '请输入目标库位编码', trigger: 'blur' }] : []));

// 固定库位模式下的表单数据
const fixedTransferForm = ref({
  targetLocationCode: '',
  targetWarehouseCode: '',
  targetAreaCode: '',
  mtsnr: '',
  bktxt: '',
  postingDate: null as string | null
});

// 表单引用
const queryFormRef = ref<any>(null);
const fixedTransferFormRef = ref<any>(null);

const itemCodeConfig: HistoryConfig = {
  key: 'itemCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryTransfer',
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
  page: 'inventoryTransfer',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const businessCodeConfig: HistoryConfig = {
  key: 'businessCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryTransfer',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const warehouseCodeConfig: HistoryConfig = {
  key: 'warehouseCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryTransfer',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const mtsnrConfig: HistoryConfig = {
  key: 'mtsnr',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'inventoryTransfer',
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
  page: 'inventoryTransfer',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

function formatPostingDate(postingDate?: string | null): string | undefined {
  if (!postingDate) {
    return undefined;
  }
  return postingDate.includes(' ') ? postingDate : `${postingDate} 00:00:00`;
}

function resolveBatchBktxt(bktxt?: string | null): string | undefined {
  const value = bktxt?.trim();
  return value || undefined;
}

function resolveMtsnr(mtsnr?: string | null): string | undefined {
  const value = mtsnr?.trim();
  return value || undefined;
}

const inventoryTableRef = ref(null);

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

const { queryParams, form, rules } = toRefs(data);

// 库存明细列显隐
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

// 移转列表列显隐
const transferColumns = ref<FieldOption[]>([
  { key: 0, label: `物料编码`, visible: true, children: [] },
  { key: 1, label: `物料名称`, visible: true, children: [] },
  { key: 2, label: `批次号`, visible: true, children: [] },
  { key: 3, label: `源库位信息`, visible: true, children: [] },
  { key: 4, label: `数量`, visible: true, children: [] },
  { key: 5, label: `单位`, visible: false, children: [] },
  { key: 6, label: `库存标识`, visible: true, children: [] },
  { key: 7, label: `业务伙伴`, visible: true, children: [] },
  { key: 8, label: `库存类型`, visible: true, children: [] },
  { key: 9, label: `目标类型`, visible: true, children: [] },
  { key: 10, label: `目标库位`, visible: true, children: [] },
  { key: 11, label: `移转数量`, visible: true, children: [] },
  { key: 12, label: `移动原因`, visible: true, children: [] }
]);

// 禁用未来的时间
const disabledFutureDate = (time: Date) => {
  // 获取当前时间，并将毫秒设为0以确保精确到秒
  const now = new Date();
  // 加上指定秒数（默认3秒）
  now.setSeconds(now.getSeconds() + 3);
  now.setMilliseconds(0);

  // 禁止选择当前时间之后的日期
  return time.getTime() > now.getTime();
};

/** 切换高级搜索显示状态 */
const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value;
};

/** 查询库存明细记录列表 */
const getList = async () => {
  loading.value = true;
  applyInventorySortToQuery(queryParams.value, sortRules.value);
  const res = await listInventoryDetail(queryParams.value);
  inventoryDetailList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  // 从输入框内容解析物料编码列表（支持手动输入单个/多个，或批量录入回填）
  const str = String(queryParams.value.itemCodeStr || '').trim();
  queryParams.value.itemCodeList = str ? str.split(/[,;，；\s]+/).filter(Boolean) : [];
  getList();
};

/** 重置搜索 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  // 清除表格选中状态
  inventoryTableRef.value?.clearSelection();
  // 清空批量录入的物料编码
  queryParams.value.itemCodeStr = undefined;
  queryParams.value.itemCodeList = [];
  sortRules.value = createDefaultInventorySortRules();
  batchInputDialogRef.value?.resetInput();
  handleQuery();
};

/** 搜索结果选择变化 */
const handleSelectionChange = (selection: InventoryDetailVO[]) => {
  selectedSearchItems.value = selection;
};

/** 添加选中项到移转列表 */
const addSelectedToTransferList = () => {
  if (selectedSearchItems.value.length === 0) {
    proxy.$modal.msgWarning('请先选择要添加的库存');
    return;
  }

  const sourceInventoryType = getDefaultSourceInventoryType(moveType.value);
  const sameLocationMove = isStockStatusMove.value || isOutboundOnlyMove.value;
  const newItems = selectedSearchItems.value.map((item) => {
    const currentQuantity = sourceInventoryType === 'S' ? item.blockedQuantity || 0 : sourceInventoryType === 'X' ? item.inspectionQuantity || 0 : item.availableQuantity || 0;
    const sameLocation = sameLocationMove;
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
      targetWarehouseCode: sameLocation ? item.warehouseCode : '',
      targetAreaCode: sameLocation ? item.areaCode : '',
      targetLocationCode: sameLocation ? item.locationCode : '',
      specialInventoryFlag: item.specialInventoryFlag,
      inventoryType: sourceInventoryType,
      targetInventoryType: getDefaultTargetInventoryType(moveType.value),
      transferQuantity: null,
      businessCode: item.businessCode,
      businessName: item.businessName,
      supplierCode: item.specialInventoryFlag === 'K' ? item.businessCode : '',
      customerCode: item.specialInventoryFlag === 'W' ? item.businessCode : '',
      targetBusinessCode: '',
      targetSalesOrderNo: '',
      targetSalesOrderItem: '',
      targetItemCode: '',
      targetItemName: '',
      costCenter: '',
      orderNo: '',
      moveReasonCode: '',
      moveReasonDesc: ''
    };
  });

  // 避免重复添加
  let addedCount = 0;
  newItems.forEach((newItem) => {
    // const exists = transferList.value.some((item) => item.id === newItem.id);
    // if (!exists) {
    //   transferList.value.push(newItem);
    //   addedCount++;
    // }
    transferList.value.push(newItem);
    addedCount++;
  });

  proxy.$modal.msgSuccess(`成功添加${addedCount}条记录到移转列表`);
};

/** 从移转列表中移除 */
const removeFromTransferList = (index: number) => {
  transferList.value.splice(index, 1);
};

/** 清空移转列表 */
const clearTransferList = () => {
  transferList.value = [];
  if (transferMode.value === 'fixed') {
    fixedTransferForm.value.targetLocationCode = '';
    fixedTransferForm.value.targetWarehouseCode = '';
    fixedTransferForm.value.targetAreaCode = '';
  }
};

const locationCodeKeyDownTab = async (locationCode: any) => {
  if (locationCode) {
    const res = await listStorageLocation({
      pageNum: 1,
      pageSize: 10,
      locationCode: locationCode
    });
    resultMessage.value = '';
    if ((res.rows || []).length == 0) {
      resultMessage.value = `库位${locationCode}不存在`;
      resultStatus.value = false;
    }
  }
};

/** 显示库位选择对话框 */
const showStorageLocationDialog = (index: number) => {
  storageLocationDialogRef.value.openDialog();
  storageLocationDialogRef.value.handleQuery();
  currenIndex.value = index;
};

/** 处理移转模式切换 */
const handleTransferModeChange = (mode: 'fixed' | 'multiple') => {
  if (mode === 'fixed') {
    transferList.value.forEach((item) => {
      item.targetLocationCode = '';
    });
  } else {
    fixedTransferForm.value.targetLocationCode = '';
    fixedTransferForm.value.targetWarehouseCode = '';
    fixedTransferForm.value.targetAreaCode = '';
  }
};

/** 库位选择回调 */
const storageLocationSelectCallBack = (record: any) => {
  if (transferMode.value === 'fixed') {
    // 固定库位模式，设置统一的目标库位
    fixedTransferForm.value.targetLocationCode = record.locationCode;
    fixedTransferForm.value.targetWarehouseCode = record.warehouseCode;
    fixedTransferForm.value.targetAreaCode = record.areaCode;
  } else {
    // 多库位模式，设置对应行的目标库位
    if (currenIndex.value >= 0 && currenIndex.value < transferList.value.length) {
      const currentItem = transferList.value[currenIndex.value];
      currentItem.targetWarehouseCode = record.warehouseCode;
      currentItem.targetAreaCode = record.areaCode;
      currentItem.targetLocationCode = record.locationCode;
    }
  }
};

/** 显示目标物料选择对话框（309） */
const showTargetItemDialog = (index: number) => {
  currenIndex.value = index;
  targetItemDialogRef.value?.openDialog();
  targetItemDialogRef.value?.handleQuery();
};

/** 目标物料选择回调 */
const targetItemSelectCallBack = (record: any) => {
  if (currenIndex.value < 0 || currenIndex.value >= transferList.value.length) {
    return;
  }
  const currentItem = transferList.value[currenIndex.value];
  currentItem.targetItemCode = record.item;
  currentItem.targetItemName = record.itemDesc;
};

/** 显示销售订单明细选择对话框 */
const showSalesOrderDetailDialog = (index: number) => {
  currenIndex.value = index;
  salesOrderDetailDialogRef.value?.openDialog({});
  salesOrderDetailDialogRef.value?.handleQuery();
};

/** 销售订单明细选择回调 */
const salesOrderDetailSelectCallBack = (record: SalesOrderDetailVO) => {
  if (currenIndex.value < 0 || currenIndex.value >= transferList.value.length) {
    return;
  }
  const currentItem = transferList.value[currenIndex.value];
  currentItem.targetBusinessCode = `${record.salesOrderNo}-${record.salesItemNo}`;
  currentItem.targetSalesOrderNo = record.salesOrderNo;
  currentItem.targetSalesOrderItem = record.salesItemNo;
};

const syncCurrentQuantity = (item: any) => {
  if (item.inventoryType === 'N') {
    item.currentQuantity = item.availableQuantity || 0;
  } else if (item.inventoryType === 'X') {
    item.currentQuantity = item.inspectionQuantity || 0;
  } else if (item.inventoryType === 'S') {
    item.currentQuantity = item.blockedQuantity || 0;
  }
};

const handleInventoryTypeChange = (index: number) => {
  syncCurrentQuantity(transferList.value[index]);
};

function resolveMoveReasonDesc(code?: string | null): string | undefined {
  if (!code) {
    return undefined;
  }
  const matched = moveTypeReasonOptions.value.find((item) => item.moveReasonCode === code);
  return matched?.moveReasonDesc;
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

const loadCostCenterOptions = async () => {
  if (!isDepartmentIssueMove.value) {
    costCenterOptions.value = [];
    return;
  }
  costCenterLoading.value = true;
  try {
    const res = await listCostCenter({ pageNum: 1, pageSize: 5000 });
    costCenterOptions.value = res.rows || [];
  } catch {
    costCenterOptions.value = [];
  } finally {
    costCenterLoading.value = false;
  }
};

const handleMoveTypeChange = async () => {
  resultMessage.value = '';
  skipSap.value = moveType.value === '321';
  await loadMoveTypeReasonOptions();
  await loadCostCenterOptions();
  const sourceInventoryType = getDefaultSourceInventoryType(moveType.value);
  const targetInventoryType = getDefaultTargetInventoryType(moveType.value);
  transferList.value.forEach((item) => {
    item.inventoryType = sourceInventoryType;
    item.targetInventoryType = targetInventoryType;
    item.moveReasonCode = '';
    item.moveReasonDesc = '';
    syncCurrentQuantity(item);
    if (!needsTargetSalesOrder.value) {
      item.targetBusinessCode = '';
      item.targetSalesOrderNo = '';
      item.targetSalesOrderItem = '';
    }
    if (moveType.value !== '309') {
      item.targetItemCode = '';
      item.targetItemName = '';
    }
    if (!isDepartmentIssueMove.value) {
      item.costCenter = '';
      item.orderNo = '';
    } else if (!isDeptIssueZ01Move.value) {
      item.orderNo = '';
    }
    if (isStockStatusMove.value || isOutboundOnlyMove.value) {
      item.targetWarehouseCode = item.sourceWarehouseCode;
      item.targetAreaCode = item.sourceAreaCode;
      item.targetLocationCode = item.sourceLocationCode;
    } else {
      item.targetWarehouseCode = '';
      item.targetAreaCode = '';
      item.targetLocationCode = '';
    }
  });
  if (!canSelectTargetLocationMove.value) {
    fixedTransferForm.value.targetLocationCode = '';
    fixedTransferForm.value.targetWarehouseCode = '';
    fixedTransferForm.value.targetAreaCode = '';
  }
};

/** 提交移转 */
const submitTransfer = async () => {
  const validTransfers = transferList.value.filter((item) => item.transferQuantity > 0);
  resultStatus.value = true;
  resultMessage.value = '';
  if (validTransfers.length === 0) {
    resultMessage.value = '没有有效的移转记录';
    resultStatus.value = false;
    return;
  }

  if (needsTargetSalesOrder.value) {
    const missingTargetSo = validTransfers.filter((item) => !String(item.targetBusinessCode || '').trim());
    if (missingTargetSo.length > 0) {
      resultMessage.value = '413 移转须选择目标销售订单';
      resultStatus.value = false;
      return;
    }
  }

  if (moveType.value === '309') {
    const missingTargetItem = validTransfers.filter((item) => !String(item.targetItemCode || '').trim());
    if (missingTargetItem.length > 0) {
      resultMessage.value = '309 物料转换须选择目标物料';
      resultStatus.value = false;
      return;
    }
    const sameTargetItem = validTransfers.filter((item) => item.targetItemCode === item.itemCode);
    if (sameTargetItem.length > 0) {
      resultMessage.value = '目标物料不能与源物料相同';
      resultStatus.value = false;
      return;
    }
  }

  if (isDepartmentIssueMove.value) {
    const missingCostCenter = validTransfers.filter((item) => !String(item.costCenter || '').trim());
    if (missingCostCenter.length > 0) {
      resultMessage.value = '部门领料须为每行选择成本中心';
      resultStatus.value = false;
      return;
    }
  }

  if (needsTargetLocationMove.value) {
    if (transferMode.value === 'fixed') {
      if (!fixedTransferForm.value.targetLocationCode) {
        resultMessage.value = '请输入目标库位编码';
        resultStatus.value = false;
        return;
      }
      validTransfers.forEach((item) => {
        item.targetLocationCode = fixedTransferForm.value.targetLocationCode;
        item.targetWarehouseCode = fixedTransferForm.value.targetWarehouseCode || '';
        item.targetAreaCode = fixedTransferForm.value.targetAreaCode || '';
      });
    } else {
      const invalidItems = validTransfers.filter((item) => !item.targetLocationCode);
      if (invalidItems.length > 0) {
        resultMessage.value = '请填写所有移转记录的目标库位';
        resultStatus.value = false;
        return;
      }
    }
  } else if (canSelectTargetLocationMove.value) {
    if (transferMode.value === 'fixed' && fixedTransferForm.value.targetLocationCode) {
      validTransfers.forEach((item) => {
        item.targetWarehouseCode = fixedTransferForm.value.targetWarehouseCode;
        item.targetAreaCode = fixedTransferForm.value.targetAreaCode;
        item.targetLocationCode = fixedTransferForm.value.targetLocationCode;
      });
    }
    validTransfers.forEach((item) => {
      item.targetWarehouseCode = item.targetWarehouseCode || item.sourceWarehouseCode;
      item.targetAreaCode = item.targetAreaCode || item.sourceAreaCode;
      item.targetLocationCode = item.targetLocationCode || item.sourceLocationCode;
      item.targetInventoryType = item.targetInventoryType || getDefaultTargetInventoryType(moveType.value);
    });
  } else {
    validTransfers.forEach((item) => {
      item.targetWarehouseCode = item.sourceWarehouseCode;
      item.targetAreaCode = item.sourceAreaCode;
      item.targetLocationCode = item.sourceLocationCode;
      item.targetInventoryType = item.targetInventoryType || getDefaultTargetInventoryType(moveType.value);
    });
  }

  // 验证移转数量是否超过当前数量
  const overQuantityItems = validTransfers.filter((item) => item.transferQuantity > item.currentQuantity);
  if (overQuantityItems.length > 0) {
    resultMessage.value = '移转数量不能超过当前可用数量';
    resultStatus.value = false;
    return;
  }

  if (skipSap.value) {
    try {
      await proxy?.$modal.confirm('已开启「仅WMS移转」，本次将跳过 SAP 过账，是否确认继续？');
    } catch {
      return;
    }
  }

  buttonLoading.value = true;
  try {
    // 构造移转请求参数
    const transferRequests = validTransfers.map((item) => ({
      ...item,
      inventoryDetailId: item.id,
      moveType: moveType.value,
      targetWarehouseCode: item.targetWarehouseCode,
      targetAreaCode: item.targetAreaCode,
      targetLocationCode: item.targetLocationCode,
      targetInventoryType: item.targetInventoryType,
      targetBusinessCode: item.targetBusinessCode || undefined,
      targetItemCode: item.targetItemCode || undefined,
      targetItemName: item.targetItemName || undefined,
      transferQuantity: item.transferQuantity,
      specialInventoryFlag: item.specialInventoryFlag,
      businessCode: item.businessCode,
      businessName: item.businessName,
      moveReasonCode: item.moveReasonCode || undefined,
      moveReasonDesc: item.moveReasonDesc || resolveMoveReasonDesc(item.moveReasonCode),
      costCenter: item.costCenter || undefined,
      orderNo: isDeptIssueZ01Move.value ? item.orderNo || undefined : undefined
    }));

    const res: any = await transferInventory({
      inventoryTransferBoList: transferRequests,
      transferType: 0,
      moveType: moveType.value,
      mtsnr: resolveMtsnr(fixedTransferForm.value.mtsnr),
      bktxt: resolveBatchBktxt(fixedTransferForm.value.bktxt),
      postingDate: formatPostingDate(fixedTransferForm.value.postingDate),
      skipSap: skipSap.value || undefined
    });

    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg;
      resultStatus.value = false;
      return;
    }
    resultMessage.value = resultMessage.value = res.msg || `成功移转${transferRequests.length}条记录`;
    resultStatus.value = true;
    transferList.value = [];
    fixedTransferForm.value.targetLocationCode = '';
    fixedTransferForm.value.targetWarehouseCode = '';
    fixedTransferForm.value.targetAreaCode = '';
    fixedTransferForm.value.mtsnr = '';
    fixedTransferForm.value.bktxt = '';
    fixedTransferForm.value.postingDate = null;
    handleQuery();
  } catch (error) {
    loading.value = false;
    resultMessage.value = error.message || '移转失败';
    resultStatus.value = false;
  } finally {
    buttonLoading.value = false;
  }
};

// 打开批量录入物料编码弹框
const openBatchInputDialog = () => {
  batchInputDialogVisible.value = true;
};
// 弹框确定的回调
const handleBatchInputConfirm = (values: string[]) => {
  // 将批量输入的值回填到输入框，查询时统一解析
  queryParams.value.itemCodeStr = values.join(',');
  handleQuery(); // 执行查询
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

.target-item-name {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
