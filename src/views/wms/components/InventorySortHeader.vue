<template>
  <span class="inv-col-sort" :title="hint" @click.stop="$emit('toggle')">
    <span>{{ label }}</span>
    <span class="inv-col-sort-mark" :class="order || 'idle'">
      <span v-if="index" class="inv-col-sort-idx">{{ index }}</span>
      <span class="inv-col-sort-caret">{{ caret }}</span>
    </span>
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string;
  order?: 'asc' | 'desc' | '';
  index?: number;
}>();

defineEmits<{
  (e: 'toggle'): void;
}>();

const caret = computed(() => {
  if (props.order === 'asc') return '\u2191';
  if (props.order === 'desc') return '\u2193';
  return '\u2195';
});

const hint = computed(() => {
  if (props.order === 'asc') return '当前升序，再次点击改为降序；点搜索后生效';
  if (props.order === 'desc') return '当前降序，再次点击取消该列排序；点搜索后生效';
  return '点击加入排序（升序），可依次点多列；点搜索后生效';
});
</script>

<style scoped>
.inv-col-sort {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
  line-height: 1.2;
}

.inv-col-sort-mark {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #c0c4cc;
}

.inv-col-sort-mark.asc,
.inv-col-sort-mark.desc {
  color: var(--el-color-primary);
}

.inv-col-sort-idx {
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  border-radius: 7px;
  font-size: 11px;
  line-height: 14px;
  text-align: center;
  background: var(--el-color-primary);
  color: #fff;
}

.inv-col-sort-caret {
  font-size: 11px;
}
</style>
