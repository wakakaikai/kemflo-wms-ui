<template>
  <div class="p-2">
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="font-medium">表单设计</span>
            <el-tag v-if="formDetail.formCode" type="info" effect="plain">{{ formDetail.formCode }}</el-tag>
            <span class="text-[var(--el-text-color-secondary)]">{{ formDetail.formName }}</span>
          </div>
          <div class="flex gap-2">
            <el-button type="primary" :loading="buttonLoading" icon="Check" @click="handleSave">保存配置</el-button>
            <el-button icon="Close" @click="handleClose">关闭</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="16">
        <!-- 左侧可用字段 -->
        <el-col :span="8">
          <el-card shadow="never" class="mb-4">
            <template #header><span>可用字段</span></template>
            <el-empty v-if="!fieldList.length" description="请先为工作表配置字段" :image-size="60" />
            <div v-else class="flex flex-col gap-2">
              <div
                v-for="field in fieldList"
                :key="field.id"
                class="flex items-center justify-between border border-solid border-[var(--el-border-color)] rounded px-3 py-2"
              >
                <div>
                  <div class="font-medium">{{ field.fieldName }}</div>
                  <div class="text-xs text-[var(--el-text-color-secondary)]">{{ field.fieldCode }} / {{ field.fieldType }}</div>
                </div>
                <el-button type="primary" link :disabled="isSelected(field.fieldCode)" @click="addField(field)">添加</el-button>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧表单布局 -->
        <el-col :span="16">
          <el-card shadow="never" class="mb-4">
            <template #header>
              <div class="flex items-center justify-between">
                <span>表单布局</span>
                <el-button type="danger" link :disabled="!selectedFields.length" @click="selectedFields = []">清空</el-button>
              </div>
            </template>
            <el-empty v-if="!selectedFields.length" description="从左侧添加字段到表单" :image-size="60" />
            <el-table v-else :data="selectedFields" border>
              <el-table-column label="字段编码" prop="fieldCode" min-width="120" />
              <el-table-column label="字段名称" prop="fieldName" min-width="120" />
              <el-table-column label="类型" prop="fieldType" width="100" />
              <el-table-column label="必填" width="100">
                <template #default="scope">
                  <el-switch v-model="scope.row.required" :active-value="1" :inactive-value="0" />
                </template>
              </el-table-column>
              <el-table-column label="占位提示" min-width="160">
                <template #default="scope">
                  <el-input v-model="scope.row.placeholder" placeholder="请输入提示" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="160" align="center">
                <template #default="scope">
                  <el-button link type="primary" :disabled="scope.$index === 0" @click="moveField(scope.$index, -1)">上移</el-button>
                  <el-button link type="primary" :disabled="scope.$index === selectedFields.length - 1" @click="moveField(scope.$index, 1)">下移</el-button>
                  <el-button link type="danger" @click="removeField(scope.$index)">移除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <el-card shadow="never">
            <template #header><span>配置预览 (JSON)</span></template>
            <el-input v-model="configPreview" type="textarea" :rows="10" readonly />
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup name="LcFormDesigner" lang="ts">
import { getForm, updateForm } from '@/api/lowcode/form';
import { FormVO } from '@/api/lowcode/form/types';
import { listField } from '@/api/lowcode/field';
import { FieldVO } from '@/api/lowcode/field/types';

interface FormFieldConfig {
  fieldCode: string;
  fieldName: string;
  fieldType: string;
  required: number;
  placeholder?: string;
}

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();

const formId = computed(() => route.params.formId as string);
const formDetail = ref<FormVO>({});
const fieldList = ref<FieldVO[]>([]);
const selectedFields = ref<FormFieldConfig[]>([]);
const buttonLoading = ref(false);

const configPreview = computed(() => {
  return JSON.stringify({ fields: selectedFields.value, layout: 'vertical' }, null, 2);
});

const isSelected = (fieldCode?: string) => {
  return selectedFields.value.some((item) => item.fieldCode === fieldCode);
};

const addField = (field: FieldVO) => {
  if (!field.fieldCode || isSelected(field.fieldCode)) return;
  selectedFields.value.push({
    fieldCode: field.fieldCode,
    fieldName: field.fieldName || field.fieldCode,
    fieldType: field.fieldType || 'TEXT',
    required: field.required ?? 0,
    placeholder: '请输入' + (field.fieldName || field.fieldCode)
  });
};

const removeField = (index: number) => {
  selectedFields.value.splice(index, 1);
};

const moveField = (index: number, step: number) => {
  const target = index + step;
  if (target < 0 || target >= selectedFields.value.length) return;
  const list = [...selectedFields.value];
  const temp = list[index];
  list[index] = list[target];
  list[target] = temp;
  selectedFields.value = list;
};

const loadDetail = async () => {
  const res = await getForm(formId.value);
  formDetail.value = res.data;
  if (formDetail.value.worksheetId) {
    const fieldRes = await listField({ pageNum: 1, pageSize: 999, worksheetId: formDetail.value.worksheetId });
    fieldList.value = (fieldRes.data.rows ?? fieldRes.data ?? []).sort((a: FieldVO, b: FieldVO) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  if (formDetail.value.formConfigJson) {
    try {
      const parsed = JSON.parse(formDetail.value.formConfigJson);
      selectedFields.value = Array.isArray(parsed?.fields) ? parsed.fields : [];
    } catch {
      selectedFields.value = [];
      proxy?.$modal.msgWarning('原表单配置解析失败，已重置为空配置');
    }
  }
};

const handleSave = async () => {
  buttonLoading.value = true;
  try {
    await updateForm({
      id: formDetail.value.id,
      worksheetId: formDetail.value.worksheetId,
      formCode: formDetail.value.formCode,
      formName: formDetail.value.formName,
      status: formDetail.value.status,
      formConfigJson: configPreview.value
    });
    proxy?.$modal.msgSuccess('保存成功');
  } finally {
    buttonLoading.value = false;
  }
};

const handleClose = () => {
  const obj = { path: '/lowcode/form' };
  proxy?.$tab.closeOpenPage(obj);
};

onMounted(() => { loadDetail(); });
</script>