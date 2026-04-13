<template>
  <el-dialog v-model="dialogVisible" :title="title" width="700px" append-to-body>
    <el-form label-width="auto">
      <el-form-item label="批量输入" :label-width="labelWidth">
        <el-input v-model="inputText" :placeholder="placeholder" :autosize="{ minRows: 2, maxRows: 4 }" type="textarea" clearable @paste="handlePaste" @keyup.enter="handleAddItems" />
      </el-form-item>
      <el-form-item>
        <el-button icon="Plus" type="primary" @click="handleAddItems">添加</el-button>
        <el-button icon="Delete" type="danger" @click="resetInput">清空</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="items" max-height="300" style="margin-top: 10px" border stripe fixed-header fit>
      <el-table-column prop="value" label="条码" width="300" align="left" />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button link type="danger" icon="Delete" @click="removeItem(scope.$index)"></el-button>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  modelValue: boolean;
  title?: string;
  placeholder?: string;
  labelWidth?: string;
  confirmCallback?: (value: string[]) => void;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', value: string[]): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: '批量输入',
  placeholder: '请输入条码，支持多行粘贴',
  labelWidth: '80px'
});

const emit = defineEmits<Emits>();

const dialogVisible = ref(props.modelValue);
const inputText = ref('');
const items = ref<{ id: string; value: string }[]>([]);

watch(
  () => props.modelValue,
  (newValue) => {
    dialogVisible.value = newValue;
  }
);

watch(dialogVisible, (newValue) => {
  emit('update:modelValue', newValue);
});

const handleAddItems = () => {
  if (!inputText.value.trim()) return;

  const lines = inputText.value.split(/[\n\r,;，；]+/).filter((line) => line.trim() !== '');
  const newItems = lines
    .map((line) => line.trim())
    .filter((value) => value !== '')
    .map((value) => ({
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      value
    }));

  // 避免重复添加
  newItems.forEach((newItem) => {
    const exists = items.value.some((item) => item.value === newItem.value);
    if (!exists) {
      items.value.push(newItem);
    }
  });

  inputText.value = ''; // 清空输入框
};

const removeItem = (index: number) => {
  items.value.splice(index, 1);
};

const handleSubmit = () => {
  if (items.value.length === 0) {
    emit('confirm', []);
    dialogVisible.value = false;
    return;
  }

  const values = items.value.map((item) => item.value);
  if (props.confirmCallback) {
    props.confirmCallback(values);
  }
  emit('confirm', values);
  dialogVisible.value = false;
};

const handleCancel = () => {
  emit('cancel');
  dialogVisible.value = false;
};

const handlePaste = (event: ClipboardEvent) => {
  // 处理粘贴事件
  setTimeout(() => {
    // 可以在这里添加额外的粘贴处理逻辑
  }, 0);
};

const resetInput = () => {
  inputText.value = '';
  items.value = [];
};

defineExpose({
  resetInput
});
</script>
