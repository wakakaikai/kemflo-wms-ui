<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="工作表" prop="worksheetId">
              <el-select v-model="queryParams.worksheetId" placeholder="请选择工作表" filterable clearable @change="handleWorksheetChange" style="width: 200px">
                <el-option v-for="item in worksheetOptions" :key="item.id" :label="item.displayName" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['lowcode:record:add']" type="primary" plain icon="Plus" :disabled="!queryParams.worksheetId" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['lowcode:record:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['lowcode:record:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button icon="Download" :disabled="!queryParams.worksheetId" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-empty v-if="!queryParams.worksheetId" description="请先选择工作表" :image-size="80" />
      <template v-else>
        <el-table v-loading="loading" border :data="recordList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="记录ID" align="center" prop="id" width="180" show-overflow-tooltip />
          <el-table-column v-for="field in fieldList" :key="field.fieldCode" :label="field.fieldName" align="center" min-width="120" show-overflow-tooltip>
            <template #default="scope">
              <span>{{ getRecordValue(scope.row, field.fieldCode) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="版本" align="center" prop="version" width="70" />
          <el-table-column label="创建时间" align="center" prop="createTime" width="180">
            <template #default="scope">
              <span>{{ proxy?.parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="150" fixed="right">
            <template #default="scope">
              <el-tooltip content="修改" placement="top">
                <el-button v-hasPermi="['lowcode:record:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button v-hasPermi="['lowcode:record:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)" />
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
        <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
      </template>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="640px" append-to-body>
      <el-form ref="recordFormRef" :model="dynamicForm" :rules="dynamicRules" label-width="120px">
        <el-form-item v-for="field in fieldList" :key="field.fieldCode" :label="field.fieldName" :prop="field.fieldCode">
          <el-input-number
            v-if="field.fieldType === 'NUMBER' || field.fieldType === 'DECIMAL'"
            v-model="dynamicForm[field.fieldCode]"
            class="w-full" controls-position="right"
          />
          <el-date-picker
            v-else-if="field.fieldType === 'DATE'"
            v-model="dynamicForm[field.fieldCode]" type="date" value-format="YYYY-MM-DD"
            class="w-full" placeholder="请选择日期"
          />
          <el-date-picker
            v-else-if="field.fieldType === 'DATETIME'"
            v-model="dynamicForm[field.fieldCode]" type="datetime" value-format="YYYY-MM-DD HH:mm:ss"
            class="w-full" placeholder="请选择日期时间"
          />
          <el-switch v-else-if="field.fieldType === 'BOOLEAN'" v-model="dynamicForm[field.fieldCode]" />
          <el-input
            v-else-if="field.fieldType === 'TEXTAREA' || field.fieldType === 'JSON'"
            v-model="dynamicForm[field.fieldCode]" type="textarea" :rows="3" :placeholder="'请输入' + field.fieldName"
          />
          <el-input v-else v-model="dynamicForm[field.fieldCode]" :placeholder="'请输入' + field.fieldName" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="LcRecord" lang="ts">
import { listRecord, getRecord, delRecord, addRecord, updateRecord } from '@/api/lowcode/record';
import { RecordForm, RecordQuery, RecordVO } from '@/api/lowcode/record/types';
import { listWorksheet } from '@/api/lowcode/worksheet';
import { WorksheetVO } from '@/api/lowcode/worksheet/types';
import { listField } from '@/api/lowcode/field';
import { FieldVO } from '@/api/lowcode/field/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();

const worksheetOptions = ref<WorksheetVO[]>([]);
const fieldList = ref<FieldVO[]>([]);
const recordList = ref<RecordVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(false);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const currentRecordId = ref<string | number | undefined>();
const currentVersion = ref<number | undefined>();

const queryFormRef = ref<ElFormInstance>();
const recordFormRef = ref<ElFormInstance>();
const dynamicForm = reactive<Record<string, any>>({});
const dynamicRules = reactive<Record<string, any[]>>({});

const dialog = reactive<DialogOption>({ visible: false, title: '' });

const queryParams = reactive<RecordQuery>({
  pageNum: 1,
  pageSize: 10,
  worksheetId: undefined
});

const parseRecordData = (row?: RecordVO) => {
  if (!row?.recordDataJson) return {};
  try { return JSON.parse(row.recordDataJson); } catch { return {}; }
};

const getRecordValue = (row: RecordVO, fieldCode?: string) => {
  if (!fieldCode) return '';
  const data = parseRecordData(row);
  const value = data[fieldCode];
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const resetDynamicForm = () => {
  Object.keys(dynamicForm).forEach((key) => delete dynamicForm[key]);
  Object.keys(dynamicRules).forEach((key) => delete dynamicRules[key]);
  fieldList.value.forEach((field) => {
    if (!field.fieldCode) return;
    dynamicForm[field.fieldCode] = field.defaultValue ?? (field.fieldType === 'BOOLEAN' ? false : undefined);
    if (field.required === 1) {
      dynamicRules[field.fieldCode] = [{ required: true, message: field.fieldName + '不能为空', trigger: 'blur' }];
    }
  });
};

const loadFields = async (worksheetId?: string | number) => {
  fieldList.value = [];
  if (!worksheetId) return;
  const res = await listField({ pageNum: 1, pageSize: 999, worksheetId });
  fieldList.value = (res.data.rows ?? res.data ?? []).sort((a: FieldVO, b: FieldVO) => (a.sortOrder || 0) - (b.sortOrder || 0));
};

const getList = async () => {
  if (!queryParams.worksheetId) { recordList.value = []; total.value = 0; return; }
  loading.value = true;
  try {
    const res = await listRecord(queryParams);
    recordList.value = res.data.rows ?? res.data;
    total.value = res.data.total ?? res.data.length;
  } finally { loading.value = false; }
};

const getWorksheetOptions = async () => {
  const res = await listWorksheet({ pageNum: 1, pageSize: 999, status: '0' });
  worksheetOptions.value = res.data.rows ?? res.data;
};

const handleWorksheetChange = async () => {
  queryParams.pageNum = 1;
  await loadFields(queryParams.worksheetId);
  await getList();
};

const cancel = () => { dialog.visible = false; currentRecordId.value = undefined; currentVersion.value = undefined; };
const handleQuery = async () => { queryParams.pageNum = 1; await loadFields(queryParams.worksheetId); await getList(); };
const resetQuery = () => { queryFormRef.value?.resetFields(); fieldList.value = []; recordList.value = []; total.value = 0; };

const handleSelectionChange = (selection: RecordVO[]) => {
  ids.value = selection.map((item) => item.id!);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

const handleAdd = () => {
  if (!queryParams.worksheetId) { proxy?.$modal.msgWarning('请先选择工作表'); return; }
  if (!fieldList.value.length) { proxy?.$modal.msgWarning('当前工作表尚未配置字段'); return; }
  currentRecordId.value = undefined;
  currentVersion.value = undefined;
  resetDynamicForm();
  dialog.visible = true;
  dialog.title = '添加记录';
};

const handleUpdate = async (row?: RecordVO) => {
  const _id = row?.id || ids.value[0];
  const res = await getRecord(_id);
  currentRecordId.value = res.data.id;
  currentVersion.value = res.data.version;
  resetDynamicForm();
  const data = parseRecordData(res.data);
  Object.keys(data).forEach((key) => { dynamicForm[key] = data[key]; });
  dialog.visible = true;
  dialog.title = '修改记录';
};

const submitForm = () => {
  recordFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    const payload: RecordForm = {
      id: currentRecordId.value,
      worksheetId: queryParams.worksheetId,
      version: currentVersion.value,
      recordDataJson: JSON.stringify({ ...dynamicForm })
    };
    buttonLoading.value = true;
    try {
      if (payload.id) { await updateRecord(payload); }
      else { await addRecord(payload); }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    } finally { buttonLoading.value = false; }
  });
};

const handleDelete = async (row?: RecordVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除记录编号为"' + _ids + '"的数据项？');
  await delRecord(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

const handleExport = () => {
  if (!recordList.value.length) { proxy?.$modal.msgWarning('暂无数据可导出'); return; }
  const headers = fieldList.value.map(f => f.fieldName || f.fieldCode || '');
  const rows = recordList.value.map(r => {
    const data = parseRecordData(r);
    const row: Record<string, any> = { ID: r.id, 版本: r.version, 创建时间: r.createTime };
    fieldList.value.forEach(f => {
      if (f.fieldCode) row[f.fieldName || f.fieldCode] = data[f.fieldCode] ?? '';
    });
    return row;
  });
  const csv = [['ID', '版本', '创建时间', ...headers].join(',')];
  rows.forEach(r => csv.push(Object.values(r).join(',')));
  const blob = new Blob(['﻿' + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'records.csv'; a.click();
  URL.revokeObjectURL(url);
  proxy?.$modal.msgSuccess('导出成功');
};

onMounted(async () => {
  await getWorksheetOptions();
  const worksheetId = route.query.worksheetId as string | undefined;
  if (worksheetId) { queryParams.worksheetId = worksheetId; await handleWorksheetChange(); }
});
</script>