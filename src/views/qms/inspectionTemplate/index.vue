<template>
  <div class="p-2 inspection-template-page">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" inline label-width="auto">
            <el-form-item label="模板名称" prop="templateName">
              <el-input v-model="queryParams.templateName" clearable placeholder="请输入模板名称" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工厂代码" prop="factoryCode">
              <el-input v-model="queryParams.factoryCode" clearable placeholder="请输入工厂代码" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="匹配类型" prop="matchType">
              <el-select v-model="queryParams.matchType" clearable placeholder="全部" style="width: 150px">
                <el-option label="物料编号" value="MATERIAL_NUMBER" />
                <el-option label="物料类别" value="MATERIAL_TYPE" />
              </el-select>
            </el-form-item>
            <el-form-item label="物料编号" prop="materialNumber">
              <el-input v-model="queryParams.materialNumber" clearable placeholder="请输入物料编号" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="是否免检" prop="exemptFlag">
              <el-select v-model="queryParams.exemptFlag" clearable placeholder="全部" style="width: 110px">
                <el-option label="是" value="1" />
                <el-option label="否" value="0" />
              </el-select>
            </el-form-item>
            <el-form-item label="使用规则" prop="useRule">
              <el-select v-model="queryParams.useRule" clearable placeholder="全部" style="width: 110px">
                <el-option label="是" value="1" />
                <el-option label="否" value="0" />
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

      <el-table v-loading="loading" :data="templateList" border stripe>
        <el-table-column label="模板名称" prop="templateName" fixed="left" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <el-button v-hasPermi="['qms:inspectionTemplate:query']" link type="primary" @click="handleDetail(row)">
              {{ display(row.templateName) }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="工厂代码" prop="factoryCode" width="100" />
        <el-table-column label="匹配类型" prop="matchType" width="120">
          <template #default="{ row }">{{ matchTypeName(row.matchType) }}</template>
        </el-table-column>
        <el-table-column label="物料编号" prop="materialNumber" min-width="135" show-overflow-tooltip />
        <el-table-column label="细分物料编号" prop="subdivisionMaterialNumbers" min-width="145" show-overflow-tooltip />
        <el-table-column label="物料类别" prop="materialType" min-width="130" show-overflow-tooltip />
        <el-table-column label="是否免检" width="100" align="center">
          <template #default="{ row }">{{ yesNoName(row.exemptFlag, row.exemptFlagName) }}</template>
        </el-table-column>
        <el-table-column label="使用规则" width="100" align="center">
          <template #default="{ row }">{{ yesNoName(row.useRule, row.useRuleName) }}</template>
        </el-table-column>
        <el-table-column label="通知人员" prop="notifyUserNames" min-width="130" show-overflow-tooltip />
        <el-table-column label="表单编号" prop="formNumber" min-width="130" show-overflow-tooltip />
        <el-table-column label="创建时间" prop="creationTime" width="170" sortable />
        <el-table-column label="创建人" prop="creatorName" width="110" show-overflow-tooltip />
        <el-table-column label="版本号" prop="versionNumber" width="90" align="center" />
        <el-table-column label="操作" fixed="right" width="90" align="center">
          <template #default="{ row }">
            <el-button v-hasPermi="['qms:inspectionTemplate:query']" link type="primary" @click="handleDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-drawer v-model="detailVisible" title="检验模板详情" size="92%" destroy-on-close>
      <div v-loading="detailLoading" class="detail-content">
        <template v-if="detail.template">
          <section class="detail-section">
            <div class="section-title">基本信息</div>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="模板名称">{{ display(detail.template.templateName) }}</el-descriptions-item>
              <el-descriptions-item label="工厂代码">{{ display(detail.template.factoryCode) }}</el-descriptions-item>
              <el-descriptions-item label="匹配类型">{{ matchTypeName(detail.template.matchType) }}</el-descriptions-item>
              <el-descriptions-item label="物料编号">{{ display(detail.template.materialNumber) }}</el-descriptions-item>
              <el-descriptions-item label="物料名称">{{ display(detail.template.materialName) }}</el-descriptions-item>
              <el-descriptions-item label="物料类别">{{ display(detail.template.materialType) }}</el-descriptions-item>
              <el-descriptions-item label="是否免检">{{ yesNoName(detail.template.exemptFlag) }}</el-descriptions-item>
              <el-descriptions-item label="使用规则">{{ yesNoName(detail.template.useRule) }}</el-descriptions-item>
              <el-descriptions-item label="表单编号">{{ display(detail.template.formNumber) }}</el-descriptions-item>
              <el-descriptions-item label="通知人员">{{ display(detail.template.notifyUserNames || detail.template.notifyUserIds) }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ display(detail.template.creationTime) }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ display(detail.template.updateTime) }}</el-descriptions-item>
            </el-descriptions>

            <p class="attachment-hint">以下为 QMS 侧文件 ID，未存 WMS 附件库，不可在本系统预览。</p>
            <div class="attachment-grid">
              <VendorFileIds label="尺寸标准" :value="detail.template.dimensionStandardFileId" />
              <VendorFileIds label="检验标准" :value="detail.template.inspectionStandardFileIds" />
              <VendorFileIds label="图纸" :value="detail.template.drawingFileIds" />
              <VendorFileIds label="样品承认书" :value="detail.template.approvalFileIds" />
              <VendorFileIds label="样品图片" :value="detail.template.samplePhotoIds" />
            </div>
          </section>

          <section v-if="detail.ruleList?.length" class="detail-section">
            <div class="section-title">转换规则</div>
            <el-table :data="detail.ruleList" border>
              <el-table-column label="序号" prop="serialNumber" width="70" align="center" />
              <el-table-column label="规则名称" prop="conversionRuleName" min-width="140" />
              <el-table-column label="检验程度" min-width="160">
                <template #default="{ row }">{{ degreeName(row.inspectionDegreeSource) }} → {{ degreeName(row.inspectionDegreeTarget) }}</template>
              </el-table-column>
              <el-table-column label="条件" min-width="220">
                <template #default="{ row }">
                  连续 {{ display(row.lastHowManyBatch) }} 批中有 {{ display(row.conditionalHowManyBatch) }} 批
                  {{ conditionName(row.conditional) }}
                </template>
              </el-table-column>
            </el-table>
          </section>

          <section class="detail-section">
            <div class="section-title">检验项目</div>
            <el-table :data="detail.itemList || []" border>
              <el-table-column label="序号" prop="serialNumber" width="70" align="center" />
              <el-table-column label="检验类型" prop="inspectionType" min-width="100" show-overflow-tooltip />
              <el-table-column label="检验项目" prop="inspectionItem" min-width="150" show-overflow-tooltip />
              <el-table-column label="检验要求" prop="inspectionRequirement" min-width="220" show-overflow-tooltip />
              <el-table-column label="检验方法/工具" prop="inspectionMethod" min-width="160" show-overflow-tooltip />
              <el-table-column label="检验周期" width="105">
                <template #default="{ row }">{{ cycleName(row.inspectionCycle) }}</template>
              </el-table-column>
              <el-table-column label="抽样类型" width="145">
                <template #default="{ row }">{{ samplingPlanName(row.samplingPlan) }}</template>
              </el-table-column>
              <el-table-column label="AQL等级" prop="aqlLevel" width="100" />
              <el-table-column label="检查水平" prop="inspectionLevel" width="100" />
              <el-table-column label="抽样数量" prop="sampleQty" width="100" align="right" />
              <el-table-column label="合格标准" prop="ac" width="100" align="right" />
            </el-table>
          </section>

          <section class="detail-section">
            <div class="section-title">变更记录</div>
            <el-table :data="detail.changeRecordList || []" border>
              <el-table-column label="版本号" prop="versionNumber" width="90" align="center" />
              <el-table-column label="变更说明" prop="changeDescription" min-width="220" show-overflow-tooltip />
              <el-table-column label="变更日期" prop="changeDate" width="120" />
              <el-table-column label="发布时间" prop="releaseTime" width="170" />
              <el-table-column label="变更人" prop="changeUserName" width="120" />
              <el-table-column label="备注" prop="remark" min-width="160" show-overflow-tooltip />
              <el-table-column label="当前版本" width="100" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.currentLatestVersion === '1'" type="success">是</el-tag>
                  <span v-else>否</span>
                </template>
              </el-table-column>
            </el-table>
          </section>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup name="QmsInspectionTemplate" lang="ts">
import { defineComponent, h } from 'vue';
import { ElTag } from 'element-plus';
import QmsFileTypeIcon from '@/components/QmsFileTypeIcon/index.vue';
import { getInspectionTemplate, listInspectionTemplate } from '@/api/qms/inspectionTemplate';
import type { QmsInspectionTemplateDetail, QmsInspectionTemplateListItem, QmsInspectionTemplateQuery } from '@/api/qms/inspectionTemplate/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const templateList = ref<QmsInspectionTemplateListItem[]>([]);
const queryFormRef = ref<ElFormInstance>();
const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<QmsInspectionTemplateDetail>({});

const queryParams = ref<QmsInspectionTemplateQuery>({
  pageNum: 1,
  pageSize: 10,
  templateName: undefined,
  factoryCode: undefined,
  matchType: undefined,
  materialNumber: undefined,
  exemptFlag: undefined,
  useRule: undefined
});

const display = (value: unknown) => (value === null || value === undefined || value === '' ? '—' : String(value));
const yesNoName = (value?: string, name?: string) => name || (value === '1' ? '是' : value === '0' ? '否' : '—');
const matchTypeName = (value?: string) => ({ MATERIAL_NUMBER: '物料编号', MATERIAL_TYPE: '物料类别' })[value || ''] || display(value);
const degreeName = (value?: string) => ({ '1': '正常', '2': '加严', '3': '放宽' })[value || ''] || display(value);
const conditionName = (value?: string) => ({ '1': '合格', '2': '不合格' })[value || ''] || display(value);
const cycleName = (value?: string) => ({ '1': '每批', '7': '每五批' })[value || ''] || display(value);
const samplingPlanName = (value?: string) => ({ '1': 'AQL（GB/T2828.1）', '2': '固定数量', '8': '固定比例', '9': '全检' })[value || ''] || display(value);

const VendorFileIds = defineComponent({
  props: { label: { type: String, required: true }, value: { type: String, default: '' } },
  setup(props) {
    return () => h('div', { class: 'attachment-item' }, [h('span', { class: 'attachment-label' }, props.label), h('div', { class: 'attachment-values' }, props.value ? props.value.split(',').map((id) => h('span', { key: id, class: 'vendor-file-chip' }, [h(QmsFileTypeIcon, { kind: 'other' }), h(ElTag, { effect: 'plain', size: 'small' }, () => id.trim())])) : [h('span', { class: 'empty-text' }, '暂无附件')])]);
  }
});

const getList = async () => {
  loading.value = true;
  try {
    const response = await listInspectionTemplate(queryParams.value);
    templateList.value = response.rows || [];
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
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleDetail = async (row: QmsInspectionTemplateListItem) => {
  detailVisible.value = true;
  detailLoading.value = true;
  detail.value = {};
  try {
    const response = await getInspectionTemplate(row.id);
    detail.value = response.data || {};
  } finally {
    detailLoading.value = false;
  }
};

onMounted(getList);
</script>

<style scoped lang="scss">
.inspection-template-page :deep(.el-table th.el-table__cell) {
  color: #4b5d73;
  background: #f6f8fb;
}

.detail-content {
  min-height: 260px;
  padding: 0 4px 28px;
}

.detail-section + .detail-section {
  margin-top: 24px;
}

.section-title {
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid var(--el-color-primary);
  color: #26384d;
  font-size: 15px;
  font-weight: 600;
}

.attachment-hint {
  margin: 12px 0 0;
  color: #909399;
  font-size: 13px;
}

.attachment-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 8px;
  border-top: 1px solid #ebeef5;
  border-left: 1px solid #ebeef5;
}

.attachment-item {
  display: flex;
  min-height: 58px;
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
}

.attachment-label {
  width: 105px;
  flex: 0 0 105px;
  padding: 18px 12px;
  background: #f5f7fa;
  color: #606266;
}

.attachment-values {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 12px;
}

.vendor-file-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.empty-text {
  color: #a8abb2;
}

@media (max-width: 1100px) {
  .attachment-grid {
    grid-template-columns: 1fr;
  }
}
</style>
