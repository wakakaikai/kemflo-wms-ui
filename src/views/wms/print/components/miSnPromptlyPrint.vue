<template>
  <div class="print-container">
    <el-container>
      <!-- 左侧菜单区域 -->
      <el-aside width="320px" class="sidebar">
        <!-- 扫描条码输入框 -->
        <el-form label-position="top" :model="workOrderInfo" :rules="rules" ref="settingFormRef">
          <!-- 打印机选择 -->
          <el-form-item label="选择打印机">
            <el-select v-model="selectedPrinter" placeholder="请选择打印机" style="width: 100%" filterable @change="onPrinterChange">
              <template #prefix>
                <el-button text @click="refreshPrinterList" title="刷新所有设置">
                  <el-icon>
                    <Refresh />
                  </el-icon>
                </el-button>
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
                <el-button text @click="refreshPapers" icon="Refresh" title="刷新所有设置"></el-button>
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
            <el-input v-model="workOrderInfo.shopOrder" placeholder="请输入工单号码" readonly>
              <template #append>
                <el-button icon="Search" @click="showShopOrderDialog" />
              </template>
            </el-input>
            <!--            <HistoryInput v-model="workOrderInfo.shopOrder" :config="shopOrderConfig" placeholder="请输入工单号码" @keyup.enter="getShopOrderList">
              <template #append>
                <el-button icon="Search" @click="showShopOrderDialog" />
              </template>
            </HistoryInput>-->
          </el-form-item>

          <!-- 扫描条码输入 -->
          <el-form-item label="扫描条码">
            <el-input ref="scanInputRef" v-model="scanInput" placeholder="请扫描条码" @keydown.enter.prevent="keyDownTab" @keydown.tab.prevent="keyDownTab" autofocus clearable></el-input>
          </el-form-item>

          <!-- 打印份数 -->
          <!--          <el-form-item label="打印份数">
            <el-input-number v-model="copies" :min="1" :max="9999" controls-position="right" style="width: 100%" />
          </el-form-item>-->

          <!-- 操作按钮 -->
          <!--          <div class="action-buttons">
            <el-button type="primary" @click="handlePrintPreview" :loading="printing" :disabled="!selectedPrinter">
              <el-icon><View /></el-icon>
              打印预览
            </el-button>
            <el-button type="success" @click="handlePrint" :loading="printing" :disabled="!selectedPrinter">
              <el-icon><Printer /></el-icon>
              直接打印
            </el-button>
          </div>-->
        </el-form>
      </el-aside>

      <!-- 主内容预览区域 -->
      <el-main class="preview-area">
        <div class="preview-container">
          <div class="preview-header">
            <div class="header-left">
              <h3>MI即扫即打预览(47mm*30mm)</h3>
            </div>
          </div>

          <!-- 预览内容 -->
          <div class="single-preview">
            <div class="preview-content">
              <div class="preview-main-history-container">
                <div class="preview-wrapper">
                  <!-- MI标签模板 -->
                  <div class="mi-print-sn-template" ref="printContent">
                    <!-- 标签顶部：项目描述及颜色 -->
                    <div class="top-section">
                      <span class="product-description">{{ workOrderInfo.productDesc }}</span>
                      <span class="product-color">颜色：{{ workOrderInfo.color }}</span>
                    </div>

                    <!-- 条形码区域 -->
                    <div class="barcode-section">
                      <svg ref="snBarcodeSvg"></svg>
                    </div>

                    <!-- SN和SKU信息 -->
                    <div class="info-section">
                      <div class="sn-sku-row">
                        <span class="sn-value">SN:&nbsp;{{ workOrderInfo.sfcContent }}</span>
                        <span class="sku-value">SKU:&nbsp;{{ workOrderInfo.sku }}</span>
                      </div>
                    </div>

                    <!-- 69码区域 -->
                    <div class="sixty-nine-barcode-section" v-if="workOrderInfo.ean">
                      <svg ref="sixtyNineBarcodeSvg" class="ean-bars"></svg>
                      <div class="ean-readable">
                        <span class="ean-leading-digit">{{ workOrderInfo.ean.slice(0, 1) }}</span>
                        <span class="ean-left-digits">
                          <span v-for="(digit, index) in workOrderInfo.ean.slice(1, 7)" :key="`left-${index}`">{{ digit }}</span>
                        </span>
                        <span class="ean-right-digits">
                          <span v-for="(digit, index) in workOrderInfo.ean.slice(7, 13)" :key="`right-${index}`">{{ digit }}</span>
                        </span>
                      </div>
                    </div>

                    <div class="footer-row">
                      <div class="footer-left">
                        <span class="production-date">生产日期：{{ workOrderInfo.productDate }}</span>
                      </div>
                      <div class="footer-right">
                        <div class="cert-box">
                          <span class="cert-text">合格证 已检验</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 扫描历史面板 -->
                <div class="scan-history-panel">
                  <div class="history-header">
                    <h4>扫描历史</h4>
                  </div>
                  <div class="history-list">
                    <div v-for="(item, index) in scanHistory" :key="index" class="history-item">
                      <div class="history-content">{{ item.content }}</div>
                      <div class="history-time">{{ item.time }}</div>
                    </div>
                    <div v-if="scanHistory.length === 0" class="no-history"></div>
                  </div>
                </div>
              </div>

              <!-- 预览信息 -->
              <div class="preview-info">
                <el-descriptions :column="2" size="small" border>
                  <el-descriptions-item label="标签尺寸">47mm × 30mm</el-descriptions-item>
                  <el-descriptions-item label="打印份数">{{ copies }} 份</el-descriptions-item>
                  <el-descriptions-item label="当前缩放">{{ (zoom * 100).toFixed(0) }}%</el-descriptions-item>
                  <el-descriptions-item label="当前打印机" :span="2">{{ selectedPrinter || '未选择' }}</el-descriptions-item>
                </el-descriptions>
              </div>
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
import { nextTick, onMounted, ref } from 'vue';
import html2canvas from 'html2canvas';
import { listShopOrder } from '@/api/mes/shopOrder';
import JsBarcode from 'jsbarcode';
import { Refresh } from '@element-plus/icons-vue';
import { getLodop } from '@/utils/LodopFuncs';
import { savePrintHistory } from '@/api/mes/shopOrderSfcPrintHistory';
import { HttpStatus } from '@/enums/RespEnum';
import ShopOrderDialog from '@/views/mes/workpanel/components/shopOrderDialog.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const settingFormRef = ref();
const shopOrderDialogRef = ref<InstanceType<typeof ShopOrderDialog>>();
const scanInputRef = ref<HTMLInputElement | null>(null);
const printContent = ref<HTMLElement | null>(null);
const snBarcodeSvg = ref<HTMLElement | null>(null);
const sixtyNineBarcodeSvg = ref<HTMLElement | null>(null);

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

// 工单信息
const workOrderInfo = ref({
  material: '',
  shopOrder: '',
  productDate: '',
  sfcContent: '',
  ean: '',
  sku: '',
  productDesc: '',
  color: '锖灰色'
});

const podConfig = ref<{ [key: string]: any }>({});

// 用户输入
const scanInput = ref('');
const copies = ref(1);
const printing = ref(false);
// 扫描历史
const scanHistory = ref<Array<{ content: string; time: string }>>([]);
// 预览设置
const zoom = ref(2);

// 验证规则
const rules = {
  workOrderNo: [{ required: true, message: '工单号码不能为空', trigger: 'blur' }]
};

// 显示工单选择对话框
const showShopOrderDialog = () => {
  podConfig.value.statusList = ['NEW', 'RELEASABLE', 'RELEASED', 'ACTIVE'];
  podConfig.value.shopOrderTypeList = ['PRODUCTION', 'PRODUCTION-ZZ', 'REWORK', 'REWORK-CJ'];
  shopOrderDialogRef.value.openDialog();
};
// 弹框回调
const shopOrderCallBack = (data: any) => {
  workOrderInfo.value.shopOrder = data.shopOrder;
  workOrderInfo.value.sku = data.sku;
  workOrderInfo.value.ean = data.ean;
  workOrderInfo.value.productDesc = data.productDesc;
  nextTick(() => {
    generateSixtyNineBarcode();
  });
};

/** 查询工序列表 */
const getShopOrderList = async () => {
  try {
    const res = await listShopOrder({
      shopOrder: workOrderInfo.value.shopOrder
    });
    if (res.total == 0) {
      proxy.$modal.msgError('工单号' + workOrderInfo.value.shopOrder + '资料不存在');
      return;
    }
    if (res.total > 1) {
      proxy.$modal.msgError('工单号' + workOrderInfo.value.shopOrder + '存在多笔资料');
      return;
    }
    const data = res.rows[0];
    workOrderInfo.value.shopOrder = data.shopOrder;
    workOrderInfo.value.sku = data.sku;
    workOrderInfo.value.ean = data.ean;
    workOrderInfo.value.productDesc = data.productDesc;
    generateSixtyNineBarcode();
  } catch (error) {
    proxy.$modal.msgError('查询工单数据失败: ' + (error as Error).message);
  }
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

  if (printers.length > 0) {
    if (!selectedPrinter.value) {
      const defaultPrinter = printers.find((p) => p.isDefault);
      selectedPrinter.value = defaultPrinter?.name || printers[0].name;
    }
  }
};

// 获取纸张列表
const getPaperList = (printerName: string) => {
  try {
    const LODOP = getLodop();
    if (!LODOP) {
      proxy.$modal.msgError('未检测到Lodop打印服务，请安装Lodop插件');
      return [];
    }

    // 参考Lodop示例的myCreatePagSizeList函数
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

    try {
      // 使用Create_PageSize_List获取纸张列表
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
  } catch (error) {
    console.error('获取纸张列表失败:', error);
    return [];
  }
};

// 刷新纸张列表
const refreshPapers = async () => {
  if (!selectedPrinter.value) {
    proxy.$modal.msgWarning('请先选择打印机');
    return;
  }

  const papers = await getPaperList(selectedPrinter.value);
  paperList.value = papers;

  if (papers.length > 0) {
    const paperStillExists = papers.some((paper) => paper.value === selectedPaper.value);
    const preferredPaper = papers.find((paper) => /小米\s*-?\s*SN69/i.test(`${paper.label} ${paper.value}`));
    if (!paperStillExists) selectedPaper.value = preferredPaper?.value ?? papers[0].value;
  } else {
    selectedPaper.value = '';
  }
};

// 打印机变更事件
const onPrinterChange = async () => {
  selectedPaper.value = '';
  await refreshPapers(); // 打印机变更时自动刷新纸张列表
};

// 纸张变更事件
const onPaperChange = () => {
  // 可以在这里处理纸张变更逻辑
  console.log('纸张已更改:', selectedPaper.value);
};

/**
 * JsBarcode("#barcode", "123", {
 *   format: "CODE39",//选择要使用的条形码类型
 *   width:3,//设置条之间的宽度
 *   height:100,//高度
 *   displayValue:true,//是否在条形码下方显示文字
 *   text:"456",//覆盖显示的文本
 *   fontOptions:"bold italic",//使文字加粗体或变斜体
 *   font:"fantasy",//设置文本的字体
 *   textAlign:"left",//设置文本的水平对齐方式
 *   textPosition:"top",//设置文本的垂直位置
 *   textMargin:5,//设置条形码和文本之间的间距
 *   fontSize:15,//设置文本的大小
 *   background:"#eee",//设置条形码的背景
 *   lineColor:"#2196f3",//设置条和文本的颜色。
 *   margin:15//设置条形码周围的空白边距
 * });
 */

// 生成条形码
const generateBarcode = () => {
  const content = workOrderInfo.value.sfcContent;
  if (!content || !snBarcodeSvg.value) return;

  snBarcodeSvg.value.innerHTML = '';
  try {
    JsBarcode(snBarcodeSvg.value, content, {
      format: 'CODE128',
      displayValue: false,
      height: 28,
      width: 1,
      margin: 0
    });
    const svg = snBarcodeSvg.value;
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('preserveAspectRatio', 'none');
  } catch (error) {
    console.error('条形码生成失败:', error);
  }
};

const EAN_L_CODES = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const EAN_G_CODES = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const EAN_R_CODES = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
const EAN_PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
const EAN_GUARD_MODULES = new Set([0, 2, 46, 48, 92, 94]);

const buildEan13Modules = (content: string) => {
  if (!/^\d{13}$/.test(content)) throw new Error('69码必须是13位数字');
  const digits = [...content].map(Number);
  const parity = EAN_PARITY[digits[0]];
  let modules = '101';
  for (let index = 1; index <= 6; index++) {
    modules += parity[index - 1] === 'L' ? EAN_L_CODES[digits[index]] : EAN_G_CODES[digits[index]];
  }
  modules += '01010';
  for (let index = 7; index <= 12; index++) modules += EAN_R_CODES[digits[index]];
  return `${modules}101`;
};

// 生成固定为 95 个模块的 EAN-13 条线，文字由 HTML 单独定位
const generateSixtyNineBarcode = () => {
  const content = workOrderInfo.value.ean;
  if (!content || !sixtyNineBarcodeSvg.value) {
    return;
  }
  sixtyNineBarcodeSvg.value.innerHTML = '';
  if (!/^\d{13}$/.test(content)) {
    console.error('69码生成失败: EAN-13 必须是13位数字');
    return;
  }

  const modules = buildEan13Modules(content);

  const bars = [...modules].map((module, index) => (module === '1' ? `<rect x="${index}" y="0" width="1" height="${EAN_GUARD_MODULES.has(index) ? 103 : 80}" />` : '')).join('');
  const svg = sixtyNineBarcodeSvg.value;
  svg.setAttribute('viewBox', '0 0 95 103');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.innerHTML = bars;
};

const TX610_DPI = 600;
const CSS_DPI = 96;
const LABEL_FONT = "'MiSans Regular', sans-serif";

// 合格证单独用 MiSans Regular 重绘。网页截图会把 0.12mm 外框放大成粗黑线，小字也会发糊。
const paintCertificate = (canvas: HTMLCanvasElement, clone: HTMLElement, bounds: DOMRect) => {
  const certBox = clone.querySelector('.cert-box') as HTMLElement | null;
  const context = canvas.getContext('2d');
  if (!certBox || !context) return;
  const boxRect = certBox.getBoundingClientRect();
  if (boxRect.width <= 0 || boxRect.height <= 0) return;

  const scaleX = canvas.width / bounds.width;
  const scaleY = canvas.height / bounds.height;
  const x = Math.round((boxRect.left - bounds.left) * scaleX);
  const y = Math.round((boxRect.top - bounds.top) * scaleY);
  const w = Math.max(1, Math.round(boxRect.width * scaleX));
  const h = Math.max(1, Math.round(boxRect.height * scaleY));
  const borderPx = 1;

  context.fillStyle = '#ffffff';
  context.fillRect(x - 4, y - 4, w + 8, h + 8);
  context.fillStyle = '#000000';
  context.fillRect(x, y, w, borderPx);
  context.fillRect(x, y + h - borderPx, w, borderPx);
  context.fillRect(x, y, borderPx, h);
  context.fillRect(x + w - borderPx, y, borderPx, h);

  const fontPx = (3.5 * TX610_DPI) / 72;
  context.font = `${fontPx}px ${LABEL_FONT}`;
  context.fillStyle = '#000000';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const innerX = x + borderPx;
  const innerY = y + borderPx;
  const innerW = Math.max(1, w - borderPx * 2);
  const innerH = Math.max(1, h - borderPx * 2);
  context.save();
  context.beginPath();
  context.rect(innerX, innerY, innerW, innerH);
  context.clip();
  context.fillText('合格证 已检验', x + w / 2, y + h / 2);
  context.restore();

  const pixels = context.getImageData(innerX, innerY, innerW, innerH);
  const data = pixels.data;
  for (let index = 0; index < data.length; index += 4) {
    const luminance = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const color = luminance < 128 ? 0 : 255;
    data[index] = color;
    data[index + 1] = color;
    data[index + 2] = color;
    data[index + 3] = 255;
  }
  context.putImageData(pixels, innerX, innerY);
};

// 按打印机原生分辨率截取网页模板，再转成纯黑白图，保证实物布局与网页预览一致。
const renderPrintImage = async () => {
  if (!printContent.value) throw new Error('标签模板尚未加载');

  await nextTick();
  const clone = printContent.value.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, {
    position: 'fixed',
    top: '0',
    left: '-10000px',
    margin: '0',
    transform: 'none',
    transformOrigin: 'top left',
    boxShadow: 'none'
  });
  const clonedEanBars = clone.querySelector('.ean-bars') as SVGElement | null;
  if (clonedEanBars) {
    const modules = buildEan13Modules(workOrderInfo.value.ean);
    const barcodeCanvas = document.createElement('canvas');
    barcodeCanvas.width = Math.round((38.5 * TX610_DPI) / 25.4);
    barcodeCanvas.height = Math.round((10.3 * TX610_DPI) / 25.4);
    barcodeCanvas.setAttribute('style', 'position:absolute;top:0;left:5.1mm;display:block;width:38.5mm;height:10.3mm;');
    const barcodeContext = barcodeCanvas.getContext('2d');
    if (!barcodeContext) throw new Error('无法创建69码图像');
    const moduleWidth = barcodeCanvas.width / 95;
    barcodeContext.fillStyle = '#000000';
    [...modules].forEach((module, index) => {
      if (module !== '1') return;
      const left = Math.round(index * moduleWidth);
      const right = Math.round((index + 1) * moduleWidth);
      const height = EAN_GUARD_MODULES.has(index) ? barcodeCanvas.height : Math.round((8 / 10.3) * barcodeCanvas.height);
      barcodeContext.fillRect(left, 0, Math.max(1, right - left), height);
    });
    clonedEanBars.replaceWith(barcodeCanvas);
  }
  const clonedCertBox = clone.querySelector('.cert-box') as HTMLElement | null;
  if (clonedCertBox) clonedCertBox.style.borderColor = 'transparent';
  document.body.appendChild(clone);
  await Promise.all([document.fonts.load(`${(4 * TX610_DPI) / 72}px "MiSans Regular"`), document.fonts.load(`${(3.5 * TX610_DPI) / 72}px "MiSans Regular"`)]);

  try {
    const bounds = clone.getBoundingClientRect();
    const canvas = await html2canvas(clone, {
      scale: TX610_DPI / CSS_DPI,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: bounds.width,
      height: bounds.height
    });
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('无法创建标签图像');

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < pixels.data.length; index += 4) {
      const luminance = pixels.data[index] * 0.299 + pixels.data[index + 1] * 0.587 + pixels.data[index + 2] * 0.114;
      const color = luminance < 128 ? 0 : 255;
      pixels.data[index] = color;
      pixels.data[index + 1] = color;
      pixels.data[index + 2] = color;
      pixels.data[index + 3] = 255;
    }
    context.putImageData(pixels, 0, 0);
    await document.fonts.load(`${(3.5 * TX610_DPI) / 72}px "MiSans Regular"`);
    paintCertificate(canvas, clone, bounds);
    return canvas.toDataURL('image/png');
  } finally {
    clone.remove();
  }
};

// 处理扫描输入回车事件
const keyDownTab = async () => {
  if (!scanInput.value.trim()) return;

  workOrderInfo.value.sfcContent = scanInput.value.trim();
  scanInput.value = '';

  // 添加到扫描历史
  const now = new Date();
  const timeString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  scanHistory.value.unshift({
    content: workOrderInfo.value.sfcContent,
    time: timeString
  });

  // 限制历史记录数量为10条
  if (scanHistory.value.length > 5) {
    scanHistory.value = scanHistory.value.slice(0, 5);
  }

  await nextTick();
  await generateBarcode();
  // await handlePrint();
  try {
    printing.value = true;
    const res = await savePrintHistory({
      shopOrderSfcBoList: [
        {
          shopOrder: workOrderInfo.value.shopOrder,
          sfc: workOrderInfo.value.sfcContent
        }
      ],
      printType: 2,
      businessCode: 'MI'
    });
    if (res.code !== HttpStatus.SUCCESS) {
      printing.value = false;
      return;
    }
    workOrderInfo.value.productDate = res.data[0].productDate;
    const LODOP = getLodop();
    if (!LODOP) {
      proxy.$modal.msgError('未检测到Lodop打印服务，请安装Lodop插件');
      return;
    }
    // 按标签实际尺寸初始化任务，避免沿用 A4 画布后再由驱动缩放
    LODOP.PRINT_INITA('0mm', '0mm', '47mm', '30mm', '小米汽车SN69标签');
    // 设置打印机
    LODOP.SET_PRINTER_INDEX(selectedPrinter.value);

    // 选择驱动中已有的 47x30 标签纸；已有纸张只传名称，不能再次传宽高。
    if (selectedPaper.value) {
      LODOP.SET_PRINT_PAGESIZE(0, 0, 0, selectedPaper.value);
    } else {
      LODOP.SET_PRINT_PAGESIZE(1, 470, 300, '');
    }
    // 固定为原始比例，禁止继承预览或其他任务的自适应缩放。
    LODOP.SET_PRINT_MODE('PRINT_PAGE_PERCENT', '100%');
    const image = await renderPrintImage();
    LODOP.ADD_PRINT_IMAGE('0mm', '0mm', '47mm', '30mm', image);
    LODOP.SET_PRINT_STYLEA(0, 'Stretch', 1);

    // ========== 预览或打印 ==========
    // LODOP.PRINT_DESIGN(); // 设计模式，调试时使用
    // LODOP.PREVIEW(); // 预览
    LODOP.PRINT(); // 直接打印
  } finally {
    printing.value = false;
  }
};

// 导出标签
const exportLabel = async () => {
  try {
    const canvas = await html2canvas(printContent.value!, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const link = document.createElement('a');
    link.download = `MI标签_${workOrderInfo.value.sfcContent}_${new Date().getTime()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    proxy.$modal.msgSuccess('标签已导出');
  } catch (error) {
    proxy.$modal.msgError('导出失败:' + +(error as Error).message);
  }
};

// 初始化
onMounted(() => {
  nextTick(() => {
    // 生成条形码
    generateBarcode();
    generateSixtyNineBarcode();

    // 设置生产日期
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    workOrderInfo.value.productDate = `${year}.${month}`;

    // 获取打印机列表
    setTimeout(() => {
      refreshPrinterList();
    }, 500);

    // 自动聚焦到扫描输入框
    scanInputRef.value?.focus();
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

.card-header span {
  font-size: 14px;
  color: #303133;
}

.printer-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.paper-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.printer-default {
  background-color: #e8f4ff;
  color: #409eff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
}

.preview-area {
  padding: 0 10px;
  background-color: #f5f7fa;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e6e6e6;
  flex-shrink: 0;
  background-color: #fafbfc;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-left h3 {
  font-size: 16px;
  margin: 0;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
}

.single-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
}

.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.preview-main-history-container {
  display: flex;
  flex: 1;
  gap: 20px;
  width: 100%;
  height: 100%;
}

.preview-wrapper {
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
    -10px 0px;
}

.scan-history-panel {
  width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

.history-header {
  padding: 15px;
  border-bottom: 1px solid #eee;
  background-color: #fafbfc;
}

.history-header h4 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.history-item {
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-item:hover {
  background-color: #f5f7fa;
}

.history-content {
  font-size: 13px;
  color: #333;
  word-break: break-all;
  margin-bottom: 4px;
}

.history-time {
  font-size: 12px;
  color: #999;
}

.no-history {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 20px 0;
}

.preview-info {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 4px;
}

/* MI标签模板样式 */
.mi-print-sn-template {
  width: 47mm;
  height: 30mm;
  background: white;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.top-section {
  position: absolute;
  top: 2mm;
  left: 2mm;
  width: 43mm;
  height: 2.2mm;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'MiSans Regular', sans-serif;
  font-size: 4pt;
  line-height: 2.2mm;
  white-space: nowrap;
}

.product-description {
  width: 31.5mm;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-color {
  width: 11.5mm;
  text-align: right;
}

.barcode-section {
  position: absolute;
  top: 4.4mm;
  left: 2mm;
  width: 43mm;
  height: 5mm;
  display: flex;
  justify-content: center;
  align-items: center;
}

.barcode-section svg {
  display: block;
  width: 100%;
  height: 100%;
}

.sixty-nine-barcode-section {
  position: absolute;
  top: 12mm;
  left: 0;
  width: 47mm;
  height: 10.3mm;
}

.ean-bars {
  position: absolute;
  top: 0;
  left: 5.1mm;
  display: block;
  width: 38.5mm;
  height: 10.3mm;
  fill: #000;
}

.ean-readable {
  position: absolute;
  top: 8.5mm;
  left: 0;
  width: 47mm;
  height: 3.55mm;
  overflow: visible;
  color: #000;
  font-family: Arial, sans-serif;
  font-size: 10pt;
  line-height: 3.55mm;
}

.ean-leading-digit,
.ean-left-digits,
.ean-right-digits {
  position: absolute;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 3.55mm;
}

.ean-leading-digit {
  top: 0.3mm;
  left: 1.8mm;
  width: 3mm;
  justify-content: center;
}

.ean-left-digits {
  top: 0.3mm;
  left: 6.3158mm;
  width: 17.0211mm;
}

.ean-right-digits {
  top: 0.3mm;
  left: 25.3632mm;
  width: 17.0211mm;
}

.info-section {
  position: absolute;
  top: 9.56mm;
  left: 2mm;
  width: 43mm;
  height: 2.3mm;
  display: flex;
  justify-content: space-between;
  font-family: Arial, sans-serif;
  font-size: 4.5pt;
  line-height: 2.3mm;
  white-space: nowrap;
}

.sn-sku-row {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
}

.sn-value {
  width: 25.5mm;
  overflow: hidden;
}

.sku-value {
  width: 17.5mm;
  overflow: hidden;
  text-align: right;
}

.footer-row {
  position: absolute;
  top: 25mm;
  left: 2mm;
  width: 43mm;
  height: 2.8mm;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left {
  flex: 1;
  display: flex;
}

.footer-left .production-date {
  font-family: 'MiSans Regular', sans-serif;
  font-size: 4pt;
  color: #000;
  display: flex;
  align-items: center;
  line-height: 2.3mm;
}

.cert-box {
  position: relative;
  width: max-content;
  height: 2.6mm;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 0.12mm solid #000;
  padding: 0 0.45mm;
}

.cert-text {
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'MiSans Regular', sans-serif;
  font-size: 3.5pt;
  line-height: 1;
  color: #000;
  white-space: nowrap;
}

/* 屏幕显示时放大200%。0.12mm 边框会先变成 1px 再被放大，合格证外框会显得过黑。 */
@media screen {
  .mi-print-sn-template {
    transform: scale(2);
    /*    transform-origin: top center;*/
  }

  .cert-box {
    border-width: 0;
  }

  .cert-box::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 200%;
    height: 200%;
    box-sizing: border-box;
    border: 1px solid #000;
    transform: scale(0.5);
    transform-origin: top left;
    pointer-events: none;
  }
}

/* 只挪页面预览。截图克隆不在 .preview-wrapper 里，base64 仍按框中线重绘。 */
.preview-wrapper .cert-text {
  transform: translateY(0.38mm);
}
</style>
