<template>
  <div class="p-2 material-exception-page">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" inline label-width="auto">
            <el-form-item label="流程单号" prop="flowNumber">
              <el-input v-model="queryParams.flowNumber" clearable placeholder="请输入流程单号" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="检验单号" prop="inspectionNumber">
              <el-input v-model="queryParams.inspectionNumber" clearable placeholder="请输入检验单号" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="采购单号" prop="purchaseOrder">
              <el-input v-model="queryParams.purchaseOrder" clearable placeholder="请输入采购单号" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="供应商" prop="supplierName">
              <el-input v-model="queryParams.supplierName" clearable placeholder="名称或关键字" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料" prop="materialNumber">
              <el-input v-model="queryParams.materialNumber" clearable placeholder="请输入物料编码" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="发生日期">
              <el-date-picker v-model="occurrenceDateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" />
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

      <el-table v-loading="loading" :data="materialExceptionList" border stripe>
        <el-table-column label="流程单号" prop="flowNumber" fixed="left" min-width="185" show-overflow-tooltip>
          <template #default="{ row }">
            <el-button v-hasPermi="['qms:materialException:query']" link type="primary" @click="handleDetail(row)">
              {{ display(row.flowNumber) }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="检验单号" prop="inspectionNumber" min-width="155" show-overflow-tooltip />
        <el-table-column label="发生地点" prop="occurrenceLocation" width="115" show-overflow-tooltip />
        <el-table-column label="OEM工厂代码" prop="oemFactoryCode" width="125" show-overflow-tooltip />
        <el-table-column label="OEM工厂名称" prop="oemFactoryName" min-width="170" show-overflow-tooltip />
        <el-table-column label="采购单号" prop="purchaseOrder" min-width="145" show-overflow-tooltip />
        <el-table-column label="批号" prop="batchNumber" width="125" show-overflow-tooltip />
        <el-table-column label="供应商名称" prop="supplierName" min-width="150" show-overflow-tooltip />
        <el-table-column label="供应商代码" prop="supplierCode" width="115" show-overflow-tooltip />
        <el-table-column label="物料编码" prop="materialNumber" width="120" show-overflow-tooltip />
        <el-table-column label="物料名称" prop="materialName" min-width="145" show-overflow-tooltip />
        <el-table-column label="规格型号" prop="specModel" min-width="130" show-overflow-tooltip />
        <el-table-column label="发生日期" prop="occurrenceDate" width="115" sortable />
        <el-table-column label="抽检数量" prop="sampleQty" width="100" align="right" />
        <el-table-column label="不合格数量" prop="unqualifiedQty" width="110" align="right" />
        <el-table-column label="不合格率" prop="unqualifiedRate" width="100" align="right">
          <template #default="{ row }">{{ formatRate(row.unqualifiedRate) }}</template>
        </el-table-column>
        <el-table-column label="缺陷类别" prop="defectCategory" width="110" show-overflow-tooltip />
        <el-table-column label="不良现象" prop="failPhenomenon" min-width="170" show-overflow-tooltip />
        <el-table-column label="8D报告" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.eightDReportId" type="success" effect="plain">已归档</el-tag>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="推送状态" prop="pushStatus" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="pushStatusMeta(row.pushStatus).type">{{ pushStatusMeta(row.pushStatus).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="结束时间" prop="endTime" width="170" />
        <el-table-column label="操作" fixed="right" width="90" align="center">
          <template #default="{ row }">
            <el-button v-hasPermi="['qms:materialException:query']" link type="primary" @click="handleDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-drawer v-model="detailVisible" title="物料异常详情" size="88%" destroy-on-close class="material-detail-drawer">
      <div v-loading="detailLoading" class="detail-content">
        <template v-if="detail.id">
          <section class="detail-section">
            <div class="section-title">基础信息</div>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="流程单号">{{ display(detail.flowNumber) }}</el-descriptions-item>
              <el-descriptions-item label="检验单号">{{ display(detail.inspectionNumber) }}</el-descriptions-item>
              <el-descriptions-item label="发生地点">{{ display(detail.occurrenceLocation) }}</el-descriptions-item>
              <el-descriptions-item label="OEM工厂">{{ joinCodeName(detail.oemFactoryCode, detail.oemFactoryName) }}</el-descriptions-item>
              <el-descriptions-item label="采购单号">{{ display(detail.purchaseOrder) }}</el-descriptions-item>
              <el-descriptions-item label="批号">{{ display(detail.batchNumber) }}</el-descriptions-item>
              <el-descriptions-item label="供应商">{{ joinCodeName(detail.supplierCode, detail.supplierName) }}</el-descriptions-item>
              <el-descriptions-item label="发生日期">{{ display(detail.occurrenceDate) }}</el-descriptions-item>
              <el-descriptions-item label="物料">{{ joinCodeName(detail.materialNumber, detail.materialName) }}</el-descriptions-item>
              <el-descriptions-item label="规格型号">{{ display(detail.specModel) }}</el-descriptions-item>
              <el-descriptions-item label="结束时间">{{ display(detail.endTime) }}</el-descriptions-item>
            </el-descriptions>
          </section>

          <section class="detail-section">
            <div class="section-title">异常信息</div>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="抽检数量">{{ display(detail.sampleQty) }}</el-descriptions-item>
              <el-descriptions-item label="不合格数量">{{ display(detail.unqualifiedQty) }}</el-descriptions-item>
              <el-descriptions-item label="不合格率">{{ formatRate(detail.unqualifiedRate) }}</el-descriptions-item>
              <el-descriptions-item label="缺陷类别">{{ display(detail.defectCategory) }}</el-descriptions-item>
              <el-descriptions-item label="不良现象" :span="2">{{ display(detail.failPhenomenon) }}</el-descriptions-item>
              <el-descriptions-item label="验证说明" :span="3">{{ display(detail.verificationRemarks) }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="3">{{ display(detail.remark) }}</el-descriptions-item>
            </el-descriptions>
          </section>

          <section class="detail-section">
            <div class="section-title">附件与供应商回复 8D</div>
            <div class="file-block">
              <span class="file-label">异常附件</span>
              <div v-if="detail.attachments?.length" class="file-list">
                <div v-for="file in detail.attachments" :key="file.ossId" class="file-item">
                  <QmsFileTypeIcon :file-name="file.originalName || file.fileName" />
                  <el-link type="primary" :underline="false" @click="previewFile(file)">{{ file.originalName || file.fileName }}</el-link>
                  <el-button link type="primary" icon="Download" @click="downloadFile(file)">下载</el-button>
                </div>
              </div>
              <span v-else class="empty-text">暂无附件</span>
            </div>
            <div class="file-block">
              <span class="file-label">8D报告</span>
              <div v-if="detail.eightDReport" class="file-list">
                <div class="file-item">
                  <QmsFileTypeIcon :file-name="detail.eightDReport.originalName || detail.eightDReport.fileName" />
                  <el-link type="primary" :underline="false" @click="previewFile(detail.eightDReport)">
                    {{ detail.eightDReport.originalName || detail.eightDReport.fileName }}
                  </el-link>
                  <el-button link type="primary" icon="Download" @click="downloadFile(detail.eightDReport)">下载</el-button>
                </div>
              </div>
              <span v-else class="empty-text">暂无8D报告</span>
            </div>
          </section>

          <section class="detail-section">
            <div class="section-title">归档推送</div>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="推送状态">
                <el-tag :type="pushStatusMeta(detail.pushStatus).type">{{ pushStatusMeta(detail.pushStatus).label }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="推送时间">{{ display(detail.pushTime) }}</el-descriptions-item>
              <el-descriptions-item label="归档时间">{{ display(detail.createTime) }}</el-descriptions-item>
              <el-descriptions-item label="推送响应" :span="3">
                <pre class="push-message">{{ display(detail.pushMessage) }}</pre>
              </el-descriptions-item>
            </el-descriptions>
          </section>
        </template>
      </div>
    </el-drawer>

    <OssFilePreview ref="ossPreviewRef" />
  </div>
</template>

<script setup name="QmsMaterialException" lang="ts">
import OssFilePreview from '@/components/OssFilePreview/index.vue';
import QmsFileTypeIcon from '@/components/QmsFileTypeIcon/index.vue';
import { getMaterialException, listMaterialException } from '@/api/qms/materialException';
import type { QmsMaterialExceptionFile, QmsMaterialExceptionQuery, QmsMaterialExceptionVO } from '@/api/qms/materialException/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const pushStatusOptions = [
  { value: '0', label: '待推送', type: 'info' },
  { value: '1', label: '成功', type: 'success' },
  { value: '2', label: '失败', type: 'danger' }
] as const;

const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const materialExceptionList = ref<QmsMaterialExceptionVO[]>([]);
const queryFormRef = ref<ElFormInstance>();
const occurrenceDateRange = ref<[DateModelType, DateModelType]>(['', '']);
const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<QmsMaterialExceptionVO>({ id: '' });
const ossPreviewRef = ref<InstanceType<typeof OssFilePreview>>();

const queryParams = ref<QmsMaterialExceptionQuery>({
  pageNum: 1,
  pageSize: 20,
  flowNumber: undefined,
  inspectionNumber: undefined,
  purchaseOrder: undefined,
  supplierName: undefined,
  materialNumber: undefined,
  pushStatus: undefined
});

const display = (value: unknown) => (value === null || value === undefined || value === '' ? '—' : String(value));

const joinCodeName = (code?: string, name?: string) => {
  if (code && name) return `${code} / ${name}`;
  return display(code || name);
};

const formatRate = (value?: number) => {
  if (value === null || value === undefined || value === ('' as unknown as number)) return '—';
  const rate = Number(value);
  if (Number.isNaN(rate)) return display(value);
  return `${(Math.abs(rate) <= 1 ? rate * 100 : rate).toFixed(2)}%`;
};

const pushStatusMeta = (value?: string) => {
  const item = pushStatusOptions.find((option) => option.value === value);
  return item || { label: '未知', type: 'warning' as const };
};

const getList = async () => {
  loading.value = true;
  try {
    const params = proxy?.addDateRange(queryParams.value, occurrenceDateRange.value, 'OccurrenceDate') as QmsMaterialExceptionQuery;
    const response = await listMaterialException(params);
    materialExceptionList.value = response.rows || [];
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
  occurrenceDateRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleDetail = async (row: QmsMaterialExceptionVO) => {
  detailVisible.value = true;
  detailLoading.value = true;
  detail.value = { id: '' };
  try {
    const response = await getMaterialException(row.id);
    detail.value = response.data;
  } finally {
    detailLoading.value = false;
  }
};

const previewFile = (file: QmsMaterialExceptionFile) => {
  if (!file.ossId) {
    proxy?.$modal.msgWarning('文件不可用');
    return;
  }
  ossPreviewRef.value?.open(file, detail.value.attachments);
};

const downloadFile = (file: QmsMaterialExceptionFile) => {
  proxy?.$download.oss(file.ossId);
};

onMounted(getList);
</script>

<style scoped lang="scss">
.material-exception-page :deep(.el-table th.el-table__cell) {
  color: #4b5d73;
  background: #f6f8fb;
}

.detail-content {
  min-height: 240px;
  padding: 0 4px 24px;
}

.detail-section + .detail-section {
  margin-top: 24px;
}

.section-title {
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid var(--el-color-primary);
  font-size: 15px;
  font-weight: 600;
  color: #26384d;
}

.file-block {
  display: flex;
  align-items: flex-start;
  min-height: 54px;
  padding: 12px 16px;
  border: 1px solid #e6ebf2;
  background: #fafbfd;
}

.file-block + .file-block {
  border-top: 0;
}

.file-label {
  width: 100px;
  flex: 0 0 100px;
  line-height: 30px;
  color: #606f82;
}

.file-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
}

.empty-text {
  line-height: 30px;
  color: #a1a9b4;
}

.push-message {
  max-height: 150px;
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: inherit;
}

@media (max-width: 900px) {
  .file-block {
    flex-direction: column;
  }

  .file-label {
    width: auto;
  }
}
</style>
