<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    class="read-collect-dialog"
    width="92%"
    destroy-on-close
    append-to-body
    @update:model-value="emit('update:visible', $event)"
  >
    <div ref="captureRef" class="read-capture-root">
      <div v-if="rows.length" class="read-summary">
        <div class="summary-item total">
          <span class="summary-label">点位总数</span>
          <span class="summary-value">{{ stats.total }}</span>
        </div>
        <div class="summary-item success">
          <span class="summary-label">成功</span>
          <span class="summary-value">{{ stats.success }}</span>
        </div>
        <div class="summary-item fail">
          <span class="summary-label">失败</span>
          <span class="summary-value">{{ stats.fail }}</span>
        </div>
      </div>

      <el-empty v-if="!rows.length" :description="emptyText" />

      <template v-else>
        <!-- TCP / 结构化报文：安规风格展示 -->
        <div v-if="beautifiedRows.length" class="beautified-list">
          <TcpCollectResultPanel
            v-for="(item, idx) in beautifiedRows"
            :key="`${item.pointCode}-${idx}`"
            :value="item.value"
            :point-name="item.pointName || item.pointCode"
          />
        </div>

        <!-- 普通点位表格 -->
        <el-table
          v-if="plainRows.length"
          :data="plainRows"
          border
          stripe
          max-height="460"
          class="read-result-table"
          table-layout="auto"
        >
          <el-table-column label="点位编码" prop="pointCode" min-width="110" show-overflow-tooltip />
          <el-table-column label="名称" prop="pointName" min-width="90" show-overflow-tooltip />
          <el-table-column label="实际地址" prop="normalizedAddress" min-width="160" show-overflow-tooltip />
          <el-table-column label="采集值" min-width="160" show-overflow-tooltip>
            <template #default="scope">
              <span v-if="scope.row.success" class="collect-value success">
                {{ scope.row.value == null ? '-' : formatCellValue(scope.row.value) }}
              </span>
              <span v-else class="collect-value fail">—</span>
            </template>
          </el-table-column>
          <el-table-column label="结果" width="90" align="center">
            <template #default="scope">
              <span class="result-badge" :class="scope.row.success ? 'is-success' : 'is-fail'">
                {{ scope.row.success ? '成功' : '失败' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="失败原因" prop="error" min-width="140" show-overflow-tooltip />
        </el-table>
      </template>
    </div>

    <template #footer>
      <el-button icon="Camera" :loading="capturing" :disabled="!rows.length" @click="onCapture">截图保存</el-button>
      <el-button type="primary" icon="DataLine" :loading="refreshing" @click="emit('refresh')">重新采集</el-button>
      <el-button @click="emit('update:visible', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PointReadItem } from '@/api/iot/device';
import TcpCollectResultPanel from '@/views/iot/components/TcpCollectResultPanel.vue';
import { formatCollectValue, formatPlainNumber, parseSafetyTestPayload, isStructuredJsonValue } from '@/views/iot/utils/parseTcpCollectValue';
import { buildReadResultFileName, captureReadResultScreenshot } from '@/views/iot/utils/captureReadResult';
import { ElMessage } from 'element-plus';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    rows: PointReadItem[];
    refreshing?: boolean;
    emptyText?: string;
  }>(),
  {
    title: '采集结果',
    refreshing: false,
    emptyText: '暂无点位数据，请先配置点位'
  }
);

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'refresh'): void;
}>();

const capturing = ref(false);
const captureRef = ref<HTMLElement>();

const stats = computed(() => {
  const total = props.rows.length;
  const success = props.rows.filter((r) => r.success).length;
  return { total, success, fail: total - success };
});

const beautifiedRows = computed(() =>
  props.rows.filter((row) => row.success && (parseSafetyTestPayload(row.value) || isStructuredJsonValue(row.value)))
);

const plainRows = computed(() =>
  props.rows.filter((row) => !(row.success && (parseSafetyTestPayload(row.value) || isStructuredJsonValue(row.value))))
);

const formatCellValue = (value: unknown) => {
  if (value == null) return '-';
  if (typeof value === 'number') return formatPlainNumber(value);
  if (typeof value === 'object') return formatCollectValue(value);
  return String(value);
};

const onCapture = async () => {
  if (!captureRef.value || !props.rows.length) return;
  capturing.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 80));
    await captureReadResultScreenshot({
      root: captureRef.value,
      fileName: buildReadResultFileName(props.title || '采集结果')
    });
    ElMessage.success('截图已保存');
  } catch (error) {
    console.error(error);
    ElMessage.error('截图失败');
  } finally {
    capturing.value = false;
  }
};
</script>

<style scoped lang="scss">
.read-capture-root {
  min-height: 120px;
}

.read-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.summary-item {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  min-width: 110px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);

  .summary-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .summary-value {
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
    color: var(--el-text-color-primary);
  }

  &.success .summary-value {
    color: var(--el-color-success);
  }

  &.fail .summary-value {
    color: var(--el-color-danger);
  }
}

.beautified-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 14px;
}

.collect-value {
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;

  &.success {
    color: var(--el-color-success);
  }

  &.fail {
    color: var(--el-text-color-placeholder);
  }
}

.result-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;

  &.is-success {
    color: var(--el-color-success);
    background: var(--el-color-success-light-9);
  }

  &.is-fail {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }
}
</style>

<style lang="scss">
.read-collect-dialog.el-dialog {
  max-width: 1280px;
}

.read-collect-dialog .el-dialog__body {
  padding-top: 10px;
}

.read-collect-dialog .read-result-table {
  width: 100%;
}

.read-collect-dialog:not(.is-capturing) .read-result-table .el-table__header-wrapper,
.read-collect-dialog:not(.is-capturing) .read-result-table .el-table__body-wrapper {
  overflow: auto;
}

.read-collect-dialog .read-result-table .cell {
  line-height: 1.4;
}

.read-collect-dialog.is-capturing .el-dialog__body,
.read-collect-dialog.is-capturing .read-result-table,
.read-collect-dialog.is-capturing .el-table__body-wrapper,
.read-collect-dialog.is-capturing .el-scrollbar,
.read-collect-dialog.is-capturing .el-scrollbar__wrap {
  max-height: none !important;
  height: auto !important;
  overflow: visible !important;
}

.read-collect-dialog.is-capturing .read-result-table .cell {
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
}
</style>
