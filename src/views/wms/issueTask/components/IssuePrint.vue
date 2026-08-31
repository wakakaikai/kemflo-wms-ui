<template>
  <div class="issue-print-host" aria-hidden="true">
    <div class="print-preview-container">
      <div ref="printPreviewContent" class="issue-print-content">
        <div v-if="normalPrintRows.length" class="issue-slip-sheet">
          <header class="sheet-header">
            <div class="slip-header-main">
              <div class="slip-header-line slip-header-inline">
                <span class="slip-label">作业人员</span>
                <span class="slip-operator-name">{{ operatorLabel }}</span>
                <span class="slip-label">源仓别</span>
                <span class="slip-header-value slip-header-target">{{ normalSourceWarehouseLabel }}</span>
              </div>
              <div class="slip-header-line slip-header-inline">
                <span class="slip-label">需求人</span>
                <span class="slip-header-value">{{ normalMaterialUserLabel }}</span>
                <span class="slip-label">目标库位</span>
                <span class="slip-header-value slip-header-target">{{ normalTargetLocationLabel }}</span>
              </div>
            </div>
          </header>
          <section v-for="(row, index) in normalPrintRows" :key="row.id || index" class="issue-slip-preview" :class="{ 'has-divider': index > 0 }">
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
              <div v-if="isNormalSpecialInventory(row)" class="slip-special-row">
                <span><span class="slip-label">特殊库存</span>{{ row.specialInventoryFlag || '-' }}</span>
                <span><span class="slip-label"></span>{{ row.businessCode || '-' }}</span>
              </div>
              <div class="slip-row slip-row-dates">
                <span class="slip-date-item"><span class="slip-label">出库日期</span>{{ parseTime(row.issueTime, '{y}-{m}-{d}') }}</span>
                <span class="slip-date-item"><span class="slip-label">生产日期</span>{{ parseTime(row.receiveTime, '{y}-{m}-{d}') }}</span>
              </div>
            </div>
          </section>
        </div>

        <section v-for="(sheet, sheetIndex) in consignmentPrintSheets" :key="`consignment-${sheet.key}-${sheetIndex}`" class="consignment-sheet">
          <div class="consignment-head">
            <div class="consignment-company">益泰(南京)环保科技有限公司</div>
            <div class="consignment-title">托售物料专用领料单</div>
          </div>
          <div class="consignment-meta">
            <div class="consignment-supplier">
              <div>供应商名称：{{ sheet.supplierName || '-' }}</div>
              <div>供应商代码：{{ sheet.supplierCode || '-' }}</div>
            </div>
            <div class="consignment-order">
              <div>
                单号 <span>{{ sheet.sheetNo || '-' }}</span>
              </div>
              <div>填表日期：{{ fillDateParts.year }} 年 {{ fillDateParts.month }} 月 {{ fillDateParts.day }} 日</div>
            </div>
          </div>
          <table class="consignment-table">
            <thead>
              <tr>
                <th>项目</th>
                <th>工单号</th>
                <th>料号</th>
                <th>品名规格</th>
                <th>单位</th>
                <th>数量</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in sheet.rows" :key="row?.id || `blank-${index}`">
                <td>{{ index + 1 }}</td>
                <td>{{ row?.workOrderNo || '' }}</td>
                <td>{{ row?.materialCode || '' }}</td>
                <td class="consignment-material-name">{{ row?.materialName || '' }}</td>
                <td>{{ row?.inventoryUnit || '' }}</td>
                <td>{{ row ? resolvePrintQtyNumber(row) : '' }}</td>
                <td>{{ row?.remark || '' }}</td>
              </tr>
            </tbody>
          </table>
          <div class="consignment-copy">第一联：财务 记账&nbsp;&nbsp;&nbsp;第二联：相关部门&nbsp;&nbsp;&nbsp;第三联：生产部</div>
          <div class="consignment-sign">
            <span>制表人(领料人)：{{ operatorLabel }}</span>
            <span>主管：</span>
            <span>接受部门：</span>
            <span>仓库主管：</span>
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
  materialUserCode?: string;
  materialUserName?: string;
  sourceWarehouseCode?: string;
  sourceWarehouseName?: string;
  targetDemandLocationCode?: string;
  targetDemandLocationCodeDesc?: string;
  printMode?: 'normal' | 'consignment';
}

const PRINT_WIDTH_MM = 80;
const CONSIGNMENT_PAGE_ROWS = 8;

const ISSUE_PRINT_STYLES = `
  @page {
    size: ${PRINT_WIDTH_MM}mm auto;
    margin: 2mm 3mm;
  }
  @page consignmentPage {
    size: 210mm 99mm;
    margin: 7mm 10mm;
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
  .issue-print-host,
  .issue-print-content {
    width: 100%;
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
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    padding-bottom: 4px;
    margin-bottom: 6px;
    border-bottom: 1px solid #000;
  }
  .slip-header-main {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: 2px;
  }
  .slip-operator,
  .slip-header-line {
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
  .slip-operator-name,
  .slip-header-value {
    min-width: 0;
    font-size: 12pt;
    line-height: 1.2;
    word-break: break-all;
    overflow-wrap: anywhere;
  }
  .slip-ref {
    flex-shrink: 0;
    font-size: 11pt;
    line-height: 1.2;
    text-align: right;
    word-break: break-all;
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
    overflow-wrap: anywhere;
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
    overflow-wrap: anywhere;
    padding: 1px 0 2px;
  }
  .slip-special-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 10pt;
    line-height: 1.3;
  }
  .slip-special-row > span {
    min-width: 0;
    word-break: break-all;
    overflow-wrap: anywhere;
  }
  .slip-special-row .slip-label {
    margin-right: 2px;
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
  .consignment-sheet {
    page: consignmentPage;
    width: 190mm;
    min-height: 82mm;
    page-break-before: always;
    background: #fff;
    color: #000;
    font-family: 'SimSun', 'SimHei', 'Microsoft YaHei', sans-serif;
    font-size: 10pt;
  }
  .issue-slip-sheet + .consignment-sheet,
  .consignment-sheet + .consignment-sheet {
    page-break-before: always;
  }
  .consignment-sheet:first-child {
    page-break-before: auto;
  }
  .consignment-head {
    min-height: 16mm;
    text-align: center;
  }
  .consignment-company {
    font-size: 16pt;
    line-height: 1.45;
  }
  .consignment-title {
    font-size: 20pt;
    line-height: 1.2;
  }
  .consignment-meta {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 2mm;
    line-height: 1.8;
  }
  .consignment-supplier {
    min-width: 60mm;
  }
  .consignment-order {
    min-width: 50mm;
    text-align: left;
  }
  .consignment-order span {
    color: #c00000;
    font-size: 18pt;
    letter-spacing: 1px;
  }
  .consignment-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 10pt;
  }
  .consignment-table th,
  .consignment-table td {
    height: 6mm;
    border: 1px solid #000;
    padding: 1mm 1.5mm;
    text-align: center;
    vertical-align: middle;
    word-break: break-all;
  }
  .consignment-table th:nth-child(1),
  .consignment-table td:nth-child(1) {
    width: 10mm;
  }
  .consignment-table th:nth-child(2),
  .consignment-table td:nth-child(2) {
    width: 28mm;
  }
  .consignment-table th:nth-child(3),
  .consignment-table td:nth-child(3) {
    width: 38mm;
  }
  .consignment-table th:nth-child(5),
  .consignment-table td:nth-child(5) {
    width: 16mm;
  }
  .consignment-table th:nth-child(6),
  .consignment-table td:nth-child(6) {
    width: 20mm;
  }
  .consignment-table th:nth-child(7),
  .consignment-table td:nth-child(7) {
    width: 34mm;
  }
  .consignment-material-name {
    text-align: left;
  }
  .consignment-copy {
    margin-top: 2mm;
    font-size: 10pt;
    line-height: 1.6;
  }
  .consignment-sign {
    display: grid;
    grid-template-columns: 1.25fr 1fr 1fr 1fr;
    gap: 8mm;
    margin-top: 2mm;
    font-size: 10pt;
    line-height: 1.8;
  }
`;

const userStore = useUserStore();
const { nickname, name } = storeToRefs(userStore);

const operatorLabel = computed(() => {
  const nick = String(nickname.value || '').trim();
  return nick || name.value || '-';
});

const printPreviewContent = ref<HTMLElement>();
const printRows = shallowRef<IssueTaskLineVO[]>([]);
const printContext = ref<IssuePrintContext>({});
const printing = ref(false);

interface ConsignmentPrintSheet {
  key: string;
  supplierCode?: string;
  supplierName?: string;
  sheetNo?: string;
  rows: Array<IssueTaskLineVO | null>;
}

const normalizeText = (value?: string | number | null) => String(value ?? '').trim();

const isConsignmentRow = (row: IssueTaskLineVO) => normalizeText(row.specialInventoryFlag).toUpperCase() === 'K';

const isNormalSpecialInventory = (row: IssueTaskLineVO) => {
  const flag = normalizeText(row.specialInventoryFlag).toUpperCase();
  return !!flag && flag !== 'N';
};

const normalPrintRows = computed(() => {
  if (printContext.value.printMode === 'consignment') return [];
  return printRows.value;
});

const consignmentRows = computed(() => {
  if (printContext.value.printMode === 'normal') return [];
  return printRows.value.filter(isConsignmentRow);
});

const normalPrintNo = computed(() => normalizeText(printContext.value.demandNo) || normalizeText(normalPrintRows.value[0]?.demandNo));

const normalMaterialUserLabel = computed(() => {
  const nameText = normalizeText(printContext.value.materialUserName) || normalizeText(normalPrintRows.value[0]?.materialUserName);
  return nameText || '-';
});

const normalSourceWarehouseLabel = computed(() => {
  const codeText = normalizeText(printContext.value.sourceWarehouseCode) || normalizeText(normalPrintRows.value[0]?.warehouseCode);
  const nameText = normalizeText(printContext.value.sourceWarehouseName) || normalizeText(normalPrintRows.value[0]?.warehouseName);
  return codeText || nameText || '-';
});

const normalTargetLocationLabel = computed(() => {
  const codeText = normalizeText(printContext.value.targetDemandLocationCode) || normalizeText(normalPrintRows.value[0]?.targetDemandLocationCode);
  return codeText || '-';
});

const formatPrintDate = (value?: string): string => {
  const parsed = value ? dayjs(value) : dayjs();
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
};

const fillDateParts = computed(() => {
  const [year, month, day] = formatPrintDate().split('-');
  return { year, month, day };
});

const resolveSheetNo = (rows: IssueTaskLineVO[]) => normalizeText(printContext.value.demandNo) || normalizeText(rows[0]?.demandNo);

const consignmentPrintSheets = computed<ConsignmentPrintSheet[]>(() => {
  const grouped = new Map<string, IssueTaskLineVO[]>();
  consignmentRows.value.forEach((row) => {
    const supplierCode = normalizeText(row.businessCode);
    const supplierName = normalizeText(row.businessName);
    const key = `${supplierCode}__${supplierName}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  });

  const sheets: ConsignmentPrintSheet[] = [];
  grouped.forEach((rows, groupKey) => {
    for (let index = 0; index < rows.length; index += CONSIGNMENT_PAGE_ROWS) {
      const pageRows: Array<IssueTaskLineVO | null> = rows.slice(index, index + CONSIGNMENT_PAGE_ROWS);
      while (pageRows.length < CONSIGNMENT_PAGE_ROWS) pageRows.push(null);
      sheets.push({
        key: `${groupKey}-${index / CONSIGNMENT_PAGE_ROWS}`,
        supplierCode: normalizeText(rows[0]?.businessCode),
        supplierName: normalizeText(rows[0]?.businessName),
        sheetNo: resolveSheetNo(rows),
        rows: pageRows
      });
    }
  });
  return sheets;
});

const qtyCache = new Map<IssueTaskLineVO, string>();

const resolvePrintQtyNumber = (row: IssueTaskLineVO): string => {
  if (qtyCache.has(row)) return qtyCache.get(row)!;
  const qty = resolveLineActualIssueQty(row);
  const result = !Number.isFinite(qty) || qty <= 0 ? '-' : String(qty);
  qtyCache.set(row, result);
  return result;
};

const print = async (rows: IssueTaskLineVO[], context: IssuePrintContext = {}) => {
  if (!rows.length || printing.value) return;
  const effectiveRows = context.printMode === 'consignment' ? rows.filter(isConsignmentRow) : rows;
  if (!effectiveRows.length) return;

  printing.value = true;
  printContext.value = context;
  printRows.value = effectiveRows;

  try {
    await nextTick();
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
    <title>备料打印单</title>
    <style>${ISSUE_PRINT_STYLES}</style>
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
        }, 800);
      };
    <\/script>
  </body>
</html>`);
    printWindow.document.close();
  } catch (error) {
    console.error('打印失败:', error);
    throw error;
  } finally {
    printing.value = false;
    qtyCache.clear();
    setTimeout(() => {
      printRows.value = [];
    }, 100);
  }
};

const clearCache = () => {
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 6px;
  margin-bottom: 8px;
  border-bottom: 1px dashed #bbb;
}

.slip-header-main {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.slip-operator,
.slip-header-line {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}

.slip-header-inline {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto minmax(0, 1.2fr);
}

.slip-operator-name,
.slip-header-value {
  min-width: 0;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.slip-ref {
  flex-shrink: 0;
  max-width: 28mm;
  font-size: 11px;
  font-weight: 600;
  color: #333;
  text-align: right;
  word-break: break-all;
}

.slip-header-target {
  text-align: right;
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
  overflow-wrap: anywhere;
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
  overflow-wrap: anywhere;
  padding: 1px 0 3px;
}

.slip-special-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 10px;
  line-height: 1.3;
  color: #111;
}

.slip-special-row > span {
  min-width: 0;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.slip-special-row .slip-label {
  margin-right: 2px;
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

.consignment-sheet {
  width: 190mm;
  min-height: 82mm;
  background: #fff;
  color: #000;
  font-family: 'SimSun', 'SimHei', 'Microsoft YaHei', sans-serif;
  font-size: 10pt;
}

.consignment-head {
  min-height: 16mm;
  text-align: center;
}

.consignment-company {
  font-size: 16pt;
  line-height: 1.45;
}

.consignment-title {
  font-size: 20pt;
  line-height: 1.2;
}

.consignment-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2mm;
  line-height: 1.8;
}

.consignment-order span {
  color: #c00000;
  font-size: 18pt;
}

.consignment-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 10pt;
}

.consignment-table th,
.consignment-table td {
  height: 6mm;
  border: 1px solid #000;
  padding: 1mm 1.5mm;
  text-align: center;
  vertical-align: middle;
  word-break: break-all;
}

.consignment-material-name {
  text-align: left;
}

.consignment-copy,
.consignment-sign {
  margin-top: 2mm;
}

.consignment-sign {
  display: grid;
  grid-template-columns: 1.25fr 1fr 1fr 1fr;
  gap: 8mm;
  line-height: 1.8;
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
