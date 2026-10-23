<template>
  <div class="print-container">
    <el-container>
      <!-- 左侧菜单区域 -->
      <el-aside width="320px" class="sidebar">
        <div class="menu-section">
          <el-form label-position="top" :model="queryParams" :rules="rules" ref="settingFormRef">
            <!-- 打印机选择 -->
            <el-form-item label="选择打印机">
              <el-select v-model="selectedPrinter" placeholder="请选择打印机" style="width: 100%" filterable @change="onPrinterChange">
                <template #prefix>
                  <el-button icon="Refresh" text @click="refreshPrinterList" title="刷新打印机"></el-button>
                </template>
                <el-option v-for="printer in printerList" :key="printer.name" :label="printer.name" :value="printer.name">
                  <div class="printer-option">
                    <span>{{ printer.name }}</span>
                    <span v-if="printer.isDefault" class="printer-default">默认</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <!-- 纸张选择 -->
            <el-form-item label="选择纸张">
              <el-select v-model="selectedPaper" placeholder="请先选择打印机" style="width: 100%" filterable :disabled="!selectedPrinter" @change="onPaperChange">
                <template #prefix>
                  <el-button icon="Refresh" text @click="refreshPapers" title="刷新纸张"></el-button>
                </template>
                <el-option v-for="paper in paperList" :key="paper.value" :label="paper.label" :value="paper.value">
                  <div class="paper-option">
                    <span>{{ paper.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <!-- 工单号码 -->
            <el-form-item label="工单号码" prop="shopOrder">
              <el-input v-model="queryParams.shopOrder" placeholder="请输入工单号码" @keyup.enter="handleSearch" readonly>
                <template #append>
                  <el-button icon="Search" @click="showShopOrderDialog" />
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="条码">
              <el-input v-model="querySfc" placeholder="请输入条码" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <!--              <HistoryInput v-model="queryParams.shopOrder" :config="shopOrderConfig" placeholder="请输入工单号码" @keyup.enter="getShopOrderList">
                <template #append>
                  <el-button icon="Search" @click="showShopOrderDialog" />
                </template>
              </HistoryInput>-->
          </el-form>
        </div>

        <div class="action-buttons">
          <el-button v-hasPermi="['mes:shopOrderSfc:list']" type="primary" icon="Search" @click="handleSearch">
            搜索
            <el-tooltip content="搜索工单条码" placement="top">
              <el-icon class="ml-1">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </el-button>
          <el-button :loading="printLoading" v-hasPermi="['mes:print:miSn']" color="#626aef" icon="Printer" @click="handlePrint"> 打印</el-button>
        </div>
        <!--        <div class="action-buttons">
          <el-button :loading="printLoading" v-hasPermi="['mes:print:miSn']" color="#626aef" icon="Printer" @click="handleExportImage"> 导出 </el-button>
          <el-button :loading="printLoading" v-hasPermi="['mes:print:miSn']" color="#626aef" icon="Printer" @click="handlePreview"> 预览 </el-button>
        </div>-->
      </el-aside>

      <!-- 右侧预览区域 -->
      <el-main class="preview-area">
        <!-- 标签区域 -->
        <div class="preview-container">
          <div class="preview-header">
            <h4>MI标签预览(35mm*12mm)</h4>
          </div>
          <div class="preview-content">
            <!-- MI标签模板 -->
            <div class="preview-content-sn">
              <img v-if="previewImage" class="mi-print-sn-preview" :src="previewImage" alt="MI标签预览" />
            </div>
            <!-- 预览信息 -->
            <div class="preview-info">
              <el-descriptions :column="2" size="small" border class="compact-descriptions">
                <el-descriptions-item label="标签尺寸">35mm × 12mm</el-descriptions-item>
                <el-descriptions-item label="打印份数">{{ copies }} 份</el-descriptions-item>
                <el-descriptions-item label="当前缩放">300%</el-descriptions-item>
                <el-descriptions-item label="打印机" :span="2" class="printer-item">{{ selectedPrinter || '未选择' }}</el-descriptions-item>
                <el-descriptions-item label="工单号码" class="text-overflow-item">{{ form.shopOrder }}</el-descriptions-item>
                <el-descriptions-item label="料号" class="text-overflow-item">{{ form.plannedItem }}</el-descriptions-item>
                <el-descriptions-item label="计划数量">{{ form.qtyToBuild }}</el-descriptions-item>
                <el-descriptions-item label="下达数量">{{ form.qtyReleased }}</el-descriptions-item>
                <el-descriptions-item label="产品描述" :span="2" class="product-desc-item">
                  {{ form.itemDesc }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </div>

          <!-- 工单条码 -->
          <div class="shop-order-container">
            <div class="content">
              <div class="btn">
                <el-button type="success" size="small" @click="selectAll" class="ml10">全选</el-button>
                <el-button type="warning" size="small" @click="cancelAll">清空</el-button>
                <el-checkbox v-model="enableNormalPrint" class="ml10" @change="handleSearch">可打印</el-checkbox>
                <div class="btn-span">
                  <span class="ml10">已选{{ ids.length }}条</span>
                  <span class="ml10">总记录{{ total }}条</span>
                </div>
              </div>
            </div>
            <div class="shop-order-list">
              <el-table ref="multipleTableRef" v-loading="loading" :data="shopOrderSfcList" @selection-change="handleSelectionChange" row-key="id" height="260" border stripe fixed-header fit>
                <el-table-column type="selection" width="55" align="center" :reserve-selection="true" />
                <el-table-column label="工单" align="center" prop="shopOrder" />
                <el-table-column label="条码" align="center" prop="sfc" />
                <el-table-column label="标签可打印次数" align="center" prop="normalPrintQuantity" />
              </el-table>

              <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getShopOrderSfcList" />
            </div>
          </div>
        </div>
      </el-main>
    </el-container>

    <!-- 工单选择对话框 -->
    <ShopOrderDialog ref="shopOrderDialogRef" :podConfig="podConfig" @shop-order-call-back="shopOrderCallBack" />
  </div>
</template>

<script setup lang="ts">
import { getLodop } from '@/utils/LodopFuncs';
import { nextTick, onMounted, ref, watch } from 'vue';
import { listShopOrderSfc } from '@/api/mes/shopOrderSfc';
import { ShopOrderSfcForm, ShopOrderSfcQuery, ShopOrderSfcVO } from '@/api/mes/shopOrderSfc/types';
import { savePrintHistory } from '@/api/mes/shopOrderSfcPrintHistory';
import ShopOrderDialog from '@/views/mes/workpanel/components/shopOrderDialog.vue';
import { listShopOrder } from '@/api/mes/shopOrder';
import JsBarcode from 'jsbarcode';
import { HistoryConfig } from '@/types/history';
import { QuestionFilled } from '@element-plus/icons-vue';
import { HttpStatus } from '@/enums/RespEnum';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const shopOrderDialogRef = ref<InstanceType<typeof ShopOrderDialog>>();
const settingFormRef = ref<ElFormInstance>();
const multipleTableRef = ref<ElTableInstance>();
const shopOrderSfcList = ref<ShopOrderSfcVO[]>([]);
const selectedShopOrderSfcList = ref<ShopOrderSfcVO[]>([]);
const loading = ref(false);
const printLoading = ref(false);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const previewImage = ref('');

type MiSnPrintForm = ShopOrderSfcForm & {
  plannedItem?: string;
  qtyToBuild?: number | string;
  qtyReleased?: number | string;
  itemDesc?: string;
};

const initFormData: MiSnPrintForm = {
  id: undefined,
  shopOrderBo: undefined,
  shopOrder: undefined,
  sfcBo: undefined,
  sfc: undefined,
  qty: undefined,
  batchId: undefined
};
const data = reactive<PageData<MiSnPrintForm, ShopOrderSfcQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    shopOrderBo: undefined,
    shopOrder: undefined,
    sfcBo: undefined,
    sfc: '',
    qty: undefined,
    batchId: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

const shopOrderConfig: HistoryConfig = {
  key: 'shopOrder',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'print',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

// 工单信息
const workOrderInfo = ref({
  productDate: '',
  sku: ''
});

// 打印机相关状态
const printerList = ref<
  Array<{
    name: string;
    isDefault: boolean;
  }>
>([]);
const selectedPrinter = ref('');

// 纸张相关状态
const paperList = ref<Array<{ value: string; label: string }>>([]);
const selectedPaper = ref('');
const copies = ref(1);
const querySfc = ref('');
const enableNormalPrint = ref(true);

/** 查询工单下达的条码列表 */
const handleSearch = () => {
  queryParams.value.pageNum = 1;
  getShopOrderSfcList();
};

const getShopOrderSfcList = async () => {
  if (!queryParams.value.shopOrder) {
    return;
  }
  cancelAll();
  loading.value = true;
  queryParams.value.sfc = '';
  try {
    const res = await listShopOrderSfc({
      shopOrder: queryParams.value.shopOrder,
      pageNum: queryParams.value.pageNum,
      pageSize: queryParams.value.pageSize,
      sfc: querySfc.value.trim() || undefined,
      enableNormalPrint: enableNormalPrint.value || undefined
    });
    shopOrderSfcList.value = res.rows || [];
    total.value = res.total || 0;
  } catch (error) {
    shopOrderSfcList.value = [];
    total.value = 0;
    proxy.$modal.msgError('查询工单条码失败: ' + (error as Error).message);
  } finally {
    loading.value = false;
  }
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: ShopOrderSfcVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
  selectedShopOrderSfcList.value = selection;
  queryParams.value.sfc = selection.length > 0 ? selection[0].sfc : '';
  workOrderInfo.value.productDate = selection.length > 0 ? selection[0].productDate : '';
};

const podConfig = ref<{ [key: string]: any }>({});

// 显示工单选择对话框
const showShopOrderDialog = () => {
  podConfig.value.statusList = ['NEW', 'RELEASABLE', 'RELEASED', 'ACTIVE'];
  podConfig.value.shopOrderTypeList = ['PRODUCTION', 'PRODUCTION-ZZ', 'REWORK', 'REWORK-CJ'];
  shopOrderDialogRef.value.openDialog();
};
// 弹框回调
const shopOrderCallBack = (data: any) => {
  form.value = data;
  workOrderInfo.value.sku = data.sku;
  queryParams.value.shopOrder = data.shopOrder;
  getShopOrderSfcList();
};

// 全选
const selectAll = () => {
  multipleTableRef.value.toggleAllSelection();
};

// 反选
const cancelAll = () => {
  multipleTableRef.value?.clearSelection();
};

// 获取打印机列表
const getPrintersFromLodop = (): Array<{ name: string; isDefault: boolean }> => {
  const LODOP = getLodop();
  if (!LODOP) {
    proxy.$modal.msgError('未检测到Lodop打印服务，请安装Lodop插件');
    return [];
  }

  try {
    const printerCount = LODOP.GET_PRINTER_COUNT();
    const printers = [];
    const defaultPrinterName = LODOP.GET_PRINTER_NAME(-1); // -1表示默认打印机

    for (let i = 0; i < printerCount; i++) {
      const printerName = LODOP.GET_PRINTER_NAME(i);
      printers.push({
        name: printerName,
        isDefault: printerName === defaultPrinterName
      });
    }

    return printers;
  } catch (error) {
    console.error('获取打印机列表失败:', error);
    return [];
  }
};

// 刷新打印机列表
const refreshPrinterList = () => {
  const printers = getPrintersFromLodop();
  printerList.value = printers;
  if (!printers.length || selectedPrinter.value) return;
  const defaultPrinter = printers.find((printer) => printer.isDefault);
  selectedPrinter.value = defaultPrinter?.name || printers[0].name;
};

// 获取纸张列表
const getPaperList = (printerName: string) => {
  try {
    const LODOP = getLodop();
    if (!LODOP) {
      return [];
    }
    LODOP.PRINT_INIT('获取纸张列表');

    // 设置打印机
    LODOP.SET_PRINTER_INDEX(printerName);

    // 创建select元素来接收纸张列表
    const selectElement = document.createElement('select');
    selectElement.id = 'tempPaperSelect';
    selectElement.style.display = 'none';
    document.body.appendChild(selectElement);

    // 清空select
    selectElement.innerHTML = '';

    // 注意：这里使用printerName作为索引
    LODOP.Create_PageSize_List(selectElement, printerName);

    const papers: Array<{ value: string; label: string }> = [];

    // 遍历选项
    for (let i = 0; i < selectElement.options.length; i++) {
      const option = selectElement.options[i];
      papers.push({
        value: option.value,
        label: option.text
      });
    }

    console.log(`获取到 ${printerName} 的纸张列表:`, papers);

    // 清理
    document.body.removeChild(selectElement);
    LODOP.PRINT_INIT('');
    return papers;
  } catch (error) {
    console.error('获取纸张列表失败:', error);
    return [];
  }
};

// 刷新纸张列表
const refreshPapers = async () => {
  if (!selectedPrinter.value) {
    proxy.$modal.msgError('请先选择打印机');
    return;
  }

  const papers = await getPaperList(selectedPrinter.value);
  paperList.value = papers;

  if (papers.length > 0) {
    if (!selectedPaper.value) {
      selectedPaper.value = papers[0].value;
    }
  }
};

// 打印机变更事件
const onPrinterChange = () => {
  refreshPapers(); // 打印机变更时自动刷新纸张列表
};

// 纸张变更事件
const onPaperChange = () => {
  // 可以在这里处理纸张变更逻辑
  console.log('纸张已更改:', selectedPaper.value);
};

const LABEL_WIDTH_MM = 35;
const LABEL_HEIGHT_MM = 12;
const TX610_DPI = 600;
const LABEL_FONT = "'MiSans Regular', sans-serif";
const LABEL_SN_FONT = 'Arial, sans-serif';
const LABEL = {
  left: (LABEL_WIDTH_MM - 29.83) / 2,
  dateTop: 1.15,
  dateHeight: 1.5,
  barcodeTop: 2.65,
  barcodeWidth: 29.83,
  barcodeHeight: 5,
  snTop: 8.15,
  skuTop: 9.7,
  lineHeight: 1.55
};

const mmToPx = (mm: number) => (mm * TX610_DPI) / 25.4;

const formatMiProductDate = (value?: string) => {
  if (!value) return '';
  const text = String(value).trim();
  const compact = text.match(/^(\d{4})(\d{2})(\d{2})?$/);
  if (compact) return `${compact[1]}.${compact[2]}`;
  const separated = text.match(/(\d{4})\D+(\d{1,2})/);
  if (separated) return `${separated[1]}.${separated[2].padStart(2, '0')}`;
  return text;
};

const displayProductDate = computed(() => formatMiProductDate(workOrderInfo.value.productDate));

const drawText = (ctx: CanvasRenderingContext2D, text: string, xMm: number, yMm: number, widthMm: number, heightMm: number, fontPt: number, fontFamily: string, align: CanvasTextAlign = 'left') => {
  const fontPx = (fontPt * TX610_DPI) / 72;
  ctx.save();
  ctx.beginPath();
  ctx.rect(mmToPx(xMm), mmToPx(yMm), mmToPx(widthMm), mmToPx(heightMm));
  ctx.clip();
  ctx.font = `${fontPx}px ${fontFamily}`;
  ctx.fillStyle = '#000000';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const x = align === 'center' ? mmToPx(xMm + widthMm / 2) : mmToPx(xMm);
  ctx.fillText(text, x, mmToPx(yMm + heightMm / 2));
  ctx.restore();
};

const measureTextMm = (ctx: CanvasRenderingContext2D, text: string, fontPt: number, fontFamily: string) => {
  ctx.font = `${(fontPt * TX610_DPI) / 72}px ${fontFamily}`;
  return ctx.measureText(text).width / (TX610_DPI / 25.4);
};

const renderBarcode = (content: string, width: number, height: number) => {
  const probe = document.createElement('canvas');
  JsBarcode(probe, content, { format: 'CODE128', displayValue: false, height, width: 1, margin: 0 });
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, content, {
    format: 'CODE128',
    displayValue: false,
    height,
    width: Math.max(1, width / probe.width),
    margin: 0
  });
  return canvas;
};

/** 页面预览、Lodop 预览、出纸共用这一张 600dpi 图，尺寸按设计图。 */
const renderMiSnLabel = async (sfc: string, productDate: string, sku: string) => {
  await document.fonts.ready;
  await Promise.all([document.fonts.load(`${(4 * TX610_DPI) / 72}px "MiSans Regular"`), document.fonts.load(`${(3.5 * TX610_DPI) / 72}px "MiSans Regular"`), document.fonts.load(`${(4.5 * TX610_DPI) / 72}px Arial`)]);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(mmToPx(LABEL_WIDTH_MM));
  canvas.height = Math.round((canvas.width * LABEL_HEIGHT_MM) / LABEL_WIDTH_MM);
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('无法创建标签图像');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  const contentRight = LABEL.left + LABEL.barcodeWidth;
  const badgeTextWidth = Math.max(measureTextMm(ctx, '维修凭证', 3.5, LABEL_FONT), measureTextMm(ctx, '请勿撕毁', 3.5, LABEL_FONT));
  const badgeWidth = badgeTextWidth + 0.56;
  const badgeHeight = 3.05;
  const badgeLeft = contentRight - badgeWidth;
  const badgeTop = LABEL.snTop;
  const textWidth = Math.max(8, badgeLeft - LABEL.left - 0.35);

  drawText(ctx, `生产日期:${productDate || ''}`, LABEL.left, LABEL.dateTop, LABEL.barcodeWidth, LABEL.dateHeight, 4, LABEL_FONT);

  const barcodeX = Math.round(mmToPx(LABEL.left));
  const barcodeY = Math.round(mmToPx(LABEL.barcodeTop));
  const barcodeW = Math.round(mmToPx(LABEL.barcodeWidth));
  const barcodeH = Math.round(mmToPx(LABEL.barcodeHeight));
  if (sfc) {
    ctx.drawImage(renderBarcode(sfc, barcodeW, barcodeH), barcodeX, barcodeY, barcodeW, barcodeH);
  }

  drawText(ctx, `SN: ${sfc}`, LABEL.left, LABEL.snTop, textWidth, LABEL.lineHeight, 4.5, LABEL_SN_FONT);
  drawText(ctx, `SKU: ${sku}`, LABEL.left, LABEL.skuTop, textWidth, LABEL.lineHeight, 4.5, LABEL_SN_FONT);

  const x = Math.round(mmToPx(badgeLeft));
  const y = Math.round(mmToPx(badgeTop));
  const w = Math.round(mmToPx(badgeWidth));
  const h = Math.round(mmToPx(badgeHeight));
  const borderPx = Math.max(1, Math.round(mmToPx(0.12)));
  ctx.fillStyle = '#000000';
  ctx.fillRect(x, y, w, borderPx);
  ctx.fillRect(x, y + h - borderPx, w, borderPx);
  ctx.fillRect(x, y, borderPx, h);
  ctx.fillRect(x + w - borderPx, y, borderPx, h);
  drawText(ctx, '维修凭证', badgeLeft, badgeTop + 0.08, badgeWidth, 1.45, 3.5, LABEL_FONT, 'center');
  drawText(ctx, '请勿撕毁', badgeLeft, badgeTop + 1.52, badgeWidth, 1.45, 3.5, LABEL_FONT, 'center');

  return canvas.toDataURL('image/png');
};

watch([() => queryParams.value.sfc, () => workOrderInfo.value.sku, displayProductDate], async () => {
  if (!queryParams.value.sfc) {
    previewImage.value = '';
    return;
  }
  try {
    previewImage.value = await renderMiSnLabel(queryParams.value.sfc, displayProductDate.value, workOrderInfo.value.sku || '');
  } catch (error) {
    previewImage.value = '';
    console.error('标签预览失败:', error);
  }
});

// 处理打印功能
const handlePrint = async () => {
  const LODOP = getLodop();
  if (!LODOP) {
    proxy.$modal.msgError('未检测到Lodop打印服务，请安装Lodop插件');
    return;
  }

  if (!workOrderInfo.value.sku) {
    proxy.$modal.msgWarning('请先确认工单所属物料的SKU资料是否维护');
    return;
  }

  const labels = selectedShopOrderSfcList.value.slice();
  if (labels.length === 0) {
    proxy.$modal.msgWarning('请先选择工单条码');
    return;
  }

  printLoading.value = true;

  try {
    const res = await savePrintHistory({
      shopOrderSfcBoList: labels,
      printType: 1,
      businessCode: 'MI'
    });

    if (res.code !== HttpStatus.SUCCESS) {
      printLoading.value = false;
      return;
    }

    LODOP.PRINT_INITA('0mm', '0mm', `${LABEL_WIDTH_MM}mm`, `${LABEL_HEIGHT_MM}mm`, `MI SN ${LABEL_WIDTH_MM}*${LABEL_HEIGHT_MM}mm`);
    LODOP.SET_PRINTER_INDEX(selectedPrinter.value);
    // 间隙和参考点用驱动里的纸张。代码不再写死偏移。
    if (selectedPaper.value) {
      LODOP.SET_PRINT_PAGESIZE(1, 0, 0, selectedPaper.value);
    } else {
      LODOP.SET_PRINT_PAGESIZE(1, LABEL_WIDTH_MM * 10, LABEL_HEIGHT_MM * 10, '');
    }
    LODOP.SET_PRINT_MODE('PRINT_PAGE_PERCENT', '100%');
    LODOP.SET_PRINT_MODE('PRINT_START_PAGE', 1);
    LODOP.SET_PRINT_MODE('PRINT_END_PAGE', labels.length);
    LODOP.SET_SHOW_MODE('LANDSCAPE_DEFROTATED', 1);

    const sku = workOrderInfo.value.sku;
    for (let index = 0; index < labels.length; index++) {
      if (index > 0) {
        LODOP.NEWPAGEA();
      }
      const selected = labels[index];
      const printImage = await renderMiSnLabel(selected.sfc || '', formatMiProductDate(selected.productDate), sku);
      LODOP.ADD_PRINT_IMAGE('0mm', '0mm', `${LABEL_WIDTH_MM}mm`, `${LABEL_HEIGHT_MM}mm`, printImage);
      LODOP.SET_PRINT_STYLEA(0, 'Stretch', 1);
      LODOP.SET_PRINT_STYLEA(0, 'PageIndex', index + 1);
      LODOP.SET_PRINT_STYLEA(0, 'Horient', 2);
      LODOP.SET_PRINT_STYLEA(0, 'Vorient', 2);
    }

    // LODOP.SET_PREVIEW_WINDOW(0, 0, 0, 900, 500, '');
    // ========== 预览或打印 ==========
    // LODOP.PRINT_DESIGN();
    // LODOP.PREVIEW();
    LODOP.PRINT();

    printLoading.value = false;
    proxy.$modal.msgSuccess('打印任务已发送');
  } catch (error) {
    console.error('打印失败:', error);
    proxy.$modal.msgError('打印失败: ' + (error as Error).message);
    printLoading.value = false;
  }
};

const clearPrintInfo = () => {
  workOrderInfo.value.sku = '';
  form.value = { ...initFormData };
  queryParams.value.shopOrder = undefined;
  queryParams.value.shopOrderBo = undefined;
  queryParams.value.sfcBo = undefined;
  queryParams.value.sfc = '';
  queryParams.value.qty = undefined;
  queryParams.value.batchId = undefined;
  queryParams.value.pageNum = 1;
  querySfc.value = '';
  previewImage.value = '';
  shopOrderSfcList.value = [];
  selectedShopOrderSfcList.value = [];
  ids.value = [];
};

/** 查询工序列表 */
const getShopOrderList = async () => {
  try {
    const shopOrder = queryParams.value.shopOrder;
    clearPrintInfo();
    queryParams.value.shopOrder = shopOrder;
    const res = await listShopOrder(queryParams.value);
    if (res.total == 0) {
      proxy.$modal.msgError('工单号' + queryParams.value.shopOrder + '资料不存在');
      clearPrintInfo();
      return;
    }
    if (res.total > 1) {
      proxy.$modal.msgError('工单号' + queryParams.value.shopOrder + '存在多笔资料');
      clearPrintInfo();
      return;
    }
    const row = res.rows[0];
    queryParams.value.shopOrder = row.shopOrder;
    form.value = {
      ...initFormData,
      shopOrder: row.shopOrder,
      plannedItem: row.plannedItem,
      qtyToBuild: row.qtyToBuild,
      qtyReleased: row.qtyReleased,
      itemDesc: row.itemDesc
    };
    workOrderInfo.value.sku = row.sku || '';

    await getShopOrderSfcList();
  } catch (error) {
    proxy.$modal.msgError('查询工单数据失败: ' + (error as Error).message);
  }
};

// 页面加载完成后初始化
onMounted(() => {
  // 获取年份两位的月份
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  workOrderInfo.value.productDate = `${year}.${month}`;
  nextTick(() => {
    queryParams.value.sfc = '63877/BQAPNF6NQ00001';
    workOrderInfo.value.sku = 'BHR07SBCN';
    setTimeout(() => {
      refreshPrinterList();
    }, 500);
  });
});
</script>

<style scoped>
.print-container {
  height: calc(100vh - 90px);
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  padding: 10px;
}

.sidebar {
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
  padding: 10px;
  overflow-y: auto;
  height: 100%;
}

.menu-section {
  margin-bottom: 24px;
}

.action-buttons {
  padding: 16px;
  border-top: 1px solid #e6e6e6;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.preview-area {
  padding: 0 10px;
  background-color: #f5f7fa;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-container {
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #e6e6e6;
  background-color: #fff;
  border-radius: 5px;
  flex-shrink: 0;
}

.preview-header h4 {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.preview-content {
  display: flex;
  flex: 1;
  gap: 20px;
  width: 100%;
  height: 100%;
  max-height: 200px;
}

.preview-content-sn {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(45deg, #f5f5f5 25%, transparent 25%), linear-gradient(-45deg, #f5f5f5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f5f5f5 75%), linear-gradient(-45deg, transparent 75%, #f5f5f5 75%);
  background-size: 20px 20px;
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0;
}

.preview-info {
  flex: 1;
  flex-direction: column;
  padding: 0;
}

.shop-order-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 0;
}

.shop-order-list {
  padding: 10px;
  background-color: #ffffff;
  flex: 1;
  overflow: auto;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.btn {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.btn-span {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 页面预览就是打印那张 600dpi 图，放大到 3 倍方便对照设计图 */
.mi-print-sn-preview {
  width: 105mm;
  height: 36mm;
  image-rendering: auto;
  background: #fff;
}

/* 紧凑的描述列表样式 */
.compact-descriptions {
  font-size: 12px;
}

.compact-descriptions :deep(.el-descriptions__label) {
  width: 70px;
  min-width: 70px;
  padding: 4px 8px;
  font-size: 12px;
}

.compact-descriptions :deep(.el-descriptions__content) {
  padding: 4px 8px;
  font-size: 12px;
}

/* 文本溢出处理 */
.text-overflow-item {
  max-width: 0;
}

.text-overflow-item :deep(.el-descriptions__cell) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.printer-item :deep(.el-descriptions__cell) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc-item {
  max-width: 0;
}

.product-desc-item :deep(.el-descriptions__cell) {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
}
</style>
