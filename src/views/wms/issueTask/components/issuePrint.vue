<template>
  <div class="issue-print-host" aria-hidden="true">
    <div class="print-preview-container">
      <div ref="printPreviewContent" class="issue-slip-sheet">
        <header class="sheet-header">
          <div class="slip-operator">
            <span class="slip-label">作业人员</span>
            <span class="slip-operator-name">{{ operatorLabel }}</span>
          </div>
          <div v-if="printContext.demandNo" class="slip-ref">{{ printContext.demandNo }}</div>
        </header>
        <section v-for="(row, index) in printRows" :key="row.id || index" class="issue-slip-preview" :class="{ 'has-divider': index > 0 }">
          <div class="slip-body">
            <div class="slip-row">
              <span class="slip-label">工单号</span>
              <span class="slip-value">{{ row.workOrderNo || '-' }}</span>
            </div>
            <div class="slip-row slip-row-split">
              <span class="slip-label">品号|数量</span>
              <span class="slip-material-code slip-strong">{{ row.materialCode || '-' }}</span>
              <span class="slip-qty">{{ resolvePrintQtyNumber(row) }}</span>
            </div>
            <div class="slip-material-desc">{{ row.materialName || '-' }}</div>
            <div class="slip-row slip-row-dates">
              <span class="slip-date-item"><span class="slip-label">出库日期</span>{{ parseTime(row.issueTime, '{y}-{m}-{d}')}}</span>
              <span class="slip-date-item"><span class="slip-label">生产日期</span>{{ parseTime(row.receiveTime, '{y}-{m}-{d}')}}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, shallowRef } from 'vue';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { resolveLineActualIssueQty } from '@/api/wms/issueTask';
import type { IssueTaskLineVO } from '@/api/wms/issueTask/types';
import { useUserStore } from '@/store/modules/user';
import { parseTime } from '@/utils/ruoyi';

export interface IssuePrintContext {
  demandNo?: string;
}

const PRINT_WIDTH_MM = 80;

// 直接打印 HTML：文字由打印机驱动按矢量渲染，清晰度最高
const ISSUE_PRINT_STYLES = `
  @page {
    size: ${PRINT_WIDTH_MM}mm auto;
    margin: 2mm 3mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  html,
  body {
    background: #fff;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .issue-slip-sheet {
    width: 100%;
    background: #fff;
    color: #000;
    font-family: 'SimHei', 'Microsoft YaHei', 'PingFang SC', sans-serif;
    font-size: 12pt;
    font-weight: normal;
    line-height: 1.4;
  }
  .sheet-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px;
    padding-bottom: 4px;
    margin-bottom: 6px;
    border-bottom: 1px solid #000;
  }
  .slip-operator {
    display: flex;
    align-items: baseline;
    gap: 4px;
    min-width: 0;
  }
  .slip-label {
    flex-shrink: 0;
    font-size: 10pt;
    color: #000;
    white-space: nowrap;
  }
  .slip-operator-name {
    font-size: 12pt;
    line-height: 1.2;
  }
  .slip-ref {
    flex-shrink: 0;
    font-size: 11pt;
  }
  .issue-slip-preview {
    width: 100%;
  }
  .issue-slip-preview.has-divider {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed #000;
  }
  .slip-body {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .slip-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    line-height: 1.3;
  }
  .slip-row-split {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: baseline;
    gap: 6px;
  }
  .slip-value,
  .slip-material-code {
    min-width: 0;
    font-size: 12pt;
    word-break: break-all;
  }
  .slip-strong {
    font-size: 12pt;
  }
  .slip-qty {
    font-size: 13pt;
    text-align: right;
    white-space: nowrap;
  }
  .slip-material-desc {
    font-size: 11pt;
    line-height: 1.4;
    word-break: break-all;
    padding: 1px 0 2px;
  }
  .slip-row-dates {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding-top: 1px;
  }
  .slip-date-item {
    font-size: 10pt;
    white-space: nowrap;
  }
  .slip-date-item .slip-label {
    margin-right: 2px;
  }
`;

const userStore = useUserStore();
const { nickname, name } = storeToRefs(userStore);

const operatorLabel = computed(() => {
  const nick = String(nickname.value || '').trim();
  return nick || name?.value || '-';
});

const printPreviewContent = ref<HTMLElement>();
const printRows = shallowRef<IssueTaskLineVO[]>([]); // 使用shallowRef减少响应式开销
const printContext = ref<IssuePrintContext>({});
const printing = ref(false);

// 缓存格式化结果
const formatDateCache = new Map<string, string>();

const formatPrintDate = (value?: string): string => {
  if (!value) {
    const key = 'today';
    if (formatDateCache.has(key)) return formatDateCache.get(key)!;
    const result = dayjs().format('YYYY-MM-DD');
    formatDateCache.set(key, result);
    return result;
  }

  if (formatDateCache.has(value)) return formatDateCache.get(value)!;
  const parsed = dayjs(value);
  const result = parsed.isValid() ? parsed.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
  if (parsed.isValid()) {
    formatDateCache.set(value, result);
  }
  return result;
};

// 直接使用格式化函数，避免重复调用
const issueDate = formatPrintDate();
const formatIssueDate = () => issueDate;
const formatProductionDate = (value?: string) => formatPrintDate(value);

// 缓存数量解析结果
const qtyCache = new Map<IssueTaskLineVO, string>();

const resolvePrintQtyNumber = (row: IssueTaskLineVO): string => {
  if (qtyCache.has(row)) return qtyCache.get(row)!;
  const qty = resolveLineActualIssueQty(row);
  const result = !Number.isFinite(qty) || qty <= 0 ? '-' : String(qty);
  qtyCache.set(row, result);
  return result;
};

// 直接打印 DOM：无位图中间环节，文字最清晰
const print = async (rows: IssueTaskLineVO[], context: IssuePrintContext = {}) => {
  if (!rows.length || printing.value) return;

  printing.value = true;
  printContext.value = context;
  printRows.value = rows;

  try {
    await nextTick();
    // 使用requestAnimationFrame确保DOM完全渲染
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await nextTick();

    if (!printPreviewContent.value) {
      throw new Error('PRINT_PREVIEW_NOT_READY');
    }
    const printDomHtml = printPreviewContent.value.outerHTML;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('PRINT_WINDOW_BLOCKED');
    }

    printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>备料标签</title>
    <style>${ISSUE_PRINT_STYLES}</style>
  </head>
  <body>
    ${printDomHtml}
    <script>
      window.onload = function() {
        // 先注册关闭回调，再触发打印，确保 afterprint 能命中
        window.onafterprint = function() {
          setTimeout(window.close, 100);
        };
        window.focus();
        window.print();
        // 兜底：print() 在多数浏览器会阻塞到对话框关闭，此处延时关闭窗口
        setTimeout(function() {
          window.close();
        }, 500);
      };
    <\/script>
  </body>
</html>`);
    printWindow.document.close();
  } catch (error) {
    console.error('打印失败:', error);
  } finally {
    printing.value = false;
    // 清理缓存
    qtyCache.clear();
    // 延迟重置打印数据，避免闪烁
    setTimeout(() => {
      printRows.value = [];
    }, 100);
  }
};

// 清理缓存方法
const clearCache = () => {
  formatDateCache.clear();
  qtyCache.clear();
};

defineExpose({ print, printing, clearCache });
</script>

<style scoped lang="scss">
.issue-print-host {
  position: fixed;
  left: -9999px;
  top: 0;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
}

.print-preview-container {
  width: 80mm;
  background: #fff;
}

.issue-slip-sheet {
  width: 80mm;
  padding: 3px 6px 6px;
  background: #fff;
  color: #111;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  transform: translateZ(0);
  will-change: transform;
}

.sheet-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 6px;
  margin-bottom: 8px;
  border-bottom: 1px dashed #bbb;
}

.slip-operator {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}

.slip-operator-name {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
}

.slip-ref {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: #333;
}

.issue-slip-preview {
  width: 100%;
  padding: 0;
}

.issue-slip-preview.has-divider {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #999;
}

.slip-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slip-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1.3;
}

.slip-row-split {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: baseline;
  gap: 6px;
}

.slip-label {
  flex-shrink: 0;
  font-size: 11px;
  color: #555;
  white-space: nowrap;
}

.slip-value,
.slip-material-code {
  min-width: 0;
  font-size: 12px;
  word-break: break-all;
}

.slip-strong {
  font-size: 13px;
  font-weight: 700;
}

.slip-qty {
  font-size: 15px;
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
}

.slip-material-desc {
  font-size: 11px;
  line-height: 1.4;
  color: #222;
  word-break: break-all;
  padding: 1px 0 3px;
}

.slip-row-dates {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding-top: 2px;
}

.slip-date-item {
  font-size: 10px;
  white-space: nowrap;

  .slip-label {
    margin-right: 2px;
  }
}

@media print {
  .issue-print-host {
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
    opacity: 1;
  }
}
</style>
