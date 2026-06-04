<template>
  <div class="app-container print-template-page">
    <header class="designer-header">
      <div class="designer-header__top">
        <el-button class="designer-back" text @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          {{ t('printDesigner.back') }}
        </el-button>
        <div class="designer-header__title-wrap">
          <h1 class="designer-header__title">{{ t('printDesigner.designerTitle') }}</h1>
          <el-tag v-if="activeCode" size="small" effect="plain" type="info">{{ activeCode }}</el-tag>
        </div>
        <el-tooltip placement="bottom-end" :show-after="200">
          <template #content>
            <span>{{ t('printDesigner.alertLodop') }}</span>
          </template>
          <el-button class="designer-tip-btn" text circle>
            <el-icon><InfoFilled /></el-icon>
          </el-button>
        </el-tooltip>
      </div>

      <div class="designer-toolbar">
        <div class="designer-toolbar__search">
          <span class="designer-toolbar__label">{{ t('printDesigner.toolbarLoad') }}</span>
          <el-input
            v-model="templateCode"
            class="designer-field designer-field--code"
            :placeholder="t('printDesigner.codePlaceholder')"
            clearable
            @keyup.enter="loadFromApi"
            @clear="onSearchFieldChange"
            @change="onCodeChange"
          >
            <template #prefix>
              <el-icon><Tickets /></el-icon>
            </template>
          </el-input>
          <el-input
            v-model="templateName"
            class="designer-field designer-field--name"
            :placeholder="t('printDesigner.namePlaceholder')"
            clearable
            @keyup.enter="loadFromApi"
            @clear="onTemplateNameChange"
            @change="onTemplateNameChange"
          >
            <template #prefix>
              <el-icon><Document /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" :loading="loading" @click="loadFromApi">
            <el-icon class="el-icon--left"><Search /></el-icon>
            {{ t('printDesigner.searchAndLoad') }}
          </el-button>
        </div>

        <div class="designer-toolbar__divider" />

        <div class="designer-toolbar__data">
          <el-button class="designer-link-btn" text type="primary" @click="routesDialogVisible = true">
            <el-icon><Link /></el-icon>
            {{ t('printDesigner.openRoutesDialog') }}
          </el-button>
          <el-dropdown trigger="click" @command="onDatasetMenuCommand">
            <el-button type="primary" plain>
              <el-icon class="el-icon--left"><Plus /></el-icon>
              {{ t('printDesigner.datasetMenu.trigger') }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="api">{{ t('printDesigner.datasetMenu.api') }}</el-dropdown-item>
                <el-dropdown-item disabled>{{ t('printDesigner.datasetMenu.sqlPlaceholder') }}</el-dropdown-item>
                <el-dropdown-item disabled>{{ t('printDesigner.datasetMenu.javaPlaceholder') }}</el-dropdown-item>
                <el-dropdown-item disabled>{{ t('printDesigner.datasetMenu.jsonPlaceholder') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <el-dialog v-model="routesDialogVisible" :title="t('printDesigner.apiConfig.title')" width="min(640px, 94vw)" append-to-body>
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item :label="t('printDesigner.apiConfig.prefixLabel')">{{ apiEndpoints.prefix }}</el-descriptions-item>
        <el-descriptions-item :label="`${t('printDesigner.apiConfig.list')} (${t('printDesigner.apiConfig.methodGet')})`">{{ apiEndpoints.list }}</el-descriptions-item>
        <el-descriptions-item :label="`${t('printDesigner.apiConfig.detail')} (${t('printDesigner.apiConfig.methodGet')})`">{{ apiEndpoints.detail }}</el-descriptions-item>
        <el-descriptions-item :label="`${t('printDesigner.apiConfig.save')} (${t('printDesigner.apiConfig.methodPost')})`">{{ apiEndpoints.save }}</el-descriptions-item>
        <el-descriptions-item :label="`${t('printDesigner.apiConfig.widgetOptions')} (${t('printDesigner.apiConfig.methodGet')})`">{{ apiEndpoints.widgetOptions }}</el-descriptions-item>
        <el-descriptions-item :label="`${t('printDesigner.apiConfig.sampleData')} (${t('printDesigner.apiConfig.methodGet')})`">{{ apiEndpoints.sampleData }}</el-descriptions-item>
      </el-descriptions>
      <p class="api-config-note">{{ t('printDesigner.apiConfig.baseNote') }}</p>
      <p class="api-config-note">{{ t('printDesigner.apiConfig.adapterNote') }}</p>
      <p class="api-config-note muted">{{ t('printDesigner.apiConfig.envHint') }}</p>
      <template #footer>
        <el-button type="primary" @click="routesDialogVisible = false">{{ t('printDesigner.dialogDone') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="pickVisible" :title="t('printDesigner.pickTemplateTitle')" width="560px" append-to-body>
      <p class="pick-hint">{{ t('printDesigner.pickTemplateHint') }}</p>
      <el-table :data="pickCandidates" border stripe size="small" highlight-current-row @row-click="onPickRow">
        <el-table-column :label="t('printTemplate.templateCode')" prop="templateCode" min-width="140" />
        <el-table-column :label="t('printTemplate.templateName')" prop="templateName" min-width="160" show-overflow-tooltip />
        <el-table-column :label="t('printTemplate.updateTime')" prop="updateTime" width="160" />
        <el-table-column :label="t('printTemplate.operations')" width="88" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="confirmPick(row)">{{ t('printDesigner.loadPick') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <PrintApiDatasetDialog v-model="apiDatasetDialogVisible" :print-template="template" @apply-preview-rows="onApplyDatasetPreview" />

    <PrintDesigner v-model="template" :widget-options="widgetOptions" :print-data="printData" :lodop-license="lodopLicense" @save="onSave" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onActivated, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { ArrowDown, ArrowLeft, Plus, Search, InfoFilled, Tickets, Document, Link } from '@element-plus/icons-vue';
import { PrintDesigner } from '@/components/print-designer';
import { createBlankTemplate, defaultWidgetOptions, ensureShapePaletteWidgets } from '@/components/print-designer';
import type { LodopLicenseInfo, PrintTemplate, WidgetOption } from '@/components/print-designer';
import { normalizeLineTemplateItem } from '@/components/print-designer/utils/lineItems';
import { getPrintTemplate, getPrintSampleData, listPrintWidgetOptions, listPrintTemplate, savePrintTemplate, type PrintTemplateVo } from '@/api/wms/printTemplate';
import { getPrintTemplateApiPrefix, printTemplateAdapter, printTemplateUrls } from '@/config/printTemplate';
import { localGetPrintTemplate, localSavePrintTemplate, localListPrintTemplates } from '@/utils/printTemplateStorage';
import PrintApiDatasetDialog from '@/components/print-designer/components/PrintApiDatasetDialog.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const DESIGNER_ROUTE_NAME = 'PrintTemplateDesigner';

function isDesignerRoute(): boolean {
  return route.name === DESIGNER_ROUTE_NAME;
}

const template = ref<PrintTemplate>(createBlankTemplate());
const widgetOptions = ref<WidgetOption[]>([...defaultWidgetOptions]);
const printData = ref<Record<string, unknown>[]>([]);
const templateCode = ref('');
const templateName = ref('');
const loading = ref(false);
const activeCode = ref('');

const routesDialogVisible = ref(false);
const apiDatasetDialogVisible = ref(false);
const pickVisible = ref(false);
const pickCandidates = ref<PrintTemplateVo[]>([]);

function onDatasetMenuCommand(cmd: string) {
  if (cmd === 'api') {
    apiDatasetDialogVisible.value = true;
  }
}

const apiEndpoints = computed(() => {
  const u = printTemplateUrls();
  const code = templateCode.value.trim() || activeCode.value || '{code}';
  return {
    prefix: getPrintTemplateApiPrefix(),
    list: u.list,
    detail: u.detail(code),
    save: u.save,
    widgetOptions: u.widgetOptions,
    sampleData: u.sampleData
  };
});

const lodopLicense = ref<LodopLicenseInfo | undefined>(import.meta.env.VITE_LODOP_LICENSE ? (JSON.parse(import.meta.env.VITE_LODOP_LICENSE) as LodopLicenseInfo) : undefined);

function goBack() {
  router.push({ path: '/wms/print-template/index' });
}

function onApplyDatasetPreview(rows: Record<string, unknown>[]) {
  printData.value = rows;
  ElMessage.success(t('printDesigner.apiDataset.appliedPreview'));
}

function parseTemplateContent(raw: PrintTemplateVo['templateContent']): PrintTemplate {
  const decoded = printTemplateAdapter.decodeTemplateContent(raw as unknown);
  if (decoded && typeof decoded === 'object') return decoded as PrintTemplate;
  if (!raw) return createBlankTemplate();
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as PrintTemplate;
    } catch {
      return createBlankTemplate();
    }
  }
  return raw as PrintTemplate;
}

function normalizeLoadedTemplate(temp: PrintTemplate): PrintTemplate {
  return {
    ...temp,
    tempItems: (temp.tempItems || []).map((i) => normalizeLineTemplateItem({ ...i }))
  };
}

function resolveDisplayName(vo: PrintTemplateVo, parsed: PrintTemplate): string {
  const fromVo = String(vo.templateName ?? '').trim();
  if (fromVo) return fromVo;
  const fromContent = String(parsed.title ?? '').trim();
  if (fromContent) return fromContent;
  const fromRoute = String((Array.isArray(route.query.name) ? route.query.name[0] : route.query.name) ?? '').trim();
  return fromRoute;
}

function applyVoToDesigner(vo: PrintTemplateVo) {
  const parsed = normalizeLoadedTemplate(parseTemplateContent(vo.templateContent));
  template.value = parsed;
  const displayName = resolveDisplayName(vo, parsed);
  if (displayName) {
    templateName.value = displayName;
    template.value.title = displayName;
  }
  if (vo.templateCode) {
    templateCode.value = vo.templateCode;
    activeCode.value = vo.templateCode;
  }
  if (typeof vo.widgetOptions === 'string') {
    try {
      widgetOptions.value = ensureShapePaletteWidgets(JSON.parse(vo.widgetOptions) as WidgetOption[]);
    } catch {
      /* keep */
    }
  } else if (Array.isArray(vo.widgetOptions)) {
    widgetOptions.value = ensureShapePaletteWidgets(vo.widgetOptions);
  }
}

function matchKeyword(row: PrintTemplateVo, kw: string): boolean {
  const code = String(row.templateCode || '').toLowerCase();
  const name = String(row.templateName || '').toLowerCase();
  return code === kw || name === kw || code.includes(kw) || name.includes(kw);
}

function rankMatch(row: PrintTemplateVo, codeKw: string, nameKw: string): number {
  const code = String(row.templateCode || '').toLowerCase();
  const name = String(row.templateName || '').toLowerCase();
  if (codeKw && code === codeKw) return 0;
  if (nameKw && name === nameKw) return 1;
  if (codeKw && code.includes(codeKw)) return 2;
  if (nameKw && name.includes(nameKw)) return 3;
  return 9;
}

async function findTemplateCandidates(): Promise<PrintTemplateVo[]> {
  const codeKw = templateCode.value.trim().toLowerCase();
  const nameKw = templateName.value.trim().toLowerCase();
  if (!codeKw && !nameKw) return [];

  const map = new Map<string, PrintTemplateVo>();
  const add = (rows: PrintTemplateVo[]) => {
    for (const r of rows) {
      if (!r.templateCode) continue;
      if (!codeKw && !nameKw) continue;
      const kw = codeKw || nameKw;
      if (matchKeyword(r, kw) || (codeKw && matchKeyword(r, codeKw)) || (nameKw && matchKeyword(r, nameKw))) {
        map.set(String(r.templateCode), r);
      }
    }
  };

  add(
    localListPrintTemplates().map((r) => ({
      id: r.id,
      templateCode: r.templateCode,
      templateName: r.templateName,
      remark: r.remark,
      updateTime: r.updateTime
    }))
  );

  try {
    const res = await listPrintTemplate({
      templateCode: templateCode.value.trim() || undefined,
      templateName: templateName.value.trim() || undefined,
      pageNum: 1,
      pageSize: 50
    });
    if (res.code === HttpStatus.SUCCESS && res.rows?.length) {
      add(res.rows);
    }
  } catch {
    /* local only */
  }

  return [...map.values()].sort((a, b) => {
    const ra = rankMatch(a, codeKw, nameKw);
    const rb = rankMatch(b, codeKw, nameKw);
    if (ra !== rb) return ra - rb;
    return (b.updateTime || '').localeCompare(a.updateTime || '');
  });
}

async function loadTemplateByCode(code: string, resolvedFromName = false) {
  templateCode.value = code;
  activeCode.value = code;
  onCodeChange();
  loading.value = true;
  try {
    try {
      await Promise.all([loadWidgets(), loadSampleData()]);
      const res = await getPrintTemplate(code);
      if (res.code === HttpStatus.SUCCESS && res.data != null) {
        const flat = printTemplateAdapter.mapDetailPayload(res.data);
        const voSource = flat ?? (typeof res.data === 'object' ? res.data : null);
        if (voSource && typeof voSource === 'object') {
          applyVoToDesigner(voSource as PrintTemplateVo);
          ElMessage.success(resolvedFromName ? t('printDesigner.resolvedByName', { code }) : t('printDesigner.loadedApi'));
          return;
        }
      }
    } catch {
      /* fallback */
    }
    const localVo = localGetPrintTemplate(code);
    if (localVo) {
      applyVoToDesigner(localVo);
      ElMessage.success(t('printDesigner.loadedLocal'));
    } else {
      ElMessage.warning(t('printDesigner.notFoundTemplate'));
      template.value = createBlankTemplate();
      template.value.title = templateName.value.trim() || t('printDesigner.blankTemplateTitle');
    }
  } finally {
    loading.value = false;
  }
}

async function loadWidgets() {
  const code = activeCode.value || templateCode.value.trim();
  if (!code) return;
  try {
    const res = await listPrintWidgetOptions(code);
    if (res.code === HttpStatus.SUCCESS && res.data != null) {
      const opts = printTemplateAdapter.mapWidgetOptionsPayload(res.data);
      if (opts != null && opts.length > 0) {
        widgetOptions.value = ensureShapePaletteWidgets(opts);
      }
    }
  } catch {
    widgetOptions.value = ensureShapePaletteWidgets([...defaultWidgetOptions]);
  }
}

async function loadSampleData() {
  const code = activeCode.value || templateCode.value.trim();
  if (!code) return;
  try {
    const res = await getPrintSampleData(code);
    if (res.code === HttpStatus.SUCCESS && res.data != null) {
      const rows = printTemplateAdapter.mapSampleDataPayload(res.data);
      if (rows !== null) {
        printData.value = rows;
      }
    }
  } catch {
    printData.value = [];
  }
}

async function loadFromApi() {
  const codeKw = templateCode.value.trim();
  const nameKw = templateName.value.trim();
  if (!codeKw && !nameKw) {
    ElMessage.warning(t('printDesigner.fillCodeOrName'));
    return;
  }

  if (codeKw) {
    await loadTemplateByCode(codeKw);
    return;
  }

  const candidates = await findTemplateCandidates();
  if (candidates.length === 0) {
    if (codeKw) {
      await loadTemplateByCode(codeKw);
      return;
    }
    ElMessage.warning(t('printDesigner.notFoundTemplate'));
    return;
  }
  if (candidates.length === 1) {
    const only = candidates[0];
    const resolvedFromName = !codeKw || only.templateCode !== codeKw;
    await loadTemplateByCode(String(only.templateCode), resolvedFromName && !!nameKw);
    return;
  }

  pickCandidates.value = candidates;
  pickVisible.value = true;
}

function onPickRow(row: PrintTemplateVo) {
  confirmPick(row);
}

async function confirmPick(row: PrintTemplateVo) {
  if (!row.templateCode) return;
  pickVisible.value = false;
  await loadTemplateByCode(String(row.templateCode), true);
}

function syncRouteQuery() {
  router.replace({
    query: {
      ...route.query,
      code: templateCode.value.trim() || undefined,
      name: templateName.value.trim() || undefined
    }
  });
}

function onCodeChange() {
  syncRouteQuery();
}

function onTemplateNameChange() {
  const name = templateName.value.trim();
  if (name) template.value.title = name;
  syncRouteQuery();
}

async function onSave(payload: PrintTemplate) {
  const code = templateCode.value.trim();
  if (!code) {
    ElMessage.warning(t('printDesigner.saveNeedCode'));
    return;
  }
  const displayName = templateName.value.trim() || String(payload.title ?? '').trim() || t('printDesigner.blankTemplateTitle');
  templateName.value = displayName;
  template.value.title = displayName;
  const payloadToSave: PrintTemplate = { ...payload, title: displayName };
  const vo: PrintTemplateVo = {
    templateCode: code,
    templateName: displayName,
    templateContent: JSON.stringify(payloadToSave),
    widgetOptions: JSON.stringify(widgetOptions.value)
  };
  localSavePrintTemplate(vo);
  activeCode.value = code;
  syncRouteQuery();
  try {
    const res = await savePrintTemplate(vo);
    if (res.code === HttpStatus.SUCCESS) {
      ElMessage.success(t('printDesigner.savedServer'));
    } else {
      ElMessage.success(t('printDesigner.savedLocalOk'));
    }
  } catch {
    ElMessage.success(t('printDesigner.savedLocalLater'));
  }
}

function syncFromRoute() {
  const qCode = route.query.code;
  const qName = route.query.name;
  const codeRaw = Array.isArray(qCode) ? qCode[0] : qCode;
  templateCode.value = codeRaw != null && String(codeRaw).trim() ? String(codeRaw).trim() : '';
  const nameFromRoute = (Array.isArray(qName) ? qName[0] : qName) || '';
  templateName.value = nameFromRoute ? String(nameFromRoute) : '';
}

const routeBootstrappedCode = ref('');

watch(templateName, (name) => {
  const n = String(name ?? '').trim();
  if (n && template.value.title !== n) template.value.title = n;
});

watch(
  () => template.value.title,
  (title) => {
    const n = String(title ?? '').trim();
    if (n && templateName.value.trim() !== n) templateName.value = n;
  }
);

watch(
  () => [route.name, route.query.code] as const,
  ([name, code]) => {
    if (name !== DESIGNER_ROUTE_NAME) return;
    syncFromRoute();
    const c = templateCode.value.trim();
    if (!c) return;
    const codeKey = String(Array.isArray(code) ? code[0] : code ?? '').trim();
    if (codeKey && codeKey === routeBootstrappedCode.value) return;
    routeBootstrappedCode.value = codeKey;
    void loadTemplateByCode(c);
  },
  { immediate: true }
);

onActivated(() => {
  if (!isDesignerRoute()) return;
  syncFromRoute();
  const code = templateCode.value.trim();
  if (code && code !== activeCode.value) void loadTemplateByCode(code);
});
</script>

<style scoped lang="scss">
.print-template-page {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  gap: 0;
}
.print-template-page :deep(.print-designer) {
  flex: 1;
  min-height: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
}

.designer-header {
  flex-shrink: 0;
  margin-bottom: 10px;
  padding: 12px 16px 14px;
  background: linear-gradient(180deg, #fafbfd 0%, #fff 100%);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
}

.designer-header__top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.designer-back {
  padding-left: 4px;
  padding-right: 8px;
  color: var(--el-text-color-regular);
  &:hover {
    color: var(--el-color-primary);
  }
}

.designer-header__title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.designer-header__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.designer-tip-btn {
  color: var(--el-text-color-secondary);
}

.designer-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-extra-light);
}

.designer-toolbar__search {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 280px;
}

.designer-toolbar__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  margin-right: 4px;
}

.designer-field {
  width: 168px;
}
.designer-field--code {
  max-width: 200px;
}
.designer-field--name {
  max-width: 220px;
}

.designer-toolbar__divider {
  width: 1px;
  height: 28px;
  background: var(--el-border-color);
  flex-shrink: 0;
}

.designer-toolbar__data {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.designer-link-btn {
  font-weight: 500;
}

.pick-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.api-config-note {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}
.api-config-note.muted {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

:deep(.designer-lodop-link) {
  margin-left: 4px;
  font-size: 12px;
}

@media (max-width: 768px) {
  .designer-toolbar__divider {
    display: none;
  }
  .designer-field {
    width: 100%;
    max-width: none;
  }
}
</style>
