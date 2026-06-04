<template>
  <div class="app-container print-template-manage">
    <div class="ptm-toolbar">
      <el-input
        v-model="searchKeyword"
        class="ptm-search"
        :placeholder="t('printTemplate.searchPlaceholder')"
        clearable
        @keyup.enter="handleQuery"
        @clear="handleQuery"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <div class="ptm-toolbar-right">
        <span class="ptm-total">{{ t('printTemplate.totalItems', { total }) }}</span>
        <pagination
          v-show="total > 0"
          class="ptm-pagination"
          :total="total"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          :page-sizes="[10, 20, 40]"
          layout="total, prev, pager, next, sizes"
          @pagination="getList"
        />
        <el-select v-model="viewMode" class="ptm-view-select" size="small">
          <el-option :label="t('printTemplate.viewGrid')" value="grid" />
          <el-option :label="t('printTemplate.viewList')" value="list" />
        </el-select>
      </div>
    </div>

    <div v-loading="loading" class="ptm-body">
      <template v-if="viewMode === 'grid'">
        <div class="ptm-grid">
          <div class="ptm-card ptm-card--create" @click="openCreateDialog">
            <div class="ptm-card-create-inner">
              <el-icon class="ptm-create-icon"><Plus /></el-icon>
              <span class="ptm-create-label">{{ t('printTemplate.newTemplate') }}</span>
            </div>
          </div>

          <div
            v-for="row in displayList"
            :key="row.templateCode"
            class="ptm-card"
            :class="{ 'is-favorite': isFav(row.templateCode) }"
            :style="{ '--ptm-card-bg': cardBgColor(row.templateCode) }"
          >
            <div class="ptm-card-body">
              <div class="ptm-card-body-bg">
                <PrintTemplateThumb class="ptm-card-thumb" :template-code="row.templateCode" :row="row" />
                <div class="ptm-card-symbol" aria-hidden="true">
                  <el-icon><Printer /></el-icon>
                </div>
              </div>
              <div class="ptm-card-hover">
                <el-button type="primary" class="ptm-design-btn" @click.stop="handleDesign(row)">
                  {{ t('printTemplate.design') }}
                </el-button>
              </div>
              <el-tag v-if="useLocalOnly" size="small" effect="dark" class="ptm-local-tag">{{ t('printTemplate.localCache') }}</el-tag>
            </div>
            <div class="ptm-card-footer">
              <span class="ptm-card-title" :title="row.templateName || row.templateCode">{{ row.templateName || row.templateCode }}</span>
              <div class="ptm-card-actions" @click.stop>
                <el-tooltip :content="t('printTemplate.preview')" placement="top">
                  <el-button link class="ptm-footer-btn" @click="openPreview(row)">
                    <el-icon><View /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip :content="isFav(row.templateCode) ? t('printTemplate.unfavorite') : t('printTemplate.favorite')" placement="top">
                  <el-button link class="ptm-footer-btn" :class="{ 'is-fav': isFav(row.templateCode) }" @click="toggleFavorite(row)">
                    <el-icon><StarFilled v-if="isFav(row.templateCode)" /><Star v-else /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip :content="t('printTemplate.copy')" placement="top">
                  <el-button link class="ptm-footer-btn" @click="openCopyDialog(row)">
                    <el-icon><CopyDocument /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip :content="t('printTemplate.delete')" placement="top">
                  <el-button link class="ptm-footer-btn is-danger" @click="handleDelete(row)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-if="!loading && displayList.length === 0 && total === 0" class="ptm-empty" :description="t('printTemplate.emptyList')" />
      </template>

      <el-card v-else shadow="never" class="ptm-list-card">
        <template #header>
          <el-button type="primary" plain icon="Plus" @click="openCreateDialog">{{ t('printTemplate.newTemplate') }}</el-button>
        </template>
        <el-table :data="displayList" border stripe>
          <el-table-column :label="t('printTemplate.templateCode')" prop="templateCode" min-width="140" show-overflow-tooltip />
          <el-table-column :label="t('printTemplate.templateName')" prop="templateName" min-width="160" show-overflow-tooltip />
          <el-table-column :label="t('printTemplate.remark')" prop="remark" min-width="120" show-overflow-tooltip />
          <el-table-column :label="t('printTemplate.updateTime')" prop="updateTime" width="180" align="center" />
          <el-table-column :label="t('printTemplate.operations')" width="280" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" icon="View" @click="openPreview(row)">{{ t('printTemplate.preview') }}</el-button>
              <el-button link type="primary" icon="EditPen" @click="handleDesign(row)">{{ t('printTemplate.design') }}</el-button>
              <el-button link type="primary" icon="CopyDocument" @click="openCopyDialog(row)">{{ t('printTemplate.copy') }}</el-button>
              <el-button link type="danger" icon="Delete" @click="handleDelete(row)">{{ t('printTemplate.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <el-dialog v-model="createVisible" :title="t('printTemplate.createDialogTitle')" width="440px" append-to-body @closed="resetCreateForm">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="96px">
        <el-form-item :label="t('printTemplate.templateCode')" prop="templateCode">
          <el-input v-model="createForm.templateCode" :placeholder="t('printTemplate.createCodePh')" />
        </el-form-item>
        <el-form-item :label="t('printTemplate.templateName')" prop="templateName">
          <el-input v-model="createForm.templateName" :placeholder="t('printTemplate.createNamePh')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">{{ t('printTemplate.cancel') }}</el-button>
        <el-button type="primary" @click="submitCreate">{{ t('printTemplate.createAndDesign') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="copyVisible" :title="t('printTemplate.copyDialogTitle')" width="440px" append-to-body @closed="resetCopyForm">
      <el-form ref="copyFormRef" :model="copyForm" :rules="copyRules" label-width="96px">
        <el-form-item :label="t('printTemplate.templateCode')" prop="newCode">
          <el-input v-model="copyForm.newCode" :placeholder="t('printTemplate.copyCodePh')" />
        </el-form-item>
        <el-form-item :label="t('printTemplate.templateName')" prop="newName">
          <el-input v-model="copyForm.newName" :placeholder="t('printTemplate.copyNamePh')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="copyVisible = false">{{ t('printTemplate.cancel') }}</el-button>
        <el-button type="primary" :loading="copyLoading" @click="submitCopy">{{ t('printTemplate.copyConfirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="previewVisible" :title="previewRow?.templateName || previewRow?.templateCode" width="520px" append-to-body>
      <div v-if="previewRow" class="ptm-preview-dialog">
        <div class="ptm-preview-stage">
          <PrintTemplateThumb :template-code="previewRow.templateCode" :row="previewRow" />
        </div>
        <el-descriptions :column="1" border size="small" class="mt-3">
          <el-descriptions-item :label="t('printTemplate.templateCode')">{{ previewRow.templateCode }}</el-descriptions-item>
          <el-descriptions-item :label="t('printTemplate.updateTime')">{{ previewRow.updateTime || '??' }}</el-descriptions-item>
          <el-descriptions-item v-if="previewRow.remark" :label="t('printTemplate.remark')">{{ previewRow.remark }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">{{ t('printTemplate.close') }}</el-button>
        <el-button type="primary" @click="previewRow && handleDesign(previewRow)">{{ t('printTemplate.design') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="PrintTemplateIndex">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus, Search, View, Star, StarFilled, EditPen, Delete, Printer, CopyDocument } from '@element-plus/icons-vue';

/** ??????????????????????? */
const CARD_BG_PALETTE = [
  '#2e8b57',
  '#3d9970',
  '#228b22',
  '#1e7e34',
  '#2d6a4f',
  '#40916c',
  '#087f5b',
  '#0d9488',
  '#0e7490',
  '#0369a1',
  '#1d4ed8',
  '#4338ca'
];

function cardBgColor(code?: string) {
  const s = String(code || 'default');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return CARD_BG_PALETTE[h % CARD_BG_PALETTE.length];
}
import { listPrintTemplate, delPrintTemplate, getPrintTemplate, savePrintTemplate, type PrintTemplateVo } from '@/api/wms/printTemplate';
import { printTemplateAdapter } from '@/config/printTemplate';
import {
  localListPrintTemplates,
  localRemovePrintTemplate,
  localGetPrintTemplate,
  localHasPrintTemplate,
  localCopyPrintTemplate,
  localSavePrintTemplate,
  listFavoriteTemplateCodes,
  isFavoriteTemplate,
  toggleFavoriteTemplate
} from '@/utils/printTemplateStorage';
import { HttpStatus } from '@/enums/RespEnum';
import PrintTemplateThumb from './components/PrintTemplateThumb.vue';

const { t } = useI18n();
const router = useRouter();
const loading = ref(false);
const list = ref<PrintTemplateVo[]>([]);
const total = ref(0);
const useLocalOnly = ref(false);
const viewMode = ref<'grid' | 'list'>('grid');
const searchKeyword = ref('');
const favoriteCodes = ref<string[]>([]);

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  templateCode: '',
  templateName: ''
});

const createVisible = ref(false);
const createFormRef = ref<FormInstance>();
const createForm = reactive({ templateCode: '', templateName: '' });
const createRules: FormRules = {
  templateCode: [{ required: true, message: () => t('printTemplate.createCodeRequired'), trigger: 'blur' }]
};

const previewVisible = ref(false);
const previewRow = ref<PrintTemplateVo | null>(null);

const copyVisible = ref(false);
const copyLoading = ref(false);
const copyFormRef = ref<FormInstance>();
const copySource = ref<PrintTemplateVo | null>(null);
const copyForm = reactive({ newCode: '', newName: '' });
const copyRules: FormRules = {
  newCode: [{ required: true, message: () => t('printTemplate.copyCodeRequired'), trigger: 'blur' }]
};

function syncQueryFromSearch() {
  const kw = searchKeyword.value.trim();
  queryParams.templateCode = kw;
  queryParams.templateName = kw;
}

function filterLocal(rows: PrintTemplateVo[]) {
  const kw = searchKeyword.value.trim().toLowerCase();
  if (!kw) return rows;
  return rows.filter((r) => {
    const code = String(r.templateCode || '').toLowerCase();
    const name = String(r.templateName || '').toLowerCase();
    return code.includes(kw) || name.includes(kw);
  });
}

function paginate<T>(rows: T[]): T[] {
  const start = (queryParams.pageNum - 1) * queryParams.pageSize;
  return rows.slice(start, start + queryParams.pageSize);
}

function sortWithFavorites(rows: PrintTemplateVo[]) {
  const favSet = new Set(favoriteCodes.value);
  return [...rows].sort((a, b) => {
    const af = favSet.has(a.templateCode || '') ? 1 : 0;
    const bf = favSet.has(b.templateCode || '') ? 1 : 0;
    if (af !== bf) return bf - af;
    return (b.updateTime || '').localeCompare(a.updateTime || '');
  });
}

const displayList = computed(() => sortWithFavorites(list.value));

function isFav(code?: string) {
  return code ? isFavoriteTemplate(code) : false;
}

function refreshFavorites() {
  favoriteCodes.value = listFavoriteTemplateCodes();
}

const getList = async () => {
  loading.value = true;
  syncQueryFromSearch();
  try {
    const res = await listPrintTemplate(queryParams);
    if (res.code === HttpStatus.SUCCESS) {
      useLocalOnly.value = false;
      list.value = res.rows ?? [];
      total.value = res.total ?? 0;
    } else {
      throw new Error('api');
    }
  } catch {
    useLocalOnly.value = true;
    const all = localListPrintTemplates().map(
      (r): PrintTemplateVo => ({
        id: r.id,
        templateCode: r.templateCode,
        templateName: r.templateName,
        remark: r.remark,
        updateTime: r.updateTime
      })
    );
    const filtered = filterLocal(all);
    total.value = filtered.length;
    list.value = paginate(filtered);
    if (all.length === 0) {
      ElMessage.info(t('printTemplate.listLocalHint'));
    }
  } finally {
    loading.value = false;
    refreshFavorites();
  }
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const openCreateDialog = () => {
  createForm.templateCode = `tpl_${Date.now()}`;
  createForm.templateName = '';
  createVisible.value = true;
};

const resetCreateForm = () => {
  createFormRef.value?.resetFields();
};

const submitCreate = async () => {
  const valid = await createFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  const code = createForm.templateCode.trim();
  if (!code) return;
  createVisible.value = false;
  router.push({
    path: '/wms/print-template/designer',
    query: { code, name: createForm.templateName.trim() || undefined }
  });
};

function goDesigner(query: { code: string; name?: string }) {
  router.push({
    path: '/wms/print-template/designer',
    query: { code: query.code, name: query.name }
  });
}

const handleDesign = (row: PrintTemplateVo) => {
  if (!row.templateCode) return;
  goDesigner({
    code: String(row.templateCode),
    name: row.templateName ? String(row.templateName) : undefined
  });
};

const openPreview = (row: PrintTemplateVo) => {
  previewRow.value = row;
  previewVisible.value = true;
};

function codeExistsInList(code: string) {
  return list.value.some((r) => String(r.templateCode) === code);
}

async function fetchTemplateVo(code: string): Promise<PrintTemplateVo | null> {
  const local = localGetPrintTemplate(code);
  if (local?.templateContent) return local;
  try {
    const res = await getPrintTemplate(code);
    if (res.code === HttpStatus.SUCCESS && res.data != null) {
      const flat = printTemplateAdapter.mapDetailPayload(res.data);
      const vo = (flat ?? (typeof res.data === 'object' ? res.data : null)) as PrintTemplateVo | null;
      if (vo?.templateContent) return vo;
    }
  } catch {
    /* local fallback */
  }
  return local;
}

const openCopyDialog = (row: PrintTemplateVo) => {
  if (!row.templateCode) return;
  copySource.value = row;
  const src = String(row.templateCode);
  copyForm.newCode = `${src}_copy`;
  copyForm.newName = `${row.templateName || src}${t('printTemplate.copyNameSuffix')}`;
  copyVisible.value = true;
};

const resetCopyForm = () => {
  copyFormRef.value?.resetFields();
  copySource.value = null;
};

const submitCopy = async () => {
  const valid = await copyFormRef.value?.validate().catch(() => false);
  if (!valid || !copySource.value?.templateCode) return;
  const srcCode = String(copySource.value.templateCode);
  const newCode = copyForm.newCode.trim();
  const newName = copyForm.newName.trim() || `${copySource.value.templateName || srcCode}${t('printTemplate.copyNameSuffix')}`;
  if (!newCode) return;
  if (newCode === srcCode) {
    ElMessage.warning(t('printTemplate.copySameCode'));
    return;
  }
  if (localHasPrintTemplate(newCode) || codeExistsInList(newCode)) {
    ElMessage.warning(t('printTemplate.copyCodeExists'));
    return;
  }
  copyLoading.value = true;
  try {
    let vo = localCopyPrintTemplate(srcCode, newCode, newName);
    if (!vo) {
      const src = await fetchTemplateVo(srcCode);
      if (!src?.templateContent) {
        ElMessage.warning(t('printTemplate.copyNoContent'));
        return;
      }
      vo = {
        ...src,
        id: newCode,
        templateCode: newCode,
        templateName: newName,
        templateContent:
          typeof src.templateContent === 'string' ? src.templateContent : JSON.stringify(src.templateContent),
        widgetOptions:
          typeof src.widgetOptions === 'string'
            ? src.widgetOptions
            : src.widgetOptions
              ? JSON.stringify(src.widgetOptions)
              : undefined
      };
      localSavePrintTemplate(vo);
    }
    if (!useLocalOnly.value) {
      try {
        await savePrintTemplate(vo);
      } catch {
        /* keep local copy */
      }
    }
    copyVisible.value = false;
    ElMessage.success(t('printTemplate.copied'));
    getList();
  } finally {
    copyLoading.value = false;
  }
};

const toggleFavorite = (row: PrintTemplateVo) => {
  if (!row.templateCode) return;
  const nowFav = toggleFavoriteTemplate(row.templateCode);
  refreshFavorites();
  ElMessage.success(nowFav ? t('printTemplate.favorited') : t('printTemplate.unfavorited'));
};

const handleDelete = async (row: PrintTemplateVo) => {
  if (!row.templateCode) return;
  try {
    await ElMessageBox.confirm(
      `${t('printTemplate.confirmDeletePrefix')}${row.templateName || row.templateCode}${t('printTemplate.confirmDeleteSuffix')}`,
      t('printTemplate.confirmDeleteTitle'),
      { type: 'warning' }
    );
  } catch {
    return;
  }
  if (!useLocalOnly.value) {
    try {
      const res = await delPrintTemplate(row.templateCode);
      if (res.code !== HttpStatus.SUCCESS) {
        throw new Error('fail');
      }
    } catch {
      /* fallback local */
    }
  }
  localRemovePrintTemplate(row.templateCode);
  ElMessage.success(t('printTemplate.deleted'));
  getList();
};

onMounted(() => {
  refreshFavorites();
  getList();
});
</script>

<style scoped lang="scss">
.print-template-manage {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
}
.ptm-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.ptm-search {
  width: min(320px, 100%);
  flex-shrink: 0;
}
.ptm-toolbar-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}
.ptm-total {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.ptm-pagination {
  margin: 0;
}
.ptm-pagination :deep(.pagination-container) {
  padding: 0;
  background: transparent;
}
.ptm-view-select {
  width: 120px;
}
.ptm-body {
  flex: 1;
  min-height: 200px;
}
.ptm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}
.ptm-card {
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-bg-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s, transform 0.15s;
  display: flex;
  flex-direction: column;
  min-height: 240px;
  &:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
    transform: translateY(-2px);
    .ptm-card-hover {
      opacity: 1;
      pointer-events: auto;
    }
    .ptm-design-btn {
      transform: translateY(0);
      opacity: 1;
    }
    .ptm-card-symbol {
      opacity: 0.35;
    }
  }
  &.is-favorite {
    box-shadow: 0 0 0 2px var(--el-color-warning);
  }
}
.ptm-card--create {
  border: 1px solid #b3d4fc;
  box-shadow: none;
  background: linear-gradient(180deg, #e8f2ff 0%, #f5f9ff 100%);
  cursor: pointer;
  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 14px rgba(64, 158, 255, 0.2);
  }
}
.ptm-card-create-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 220px;
  color: var(--el-color-primary);
}
.ptm-create-icon {
  font-size: 48px;
}
.ptm-create-label {
  font-size: 15px;
  font-weight: 500;
}
.ptm-card-body {
  position: relative;
  flex: 1;
  min-height: 188px;
  background: var(--ptm-card-bg, #2e8b57);
}
.ptm-card-body-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.ptm-card-thumb {
  position: absolute;
  inset: 12px;
  opacity: 0.22;
  filter: saturate(0.6) brightness(1.15);
  pointer-events: none;
  :deep(.print-template-thumb) {
    background: transparent;
    border-radius: 4px;
  }
  :deep(.thumb-stage) {
    background: rgba(255, 255, 255, 0.12);
    box-shadow: none;
  }
}
.ptm-card-symbol {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.92);
  font-size: 56px;
  transition: opacity 0.2s;
  pointer-events: none;
  z-index: 1;
}
.ptm-card-hover {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.38);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}
.ptm-design-btn {
  min-width: 96px;
  padding: 10px 28px;
  font-size: 15px;
  font-weight: 500;
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transform: translateY(6px);
  opacity: 0;
  transition: transform 0.2s ease, opacity 0.2s ease;
  pointer-events: auto;
}
.ptm-local-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
}
.ptm-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  min-height: 44px;
  background: rgba(30, 30, 30, 0.88);
  color: #fff;
}
.ptm-card-title {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ptm-card-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 4px;
}
.ptm-footer-btn {
  color: rgba(255, 255, 255, 0.88) !important;
  padding: 4px;
  &:hover {
    color: #fff !important;
  }
  &.is-fav {
    color: var(--el-color-warning) !important;
  }
  &.is-danger:hover {
    color: var(--el-color-danger-light-3) !important;
  }
}
.ptm-empty {
  margin-top: 48px;
}
.ptm-list-card {
  border-radius: 8px;
}
.ptm-preview-dialog .ptm-preview-stage {
  height: 280px;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f7fa;
}
.mt-3 {
  margin-top: 12px;
}
.ml-2 {
  margin-left: 8px;
}
</style>
