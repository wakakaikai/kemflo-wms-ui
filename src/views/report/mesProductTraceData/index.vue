<template>
  <div class="mes-product-trace-page">
    <div ref="captureRef" class="p-2 mes-product-trace" :class="{ 'is-capturing': capturing }">
      <el-card shadow="hover">
        <el-form
          ref="queryFormRef"
          :model="queryParams"
          :rules="queryRules"
          :inline="true"
          label-width="80px"
          @submit.prevent
        >
          <el-form-item :label="MSG.traceBarcode" prop="sfc">
            <el-input
              v-model="queryParams.sfc"
              :placeholder="MSG.productOrKeyBarcode"
              clearable
              style="width: 360px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" :loading="loading" @click="handleQuery">{{ MSG.query }}</el-button>
            <el-button icon="Refresh" @click="resetQuery">{{ MSG.reset }}</el-button>
          </el-form-item>
        </el-form>

        <div v-loading="loading" :element-loading-text="MSG.loading" class="trace-result-area">
          <template v-if="hasTraceData">
            <div v-for="(item, index) in resultData" :key="index" class="trace-result-block">
              <el-divider content-position="left">{{ MSG.basicInfo }}</el-divider>
              <el-descriptions :column="3" border class="trace-descriptions">
                <el-descriptions-item :label="MSG.productBarcode">{{ item.transferSfc }}</el-descriptions-item>
                <el-descriptions-item :label="MSG.traceCode">{{ item.oldSfc }}</el-descriptions-item>
                <el-descriptions-item :label="MSG.palletBox">{{ item.palletSnEntity?.palletNo || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="MSG.shopOrder">{{ item.shopOrderEntity?.shopOrder }}</el-descriptions-item>
                <el-descriptions-item :label="MSG.itemNo">{{ item.shopOrderEntity?.itemBo }}</el-descriptions-item>
                <el-descriptions-item :label="MSG.desc">{{ item.itemDesc }}</el-descriptions-item>
                <el-descriptions-item :label="MSG.plannedRoute">{{ item.shopOrderEntity?.plannedRouterBo }}</el-descriptions-item>
                <el-descriptions-item :label="MSG.actualRoute">{{ item.shopOrderEntity?.routerBo }}</el-descriptions-item>
                <el-descriptions-item :label="MSG.workCenter">{{ item.shopOrderEntity?.plannedWorkCenterBo }}</el-descriptions-item>
                <el-descriptions-item :label="MSG.barcodeQty">{{ item.qty }}</el-descriptions-item>
                <el-descriptions-item :label="MSG.plannedQty">{{ item.shopOrderEntity?.qtyToBuild }}</el-descriptions-item>
                <el-descriptions-item :label="MSG.doneQty">{{ item.shopOrderEntity?.qtyDone }}</el-descriptions-item>
                <el-descriptions-item label="FQC">{{ item.fqcSfc || '-' }}</el-descriptions-item>
              </el-descriptions>

              <el-divider content-position="left">{{ MSG.processRoute }}</el-divider>
              <el-steps
                :active="item.sfcStep ?? 0"
                finish-status="success"
                align-center
                size="small"
                class="trace-steps"
              >
                <el-step
                  v-for="(step, stepIdx) in item.sfcStepList || []"
                  :key="stepIdx"
                  :title="step.operation"
                  :description="step.operationDescription"
                />
              </el-steps>

              <template v-if="item.bomComponentEntityList?.length">
                <el-divider content-position="left">{{ MSG.shopOrderBom }}</el-divider>
                <trace-table :columns="bomColumns" :data="item.bomComponentEntityList" />
              </template>

              <template v-if="(item.shopOrderEntityList?.length ?? 0) > 1">
                <el-divider content-position="left">{{ MSG.shopOrderHistory }}</el-divider>
                <div class="trace-toolbar">
                  <el-button plain size="small" @click="shopOrderReverse = !shopOrderReverse">{{ MSG.sort }}</el-button>
                </div>
                <el-timeline class="trace-timeline">
                  <el-timeline-item
                    v-for="(shopOrderItem, shopOrderIdx) in getShopOrderHistory(item.shopOrderEntityList)"
                    :key="shopOrderIdx"
                  >
                    <span class="trace-meta-text">{{ MSG.shopOrderLabel }}{{ shopOrderItem.shopOrder }}</span>
                    <span class="trace-meta-text trace-meta-text--gap">{{ MSG.createTimeLabel }}{{ shopOrderItem.createTime }}</span>
                  </el-timeline-item>
                </el-timeline>
              </template>

              <el-divider content-position="left">{{ MSG.traceRecord }}</el-divider>
              <div class="trace-toolbar">
                <el-button type="primary" size="small" @click="openComponentModal(index)">{{ MSG.keyComponent }}</el-button>
                <el-button type="primary" size="small" @click="openNcDataModal(index)">{{ MSG.ncRecord }}</el-button>
                <el-button type="primary" size="small" @click="openActivityLogModal(index)">{{ MSG.activityHistory }}</el-button>
                <el-button plain size="small" @click="traceReverse = !traceReverse">{{ MSG.sort }}</el-button>
              </div>

              <el-timeline class="trace-timeline">
                <el-timeline-item
                  v-for="(operActivityLogItem, operIdx) in getOperationActivityLogs(item.operationActivityLogList)"
                  :key="operIdx"
                >
                  <div class="trace-operation-block">
                    <div class="trace-operation-title">{{ formatOperationTitle(operActivityLogItem[0]) }}</div>
                    <el-divider content-position="left">{{ MSG.operationRecord }}</el-divider>
                    <trace-table :columns="activityLogColumns" :data="operActivityLogItem" />
                    <template v-if="getOperAssyList(item, operActivityLogItem).length">
                      <el-divider content-position="left">{{ MSG.keyComponentRecord }}</el-divider>
                      <trace-table :columns="componentColumns" :data="getOperAssyList(item, operActivityLogItem)">
                        <template #removed="{ row }">
                          <el-icon v-if="row.removed === 'true'" color="#f56c6c"><CircleCloseFilled /></el-icon>
                          <el-icon v-else color="#67c23a"><CircleCheckFilled /></el-icon>
                        </template>
                      </trace-table>
                    </template>
                    <template
                      v-for="(operTestDataItem, testIdx) in getOperTestDataList(item, operActivityLogItem)"
                      :key="testIdx"
                    >
                      <el-divider content-position="left">{{ MSG.testRecord }}</el-divider>
                      <div
                        class="trace-test-status"
                        :class="operTestDataItem[0]?.testStatus === 'PASS' ? 'is-pass' : 'is-fail'"
                      >
                        {{ MSG.totalTestResult }}
                        <trace-status-tag
                          :status="operTestDataItem[0]?.testStatus"
                          :label="operTestDataItem[0]?.testStatus === 'PASS' ? MSG.pass : MSG.fail"
                        />
                      </div>
                      <trace-table :columns="testDataColumns" :data="operTestDataItem">
                        <template #measureStatus="{ row }">
                          <trace-status-tag :status="row.measureStatus" />
                        </template>
                      </trace-table>
                    </template>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </template>

          <template v-else-if="hasComponentOnlyData">
            <el-divider content-position="left">{{ MSG.keyComponentRecord }}</el-divider>
            <trace-table
              v-for="(item, idx) in resultData"
              :key="idx"
              :columns="componentColumns"
              :data="item.sfcAssyList || []"
            >
              <template #removed="{ row }">
                <el-icon v-if="row.removed === 'true'" color="#f56c6c"><CircleCloseFilled /></el-icon>
                <el-icon v-else color="#67c23a"><CircleCheckFilled /></el-icon>
              </template>
            </trace-table>
          </template>

          <el-empty v-else-if="searched && !loading" :description="MSG.noData" class="trace-empty" />
        </div>
      </el-card>

      <el-dialog v-model="activityLogVisible" :title="MSG.operationRecord" width="92%" destroy-on-close append-to-body>
        <trace-table :columns="activityLogColumns" :data="currentItem?.activityLogList || []" bordered />
      </el-dialog>

      <el-dialog v-model="componentVisible" :title="MSG.keyComponentRecord" width="92%" destroy-on-close append-to-body>
        <trace-table :columns="componentColumns" :data="currentItem?.sfcAssyList || []" bordered>
          <template #removed="{ row }">
            <el-icon v-if="row.removed === 'true'" color="#f56c6c"><CircleCloseFilled /></el-icon>
            <el-icon v-else color="#67c23a"><CircleCheckFilled /></el-icon>
          </template>
        </trace-table>
      </el-dialog>

      <el-dialog v-model="ncDataVisible" :title="MSG.ncRecord" width="92%" destroy-on-close append-to-body>
        <trace-table :columns="ncDataColumns" :data="currentItem?.ncDataReportVOList || []" bordered />
      </el-dialog>
    </div>

    <el-tooltip :content="MSG.captureTip" placement="left">
      <el-button
        class="trace-capture-btn"
        type="primary"
        circle
        icon="Camera"
        :loading="capturing"
        :disabled="!canCapture"
        @click="handleCapture"
      />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts" name="MesProductTraceData">
import { computed, getCurrentInstance, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue';
import { traceSfc } from '@/api/mes/trace';
import type { ActivityLogVO, ProductTraceVO, ShopOrderHistoryVO } from '@/api/mes/trace/types';
import TraceTable from './components/TraceTable.vue';
import TraceStatusTag from './components/TraceStatusTag.vue';
import { captureTraceScreenshot } from './utils/captureTraceScreenshot';
import {
  activityLogColumns,
  bomColumns,
  componentColumns,
  ncDataColumns,
  testDataColumns
} from './constants';
import { MSG } from './messages';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const queryFormRef = ref<ElFormInstance>();
const captureRef = ref<HTMLElement>();
const capturing = ref(false);
const loading = ref(false);
const searched = ref(false);
const resultData = ref<ProductTraceVO[]>([]);
const traceReverse = ref(false);
const shopOrderReverse = ref(true);
const curIndex = ref(0);
const activityLogVisible = ref(false);
const componentVisible = ref(false);
const ncDataVisible = ref(false);

const queryParams = reactive({ sfc: '' });

const queryRules = {
  sfc: [{ required: true, message: MSG.inputTraceBarcode, trigger: 'blur' }]
};

const hasTraceData = computed(() => resultData.value.length > 0 && !!resultData.value[0].transferSfc);

const hasComponentOnlyData = computed(() => {
  const first = resultData.value[0];
  return resultData.value.length > 0 && !first?.transferSfc && (first?.sfcAssyList?.length ?? 0) > 0;
});

const canCapture = computed(() => hasTraceData.value || hasComponentOnlyData.value);

const currentItem = computed(() => resultData.value[curIndex.value]);

const getShopOrderHistory = (list: ShopOrderHistoryVO[] = []) => {
  const items = [...list];
  return shopOrderReverse.value ? items.reverse() : items;
};

const getOperationActivityLogs = (list: ActivityLogVO[][] = []) => {
  const items = [...list];
  return traceReverse.value ? items.reverse() : items;
};

const formatOperationTitle = (log?: ActivityLogVO) => {
  if (!log) return '';
  const operation = log.operation == null ? MSG.shopOrderRelease : log.operation;
  const desc = log.operationDesc == null ? '' : `   (${log.operationDesc})`;
  return `${operation}${desc}`;
};

const getOperAssyList = (item: ProductTraceVO, operActivityLogItem: ActivityLogVO[]) => {
  const operation = operActivityLogItem[0]?.operation;
  return (item.sfcAssyList || []).filter((sfcAssyItem) => sfcAssyItem.operationBo === operation);
};

const getOperTestDataList = (item: ProductTraceVO, operActivityLogItem: ActivityLogVO[]) => {
  const operation = operActivityLogItem[0]?.operation;
  return (item.operationParametricMeasureList || []).filter((testGroup) => testGroup[0]?.operation === operation);
};

const handleQuery = async () => {
  const valid = await queryFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  searched.value = true;
  try {
    const res: any = await traceSfc({ sfc: queryParams.sfc.trim() });
    if (res.code === 200 || res.success) {
      resultData.value = res.data || [];
    } else {
      resultData.value = [];
      proxy?.$modal.msgError(res.msg || res.message || MSG.queryError);
    }
  } catch {
    resultData.value = [];
  } finally {
    loading.value = false;
  }
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.sfc = '';
  resultData.value = [];
  searched.value = false;
  traceReverse.value = false;
  shopOrderReverse.value = true;
};

const openActivityLogModal = (index: number) => {
  curIndex.value = index;
  activityLogVisible.value = true;
};

const openComponentModal = (index: number) => {
  curIndex.value = index;
  componentVisible.value = true;
};

const openNcDataModal = (index: number) => {
  curIndex.value = index;
  ncDataVisible.value = true;
};

const handleCapture = async () => {
  if (!captureRef.value || !canCapture.value) {
    ElMessage.warning(MSG.captureEmpty);
    return;
  }

  capturing.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 80));
    await captureTraceScreenshot(captureRef.value, queryParams.sfc.trim());
    ElMessage.success(MSG.captureOk);
  } catch (error) {
    console.error(error);
    ElMessage.error(MSG.captureFail);
  } finally {
    capturing.value = false;
  }
};
</script>

<style scoped lang="scss">
.mes-product-trace-page {
  position: relative;
}

.mes-product-trace {
  .trace-result-block + .trace-result-block {
    margin-top: 24px;
  }

  .trace-result-area {
    margin-top: 4px;
  }

  :deep(.el-divider) {
    margin: 20px 0 14px;
    border-color: var(--el-border-color-lighter);

    .el-divider__text {
      display: flex;
      align-items: center;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      background: var(--el-bg-color);
      padding-left: 0;

      &::before {
        content: '';
        display: inline-block;
        width: 4px;
        height: 16px;
        margin-right: 8px;
        border-radius: 2px;
        background: var(--el-color-primary);
      }
    }
  }

  .trace-descriptions {
    :deep(.el-descriptions__content) {
      word-break: break-all;
    }
  }

  .trace-steps {
    margin: 12px 0 20px;
  }

  .trace-toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-bottom: 12px;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
  }

  .trace-timeline {
    margin-top: 8px;

    :deep(.el-timeline-item__wrapper) {
      padding-left: 20px;
    }

    :deep(.el-timeline-item__node) {
      background: var(--el-color-primary);
    }
  }

  .trace-operation-block {
    padding: 14px 16px 16px;
    border-radius: 10px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-light);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  }

  .trace-operation-title {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 6px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    margin-bottom: 12px;
    font-weight: 600;
    font-size: 14px;
  }

  .trace-test-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding: 6px 12px;
    border-radius: 6px;
    font-weight: 500;
    background: var(--el-fill-color-light);

    &.is-pass {
      color: #67c23a;
      background: rgba(103, 194, 58, 0.08);
    }

    &.is-fail {
      color: #f56c6c;
      background: rgba(245, 108, 108, 0.08);
    }
  }

  .trace-meta-text--gap {
    margin-left: 16px;
  }

  .trace-empty {
    padding: 40px 0;
  }

  &.is-capturing {
    :deep(.el-table__header-wrapper),
    :deep(.el-table__body-wrapper),
    :deep(.el-scrollbar),
    :deep(.el-scrollbar__wrap) {
      max-height: none !important;
      height: auto !important;
      overflow: visible !important;
    }

    :deep(.el-table__fixed),
    :deep(.el-table__fixed-right) {
      display: none !important;
    }
  }
}

.mes-product-trace-page .trace-capture-btn {
  position: fixed;
  right: 28px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 200;
  width: 48px;
  height: 48px;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.35);
}
</style>
