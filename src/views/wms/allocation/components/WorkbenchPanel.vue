<template>
  <div class="workbench-panel">
    <el-steps :active="stepsActive" finish-status="success" align-center class="workbench-steps">
      <el-step title="选择需求人" :description="demandUserStepDesc" />
      <el-step title="选择工单与备料" :description="prepStepDesc" />
      <el-step title="仓别分类" description="按已分配库位仓别编码分流" />
      <el-step title="执行任务" description="按任务卡执行 261 扣料或跟进备料/缺料" />
    </el-steps>
    <div v-if="activeStep === 0" class="step-body demand-user-step">
      <el-card shadow="never" class="demand-user-card">
        <el-form label-width="96px" class="demand-user-form">
          <el-form-item label="需求人">
            <el-radio-group v-model="demandUserMode">
              <el-radio value="self">本人（{{ currentUserDisplay || '-' }}）</el-radio>
              <el-radio value="other">其他人</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="demandUserMode === 'other'" label="其他人">
            <el-select v-model="otherUserCode" placeholder="请选择其他需求人员" filterable clearable style="width: 320px">
              <el-option v-for="dict in otherUserOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
        </el-form>
        <div class="step-toolbar">
          <el-button type="primary" @click="confirmDemandUser">下一步</el-button>
        </div>
      </el-card>
    </div>
    <div v-if="activeStep === 1" class="step-body">
      <div class="step-toolbar">
        <el-button @click="goToDemandUserStep">重选需求人</el-button>
        <el-button type="primary" @click="showOrderDialog = true">
          <el-icon><Plus /></el-icon>
          选择工单
        </el-button>
        <el-button type="primary" plain :disabled="!selectedOrders.length" @click="openMergedPrepBom">填写合并备料清单</el-button>
        <el-button type="success" :disabled="!canClassify" :loading="classifying" @click="confirmClassify">
          <el-icon><Sort /></el-icon>
          确认备料并分类
        </el-button>
        <span v-if="selectedOrders.length" class="hint">已选 {{ selectedOrders.length }} 个工单 · 备料 {{ totalPrepLineCount }} 条</span>
      </div>
      <el-table v-if="selectedOrders.length" :data="selectedOrders" border size="small" max-height="420">
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
      <el-empty v-else description="请选择工单，点击「填写合并备料清单」统一勾选物料并分配库位（共用料按序号统一推荐）" />
    </div>
    <div v-if="activeStep === 2" class="step-body">
      <div class="step-toolbar">
        <el-button @click="backToPrepStep">上一步</el-button>
        <el-button v-if="planRowCount" type="primary" :loading="generatingPrep" @click="generateDemandPlan"
          ><el-icon><MagicStick /></el-icon>生成备料需求（{{ planRowCount }}条）</el-button
        >
        <span v-if="isClassified" class="hint">自动仓 {{ autoMaterialRows.length }} · 线边仓 {{ lineMaterialRows.length }} · 平面仓 {{ flatMaterialRows.length }} · 缺料 {{ shortageMaterialRows.length }}</span>
      </div>
      <el-alert v-if="isClassified" type="info" :closable="false" show-icon class="classify-hint">确认下方分类无误后，点「生成备料需求」将自动仓、线边仓、平面仓及缺料合并为一个备料计划</el-alert>
      <el-row v-if="isClassified" :gutter="16" class="order-sections">
        <el-col :span="12">
          <el-card shadow="never" class="section-card">
            <template #header>
              <div class="section-header">
                <span>自动仓 · 261 扣账</span>
                <el-tag type="success" size="small">{{ autoMaterialRows.length }} 条</el-tag>
              </div>
            </template>
            <el-table v-if="autoMaterialRows.length" :data="autoMaterialRows" border size="small" max-height="280">
              <el-table-column prop="workOrderNo" label="工单号" min-width="100" />
              <el-table-column prop="materialCode" label="物料编码" min-width="100" />
              <el-table-column label="本次备料数量" min-width="110" align="right">
                <template #default="{ row }">{{ formatClassifiedPrepQty(row) }}</template>
              </el-table-column>
              <el-table-column label="推荐仓别" width="90">
                <template #default="{ row }">{{ row.recommendedWarehouse || '-' }}</template>
              </el-table-column>
              <el-table-column label="推荐库位" min-width="100">
                <template #default="{ row }">{{ row.recommendedLocation || '-' }}</template>
              </el-table-column>
              <prep-demand-location-source-column show-remark :rows="autoMaterialRows" />
              <el-table-column label="操作" width="70" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="openPrepBomByNo(row.workOrderNo, row.materialCode)">调整</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无自动仓需求" :image-size="64" />
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" class="section-card">
            <template #header>
              <div class="section-header">
                <span>线边仓 · 待物料员 261 扣料</span><el-tag type="warning" size="small">{{ lineMaterialRows.length }} 条</el-tag>
              </div>
            </template>
            <el-table v-if="lineMaterialRows.length" :data="lineMaterialRows" border size="small" max-height="280">
              <el-table-column prop="workOrderNo" label="工单号" min-width="100" />
              <el-table-column prop="materialCode" label="物料编码" min-width="100" />
              <el-table-column label="本次备料数量" min-width="110" align="right">
                <template #default="{ row }">{{ formatClassifiedPrepQty(row) }}</template>
              </el-table-column>
              <el-table-column label="推荐仓别" width="90">
                <template #default="{ row }">{{ row.recommendedWarehouse || '-' }}</template>
              </el-table-column>
              <el-table-column label="推荐库位" min-width="100">
                <template #default="{ row }">{{ row.recommendedLocation || '-' }}</template>
              </el-table-column>
              <prep-demand-location-source-column show-remark :rows="lineMaterialRows" />
              <el-table-column label="操作" width="70" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="openPrepBomByNo(row.workOrderNo, row.materialCode)">调整</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无线边仓需求" :image-size="64" />
          </el-card>
        </el-col>
        <el-col :span="12" class="section-col-bottom">
          <el-card shadow="never" class="section-card">
            <template #header>
              <div class="section-header">
                <span>平面仓 · 备料需求</span><el-tag type="primary" size="small">{{ flatMaterialRows.length }} 条</el-tag>
              </div>
            </template>
            <el-table v-if="flatMaterialRows.length" :data="flatMaterialRows" border size="small" max-height="280">
              <el-table-column prop="workOrderNo" label="工单号" min-width="100" />
              <el-table-column prop="materialCode" label="物料编码" min-width="100" />
              <el-table-column label="本次备料数量" min-width="110" align="right">
                <template #default="{ row }">{{ formatClassifiedPrepQty(row) }}</template>
              </el-table-column>
              <el-table-column label="推荐仓别" width="90">
                <template #default="{ row }">{{ row.recommendedWarehouse || '-' }}</template>
              </el-table-column>
              <el-table-column label="推荐库位" min-width="100"
                ><template #default="{ row }">{{ row.recommendedLocation || '-' }}</template>
              </el-table-column>
              <prep-demand-location-source-column show-remark :rows="flatMaterialRows" />
              <el-table-column label="操作" width="70" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="openPrepBomByNo(row.workOrderNo, row.materialCode)">调整</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无平面仓需求" :image-size="64" />
          </el-card>
        </el-col>
        <el-col :span="12" class="section-col-bottom">
          <el-card shadow="never" class="section-card">
            <template #header>
              <div class="section-header">
                <span>缺料</span><el-tag type="danger" size="small">{{ shortageMaterialRows.length }} 条</el-tag>
              </div>
            </template>
            <el-table v-if="shortageMaterialRows.length" :data="shortageMaterialRows" border size="small" max-height="280">
              <el-table-column prop="workOrderNo" label="工单号" min-width="100" />
              <el-table-column prop="materialCode" label="物料编码" min-width="100" />
              <el-table-column label="库存类型" width="100" align="center">
                <template #default="{ row }">
                  <dict-tag :options="wms_inventory_special_flag" :value="resolveDemandRowInventoryFlag(row)" />
                </template>
              </el-table-column>
              <el-table-column label="本次备料数量" min-width="110" align="right">
                <template #default="{ row }">{{ formatClassifiedPrepQty(row) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="70" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="openPrepBomByNo(row.workOrderNo, row.materialCode)">调整</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无缺料需求" :image-size="64" />
          </el-card>
        </el-col>
      </el-row>
      <el-empty v-else description="请返回上一步完成备料并分类" />
    </div>
    <div v-if="activeStep === 3" class="step-body">
      <div class="step-toolbar">
        <el-button v-if="!taskExecutionFinished" size="small" @click="activeStep = 2">返回分类</el-button>
        <el-button v-if="currentDemand && !taskExecutionFinished" size="small" @click="reloadDemandDetail">刷新</el-button>
        <el-button v-if="currentDemand?.issueId && !taskExecutionFinished" type="primary" size="small" @click="goToMaterialIssue">去领料</el-button>
        <el-button v-if="taskExecutionFinished" type="primary" @click="resetForNextPrepRound">开始下一轮备料</el-button>
      </div>
      <div v-if="resultMessage" class="result-alert">
        <el-alert show-icon :title="resultMessage" :type="resultStatus ? 'success' : 'error'" :closable="false">
          <template #icon>
            <Bell />
          </template>
        </el-alert>
      </div>
      <el-result v-if="taskExecutionFinished" icon="success" title="本轮备料任务已提交" sub-title="平面仓与缺料需求已纳入备料计划，仓库将按任务跟进。可开始下一轮备料。" class="task-finish-result">
        <template #extra>
          <el-button type="primary" @click="resetForNextPrepRound">开始下一轮备料</el-button>
        </template>
      </el-result>
      <el-descriptions v-if="currentDemand" :column="4" border size="small" class="plan-summary">
        <el-descriptions-item label="需求单号">{{ currentDemand.demandNo }}</el-descriptions-item>
        <el-descriptions-item label="工单数">{{ currentDemand.workOrderCount }} 个</el-descriptions-item>
        <el-descriptions-item label="缺料行">{{ shortageMaterialRows.length }} 条</el-descriptions-item>
        <el-descriptions-item label="齐套率">{{ formatKitRate(currentDemand.kitRate) }}%</el-descriptions-item>
      </el-descriptions>
      <div v-if="currentDemand && hasWarehouse261Tasks && !taskExecutionFinished" class="warehouse261-toolbar">
        <span class="warehouse261-label">261 扣料操作</span>
        <el-button v-if="prep261AutoRows.length" type="success" :loading="submittingAuto" @click="submitAutoIssue">自动仓 · 261 扣账（{{ prep261AutoRows.length }}条）</el-button>
        <el-button v-if="prep261LineRows.length" type="warning" :loading="submittingLine" @click="submitLineIssue">线边仓 · 待物料员 261 扣料（{{ prep261LineRows.length }}条）</el-button>
        <el-button v-if="canSubmitCombined261" type="primary" :loading="submittingCombined" @click="submitCombinedIssue">自动仓+线边仓 · 261 合并扣料（{{ combined261RowCount }}条）</el-button>
      </div>
      <el-row v-if="currentDemand" :gutter="16" class="task-cards">
        <el-col v-if="prep261AutoDisplayRows.length" :span="12" class="task-col">
          <el-card shadow="never" class="task-card section-card">
            <template #header
              ><div class="section-header">
                <span>自动仓 · 261 扣账</span>
                <el-tag v-if="prep261AutoRows.length" type="warning" size="small">待执行</el-tag>
                <el-tag v-else type="success" size="small">已完成</el-tag>
                <el-tag type="info" size="small">{{ prep261AutoDisplayRows.length }} 条</el-tag>
              </div>
            </template>
            <div class="task-card-body">
              <el-table :data="prep261AutoDisplayRows" border size="small" max-height="280">
                <el-table-column prop="workOrderNo" label="工单号" min-width="100" />
                <el-table-column prop="materialCode" label="物料编码" min-width="100" />
                <el-table-column label="本次备料数量" min-width="110" align="right">
                  <template #default="{ row }">{{ formatPrepQtyWithUnit(row) }}</template>
                </el-table-column>
                <el-table-column label="仓别" width="90">
                  <template #default="{ row }">{{ row.warehouseCode || '-' }}</template>
                </el-table-column>
                <el-table-column label="库位" min-width="100">
                  <template #default="{ row }">{{ row.locationCode || '-' }}</template>
                </el-table-column>
                <el-table-column label="状态" width="88" align="center">
                  <template #default="{ row }">
                    <el-tag :type="lineStatusTag(row.lineStatus)" size="small">{{ lineStatusLabel(row.lineStatus) }}</el-tag>
                  </template>
                </el-table-column>
                <prep-demand-location-source-column show-remark :rows="prep261AutoDisplayRows" />
                <el-table-column label="操作" width="70" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" link size="small" @click="openPrepBomByNo(row.workOrderNo, row.materialCode)">调整</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-col>
        <el-col v-if="prep261LineDisplayRows.length" :span="12" class="task-col">
          <el-card shadow="never" class="task-card section-card">
            <template #header>
              <div class="section-header">
                <span>线边仓 · 待物料员 261 扣料</span>
                <el-tag v-if="prep261LineRows.length" type="warning" size="small">待执行</el-tag>
                <el-tag v-else type="success" size="small">已完成</el-tag>
                <el-tag type="warning" size="small">{{ prep261LineDisplayRows.length }} 条</el-tag>
              </div>
            </template>
            <div class="task-card-body">
              <el-table :data="prep261LineDisplayRows" border size="small" max-height="280">
                <el-table-column prop="workOrderNo" label="工单号" min-width="100" />
                <el-table-column prop="materialCode" label="物料编码" min-width="100" />
                <el-table-column label="本次备料数量" min-width="110" align="right">
                  <template #default="{ row }">{{ formatPrepQtyWithUnit(row) }}</template></el-table-column
                >
                <el-table-column label="仓别" width="90">
                  <template #default="{ row }">{{ row.warehouseCode || '-' }}</template>
                </el-table-column>
                <el-table-column label="库位" min-width="100">
                  <template #default="{ row }">{{ row.locationCode || '-' }}</template></el-table-column
                >
                <el-table-column label="状态" width="88" align="center">
                  <template #default="{ row }">
                    <el-tag :type="lineStatusTag(row.lineStatus)" size="small">{{ lineStatusLabel(row.lineStatus) }}</el-tag>
                  </template>
                </el-table-column>
                <prep-demand-location-source-column show-remark :rows="prep261LineDisplayRows" />
                <el-table-column label="操作" width="70" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" link size="small" @click="openPrepBomByNo(row.workOrderNo, row.materialCode)">调整</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-col>
        <el-col v-if="flatMaterialRows.length" :span="12" class="task-col section-col-bottom">
          <el-card shadow="never" class="task-card section-card">
            <template #header>
              <div class="section-header task-card-header">
                <span>平面仓 · 备料需求</span>
                <div class="task-header-actions">
                  <el-tag type="info" size="small">已纳入备料计划</el-tag>
                  <el-button type="primary" size="small" link @click="openPlanDetail">查看备料清单</el-button>
                  <el-tag type="primary" size="small">{{ flatMaterialRows.length }} 条</el-tag>
                </div>
              </div>
            </template>
            <div class="task-card-body">
              <el-table :data="flatMaterialRows" border size="small" max-height="280">
                <el-table-column prop="workOrderNo" label="工单号" min-width="100" />
                <el-table-column prop="materialCode" label="物料编码" min-width="100" />
                <el-table-column label="本次备料数量" min-width="110" align="right"
                  ><template #default="{ row }">{{ formatClassifiedPrepQty(row) }}</template></el-table-column
                >
                <el-table-column label="推荐仓别" width="90"
                  ><template #default="{ row }">{{ row.recommendedWarehouse || '-' }}</template></el-table-column
                >
                <el-table-column label="推荐库位" min-width="100"
                  ><template #default="{ row }">{{ row.recommendedLocation || '-' }}</template></el-table-column
                >
                <prep-demand-location-source-column show-remark :rows="flatMaterialRows" />
                <el-table-column label="目标需求库位" min-width="140">
                  <template #default="{ row }">{{ row.targetDemandLocationCode || '-' }}</template>
                </el-table-column>
                <el-table-column label="操作" width="70" fixed="right"
                  ><template #default="{ row }"><el-button type="primary" link size="small" @click="openPrepBomByNo(row.workOrderNo, row.materialCode)">调整</el-button></template></el-table-column
                >
              </el-table>
            </div>
          </el-card>
        </el-col>
        <el-col v-if="shortageMaterialRows.length" :span="12" class="task-col section-col-bottom">
          <el-card shadow="never" class="task-card section-card">
            <template #header>
              <div class="section-header task-card-header">
                <span>缺料</span>
                <div class="task-header-actions">
                  <el-tag type="info" size="small">已纳入备料计划</el-tag>
                  <el-button type="primary" size="small" link @click="openPlanDetail">查看备料清单</el-button>
                  <el-tag type="danger" size="small">{{ shortageMaterialRows.length }} 条</el-tag>
                </div>
              </div>
            </template>
            <div class="task-card-body">
              <el-table :data="shortageMaterialRows" border size="small" max-height="280">
                <el-table-column prop="workOrderNo" label="工单号" min-width="100" />
                <el-table-column prop="materialCode" label="物料编码" min-width="100" />
                <el-table-column label="库存类型" width="100" align="center">
                  <template #default="{ row }">
                    <dict-tag :options="wms_inventory_special_flag" :value="resolveDemandRowInventoryFlag(row)" />
                  </template>
                </el-table-column>
                <el-table-column label="本次备料数量" min-width="110" align="right"
                  ><template #default="{ row }">{{ formatClassifiedPrepQty(row) }}</template></el-table-column
                >
                <el-table-column label="操作" width="70" fixed="right"
                  ><template #default="{ row }"><el-button type="primary" link size="small" @click="openPrepBomByNo(row.workOrderNo, row.materialCode)">调整</el-button></template></el-table-column
                >
              </el-table>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-collapse v-if="currentDemand && showPlanDetail" v-model="planDetailOpen" class="plan-detail-collapse">
        <el-collapse-item title="查看备料清单" name="plan">
          <prep-demand-plan-view :demand="currentDemand" :location-hints="prepLocationHints" :issue-line-hints="prepIssueLineHints" @refresh="reloadDemandDetail" @go-issue="goToMaterialIssue" />
        </el-collapse-item>
      </el-collapse>
      <el-empty v-else-if="!currentDemand" :description="请在上一步生成备料需求" />
    </div>
    <work-order-selection-dialog v-model="showOrderDialog" :selected-orders="selectedOrders" :show-bom-action="false" @confirm="handleOrderSelection" />
    <work-order-prep-demand-dialog v-model="showPrepBomDialog" :work-orders="prepBomOrders" :material-issues-by-work-order="prepMaterialIssuesMap" :demand-user-no="materialDemandUserCode" :initial-material-code="prepBomFilterMaterialCode" @save="onBomSave" />
    <issue-process-drawer v-model="issueDrawerVisible" :issue-id="currentIssueId" />
    <target-demand-location-dialog v-model="showTargetLocationDialog" :user-name="materialDemandUserCode" :submitting="generatingPrep" @confirm="onTargetLocationConfirm" />
  </div>
</template>
<script setup lang="ts">
import { ref, computed, getCurrentInstance, toRefs, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Check, MagicStick, Sort, Bell } from '@element-plus/icons-vue';
import { HttpStatus } from '@/enums/RespEnum';
import WorkOrderSelectionDialog from '@/views/wms/workOrder/components/WorkOrderSelectionDialog.vue';
import WorkOrderPrepDemandDialog from './WorkOrderPrepDemandDialog.vue';
import PrepDemandPlanView from './PrepDemandPlanView.vue';
import PrepDemandLocationSourceColumn from './PrepDemandLocationSourceColumn.vue';
import IssueProcessDrawer from '@/views/wms/materialIssue/components/IssueProcessDrawer.vue';
import TargetDemandLocationDialog from './TargetDemandLocationDialog.vue';
import type { TargetDemandLocationSelection } from './TargetDemandLocationDialog.vue';
import { useUserStore } from '@/store/modules/user';
import { getPrepDemand } from '@/api/wms/workOrderPrepDemand/index';
import { buildPrepLocationRecIssueOutBoList, isIssuablePrepLocationRecRow, isPrepWarehouse261DisplayRow, lineStatusLabel, lineStatusTag, prepLocationRecIssueOut } from '@/api/wms/issueTask';
import { generateAllocation, loadWarehouseRouteContext } from '@/api/wms/allocation/index';
import type { MaterialDemandDetailRow, WorkOrderVO, WorkOrderMaterialIssueLine, WarehouseRouteContext } from '@/api/wms/allocation/types';
import type { WorkOrderPrepDemandVO, PrepDemandLineItem } from '@/api/wms/workOrderPrepDemand/types';
import { buildPrepDemandItems, resolveDemandRowInventoryFlag, isClassifiedShortageRow, findIssueLineForDemandDetail, formatDemandDetailPrepQty, resolvePrepDemandTargetLocationFromItems, type AllocationGenerateResult } from '@/api/wms/allocation/index';
import { classifyWorkOrders, flattenClassifiedMaterials } from '@/api/wms/allocation/index';
import { flattenPrepDemandDisplayRows, formatPrepQtyWithUnit, type PrepDemandDisplayRow } from '@/api/wms/workOrderPrepDemand/index';

type DemandUserMode = 'self' | 'other';

const userStore = useUserStore();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_material_user, wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_material_user', 'wms_inventory_special_flag'));

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
const showPlanDetail = ref(false);
const planDetailOpen = ref<string[]>([]);
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
const classifiedMaterialRows = computed(() => flattenClassifiedMaterials(selectedOrders.value));
const autoMaterialRows = computed(() => classifiedMaterialRows.value.filter((r) => r.warehouseRoute === 'AUTO'));
const lineMaterialRows = computed(() => classifiedMaterialRows.value.filter((r) => r.warehouseRoute === 'LINE'));
const prep261AutoDisplayRows = computed(() => prepDisplayRows.value.filter((r) => isPrepWarehouse261DisplayRow(r, 'AUTO')));
const prep261LineDisplayRows = computed(() => prepDisplayRows.value.filter((r) => isPrepWarehouse261DisplayRow(r, 'LINE')));
const prep261AutoRows = computed(() => prep261AutoDisplayRows.value.filter(isIssuablePrepLocationRecRow));
const prep261LineRows = computed(() => prep261LineDisplayRows.value.filter(isIssuablePrepLocationRecRow));
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
    return `需求人：${materialDemandUserLabel.value}`;
  }
  return '请选择本人或其他人';
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

const formatClassifiedPrepQty = (row: MaterialDemandDetailRow) => {
  const order = selectedOrders.value.find((item) => item.workOrderNo === row.workOrderNo);
  const issueLine = order ? findIssueLineForDemandDetail(order, row) : undefined;
  return formatDemandDetailPrepQty(row, issueLine);
};

const confirmDemandUser = () => {
  if (!applyDemandUserSelection()) {
    ElMessage.warning(demandUserMode.value === 'other' ? '请选择其他需求人员' : '无法获取登录工号（userName）');
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
    ElMessage.warning('请先选择需求人');
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
    ElMessage.warning('请先选择需求人');
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
    ElMessage.warning('请先选择需求人');
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
    .filter((o): o is WorkOrderVO => !!o);
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
  selectedOrders.value = [];
  currentDemand.value = null;
  currentDemandId.value = null;
  prepDisplayRows.value = [];
  isClassified.value = false;
  showPlanDetail.value = false;
  planDetailOpen.value = [];
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
  const issueOutBoList = buildPrepLocationRecIssueOutBoList(prepDisplayRows.value, routes);
  if (!issueOutBoList.length) {
    resultStatus.value = false;
    resultMessage.value = `没有可扣料的${routeLabel}需求`;
    return;
  }
  try {
    await ElMessageBox.confirm(`将对 ${issueOutBoList.length} 条${routeLabel}库位需求执行 ${movementType.value} 扣料，是否继续？`, `确认 ${movementType.value} 扣料`, { type: 'warning' });
    const res = await prepLocationRecIssueOut({
      demandId: currentDemand.value.id,
      demandNo: currentDemand.value.demandNo,
      issueOutBoList
    });
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
  const issueOutBoList = buildPrepLocationRecIssueOutBoList(prepDisplayRows.value, ['AUTO', 'LINE']);
  if (!issueOutBoList.length) {
    resultStatus.value = false;
    resultMessage.value = '没有可扣料的自动仓或线边仓需求';
    return;
  }
  submittingCombined.value = true;
  try {
    await ElMessageBox.confirm(`将对 ${issueOutBoList.length} 条自动仓+线边仓需求合并执行 ${movementType.value} 扣料，是否继续？`, `确认 ${movementType.value} 扣料`, { type: 'warning' });
    const res = await prepLocationRecIssueOut({
      demandId: currentDemand.value.id,
      demandNo: currentDemand.value.demandNo,
      issueOutBoList
    });
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

const openPlanDetail = () => {
  showPlanDetail.value = true;
  planDetailOpen.value = ['plan'];
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
  showPlanDetail.value = false;
  planDetailOpen.value = [];
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
}
.mode-tip {
  margin-bottom: 4px;
}
.workbench-steps {
  margin: 8px 0 16px;
}
.step-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.step-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.order-sections {
  margin-top: 4px;
}
.section-col-bottom {
  margin-top: 16px;
}
.section-card {
  min-height: 240px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: 600;
}
.plan-summary {
  margin-bottom: 16px;
}
.demand-user-step {
  max-width: 640px;
  margin: 0 auto;
}
.demand-user-card {
  padding: 8px 4px 4px;
}
.demand-user-form {
  margin-bottom: 8px;
}
.classify-hint {
  margin-bottom: 4px;
}
.task-tip {
  margin-bottom: 8px;
}
.warehouse261-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px 14px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}
.warehouse261-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-right: 4px;
}
.task-cards {
  margin-top: 4px;
}
.task-col {
  margin-bottom: 16px;
}
.task-card {
  min-height: 200px;
}
.task-card-header {
  flex-wrap: wrap;
}
.task-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.task-card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.task-desc {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.task-more-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.task-mini-table {
  width: 100%;
}
.plan-detail-collapse {
  margin-top: 8px;
}
.result-alert {
  margin-bottom: 4px;
}
.result-alert :deep(.el-alert) {
  padding: 6px 10px;
}
.task-finish-result {
  padding: 8px 0 4px;
}
.task-finish-result :deep(.el-result__subtitle) {
  max-width: 560px;
  margin: 0 auto;
}
</style>
