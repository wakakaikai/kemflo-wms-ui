<template>
  <div class="mes-product-trace-page">
    <div ref="captureRef" class="p-2 mes-product-trace" :class="{ 'is-capturing': capturing }">
      <el-card shadow="hover">
        <el-form ref="queryFormRef" :model="queryParams" :rules="queryRules" :inline="true" label-width="80px" @submit.prevent>
          <el-form-item label="追溯条码" prop="sfc">
            <HistoryInput v-model.trim="queryParams.sfc" :config="traceSfcConfig" placeholder="产品条码/关键件条码" clearable style="width: 360px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" :loading="loading" @click="handleQuery">查询</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <div v-loading="loading" element-loading-text="数据加载中..." class="trace-result-area">
          <template v-if="hasTraceData">
            <div v-for="(item, index) in resultData" :key="index" class="trace-result-block">
              <el-divider content-position="left">基本信息</el-divider>
              <el-descriptions :column="3" border class="trace-descriptions">
                <el-descriptions-item label="产品条码">{{ item.transferSfc }}</el-descriptions-item>
                <el-descriptions-item label="追溯码">{{ item.oldSfc }}</el-descriptions-item>
                <el-descriptions-item label="栈板码/外箱">{{ item.palletSnEntity?.palletNo || '' }}</el-descriptions-item>
                <el-descriptions-item label="工单号">{{ item.shopOrderEntity?.shopOrder }}</el-descriptions-item>
                <el-descriptions-item label="料号">{{ item.shopOrderEntity?.itemBo }}</el-descriptions-item>
                <el-descriptions-item label="描述">{{ item.itemDesc }}</el-descriptions-item>
                <el-descriptions-item label="计划工艺路线">{{ item.shopOrderEntity?.plannedRouterBo }}</el-descriptions-item>
                <el-descriptions-item label="实际工艺路线">{{ item.shopOrderEntity?.routerBo }}</el-descriptions-item>
                <el-descriptions-item label="工作中心">{{ item.shopOrderEntity?.plannedWorkCenterBo }}</el-descriptions-item>
                <el-descriptions-item label="条码数量">{{ item.qty }}</el-descriptions-item>
                <el-descriptions-item label="计划数量">{{ item.shopOrderEntity?.qtyToBuild }}</el-descriptions-item>
                <el-descriptions-item label="完成数量">{{ item.shopOrderEntity?.qtyDone }}</el-descriptions-item>
                <el-descriptions-item label="FQC">{{ item.fqcSfc || '' }}</el-descriptions-item>
              </el-descriptions>

              <el-divider content-position="left">工艺路线</el-divider>
              <el-steps :active="item.sfcStep ?? 0" finish-status="success" size="small" class="trace-steps">
                <el-step v-for="(step, stepIdx) in item.sfcStepList || []" :key="stepIdx" :title="step.operation" :description="step.operationDescription" hollow="true" />
              </el-steps>

              <template v-if="item.bomComponentEntityList?.length">
                <el-divider content-position="left">工单BOM</el-divider>
                <trace-table :columns="bomColumns" :data="item.bomComponentEntityList" />
              </template>

              <template v-if="(item.shopOrderEntityList?.length ?? 0) > 1">
                <el-divider content-position="left">工单流转历史</el-divider>
                <div class="trace-toolbar">
                  <el-button plain size="small" @click="shopOrderReverse = !shopOrderReverse">排序</el-button>
                </div>
                <el-timeline class="trace-timeline">
                  <el-timeline-item v-for="(shopOrderItem, shopOrderIdx) in getShopOrderHistory(item.shopOrderEntityList)" :key="shopOrderIdx" hollow>
                    <span class="trace-meta-text">工单号：{{ shopOrderItem.shopOrder }}</span>
                    <span class="trace-meta-text trace-meta-text--gap">条码创建时间：{{ shopOrderItem.createTime }}</span>
                  </el-timeline-item>
                </el-timeline>
              </template>

              <el-divider content-position="left">追溯记录</el-divider>
              <div class="trace-toolbar">
                <el-button type="primary" size="small" @click="openComponentModal(index)">关键件</el-button>
                <el-button type="primary" size="small" @click="openNcDataModal(index)">不良记录</el-button>
                <el-button type="primary" size="small" @click="openActivityLogModal(index)">作业履历</el-button>
                <el-button plain size="small" @click="traceReverse = !traceReverse">排序</el-button>
              </div>

              <el-timeline class="trace-timeline trace-operation-timeline">
                <el-timeline-item v-for="(operActivityLogItem, operIdx) in getOperationActivityLogs(item.operationActivityLogList)" :key="operIdx" hollow>
                  <div class="trace-operation-block">
                    <div class="trace-operation-title">{{ formatOperationTitle(operActivityLogItem[0]) }}</div>
                    <el-divider content-position="left">操作记录</el-divider>
                    <trace-table :columns="activityLogColumns" :data="operActivityLogItem" :bordered="false" />
                    <template v-if="getOperAssyList(item, operActivityLogItem).length">
                      <el-divider content-position="left">关键件记录</el-divider>
                      <trace-table :columns="componentColumns" :data="getOperAssyList(item, operActivityLogItem)" :bordered="false">
                        <template #removed="{ row }">
                          <el-icon v-if="row.removed === 'true'" color="#f56c6c"><CircleCloseFilled /></el-icon>
                          <el-icon v-else color="#67c23a"><CircleCheckFilled /></el-icon>
                        </template>
                      </trace-table>
                    </template>
                    <template v-for="(operTestDataItem, testIdx) in getOperTestDataList(item, operActivityLogItem)" :key="testIdx">
                      <el-divider content-position="left">测试记录</el-divider>
                      <div class="trace-test-status" :class="getTotalTestStatus(operTestDataItem) === 'PASS' ? 'is-pass' : 'is-fail'">
                        总测试结果：
                        <trace-status-tag :status="getTotalTestStatus(operTestDataItem)" :label="getTotalTestStatus(operTestDataItem) === 'PASS' ? '通过' : '失败'" />
                      </div>
                      <trace-table :columns="testDataColumns" :data="operTestDataItem" :bordered="false">
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
            <el-divider content-position="left">关键件记录</el-divider>
            <trace-table v-for="(item, idx) in resultData" :key="idx" :columns="componentColumns" :data="item.sfcAssyList || []">
              <template #removed="{ row }">
                <el-icon v-if="row.removed === 'true'" color="#f56c6c"><CircleCloseFilled /></el-icon>
                <el-icon v-else color="#67c23a"><CircleCheckFilled /></el-icon>
              </template>
            </trace-table>
          </template>

          <el-empty v-else-if="!loading" description="暂无追溯数据" class="trace-empty" />
        </div>
      </el-card>

      <el-dialog v-model="activityLogVisible" title="操作记录" width="92%" destroy-on-close append-to-body>
        <trace-table :columns="activityLogColumns" :data="currentItem?.activityLogList || []" bordered />
      </el-dialog>

      <el-dialog v-model="componentVisible" title="关键件记录" width="92%" destroy-on-close append-to-body>
        <trace-table :columns="componentColumns" :data="currentItem?.sfcAssyList || []" bordered>
          <template #removed="{ row }">
            <el-icon v-if="row.removed === 'true'" color="#f56c6c"><CircleCloseFilled /></el-icon>
            <el-icon v-else color="#67c23a"><CircleCheckFilled /></el-icon>
          </template>
        </trace-table>
      </el-dialog>

      <el-dialog v-model="ncDataVisible" title="不良记录" width="92%" destroy-on-close append-to-body>
        <trace-table :columns="ncDataColumns" :data="currentItem?.ncDataReportVOList || []" bordered />
      </el-dialog>
    </div>

    <el-tooltip content="长截图保存" placement="left">
      <el-button class="trace-capture-btn" type="primary" circle icon="Camera" :loading="capturing" :disabled="!canCapture" @click="handleCapture" />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts" name="MesProductTraceData">
import { computed, getCurrentInstance, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue';
import { traceSfc } from '@/api/mes/trace';
import type { ActivityLogVO, ParametricMeasureVO, ProductTraceVO, ShopOrderHistoryVO } from '@/api/mes/trace/types';
import TraceTable from './components/TraceTable.vue';
import TraceStatusTag from './components/TraceStatusTag.vue';
import HistoryInput from '@/components/HistoryInput/index.vue';
import type { HistoryConfig } from '@/types/history';
import html2canvas from 'html2canvas';
import FileSaver from 'file-saver';

// ===== captureReadResult (inlined) =====

type StyleSnapshot = {
  el: HTMLElement;
  styles: Record<string, string>;
};

const STYLE_KEYS = ['maxHeight', 'height', 'overflow', 'overflowX', 'overflowY'] as const;

function snapshotAndExpand(el: HTMLElement): StyleSnapshot {
  const styles: Record<string, string> = {};
  STYLE_KEYS.forEach((key) => {
    styles[key] = el.style[key];
  });
  el.style.maxHeight = 'none';
  el.style.height = 'auto';
  el.style.overflow = 'visible';
  el.style.overflowX = 'visible';
  el.style.overflowY = 'visible';
  return { el, styles };
}

function restoreStyles(snapshots: StyleSnapshot[]) {
  snapshots.forEach(({ el, styles }) => {
    STYLE_KEYS.forEach((key) => {
      el.style[key] = styles[key] || '';
    });
  });
}

function waitFrames(times = 2) {
  return new Promise<void>((resolve) => {
    const step = (left: number) => {
      if (left <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(() => step(left - 1));
    };
    step(times);
  });
}

/**
 * �Բɼ��������������ͼ����ʱչ���������򣬱���ֻ�ص���������
 */
async function captureReadResultScreenshot(options: {
  root: HTMLElement;
  fileName?: string;
  scale?: number;
  onclone?: (clonedRoot: HTMLElement) => void;
}): Promise<void> {
  const { root, fileName = `�ɼ����_${Date.now()}.png`, scale = 2, onclone } = options;
  const snapshots: StyleSnapshot[] = [];
  const dialog = (root.closest('.el-dialog') as HTMLElement) || root;

  dialog.classList.add('is-capturing');

  const targets = [
    dialog,
    root,
    ...Array.from(
      root.querySelectorAll<HTMLElement>(
        '.el-dialog__body, .el-table, .el-table__inner-wrapper, .el-table__body-wrapper, .el-table__header-wrapper, .el-scrollbar, .el-scrollbar__wrap, .el-scrollbar__view'
      )
    )
  ];

  Array.from(new Set(targets)).forEach((el) => snapshots.push(snapshotAndExpand(el)));
  await waitFrames(2);

  try {
    const canvas = await html2canvas(root, {
      scale,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: Math.max(root.scrollWidth, root.clientWidth),
      windowHeight: Math.max(root.scrollHeight, root.clientHeight),
      onclone: (_doc, clonedElement) => {
        onclone?.(clonedElement as HTMLElement);
      }
    });

    await new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('��ͼ����ʧ��'));
          return;
        }
        FileSaver.saveAs(blob, fileName);
        resolve();
      }, 'image/png');
    });
  } finally {
    restoreStyles(snapshots);
    dialog.classList.remove('is-capturing');
  }
}

function buildReadResultFileName(title?: string) {
  const safeTitle = (title || '�ɼ����').replace(/[\\/:*?"<>|]/g, '_');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${safeTitle}_${stamp}.png`;
}
// ===== end captureReadResult =====

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const activityLogColumns = [
  { label: '操作时间', prop: 'dateTime', width: 160 },
  { label: '作业代码', prop: 'actionCode', width: 120 },
  { label: '作业描述', prop: 'actionDetail', width: 160 },
  { label: '物料', prop: 'item', width: 140 },
  { label: '工序', prop: 'operation', width: 120 },
  { label: '工序描述', prop: 'operationDesc', width: 140 },
  { label: '资源', prop: 'resrce', width: 120 },
  { label: '工作中心', prop: 'workCenter', width: 120 },
  { label: '工单', prop: 'shopOrderBo', width: 140 },
  { label: '作业人员', prop: 'userId', width: 100 }
];

const componentColumns = [
  { label: '组件/版本', prop: 'componentBo', width: 140 },
  { label: '描述', prop: 'componentDesc', minWidth: 200 },
  { label: '组件条码', prop: 'inventoryBo', width: 160 },
  { label: '已装配数量', prop: 'qty', width: 100 },
  { label: '装配工序', prop: 'operationBo', width: 100 },
  { label: '绑定状态', prop: 'removed', width: 90, slot: 'removed' }
];

const ncDataColumns = [
  { label: '产品条码', prop: 'sfc', width: 160 },
  { label: '工序', prop: 'operation', width: 100 },
  { label: '不合格记录时间', prop: 'dateTime', width: 160 },
  { label: '不合格代码', prop: 'ncCode', width: 120 },
  { label: '不合格代码描述', prop: 'ncCodeDescription', minWidth: 160 },
  { label: '作业人员', prop: 'userId', width: 100 },
  { label: '备注', prop: 'remark', minWidth: 160 }
];

const testDataColumns = [
  { label: '检测结果', prop: 'measureStatus', width: 90, slot: 'measureStatus' },
  { label: '检测时间', prop: 'testDateTime', width: 160 },
  { label: '检测人员', prop: 'userId', width: 100 },
  { label: '参数编码', prop: 'measureName', width: 120 },
  { label: '参数描述', prop: 'measureNameDesc', width: 140 },
  { label: '上限', prop: 'highLimit', width: 100 },
  { label: '下限', prop: 'lowLimit', width: 100 },
  { label: '检测值', prop: 'actual', width: 100 }
];

const bomColumns = [
  { label: '顺序', prop: 'sequence', width: 70 },
  { label: '组件/版本', prop: 'componentGbo', width: 140 },
  { label: '描述', prop: 'componentDesc', minWidth: 200 },
  { label: '工序', prop: 'assemblyOperationBo', width: 100 },
  { label: '工序描述', prop: 'operationDesc', width: 140 },
  { label: '装配数量', prop: 'qty', width: 90 }
];

const queryFormRef = ref<ElFormInstance>();
const captureRef = ref<HTMLElement>();
const capturing = ref(false);
const loading = ref(false);
const resultData = ref<ProductTraceVO[]>([]);
const traceReverse = ref(false);
const shopOrderReverse = ref(true);
const curIndex = ref(0);
const activityLogVisible = ref(false);
const componentVisible = ref(false);
const ncDataVisible = ref(false);

const queryParams = reactive({ sfc: '' });

const traceSfcConfig: HistoryConfig = {
  key: 'traceSfc',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'mesProductTraceData',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true
  }
};

const queryRules = {
  sfc: [{ required: true, message: '请输入追溯条码', trigger: 'blur' }]
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
  const operation = log.operation == null ? '工单下达' : log.operation;
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

const isPassStatus = (status?: string) => {
  const s = String(status || '')
    .trim()
    .toUpperCase();
  return s === 'PASS' || s === 'OK' || s === 'SUCCESS' || s === '良' || s === '合格';
};

const getTotalTestStatus = (group: ParametricMeasureVO[] = []): 'PASS' | 'FAIL' => {
  if (!group.length) return 'FAIL';
  return group.every((row) => isPassStatus(row.testStatus)) ? 'PASS' : 'FAIL';
};

const handleQuery = async () => {
  const valid = await queryFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const res: any = await traceSfc({ sfc: queryParams.sfc.trim() });
    if (res.code === 200 || res.success) {
      resultData.value = res.data || [];
    } else {
      resultData.value = [];
      proxy?.$modal.msgError(res.msg || res.message || '查询异常');
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

function applyStatusTagStyles(tag: HTMLElement) {
  tag.style.display = 'inline-block';
  tag.style.opacity = '1';
  tag.style.padding = '0 9px';
  tag.style.height = '22px';
  tag.style.lineHeight = '20px';
  tag.style.fontSize = '12px';
  tag.style.borderRadius = '4px';
  tag.style.border = '1px solid';
  tag.style.whiteSpace = 'nowrap';
  tag.style.verticalAlign = 'middle';

  if (tag.classList.contains('is-pass')) {
    tag.style.color = '#fff';
    tag.style.backgroundColor = '#67c23a';
    tag.style.borderColor = '#67c23a';
  } else {
    tag.style.color = '#fff';
    tag.style.backgroundColor = '#f56c6c';
    tag.style.borderColor = '#f56c6c';
  }
}

function prepareTraceClone(clonedRoot: HTMLElement) {
  clonedRoot.querySelectorAll<HTMLElement>('.el-table__fixed, .el-table__fixed-right').forEach((el) => {
    el.style.display = 'none';
  });

  clonedRoot.querySelectorAll<HTMLElement>('.el-table__inner-wrapper, .trace-table-wrap').forEach((el) => {
    el.style.width = '100%';
  });

  clonedRoot.querySelectorAll<HTMLElement>('.el-table__header table, .el-table__body table').forEach((table) => {
    table.style.width = '100%';
    table.style.tableLayout = 'fixed';
  });

  clonedRoot.querySelectorAll<HTMLElement>('.el-table__header, .el-table__body').forEach((table) => {
    table.style.width = '100%';
  });

  clonedRoot.querySelectorAll<HTMLElement>('.trace-status-tag').forEach(applyStatusTagStyles);
}

async function captureTraceScreenshot(root: HTMLElement, sfc?: string) {
  const safeSfc = (sfc || 'trace').replace(/[\\/:*?"<>|]/g, '_').slice(0, 80);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  await captureReadResultScreenshot({
    root,
    fileName: `产品追溯_${safeSfc}_${stamp}.png`,
    scale: 2,
    onclone: prepareTraceClone
  });
}

const handleCapture = async () => {
  if (!captureRef.value || !canCapture.value) {
    ElMessage.warning('暂无可截图数据');
    return;
  }

  capturing.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 80));
    await captureTraceScreenshot(captureRef.value, queryParams.sfc.trim());
    ElMessage.success('截图已保存');
  } catch (error) {
    console.error(error);
    ElMessage.error('截图失败');
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

  :deep(.el-divider__text.is-left) {
    left: 0;
    padding-left: 0;
  }

  .trace-descriptions {
    :deep(.el-descriptions__content) {
      word-break: break-all;
    }
  }

  .trace-steps {
    /*    margin: 12px 0 20px;*/
  }

  .trace-toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-bottom: 12px;
    padding: 8px 12px;
  }

  .trace-timeline {
    margin-top: 8px;

    :deep(.el-timeline) {
      padding-left: 0;
    }

    :deep(.el-timeline-item__wrapper) {
      padding-left: 20px;
    }

    :deep(.el-timeline-item__node) {
      background: var(--el-color-primary);
      border-color: var(--el-color-primary);
    }

    :deep(.el-timeline-item__node.is-hollow) {
      background: var(--el-color-white);
    }
  }

  .trace-operation-timeline {
    :deep(.el-timeline-item__wrapper) {
      padding-left: 0;
    }

    :deep(.el-timeline-item__tail) {
      left: -30px;
    }

    :deep(.el-timeline-item__node) {
      left: -36px;
    }

    :deep(.el-divider__text.is-left) {
      left: 20px;
      padding-left: 20px;
    }
  }

  /*
  .trace-operation-block {
    padding: 14px 16px 16px;
    border-radius: 10px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-light);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  }
  */

  .trace-operation-title {
    /*   display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 6px;*/
    color: var(--el-color-primary);
    /*    background: var(--el-color-primary-light-9);*/
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
