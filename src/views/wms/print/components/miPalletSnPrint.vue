<template>
  <div class="mi-pallet-print">
    <section class="query-card">
      <div class="query-heading">
        <div class="heading-main">
          <span class="heading-icon"
            ><el-icon><Box /></el-icon
          ></span>
          <div>
            <h3>小米栈板标签打印</h3>
            <p>输入栈板号或栈板内任一产品SN，查询后生成A4栈板标签</p>
          </div>
        </div>
        <div class="heading-tags">
          <el-tag effect="plain">整板SN</el-tag>
        </div>
      </div>

      <el-form :model="query" label-position="top" class="query-form" @submit.prevent>
        <el-row :gutter="16" align="bottom">
          <el-col :xs="24" :sm="9" :md="6" :lg="6" :xl="6">
            <el-form-item label="栈板号">
              <el-input v-model="query.palletNo" clearable placeholder="请输入或扫描栈板号" @keyup.enter="search" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="9" :md="6" :lg="6" :xl="6">
            <el-form-item label="产品SN">
              <el-input v-model="query.sfc" clearable placeholder="可输入栈板内任一产品SN" @keyup.enter="search" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <div class="form-actions">
              <el-button type="primary" :loading="loading" class="form-action-btn" @click="search">
                <el-icon>
                  <Search />
                </el-icon>
                查询
              </el-button>
              <el-button class="form-action-btn" @click="resetQuery">
                <el-icon>
                  <RefreshLeft />
                </el-icon>
                重置
              </el-button>
              <el-button type="success" :disabled="!printData" class="form-action-btn" @click="printLabel">
                <el-icon>
                  <Printer />
                </el-icon>
                网页打印
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>

      <el-alert v-if="message" :title="message" :type="messageType" show-icon :closable="false" class="result-alert" />

      <div v-if="printData" class="preview-stage">
        <div ref="labelRef" class="mi-pallet-label">
          <table class="label-table">
            <colgroup>
              <col v-for="width in labelTableCols" :key="width" :style="{ width }" />
            </colgroup>
            <tbody>
              <tr>
                <td class="logo-cell" rowspan="2">
                  <div class="mi-logo-safe-area">
                    <img :src="miLogo" alt="MI" />
                  </div>
                </td>
                <th>
                  <b class="label-cn">采购订单号</b>
                  <span class="label-en">P.O.</span>
                </th>
                <td class="value-cell">{{ printData.customerPo || '' }}</td>
                <th>
                  <b class="label-cn">产品SKU</b>
                  <span class="label-en">Product SKU</span>
                </th>
                <td class="value-cell">{{ printData.sku || '' }}</td>
              </tr>
              <tr>
                <th>
                  <b class="label-cn">产品ID</b>
                  <span class="label-en">Product ID</span>
                </th>
                <td class="barcode-cell">
                  <img v-if="productIdBarcode" :src="productIdBarcode" alt="" />
                  <strong>{{ printData.productId || '' }}</strong>
                </td>
                <th>
                  <b class="label-cn">生产日期</b>
                  <span class="label-en">Production Date</span>
                </th>
                <td class="barcode-cell">
                  <img v-if="dateBarcode" :src="dateBarcode" alt="" />
                  <strong>{{ productDate }}</strong>
                </td>
              </tr>
              <tr>
                <th>
                  <b class="label-cn">产品名称</b>
                  <span class="label-en">Product Name</span>
                </th>
                <td class="product-name" colspan="2">{{ printData.productName || '' }}</td>
                <th class="packing-label">
                  <b class="label-cn">装托数量</b>
                  <span class="label-en">Packing Specifications</span>
                </th>
                <td class="value-cell">{{ printData.total }}PCS/托盘</td>
              </tr>
              <tr>
                <th class="weight-label">
                  <b class="label-cn">托盘毛重（Kg）</b>
                  <span class="label-en">PLT Gross Weight</span>
                </th>
                <td class="value-cell">{{ weightText }}</td>
                <th>
                  <b class="label-cn">托盘号</b>
                  <span class="label-en">Pallet Number</span>
                </th>
                <td class="pallet-barcode-cell" colspan="2">
                  <img v-if="palletBarcode" :src="palletBarcode" alt="" class="spec-no" />
                  <div class="pallet-no">{{ printData.palletNo }}</div>
                </td>
              </tr>
              <tr class="note-row">
                <td class="note-label pd-style">
                  <span class="label-cn">备注</span>
                  <span class="label-en">Note</span>
                </td>
                <td class="spec-td" colspan="4">
                  <div class="sn-list">
                    <div v-for="sn in printData.snList" :key="sn" class="sn-txt" :title="sn">
                      {{ sn }}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup name="MiPalletSnPrint" lang="ts">
import { computed, onMounted, ref } from 'vue';
import JsBarcode from 'jsbarcode';
import { Box, Printer, RefreshLeft, Search } from '@element-plus/icons-vue';
import { getMiPalletSn } from '@/api/mes/palletSn';
import type { MiPalletSnPrintQuery, MiPalletSnPrintVO } from '@/api/mes/palletSn/types';
import miLogo from '@/assets/logo/milogo.jpg';

/** 标签表格样式（预览注入 + 网页打印共用，避免两套 CSS 不一致） */
const LABEL_STYLE_ID = 'mi-pallet-label-table-css';
/** 上四行固定高度之和：20 + 20 + 16 + 22 = 78mm。 */
const LABEL_TOP_BLOCK_MM = 78;
const LABEL_PAGE_HEIGHT_MM = 297;
/** A4 四周保留 10mm 打印页边距后的可用尺寸。 */
const LABEL_PRINT_WIDTH_MM = 190;
const LABEL_PRINT_HEIGHT_MM = 277;

const LABEL_TABLE_CSS = `
  /* 标签规范：英文及数字使用 Arial，中文字符自动回退到黑体。 */
  .mi-pallet-label { width: 100%; box-sizing: border-box; color: #000; background: #fff; font-family: Arial, SimHei, "黑体", sans-serif; }
  .mi-pallet-label .label-table { width: 100%; height: ${LABEL_PAGE_HEIGHT_MM}mm; table-layout: fixed; border: 1px solid #000; border-collapse: separate; border-spacing: 0; text-align: center; font-size: 10.5pt; }
  .print-page .mi-pallet-label .label-table { height: calc(${LABEL_PRINT_HEIGHT_MM}mm - 1mm); }
  .mi-pallet-label .label-table th, .mi-pallet-label .label-table td { color: #000; border: 0; border-right: 1px solid #000; border-bottom: 1px solid #000; text-align: center; vertical-align: middle; padding: 2mm; }
  .mi-pallet-label .label-table tr > :last-child { border-right: 0; }
  .mi-pallet-label .label-table tr:last-child > * { border-bottom: 0; }
  .mi-pallet-label .label-table .barcode-cell { padding: 1mm 2mm; }
  .mi-pallet-label .label-table th { font-weight: 700; }
  .mi-pallet-label .label-table th b, .mi-pallet-label .label-table th span { display: block; }
  .mi-pallet-label .label-table th b.label-cn, .mi-pallet-label .note-label .label-cn { margin-bottom: 1mm; font-family: SimHei, "黑体", sans-serif; font-size: 10.5pt; line-height: 1.2; white-space: nowrap; font-weight: 700; }
  .mi-pallet-label .label-table th span.label-en, .mi-pallet-label .note-label .label-en { margin-top: .5mm; font-family: Arial, sans-serif; font-size: 10pt; font-weight: 700; line-height: 1.15; white-space: nowrap; display: block; }
  .mi-pallet-label .label-table tr:nth-child(1), .mi-pallet-label .label-table tr:nth-child(2) { height: 20mm; }
  .mi-pallet-label .label-table tr:nth-child(3) { height: 16mm; }
  .mi-pallet-label .label-table tr:nth-child(4) { height: 22mm; }
  .mi-pallet-label .label-table tr.note-row { height: calc(${LABEL_PAGE_HEIGHT_MM}mm - ${LABEL_TOP_BLOCK_MM}mm); }
  .print-page .mi-pallet-label .label-table tr.note-row { height: calc(${LABEL_PRINT_HEIGHT_MM}mm - ${LABEL_TOP_BLOCK_MM}mm - 1mm); }
  /* MI LOGO 固定居中，避免安全区宽度接近首列时 table 布局压缩导致位置偏移。 */
  .mi-pallet-label .logo-cell { position: relative; padding: 0; }
  .mi-pallet-label .mi-logo-safe-area { position: absolute; inset: 0; box-sizing: border-box; display: flex; align-items: flex-start; justify-content: center; margin: 0; padding: 8mm 0 0; line-height: 0; }
  .mi-pallet-label .mi-logo-safe-area img { display: block; flex: 0 0 22.85mm; width: 22.85mm; min-width: 22.85mm; max-width: 22.85mm; height: 22.85mm; min-height: 22.85mm; max-height: 22.85mm; margin: 0; object-fit: contain; }
  .mi-pallet-label .pd-style { font-weight: 700; }
  .mi-pallet-label .value-cell, .mi-pallet-label .product-name { font-size: 10.5pt; font-weight: 700; overflow-wrap: anywhere; }
  .mi-pallet-label .barcode-cell img { display: block; width: 88%; height: 10mm; margin: 0 auto .8mm; object-fit: fill; }
  .mi-pallet-label .barcode-cell strong { display: block; font-size: 10pt; line-height: 1; font-weight: 700; }
  .mi-pallet-label .pallet-barcode-cell { text-align: center; vertical-align: middle; }
  .mi-pallet-label .pallet-barcode-cell .spec-no { display: block; width: 86mm; max-width: 94%; height: 12mm; margin: 0 auto 1mm; object-fit: fill; }
  .mi-pallet-label .pallet-no { font-size: 10pt; text-align: center; width: 100%; margin: 0; font-weight: 700; white-space: nowrap; line-height: 1; }
  .mi-pallet-label .note-label.pd-style { font-weight: 700; vertical-align: middle; }
  .mi-pallet-label .label-table td.spec-td { padding: 8mm 4mm 8mm; text-align: left; vertical-align: top; }
  .mi-pallet-label .sn-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: 6mm; row-gap: 11mm; width: 100%; align-content: start; }
  .mi-pallet-label .sn-txt { overflow: visible; padding-left: .5mm; font-size: 10.5pt; text-align: left; font-weight: 700; white-space: nowrap; line-height: 1.2; letter-spacing: -.06px; }
`;

const MI_PALLET_LABEL_PRINT_STYLE = `
  @page { size: A4 portrait; margin: 10mm; }
  * { box-sizing: border-box; }
  html, body { width: ${LABEL_PRINT_WIDTH_MM}mm; height: ${LABEL_PRINT_HEIGHT_MM}mm; margin: 0; padding: 0; font-family: Arial, SimHei, "黑体", sans-serif; color: #000; background: #fff; }
  .print-page { width: ${LABEL_PRINT_WIDTH_MM}mm; height: ${LABEL_PRINT_HEIGHT_MM}mm; margin: 0; padding: 0; overflow: hidden; break-after: page; page-break-after: always; }
  .print-page .mi-pallet-label { position: relative; width: ${LABEL_PRINT_WIDTH_MM}mm; height: ${LABEL_PRINT_HEIGHT_MM}mm; }
  .print-page:last-child { break-after: auto; page-break-after: auto; }
  ${LABEL_TABLE_CSS}
`;

onMounted(() => {
  let style = document.getElementById(LABEL_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = LABEL_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = LABEL_TABLE_CSS;
});

/** 五列表格列宽：加宽第 1、4 列以容纳毛重与 Packing Specifications */
const LABEL_TABLE_COLS = ['20.5%', '13.1%', '18.2%', '23.5%', '24.7%'] as const;
const labelTableCols = LABEL_TABLE_COLS;

const createBarcode = (value?: string, height = 50, barWidth = 1.6) => {
  if (!value) return '';
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, value, {
    format: 'CODE128',
    displayValue: false,
    margin: 0,
    width: barWidth,
    height
  });
  return canvas.toDataURL('image/png');
};

const formatProductDate = (value?: string) => (value ? value.slice(0, 10).replaceAll('-', '') : '');

const formatWeight = (value?: number) => (value == null ? '' : `${Number(value).toFixed(3)}Kg`);

/** 备注 SN 展示为 SN:xxx（与 v3 标签一致，不裁剪正文） */
const displaySn = (value: string) => {
  const v = value.trim();
  if (/^SN\s*[:：]/i.test(v)) {
    return v.replace(/^SN\s*[:：]\s*/i, 'SN:');
  }
  return `SN:${v}`;
};

const query = ref<MiPalletSnPrintQuery>({
  palletNo: '',
  sfc: ''
});
const loading = ref(false);
const printData = ref<MiPalletSnPrintVO>();
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const labelRef = ref<HTMLDivElement>();

const productDate = computed(() => formatProductDate(printData.value?.productTime));
const weightText = computed(() => formatWeight(printData.value?.palletGrossWeight));
const productIdBarcode = computed(() => createBarcode(printData.value?.productId, 28, 1.3));
const dateBarcode = computed(() => createBarcode(productDate.value, 28, 1.3));
const palletBarcode = computed(() => createBarcode(printData.value?.palletNo, 44, 2.1));

const getErrorMessage = (error: any) => error?.msg || error?.response?.data?.msg || '小米栈板标签数据查询失败';

const setMessage = (text: string, success: boolean) => {
  message.value = text;
  messageType.value = success ? 'success' : 'error';
};

const loadData = async () => {
  if (!query.value.palletNo?.trim() && !query.value.sfc?.trim()) {
    setMessage('请输入栈板号或产品SN', false);
    return;
  }
  loading.value = true;
  message.value = '';
  try {
    const res = await getMiPalletSn({
      palletNo: query.value.palletNo?.trim() || undefined,
      sfc: query.value.sfc?.trim() || undefined
    });
    printData.value = (res as any).data;
    query.value.palletNo = printData.value?.palletNo || query.value.palletNo;
  } catch (error: any) {
    printData.value = undefined;
    setMessage(getErrorMessage(error), false);
  } finally {
    loading.value = false;
  }
};

const search = () => {
  loadData();
};

/** 清空查询条件、标签数据和接口提示。 */
const resetQuery = () => {
  query.value.palletNo = '';
  query.value.sfc = '';
  printData.value = undefined;
  message.value = '';
};

const openPrintWindow = (labels: string[], targetWindow?: Window | null) => {
  const printWindow = targetWindow || window.open('', '_blank');
  if (!printWindow) {
    setMessage('浏览器阻止了打印窗口，请允许弹出窗口后重试', false);
    return;
  }
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html><head><meta charset="UTF-8"><title>小米栈板标签</title><style>${MI_PALLET_LABEL_PRINT_STYLE}</style></head><body>${labels.map((label) => `<div class="print-page">${label}</div>`).join('')}<script>window.onload=()=>{window.onafterprint=()=>window.close();window.print();};<\/script></body></html>`);
  printWindow.document.close();
};

const printLabel = () => {
  if (!printData.value) return;
  const html = labelRef.value?.outerHTML;
  if (!html) {
    setMessage('标签未渲染完成，请稍后重试', false);
    return;
  }
  openPrintWindow([html]);
};
</script>

<style scoped lang="scss">
.mi-pallet-print {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.query-card {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
  box-shadow: 0 8px 24px rgb(31 45 61 / 5%);
}

.query-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(180deg, var(--el-bg-color), var(--el-fill-color-extra-light));
}

.heading-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.heading-icon {
  display: grid;
  width: 42px;
  height: 42px;
  color: #fff;
  font-size: 22px;
  place-items: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #409eff, #3375e8);
}

h3,
p {
  margin: 0;
}

h3 {
  font-size: 20px;
}

.heading-main p {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.heading-tags {
  display: flex;
  gap: 8px;
}

.query-form {
  padding: 14px 20px 16px;
}

.query-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.query-form :deep(.el-form-item__label) {
  font-weight: 600;
}

.form-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  padding-bottom: 2px;
}

.form-action-btn {
  flex: 0 0 auto;
  min-width: 108px;
}

.form-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.result-alert {
  margin: 0 20px 12px;
}

.preview-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 20px 20px;
  overflow: auto;
  border-top: 1px solid var(--el-border-color-lighter);
  background: #edf1f6;

  :deep(.mi-pallet-label) {
    width: 210mm;
    max-width: 100%;
    height: 297mm;
    flex: 0 0 auto;
    box-shadow: 0 5px 20px rgb(0 0 0 / 12%);
  }
}

@media (max-width: 768px) {
  .query-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .heading-tags {
    width: 100%;
  }
  .form-actions .form-action-btn {
    flex: 1 1 100%;
  }

  .form-actions {
    flex-wrap: wrap;
  }
}
</style>
