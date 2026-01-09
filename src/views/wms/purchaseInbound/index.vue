<template>
  <div class="p-2">
    <el-card shadow="never">
      <el-tabs v-model="activeTab" type="card" @tab-click="handleTabClick">
        <el-tab-pane label="采购收货" name="po">
          <el-row :gutter="20">
            <!-- 上方搜索区域 -->
            <el-col :span="24">
              <el-card shadow="never" class="search-card">
                <template #header>
                  <el-row :gutter="10" class="mb8">
                    <el-col :span="1.5">
                      <span>采购订单明细</span>
                    </el-col>
                    <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
                  </el-row>
                </template>

                <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
                  <el-form-item label="采购单" prop="poNumber">
                    <!--                    <el-input v-model="queryParams.poNumber" placeholder="请输入采购单" clearable @keyup.enter="handleQuery" />-->
                    <HistoryInput v-model="queryParams.poNumber" :config="poNumberConfig" placeholder="请输入采购单" @save="handleSave" @select="handleSelect" @keyup.enter="handleQuery" />
                  </el-form-item>
                  <el-form-item label="项次" prop="itemNumber">
                    <el-input v-model="queryParams.itemNumber" placeholder="请输入项次" clearable @keyup.enter="handleQuery" />
                  </el-form-item>

                  <!-- 高级搜索项，默认隐藏 -->
                  <div v-show="showAdvancedSearch">
                    <el-form-item label="显示已清数量" prop="showOpenQuantityZero">
                      <el-switch v-model="queryParams.showOpenQuantityZero" class="drawer-switch" @change="handleQuery" />
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

                <!-- 搜索结果列表 -->
                <div class="search-result">
                  <el-table ref="purchaseTableRef" :data="purchaseOrderDetailList" height="300" border v-loading="loading" @selection-change="handleSelectionChange">
                    <el-table-column type="selection" width="55" align="center" />
                    <el-table-column v-if="columns[0].visible" label="采购单" align="left" prop="poNumber" fixed="left" min-width="120" />
                    <el-table-column v-if="columns[1].visible" label="项次" align="left" prop="itemNumber" fixed="left" min-width="65" />
                    <el-table-column label="交货状态" align="center" width="100" fixed="left">
                      <template #default="scope">
                        <el-tooltip :content="getEarlyDeliveryTooltip(scope.row)" placement="top">
                          <el-tag :type="getEarlyDeliveryTagType(scope.row)">
                            {{ getEarlyDeliveryText(scope.row) }}
                          </el-tag>
                        </el-tooltip>
                      </template>
                    </el-table-column>
                    <el-table-column v-if="columns[2].visible" label="排程" align="left" prop="scheduleNumber" min-width="60" />
                    <el-table-column v-if="columns[3].visible" label="交货日期" align="center" prop="deliveryDate" min-width="100" />
                    <el-table-column v-if="columns[4].visible" label="料号" align="left" prop="materialCode" min-width="135" />
                    <el-table-column v-if="columns[5].visible" label="旧料号" align="left" prop="oldMaterialCode" />
                    <el-table-column v-if="columns[6].visible" label="物料描述" align="left" prop="materialDesc" show-overflow-tooltip />
                    <el-table-column v-if="columns[7].visible" label="订单数量" align="left" prop="orderQuantity" min-width="100" />
                    <el-table-column v-if="columns[8].visible" label="已收数量" align="left" prop="receivedQuantity" min-width="100" />
                    <el-table-column v-if="columns[9].visible" label="未清数量" align="left" prop="openQuantity" min-width="100" />
                    <el-table-column v-if="columns[10].visible" label="订单单位" align="center" prop="orderUnit" />
                    <el-table-column v-if="columns[11].visible" label="需质检" align="center" prop="inspectionFlag" />
                    <el-table-column v-if="columns[13].visible" label="库存单位" align="center" prop="inventoryUnit" />
                    <el-table-column v-if="columns[14].visible" label="换算比例" align="center" prop="conversionRatio" />
                    <el-table-column v-if="columns[15].visible" label="供应商代码" align="center" prop="supplierCode" min-width="120" />
                    <el-table-column v-if="columns[16].visible" label="供应商名称" align="center" prop="supplierName" show-overflow-tooltip min-width="100" />
                  </el-table>

                  <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
                </div>
              </el-card>
            </el-col>

            <div style="margin: 20px 0; text-align: center; width: 100%">
              <el-button type="primary" @click="addSelectedToInboundList" circle class="rotate-button">
                <el-icon><Switch /></el-icon>
              </el-button>
            </div>

            <!-- 下方入库列表 -->
            <el-col :span="24">
              <el-card shadow="never">
                <template #header>
                  <div class="transfer-header">
                    <span class="header-title">入库列表</span>
                    <div class="header-actions">
                      <el-radio-group v-model="inboundMode">
                        <el-radio-button label="fixed">固定库位</el-radio-button>
                        <el-radio-button label="multiple">多库位</el-radio-button>
                      </el-radio-group>
                      <el-button type="danger" @click="clearInboundList" :disabled="inboundList.length === 0">清空列表</el-button>
                    </div>
                  </div>
                </template>

                <!-- 固定库位模式下的统一目标库位输入 -->
                <div style="padding: 10px; background-color: #f5f7fa; border-radius: 4px">
                  <el-form :model="fixedInboundForm" ref="fixedInboundFormRef" label-width="auto" :inline="true">
                    <el-row :gutter="20">
                      <el-col :sm="24" :md="8" :lg="8" v-if="inboundMode === 'fixed'">
                        <el-form-item label="目标库位" prop="locationCode" :rules="[{ required: true, message: '请输入目标库位编码', trigger: 'blur' }]">
                          <!--                          <el-input
                            v-model.trim="fixedInboundForm.locationCode"
                            placeholder="请输入目标库位编码"
                            clearable
                            @keydown.tab.prevent="locationCodeKeyDownTab(fixedInboundForm.locationCode)"
                            @keydown.enter.prevent="locationCodeKeyDownTab(fixedInboundForm.locationCode)"
                          >
                            <template #append>
                              <el-button icon="Search" @click="showStorageLocationDialog(-1)"></el-button>
                            </template>
                          </el-input>-->
                          <HistoryInput
                            v-model="fixedInboundForm.locationCode"
                            :config="fixedInboundFormLocationCodeConfig"
                            placeholder="请输入目标库位编码"
                            @save="handleSave"
                            @select="handleSelect"
                            @keydown.tab.prevent="locationCodeKeyDownTab(fixedInboundForm.locationCode)"
                            @keydown.enter.prevent="locationCodeKeyDownTab(fixedInboundForm.locationCode)"
                          >
                            <template #append>
                              <el-button icon="Search" @click="showStorageLocationDialog(-1)"></el-button>
                            </template>
                          </HistoryInput>
                        </el-form-item>
                      </el-col>
                      <el-col :sm="24" :md="8" :lg="8">
                        <el-form-item label="收货人">
                          <!--                          <el-input v-model="fixedInboundForm.targetUserName" placeholder="请输入收货人">
                            <template #append>
                              <el-button icon="Search" @click="showUserCollectionsDialog(-1)"></el-button>
                            </template>
                          </el-input>-->
                          <HistoryInput
                            v-model="fixedInboundForm.targetUserName"
                            :config="targetUserNameConfig"
                            placeholder="请输入收货人"
                            @save="handleSave"
                            @select="handleSelect"
                          >
                            <template #append>
                              <el-button icon="Search" @click="showUserCollectionsDialog(-1)"></el-button>
                            </template>
                          </HistoryInput>
                        </el-form-item>
                      </el-col>
                      <el-col :sm="24" :md="8" :lg="8">
                        <el-form-item label="过账日期" prop="postingDate">
                          <el-date-picker clearable v-model="fixedInboundForm.postingDate" type="date" :disabled-date="disabledFutureDate" value-format="YYYY-MM-DD" placeholder="请选择接收日期" />
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

                <el-table :data="inboundList" border style="width: 100%" v-loading="tableLoading" max-height="400">
                  <el-table-column type="index" width="50" align="center" />
                  <el-table-column label="采购单" prop="poNumber" />
                  <el-table-column label="项次" prop="itemNumber" />
                  <el-table-column label="料号" prop="materialCode" />
                  <el-table-column label="物料描述" prop="materialDesc" show-overflow-tooltip />
                  <el-table-column label="订单数量" align="left" prop="orderQuantity" min-width="100" />
                  <el-table-column label="未清数量" prop="openQuantity" />

                  <!-- 多库位模式下显示独立的目标库位设置 -->
                  <el-table-column label="目标库位" width="220" v-if="inboundMode === 'multiple'">
                    <template #default="scope">
                      <!--                      <el-input
                        v-model.trim="scope.row.locationCode"
                        placeholder="请输入目标库位编码"
                        clearable
                        @keydown.tab.prevent="locationCodeKeyDownTab(scope.row.locationCode)"
                        @keydown.enter.prevent="locationCodeKeyDownTab(scope.row.locationCode)"
                      >
                        <template #append>
                          <el-button icon="Search" @click="showStorageLocationDialog(scope.$index)"></el-button>
                        </template>
                      </el-input>-->
                      <TableHistoryInput
                        v-model="scope.row.locationCode"
                        :config="fixedInboundFormLocationCodeConfig"
                        placeholder="请输入目标库位编码"
                        @save="handleSave"
                        @select="handleSelect"
                        @keydown.tab.prevent="locationCodeKeyDownTab(scope.row.locationCode)"
                        @keydown.enter.prevent="locationCodeKeyDownTab(scope.row.locationCode)"
                      >
                        <template #append>
                          <el-button icon="Search" @click="showStorageLocationDialog(scope.$index)"></el-button>
                        </template>
                      </TableHistoryInput>
                    </template>
                  </el-table-column>

                  <!-- 可编辑的收货数量 -->
                  <el-table-column label="收货数量" align="center" width="150">
                    <template #default="scope">
                      <el-input-number
                        v-model="scope.row.receivePoQuantity"
                        :min="0"
                        :max="parseFloat(scope.row.openQuantity || 0)"
                        size="small"
                        controls-position="right"
                        :precision="3"
                        @change="handleReceivePoQuantityChange(scope.row)"
                      />
                    </template>
                  </el-table-column>

                  <el-table-column label="库存数量" prop="inventoryQuantity" />
                  <el-table-column label="库存单位" prop="inventoryUnit" />

                  <el-table-column label="操作" width="80" align="center">
                    <template #default="scope">
                      <el-button type="danger" link icon="Delete" @click="removeFromInboundList(scope.$index)"></el-button>
                    </template>
                  </el-table-column>
                </el-table>

                <div style="margin-top: 20px; text-align: center">
                  <el-button :loading="buttonLoading" type="primary" @click="submitForm" :disabled="inboundList.length === 0">采购收货</el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="STO收货" name="sto">
          <el-row :gutter="20">
            <!-- STO收货搜索区域 -->
            <el-col :span="24">
              <el-card shadow="never" class="search-card">
                <template #header>
                  <el-row :gutter="10" class="mb8">
                    <el-col :span="1.5">
                      <span>STO订单明细</span>
                    </el-col>
                    <right-toolbar v-model:showSearch="showStoSearch" :columns="stoColumns" @queryTable="getStoList"></right-toolbar>
                  </el-row>
                </template>

                <el-form ref="stoQueryFormRef" :model="stoQueryParams" :rules="stoRules" :inline="true" label-width="auto">
                  <el-form-item label="交货单号" prop="deliveryOrderNo">
                    <el-input v-model="stoQueryParams.deliveryOrderNo" placeholder="请输入交货单号" clearable @keydown.tab.prevent="handleStoQuery" @keydown.enter.prevent="handleStoQuery" />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" icon="Search" @click="handleStoQuery" :loading="stoLoading">搜索</el-button>
                    <el-button icon="Refresh" @click="resetStoQuery">重置</el-button>
                  </el-form-item>
                </el-form>

                <!-- STO搜索结果列表 -->
                <div class="search-result">
                  <el-table ref="stoTableRef" :data="stoOrderDetailList" height="300" border v-loading="stoLoading" @selection-change="handleStoSelectionChange">
                    <!--                    <el-table-column type="selection" width="55" align="center" />-->
                    <el-table-column v-if="stoColumns[0].visible" label="交货单号" align="left" prop="deliveryOrderNo" fixed="left" min-width="120" />
                    <el-table-column v-if="stoColumns[1].visible" label="交货单项次" align="left" prop="deliveryItemNo" fixed="left" />
                    <el-table-column v-if="stoColumns[2].visible" label="采购单号" align="left" prop="purchaseOrderNo" fixed="left" min-width="120" />
                    <el-table-column v-if="stoColumns[3].visible" label="采购单项次" align="left" prop="purchaseItemNo" fixed="left" min-width="80" />
                    <el-table-column label="交货状态" align="center" width="100" fixed="left">
                      <template #default="scope">
                        <el-tooltip :content="getEarlyDeliveryTooltip(scope.row)" placement="top">
                          <el-tag :type="getEarlyDeliveryTagType(scope.row)">
                            {{ getEarlyDeliveryText(scope.row) }}
                          </el-tag>
                        </el-tooltip>
                      </template>
                    </el-table-column>
                    <el-table-column v-if="stoColumns[4].visible" label="交货日期" align="center" prop="deliveryDate" min-width="100" />
                    <el-table-column v-if="stoColumns[5].visible" label="料号" align="left" prop="materialCode" min-width="135" />
                    <el-table-column v-if="stoColumns[6].visible" label="旧料号" align="left" prop="oldMaterialCode" />
                    <el-table-column v-if="stoColumns[7].visible" label="物料描述" align="left" prop="materialDesc" show-overflow-tooltip />
                    <el-table-column v-if="stoColumns[8].visible" label="订单数量" align="left" prop="orderQuantity" min-width="100" />
                    <el-table-column v-if="stoColumns[9].visible" label="已收数量" align="left" prop="receivedQuantity" min-width="100" />
                    <el-table-column v-if="stoColumns[10].visible" label="未清数量" align="left" prop="openQuantity" min-width="100" />
                    <el-table-column v-if="stoColumns[11].visible" label="订单单位" align="center" prop="orderUnit" />
                    <el-table-column v-if="stoColumns[12].visible" label="需质检" align="center" prop="inspectionFlag" />
                    <el-table-column v-if="stoColumns[13].visible" label="库存单位" align="center" prop="inventoryUnit" />
                    <el-table-column v-if="stoColumns[14].visible" label="换算比例" align="center" prop="conversionRatio" />
                    <el-table-column v-if="stoColumns[15].visible" label="供应商代码" align="center" prop="supplierCode" min-width="120" />
                    <el-table-column v-if="stoColumns[16].visible" label="供应商名称" align="center" prop="supplierName" show-overflow-tooltip min-width="120" />
                  </el-table>

                  <pagination v-show="stoTotal > 0" :total="stoTotal" v-model:page="stoQueryParams.pageNum" v-model:limit="stoQueryParams.pageSize" @pagination="getStoList" />
                </div>
              </el-card>
            </el-col>

            <div style="margin: 20px 0; text-align: center; width: 100%">
              <el-button type="primary" @click="addSelectedToStoInboundList" circle class="rotate-button">
                <el-icon><Switch /></el-icon>
              </el-button>
            </div>

            <!-- STO入库列表 -->
            <el-col :span="24">
              <el-card shadow="never">
                <template #header>
                  <div class="transfer-header">
                    <span class="header-title">STO入库列表</span>
                    <div class="header-actions">
                      <el-radio-group v-model="stoInboundMode">
                        <el-radio-button label="fixed">固定库位</el-radio-button>
                        <el-radio-button label="multiple">多库位</el-radio-button>
                      </el-radio-group>
                      <el-button type="danger" @click="clearStoInboundList" :disabled="stoInboundList.length === 0">清空列表</el-button>
                    </div>
                  </div>
                </template>

                <!-- 固定库位模式下的统一目标库位输入 -->
                <div style="padding: 10px; background-color: #f5f7fa; border-radius: 4px">
                  <el-form :model="stoFixedInboundForm" ref="stoFixedInboundFormRef" label-width="auto" :inline="true">
                    <el-row :gutter="20">
                      <el-col :sm="24" :md="8" :lg="8" v-if="stoInboundMode === 'fixed'">
                        <el-form-item label="目标库位" prop="locationCode" :rules="[{ required: true, message: '请输入目标库位编码', trigger: 'blur' }]">
                          <el-input
                            v-model.trim="stoFixedInboundForm.locationCode"
                            placeholder="请输入目标库位编码"
                            clearable
                            @keydown.tab.prevent="locationCodeKeyDownTab(stoFixedInboundForm.locationCode)"
                            @keydown.enter.prevent="locationCodeKeyDownTab(stoFixedInboundForm.locationCode)"
                          >
                            <template #append>
                              <el-button icon="Search" @click="showStorageLocationDialog(-1)"></el-button>
                            </template>
                          </el-input>
                        </el-form-item>
                      </el-col>
                      <el-col :sm="24" :md="8" :lg="8">
                        <el-form-item label="收货人">
                          <!--                          <el-input v-model="stoFixedInboundForm.targetUserName" placeholder="请输入收货人">
                            <template #append>
                              <el-button icon="Search" @click="showUserCollectionsDialog(-1)"></el-button>
                            </template>
                          </el-input>-->
                          <HistoryInput v-model="stoFixedInboundForm.targetUserName" :config="targetUserNameConfig" placeholder="请输入收货人" @save="handleSave" @select="handleSelect">
                            <template #append>
                              <el-button icon="Search" @click="showUserCollectionsDialog(-1)"></el-button>
                            </template>
                          </HistoryInput>
                        </el-form-item>
                      </el-col>
                      <el-col :sm="24" :md="8" :lg="8">
                        <el-form-item label="过账日期" prop="postingDate">
                          <el-date-picker clearable v-model="stoFixedInboundForm.postingDate" type="date" :disabled-date="disabledFutureDate" value-format="YYYY-MM-DD" placeholder="请选择接收日期" />
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </el-form>
                </div>

                <div v-if="stoResultMessage" class="m-y-2">
                  <el-alert show-icon center :title="stoResultMessage" :type="stoResultStatus ? 'success' : 'error'">
                    <template #icon>
                      <Bell />
                    </template>
                  </el-alert>
                </div>

                <el-table :data="stoInboundList" border style="width: 100%" v-loading="stoTableLoading" max-height="400">
                  <el-table-column type="index" width="50" align="center" />
                  <el-table-column label="交货单号" prop="deliveryOrderNo" />
                  <el-table-column label="交货单项次" prop="deliveryItemNo" />
                  <el-table-column label="采购订单号" prop="poNumber" />
                  <el-table-column label="采购单项次" prop="itemNumber" />
                  <el-table-column label="料号" prop="materialCode" />
                  <el-table-column label="物料描述" prop="materialDesc" show-overflow-tooltip />
                  <el-table-column label="订单数量" align="center" prop="orderQuantity" min-width="100" />
                  <el-table-column label="未清数量" prop="openQuantity" align="center" />

                  <!-- 多库位模式下显示独立的目标库位设置 -->
                  <el-table-column label="目标库位" width="220" v-if="stoInboundMode === 'multiple'">
                    <template #default="scope">
                      <el-input
                        v-model.trim="scope.row.locationCode"
                        placeholder="请输入目标库位编码"
                        clearable
                        @keydown.tab.prevent="locationCodeKeyDownTab(scope.row.locationCode)"
                        @keydown.enter.prevent="locationCodeKeyDownTab(scope.row.locationCode)"
                      >
                        <template #append>
                          <el-button icon="Search" @click="showStorageLocationDialog(scope.$index)"></el-button>
                        </template>
                      </el-input>
                    </template>
                  </el-table-column>

                  <el-table-column label="收货数量" prop="receiveQuantity" align="center" />
                  <el-table-column label="库存数量" prop="inventoryQuantity" align="center" />
                  <el-table-column label="库存单位" prop="inventoryUnit" align="center" />

                  <el-table-column label="操作" width="80" align="center">
                    <template #default="scope">
                      <el-button type="danger" link icon="Delete" @click="removeFromStoInboundList(scope.$index)"></el-button>
                    </template>
                  </el-table-column>
                </el-table>

                <div style="margin-top: 20px; text-align: center">
                  <el-button :loading="stoButtonLoading" type="primary" @click="submitStoForm" :disabled="stoInboundList.length === 0">STO收货</el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 库位选择对话框 -->
    <StorageLocationDialog ref="storageLocationDialogRef" @storage-location-select-call-back="storageLocationSelectCallBack" />
    <!-- 用户收藏 -->
    <UserCollectionsDialog ref="userCollectionsDialogRef" @user-collections-call-back="userCollectionsSelectCallBack" />
  </div>
</template>

<script setup name="PurchaseInbound" lang="ts">
import { addPurchaseInbound, listPurchaseOrderDetail } from '@/api/wms/purchaseOrderDetail';
import { listDeliveryOrderDetail } from '@/api/wms/deliveryOrderDetail';
import { PurchaseOrderDetailVO, PurchaseOrderDetailQuery, PurchaseOrderDetailForm } from '@/api/wms/purchaseOrderDetail/types';
import HistoryInput from '@/components/HistoryInput/index.vue';
import TableHistoryInput from '@/components/TableHistoryInput/index.vue';
import StorageLocationDialog from '@/views/wms/packing/components/storageLocationDialog.vue';
import UserCollectionsDialog from '@/views/wms/userCollections/components/userCollectionsDialog.vue';
const storageLocationDialogRef = ref<InstanceType<typeof StorageLocationDialog>>();
const userCollectionsDialogRef = ref<InstanceType<typeof UserCollectionsDialog>>();
import { nextTick, ref } from 'vue';
import { ArrowDown, ArrowUp, Bell, Switch } from '@element-plus/icons-vue';
import { HttpStatus } from '@/enums/RespEnum';
import { listStorageLocation } from '@/api/wms/storageLocation';
import { HistoryConfig } from '@/types/history';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const purchaseOrderDetailList = ref<PurchaseOrderDetailVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const currenIndex = ref(0);
const resultMessage = ref('');
const resultStatus = ref(false);
const buttonLoading = ref(false);
const tableLoading = ref(false);
const selectedSearchItems = ref<PurchaseOrderDetailVO[]>([]);
const inboundList = ref<any[]>([]);
const showAdvancedSearch = ref(false);
const activeTab = ref('po');

/** 切换高级搜索显示状态 */
const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value;
};

// 入库模式：fixed-固定库位，multiple-多库位
const inboundMode = ref<'fixed' | 'multiple'>('fixed');

// 固定库位模式下的表单数据
const fixedInboundForm = ref({
  locationCode: '',
  targetUserName: '',
  postingDate: null
});

const queryFormRef = ref<ElFormInstance>();
const purchaseTableRef = ref<ElTableInstance>();

const initFormData: PurchaseOrderDetailForm = {
  id: undefined,
  poNumber: undefined,
  itemNumber: undefined,
  materialCode: undefined,
  materialDesc: undefined,
  shortText: undefined,
  orderQuantity: undefined,
  orderUnit: undefined,
  returnFlag: undefined,
  openQuantity: undefined,
  itemDeleteFlag: undefined,
  completedFlag: undefined,
  enableSapSync: true,
  showOpenQuantityZero: false,
  receiveType: '1',
  remark: undefined
};

const data = reactive<PageData<PurchaseOrderDetailForm, PurchaseOrderDetailQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    poNumber: undefined,
    itemNumber: undefined,
    materialCode: undefined,
    materialDesc: undefined,
    shortText: undefined,
    orderQuantity: undefined,
    orderUnit: undefined,
    returnFlag: undefined,
    openQuantity: undefined,
    itemDeleteFlag: undefined,
    completedFlag: undefined,
    enableSapSync: true,
    showOpenQuantityZero: false,
    receiveType: '1',
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

const poNumberConfig: HistoryConfig = {
  key: 'purchaseInbound.poNumber',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseInbound',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const fixedInboundFormLocationCodeConfig: HistoryConfig = {
  key: 'purchaseInbound.locationCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseInbound',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const targetUserNameConfig: HistoryConfig = {
  key: 'purchaseInbound.targetUserName',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'purchaseInbound',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

// 列显隐信息
const columns = ref<FieldOption[]>([
  { key: 0, label: `采购单`, visible: true, children: [] },
  { key: 1, label: `项次`, visible: true, children: [] },
  { key: 2, label: `排程`, visible: true, children: [] },
  { key: 3, label: `交货日期`, visible: true, children: [] },
  { key: 4, label: `料号`, visible: true, children: [] },
  { key: 5, label: `旧料号`, visible: false, children: [] },
  { key: 6, label: `物料描述`, visible: true, children: [] },
  { key: 7, label: `订单数量`, visible: true, children: [] },
  { key: 8, label: `已收数量`, visible: true, children: [] },
  { key: 9, label: `未清数量`, visible: true, children: [] },
  { key: 10, label: `订单单位`, visible: true, children: [] },
  { key: 11, label: `需质检`, visible: false, children: [] },
  { key: 12, label: `库存数量`, visible: false, children: [] },
  { key: 13, label: `库存单位`, visible: false, children: [] },
  { key: 14, label: `换算比例`, visible: false, children: [] },
  { key: 15, label: `供应商代码`, visible: true, children: [] },
  { key: 16, label: `供应商名称`, visible: true, children: [] }
]);

const handleSave = (value: string) => {
  // 执行搜索逻辑
};

const handleSelect = (item: HistoryItem) => {
  // 填充到搜索框并执行搜索
};

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

// 获取提前交货标识的文本
const getEarlyDeliveryText = (row) => {
  if (isEarlyDeliveryForbidden(row)) {
    return '禁止';
  }
  return '允许';
};

// 获取提前交货标识的类型 (red表示禁止, green表示允许)
const getEarlyDeliveryTagType = (row) => {
  if (isEarlyDeliveryForbidden(row)) {
    return 'danger'; // 红色
  }
  return 'success'; // 绿色
};

// 获取提前交货的提示信息
const getEarlyDeliveryTooltip = (row) => {
  if (isEarlyDeliveryForbidden(row)) {
    return '禁止厂商提前三个工作日交货';
  }
  return '允许提前交货';
};

// 判断是否禁止提前交货
const isEarlyDeliveryForbidden = (row) => {
  // 条件1: 供应商 != 'TWZ0'
  const isSupplierNotTWZ0 = row.supplierCode !== 'TWZ0';

  // 条件2: 项目类别 != '2'
  const isProjectCategoryNot2 = row.projectCategory !== '2';

  // 条件3: 存在交货日期和过账日期
  if (!row.deliveryDate) {
    return false;
  }

  // 条件4: 最早交货日期小于当前时间
  const earlyDeliveryDate = new Date(row.earlyDeliveryDate);
  const isPostingTooEarly = earlyDeliveryDate > new Date();

  // 所有条件都满足时，禁止提前交货
  return isSupplierNotTWZ0 && isProjectCategoryNot2 && isPostingTooEarly;
};

/** 查询采购订单明细列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listPurchaseOrderDetail(queryParams.value);
    purchaseOrderDetailList.value = res.rows;
    total.value = res.total;
    loading.value = false;
  } catch (error) {
    loading.value = false;
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

// 添加一个方法用于计算库存数量
const calculateInventoryQuantity = (row) => {
  row.inventoryQuantity = ((row.receivePoQuantity || 0) * (row.conversionRatio || 1)).toFixed(3);
};

// 监听收货数量变化的处理方法
const handleReceivePoQuantityChange = (row) => {
  // 如果输入为空，则库存数量也设为0
  if (row.receivePoQuantity === null || row.receivePoQuantity === undefined || row.receivePoQuantity === '') {
    row.inventoryQuantity = 0;
  } else {
    calculateInventoryQuantity(row);
  }
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  // 清除表格选中状态
  purchaseTableRef.value?.clearSelection();
  handleQuery();
};

/** 搜索结果选择变化 */
const handleSelectionChange = (selection: PurchaseOrderDetailVO[]) => {
  selectedSearchItems.value = selection;
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 添加选中项到入库列表 */
const addSelectedToInboundList = () => {
  if (selectedSearchItems.value.length === 0) {
    proxy?.$modal.msgWarning('请先选择要添加的采购订单明细');
    return;
  }

  const newItems = selectedSearchItems.value.map((item) => ({
    ...item,
    receivePoQuantity: item.openQuantity,
    storageLocation: '',
    conversionRatio: item.conversionRatio || 1, // 确保有换算比例，默认为1
    inventoryQuantity: (item.openQuantity * (item.conversionRatio || 1)).toFixed(3) // 初始库存数量 = 收货数量 * 换算比例
  }));

  // 添加到入库列表
  inboundList.value.push(...newItems);

  proxy?.$modal.msgSuccess(`成功添加${newItems.length}条记录到入库列表`);

  // 清除选中状态
  purchaseTableRef.value?.clearSelection();
};

/** 从入库列表中移除 */
const removeFromInboundList = (index: number) => {
  inboundList.value.splice(index, 1);
};

/** 清空入库列表 */
const clearInboundList = () => {
  inboundList.value = [];
  fixedInboundForm.value.locationCode = '';
  fixedInboundForm.value.targetUserName = '';
  fixedInboundForm.value.postingDate = null;
};

/** 显示库位选择对话框 */
const showStorageLocationDialog = (index: number) => {
  storageLocationDialogRef.value?.openDialog();
  storageLocationDialogRef.value?.handleQuery();
  currenIndex.value = index;
};

/** 库位选择回调 */
const storageLocationSelectCallBack = (record: any) => {
  resultMessage.value = '';
  if (activeTab.value === 'po') {
    if (inboundMode.value === 'fixed') {
      // 固定库位模式，设置统一的目标库位
      fixedInboundForm.value.locationCode = record.locationCode;
    } else if (inboundMode.value === 'multiple') {
      // 多库位模式，设置对应行的目标库位
      if (currenIndex.value >= 0 && currenIndex.value < inboundList.value.length) {
        const currentItem = inboundList.value[currenIndex.value];
        currentItem.locationCode = record.locationCode;
      }
    }
  }
  if (activeTab.value === 'sto') {
    if (stoInboundMode.value === 'fixed') {
      // sto 固定库位模式，设置统一的目标库位
      stoFixedInboundForm.value.locationCode = record.locationCode;
    } else if (stoInboundMode.value === 'multiple') {
      // sto 多库位模式，设置对应行的目标库位
      if (currenIndex.value >= 0 && currenIndex.value < stoInboundList.value.length) {
        const currentItem = stoInboundList.value[currenIndex.value];
        currentItem.locationCode = record.locationCode;
      }
    }
  }
};

/** 显示用户收藏选择对话框 */
const showUserCollectionsDialog = (index: number) => {
  userCollectionsDialogRef.value?.openDialog();
  userCollectionsDialogRef.value?.handleQuery();
  currenIndex.value = index;
};

/** 用户收藏回调 **/
const userCollectionsSelectCallBack = (record: any) => {
  if (activeTab.value === 'po') {
    if (inboundMode.value === 'fixed') {
      // 固定库位模式，设置统一的目标用户
      fixedInboundForm.value.targetUserName = record.nickName;
    } else if (inboundMode.value === 'multiple') {
      // 多库位模式，设置对应行的目标库位
      if (currenIndex.value >= 0 && currenIndex.value < inboundList.value.length) {
        const currentItem = inboundList.value[currenIndex.value];
        currentItem.targetUserName = record.nickName;
      }
    }
  }
  if (activeTab.value === 'sto') {
    if (stoInboundMode.value === 'fixed') {
      // sto 固定库位模式，设置统一的目标用户
      stoFixedInboundForm.value.targetUserName = record.nickName;
    } else if (stoInboundMode.value === 'multiple') {
      // 多库位模式，设置对应行的目标用户
      if (currenIndex.value >= 0 && currenIndex.value < stoInboundList.value.length) {
        const currentItem = stoInboundList.value[currenIndex.value];
        currentItem.targetUserName = record.nickName;
      }
    }
  }
};

/** 提交采购收货 */
const submitForm = async () => {
  const validPurchaseInboundList = inboundList.value.filter((item) => item.receivePoQuantity > 0);
  resultStatus.value = true;
  resultMessage.value = '';
  if (validPurchaseInboundList.length === 0) {
    resultMessage.value = '收货数量不能都为0';
    resultStatus.value = false;
    return;
  }

  // 获取所有不同的采购订单类型
  const poCategories = [...new Set(validPurchaseInboundList.map((item) => item.poCategory))];

  // 托外加工收货(poCategory=3)，不允许和其他类型一起收货
  const hasOutsourcing = poCategories.includes('3');
  const hasOtherTypes = poCategories.some((category) => category !== '3');

  if (hasOutsourcing && hasOtherTypes) {
    resultMessage.value = '托外加工收货，不允许和其他类型一起收货';
    resultStatus.value = false;
    return;
  }

  if (inboundMode.value === 'fixed') {
    // 固定库位模式验证
    if (!fixedInboundForm.value.locationCode) {
      resultMessage.value = '请输入目标库位编码';
      resultStatus.value = false;
      return;
    }

    // 为所有记录设置统一的目标库位
    validPurchaseInboundList.forEach((item) => {
      item.locationCode = fixedInboundForm.value.locationCode || '';
      item.targetUserName = fixedInboundForm.value.targetUserName || '';
      item.postingDate = fixedInboundForm.value.postingDate ? fixedInboundForm.value.postingDate + ' 00:00:00' : '';
    });
  } else {
    // 多库位模式验证
    const invalidItems = validPurchaseInboundList.filter((item) => !item.locationCode);
    if (invalidItems.length > 0) {
      resultMessage.value = '请填写所有入库记录的目标库位';
      resultStatus.value = false;
      return;
    }
    // 为所有记录设置统一的接收方、过账日期
    validPurchaseInboundList.forEach((item) => {
      item.targetUserName = fixedInboundForm.value.targetUserName || '';
      item.postingDate = fixedInboundForm.value.postingDate ? fixedInboundForm.value.postingDate + ' 00:00:00' : '';
    });
  }

  // 验证收货数量是否超过未清数量
  const overQuantityItems = validPurchaseInboundList.filter((item) => item.receivePoQuantity > item.openQuantity);
  if (overQuantityItems.length > 0) {
    resultMessage.value = '收货数量不能超过未清数量';
    resultStatus.value = false;
    return;
  }

  buttonLoading.value = true;
  try {
    // 构造入库请求参数
    const purchaseInboundRequests = validPurchaseInboundList.map((item) => ({
      ...item,
      receivePoQuantity: item.receivePoQuantity,
      receivePoUnit: item.orderUnit,
      receiveQuantity: item.inventoryQuantity,
      receiveUnit: item.inventoryUnit
    }));

    const res: any = await addPurchaseInbound({
      purchaseOrderInboundBoList: purchaseInboundRequests
    });

    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg;
      resultStatus.value = false;
      return;
    }
    resultMessage.value = `采购入库成功，物料凭证号${res.msg}`;
    resultStatus.value = true;
    inboundList.value = [];
    fixedInboundForm.value.locationCode = '';
    fixedInboundForm.value.targetUserName = '';
    fixedInboundForm.value.postingDate = null;
    handleQuery();
  } catch (error) {
    resultMessage.value = error.message || '入库失败';
    resultStatus.value = false;
  } finally {
    buttonLoading.value = false;
  }
};

// STO收货相关数据
const stoOrderDetailList = ref([]);
const stoLoading = ref(false);
const showStoSearch = ref(true);
const stoTotal = ref(0);
const stoSelectedItems = ref([]);
const stoInboundList = ref([]);
const stoInboundMode = ref<'fixed' | 'multiple'>('fixed');
const stoResultMessage = ref('');
const stoResultStatus = ref(false);
const stoButtonLoading = ref(false);
const stoTableLoading = ref(false);

const stoFixedInboundForm = ref({
  locationCode: '',
  targetUserName: '',
  postingDate: null
});

const stoQueryFormRef = ref();
const stoTableRef = ref();

const stoQueryParams = ref({
  pageNum: 1,
  pageSize: 1000,
  deliveryOrderNo: undefined,
  poNumber: undefined,
  itemNumber: undefined,
  materialCode: undefined,
  enableSapSync: true,
  receiveType: 2
});
const stoRules = ref({
  deliveryOrderNo: [{ required: true, message: '收货单号不能为空', trigger: 'blur' }]
});

// STO列配置
const stoColumns = ref([
  { key: 0, label: `交货单号`, visible: true, children: [] },
  { key: 1, label: `交货单项次`, visible: true, children: [] },
  { key: 2, label: `采购单号`, visible: true, children: [] },
  { key: 3, label: `采购单项次`, visible: true, children: [] },
  { key: 4, label: `交货日期`, visible: true, children: [] },
  { key: 5, label: `料号`, visible: true, children: [] },
  { key: 6, label: `旧料号`, visible: false, children: [] },
  { key: 7, label: `物料描述`, visible: true, children: [] },
  { key: 8, label: `订单数量`, visible: true, children: [] },
  { key: 9, label: `已收数量`, visible: true, children: [] },
  { key: 10, label: `未清数量`, visible: true, children: [] },
  { key: 11, label: `订单单位`, visible: false, children: [] },
  { key: 12, label: `需质检`, visible: false, children: [] },
  { key: 13, label: `库存单位`, visible: false, children: [] },
  { key: 14, label: `换算比例`, visible: true, children: [] },
  { key: 15, label: `供应商代码`, visible: true, children: [] },
  { key: 16, label: `供应商名称`, visible: true, children: [] }
]);

const handleTabClick = (tab) => {
  // 切换标签时的处理逻辑
  console.log('切换到标签:', tab.props.name);
  if (tab.props.name === 'sto' && stoOrderDetailList.value.length === 0) {
    getStoList();
  }
};

// STO收货相关方法
const getStoList = async () => {
  stoQueryFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      stoLoading.value = true;
      try {
        const res = await listDeliveryOrderDetail(stoQueryParams.value);
        stoOrderDetailList.value = res.rows;
        total.value = res.total;
        stoLoading.value = false;
      } catch (error) {
        stoLoading.value = false;
      }
    }
  });
};

const handleStoQuery = () => {
  stoQueryParams.value.pageNum = 1;
  getStoList();
};

const resetStoQuery = () => {
  stoQueryFormRef.value?.resetFields();
  stoTableRef.value?.clearSelection();
};

const handleStoSelectionChange = (selection) => {
  stoSelectedItems.value = selection;
};

const addSelectedToStoInboundList = () => {
  // if (stoSelectedItems.value.length === 0) {
  //   proxy?.$modal.msgWarning('请先选择要添加的STO订单明细');
  //   return;
  // }
  stoInboundList.value = [];
  const newItems = stoOrderDetailList.value.map((item) => ({
    ...item,
    poNumber: item.purchaseOrderNo,
    itemNumber: item.purchaseItemNo,
    receiveQuantity: item.orderQuantity,
    receiveUnit: item.unit,
    inventoryQuantity: (item.orderQuantity * (item.conversionRatio || 1)).toFixed(3)
  }));

  // 添加到STO入库列表
  stoInboundList.value.push(...newItems);

  proxy?.$modal.msgSuccess(`成功添加${newItems.length}条记录到STO入库列表`);

  // 清除选中状态
  stoTableRef.value?.clearSelection();
};

const removeFromStoInboundList = (index: number) => {
  stoInboundList.value.splice(index, 1);
};

const clearStoInboundList = () => {
  stoInboundList.value = [];
  stoFixedInboundForm.value.locationCode = '';
  stoFixedInboundForm.value.targetUserName = '';
  stoFixedInboundForm.value.postingDate = null;
};

const submitStoForm = async () => {
  const validStoInboundList = stoInboundList.value.filter((item) => item.receiveQuantity > 0);
  stoResultStatus.value = true;
  stoResultMessage.value = '';
  if (validStoInboundList.length === 0) {
    stoResultMessage.value = '收货数量不能都为0';
    stoResultStatus.value = false;
    return;
  }

  if (stoInboundMode.value === 'fixed') {
    // 固定库位模式验证
    if (!stoFixedInboundForm.value.locationCode) {
      stoResultMessage.value = '请输入目标库位编码';
      stoResultStatus.value = false;
      return;
    }

    // 为所有记录设置统一的目标库位
    validStoInboundList.forEach((item) => {
      item.locationCode = stoFixedInboundForm.value.locationCode || '';
      item.targetUserName = stoFixedInboundForm.value.targetUserName || '';
      item.postingDate = stoFixedInboundForm.value.postingDate ? stoFixedInboundForm.value.postingDate + ' 00:00:00' : '';
    });
  } else {
    // 多库位模式验证
    const invalidItems = validStoInboundList.filter((item) => !item.locationCode);
    if (invalidItems.length > 0) {
      stoResultMessage.value = '请填写所有入库记录的目标库位';
      stoResultStatus.value = false;
      return;
    }
    // 为所有记录设置统一的接收方、过账日期
    validStoInboundList.forEach((item) => {
      item.targetUserName = stoFixedInboundForm.value.targetUserName || '';
      item.postingDate = stoFixedInboundForm.value.postingDate ? stoFixedInboundForm.value.postingDate + ' 00:00:00' : '';
    });
  }

  // 验证收货数量是否超过未清数量
  const overQuantityItems = validStoInboundList.filter((item) => item.receiveQuantity > item.openQuantity);
  if (overQuantityItems.length > 0) {
    stoResultMessage.value = '收货数量不能超过未清数量';
    stoResultStatus.value = false;
    return;
  }

  stoButtonLoading.value = true;
  try {
    // 构造STO入库请求参数
    const stoInboundRequests = validStoInboundList.map((item) => ({
      ...item,
      receiveQuantity: item.receiveQuantity,
      receiveUnit: item.unit,
      receiveType: '2'
    }));
    const res: any = await addPurchaseInbound({
      purchaseOrderInboundBoList: stoInboundRequests
    });

    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg;
      resultStatus.value = false;
      return;
    }
    stoResultMessage.value = `STO入库成功，物料凭证号${res.msg}`;
    stoResultStatus.value = true;
    stoInboundList.value = [];
    stoFixedInboundForm.value.locationCode = '';
    stoFixedInboundForm.value.targetUserName = '';
    stoFixedInboundForm.value.postingDate = null;
    getStoList();
  } catch (error) {
    stoResultMessage.value = error.message || '入库失败';
    stoResultStatus.value = false;
    stoButtonLoading.value = false;
  } finally {
    stoButtonLoading.value = false;
  }
};

onMounted(() => {
  getList();
});
</script>

<style scoped>
.search-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
}

.search-result {
  flex: 1;
  overflow: auto;
  min-height: 200px;
}

.vertical-layout {
  flex-direction: column;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-card {
    min-height: 250px;
  }

  .search-result {
    min-height: 150px;
  }
}

.transfer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.rotate-button {
  transform: rotate(90deg);
  margin: 0 auto;
}

/* 响应式调整 - 在小屏幕上的显示 */
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
