<template>
  <div class="form-fill-page">
    <el-card v-loading="loading" shadow="never" class="fill-card">
      <template #header>
        <div class="fill-header">
          <div>
            <h1>{{ formMeta.formName || '表单填报' }}</h1>
            <el-tag v-if="formMeta.formCode" size="small" type="info">{{ formMeta.formCode }}</el-tag>
          </div>
          <el-button icon="Back" @click="goBack">返回</el-button>
        </div>
      </template>

      <el-result v-if="submitted" icon="success" title="提交成功" sub-title="表单数据已保存">
        <template #extra>
          <el-button type="primary" @click="fillAgain">继续填报</el-button>
          <el-button @click="goBack">返回</el-button>
        </template>
      </el-result>

      <el-result v-else-if="notFound" icon="warning" title="表单不存在" :sub-title="`未找到编码为 ${formCode} 的表单`">
        <template #extra>
          <el-button @click="goBack">返回</el-button>
        </template>
      </el-result>

      <template v-else>
        <FormRenderer v-if="schema.widgets.length" ref="rendererRef" v-model="formModel" :schema="schema" />
        <el-empty v-else description="该表单还没有设计字段" />

        <div class="fill-actions">
          <el-button @click="resetForm">重置</el-button>
          <el-button type="primary" :loading="submitting" :disabled="!schema.widgets.length" @click="submitForm">提交</el-button>
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { FormRenderer, parseSchema } from '@/components/FormDesigner';
import { listForm } from '@/api/lowcode/form';
import type { FormVO } from '@/api/lowcode/form/types';
import { addRecord } from '@/api/lowcode/record';

const route = useRoute();
const router = useRouter();

const formCode = computed(() => String(route.params.formCode || ''));
const loading = ref(false);
const submitting = ref(false);
const submitted = ref(false);
const notFound = ref(false);
const formMeta = ref<FormVO>({});
const schema = ref(parseSchema());
const formModel = ref<Record<string, any>>({});
const rendererRef = ref<InstanceType<typeof FormRenderer>>();

async function loadForm() {
  if (!formCode.value) {
    notFound.value = true;
    return;
  }

  loading.value = true;
  try {
    const res = await listForm({ formCode: formCode.value, pageNum: 1, pageSize: 10 } as any);
    const rows = (res.rows || []) as FormVO[];
    const form = rows.find((item) => item.formCode === formCode.value) || rows[0];
    if (!form) {
      notFound.value = true;
      return;
    }
    formMeta.value = form;
    schema.value = parseSchema(form.formConfigJson);
  } finally {
    loading.value = false;
  }
}

async function submitForm() {
  if (!formMeta.value.worksheetId) {
    ElMessage.error('表单未关联工作表，无法提交');
    return;
  }

  submitting.value = true;
  try {
    await rendererRef.value?.validate();
    await addRecord({
      worksheetId: formMeta.value.worksheetId,
      recordDataJson: JSON.stringify(formModel.value)
    });
    submitted.value = true;
  } finally {
    submitting.value = false;
  }
}

function resetForm() {
  formModel.value = {};
  rendererRef.value?.resetFields();
}

function fillAgain() {
  submitted.value = false;
  resetForm();
}

function goBack() {
  router.push('/lowcode/form');
}

onMounted(loadForm);
</script>

<style scoped lang="scss">
.form-fill-page {
  min-height: 100vh;
  padding: 16px;
  background: #f5f7fa;
}
.fill-card {
  max-width: 960px;
  margin: 0 auto;
}
.fill-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  h1 {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 600;
  }
}
.fill-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
</style>
