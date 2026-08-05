<template>
  <div class="p-2 special-issue-page">
    <el-card shadow="never" class="page-card">
      <div class="zp-panel">
        <el-steps :active="ui.stepsActive" finish-status="success" align-center class="workbench-steps">
          <el-step title="选择需求人" :description="ui.demandUserStepDesc" />
          <el-step title="选择工单与备料" description="选择工单后手动添加物料，检查库存并确认分类" />
          <el-step title="仓别分类" description="按已分配库位仓别编码分流" />
          <el-step title="执行任务" description="按任务卡执行扣料或跟进备料/缺料" />
        </el-steps>

        <!-- 结果提示（全局） -->
        <div v-if="ui.resultMessage" class="result-alert">
          <el-alert show-icon :type="ui.resultStatus ? 'success' : 'error'" :closable="false">
            <template #icon><Bell /></template>
            <div class="result-alert-body">
              <span>{{ ui.resultMessage }}</span>
              <el-button v-if="ui.resultStatus && ui.generatedDemand && ui.activeStep === 3" type="primary" link @click="ui.startNewIssue">继续填写领料单</el-button>
            </div>
          </el-alert>
        </div>

        <!-- 第 1 步：选择需求人 -->
        <div v-if="ui.activeStep === 0" class="step-body demand-user-step">
          <el-card shadow="never" class="demand-user-card">
            <el-form label-width="96px" class="demand-user-form">
              <el-form-item label="需求人">
                <el-radio-group v-model="ui.demandUserMode">
                  <el-radio value="self">本人（{{ ui.currentUserDisplay || '-' }}）</el-radio>
                  <el-radio value="other">其他人</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item v-if="ui.demandUserMode === 'other'" label="其他人">
                <el-select v-model="ui.otherUserCode" placeholder="请选择其他需求人员" filterable clearable style="width: 320px">
                  <el-option v-for="dict in ui.otherUserOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
              </el-form-item>
            </el-form>
            <div class="step-toolbar">
              <el-button type="primary" @click="ui.confirmDemandUser">下一步</el-button>
            </div>
          </el-card>
        </div>

        <!-- 第 2 步：选择工单与备料 -->
        <div v-if="ui.activeStep === 1" class="step-body">
          <div class="work-order-bar">
            <el-button type="primary" @click="ui.showOrderDialog = true">
              <el-icon><Plus /></el-icon>
              选择工单
            </el-button>
            <el-descriptions v-if="ui.workOrder" :column="4" border class="wo-summary">
              <el-descriptions-item label="工单号">{{ ui.workOrder.workOrderNo }}</el-descriptions-item>
              <el-descriptions-item label="产品料号">{{ ui.workOrder.item || '-' }}</el-descriptions-item>
              <el-descriptions-item label="产品描述">{{ ui.workOrder.itemDesc || '-' }}</el-descriptions-item>
              <el-descriptions-item label="计划数量">{{ ui.formatQty(ui.workOrder.plannedQty) }} {{ ui.workOrder.unit }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 手动添加物料 -->
          <div class="material-add-row">
            <HistoryInput v-model="ui.materialCode" :config="ui.materialCodeConfig" placeholder="请输入物料编码" style="width: 240px" @keydown.enter.prevent="ui.handleAddByMaterial">
              <template #append>
                <el-button icon="Search" @click="showItemDialog" />
              </template>
            </HistoryInput>
            <el-input-number v-model="ui.requiredQty" :min="0" :precision="3" :step="1" controls-position="right" placeholder="需求数量" style="width: 170px" @keydown.enter.prevent="ui.handleAddByMaterial" />
            <el-button type="primary" :loading="ui.loadingAdd" :disabled="!ui.canAddMaterial" @click="ui.handleAddByMaterial">添加</el-button>
          </div>

          <!-- 清单工具栏 -->
          <div class="list-toolbar">
            <span class="list-title">领料清单</span>
            <div class="list-actions">
              <el-button type="success" plain :disabled="!ui.canGenerate" :loading="ui.checkingInventory" @click="() => ui.handleCheckInventory()">检查库存</el-button>
              <el-button type="danger" plain :disabled="!ui.pickLines.length" @click="ui.clearPickLines">清空清单</el-button>
            </div>
          </div>

          <!-- 领料清单表格 -->
          <el-table :data="ui.pickLines" border stripe max-height="420" empty-text="选择工单后输入物料编码与本次备料数量，点击「添加」加入清单">
            <el-table-column type="index" label="序号" width="56" align="center" />
            <el-table-column label="库存" width="52" align="center">
              <template #default="{ row }">
                <inventory-status :material="row" />
              </template>
            </el-table-column>
            <el-table-column prop="componentMaterial" label="物料编码" min-width="120" />
            <el-table-column prop="componentDesc" label="物料描述" min-width="150" show-overflow-tooltip />
            <el-table-column label="本次备料数量" min-width="160">
              <template #default="{ row, $index }">
                <issue-qty-dual-input :row="row" :max-issue-qty="999999999" @change="(val: number) => ui.updatePickQty($index, val)" @unit-change="(altUnit: string) => ui.updatePickUnit($index, altUnit)" />
              </template>
            </el-table-column>
            <el-table-column label="可用库存" width="90" align="right">
              <template #default="{ row }">{{ ui.formatQty(row.availableQty) }}</template>
            </el-table-column>
            <el-table-column label="齐套率" width="120" align="center">
              <template #default="{ row }">
                <kit-rate-indicator :material="row" />
              </template>
            </el-table-column>
            <el-table-column label="推荐明细" min-width="300">
              <template #default="{ row, $index }">
                <template v-if="ui.getRecommendItems(row, $index).length">
                  <div v-for="(pick, lineIndex) in ui.getRecommendItems(row, $index)" :key="lineIndex" class="recommend-pick-row" :class="{ 'is-other-line': pick.isOtherLine }" :title="pick.isOtherLine ? '其他线边仓' : undefined">
                    <span class="pick-loc" :title="pick.location">{{ pick.location }}</span>
                    <dict-tag class="pick-inventory-type" :options="ui.wmsInventorySpecialFlag" :value="pick.specialInventoryFlag" />
                    <span class="pick-qty">{{ formatQtyWithUnit(pick.qty, pick.unit) }}</span>
                  </div>
                </template>
                <span v-else class="text-muted">暂无推荐</span>
              </template>
            </el-table-column>
            <el-table-column label="库存信息" width="160">
              <template #default="{ row }">
                <el-button type="primary" link @click="ui.openLocationRecommend(row)">系统推荐</el-button>
                <el-button type="primary" link @click="ui.openLocationQuery(row)">查库存</el-button>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center" fixed="right">
              <template #default="{ $index }">
                <el-button type="danger" link @click="ui.removePickLine($index)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 上一步 + 确认备料并分类（底部居中） -->
          <div class="step-footer-row">
            <el-button @click="ui.goToDemandUserStep">上一步</el-button>
            <el-button size="default" type="success" plain :disabled="!ui.canGenerate" :loading="ui.classifyLoading" @click="ui.confirmClassify">
              <el-icon><Sort /></el-icon>
              确认备料并分类
            </el-button>
          </div>
        </div>

        <!-- 第 3 步：确认备料并分类 -->
        <div v-if="ui.activeStep === 2" class="step-body">
          <div class="step-toolbar">
            <span class="classify-summary">自动仓 {{ ui.autoMaterialRows.length }} · 线边仓 {{ ui.lineMaterialRows.length }} · 平面仓 {{ ui.flatMaterialRows.length }} · 缺料 {{ ui.shortageMaterialRows.length }}</span>
          </div>
          <el-alert type="info" :closable="false" show-icon class="classify-tip">确认下方分类无误后，点「生成备料计划」将自动仓、线边仓、平面仓及缺料合并生成备料计划</el-alert>
          <el-row :gutter="16" class="classify-sections">
            <el-col :span="12">
              <el-card shadow="never" class="classify-card">
                <template #header>
                  <div class="section-header">
                    <span>自动仓</span>
                    <el-tag type="success">{{ ui.autoMaterialRows.length }} 条</el-tag>
                  </div>
                </template>
                <el-table v-if="ui.autoMaterialRows.length" :data="ui.autoMaterialRows" border max-height="240">
                  <el-table-column prop="materialCode" label="物料编码" min-width="110" />
                  <el-table-column prop="materialDesc" label="物料描述" min-width="150" show-overflow-tooltip />
                  <el-table-column label="本次备料数量" min-width="100" align="right">
                    <template #default="{ row }">{{ ui.formatClassifiedPrepQty(row) }}</template>
                  </el-table-column>
                  <el-table-column label="推荐仓别" width="80">
                    <template #default="{ row }">{{ row.recommendedWarehouse || '-' }}</template>
                  </el-table-column>
                </el-table>
                <el-empty v-else description="暂无自动仓需求" :image-size="48" />
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="never" class="classify-card">
                <template #header>
                  <div class="section-header">
                    <span>线边仓</span>
                    <el-tag type="warning">{{ ui.lineMaterialRows.length }} 条</el-tag>
                  </div>
                </template>
                <el-table v-if="ui.lineMaterialRows.length" :data="ui.lineMaterialRows" border max-height="240">
                  <el-table-column prop="materialCode" label="物料编码" min-width="110" />
                  <el-table-column prop="materialDesc" label="物料描述" min-width="150" show-overflow-tooltip />
                  <el-table-column label="本次备料数量" min-width="100" align="right">
                    <template #default="{ row }">{{ ui.formatClassifiedPrepQty(row) }}</template>
                  </el-table-column>
                  <el-table-column label="推荐仓别" width="80">
                    <template #default="{ row }">{{ row.recommendedWarehouse || '-' }}</template>
                  </el-table-column>
                </el-table>
                <el-empty v-else description="暂无线边仓需求" :image-size="48" />
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="never" class="classify-card">
                <template #header>
                  <div class="section-header">
                    <span>平面仓</span>
                    <el-tag type="primary">{{ ui.flatMaterialRows.length }} 条</el-tag>
                  </div>
                </template>
                <el-table v-if="ui.flatMaterialRows.length" :data="ui.flatMaterialRows" border max-height="240">
                  <el-table-column prop="materialCode" label="物料编码" min-width="110" />
                  <el-table-column prop="materialDesc" label="物料描述" min-width="150" show-overflow-tooltip />
                  <el-table-column label="本次备料数量" min-width="100" align="right">
                    <template #default="{ row }">{{ ui.formatClassifiedPrepQty(row) }}</template>
                  </el-table-column>
                  <el-table-column label="推荐库位" width="90">
                    <template #default="{ row }">{{ row.recommendedLocation || '-' }}</template>
                  </el-table-column>
                </el-table>
                <el-empty v-else description="暂无平面仓需求" :image-size="48" />
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="never" class="classify-card">
                <template #header>
                  <div class="section-header">
                    <span>缺料</span>
                    <el-tag type="danger">{{ ui.shortageMaterialRows.length }} 条</el-tag>
                  </div>
                </template>
                <el-table v-if="ui.shortageMaterialRows.length" :data="ui.shortageMaterialRows" border max-height="240">
                  <el-table-column prop="materialCode" label="物料编码" min-width="110" />
                  <el-table-column prop="materialDesc" label="物料描述" min-width="150" show-overflow-tooltip />
                  <el-table-column label="本次备料数量" min-width="100" align="right">
                    <template #default="{ row }">{{ ui.formatClassifiedPrepQty(row) }}</template>
                  </el-table-column>
                </el-table>
                <el-empty v-else description="暂无缺料需求" :image-size="48" />
              </el-card>
            </el-col>
          </el-row>

          <!-- 上一步 + 生成备料需求（底部居中） -->
          <div class="step-footer-row">
            <el-button @click="ui.goBackToPrepStep">上一步</el-button>
            <el-button size="default" type="primary" :disabled="!ui.classifiedMaterialRows.length" :loading="ui.generating" @click="ui.openTargetLocationDialog">
              <el-icon><MagicStick /></el-icon>
              生成备料需求
            </el-button>
          </div>
        </div>

        <!-- 第 4 步：执行任务 -->
        <div v-if="ui.activeStep === 3" class="step-body">
          <div class="step-toolbar">
            <el-button v-if="ui.generatedDemand && !ui.taskExecutionFinished" type="primary" @click="ui.startNewIssue">继续领料</el-button>
          </div>
          <el-result v-if="ui.taskExecutionFinished" icon="success" title="本轮备料任务已提交" sub-title="平面仓与缺料需求已纳入备料计划，仓库将按任务跟进。可开始下一轮备料。" class="task-finish-result">
            <template #extra>
              <el-button type="primary" @click="ui.startNewIssue">开始下一轮备料</el-button>
            </template>
          </el-result>
          <el-descriptions v-if="ui.generatedDemand" :column="4" border size="small" class="plan-summary">
            <el-descriptions-item label="需求单号">{{ ui.generatedDemand.demandNo }}</el-descriptions-item>
            <el-descriptions-item label="工单数">{{ ui.generatedDemand.workOrderCount }} 个</el-descriptions-item>
            <el-descriptions-item label="缺料行">{{ ui.shortageMaterialRows.length }} 条</el-descriptions-item>
            <el-descriptions-item label="齐套率">{{ ui.formatKitRate(ui.generatedDemand.kitRate) }}%</el-descriptions-item>
          </el-descriptions>
          <div v-if="ui.generatedDemand && ui.hasWarehouse261Tasks && !ui.taskExecutionFinished" class="warehouse261-toolbar">
            <span class="warehouse261-label">261 扣料操作</span>
            <el-button v-if="ui.prep261AutoRows.length" type="success" :loading="ui.submittingAuto" @click="ui.submitAutoIssue">自动仓 · 261 扣账（{{ ui.prep261AutoRows.length }}条）</el-button>
            <el-button v-if="ui.prep261LineRows.length" type="warning" :loading="ui.submittingLine" @click="ui.submitLineIssue">线边仓 · 待物料员 261 扣料（{{ ui.prep261LineRows.length }}条）</el-button>
            <el-button v-if="ui.canSubmitCombined261" type="primary" :loading="ui.submittingCombined" @click="ui.submitCombinedIssue">自动仓+线边仓 · 261 合并扣料（{{ ui.combined261RowCount }}条）</el-button>
          </div>
          <el-row v-if="ui.generatedDemand" :gutter="16" class="task-cards">
            <el-col v-if="ui.prep261AutoDisplayRows.length" :span="12" class="task-col">
              <el-card shadow="never" class="task-card section-card">
                <template #header>
                  <div class="section-header">
                    <span>自动仓 · 261 扣账</span>
                    <el-tag v-if="ui.prep261AutoRows.length" type="warning" size="small">待执行</el-tag>
                    <el-tag v-else type="success" size="small">已完成</el-tag>
                    <el-tag type="info" size="small">{{ ui.prep261AutoDisplayRows.length }} 条</el-tag>
                  </div>
                </template>
                <div class="task-card-body">
                  <el-table :data="ui.prep261AutoDisplayRows" border size="small" max-height="280">
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
                    <prep-demand-location-source-column show-remark :rows="ui.prep261AutoDisplayRows" />
                  </el-table>
                </div>
              </el-card>
            </el-col>
            <el-col v-if="ui.prep261LineDisplayRows.length" :span="12" class="task-col">
              <el-card shadow="never" class="task-card section-card">
                <template #header>
                  <div class="section-header">
                    <span>线边仓 · 待物料员 261 扣料</span>
                    <el-tag v-if="ui.prep261LineRows.length" type="warning" size="small">待执行</el-tag>
                    <el-tag v-else type="success" size="small">已完成</el-tag>
                    <el-tag type="info" size="small">{{ ui.prep261LineDisplayRows.length }} 条</el-tag>
                  </div>
                </template>
                <div class="task-card-body">
                  <el-table :data="ui.prep261LineDisplayRows" border size="small" max-height="280">
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
                    <prep-demand-location-source-column show-remark :rows="ui.prep261LineDisplayRows" />
                  </el-table>
                </div>
              </el-card>
            </el-col>
            <el-col v-if="ui.flatMaterialRows.length" :span="12" class="task-col section-col-bottom">
              <el-card shadow="never" class="task-card section-card">
                <template #header>
                  <div class="section-header task-card-header">
                    <span>平面仓 · 备料需求</span>
                    <div class="task-header-actions">
                      <el-tag type="info" size="small">已纳入备料计划</el-tag>
                      <el-button type="primary" size="small" link @click="ui.openPlanDetail">查看备料清单</el-button>
                      <el-tag type="primary" size="small">{{ ui.flatMaterialRows.length }} 条</el-tag>
                    </div>
                  </div>
                </template>
                <div class="task-card-body">
                  <el-table :data="ui.flatMaterialRows" border size="small" max-height="280">
                    <el-table-column prop="workOrderNo" label="工单号" min-width="100" />
                    <el-table-column prop="materialCode" label="物料编码" min-width="100" />
                    <el-table-column prop="materialDesc" label="物料描述" min-width="150" show-overflow-tooltip />
                    <el-table-column label="本次备料数量" min-width="110" align="right">
                      <template #default="{ row }">{{ ui.formatClassifiedPrepQty(row) }}</template>
                    </el-table-column>
                    <el-table-column label="推荐库位" min-width="100">
                      <template #default="{ row }">{{ row.recommendedLocation || '-' }}</template>
                    </el-table-column>
                    <prep-demand-location-source-column show-remark :rows="ui.flatMaterialRows" />
                    <el-table-column label="目标需求库位" min-width="140">
                      <template #default="{ row }">{{ row.targetDemandLocationCode || '-' }}</template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-card>
            </el-col>
            <el-col v-if="ui.shortageMaterialRows.length" :span="12" class="task-col section-col-bottom">
              <el-card shadow="never" class="task-card section-card">
                <template #header>
                  <div class="section-header task-card-header">
                    <span>缺料</span>
                    <div class="task-header-actions">
                      <el-tag type="info" size="small">已纳入备料计划</el-tag>
                      <el-button type="primary" size="small" link @click="ui.openPlanDetail">查看备料清单</el-button>
                      <el-tag type="danger" size="small">{{ ui.shortageMaterialRows.length }} 条</el-tag>
                    </div>
                  </div>
                </template>
                <div class="task-card-body">
                  <el-table :data="ui.shortageMaterialRows" border size="small" max-height="280">
                    <el-table-column prop="workOrderNo" label="工单号" min-width="100" />
                    <el-table-column prop="materialCode" label="物料编码" min-width="100" />
                    <el-table-column prop="materialDesc" label="物料描述" min-width="150" show-overflow-tooltip />
                    <el-table-column label="库存类型" width="100" align="center">
                      <template #default="{ row }">
                        <dict-tag :options="ui.wmsInventorySpecialFlag" :value="resolveDemandRowInventoryFlag(row)" />
                      </template>
                    </el-table-column>
                    <el-table-column label="本次备料数量" min-width="110" align="right">
                      <template #default="{ row }">{{ ui.formatClassifiedPrepQty(row) }}</template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-card>
            </el-col>
          </el-row>
          <el-collapse v-if="ui.generatedDemand && ui.showPlanDetail" v-model="ui.planDetailOpen" class="plan-detail-collapse">
            <el-collapse-item title="查看备料清单" name="plan">
              <prep-demand-plan-view :demand="ui.generatedDemand" :location-hints="ui.prepLocationHints" :issue-line-hints="ui.prepIssueLineHints" @refresh="ui.reloadGeneratedDemand" @go-issue="ui.goToMaterialIssue" />
            </el-collapse-item>
          </el-collapse>
          <el-empty v-else-if="!ui.generatedDemand" description="请先完成备料并分类后生成备料计划" :image-size="72" />
        </div>

        <!-- 工单选择对话框 -->
        <work-order-selection-dialog v-model="ui.showOrderDialog" :selected-orders="ui.dialogSelectedOrders" :show-bom-action="false" :status-list="ui.workOrderStatusList" :single-select="true" @confirm="ui.handleOrderSelection" />

        <!-- 目标库位对话框 -->
        <target-demand-location-dialog v-model="ui.targetLocationVisible" :user-name="ui.materialUserCode" :submitting="ui.generating" @confirm="ui.handleGeneratePrepDemand" />

        <!-- 系统推荐 / 查库存 对话框 -->
        <LocationDetailDialog v-model="ui.showLocationDialog" :material="ui.selectedMaterial" :work-order-no="ui.workOrder?.workOrderNo" :mode="ui.locationDialogMode" :peer-reserved-inventory-qty="0" :peer-location-picks="[]" :base-location-rows="ui.locationDialogMode === 'recommend' ? ui.selectedMaterial?.checkInventoryRecommendedLocations : undefined" :allow-shortage-confirm="false" @confirm="ui.onLocationConfirm" />

        <!-- 物料选择对话框 -->
        <ItemDialog ref="itemDialogRef" @item-select-call-back="itemSelectCallBack" />

        <!-- 发料单抽屉 -->
        <issue-process-drawer v-model="ui.issueDrawerVisible" :issue-id="ui.currentIssueId" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, reactive, ref, toRefs, watch } from 'vue';
import { Bell, MagicStick, Plus, Sort } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { HttpStatus } from '@/enums/RespEnum';
import type { HistoryConfig } from '@/types/history';
import { useUserStore } from '@/store/modules/user';
import { formatQty, formatQtyWithUnit } from '@/utils/ruoyi';
import { classifyWorkOrders, generateAllocation, getPrepDemand, PREP_DEMAND_TYPE_NORMAL, listItem, checkSpecialIssueInventory } from '@/api/wms/workOrderSpecialIssue';
import { normalizePrepDemand } from '@/api/wms/workOrderPrepDemand/index';
import { applyIssueUnitSelection, buildAutoPrepDemandItems, buildFlatPrepDemandItems, buildLinePrepDemandItems, findIssueLineForDemandDetail, flattenClassifiedMaterials, formatDemandDetailPrepQty, getBomRecommendInfoItems, isClassifiedShortageRow, issueQtyToInventoryQty, normalizeInventoryCheckMaterialCode, refreshBomRowRecommendations, resolveDemandRowInventoryFlag, resolveInventoryCheckMaterialKey, resolvePrepDemandTargetLocationFromItems } from '@/api/wms/allocation/index';
import type { AllocationGenerateResult, BomIssueRow, MaterialDemandDetailRow, MaterialLocationRow, WorkOrderBomVO, WorkOrderMaterialIssueLine, WorkOrderVO } from '@/api/wms/allocation/types';
import { buildPrepLocationRecIssueOutBoList, isIssuablePrepLocationRecRow, isPrepWarehouse261DisplayRow, lineStatusLabel, lineStatusTag, prepLocationRecIssueOut } from '@/api/wms/issueTask';
import { flattenPrepDemandDisplayRows, formatPrepQtyWithUnit } from '@/api/wms/workOrderPrepDemand/index';
import type { PrepDemandDisplayRow } from '@/api/wms/workOrderPrepDemand/types';
import type { ItemQuery, ItemVO } from '@/api/wms/item/types';
import type { PrepDemandLineItem } from '@/api/wms/workOrderPrepDemand/types';
import type { WorkOrderPrepDemandVO } from '@/api/wms/workOrderPrepDemand/types';
import type { TargetDemandLocationSelection } from '@/views/wms/allocation/components/TargetDemandLocationDialog.vue';
import LocationDetailDialog, { type LocationDialogMode } from '@/views/wms/allocation/components/LocationDetailDialog.vue';
import HistoryInput from '@/components/HistoryInput/index.vue';
import WorkOrderSelectionDialog from '@/views/wms/workOrder/components/WorkOrderSelectionDialog.vue';
import TargetDemandLocationDialog from '@/views/wms/allocation/components/TargetDemandLocationDialog.vue';
import PrepDemandPlanView from '@/views/wms/allocation/components/PrepDemandPlanView.vue';
import PrepDemandLocationSourceColumn from '@/views/wms/allocation/components/PrepDemandLocationSourceColumn.vue';
import IssueProcessDrawer from '@/views/wms/materialIssue/components/IssueProcessDrawer.vue';
import IssueQtyDualInput from '@/views/wms/allocation/components/IssueQtyDualInput.vue';
import InventoryStatus from '@/views/wms/allocation/components/InventoryStatus.vue';
import KitRateIndicator from '@/views/wms/allocation/components/KitRateIndicator.vue';
import ItemDialog from '@/views/wms/item/components/itemDialog.vue';

// ==================== 领域辅助方法 ====================
/** 特殊工单领料行（普通领料，无需超领原因） */
type SpecialIssueLine = BomIssueRow & {
  componentDesc?: string;
};

function padWorkOrderNo(workOrderNo: string): string {
  const value = String(workOrderNo || '').trim();
  if (!value) return '';
  if (/^\d+$/.test(value) && value.length < 12) {
    return value.padStart(12, '0');
  }
  return value;
}

function isSpecialIssueLineReady(row: SpecialIssueLine): boolean {
  return Number(row.issueQty ?? 0) > 0;
}

function resolveRequiredInventoryQty(row: SpecialIssueLine): number {
  return issueQtyToInventoryQty(Number(row.issueQty ?? 0), row.conversionRatio);
}

function sumLocationRecommendedQty(locations?: Array<{ recommendedQty?: number | string }>): number {
  if (!locations?.length) return 0;
  return locations.reduce((sum, loc) => sum + Number(loc.recommendedQty ?? 0), 0);
}

function resolveCoverInventoryQty(row: SpecialIssueLine): number {
  const manualQty = sumLocationRecommendedQty(row.manualLocationSelections);
  if (manualQty > 0) return manualQty;
  const fifoQty = sumLocationRecommendedQty(row.fifoRecommendedLocations);
  if (fifoQty > 0) return fifoQty;
  const checkQty = sumLocationRecommendedQty(row.checkInventoryRecommendedLocations);
  if (checkQty > 0) return checkQty;
  return Number(row.effectiveAvailableQty ?? row.materialPoolQty ?? row.availableQty ?? 0);
}

function resolvePickLine(materialCode: string, rows: SpecialIssueLine[]): SpecialIssueLine | undefined {
  const code = normalizeInventoryCheckMaterialCode(materialCode);
  if (!code) return undefined;
  return rows.find((row) => {
    if (!isSpecialIssueLineReady(row)) return false;
    const rowCode = normalizeInventoryCheckMaterialCode(row.componentMaterial);
    if (!rowCode) return false;
    return rowCode === code || resolveInventoryCheckMaterialKey(rowCode, [code]) === code || resolveInventoryCheckMaterialKey(code, [rowCode]) === rowCode;
  });
}

/** 领料仅能领取现有库存：检查发料数量是否被库存/库位分配覆盖 */
function validateSpecialInventorySufficient(rows: SpecialIssueLine[]): string | null {
  const insufficient = rows
    .filter((row) => isSpecialIssueLineReady(row))
    .filter((row) => {
      const required = resolveRequiredInventoryQty(row);
      if (required <= 0) return false;
      return resolveCoverInventoryQty(row) < required;
    })
    .map((row) => row.componentMaterial);
  if (!insufficient.length) return null;
  return `物料 ${[...new Set(insufficient)].join('、')} 库存不足，无法生成领料备料计划`;
}

function validateSpecialClassifiedOrder(order: WorkOrderVO, rows?: SpecialIssueLine[]): string | null {
  const shortageDetails = (order.materialDemandDetails || []).filter((line) => isClassifiedShortageRow(line));
  if (!shortageDetails.length) return null;
  const insufficient = shortageDetails.filter((detail) => {
    const materialCode = String(detail.materialCode || '').trim();
    if (!materialCode) return true;
    if (!rows?.length) return true;
    const pickLine = resolvePickLine(materialCode, rows);
    if (!pickLine) return true;
    const required = resolveRequiredInventoryQty(pickLine);
    if (required <= 0) return false;
    return resolveCoverInventoryQty(pickLine) < required;
  });
  if (!insufficient.length) return null;
  const codes = [...new Set(insufficient.map((line) => line.materialCode).filter(Boolean))].join('、');
  return `物料 ${codes} 库存不足，无法生成领料备料计划`;
}

function mapRowToIssueLine(row: SpecialIssueLine): WorkOrderMaterialIssueLine {
  return {
    bomLineId: row.id,
    reserveNo: row.reserveNo,
    reserveItemNo: row.reserveItemNo,
    materialCode: row.componentMaterial,
    issueQty: Number(row.issueQty ?? 0),
    issueUnit: row.unit,
    conversionRatio: row.conversionRatio,
    manualLocationSelections: row.manualLocationSelections,
    fifoRecommendedLocations: row.fifoRecommendedLocations,
    otherLineWarehouseLocations: row.otherLineWarehouseLocations,
    locationOverrideReason: row.locationOverrideReason,
    salesOrderNo: row.salesOrderNo,
    salesOrderItem: row.salesOrderItem,
    specialInventoryFlag: row.specialInventoryFlag
  };
}

function buildWorkOrderFromSpecialIssueLines(workOrder: WorkOrderVO, rows: SpecialIssueLine[]): WorkOrderVO {
  const materialIssues = rows.filter((row) => isSpecialIssueLineReady(row)).map((row) => mapRowToIssueLine(row));
  return {
    ...workOrder,
    materialIssues,
    materialDemandDetails: [],
    warehouseRoute: undefined,
    recommendedWarehouses: []
  };
}

async function classifySpecialIssueWorkOrder(workOrder: WorkOrderVO): Promise<WorkOrderVO> {
  const result = await classifyWorkOrders([workOrder]);
  return result.orders[0] ?? workOrder;
}

function buildSpecialPrepItems(order: WorkOrderVO): PrepDemandLineItem[] {
  const orders = [order];
  const baseItems = [...buildAutoPrepDemandItems(orders), ...buildLinePrepDemandItems(orders), ...buildFlatPrepDemandItems(orders)];
  const itemMap = new Map<string, PrepDemandLineItem>();

  baseItems.forEach((item) => {
    const key = [item.workOrderNo, item.materialCode, item.warehouseRoute ?? '', item.lineType ?? 'LOCATION', item.warehouseCode ?? '', item.locationCode ?? '', String(item.bomLineId ?? ''), item.reserveNo ?? '', item.reserveItemNo ?? ''].join('|');
    const prev = itemMap.get(key);
    if (!prev) {
      itemMap.set(key, item);
      return;
    }
    itemMap.set(key, {
      ...prev,
      prepQty: Number(prev.prepQty ?? 0) + Number(item.prepQty ?? 0)
    });
  });

  return [...itemMap.values()];
}

/** 按料号精确查询物料主数据，不存在时返回 null */
async function resolveMaterialByCode(code: string): Promise<ItemVO | null> {
  const matCode = String(code || '').trim();
  if (!matCode) return null;
  const response = await listItem({ item: matCode, pageNum: 1, pageSize: 50 } as ItemQuery);
  if (response.code !== 200) {
    throw new Error(response.msg || '查询物料失败');
  }
  const normalized = matCode.toUpperCase();
  const rows = (response.rows || []) as ItemVO[];
  return (
    rows.find(
      (row) =>
        String(row.item || '')
          .trim()
          .toUpperCase() === normalized
    ) || null
  );
}

type DemandUserMode = 'self' | 'other';

// ==================== 特殊工单领料逻辑 ====================
function useZpIssue() {
  const userStore = useUserStore();
  const { proxy } = getCurrentInstance() as ComponentInternalInstance;
  const { wms_material_user, wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_material_user', 'wms_inventory_special_flag'));

  // ==================== 需求人状态 ====================
  const demandUserMode = ref<DemandUserMode>('self');
  const otherUserCode = ref('');
  const materialUserCode = ref('');
  const materialUserLabel = ref('');

  const materialUserOptions = computed(() => (wms_material_user.value || []) as DictDataOption[]);
  const currentUserDisplay = computed(() => userStore.nickname || userStore.name || '');

  const resolveSelfDictOption = (): DictDataOption | undefined => {
    const userName = String(userStore.name || '').trim();
    if (!userName) return undefined;
    return materialUserOptions.value.find((d) => String(d.value) === userName);
  };

  const otherUserOptions = computed(() => {
    const userName = String(userStore.name || '').trim();
    if (!userName) return materialUserOptions.value;
    return materialUserOptions.value.filter((d) => String(d.value) !== userName);
  });

  const applyDemandUserSelection = (): boolean => {
    if (demandUserMode.value === 'self') {
      const userName = String(userStore.name || '').trim();
      if (!userName) return false;
      materialUserCode.value = userName;
      const self = resolveSelfDictOption();
      materialUserLabel.value = self?.label || userStore.nickname || userName;
      return true;
    }
    const code = String(otherUserCode.value || '').trim();
    if (!code) return false;
    const hit = materialUserOptions.value.find((d) => String(d.value) === code);
    materialUserCode.value = code;
    materialUserLabel.value = hit?.label || code;
    return true;
  };

  const onDemandUserModeChange = () => {
    if (demandUserMode.value === 'self') {
      applyDemandUserSelection();
      return;
    }
    materialUserCode.value = '';
    materialUserLabel.value = '';
  };

  watch(
    materialUserOptions,
    () => {
      if (demandUserMode.value === 'self') {
        applyDemandUserSelection();
      }
    },
    { immediate: true }
  );

  // ==================== 工单与物料状态 ====================
  const showOrderDialog = ref(false);
  const dialogSelectedOrders = ref<WorkOrderVO[]>([]);
  const workOrderNo = ref('');
  const materialCode = ref('');
  const materialUnit = ref('');
  const requiredQty = ref(0);
  const workOrder = ref<WorkOrderVO | null>(null);
  const pickLines = ref<SpecialIssueLine[]>([]);
  const loadingAdd = ref(false);
  const generating = ref(false);
  const checkingInventory = ref(false);
  const targetLocationVisible = ref(false);
  const classifiedOrder = ref<WorkOrderVO | null>(null);
  const generatedDemand = ref<WorkOrderPrepDemandVO | null>(null);
  const resultMessage = ref('');
  const resultStatus = ref(false);
  const selectedMaterial = ref<WorkOrderBomVO | null>(null);
  const locationDialogMode = ref<LocationDialogMode>('recommend');
  const showLocationDialog = ref(false);
  const classifyLoading = ref(false);
  // 多步向导
  const activeStep = ref(0);
  const stepsActive = computed(() => (activeStep.value >= 3 ? 3 : activeStep.value));
  const demandUserStepDesc = computed(() => (materialUserCode.value ? `已选择：${materialUserLabel.value}` : ''));

  // ==================== 执行任务状态 ====================
  const taskExecutionFinished = ref(false);
  const submittingAuto = ref(false);
  const submittingLine = ref(false);
  const submittingCombined = ref(false);
  const prepDisplayRows = ref<PrepDemandDisplayRow[]>([]);
  const movementType = ref('261');
  const currentDemandId = ref<number | null>(null);
  const issueDrawerVisible = ref(false);
  const currentIssueId = ref<number | string | null>(null);
  const showPlanDetail = ref(false);
  const planDetailOpen = ref<string[]>([]);

  // 仅展示 RELEASABLE 与 CRTD 状态的工单
  const workOrderStatusList = ['RELEASABLE', 'CRTD'];

  const materialCodeConfig: HistoryConfig = {
    key: 'materialCode',
    storage: 'indexedDB',
    maxSize: 10,
    page: 'workOrderSpecialIssue',
    autoSave: true,
    component: {
      showDropdown: true,
      showTime: false,
      showDelete: true,
      dropdownMaxHeight: '300px'
    }
  };

  // ==================== 工单选择 ====================
  const handleOrderSelection = async (orders: WorkOrderVO[]) => {
    showOrderDialog.value = false;
    if (!orders.length) return;
    const order = orders[0];
    if (orders.length > 1) {
      ElMessage.warning('特殊工单仅支持单个工单，已选择首个工单');
    }
    clearAll();
    workOrderNo.value = order.workOrderNo;
    workOrder.value = order;
  };

  // ==================== 计算属性 ====================
  const canAddMaterial = computed(() => !!workOrder.value && Number(requiredQty.value) > 0 && !!materialCode.value?.trim());

  const canGenerate = computed(() => {
    if (!workOrder.value) return false;
    return pickLines.value.some((row) => isSpecialIssueLineReady(row));
  });

  // ==================== 分类结果（确认备料并分类） ====================
  const classifiedMaterialRows = computed(() => {
    const rows = flattenClassifiedMaterials(classifiedOrder.value ? [classifiedOrder.value] : []);
    // 领料清单内的物料描述回填到分类行，供第 3 步展示
    const descMap = new Map<string, string>();
    pickLines.value.forEach((line) => {
      const code = normalizeInventoryCheckMaterialCode(line.componentMaterial);
      if (code && line.componentDesc) descMap.set(code, line.componentDesc);
    });
    return rows.map((row) => ({
      ...row,
      materialDesc: descMap.get(normalizeInventoryCheckMaterialCode(row.materialCode)) ?? ''
    }));
  });
  const autoMaterialRows = computed(() => classifiedMaterialRows.value.filter((r) => r.warehouseRoute === 'AUTO'));
  const lineMaterialRows = computed(() => classifiedMaterialRows.value.filter((r) => r.warehouseRoute === 'LINE'));
  const flatMaterialRows = computed(() => classifiedMaterialRows.value.filter((r) => r.warehouseRoute === 'FLAT'));
  const shortageMaterialRows = computed(() => classifiedMaterialRows.value.filter(isClassifiedShortageRow));

  // ==================== 执行任务（261 扣料） ====================
  const prep261AutoDisplayRows = computed(() => prepDisplayRows.value.filter((r) => isPrepWarehouse261DisplayRow(r, 'AUTO')));
  const prep261LineDisplayRows = computed(() => prepDisplayRows.value.filter((r) => isPrepWarehouse261DisplayRow(r, 'LINE')));
  const prep261AutoRows = computed(() => prep261AutoDisplayRows.value.filter(isIssuablePrepLocationRecRow));
  const prep261LineRows = computed(() => prep261LineDisplayRows.value.filter(isIssuablePrepLocationRecRow));
  const prepLocationHints = computed(() => [...flatMaterialRows.value, ...shortageMaterialRows.value]);
  const prepIssueLineHints = computed(() => {
    const lines: Array<WorkOrderMaterialIssueLine & { workOrderNo: string }> = [];
    classifiedOrder.value?.materialIssues?.forEach((line) => {
      if (Number(line.issueQty) > 0) lines.push({ ...line, workOrderNo: classifiedOrder.value!.workOrderNo });
    });
    return lines;
  });
  const hasWarehouse261Tasks = computed(() => prep261AutoRows.value.length > 0 || prep261LineRows.value.length > 0);
  const canSubmitCombined261 = computed(() => prep261AutoRows.value.length > 0 && prep261LineRows.value.length > 0);
  const combined261RowCount = computed(() => prep261AutoRows.value.length + prep261LineRows.value.length);
  const formatKitRate = (rate?: number) => {
    const n = Number(rate ?? 0);
    return (n > 1 ? n : n * 100).toFixed(1);
  };

  const formatClassifiedPrepQty = (row: any) => {
    const issueLine = row?.workOrderNo && classifiedOrder.value ? findIssueLineForDemandDetail(classifiedOrder.value, row) : undefined;
    return formatDemandDetailPrepQty(row, issueLine);
  };

  /** 列表内推荐明细（与系统推荐弹窗同源，含 checkInventory 推荐库位） */
  const getRecommendItems = (row: SpecialIssueLine, index: number) => getBomRecommendInfoItems(row, pickLines.value, index);

  // ==================== 工具方法 ====================

  const clearAll = () => {
    pickLines.value = [];
    classifiedOrder.value = null;
    generatedDemand.value = null;
    resultMessage.value = '';
    resultStatus.value = false;
    workOrderNo.value = '';
    materialCode.value = '';
    requiredQty.value = 0;
    workOrder.value = null;
  };

  // ==================== 物料添加 ====================
  const handleAddByMaterial = async () => {
    const woNo = padWorkOrderNo(workOrderNo.value);
    const matCode = String(materialCode.value || '').trim();
    const qty = Number(requiredQty.value) || 0;
    if (!woNo) {
      resultStatus.value = false;
      resultMessage.value = '请先选择工单';
      return;
    }
    if (!matCode) {
      resultStatus.value = false;
      resultMessage.value = '请输入料号';
      return;
    }
    if (qty <= 0) {
      resultStatus.value = false;
      resultMessage.value = '请输入需求数量';
      return;
    }

    // 校验料号是否存在于物料主数据
    let item: ItemVO | null = null;
    loadingAdd.value = true;
    try {
      item = await resolveMaterialByCode(matCode);
    } catch (error) {
      resultStatus.value = false;
      resultMessage.value = (error as Error)?.message || '校验料号失败';
      return;
    } finally {
      loadingAdd.value = false;
    }
    if (!item) {
      resultStatus.value = false;
      resultMessage.value = `料号 ${matCode} 不存在，请确认后重新输入`;
      return;
    }

    const existingIndex = pickLines.value.findIndex((row) => row.componentMaterial === matCode);
    if (existingIndex >= 0) {
      pickLines.value[existingIndex] = { ...pickLines.value[existingIndex], issueQty: qty };
    } else {
      pickLines.value.push({
        componentMaterial: matCode,
        componentDesc: item.itemDesc,
        componentQty: 0,
        issueQty: qty,
        unit: item.unit || materialUnit.value || undefined,
        workOrderNo: woNo
      });
    }
    classifiedOrder.value = null;
    generatedDemand.value = null;
    materialCode.value = '';
    requiredQty.value = 0;
    resultMessage.value = '';
    void handleCheckInventory(true);
  };

  // ==================== 库位选择（系统推荐 / 查库存） ====================
  const openLocationRecommend = (row: SpecialIssueLine) => {
    if (Number(row.issueQty ?? 0) <= 0) {
      ElMessage.warning('请先填写本次备料数量');
      return;
    }
    selectedMaterial.value = row as unknown as WorkOrderBomVO;
    locationDialogMode.value = 'recommend';
    showLocationDialog.value = true;
  };

  const openLocationQuery = (row: SpecialIssueLine) => {
    selectedMaterial.value = row as unknown as WorkOrderBomVO;
    locationDialogMode.value = 'query';
    showLocationDialog.value = true;
  };

  const onLocationConfirm = (payload: { material: WorkOrderBomVO | null; locations: MaterialLocationRow[]; recommendedLocations: MaterialLocationRow[]; demandInventoryQty?: number; overrideReason?: string }) => {
    if (!payload.material) return;
    const matCode = String(payload.material.componentMaterial || '').trim();
    const woNo = String(payload.material.workOrderNo || '').trim();
    const idx = pickLines.value.findIndex((r) => String(r.componentMaterial || '').trim() === matCode && String(r.workOrderNo || '').trim() === woNo);
    if (idx < 0) return;
    const current = pickLines.value[idx];
    const normalizedLocations = payload.locations
      .filter((loc) => Number(loc.recommendedQty ?? 0) > 0)
      .map((loc, locIndex) => ({
        ...loc,
        rowKey: String(loc.rowKey || `loc_${locIndex}`),
        recommendedQty: Number(loc.recommendedQty ?? 0)
      }));
    const normalizedRecommended = payload.recommendedLocations
      ?.filter((loc) => Number(loc.recommendedQty ?? 0) > 0)
      .map((loc, locIndex) => ({
        ...loc,
        rowKey: String(loc.rowKey || `rec_${locIndex}`),
        recommendedQty: Number(loc.recommendedQty ?? 0)
      }));
    pickLines.value[idx] = {
      ...current,
      manualLocationSelections: normalizedLocations.length ? normalizedLocations : undefined,
      fifoRecommendedLocations: normalizedLocations.length ? (normalizedRecommended?.length ? normalizedRecommended : current.fifoRecommendedLocations) : undefined,
      locationOverrideReason: payload.overrideReason || (normalizedLocations.length ? current.locationOverrideReason : undefined)
    };
    classifiedOrder.value = null;
    ElMessage.success('库位选择已保存');
  };

  // ==================== 库存检查 ====================
  /** 批量检查已填数量的物料库存，回写可用量/状态并分类工单 */
  const handleCheckInventory = async (silent = false) => {
    if (!applyDemandUserSelection()) {
      if (!silent) ElMessage.warning('请先选择需求人');
      return;
    }
    if (!canGenerate.value) {
      if (!silent) ElMessage.warning('请填写领料数量后再检查库存');
      return;
    }
    checkingInventory.value = true;
    if (!silent) resultMessage.value = '';
    try {
      pickLines.value = (await checkSpecialIssueInventory(pickLines.value, materialUserCode.value)) as SpecialIssueLine[];
      const inventoryError = validateSpecialInventorySufficient(pickLines.value);
      if (inventoryError) {
        if (!silent) {
          resultStatus.value = false;
          resultMessage.value = inventoryError;
        }
        classifiedOrder.value = null;
        return;
      }
      if (workOrder.value) {
        const classified = await classifySpecialIssueWorkOrder(buildWorkOrderFromSpecialIssueLines(workOrder.value, pickLines.value));
        const classifiedError = validateSpecialClassifiedOrder(classified, pickLines.value);
        if (classifiedError) {
          if (!silent) {
            resultStatus.value = false;
            resultMessage.value = classifiedError;
          }
          classifiedOrder.value = null;
          return;
        }
        classifiedOrder.value = classified;
      }
      if (!silent) {
        resultStatus.value = true;
        resultMessage.value = '库存检查完成，可点击「查库存」调整库位后生成备料计划';
      }
    } catch (error) {
      if (!silent) {
        resultStatus.value = false;
        resultMessage.value = (error as Error)?.message || '库存检查失败';
      }
    } finally {
      checkingInventory.value = false;
    }
  };

  // ==================== 向导步骤切换 ====================
  const confirmDemandUser = () => {
    if (!applyDemandUserSelection()) {
      ElMessage.warning('请选择需求人');
      return;
    }
    activeStep.value = 1;
  };

  const goToDemandUserStep = () => {
    activeStep.value = 0;
  };

  const goBackToPrepStep = () => {
    classifiedOrder.value = null;
    activeStep.value = 1;
  };

  // ==================== 确认备料并分类 ====================
  const confirmClassify = async () => {
    if (!workOrder.value) {
      ElMessage.warning('请先选择工单');
      return;
    }
    if (!applyDemandUserSelection()) {
      ElMessage.warning('请先选择需求人');
      return;
    }
    if (!canGenerate.value) {
      ElMessage.warning('请添加物料并填写领料数量');
      return;
    }
    classifyLoading.value = true;
    try {
      if (!classifiedOrder.value) {
        await handleCheckInventory();
      }
      if (!classifiedOrder.value) return;
      activeStep.value = 2;
    } finally {
      classifyLoading.value = false;
    }
  };

  // ==================== 生成备料计划 ====================
  const openTargetLocationDialog = async () => {
    if (!workOrder.value) {
      ElMessage.warning('请先选择工单');
      return;
    }
    if (!canGenerate.value) {
      ElMessage.warning('请添加物料并填写领料数量');
      return;
    }
    if (!classifiedOrder.value) {
      await confirmClassify();
      return;
    }
    targetLocationVisible.value = true;
  };

  const applyTargetDemandLocation = (selection: TargetDemandLocationSelection) => {
    if (!classifiedOrder.value) return;
    const locationCode = String(selection.locationCode || '').trim();
    const warehouseCode = String(selection.warehouseCode || '').trim() || undefined;
    classifiedOrder.value = {
      ...classifiedOrder.value,
      materialDemandDetails: (classifiedOrder.value.materialDemandDetails || []).map((line) => ({
        ...line,
        targetDemandLocationCode: locationCode,
        targetDemandWarehouseCode: warehouseCode
      }))
    };
  };

  const handleGeneratePrepDemand = async (selection: TargetDemandLocationSelection) => {
    if (!workOrder.value || !classifiedOrder.value) return;
    generating.value = true;
    resultMessage.value = '';
    try {
      applyTargetDemandLocation(selection);
      const inventoryError = validateSpecialInventorySufficient(pickLines.value);
      if (inventoryError) {
        resultStatus.value = false;
        resultMessage.value = inventoryError;
        return;
      }
      const classifiedError = validateSpecialClassifiedOrder(classifiedOrder.value);
      if (classifiedError) {
        resultStatus.value = false;
        resultMessage.value = classifiedError;
        return;
      }
      const prepItems = buildSpecialPrepItems(classifiedOrder.value);
      if (!prepItems.length) {
        resultStatus.value = false;
        resultMessage.value = '没有可生成的备料明细，请确认库存充足且库位已分配';
        return;
      }
      const targetDemand = resolvePrepDemandTargetLocationFromItems(prepItems);
      const response = await generateAllocation({
        workOrderNos: [workOrder.value.workOrderNo],
        prepItems,
        isEmergency: false,
        demandType: PREP_DEMAND_TYPE_NORMAL,
        businessType: 'WO_MATERIAL',
        materialUserCode: materialUserCode.value,
        materialUserName: materialUserLabel.value,
        targetDemandLocationCode: targetDemand.targetDemandLocationCode,
        targetDemandWarehouseCode: targetDemand.targetDemandWarehouseCode
      });
      if (response.code !== HttpStatus.SUCCESS) {
        resultStatus.value = false;
        resultMessage.value = response.msg || '生成备料计划失败';
        return;
      }
      const result = response.data as AllocationGenerateResult | undefined;
      if (result?.success === false) {
        resultStatus.value = false;
        resultMessage.value = result.message || '生成备料计划失败';
        return;
      }
      if (!result?.demand?.id) {
        resultStatus.value = false;
        resultMessage.value = '未生成备料需求';
        return;
      }
      targetLocationVisible.value = false;
      generatedDemand.value = normalizePrepDemand(result.demand);
      currentDemandId.value = generatedDemand.value.id;
      currentIssueId.value = generatedDemand.value.issueId ?? null;
      taskExecutionFinished.value = false;
      showPlanDetail.value = false;
      planDetailOpen.value = [];
      resultStatus.value = true;
      activeStep.value = 3;
      reloadPrepDisplayRows();
    } catch (error) {
      resultStatus.value = false;
      resultMessage.value = (error as Error)?.message || '生成备料计划失败';
    } finally {
      generating.value = false;
    }
  };

  const reloadPrepDisplayRows = () => {
    if (!generatedDemand.value) {
      prepDisplayRows.value = [];
      return;
    }
    prepDisplayRows.value = flattenPrepDemandDisplayRows(generatedDemand.value, undefined, prepLocationHints.value, prepIssueLineHints.value);
  };

  const reloadGeneratedDemand = async () => {
    if (!generatedDemand.value?.id) return;
    currentDemandId.value = generatedDemand.value.id;
    const response = await getPrepDemand(generatedDemand.value.id);
    if (response.code === 200 && response.data) {
      generatedDemand.value = response.data;
      currentIssueId.value = response.data.issueId ?? null;
      reloadPrepDisplayRows();
    }
  };

  // ==================== 261 扣料 ====================
  type PrepDemand261Route = 'AUTO' | 'LINE';

  const isConfirmCancelled = (error: unknown) => error === 'cancel' || (error as Error)?.message === 'cancel';

  /** 扣料后从分类中移除已执行仓别（平面仓/缺料继续保留在备料计划中） */
  const removeClassifiedByRoutes = (routes: Array<MaterialDemandDetailRow['warehouseRoute']>) => {
    const routeSet = new Set(routes.filter(Boolean));
    if (!classifiedOrder.value) return;
    const materialDemandDetails = (classifiedOrder.value.materialDemandDetails || []).filter((line) => {
      if (line.lineType === 'SHORTAGE') return !routeSet.has('SHORTAGE');
      return !routeSet.has(line.warehouseRoute);
    });
    if (!materialDemandDetails.length) return;
    classifiedOrder.value = { ...classifiedOrder.value, materialDemandDetails, warehouseRoute: undefined, recommendedWarehouses: [] };
  };

  const submitPrep261Issue = async (routeLabel: string, routes: PrepDemand261Route[]) => {
    if (!generatedDemand.value?.id) {
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
        demandId: generatedDemand.value.id,
        demandNo: generatedDemand.value.demandNo,
        issueOutBoList
      });
      if (res.code !== HttpStatus.SUCCESS) {
        resultStatus.value = false;
        resultMessage.value = res.msg || `${movementType.value} 扣料失败`;
        return;
      }
      resultStatus.value = true;
      resultMessage.value = res.msg || `${movementType.value} 扣料成功`;
      await reloadGeneratedDemand();
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
    if (!generatedDemand.value?.id) {
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
        demandId: generatedDemand.value.id,
        demandNo: generatedDemand.value.demandNo,
        issueOutBoList
      });
      if (res.code !== HttpStatus.SUCCESS) {
        resultStatus.value = false;
        resultMessage.value = res.msg || `${movementType.value} 扣料失败`;
        return;
      }
      resultStatus.value = true;
      resultMessage.value = res.msg || `${movementType.value} 扣料成功`;
      await reloadGeneratedDemand();
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

  const checkTaskStepCompletion = () => {
    if (activeStep.value === 3 && generatedDemand.value && !hasWarehouse261Tasks.value) {
      taskExecutionFinished.value = true;
    }
  };

  watch([activeStep, hasWarehouse261Tasks, generatedDemand], () => checkTaskStepCompletion(), { immediate: true });

  const openPlanDetail = () => {
    showPlanDetail.value = true;
    planDetailOpen.value = ['plan'];
  };

  const goToMaterialIssue = () => {
    if (generatedDemand.value?.issueId) {
      currentIssueId.value = generatedDemand.value.issueId;
      issueDrawerVisible.value = true;
    } else ElMessage.info('暂未关联发料单');
  };

  const startNewIssue = async () => {
    clearAll();
    taskExecutionFinished.value = false;
    prepDisplayRows.value = [];
    currentDemandId.value = null;
    showPlanDetail.value = false;
    planDetailOpen.value = [];
    activeStep.value = 0;
    await nextTick();
  };

  // ==================== 行操作 ====================
  const updatePickQty = (index: number, val: number) => {
    const row = pickLines.value[index];
    if (!row) return;
    pickLines.value[index] = { ...row, issueQty: Math.max(0, Number(val) || 0) };
    pickLines.value = refreshBomRowRecommendations(pickLines.value);
    classifiedOrder.value = null;
  };

  const updatePickUnit = (index: number, altUnit: string) => {
    const row = pickLines.value[index];
    if (!row) return;
    pickLines.value[index] = applyIssueUnitSelection(row, altUnit);
    pickLines.value = refreshBomRowRecommendations(pickLines.value);
    classifiedOrder.value = null;
  };

  const removePickLine = (index: number) => {
    pickLines.value.splice(index, 1);
    classifiedOrder.value = null;
  };

  const clearPickLines = () => {
    pickLines.value = [];
    classifiedOrder.value = null;
    generatedDemand.value = null;
    resultMessage.value = '';
  };

  return {
    // 需求人
    demandUserMode,
    otherUserCode,
    materialUserCode,
    materialUserLabel,
    materialUserOptions,
    currentUserDisplay,
    otherUserOptions,
    applyDemandUserSelection,
    onDemandUserModeChange,
    // 工单与物料
    showOrderDialog,
    dialogSelectedOrders,
    workOrderNo,
    materialCode,
    materialUnit,
    requiredQty,
    workOrder,
    pickLines,
    loadingAdd,
    generating,
    checkingInventory,
    targetLocationVisible,
    classifiedOrder,
    generatedDemand,
    resultMessage,
    resultStatus,
    selectedMaterial,
    locationDialogMode,
    showLocationDialog,
    classifyLoading,
    activeStep,
    stepsActive,
    demandUserStepDesc,
    // 执行任务
    taskExecutionFinished,
    submittingAuto,
    submittingLine,
    submittingCombined,
    prepDisplayRows,
    movementType,
    currentDemandId,
    issueDrawerVisible,
    currentIssueId,
    showPlanDetail,
    planDetailOpen,
    wmsInventorySpecialFlag: wms_inventory_special_flag,
    workOrderStatusList,
    materialCodeConfig,
    // 计算与工具
    canAddMaterial,
    canGenerate,
    getRecommendItems,
    formatQty,
    clearAll,
    // 分类结果
    classifiedMaterialRows,
    autoMaterialRows,
    lineMaterialRows,
    flatMaterialRows,
    shortageMaterialRows,
    formatClassifiedPrepQty,
    // 执行任务（261 扣料）
    prep261AutoDisplayRows,
    prep261LineDisplayRows,
    prep261AutoRows,
    prep261LineRows,
    prepLocationHints,
    prepIssueLineHints,
    hasWarehouse261Tasks,
    canSubmitCombined261,
    combined261RowCount,
    formatKitRate,
    // 操作
    confirmDemandUser,
    goToDemandUserStep,
    goBackToPrepStep,
    handleOrderSelection,
    handleAddByMaterial,
    openLocationRecommend,
    openLocationQuery,
    onLocationConfirm,
    handleCheckInventory,
    confirmClassify,
    openTargetLocationDialog,
    handleGeneratePrepDemand,
    reloadGeneratedDemand,
    reloadPrepDisplayRows,
    submitAutoIssue,
    submitLineIssue,
    submitCombinedIssue,
    openPlanDetail,
    goToMaterialIssue,
    startNewIssue,
    updatePickQty,
    updatePickUnit,
    removePickLine,
    clearPickLines
  };
}

const ui = reactive(useZpIssue());

// ==================== 物料选择弹框 ====================
const itemDialogRef = ref<InstanceType<typeof ItemDialog>>();

const showItemDialog = () => {
  itemDialogRef.value?.openDialog();
  itemDialogRef.value?.handleQuery();
};

const itemSelectCallBack = (record: any) => {
  ui.materialCode = record.item;
  ui.materialUnit = record.unit || '';
};
</script>

<style scoped>
.special-issue-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.workbench-steps {
  margin-bottom: 16px;
}
.step-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.step-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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
.demand-user-card .step-toolbar {
  justify-content: center;
}
.work-order-bar {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.wo-summary {
  flex: 1;
}
.material-add-row {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.list-title {
  font-size: 15px;
  font-weight: 600;
}
.list-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.step-footer-row {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}
.result-alert {
  margin-bottom: 12px;
}
.result-alert :deep(.el-alert) {
  padding: 6px 10px;
}
.result-alert-body {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.recommend-pick-row {
  display: grid;
  /* 库位占满剩余空间，库存类型标签与数量按内容自适应 */
  grid-template-columns: minmax(0, 1fr) auto minmax(72px, auto);
  gap: 8px;
  align-items: center;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}
/* 其他线边仓：整行黄色标识 */
.recommend-pick-row.is-other-line {
  color: var(--el-color-warning);
}
.pick-loc {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pick-qty {
  text-align: right;
  white-space: nowrap;
}
.pick-inventory-type {
  white-space: nowrap;
}
.text-muted {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.classify-tip {
  margin-bottom: 12px;
}
.classify-sections {
  display: flex;
}
.classify-card {
  margin-bottom: 12px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}
.classify-summary {
  margin-right: auto;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
/* 执行任务 */
.plan-summary {
  margin-bottom: 16px;
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
.section-col-bottom {
  margin-top: 16px;
}
.task-card {
  min-height: 240px;
}
.task-card-header {
  align-items: flex-start;
}
.task-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.task-finish-result {
  margin-bottom: 8px;
}
.plan-detail-collapse {
  margin-top: 12px;
}
</style>
