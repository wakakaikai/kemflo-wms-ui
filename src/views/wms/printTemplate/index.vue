<template>
  <div class="template-library app-container">
    <header class="library-header">
      <div class="header-copy">
        <span class="section-kicker">WMS PRINT STUDIO</span>
        <h1>打印模板库</h1>
        <p>统一设计标签、单据与连续纸版式，业务字段和样例数据由后台模板编码驱动。</p>
      </div>
      <div class="header-metrics">
        <div>
          <strong>{{ total }}</strong>
          <span>模板总数</span>
        </div>
        <i />
        <div>
          <strong>mm</strong>
          <span>毫米级画布</span>
        </div>
        <el-button type="primary" size="large" @click="openCreate">
          <el-icon><Plus /></el-icon>
          新建模板
        </el-button>
      </div>
    </header>

    <section class="filter-bar">
      <el-input v-model="keyword" clearable placeholder="搜索模板名称或编码" class="search-input" @keyup.enter="handleSearch" @clear="handleSearch">
        <template #prefix
          ><el-icon><Search /></el-icon
        ></template>
      </el-input>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="resetSearch"
        ><el-icon><Refresh /></el-icon>重置</el-button
      >
      <span class="filter-spacer" />
      <el-radio-group v-model="viewMode" class="view-switch">
        <el-radio-button value="card"
          ><el-icon><Grid /></el-icon><span>卡片</span></el-radio-button
        >
        <el-radio-button value="table"
          ><el-icon><List /></el-icon><span>列表</span></el-radio-button
        >
      </el-radio-group>
    </section>

    <main v-loading="loading" class="library-content">
      <template v-if="viewMode === 'card'">
        <div v-if="rows.length" class="template-grid">
          <article v-for="row in rows" :key="row.id || row.templateCode" class="template-card">
            <button type="button" class="preview-cover" @click="design(row)">
              <PrintTemplateThumb :row="row" />
              <span class="design-entry">
                <el-icon><EditPen /></el-icon>
                打开设计器
              </span>
            </button>
            <div class="card-content">
              <div class="card-heading">
                <div>
                  <h2 :title="row.templateName || row.templateCode">{{ row.templateName || row.templateCode }}</h2>
                  <code>{{ row.templateCode }}</code>
                </div>
                <el-dropdown trigger="click" @command="handleCardCommand($event, row)">
                  <el-button text circle
                    ><el-icon><MoreFilled /></el-icon
                  ></el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="copy"
                        ><el-icon><CopyDocument /></el-icon>复制模板</el-dropdown-item
                      >
                      <el-dropdown-item command="delete" divided
                        ><el-icon><Delete /></el-icon>删除模板</el-dropdown-item
                      >
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <p class="card-remark">{{ row.remark || '未填写模板说明' }}</p>
              <div class="card-meta">
                <span
                  ><el-icon><Clock /></el-icon>{{ row.updateTime || '尚未保存' }}</span
                >
                <span class="format-badge">JSON</span>
              </div>
            </div>
            <footer class="card-actions">
              <el-button text @click="preview(row)"
                ><el-icon><View /></el-icon>预览</el-button
              >
              <el-button text type="primary" @click="design(row)"
                ><el-icon><EditPen /></el-icon>设计</el-button
              >
            </footer>
          </article>
        </div>
        <el-empty v-else-if="!loading" description="还没有打印模板">
          <el-button type="primary" @click="openCreate">创建第一个模板</el-button>
        </el-empty>
      </template>

      <el-table v-else :data="rows" border stripe>
        <el-table-column label="预览" width="116" align="center">
          <template #default="{ row }"><PrintTemplateThumb class="table-thumb" :row="row" /></template>
        </el-table-column>
        <el-table-column prop="templateName" label="模板名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="templateCode" label="模板编码" min-width="170" show-overflow-tooltip>
          <template #default="{ row }"
            ><code>{{ row.templateCode }}</code></template
          >
        </el-table-column>
        <el-table-column prop="remark" label="说明" min-width="200" show-overflow-tooltip />
        <el-table-column prop="updateTime" label="更新时间" width="180" align="center" />
        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link @click="preview(row)">预览</el-button>
            <el-button link type="primary" @click="design(row)">设计</el-button>
            <el-button link @click="openCopy(row)">复制</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </main>

    <footer class="pagination-bar">
      <span>共 {{ total }} 条</span>
      <el-pagination v-model:current-page="query.pageNum" v-model:page-size="query.pageSize" :page-sizes="[8, 16, 32, 64]" layout="sizes, prev, pager, next, jumper" :total="total" @size-change="loadList" @current-change="loadList" />
    </footer>

    <el-dialog v-model="createVisible" title="新建打印模板" width="520px" append-to-body @closed="createFormRef?.resetFields()">
      <el-form ref="createFormRef" :model="createForm" :rules="formRules" label-position="top">
        <div class="dialog-grid">
          <el-form-item label="模板编码" prop="templateCode">
            <el-input v-model="createForm.templateCode" placeholder="例如：work_order_label" />
          </el-form-item>
          <el-form-item label="模板名称" prop="templateName">
            <el-input v-model="createForm.templateName" placeholder="例如：工单流转标签" />
          </el-form-item>
        </div>
        <el-form-item label="纸张">
          <el-radio-group v-model="createForm.paperSize" class="paper-selector">
            <el-radio-button value="A4">A4 单据</el-radio-button>
            <el-radio-button value="LABEL_80X60">80×60 标签</el-radio-button>
            <el-radio-button value="LABEL_60X40">60×40 标签</el-radio-button>
            <el-radio-button value="THERMAL_80">80mm 连续纸</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="模板说明">
          <el-input v-model="createForm.remark" type="textarea" :rows="3" placeholder="说明模板用途，方便后续检索" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">创建并进入设计器</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="copyVisible" title="复制打印模板" width="480px" append-to-body @closed="copyFormRef?.resetFields()">
      <el-form ref="copyFormRef" :model="copyForm" :rules="copyRules" label-position="top">
        <el-form-item label="新模板编码" prop="templateCode"><el-input v-model="copyForm.templateCode" /></el-form-item>
        <el-form-item label="新模板名称" prop="templateName"><el-input v-model="copyForm.templateName" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="copyVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCopy">创建副本</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="previewVisible" :title="previewRow?.templateName || '打印预览'" width="min(1160px, 96vw)" top="3vh" append-to-body destroy-on-close>
      <div class="preview-info">
        <span>{{ previewRow?.templateCode }}</span>
        <span>{{ previewPages }} 页</span>
        <span>{{ previewData.length ? '后台样例数据' : '空数据预览' }}</span>
      </div>
      <div v-loading="previewLoading" class="preview-panel">
        <PrintHtmlPreview v-if="previewTemplate" ref="previewRef" :template-json="previewTemplate" :print-data="previewData[0] || {}" @rendered="previewPages = $event" />
        <el-empty v-else-if="!previewLoading" description="该模板暂无可预览内容" />
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button :disabled="!previewTemplate" @click="previewRef?.print()"
          ><el-icon><Printer /></el-icon>打印</el-button
        >
        <el-button type="primary" :disabled="!previewRow" @click="previewRow && design(previewRow)">
          <el-icon><EditPen /></el-icon>
          进入设计器
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="PrintTemplateIndex">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Clock, CopyDocument, Delete, EditPen, Grid, List, MoreFilled, Plus, Printer, Refresh, Search, View } from '@element-plus/icons-vue';
import { PrintHtmlPreview, createDefaultTemplate, type TemplateData } from '@worm-vue3-print/canvas';
import '@worm-vue3-print/canvas/style.css';
import { delPrintTemplate, getPrintSampleData, getPrintTemplate, listPrintTemplate, savePrintTemplate, type PrintTemplateVo } from '@/api/wms/printTemplate';
import { printTemplateAdapter } from '@/config/printTemplate';
import { HttpStatus } from '@/enums/RespEnum';
import { parseSampleRows, parseTemplateContent } from './model';
import PrintTemplateThumb from './components/PrintTemplateThumb.vue';

const router = useRouter();
const rows = ref<PrintTemplateVo[]>([]);
const total = ref(0);
const loading = ref(false);
const keyword = ref('');
const viewMode = ref<'card' | 'table'>('card');
const query = reactive({ pageNum: 1, pageSize: 8 });
const createVisible = ref(false);
const copyVisible = ref(false);
const submitting = ref(false);
const createFormRef = ref<FormInstance>();
const copyFormRef = ref<FormInstance>();
type PaperChoice = 'A4' | 'LABEL_80X60' | 'LABEL_60X40' | 'THERMAL_80';
const createForm = reactive({
  templateCode: '',
  templateName: '',
  paperSize: 'LABEL_80X60' as PaperChoice,
  remark: ''
});
const copyForm = reactive({ templateCode: '', templateName: '' });
const copySource = ref<PrintTemplateVo | null>(null);
const formRules: FormRules = {
  templateCode: [
    { required: true, message: '请输入模板编码', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9_-]+$/, message: '仅支持字母、数字、下划线和短横线', trigger: 'blur' }
  ],
  templateName: [{ required: true, message: '请输入模板名称', trigger: 'blur' }]
};
const copyRules: FormRules = formRules;

const previewVisible = ref(false);
const previewLoading = ref(false);
const previewRow = ref<PrintTemplateVo | null>(null);
const previewTemplate = ref<Record<string, any> | null>(null);
const previewData = ref<Record<string, unknown>[]>([]);
const previewPages = ref(0);
const previewRef = ref<InstanceType<typeof PrintHtmlPreview> | null>(null);

async function loadList() {
  loading.value = true;
  try {
    const result = await listPrintTemplate({
      keyword: keyword.value.trim() || undefined,
      pageNum: query.pageNum,
      pageSize: query.pageSize
    });
    if (result.code !== HttpStatus.SUCCESS) throw new Error(result.msg || '查询失败');
    rows.value = result.rows ?? [];
    total.value = result.total ?? 0;
  } catch (error) {
    rows.value = [];
    total.value = 0;
    ElMessage.error(error instanceof Error ? error.message : '打印模板加载失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.pageNum = 1;
  void loadList();
}

function resetSearch() {
  keyword.value = '';
  query.pageNum = 1;
  void loadList();
}

function openCreate() {
  createForm.templateCode = `tpl_${Date.now()}`;
  createForm.templateName = '';
  createForm.paperSize = 'LABEL_80X60';
  createForm.remark = '';
  createVisible.value = true;
}

function design(row: PrintTemplateVo) {
  if (!row.templateCode) return;
  router.push({ path: '/wms/print-template/designer', query: { code: row.templateCode, name: row.templateName } });
}

function createTemplateByPaper(paperSize: PaperChoice): TemplateData {
  const template = createDefaultTemplate();
  template.paperSize = paperSize === 'A4' ? 'A4' : 'CUSTOM';
  template.margins = paperSize === 'A4' ? { top: 10, right: 10, bottom: 10, left: 10 } : { top: 2, right: 2, bottom: 2, left: 2 };
  template.header.height = 0;
  template.footer.height = 0;
  const customSizes: Record<Exclude<PaperChoice, 'A4'>, [number, number]> = {
    LABEL_80X60: [80, 60],
    LABEL_60X40: [60, 40],
    THERMAL_80: [80, 160]
  };
  if (paperSize !== 'A4') {
    [template.customWidth, template.customHeight] = customSizes[paperSize];
  }
  return template;
}

async function submitCreate() {
  if (!(await createFormRef.value?.validate().catch(() => false))) return;
  submitting.value = true;
  try {
    const vo: PrintTemplateVo = {
      templateCode: createForm.templateCode.trim(),
      templateName: createForm.templateName.trim(),
      remark: createForm.remark.trim(),
      templateContent: JSON.stringify(createTemplateByPaper(createForm.paperSize)),
      businessFields: '[]',
      widgetOptions: '[]',
      sampleData: '[]'
    };
    const result = await savePrintTemplate(vo);
    if (result.code !== HttpStatus.SUCCESS) throw new Error(result.msg || '创建失败');
    createVisible.value = false;
    await router.push({
      path: '/wms/print-template/designer',
      query: { code: vo.templateCode, name: vo.templateName, create: '1' }
    });
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '模板创建失败');
  } finally {
    submitting.value = false;
  }
}

function openCopy(row: PrintTemplateVo) {
  copySource.value = row;
  copyForm.templateCode = `${row.templateCode || 'template'}_copy`;
  copyForm.templateName = `${row.templateName || row.templateCode || '模板'} - 副本`;
  copyVisible.value = true;
}

async function submitCopy() {
  if (!(await copyFormRef.value?.validate().catch(() => false)) || !copySource.value?.templateCode) return;
  submitting.value = true;
  try {
    const detail = await getPrintTemplate(copySource.value.templateCode);
    if (detail.code !== HttpStatus.SUCCESS || detail.data == null) throw new Error(detail.msg || '源模板读取失败');
    const source = (printTemplateAdapter.mapDetailPayload(detail.data) ?? detail.data) as PrintTemplateVo;
    const vo: PrintTemplateVo = {
      ...source,
      id: undefined,
      templateCode: copyForm.templateCode.trim(),
      templateName: copyForm.templateName.trim()
    };
    const result = await savePrintTemplate(vo);
    if (result.code !== HttpStatus.SUCCESS) throw new Error(result.msg || '复制失败');
    copyVisible.value = false;
    ElMessage.success('模板副本已创建');
    await loadList();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '模板复制失败');
  } finally {
    submitting.value = false;
  }
}

async function preview(row: PrintTemplateVo) {
  if (!row.templateCode) return;
  previewVisible.value = true;
  previewLoading.value = true;
  previewRow.value = row;
  previewTemplate.value = null;
  previewData.value = [];
  previewPages.value = 0;
  try {
    const [detailResult, sampleResult] = await Promise.all([getPrintTemplate(row.templateCode), getPrintSampleData(row.templateCode).catch(() => null)]);
    if (detailResult.code !== HttpStatus.SUCCESS || detailResult.data == null) throw new Error('模板详情加载失败');
    const detail = (printTemplateAdapter.mapDetailPayload(detailResult.data) ?? detailResult.data) as PrintTemplateVo;
    previewTemplate.value = parseTemplateContent(detail.templateContent) as Record<string, any>;
    if (sampleResult?.code === HttpStatus.SUCCESS) previewData.value = parseSampleRows(sampleResult.data);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '预览加载失败');
  } finally {
    previewLoading.value = false;
  }
}

async function remove(row: PrintTemplateVo) {
  try {
    await ElMessageBox.confirm(`删除模板“${row.templateName || row.templateCode}”？删除后无法恢复。`, '删除模板', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    });
    const result = await delPrintTemplate(row.id ?? row.templateCode ?? '');
    if (result.code !== HttpStatus.SUCCESS) throw new Error(result.msg || '删除失败');
    ElMessage.success('模板已删除');
    if (rows.value.length === 1 && query.pageNum > 1) query.pageNum -= 1;
    await loadList();
  } catch (error) {
    if (error === 'cancel' || error === 'close') return;
    ElMessage.error(error instanceof Error ? error.message : '删除失败');
  }
}

function handleCardCommand(command: string, row: PrintTemplateVo) {
  if (command === 'copy') openCopy(row);
  if (command === 'delete') void remove(row);
}

onMounted(() => void loadList());
</script>

<style scoped lang="scss">
.template-library {
  min-height: calc(100vh - 84px);
  color: #172033;
  background: #f2f5f9;
}

.library-header {
  position: relative;
  overflow: hidden;
  min-height: 132px;
  padding: 26px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  border: 1px solid #dce4ef;
  border-radius: 14px;
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.07) 1px, transparent 1px), linear-gradient(rgba(37, 99, 235, 0.07) 1px, transparent 1px), #fff;
  background-size: 24px 24px;
}

.library-header::after {
  content: '';
  position: absolute;
  right: 34%;
  bottom: -85px;
  width: 220px;
  height: 150px;
  border: 20px solid rgba(37, 99, 235, 0.06);
  border-radius: 50%;
  transform: rotate(-12deg);
}

.header-copy,
.header-metrics {
  position: relative;
  z-index: 1;
}

.section-kicker {
  color: #2563eb;
  font:
    700 11px/1.2 Consolas,
    monospace;
  letter-spacing: 0.16em;
}

.header-copy h1 {
  margin: 7px 0 6px;
  font-size: 27px;
  letter-spacing: -0.02em;
}

.header-copy p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.header-metrics {
  display: flex;
  align-items: center;
  gap: 22px;
}

.header-metrics > div {
  display: grid;
  gap: 4px;
  text-align: right;
}

.header-metrics strong {
  color: #1d4ed8;
  font:
    700 24px/1 Consolas,
    monospace;
}

.header-metrics span {
  color: #64748b;
  font-size: 11px;
}

.header-metrics i {
  width: 1px;
  height: 38px;
  background: #dbe3ef;
}

.filter-bar {
  margin-top: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #dce4ef;
  border-radius: 10px;
  background: #fff;
}

.search-input {
  width: 320px;
}

.filter-spacer {
  flex: 1;
}

.view-switch :deep(.el-radio-button__inner) {
  display: flex;
  align-items: center;
  gap: 5px;
}

.library-content {
  min-height: 420px;
  margin-top: 14px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(285px, 1fr));
  gap: 16px;
}

.template-card {
  overflow: hidden;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 3px 12px rgba(15, 35, 65, 0.04);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.template-card:hover {
  border-color: #9db9ee;
  box-shadow: 0 12px 26px rgba(28, 55, 95, 0.12);
  transform: translateY(-3px);
}

.preview-cover {
  position: relative;
  width: 100%;
  height: 190px;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
}

.design-entry {
  position: absolute;
  right: 12px;
  bottom: 12px;
  padding: 7px 11px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #fff;
  border-radius: 8px;
  background: #1d4ed8;
  box-shadow: 0 6px 15px rgba(29, 78, 216, 0.28);
  font-size: 12px;
  font-weight: 600;
  opacity: 0;
  transform: translateY(5px);
  transition: 0.18s ease;
}

.template-card:hover .design-entry {
  opacity: 1;
  transform: translateY(0);
}

.card-content {
  padding: 15px 16px 12px;
}

.card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.card-heading > div {
  min-width: 0;
}

.card-heading h2 {
  margin: 0 0 5px;
  overflow: hidden;
  font-size: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

code {
  color: #2563eb;
  font:
    12px Consolas,
    monospace;
}

.card-remark {
  height: 20px;
  margin: 11px 0;
  overflow: hidden;
  color: #64748b;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #94a3b8;
  font-size: 11px;
}

.card-meta > span:first-child {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.format-badge {
  padding: 2px 6px;
  color: #64748b;
  border: 1px solid #dbe3ef;
  border-radius: 4px;
  font:
    10px Consolas,
    monospace;
}

.card-actions {
  padding: 7px 10px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  border-top: 1px solid #edf1f5;
  background: #fbfcfe;
}

.card-actions .el-button + .el-button {
  margin-left: 0;
}

.pagination-bar {
  padding: 18px 2px 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #64748b;
  font-size: 12px;
}

.table-thumb {
  width: 84px;
  height: 58px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.dialog-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.paper-selector {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}

.paper-selector :deep(.el-radio-button__inner) {
  width: 100%;
}

.preview-info {
  margin-bottom: 10px;
  display: flex;
  gap: 18px;
  color: #64748b;
  font-size: 12px;
}

.preview-info span + span::before {
  content: '·';
  margin-right: 18px;
}

.preview-panel {
  height: min(72vh, 760px);
  overflow: hidden;
  border: 1px solid #d5dce7;
  border-radius: 10px;
  background: #e5e7eb;
}

@media (max-width: 820px) {
  .library-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-metrics {
    width: 100%;
  }

  .filter-bar {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .search-input {
    width: 100%;
  }

  .filter-spacer {
    display: none;
  }

  .dialog-grid {
    grid-template-columns: 1fr;
  }
}
</style>
