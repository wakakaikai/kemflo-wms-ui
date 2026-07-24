<template>
  <div class="prep-rec-print-host" aria-hidden="true">
    <div ref="printPreviewContent" class="prep-rec-sheet">
      <header class="sheet-header">
        <div class="sheet-title">备料需求打印单</div>
        <div class="sheet-meta">
          <span>打印人：{{ operatorLabel }}</span>
          <span>打印时间：{{ printTime }}</span>
        </div>
      </header>
      <table class="print-table">
        <thead>
          <tr>
            <th>工单号</th>
            <th>物料编码</th>
            <th>物料名称</th>
            <th>需求数量</th>
            <th>实发数量</th>
            <th>单位</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in printRows" :key="index">
            <td>{{ row.workOrderNo || '-' }}</td>
            <td>{{ row.materialCode || '-' }}</td>
            <td class="col-material-name">{{ row.materialName || '-' }}</td>
            <td class="col-qty">{{ row.issueQtyText }}</td>
            <td class="col-qty">{{ row.actualIssueQtyText }}</td>
            <td class="col-center">{{ row.unit || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, shallowRef } from 'vue';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/store/modules/user';
import type { WorkOrderPrepLocationRecVO } from '@/api/wms/workOrderPrepLocationRec/types';

/** 打印表格行：超发时同一明细拆分为「工单领料」与「移转」两行 */
interface PrepRecPrintRow {
  workOrderNo?: string;
  materialCode?: string;
  materialName?: string;
  unit?: string;
  issueQtyText: string;
  actualIssueQtyText: string;
  typeLabel: '工单领料' | '移转';
  qtyText: string;
}

const PRINT_STYLES = `
  @page {
    size: A4 portrait;
    margin: 10mm;
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
  .prep-rec-sheet {
    width: 100%;
    font-family: 'SimHei', 'Microsoft YaHei', 'PingFang SC', sans-serif;
    font-size: 10.5pt;
    color: #000;
  }
  .sheet-header {
    margin-bottom: 4mm;
  }
  .sheet-title {
    font-size: 15pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 2mm;
  }
  .sheet-meta {
    display: flex;
    justify-content: space-between;
    font-size: 9pt;
  }
  .print-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: auto;
  }
  .print-table th,
  .print-table td {
    border: 1px solid #000;
    padding: 1.5mm 2mm;
    font-size: 10pt;
    line-height: 1.4;
    word-break: break-all;
    vertical-align: middle;
  }
  .print-table th {
    text-align: center;
    font-weight: bold;
    background: #f0f0f0;
  }
  .print-table thead {
    display: table-header-group;
  }
  .print-table tr {
    page-break-inside: avoid;
  }
  .col-center {
    text-align: center;
  }
  .col-qty {
    text-align: right;
    white-space: nowrap;
  }
  .col-strong {
    font-weight: bold;
  }
`;

const userStore = useUserStore();
const { nickname, name } = storeToRefs(userStore);

const operatorLabel = computed(() => {
  const nick = String(nickname.value || '').trim();
  return nick || name?.value || '-';
});

const printPreviewContent = ref<HTMLElement>();
const printRows = shallowRef<PrepRecPrintRow[]>([]);
const printTime = ref('');
const printing = ref(false);

const normalizeQty = (value?: number | string): number => {
  if (value == null || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
};

const formatQtyText = (value: number): string => {
  return Number.isFinite(value) ? String(Math.round(value * 10000) / 10000) : '-';
};

/** 超发拆行：实发 > 需求时拆为「工单领料=需求数量」与「移转=实发-需求」两行 */
const buildPrintRows = (rows: WorkOrderPrepLocationRecVO[]): PrepRecPrintRow[] => {
  const result: PrepRecPrintRow[] = [];
  rows.forEach((row) => {
    const issueQty = normalizeQty(row.issueQty);
    // 实发未填写时按需求数量处理
    const actualQty = normalizeQty(row.actualIssueQty) || issueQty;
    const base = {
      workOrderNo: row.workOrderNo,
      materialCode: row.materialCode,
      materialName: row.materialName,
      unit: row.inventoryUnit,
      issueQtyText: formatQtyText(issueQty),
      actualIssueQtyText: formatQtyText(actualQty)
    };
    if (actualQty > issueQty && issueQty > 0) {
      result.push({ ...base, typeLabel: '工单领料', qtyText: formatQtyText(issueQty) });
      result.push({ ...base, typeLabel: '移转', qtyText: formatQtyText(actualQty - issueQty) });
    } else {
      result.push({ ...base, typeLabel: '工单领料', qtyText: formatQtyText(actualQty) });
    }
  });
  return result;
};

const print = async (rows: WorkOrderPrepLocationRecVO[]) => {
  if (!rows.length || printing.value) return;

  printing.value = true;
  printTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
  printRows.value = buildPrintRows(rows);

  try {
    await nextTick();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await nextTick();

    if (!printPreviewContent.value) {
      throw new Error('PRINT_PREVIEW_NOT_READY');
    }
    const printDomHtml = printPreviewContent.value.outerHTML;
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>备料发料打印单</title>
    <style>${PRINT_STYLES}</style>
  </head>
  <body>
    ${printDomHtml}
    <script>
      window.onload = function() {
        window.onafterprint = function() {
          setTimeout(window.close, 100);
        };
        window.focus();
        window.print();
        setTimeout(function() {
          window.close();
        }, 500);
      };
    <\/script>
  </body>
</html>`;

    // 用 UTF-8 Blob 打开，避免 document.write 编码问题
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (!printWindow) {
      URL.revokeObjectURL(url);
      throw new Error('PRINT_WINDOW_BLOCKED');
    }
    printWindow.addEventListener('beforeunload', () => URL.revokeObjectURL(url));
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } finally {
    printing.value = false;
    setTimeout(() => {
      printRows.value = [];
    }, 100);
  }
};

defineExpose({ print, printing });
</script>

<style scoped>
.prep-rec-print-host {
  position: fixed;
  left: -9999px;
  top: 0;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
}

.prep-rec-sheet {
  width: 190mm;
  background: #fff;
  color: #000;
}
</style>
