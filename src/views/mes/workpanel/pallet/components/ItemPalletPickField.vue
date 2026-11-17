<template>
  <div class="item-pallet-pick-field">
    <el-input class="pick-input" readonly :model-value="displayLabel" placeholder="点击右侧搜索图标选择产品" @click="openPick">
      <template #suffix>
        <div class="suffix-icons">
          <el-icon v-if="modelValue" class="clear-icon" @click.stop="clearPick">
            <CircleClose />
          </el-icon>
          <el-icon class="search-icon" title="选择产品" @click.stop="openPick">
            <Search />
          </el-icon>
        </div>
      </template>
    </el-input>
    <ItemPalletPickDialog ref="dialogRef" @confirm="onConfirm" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { CircleClose, Search } from '@element-plus/icons-vue';
import type { WorkPanelItemPalletVO } from '@/api/mes/workpanel/pallet/types';
import ItemPalletPickDialog from './ItemPalletPickDialog.vue';

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined];
  change: [value: string];
  pick: [row: WorkPanelItemPalletVO];
  clear: [];
}>();

const dialogRef = ref<InstanceType<typeof ItemPalletPickDialog>>();
const selectedRow = ref<WorkPanelItemPalletVO | null>(null);

watch(
  () => props.modelValue,
  (val) => {
    if (!val) {
      selectedRow.value = null;
    } else if (selectedRow.value && selectedRow.value.item !== val) {
      selectedRow.value = null;
    }
  }
);

const displayLabel = computed(() => {
  if (!props.modelValue) {
    return '';
  }
  const row = selectedRow.value;
  if (row && row.item === props.modelValue) {
    return row.description ? `${row.item} - ${row.description}` : row.item;
  }
  return props.modelValue;
});

const openPick = () => {
  dialogRef.value?.openDialog(props.modelValue);
};

const clearPick = () => {
  selectedRow.value = null;
  emit('update:modelValue', undefined);
  emit('clear');
};

const onConfirm = (row: WorkPanelItemPalletVO) => {
  selectedRow.value = row;
  emit('update:modelValue', row.item);
  emit('change', row.item);
  emit('pick', row);
};
</script>

<style scoped lang="scss">
.item-pallet-pick-field {
  width: 100%;

  .pick-input {
    width: 100%;
    cursor: pointer;

    :deep(.el-input__wrapper) {
      cursor: pointer;
    }
  }

  .suffix-icons {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .search-icon {
    color: var(--el-color-primary);
    font-size: 16px;
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary-light-3);
    }
  }

  .clear-icon {
    color: var(--el-text-color-placeholder);
    font-size: 15px;
    cursor: pointer;

    &:hover {
      color: var(--el-color-danger);
    }
  }
}
</style>