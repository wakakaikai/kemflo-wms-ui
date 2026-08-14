<template>
  <el-form-item label="排序" class="inv-sort-form-item">
    <div class="inv-sort-bar">
      <div v-for="(field, index) in fields" :key="field.key" class="inv-sort-item">
        <el-checkbox v-model="field.enabled" @change="emitChange">{{ field.label }}</el-checkbox>
        <el-select v-model="field.order" size="small" style="width: 78px" :disabled="!field.enabled" @change="emitChange">
          <el-option label="升序" value="asc" />
          <el-option label="降序" value="desc" />
        </el-select>
        <el-button-group>
          <el-button size="small" :disabled="index === 0" @click="move(index, -1)">↑</el-button>
          <el-button size="small" :disabled="index === fields.length - 1" @click="move(index, 1)">↓</el-button>
        </el-button-group>
      </div>
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import type { InventorySortField } from './inventorySort';

const props = defineProps<{
  modelValue: InventorySortField[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: InventorySortField[]): void;
}>();

const fields = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const emitChange = () => {
  emit('update:modelValue', fields.value.map((f) => ({ ...f })));
};

const move = (index: number, delta: number) => {
  const next = fields.value.map((f) => ({ ...f }));
  const target = index + delta;
  if (target < 0 || target >= next.length) return;
  const tmp = next[index];
  next[index] = next[target];
  next[target] = tmp;
  emit('update:modelValue', next);
};
</script>

<style scoped lang="scss">
.inv-sort-form-item {
  display: flex;
  align-items: flex-start;
}

.inv-sort-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  max-width: 960px;
}

.inv-sort-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
}
</style>
