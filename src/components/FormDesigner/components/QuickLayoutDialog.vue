<template>
  <el-dialog v-model="visible" title="快速布局" width="560px" append-to-body>
    <p class="hint">选择列布局后，将应用到当前选中的布局容器，或当前字段所在的同一行字段。</p>
    <div class="preset-grid">
      <button v-for="item in presets" :key="item.key" type="button" class="preset-card" @click="choose(item.spans)">
        <div class="preset-preview" :style="{ gridTemplateColumns: item.template }">
          <span v-for="n in item.spans.length" :key="n" />
        </div>
        <span class="preset-label">{{ item.label }}</span>
      </button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
const visible = defineModel<boolean>({ default: false });
const emit = defineEmits<{ apply: [spans: number[]] }>();

const presets = [
  { key: '1', label: '单列', spans: [24], template: '1fr' },
  { key: '2', label: '两列', spans: [12, 12], template: '1fr 1fr' },
  { key: '3', label: '三列', spans: [8, 8, 8], template: '1fr 1fr 1fr' },
  { key: '4', label: '四列', spans: [6, 6, 6, 6], template: '1fr 1fr 1fr 1fr' },
  { key: '1-2', label: '左窄右宽', spans: [8, 16], template: '1fr 2fr' },
  { key: '2-1', label: '左宽右窄', spans: [16, 8], template: '2fr 1fr' }
];

function choose(spans: number[]) {
  emit('apply', spans);
  visible.value = false;
}
</script>

<style scoped>
.hint {
  margin: 0 0 16px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.5;
}
.preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.preset-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  color: var(--el-text-color-primary);
}
.preset-card:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.preset-preview {
  display: grid;
  gap: 6px;
  height: 52px;
}
.preset-preview span {
  display: block;
  border-radius: 3px;
  background: #c6d8f5;
}
.preset-label {
  font-size: 13px;
  text-align: center;
}
</style>
