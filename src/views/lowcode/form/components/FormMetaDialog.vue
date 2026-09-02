<template>
  <el-dialog v-model="visible" :title="title" width="520px" append-to-body :close-on-click-modal="false" @closed="onClosed">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
      <el-form-item label="表单名称" prop="formName">
        <el-input v-model="form.formName" placeholder="请输入表单名称" maxlength="64" show-word-limit />
      </el-form-item>
      <el-form-item label="表单编码" prop="formCode">
        <el-input v-model="form.formCode" placeholder="请输入表单编码，如 yong_hu" maxlength="64" :disabled="!!form.id" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio value="0">正常</el-radio>
          <el-radio value="1">停用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { addForm, updateForm } from '@/api/lowcode/form';
import type { FormForm, FormVO } from '@/api/lowcode/form/types';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<FormForm>({
  id: undefined,
  formName: '',
  formCode: '',
  status: '0'
});

const title = computed(() => (form.id ? '编辑表单' : '新增表单'));

const rules: FormRules = {
  formName: [{ required: true, message: '请输入表单名称', trigger: 'blur' }],
  formCode: [
    { required: true, message: '请输入表单编码', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_]*$/, message: '以小写字母开头，仅含小写字母、数字、下划线', trigger: 'blur' }
  ]
};

function open(row?: FormVO) {
  Object.assign(form, {
    id: row?.id,
    formName: row?.formName || '',
    formCode: row?.formCode || '',
    status: row?.status || '0'
  });
  visible.value = true;
}

function onClosed() {
  formRef.value?.resetFields();
}

async function submit() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    if (form.id) {
      await updateForm(form);
    } else {
      await addForm(form);
    }
    visible.value = false;
    emit('success');
  } finally {
    submitting.value = false;
  }
}

defineExpose({ open });
</script>
