<template>
  <div class="p-2 iqc-documents-page">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" inline label-width="auto">
            <el-form-item label="检验单号" prop="inspectionNumber">
              <el-input v-model="queryParams.inspectionNumber" clearable placeholder="请输入检验单号" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料编码" prop="materialNumber">
              <el-input v-model="queryParams.materialNumber" clearable placeholder="请输入物料编码" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="供应商" prop="supplierName">
              <el-input v-model="queryParams.supplierName" clearable placeholder="名称或关键字" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="IQC结果" prop="iqcResult">
              <el-input v-model="queryParams.iqcResult" clearable placeholder="判定结果" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="检验时间">
              <el-date-picker v-model="inspectionTimeRange" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" range-separator="-" start-placeholder="开始" end-placeholder="结束" />
            </el-form-item>
            <el-form-item label="推送状态" prop="pushStatus">
              <el-select v-model="queryParams.pushStatus" clearable placeholder="全部" style="width: 130px">
                <el-option v-for="item in pushStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" :data="documentList" border stripe>
        <el-table-column label="检验单号" prop="inspectionNumber" fixed="left" min-width="155" show-overflow-tooltip>
          <template #default="{ row }">
            <el-button v-hasPermi="['qms:iqcDocument:query']" link type="primary" @click="handleDetail(row)">
              {{ display(row.inspectionNumber) }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="物料编码" prop="materialNumber" min-width="130" show-overflow-tooltip />
        <el-table-column label="物料名称" prop="materialName" min-width="160" show-overflow-tooltip />
        <el-table-column label="供应商" prop="supplierName" min-width="150" show-overflow-tooltip />
        <el-table-column label="来料数量" prop="incomingQty" min-width="100" align="right" />
        <el-table-column label="检验时间" prop="inspectionTime" min-width="170" />
        <el-table-column label="IQC判定" prop="iqcResult" min-width="100" show-overflow-tooltip />
        <el-table-column label="抽样数量" prop="sampleQty" min-width="100" align="right" />
        <el-table-column label="OEM工厂" prop="oemFactoryName" min-width="150" show-overflow-tooltip />
        <el-table-column label="来源唯一键" prop="sourceUniqueKey" min-width="140" show-overflow-tooltip />
        <el-table-column label="推送状态" prop="pushStatus" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="pushStatusMeta(row.pushStatus).type">{{ pushStatusMeta(row.pushStatus).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="90" align="center">
          <template #default="{ row }">
            <el-button v-hasPermi="['qms:iqcDocument:query']" link type="primary" @click="handleDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-drawer v-model="detailVisible" title="检验单据详情" size="92%" destroy-on-close class="iqc-detail-drawer">
      <div v-loading="detailLoading" class="detail-content">
        <template v-if="detail.id">
          <section class="detail-section">
            <div class="section-title">基本信息</div>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="检验单号">{{ display(detail.inspectionNumber) }}</el-descriptions-item>
              <el-descriptions-item label="供应商编码">{{ display(detail.supplierCode) }}</el-descriptions-item>
              <el-descriptions-item label="供应商名称">{{ display(detail.supplierName) }}</el-descriptions-item>
              <el-descriptions-item label="物料编码">{{ display(detail.materialNumber) }}</el-descriptions-item>
              <el-descriptions-item label="物料名称" :span="2">{{ display(detail.materialName) }}</el-descriptions-item>
              <el-descriptions-item label="来料数量">{{ display(detail.incomingQty) }}</el-descriptions-item>
              <el-descriptions-item label="检验时间">{{ display(detail.inspectionTime) }}</el-descriptions-item>
              <el-descriptions-item label="IQC判定">{{ display(detail.iqcResult) }}</el-descriptions-item>
              <el-descriptions-item label="免检标识">{{ display(detail.exemptFlag) }}</el-descriptions-item>
              <el-descriptions-item label="抽样数量">{{ display(detail.sampleQty) }}</el-descriptions-item>
              <el-descriptions-item label="合格抽样">{{ display(detail.qualifiedSampleQty) }}</el-descriptions-item>
              <el-descriptions-item label="不合格抽样">{{ display(detail.unqualifiedSampleQty) }}</el-descriptions-item>
              <el-descriptions-item label="OEM工厂">{{ joinCodeName(detail.oemFactoryCode, detail.oemFactoryName) }}</el-descriptions-item>
              <el-descriptions-item label="数据来源">{{ display(detail.dataSource) }}</el-descriptions-item>
              <el-descriptions-item label="来源单据号">{{ display(detail.sourceBillNo) }}</el-descriptions-item>
              <el-descriptions-item label="来源唯一键">{{ display(detail.sourceUniqueKey) }}</el-descriptions-item>
            </el-descriptions>
          </section>

          <section class="detail-section">
            <el-tabs v-model="activeTab" class="detail-tabs">
              <el-tab-pane label="检验报告" name="regular">
                <el-table :data="detail.regularItems || []" border stripe empty-text="暂无定性检验明细">
                  <el-table-column label="序号" prop="serialNumber" width="70" align="center" />
                  <el-table-column label="检验项目" prop="inspectionItem" min-width="140" show-overflow-tooltip />
                  <el-table-column label="检验类型" prop="inspectionType" width="110" show-overflow-tooltip />
                  <el-table-column label="检验结果" prop="inspectionResult" width="100" />
                  <el-table-column label="检验数量" prop="inspectionQty" width="100" align="right" />
                  <el-table-column label="不合格数量" prop="unqualifiedQty" width="110" align="right" />
                </el-table>
              </el-tab-pane>
              <el-tab-pane label="关键尺寸" name="dim">
                <el-table :data="detail.dimItems || []" border stripe empty-text="暂无定量检验明细">
                  <el-table-column label="序号" prop="serialNumber" width="70" align="center" fixed="left" />
                  <el-table-column label="测量项目" prop="measureItem" min-width="120" show-overflow-tooltip />
                  <el-table-column label="标准值" prop="standardValue" width="100" />
                  <el-table-column label="上限" prop="upperLimit" width="90" />
                  <el-table-column label="下限" prop="lowerLimit" width="90" />
                  <el-table-column label="关键尺寸" prop="criticalFlag" width="90" />
                  <el-table-column v-for="col in measureColumnLabels" :key="col.key" :label="col.label" min-width="100" align="center">
                    <template #default="{ row }">{{ measureCell(row, col.index) }}</template>
                  </el-table-column>
                  <el-table-column label="检验结果" prop="inspectionResult" width="100" fixed="right" />
                </el-table>
              </el-tab-pane>
              <el-tab-pane label="归档推送" name="push">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="推送状态">
                    <el-tag :type="pushStatusMeta(detail.pushStatus).type">{{ pushStatusMeta(detail.pushStatus).label }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="推送时间">{{ display(detail.pushTime) }}</el-descriptions-item>
                  <el-descriptions-item label="归档时间">{{ display(detail.createTime) }}</el-descriptions-item>
                  <el-descriptions-item label="单据阶段">{{ display(detail.docPhase) }}</el-descriptions-item>
                  <el-descriptions-item label="推送说明" :span="2">
                    <pre class="push-message">{{ display(detail.pushMessage) }}</pre>
                  </el-descriptions-item>
                </el-descriptions>
              </el-tab-pane>
              <el-tab-pane label="评审过程" name="review" disabled />
              <el-tab-pane label="物料图纸" name="drawing" disabled />
              <el-tab-pane label="检验标准" name="standard" disabled />
              <el-tab-pane label="样品确认书" name="sample" disabled />
              <el-tab-pane label="样品图片" name="photo" disabled />
              <el-tab-pane label="以往异常记录" name="exception" disabled />
            </el-tabs>
            <p class="tab-hint">带灰色标签页为 QMS 原系统能力，WMS 仅展示 Excel 导入落库的检验报告与关键尺寸。</p>
          </section>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup name="QmsIqcDocuments" lang="ts">
import { getIqcDocument, listIqcDocument } from '@/api/qms/iqcDocument';
import type { QmsIqcDocumentDetailVO, QmsIqcDocumentDimVO, QmsIqcDocumentQuery, QmsIqcDocumentVO } from '@/api/qms/iqcDocument/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const pushStatusOptions = [
  { value: '0', label: '待推送', type: 'info' },
  { value: '1', label: '成功', type: 'success' },
  { value: '2', label: '失败', type: 'danger' }
] as const;

const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const documentList = ref<QmsIqcDocumentVO[]>([]);
const queryFormRef = ref<ElFormInstance>();
const inspectionTimeRange = ref<[DateModelType, DateModelType]>(['', '']);
const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<QmsIqcDocumentDetailVO>({ id: '' });
const activeTab = ref('regular');

const queryParams = ref<QmsIqcDocumentQuery>({
  pageNum: 1,
  pageSize: 20,
  docPhase: 'COMPLETED',
  inspectionNumber: undefined,
  materialNumber: undefined,
  supplierName: undefined,
  iqcResult: undefined,
  pushStatus: undefined
});

const display = (value: unknown) => (value === null || value === undefined || value === '' ? '—' : String(value));

const joinCodeName = (code?: string, name?: string) => {
  if (code && name) return `${code} / ${name}`;
  return display(code || name);
};

const pushStatusMeta = (value?: string) => {
  const item = pushStatusOptions.find((option) => option.value === value);
  return item || { label: '未知', type: 'warning' as const };
};

const measureColumnLabels = computed(() => {
  const dims = detail.value.dimItems || [];
  let max = 0;
  for (const dim of dims) {
    max = Math.max(max, dim.measurements?.length || 0);
  }
  if (max === 0) {
    return [];
  }
  return Array.from({ length: max }, (_, index) => {
    const sample = dims.find((d) => d.measurements && d.measurements.length > index);
    const label = sample?.measurements?.[index]?.label;
    return {
      key: `m-${index}`,
      index,
      label: label?.trim() ? label : `尺寸${index + 1}`
    };
  });
});

const measureCell = (row: QmsIqcDocumentDimVO, index: number) => {
  const item = row.measurements?.[index];
  if (!item) {
    return '—';
  }
  return display(item.measureValue);
};

const getList = async () => {
  loading.value = true;
  try {
    const params = proxy?.addDateRange(queryParams.value, inspectionTimeRange.value, 'InspectionTime') as QmsIqcDocumentQuery;
    const response = await listIqcDocument(params);
    documentList.value = response.rows || [];
    total.value = response.total || 0;
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  inspectionTimeRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  queryParams.value.docPhase = 'COMPLETED';
  handleQuery();
};

const handleDetail = async (row: QmsIqcDocumentVO) => {
  detailVisible.value = true;
  detailLoading.value = true;
  activeTab.value = 'regular';
  detail.value = { id: '' };
  try {
    const response = await getIqcDocument(row.id);
    detail.value = response.data;
  } finally {
    detailLoading.value = false;
  }
};

onMounted(getList);
</script>

<style scoped lang="scss">
.iqc-documents-page :deep(.el-table th.el-table__cell) {
  color: #4b5d73;
  background: #f6f8fb;
}

.detail-content {
  min-height: 240px;
  padding: 0 4px 24px;
}

.detail-section + .detail-section {
  margin-top: 20px;
}

.section-title {
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid var(--el-color-primary);
  font-size: 15px;
  font-weight: 600;
  color: #26384d;
}

.detail-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}

.tab-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.push-message {
  max-height: 120px;
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: inherit;
}
</style>
