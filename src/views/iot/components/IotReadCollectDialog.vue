<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    class="read-collect-dialog"
    width="100%"
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
          <el-table-column label="原始寄存器" prop="rawRegisters" min-width="180" show-overflow-tooltip />
          <el-table-column label="字节序" prop="byteOrderUsed" width="88" align="center" />
          <el-table-column label="采集值" min-width="140" show-overflow-tooltip>
            <template #default="scope">
              <span v-if="scope.row.success" class="collect-value success">
                {{ formatCellValue(scope.row) }}
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
import html2canvas from 'html2canvas';
import FileSaver from 'file-saver';
import { ElMessage } from 'element-plus';

// ===== iot helpers (inlined) =====
/** TCP Client 采集值解析（安规类 JSON / 普通 JSON / 字符串） */

interface SafetyTestDetailItem {
  testItem: string;
  testValue: string;
  testStatus: string;
}

interface SafetyTestPayload {
  barcode: string;
  testStatus: string;
  datetimeCreated?: string;
  workcenterCode?: string;
  groupCode?: string;
  id?: string;
  details: SafetyTestDetailItem[];
  raw: Record<string, any>;
  rawText: string;
}

function isPassStatus(status?: string): boolean {
  const s = String(status || '')
    .trim()
    .toUpperCase();
  return s === 'PASS' || s === 'OK' || s === 'SUCCESS' || s === '良' || s === '合格';
}

function formatCollectValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'number') return formatPlainNumber(value);
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, (_k, v) => (typeof v === 'number' ? formatPlainNumber(v) : v), 2);
  } catch {
    return String(value);
  }
}

/** 避免 JS Number 科学计数法展示 */
function formatPlainNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const raw = String(value);
  if (!/[eE]/.test(raw)) return raw;
  return value.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 });
}

function asObject(value: unknown): Record<string, any> | null {
  if (value == null) return null;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text.startsWith('{') && !text.startsWith('[')) return null;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, any>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function pick(obj: Record<string, any>, keys: string[]): any {
  for (const key of keys) {
    if (obj[key] != null && obj[key] !== '') return obj[key];
    const found = Object.keys(obj).find((k) => k.toLowerCase() === key.toLowerCase());
    if (found && obj[found] != null && obj[found] !== '') return obj[found];
  }
  return undefined;
}

/** 识别安规/测试设备推送的结构化报文 */
function parseSafetyTestPayload(value: unknown): SafetyTestPayload | null {
  const obj = asObject(value);
  if (!obj) return null;

  const detailRaw = pick(obj, ['SFC_DEVICE_TEST_DETAIL', 'TEST_DETAIL', 'details', 'ITEMS']);
  const hasDetail = Array.isArray(detailRaw);
  const hasBarcode = pick(obj, ['BARCODE', 'barcode', 'SFC', 'sfc']) != null;
  const hasStatus = pick(obj, ['TEST_STATUS', 'testStatus', 'STATUS', 'status']) != null;
  if (!hasDetail && !(hasBarcode && hasStatus)) {
    return null;
  }

  const details: SafetyTestDetailItem[] = (hasDetail ? detailRaw : []).map((item: any) => ({
    testItem: String(pick(item, ['TEST_ITEM', 'testItem', 'ITEM', 'name']) ?? ''),
    testValue: String(pick(item, ['TEST_VALUE', 'testValue', 'VALUE', 'value']) ?? ''),
    testStatus: String(pick(item, ['TEST_STATUS', 'testStatus', 'STATUS', 'result']) ?? '')
  }));

  return {
    barcode: String(pick(obj, ['BARCODE', 'barcode', 'SFC', 'sfc']) ?? ''),
    testStatus: String(pick(obj, ['TEST_STATUS', 'testStatus', 'STATUS', 'status']) ?? ''),
    datetimeCreated: pick(obj, ['DATETIME_CREATED', 'datetimeCreated', 'CREATE_TIME', 'createTime']),
    workcenterCode: pick(obj, ['WORKCENTER_CODE', 'workcenterCode', 'WORK_CENTER']),
    groupCode: pick(obj, ['Group_Code', 'GROUP_CODE', 'groupCode']),
    id: pick(obj, ['id', 'ID']) != null ? String(pick(obj, ['id', 'ID'])) : undefined,
    details,
    raw: obj,
    rawText: formatCollectValue(obj)
  };
}

function isStructuredJsonValue(value: unknown): boolean {
  return !!asObject(value) || (typeof value === 'string' && value.trim().startsWith('{'));
}

type StyleSnapshot = {
  el: HTMLElement;
  styles: Record<string, string>;
};

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

function waitFrames(times = 2) {
  return new Promise<void>((resolve) => {
    const step = (left: number) => {
      if (left <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(() => step(left - 1));
    };
    step(times);
  });
}

/**
 * �Բɼ��������������ͼ����ʱչ���������򣬱���ֻ�ص���������
 */
async function captureReadResultScreenshot(options: {
  root: HTMLElement;
  fileName?: string;
  scale?: number;
  onclone?: (clonedRoot: HTMLElement) => void;
}): Promise<void> {
  const { root, fileName = `�ɼ����_${Date.now()}.png`, scale = 2, onclone } = options;
  const snapshots: StyleSnapshot[] = [];
  const dialog = (root.closest('.el-dialog') as HTMLElement) || root;

  dialog.classList.add('is-capturing');

  const targets = [
    dialog,
    root,
    ...Array.from(
      root.querySelectorAll<HTMLElement>(
        '.el-dialog__body, .el-table, .el-table__inner-wrapper, .el-table__body-wrapper, .el-table__header-wrapper, .el-scrollbar, .el-scrollbar__wrap, .el-scrollbar__view'
      )
    )
  ];

  Array.from(new Set(targets)).forEach((el) => snapshots.push(snapshotAndExpand(el)));
  await waitFrames(2);

  try {
    const canvas = await html2canvas(root, {
      scale,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: Math.max(root.scrollWidth, root.clientWidth),
      windowHeight: Math.max(root.scrollHeight, root.clientHeight),
      onclone: (_doc, clonedElement) => {
        onclone?.(clonedElement as HTMLElement);
      }
    });

    await new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('��ͼ����ʧ��'));
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

function buildReadResultFileName(title?: string) {
  const safeTitle = (title || '�ɼ����').replace(/[\\/:*?"<>|]/g, '_');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${safeTitle}_${stamp}.png`;
}

function isNumericDataType(dataType?: string): boolean {
  const type = (dataType || '').toUpperCase();
  return type === 'INT' || type === 'UINT' || type === 'DINT' || type === 'UDINT' || type === 'FLOAT' || type === 'REAL' || type === 'DOUBLE' || type === 'LREAL' || type === 'WORD' || type === 'DWORD' || type === 'LONG';
}
function resolveScaleFactor(scaleFactor?: number | null): number {
  const n = Number(scaleFactor);
  return Number.isFinite(n) ? n : 1;
}
function applyNumericScale(raw: unknown, dataType?: string, scaleFactor?: number | null): unknown {
  if (raw == null || raw === '') return raw;
  if (!isNumericDataType(dataType)) return raw;
  const scale = resolveScaleFactor(scaleFactor);
  if (scale === 1) return raw;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw * scale;
  if (typeof raw === 'string') {
    const text = raw.trim();
    if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(text)) return raw;
    const num = Number(text);
    if (!Number.isFinite(num)) return raw;
    return num * scale;
  }
  return raw;
}
// ===== end iot helpers =====

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

const formatCellValue = (row: PointReadItem) => {
  if (row.value == null) return '-';
  const scaled = applyNumericScale(row.value, row.dataType, row.scaleFactor);
  if (typeof scaled === 'number') return formatPlainNumber(scaled);
  if (typeof scaled === 'object') return formatCollectValue(scaled);
  return String(scaled);
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
  max-width: 1920px;
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
