<template>
  <div class="p-2">
    <el-card shadow="hover">
      <template #header>
        <div class="card-head">
          <div>
            <span class="title">{{ formMeta.formName || '表单数据' }}</span>
            <el-tag size="small" type="info">{{ formMeta.formCode }}</el-tag>
          </div>
          <div class="actions">
            <el-button type="primary" plain icon="Plus" @click="openEditor()">新增数据</el-button>
            <el-button icon="Back" @click="goBack">返回</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="recordList" border stripe>
        <el-table-column type="index" width="55" align="center" />
        <el-table-column v-for="col in displayColumns" :key="col.field" :label="col.label" :prop="col.field" min-width="120" show-overflow-tooltip>
          <template #default="scope">{{ formatCell(scope.row, col.field) }}</template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="170" align="center">
          <template #default="scope">{{ proxy?.parseTime(scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="openEditor(scope.row)">编辑</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="editorVisible" :title="editorTitle" width="760px" append-to-body destroy-on-close>
      <FormRenderer v-if="schema.widgets.length" ref="rendererRef" v-model="editorModel" :schema="schema" />
      <el-empty v-else description="请先在设计器中添加字段" />
      <template #footer>
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRecord">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { FormRenderer, parseSchema, type FormWidget } from '@/components/FormDesigner';
import { getForm } from '@/api/lowcode/form';
import type { FormVO } from '@/api/lowcode/form/types';
import { addRecord, delRecord, listRecord, updateRecord } from '@/api/lowcode/record';
import type { RecordQuery, RecordVO } from '@/api/lowcode/record/types';

const { proxy } = getCurrentInstance() as any;
const route = useRoute();
const router = useRouter();

const formId = computed(() => String(route.params.formId || ''));
const loading = ref(false);
const submitting = ref(false);
const total = ref(0);
const recordList = ref<RecordVO[]>([]);
const formMeta = ref<FormVO>({});
const schema = ref(parseSchema());
const editorVisible = ref(false);
const editorModel = ref<Record<string, any>>({});
const currentRecord = ref<RecordVO>();
const rendererRef = ref<InstanceType<typeof FormRenderer>>();

const queryParams = reactive<RecordQuery>({
  pageNum: 1,
  pageSize: 10,
  worksheetId: undefined
});

const displayColumns = computed(() => collectFields(schema.value.widgets).slice(0, 6));
const editorTitle = computed(() => (currentRecord.value?.id ? '编辑数据' : '新增数据'));

function collectFields(widgets: FormWidget[], acc: Array<{ field: string; label: string }> = []) {
  for (const widget of widgets) {
    if (widget.field && !['divider', 'button', 'grid', 'card', 'tabs', 'tabPane'].includes(widget.type)) {
      acc.push({ field: widget.field, label: widget.label });
    }
    if (widget.children?.length) collectFields(widget.children, acc);
  }
  return acc;
}

function parseRecordData(row: RecordVO): Record<string, any> {
  if (!row.recordDataJson) return {};
  try {
    return JSON.parse(row.recordDataJson);
  } catch {
    return {};
  }
}

function formatCell(row: RecordVO, field: string) {
  const data = parseRecordData(row);
  const value = data[field];
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string' && value.startsWith('data:image/')) return '已签名';
  if (typeof value === 'string' && value.includes(',')) return `已上传 ${value.split(',').filter(Boolean).length} 个文件`;
  if (value && typeof value === 'object') {
    if ('text' in value && value.text) return String(value.text);
    if ('image' in value && value.image) return '已上传待识别图片';
    return JSON.stringify(value);
  }
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

async function loadForm() {
  const res = await getForm(formId.value);
  formMeta.value = res.data;
  schema.value = parseSchema(res.data.formConfigJson);
  queryParams.worksheetId = res.data.worksheetId;
}

async function getList() {
  if (!queryParams.worksheetId) return;
  loading.value = true;
  try {
    const res = await listRecord(queryParams);
    recordList.value = res.rows;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function openEditor(row?: RecordVO) {
  currentRecord.value = row;
  editorModel.value = row ? parseRecordData(row) : {};
  editorVisible.value = true;
}

async function submitRecord() {
  if (!queryParams.worksheetId) return;
  submitting.value = true;
  try {
    const payload = {
      id: currentRecord.value?.id,
      worksheetId: queryParams.worksheetId,
      recordDataJson: JSON.stringify(editorModel.value)
    };
    if (currentRecord.value?.id) {
      await updateRecord(payload);
    } else {
      await addRecord(payload);
    }
    ElMessage.success('保存成功');
    editorVisible.value = false;
    getList();
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(row: RecordVO) {
  await ElMessageBox.confirm('是否确认删除该条数据？', '提示', { type: 'warning' });
  await delRecord(row.id!);
  ElMessage.success('删除成功');
  getList();
}

function goBack() {
  router.push('/lowcode/form');
}

onMounted(async () => {
  await loadForm();
  await getList();
});
</script>

<style scoped>
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.title {
  font-size: 16px;
  font-weight: 600;
  margin-right: 8px;
}
.actions {
  display: flex;
  gap: 8px;
}
</style>
