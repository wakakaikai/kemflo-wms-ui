<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    class="tcp-collect-dialog"
    width="92%"
    destroy-on-close
    append-to-body
    @update:model-value="emit('update:visible', $event)"
  >
    <div ref="captureRef" class="tcp-collect-root">
      <div class="tcp-collect-summary">
        <div class="summary-item total">
          <span class="summary-label">映射点位</span>
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

      <el-row :gutter="16">
        <el-col :span="10">
          <div class="panel-title">实际采集 JSON</div>
          <pre class="raw-json">{{ rawJsonText }}</pre>
        </el-col>
        <el-col :span="14">
          <div class="panel-title">数据解析结果</div>
          <el-empty v-if="!points.length" description="暂无映射点位，请先在「数据解析」中配置 V.GetData(...) " />
          <el-table v-else :data="points" border stripe max-height="480" class="map-table" table-layout="auto">
            <el-table-column label="名称" prop="pointCode" min-width="100" show-overflow-tooltip>
              <template #default="scope">
                <code>{{ scope.row.pointCode }}</code>
              </template>
            </el-table-column>
            <el-table-column label="描述" prop="pointName" min-width="110" show-overflow-tooltip />
            <el-table-column label="数据地址" prop="tagAddress" min-width="160" show-overflow-tooltip>
              <template #default="scope">
                <code>{{ scope.row.tagAddress || '—' }}</code>
              </template>
            </el-table-column>
            <el-table-column label="采集值" min-width="140" show-overflow-tooltip>
              <template #default="scope">
                <span v-if="scope.row.success" class="val success">{{ formatValue(scope.row.value) }}</span>
                <span v-else class="val fail">—</span>
              </template>
            </el-table-column>
            <el-table-column label="结果" width="88" align="center">
              <template #default="scope">
                <span class="result-badge" :class="scope.row.success ? 'is-success' : 'is-fail'">
                  {{ scope.row.success ? '成功' : '失败' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="失败原因" prop="error" min-width="120" show-overflow-tooltip />
          </el-table>
        </el-col>
      </el-row>
    </div>

    <template #footer>
      <el-button icon="Camera" :loading="capturing" :disabled="!hasContent" @click="onCapture">截图保存</el-button>
      <el-button type="primary" icon="DataLine" :loading="refreshing" @click="emit('refresh')">重新采集</el-button>
      <el-button @click="emit('update:visible', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PointReadItem } from '@/api/iot/device';
import html2canvas from 'html2canvas';
import FileSaver from 'file-saver';
import { ElMessage } from 'element-plus';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    rawPayload?: unknown;
    points?: PointReadItem[];
    refreshing?: boolean;
  }>(),
  {
    title: 'TCP 采集结果',
    points: () => [],
    refreshing: false
  }
);

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'refresh'): void;
}>();

const capturing = ref(false);
const captureRef = ref<HTMLElement>();

const points = computed(() => props.points || []);
const stats = computed(() => {
  const total = points.value.length;
  const success = points.value.filter((r) => r.success).length;
  return { total, success, fail: total - success };
});

const rawJsonText = computed(() => {
  if (props.rawPayload == null) return '（无数据）';
  if (typeof props.rawPayload === 'string') {
    try {
      return JSON.stringify(JSON.parse(props.rawPayload), null, 2);
    } catch {
      return props.rawPayload;
    }
  }
  try {
    return JSON.stringify(props.rawPayload, null, 2);
  } catch {
    return String(props.rawPayload);
  }
});

const hasContent = computed(() => props.rawPayload != null || points.value.length > 0);

const formatValue = (value: unknown) => {
  if (value == null) return '—';
  if (typeof value === 'number') {
    const raw = String(value);
    if (!/[eE]/.test(raw)) return raw;
    return value.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 });
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

type StyleSnapshot = { el: HTMLElement; styles: Record<string, string> };
const STYLE_KEYS = ['maxHeight', 'height', 'overflow', 'overflowX', 'overflowY'] as const;

function snapshotAndExpand(el: HTMLElement): StyleSnapshot {
  const styles: Record<string, string> = {};
  STYLE_KEYS.forEach((key) => {
    styles[key] = el.style[key];
  });
  el.style.maxHeight = 'none';
  el.style.height = 'auto';
  el.style.overflow = 'visible';
  el.style.overflowX = 'visible';
  el.style.overflowY = 'visible';
  return { el, styles };
}

function restoreStyles(snapshots: StyleSnapshot[]) {
  snapshots.forEach(({ el, styles }) => {
    STYLE_KEYS.forEach((key) => {
      el.style[key] = styles[key] || '';
    });
  });
}

async function captureScreenshot(root: HTMLElement, fileName: string) {
  const snapshots: StyleSnapshot[] = [];
  const dialog = (root.closest('.el-dialog') as HTMLElement) || root;
  dialog.classList.add('is-capturing');
  const targets = [
    dialog,
    root,
    ...Array.from(root.querySelectorAll<HTMLElement>('.el-dialog__body, .el-table, .el-table__body-wrapper, .raw-json'))
  ];
  Array.from(new Set(targets)).forEach((el) => snapshots.push(snapshotAndExpand(el)));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  try {
    const canvas = await html2canvas(root, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    await new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('截图生成失败'));
          return;
        }
        FileSaver.saveAs(blob, fileName);
        resolve();
      }, 'image/png');
    });
  } finally {
    restoreStyles(snapshots);
    dialog.classList.remove('is-capturing');
  }
}

const onCapture = async () => {
  if (!captureRef.value || !hasContent.value) return;
  capturing.value = true;
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const safeTitle = (props.title || 'TCP采集').replace(/[\\/:*?"<>|]/g, '_');
    await captureScreenshot(captureRef.value, `${safeTitle}_${stamp}.png`);
    ElMessage.success('截图已保存');
  } catch (e) {
    console.error(e);
    ElMessage.error('截图失败');
  } finally {
    capturing.value = false;
  }
};
</script>

<style scoped lang="scss">
.tcp-collect-root {
  min-height: 160px;
}

.tcp-collect-summary {
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
  }

  &.success .summary-value {
    color: var(--el-color-success);
  }

  &.fail .summary-value {
    color: var(--el-color-danger);
  }
}

.panel-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.raw-json {
  margin: 0;
  max-height: 480px;
  overflow: auto;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  background: #0f172a;
  color: #e2e8f0;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-all;
}

.val {
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
.tcp-collect-dialog.el-dialog {
  max-width: 1280px;
}

.tcp-collect-dialog.is-capturing .el-dialog__body,
.tcp-collect-dialog.is-capturing .raw-json,
.tcp-collect-dialog.is-capturing .el-table__body-wrapper {
  max-height: none !important;
  height: auto !important;
  overflow: visible !important;
}
</style>
