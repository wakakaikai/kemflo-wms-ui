<template>
  <el-dialog v-model="visible" title="添加变量" width="480px" append-to-body destroy-on-close @closed="resetForm">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
      <el-form-item label="变量名称" prop="name" required>
        <el-input v-model="form.name" placeholder="例如 data.id">
          <template #prepend>body.</template>
        </el-input>
      </el-form-item>
      <el-form-item label="显示名称" prop="displayName" required>
        <el-input v-model="form.displayName" placeholder="请输入显示名称" />
      </el-form-item>
      <el-form-item label="变量类型" prop="type" required>
        <el-select v-model="form.type" placeholder="请选择" style="width: 100%">
          <el-option v-for="item in HTTP_OUTPUT_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { HTTP_OUTPUT_TYPE_OPTIONS, type HttpOutputVariable } from './httpOutputUtils';

const emit = defineEmits<{
  save: [variable: HttpOutputVariable];
}>();

const visible = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({
  name: '',
  displayName: '',
  type: 'string' as HttpOutputVariable['type'],
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入变量名称', trigger: 'blur' }],
  displayName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择变量类型', trigger: 'change' }],
};

function resetForm() {
  form.name = '';
  form.displayName = '';
  form.type = 'string';
  formRef.value?.clearValidate();
}

function open() {
  resetForm();
  visible.value = true;
}

function handleSave() {
  formRef.value?.validate((valid) => {
    if (!valid) return;
    const field = form.name.trim().replace(/^body\./, '');
    emit('save', {
      name: field,
      displayName: form.displayName.trim(),
      type: form.type,
      sourcePath: `result.body.${field}`,
      description: form.displayName.trim(),
      builtin: false,
    });
    visible.value = false;
  });
}

defineExpose({ open });
</script>
