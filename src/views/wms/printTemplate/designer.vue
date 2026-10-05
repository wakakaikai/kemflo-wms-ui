<template>
  <div class="print-studio">
    <header class="studio-header">
      <div class="studio-identity">
        <el-button text class="back-button" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          模板库
        </el-button>
        <span class="header-divider" />
        <div class="title-block">
          <div class="title-line">
            <h1>{{ templateName || '未命名模板' }}</h1>
            <span class="template-code">{{ templateCode || 'NO CODE' }}</span>
            <span v-if="migratedLegacy" class="migration-badge">外部格式已转换</span>
          </div>
          <p>{{ saveStateText }}</p>
        </div>
      </div>

      <div class="studio-actions">
        <el-tooltip content="刷新业务字段与样例数据" placement="bottom">
          <el-button :loading="dataLoading" @click="reloadBackendData">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </el-tooltip>
        <el-button @click="dataDrawerVisible = true">
          <el-icon><DataAnalysis /></el-icon>
          数据源
          <span class="count-badge">{{ businessFields.length }}</span>
        </el-button>
        <el-button @click="exportTemplate">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button @click="importInputRef?.click()">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        <el-button type="primary" :loading="saving" @click="saveCurrent">
          <el-icon><DocumentChecked /></el-icon>
          保存模板
        </el-button>
      </div>
      <input ref="importInputRef" class="file-input" type="file" accept="application/json,.json" @change="importTemplate" />
    </header>

    <div v-if="loadError" class="load-alert">
      <el-alert :title="loadError" type="warning" show-icon :closable="false" />
    </div>

    <main v-loading="loading" class="studio-workbench">
      <PrintDesigner v-if="designerReady" ref="designerRef" v-model="templateData" :widget-options="widgetOptions" :print-data="sampleRows" @preview="openPreview" @save="persist" />
    </main>

    <el-drawer v-model="dataDrawerVisible" title="打印数据源" size="min(640px, 94vw)" append-to-body>
      <div class="drawer-summary">
        <div class="summary-card">
          <span>业务字段</span>
          <strong>{{ businessFields.length }}</strong>
        </div>
        <div class="summary-card">
          <span>样例记录</span>
          <strong>{{ sampleRows.length }}</strong>
        </div>
      </div>

      <el-tabs>
        <el-tab-pane label="字段字典">
          <el-table :data="businessFields" border size="small" max-height="calc(100vh - 260px)">
            <el-table-column prop="fieldLabel" label="显示名称" min-width="140" />
            <el-table-column prop="fieldKey" label="字段路径" min-width="210" show-overflow-tooltip>
              <template #default="{ row }"
                ><code>{{ row.fieldKey }}</code></template
              >
            </el-table-column>
            <el-table-column prop="fieldType" label="类型" width="92" align="center" />
          </el-table>
          <el-empty v-if="!businessFields.length" description="暂无字段，请在后台配置业务字段或样例数据" />
        </el-tab-pane>
        <el-tab-pane label="样例数据">
          <pre class="json-viewer">{{ formattedSampleData }}</pre>
        </el-tab-pane>
      </el-tabs>
    </el-drawer>

    <el-dialog v-model="previewVisible" title="打印预览" width="min(1180px, 96vw)" top="3vh" append-to-body destroy-on-close class="worm-preview-dialog">
      <div class="preview-meta">
        <span>{{ templateName }}</span>
        <span>{{ previewPages }} 页</span>
        <span>{{ sampleRows.length ? '使用后台样例数据' : '暂无样例数据' }}</span>
      </div>
      <div class="preview-stage">
        <PrintTemplatePreview v-if="previewTemplate" ref="previewRef" :template="previewTemplate" :print-data="sampleRows" @rendered="previewPages = $event" />
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button type="primary" @click="previewRef?.print()">
          <el-icon><Printer /></el-icon>
          浏览器打印
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="PrintTemplateDesigner">
import { computed, nextTick, onActivated, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, DataAnalysis, DocumentChecked, Download, Printer, Refresh, Upload } from '@element-plus/icons-vue';
import { PrintDesigner, createBlankTemplate, defaultWidgetOptions, ensureShapePaletteWidgets, type PrintTemplate, type WidgetOption } from '@/components/print-designer';
import { getPrintSampleData, getPrintTemplate, listPrintWidgetOptions, savePrintTemplate, type PrintTemplateVo } from '@/api/wms/printTemplate';
import { printTemplateAdapter } from '@/config/printTemplate';
import { HttpStatus } from '@/enums/RespEnum';
import { fieldsToWidgetOptions, inferBusinessFields, isLocalTemplate, isWormTemplate, mapBusinessFields, parseSampleRows, parseTemplateContent, type PrintBusinessField } from './model';
import PrintTemplatePreview from './components/PrintTemplatePreview.vue';

type DesignerExpose = InstanceType<typeof PrintDesigner> & {
  getTemplate: () => PrintTemplate;
};

const route = useRoute();
const router = useRouter();
const designerRef = ref<DesignerExpose | null>(null);
const previewRef = ref<InstanceType<typeof PrintTemplatePreview> | null>(null);
const importInputRef = ref<HTMLInputElement | null>(null);
const templateData = ref<PrintTemplate>(createBlankTemplate());
const widgetOptions = ref<WidgetOption[]>(ensureShapePaletteWidgets([...defaultWidgetOptions]));
const businessFields = ref<PrintBusinessField[]>([]);
const sampleRows = ref<Record<string, unknown>[]>([]);
const currentVo = ref<PrintTemplateVo>({});
const templateCode = ref('');
const templateName = ref('');
const loading = ref(false);
const dataLoading = ref(false);
const saving = ref(false);
const designerReady = ref(false);
const loadError = ref('');
const dataDrawerVisible = ref(false);
const previewVisible = ref(false);
const previewTemplate = ref<PrintTemplate | null>(null);
const previewPages = ref(0);
const migratedLegacy = ref(false);
const lastSavedAt = ref('');

const formattedSampleData = computed(() => JSON.stringify(sampleRows.value, null, 2));
const saveStateText = computed(() => {
  if (saving.value) return '正在保存模板…';
  if (lastSavedAt.value) return `已保存 · ${lastSavedAt.value}`;
  return '毫米级画布 · 字段绑定 · 同构打印预览';
});

function routeValue(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw == null ? '' : String(raw).trim();
}

function goBack() {
  router.push('/wms/print-template/index');
}

function parseStoredFields(raw: PrintTemplateVo['businessFields'] | PrintTemplateVo['widgetOptions']) {
  return mapBusinessFields(raw, sampleRows.value);
}

async function remountDesigner() {
  designerReady.value = false;
  await nextTick();
  designerReady.value = true;
}

function applyDetail(vo: PrintTemplateVo) {
  currentVo.value = vo;
  templateCode.value = String(vo.templateCode || templateCode.value).trim();
  templateName.value = String(vo.templateName || templateName.value || templateCode.value).trim();
  const raw =
    typeof vo.templateContent === 'string'
      ? (() => {
          try {
            return JSON.parse(vo.templateContent);
          } catch {
            return undefined;
          }
        })()
      : vo.templateContent;
  migratedLegacy.value = !!raw && isWormTemplate(raw);
  templateData.value = parseTemplateContent(vo.templateContent);
  const stored = parseStoredFields(vo.businessFields ?? vo.widgetOptions);
  if (stored.length) businessFields.value = stored;
}

async function loadBackendData(showMessage = false) {
  if (!templateCode.value) return;
  dataLoading.value = true;
  try {
    const [fieldResult, sampleResult] = await Promise.allSettled([listPrintWidgetOptions(templateCode.value), getPrintSampleData(templateCode.value)]);
    if (sampleResult.status === 'fulfilled' && sampleResult.value.code === HttpStatus.SUCCESS) {
      sampleRows.value = parseSampleRows(sampleResult.value.data);
    }
    let fields: PrintBusinessField[] = [];
    let mappedOptions: WidgetOption[] = [];
    if (fieldResult.status === 'fulfilled' && fieldResult.value.code === HttpStatus.SUCCESS) {
      fields = mapBusinessFields(fieldResult.value.data, sampleRows.value);
      mappedOptions = printTemplateAdapter.mapWidgetOptionsPayload(fieldResult.value.data) || [];
    }
    if (!fields.length) fields = inferBusinessFields(sampleRows.value);
    if (fields.length) {
      businessFields.value = fields;
      widgetOptions.value = ensureShapePaletteWidgets([...defaultWidgetOptions, ...(mappedOptions.length ? mappedOptions : fieldsToWidgetOptions(fields))]);
    }
    if (showMessage) ElMessage.success(`已加载 ${businessFields.value.length} 个字段、${sampleRows.value.length} 条样例数据`);
  } finally {
    dataLoading.value = false;
  }
}

async function loadPage() {
  const code = routeValue(route.query.code);
  const name = routeValue(route.query.name);
  const creating = routeValue(route.query.create) === '1';
  templateCode.value = code;
  templateName.value = name;
  templateData.value = createBlankTemplate();
  widgetOptions.value = ensureShapePaletteWidgets([...defaultWidgetOptions]);
  businessFields.value = [];
  sampleRows.value = [];
  currentVo.value = { templateCode: code, templateName: name };
  loadError.value = '';
  migratedLegacy.value = false;
  lastSavedAt.value = '';

  if (!code) {
    loadError.value = '缺少模板编码，请从模板库进入设计器。';
    await remountDesigner();
    return;
  }

  loading.value = true;
  try {
    if (!creating) {
      const result = await getPrintTemplate(code);
      if (result.code !== HttpStatus.SUCCESS || result.data == null) throw new Error(result.msg || '模板详情加载失败');
      const mapped = printTemplateAdapter.mapDetailPayload(result.data);
      if (!mapped) throw new Error('模板详情格式不正确');
      applyDetail(mapped as PrintTemplateVo);
    }
    await loadBackendData();
  } catch (error) {
    loadError.value = error instanceof Error ? `${error.message}，当前显示空白模板。` : '模板加载失败，当前显示空白模板。';
  } finally {
    await remountDesigner();
    loading.value = false;
  }
}

async function reloadBackendData() {
  await loadBackendData(true);
}

function validateCurrent() {
  if (templateData.value.pageWidth <= 0 || templateData.value.pageHeight <= 0) {
    ElMessage.warning('纸张尺寸必须大于 0');
    return false;
  }
  return true;
}

async function persist(content: PrintTemplate) {
  if (!templateCode.value) {
    ElMessage.warning('模板编码不能为空');
    return;
  }
  saving.value = true;
  try {
    const fieldJson = JSON.stringify(businessFields.value);
    const vo: PrintTemplateVo = {
      ...currentVo.value,
      templateCode: templateCode.value,
      templateName: templateName.value || templateCode.value,
      templateContent: JSON.stringify(content),
      businessFields: fieldJson,
      widgetOptions: JSON.stringify(widgetOptions.value),
      sampleData: currentVo.value.sampleData
    };
    const result = await savePrintTemplate(vo);
    if (result.code !== HttpStatus.SUCCESS) throw new Error(result.msg || '保存失败');
    currentVo.value = vo;
    templateData.value = content;
    migratedLegacy.value = false;
    lastSavedAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    await router.replace({ query: { code: templateCode.value, name: vo.templateName } });
    ElMessage.success('模板已保存');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '模板保存失败');
  } finally {
    saving.value = false;
  }
}

function saveCurrent() {
  if (!validateCurrent()) return;
  const content = designerRef.value?.getTemplate() || templateData.value;
  if (!content) {
    ElMessage.warning('设计器尚未初始化');
    return;
  }
  void persist(content);
}

function openPreview(content?: PrintTemplate) {
  if (!validateCurrent()) return;
  previewTemplate.value = content || designerRef.value?.getTemplate() || templateData.value;
  previewPages.value = 0;
  previewVisible.value = true;
}

function exportTemplate() {
  if (!validateCurrent()) return;
  const content = designerRef.value?.getTemplate() || templateData.value;
  if (!content) return;
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${templateCode.value || 'print-template'}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importTemplate(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!isWormTemplate(parsed) && !isLocalTemplate(parsed)) {
        throw new Error('不支持的模板格式');
      }
      templateData.value = parseTemplateContent(parsed);
      migratedLegacy.value = isWormTemplate(parsed);
      await remountDesigner();
      ElMessage.success('模板已导入，保存后写入后台');
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '模板文件读取失败');
    }
  };
  reader.onerror = () => ElMessage.error('模板文件读取失败');
  reader.readAsText(file);
}

watch(
  () => [route.query.code, route.query.name, route.query.create],
  () => void loadPage()
);
onMounted(() => void loadPage());
onActivated(() => {
  if (route.name === 'PrintTemplateDesigner' && routeValue(route.query.code) !== templateCode.value) void loadPage();
});
</script>

<style scoped lang="scss">
.print-studio {
  --studio-ink: #14213d;
  --studio-blue: #2563eb;
  --studio-line: #dbe3ef;
  height: calc(100vh - 84px);
  min-height: 720px;
  display: flex;
  flex-direction: column;
  background: #edf1f7;
}

.studio-header {
  position: relative;
  z-index: 3;
  min-height: 68px;
  padding: 10px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  color: var(--studio-ink);
  border-bottom: 1px solid var(--studio-line);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 4px 18px rgba(15, 35, 65, 0.06);
}

.studio-identity,
.studio-actions,
.title-line {
  display: flex;
  align-items: center;
}

.studio-identity {
  min-width: 0;
  gap: 14px;
}

.studio-actions {
  flex-shrink: 0;
  gap: 8px;
}

.back-button {
  padding: 0 4px;
  color: #475569;
}

.header-divider {
  width: 1px;
  height: 32px;
  background: var(--studio-line);
}

.title-block {
  min-width: 0;
}

.title-line {
  gap: 9px;
}

.title-line h1 {
  max-width: 360px;
  margin: 0;
  overflow: hidden;
  font-size: 17px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title-block p {
  margin: 4px 0 0;
  color: #7b8799;
  font-size: 12px;
}

.template-code,
.migration-badge,
.count-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font:
    11px/1.4 Consolas,
    monospace;
}

.template-code {
  padding: 2px 8px;
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.migration-badge {
  padding: 2px 7px;
  color: #9a3412;
  background: #fff7ed;
  border: 1px solid #fed7aa;
}

.count-badge {
  min-width: 20px;
  justify-content: center;
  margin-left: 4px;
  padding: 1px 5px;
  color: #1d4ed8;
  background: #dbeafe;
}

.load-alert {
  padding: 10px 14px 0;
  background: #edf1f7;
}

.studio-workbench {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.studio-workbench :deep(.print-designer) {
  height: 100%;
}

.file-input {
  display: none;
}

.drawer-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.summary-card {
  padding: 14px 16px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}

.summary-card span {
  color: #64748b;
  font-size: 13px;
}

.summary-card strong {
  color: #1d4ed8;
  font:
    700 24px/1 Consolas,
    monospace;
}

code {
  color: #1d4ed8;
  font:
    12px Consolas,
    monospace;
}

.json-viewer {
  min-height: 420px;
  max-height: calc(100vh - 220px);
  margin: 0;
  padding: 16px;
  overflow: auto;
  border-radius: 10px;
  color: #dbeafe;
  background: #111827;
  font:
    12px/1.65 Consolas,
    monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.preview-meta {
  display: flex;
  gap: 18px;
  margin-bottom: 10px;
  color: #64748b;
  font-size: 12px;
}

.preview-meta span + span::before {
  content: '·';
  margin-right: 18px;
}

.preview-stage {
  height: min(72vh, 760px);
  overflow: hidden;
  border: 1px solid #d5dce7;
  border-radius: 10px;
  background: #e5e7eb;
}

@media (max-width: 980px) {
  .print-studio {
    height: auto;
    min-height: calc(100vh - 84px);
  }

  .studio-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .studio-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .studio-workbench {
    height: 820px;
    flex: none;
  }
}
</style>
