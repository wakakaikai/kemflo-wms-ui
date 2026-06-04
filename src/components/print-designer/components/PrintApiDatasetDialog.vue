<template>
  <el-dialog
    v-model="visible"
    :title="t('printDesigner.apiDataset.title')"
    width="min(960px, 96vw)"
    append-to-body
    class="print-api-dataset-dialog"
    @closed="onDialogClosed"
  >
    <div class="pds-dialog-body">
      <el-form label-position="top" size="small" class="pds-form">
        <el-row :gutter="12">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item :label="t('printDesigner.apiDataset.code')" required>
              <el-input v-model="ds.code" :placeholder="t('printDesigner.apiDataset.codePh')" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item :label="t('printDesigner.apiDataset.dsName')" required>
              <el-input v-model="ds.name" :placeholder="t('printDesigner.apiDataset.namePh')" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item :label="t('printDesigner.apiDataset.method')">
              <el-select v-model="ds.method" class="w100">
                <el-option label="GET" value="get" />
                <el-option label="POST" value="post" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-checkbox v-model="ds.isCollection">{{ t('printDesigner.apiDataset.isCollection') }}</el-checkbox>
          </el-col>
          <el-col :span="12">
            <el-checkbox v-model="ds.isPaginated">{{ t('printDesigner.apiDataset.isPaginated') }}</el-checkbox>
          </el-col>
        </el-row>
        <el-form-item :label="t('printDesigner.apiDataset.converter')">
          <el-input v-model="ds.converter" :placeholder="t('printDesigner.apiDataset.converterPh')" />
        </el-form-item>
        <el-form-item :label="t('printDesigner.apiDataset.url')" required>
          <div class="pds-url-row">
            <el-input v-model="ds.url" type="textarea" :rows="2" :placeholder="t('printDesigner.apiDataset.urlPh')" />
            <div class="pds-url-actions">
              <el-button type="primary" :loading="parsing" @click="onParse">{{ t('printDesigner.apiDataset.parseBtn') }}</el-button>
              <el-button :disabled="!lastRows.length" @click="applyPreview">{{ t('printDesigner.apiDataset.applyPreview') }}</el-button>
            </div>
          </div>
          <div class="pds-hint">{{ t('printDesigner.apiDataset.urlHint') }}</div>
        </el-form-item>
      </el-form>

      <el-tabs v-model="tab" type="border-card" class="pds-tabs">
        <el-tab-pane :label="t('printDesigner.apiDataset.tabFields')" name="fields">
          <el-table :data="ds.fields" border stripe size="small" max-height="280">
            <el-table-column type="index" width="48" />
            <el-table-column :label="t('printDesigner.apiDataset.colFieldName')" min-width="110">
              <template #default="{ row }">
                <el-input v-model="row.fieldName" />
              </template>
            </el-table-column>
            <el-table-column :label="t('printDesigner.apiDataset.colSort')" width="88">
              <template #default="{ row }">
                <el-input-number v-model="row.sort" :min="0" controls-position="right" class="w100" />
              </template>
            </el-table-column>
            <el-table-column :label="t('printDesigner.apiDataset.colFieldText')" min-width="110">
              <template #default="{ row }">
                <el-input v-model="row.fieldText" />
              </template>
            </el-table-column>
            <el-table-column :label="t('printDesigner.apiDataset.colType')" width="110">
              <template #default="{ row }">
                <el-select v-model="row.type" class="w100">
                  <el-option label="string" value="string" />
                  <el-option label="number" value="number" />
                  <el-option label="date" value="date" />
                  <el-option label="boolean" value="boolean" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column :label="t('printDesigner.apiDataset.colDict')" width="100">
              <template #default="{ row }">
                <el-input v-model="row.dictCode" />
              </template>
            </el-table-column>
            <el-table-column :label="t('printDesigner.apiDataset.colQuery')" width="72" align="center">
              <template #default="{ row }">
                <el-checkbox v-model="row.query" />
              </template>
            </el-table-column>
            <el-table-column :label="t('printDesigner.apiDataset.colQueryMode')" width="110">
              <template #default="{ row }">
                <el-input v-model="row.queryMode" />
              </template>
            </el-table-column>
            <el-table-column :label="t('printDesigner.apiDataset.colQueryDefault')" width="110">
              <template #default="{ row }">
                <el-input v-model="row.queryDefault" />
              </template>
            </el-table-column>
            <el-table-column :label="t('printDesigner.apiDataset.colQueryDateFmt')" width="120">
              <template #default="{ row }">
                <el-input v-model="row.queryDateFormat" />
              </template>
            </el-table-column>
            <el-table-column :label="t('printDesigner.apiDataset.colParamCfg')" width="100">
              <template #default="{ row }">
                <el-input v-model="row.paramConfig" />
              </template>
            </el-table-column>
            <el-table-column :label="t('printDesigner.apiDataset.ops')" width="72" fixed="right">
              <template #default="{ $index }">
                <el-button link type="danger" @click="removeField($index)">{{ t('printDesigner.apiDataset.del') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button class="mt-2" size="small" @click="addField">{{ t('printDesigner.apiDataset.addField') }}</el-button>
        </el-tab-pane>
        <el-tab-pane :label="t('printDesigner.apiDataset.tabParams')" name="params">
          <el-table :data="ds.params" border stripe size="small" max-height="260">
            <el-table-column type="index" width="48" />
            <el-table-column :label="t('printDesigner.apiDataset.paramName')" min-width="120">
              <template #default="{ row }">
                <el-input v-model="row.name" placeholder="orderId" />
              </template>
            </el-table-column>
            <el-table-column :label="t('printDesigner.apiDataset.paramLabel')" min-width="120">
              <template #default="{ row }">
                <el-input v-model="row.label" />
              </template>
            </el-table-column>
            <el-table-column :label="t('printDesigner.apiDataset.paramDefault')" min-width="140">
              <template #default="{ row }">
                <el-input v-model="row.defaultValue" />
              </template>
            </el-table-column>
            <el-table-column :label="t('printDesigner.apiDataset.paramRequired')" width="88" align="center">
              <template #default="{ row }">
                <el-checkbox v-model="row.required" />
              </template>
            </el-table-column>
            <el-table-column :label="t('printDesigner.apiDataset.ops')" width="72" fixed="right">
              <template #default="{ $index }">
                <el-button link type="danger" @click="removeParam($index)">{{ t('printDesigner.apiDataset.del') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button class="mt-2" size="small" @click="addParam">{{ t('printDesigner.apiDataset.addParam') }}</el-button>
        </el-tab-pane>
      </el-tabs>
      <p class="pds-footer-note">{{ t('printDesigner.apiDataset.saveNote') }}</p>
    </div>
    <template #footer>
      <el-button type="primary" @click="visible = false">{{ t('printDesigner.dialogDone') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import type { PrintTemplate, PrintApiDatasetField, PrintApiDatasetParam } from '../types';
import { createEmptyPrintApiDataset, fetchPrintDatasetRows, inferDatasetFields } from '../utils/printApiDataset';

const visible = defineModel<boolean>({ default: false });

const props = defineProps<{
  printTemplate: PrintTemplate;
}>();

const emit = defineEmits<{
  applyPreviewRows: [rows: Record<string, unknown>[]];
}>();

const { t } = useI18n();

const tab = ref('fields');
const parsing = ref(false);
const lastRows = ref<Record<string, unknown>[]>([]);

function ensureDataset() {
  if (!props.printTemplate.apiDataset) {
    props.printTemplate.apiDataset = createEmptyPrintApiDataset();
  }
}

watch(
  () => props.printTemplate,
  () => ensureDataset(),
  { immediate: true, deep: false }
);

watch(visible, (v) => {
  if (v) ensureDataset();
});

const ds = computed(() => {
  ensureDataset();
  return props.printTemplate.apiDataset!;
});

function onDialogClosed() {
  tab.value = 'fields';
}

async function onParse() {
  ensureDataset();
  const d = ds.value;
  if (!d.url?.trim()) {
    ElMessage.warning(t('printDesigner.apiDataset.needUrl'));
    return;
  }
  parsing.value = true;
  try {
    const rows = await fetchPrintDatasetRows(d);
    lastRows.value = rows;
    if (!rows.length) {
      ElMessage.warning(t('printDesigner.apiDataset.emptyRows'));
      return;
    }
    const sample = rows[0];
    d.fields = inferDatasetFields(sample);
    ElMessage.success(t('printDesigner.apiDataset.parseOk', { count: rows.length }));
  } catch (e) {
    console.error(e);
    ElMessage.error(t('printDesigner.apiDataset.parseFail'));
  } finally {
    parsing.value = false;
  }
}

function applyPreview() {
  if (!lastRows.value.length) return;
  emit('applyPreviewRows', [...lastRows.value]);
}

function addField() {
  const list = ds.value.fields;
  const nextSort = list.length ? Math.max(...list.map((x) => x.sort || 0)) + 1 : 1;
  const empty: PrintApiDatasetField = {
    fieldName: '',
    sort: nextSort,
    fieldText: '',
    type: 'string',
    dictCode: '',
    query: false,
    queryMode: '',
    queryDefault: '',
    queryDateFormat: '',
    paramConfig: ''
  };
  list.push(empty);
}

function removeField(idx: number) {
  ds.value.fields.splice(idx, 1);
}

function addParam() {
  const row: PrintApiDatasetParam = { name: '', label: '', defaultValue: '', required: false };
  ds.value.params.push(row);
}

function removeParam(idx: number) {
  ds.value.params.splice(idx, 1);
}
</script>

<style scoped lang="scss">
.pds-dialog-body {
  max-height: calc(100vh - 220px);
  overflow-y: auto;
  padding-right: 4px;
}
.pds-form {
  padding-right: 4px;
}
.pds-url-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  width: 100%;
}
.pds-url-row .el-textarea {
  flex: 1;
}
.pds-url-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}
.pds-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.45;
}
.pds-tabs {
  margin-top: 12px;
}
.mt-2 {
  margin-top: 8px;
}
.w100 {
  width: 100%;
}
.pds-footer-note {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

<style lang="scss">
.print-api-dataset-dialog .el-dialog__body {
  padding-top: 8px;
}
</style>
