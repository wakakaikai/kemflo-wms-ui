<template>
  <div class="print-container">
    <el-container>
      <!-- 左侧菜单区域 -->
      <el-aside width="320px" class="sidebar">
        <div class="menu-section">
          <h4>选择打印数据</h4>
          <el-tabs v-model="activeTab" class="print-tabs">
            <el-tab-pane label="内容打印" name="content">
              <el-radio-group v-model="currentTemplate" class="template-list">
                <el-radio label="designA4">工业设计+A4/A5纸</el-radio>
                <el-radio label="productionReceipt">生产入库单模板打印</el-radio>
                <el-radio label="qr5060">工业二维码(50×60mm)</el-radio>
                <el-radio label="qr3040">工业二维码(30×40mm)</el-radio>
                <el-radio label="qr8060">工业二维码(80×60mm)</el-radio>
                <el-radio label="qr9784">工业二维码(97×84mm)</el-radio>
              </el-radio-group>
            </el-tab-pane>
            <el-tab-pane label="Excel模板打印" name="excel">
              <el-radio-group v-model="selectedExcelTemplate" class="template-list">
                <el-radio label="qrExcel">工业二维码.xlsx</el-radio>
                <el-radio label="listExcel">工业列表.xlsx</el-radio>
                <el-radio label="materialExcel">用料清单.xlsx</el-radio>
              </el-radio-group>
            </el-tab-pane>
          </el-tabs>
        </div>

        <div class="menu-section">
          <h4>打印设置</h4>

          <!-- 工单信息输入 -->
          <el-form label-position="top">
            <el-form-item label="公司名称">
              <el-input v-model="workOrderInfo.companyName" placeholder="请输入公司名称" />
            </el-form-item>
            <el-form-item label="MR编号">
              <el-input v-model="workOrderInfo.mrNumber" placeholder="请输入MR编号" />
            </el-form-item>
            <el-form-item label="工单号码">
              <el-input v-model="workOrderInfo.workOrderNo" placeholder="请输入工单号码" />
            </el-form-item>
            <el-form-item label="版本号">
              <el-input v-model="workOrderInfo.versionNo" placeholder="请输入版本号" />
            </el-form-item>
            <el-form-item label="产品品号">
              <el-input v-model="workOrderInfo.productCode" placeholder="请输入产品品号" />
            </el-form-item>
            <el-form-item label="产品描述">
              <el-input v-model="workOrderInfo.productDescription" placeholder="请输入产品描述" />
            </el-form-item>
            <el-form-item label="入库数量">
              <el-input-number v-model="workOrderInfo.stockInQuantity" :min="1" />
            </el-form-item>
            <el-form-item label="生产日期">
              <el-date-picker v-model="workOrderInfo.productionDate" type="date" placeholder="请选择生产日期" value-format="YYYY/MM/DD" />
            </el-form-item>
            <el-form-item label="生产级别">
              <el-input v-model="workOrderInfo.productionLevel" placeholder="请输入生产级别" />
            </el-form-item>
            <el-form-item label="操作员">
              <el-input v-model="workOrderInfo.operator" placeholder="请输入操作员" />
            </el-form-item>
            <el-form-item label="检验员">
              <el-input v-model="workOrderInfo.inspector" placeholder="请输入检验员" />
            </el-form-item>
          </el-form>
        </div>

        <div class="action-buttons">
          <el-button type="primary" @click="handlePrint" class="print-btn">
            <el-icon><Printer /></el-icon>
            立即打印
          </el-button>
          <el-button @click="handleExport" class="export-btn">
            <el-icon><Picture /></el-icon>
            导出图片
          </el-button>
        </div>
      </el-aside>

      <!-- 主内容预览区域 -->
      <el-main class="preview-area">
        <div class="preview-container">
          <div class="preview-header">
            <h3>打印预览</h3>
            <div class="preview-controls">
              <el-select v-model="paperSize" class="paper-size-select" @change="handlePaperSizeChange">
                <el-option v-for="size in availablePaperSizes" :key="size.value" :label="size.label" :value="size.value" />
              </el-select>

              <el-input-number v-model="copies" :min="1" :max="100" label="打印份数" class="copies-input" />
            </div>
          </div>

          <div class="preview-content">
            <!-- 生产入库单模板 -->
            <div v-if="currentTemplate === 'productionReceipt'" :class="['production-receipt', getPaperSizeClass()]" ref="printContent">
              <div class="receipt-header">
                <div class="company-name-container">
                  <span class="company-name">{{ workOrderInfo.companyName }}</span>
                </div>
              </div>
              <hr class="top-hr" />
              <div class="receipt-body">
                <div class="content-section">
                  <div class="info-row">
                    <label>工单号码</label>
                    <span>{{ workOrderInfo.workOrderNo }}</span>
                  </div>
                  <div class="info-row">
                    <label>产品品号</label>
                    <span>{{ workOrderInfo.productCode }}</span>
                  </div>
                  <div class="info-row product-description">
                    <label>产品描述</label>
                    <span>{{ workOrderInfo.productDescription }}</span>
                  </div>
                  <div class="info-row">
                    <label>入库数量</label>
                    <span>{{ workOrderInfo.stockInQuantity }} PCS</span>
                  </div>
                  <div class="info-row">
                    <label>生产日期</label>
                    <span>{{ workOrderInfo.productionDate }}</span>
                  </div>
                  <div class="info-row">
                    <label>生产线别</label>
                    <span>{{ workOrderInfo.productionLevel }}</span>
                  </div>
                  <div class="info-row">
                    <label>操&nbsp;&nbsp;作 员</label>
                    <span>{{ workOrderInfo.operator }}</span>
                  </div>
                  <div class="info-row">
                    <label>检&nbsp;&nbsp;验 员</label>
                    <span>{{ workOrderInfo.inspector }}</span>
                  </div>
                </div>
                <div class="qr-section">
                  <canvas ref="qrcodeCanvas"></canvas>
                </div>
              </div>
              <hr class="bottom-hr" />
            </div>

            <!-- 工业二维码(80×60mm)模板 -->
            <div v-else-if="currentTemplate === 'qr8060'" class="qr-template qr8060" ref="printContent">
              <div class="qr-container">
                <canvas ref="qrCanvas8060"></canvas>
                <div class="qr-info">
                  <p>{{ workOrderInfo.workOrderNo }}</p>
                  <p>{{ workOrderInfo.productCode }}</p>
                  <p>{{ workOrderInfo.stockInQuantity }} PCS</p>
                </div>
              </div>
            </div>

            <!-- 其他模板... -->
            <!-- 生产入库单模板 -->
            <div v-if="currentTemplate === 'qr9784'" :class="['production-receipt', getPaperSizeClass()]" ref="printContent">
              <div class="receipt-header">
                <div class="company-name-container">
                  <span class="company-name">{{ workOrderInfo.companyName }}</span>
                </div>
              </div>
              <hr class="top-hr" />
              <div class="receipt-body">
                <div class="content-section">
                  <!-- 工单号码占一行 -->
                  <div class="info-row full-row">
                    <label>工单号码</label>
                    <span>{{ workOrderInfo.workOrderNo }}</span>
                  </div>
                  <!-- 产品品号占一行 -->
                  <div class="info-row full-row">
                    <label>产品品号</label>
                    <span>{{ workOrderInfo.productCode }}</span>
                  </div>
                  <!-- 产品描述占一行 -->
                  <div class="info-row full-row product-description">
                    <label>产品描述</label>
                    <span>{{ workOrderInfo.productDescription }}</span>
                  </div>
                  <!-- 其他字段与二维码同行 -->
                  <div class="info-with-qr">
                    <div class="info-column">
                      <div class="info-row">
                        <label>入库数量</label>
                        <span>{{ workOrderInfo.stockInQuantity }} PCS</span>
                      </div>
                      <div class="info-row">
                        <label>生产日期</label>
                        <span>{{ workOrderInfo.productionDate }}</span>
                      </div>
                      <div class="info-row">
                        <label>生产线别</label>
                        <span>{{ workOrderInfo.productionLevel }}</span>
                      </div>
                      <div class="info-row">
                        <label>操&nbsp;&nbsp;作 员</label>
                        <span>{{ workOrderInfo.operator }}</span>
                      </div>
                      <div class="info-row">
                        <label>检&nbsp;&nbsp;验 员</label>
                        <span>{{ workOrderInfo.inspector }}</span>
                      </div>
                    </div>
                    <div class="qr-section">
                      <canvas ref="qrcodeCanvas"></canvas>
                    </div>
                  </div>
                </div>
              </div>
              <hr class="bottom-hr" />
            </div>
          </div>

          <div class="action-buttons">
            <el-button type="primary" @click="handlePrint" :icon="Printer">打印</el-button>
            <el-button @click="handleExportImage" :icon="Picture">导出图片</el-button>
            <el-button @click="handleExportExcel" :icon="Document" v-if="printType === 'excel'">导出Excel</el-button>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { Printer, Picture, Document } from '@element-plus/icons-vue';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { ElMessage } from 'element-plus';

const activeTab = ref('content');
const currentTemplate = ref('productionReceipt'); // 默认选中生产入库单模板
const selectedExcelTemplate = ref('qrExcel');

const paperSize = ref('9784'); // 默认纸张大小设置为97×84mm
const copies = ref(1);
const availablePaperSizes = ref([
  { value: 'A4', label: 'A4 (210×297mm)' },
  { value: 'A5', label: 'A5 (148×210mm)' },
  { value: '5060', label: '50×60mm' },
  { value: '3040', label: '30×40mm' },
  { value: '8060', label: '80×60mm' },
  { value: '9784', label: '97×84mm' } // 默认选中项
]);

// 工单信息
const workOrderInfo = ref({
  companyName: '溢泰（南京）环保科技有限公司',
  mrNumber: '21-02',
  workOrderNo: '000120015113',
  versionNo: '2025071700201 v1',
  productCode: '13014122802-02',
  productDescription: '后置碳棒滤瓶，φ46*179, PP+20% TALC染抽,白,海尔,后置碳棒滤瓶，φ46*179, PP+20% TALC染抽,白,海尔',
  stockInQuantity: 168,
  productionDate: '2025/07/10',
  productionLevel: 'A12',
  operator: '雷革',
  inspector: ''
});

// DOM引用
const qrcodeCanvas = ref(null);
const qrCanvas5060 = ref(null);
const qrCanvas8060 = ref(null);
const printContent = ref(null);

// 根据选择的纸张大小返回对应的CSS类名
const getPaperSizeClass = () => {
  switch (paperSize.value) {
    case '5060':
      return 'size5060';
    case '3040':
      return 'size3040';
    case '8060':
      return 'size8060';
    case '9784':
      return 'size9784';
    case 'A4':
    case 'A5':
    default:
      return 'thermal-size';
  }
};

// 处理纸张大小变化
const handlePaperSizeChange = () => {
  nextTick(() => {
    generateQRCode();
  });
};

// 生成二维码
const generateQRCode = () => {
  const content = `20250717000201`;

  if (qrcodeCanvas.value) {
    // 根据纸张大小调整二维码尺寸
    let qrSize = 120;
    if (paperSize.value === '5060') qrSize = 150;
    if (paperSize.value === '8060') qrSize = 180;
    if (paperSize.value === '9784') qrSize = 80;
    if (currentTemplate.value === 'qr9784' && paperSize.value === '9784') qrSize = 100;

    QRCode.toCanvas(qrcodeCanvas.value, content, {
      width: qrSize,
      margin: 1,
      color: { dark: '#000', light: '#fff' }
    });
  }

  if (qrCanvas5060.value) {
    QRCode.toCanvas(qrCanvas5060.value, content, {
      width: 150,
      margin: 1,
      color: { dark: '#000', light: '#fff' }
    });
  }

  if (qrCanvas8060.value) {
    QRCode.toCanvas(qrCanvas8060.value, content, {
      width: 180,
      margin: 1,
      color: { dark: '#000', light: '#fff' }
    });
  }
};

// 打印处理
const handlePrint = async () => {
  if (!printContent.value) return;

  try {
    const canvas = await html2canvas(printContent.value, {
      scale: 2,
      logging: false,
      useCORS: true,
      scrollX: 0,
      scrollY: 0
    });

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      let printContentHTML = '';
      for (let i = 0; i < copies.value; i++) {
        printContentHTML += `
          <div style="page-break-after: ${i < copies.value - 1 ? 'always' : 'auto'};">
            <img src="${canvas.toDataURL('image/png')}" style="width:100%; height:100%;" />
          </div>
        `;
      }

      // 根据纸张大小设置打印页面尺寸
      let printStyles = '';
      switch (paperSize.value) {
        case '9784':
          printStyles = `
            @page {
              size: 97mm 84mm;
              margin: 0;
            }
            body {
              width: 97mm;
              height: 84mm;
              margin: 0;
              padding: 0;
            }
          `;
          break;
        case '8060':
          printStyles = `
            @page {
              size: 80mm 60mm;
              margin: 0;
            }
            body {
              width: 80mm;
              height: 60mm;
              margin: 0;
              padding: 0;
            }
          `;
          break;
        case '5060':
          printStyles = `
            @page {
              size: 50mm 60mm;
              margin: 0;
            }
            body {
              width: 50mm;
              height: 60mm;
              margin: 0;
              padding: 0;
            }
          `;
          break;
        case '3040':
          printStyles = `
            @page {
              size: 30mm 40mm;
              margin: 0;
            }
            body {
              width: 30mm;
              height: 40mm;
              margin: 0;
              padding: 0;
            }
          `;
          break;
        default:
          printStyles = `
            @page {
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          `;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>打印预览</title>
            <style>
              ${printStyles}
              @media print {
                img {
                  width: 100%;
                  height: 100%;
                  max-width: 100%;
                  max-height: 100%;
                }
              }
            </style>
          </head>
          <body onload="window.print(); setTimeout(() => window.close(), 500);">
            ${printContentHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  } catch (error) {
    console.error('打印失败:', error);
    ElMessage.error('打印失败，请重试');
  }
};

// 导出图片
const handleExportImage = async () => {
  if (!printContent.value) return;

  try {
    const canvas = await html2canvas(printContent.value, {
      scale: 2,
      logging: false,
      useCORS: true
    });

    const link = document.createElement('a');
    link.download = `工单流转卡_${workOrderInfo.value.workOrderNo}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('导出图片失败:', error);
    ElMessage.error('导出图片失败');
  }
};

// 监听模板变化
watch(currentTemplate, () => {
  nextTick(() => {
    generateQRCode();
  });
});

// 监听纸张大小变化
watch(paperSize, () => {
  nextTick(() => {
    generateQRCode();
  });
});

// 监听工单信息变化
watch(
  workOrderInfo,
  () => {
    nextTick(generateQRCode);
  },
  { deep: true }
);

// 初始化
onMounted(() => {
  generateQRCode();
});
</script>

<style scoped>
.print-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.el-container {
  height: calc(100vh - 60px);
}

.sidebar {
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
  padding: 16px;
  overflow-y: auto;
  height: 100%;
}

.menu-section {
  margin-bottom: 24px;
}

.template-list {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.template-list .el-radio {
  margin-bottom: 8px;
  width: 100%;
}
/* 为最后一个 el-radio 元素添加左边距 */
.template-list .el-radio:last-child {
  margin-left: -30px;
}
.preview-area {
  padding: 16px;
  background-color: #f5f7fa;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-container {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e6e6e6;
  flex-shrink: 0;
}

.preview-header h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.paper-size-select {
  width: 180px;
}

.copies-input {
  width: 120px;
}

.preview-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* 生产入库单模板 */
.production-receipt {
  width: 100%;
  padding: 5px;
  box-sizing: border-box;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  /* 添加以下属性来隐藏多余部分 */
  overflow: hidden;
}

/* 产品描述最多显示3行 */
.product-description span {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 默认热敏纸尺寸 */
.thermal-size {
  width: 80mm;
  height: 60mm;
  font-size: 10px;
}

/* 不同纸张尺寸 */
.size5060 {
  width: 50mm;
  height: 60mm;
  font-size: 10px;
}

.size3040 {
  width: 30mm;
  height: 40mm;
  font-size: 8px;
}

.size8060 {
  width: 80mm;
  height: 60mm;
  font-size: 10px;
}

.size9784 {
  width: 97mm;
  height: 84mm;
  font-size: 12px;
  /* 添加以下属性来确保内容不会超出容器 */
  overflow: hidden;
  box-sizing: border-box;
}
/* 适配97×84mm尺寸的内容样式 */
.size9784 .receipt-header {
  margin-bottom: 8px;
}

.size9784 .company-name {
  font-size: 16px;
  font-weight: bold;
}

.size9784 .info-row label {
  width: 22mm;
  font-size: 13px;
  margin-right: 1mm;
}

.size9784 .info-row span {
  font-size: 13px;
  line-height: 1.5;
}

.size9784 .qr-section canvas {
  max-width: 90%;
  max-height: 90%;
}

.size9784 .top-hr,
.size9784 .bottom-hr {
  margin: 6px 0;
  height: 2px;
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

/* 公司名称容器 */
.company-name-container {
  text-align: center;
  width: 100%;
}

.company-name {
  font-size: 14px; /* 增大公司名称字体 */
  font-weight: bold;
  display: block;
}

.receipt-body {
  display: flex;
  flex-direction: row;
}

.content-section {
  flex: 3;
  padding-right: 5px;
}

.info-row {
  display: flex;
  margin-bottom: 5px; /* 增加行间距 */
}

.info-row label {
  width: 18mm; /* 增加标签宽度 */
  font-weight: bold;
  flex-shrink: 0;
  font-size: 12px; /* 增大标签字体 */
  margin-right: 0mm; /* 增加标签与内容的间距 */
}

.info-row span {
  flex: 1;
  word-break: break-all;
  font-size: 12px; /* 增大内容字体 */
  line-height: 1.4; /* 增加行高 */
}

.qr-section {
  flex: 1;
  padding-left: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-section canvas {
  width: 100%;
  height: auto;
  max-width: 100%;
  max-height: 100%;
}

/* 横线样式 */
.top-hr,
.bottom-hr {
  margin: 5px 0;
  border: none;
  height: 2px;
  background-color: #000;
  width: 100%;
}

.top-hr {
  margin-top: 10px;
}

.bottom-hr {
  margin-bottom: 10px;
}

/* 新增样式 */
.info-with-qr {
  display: flex;
  flex-direction: row;
}

.info-column {
  flex: 2;
}

.info-row.full-row {
  display: block;
}

.info-row.full-row label {
  width: auto;
  display: inline-block;
  margin-right: 10px;
}

.info-row.full-row span {
  display: inline-block;
}

/* 二维码模板样式 - 80×60mm */
.qr-template.qr8060 {
  width: 80mm;
  height: 60mm;
  padding: 5mm;
  box-sizing: border-box;
  background-color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.qr-template.qr8060 .qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-template.qr8060 .qr-container canvas {
  border: 1px solid #eee;
  padding: 2px;
  background: white;
}

.qr-template.qr8060 .qr-info {
  margin-top: 5px;
  text-align: center;
  font-size: 10px;
}

.qr-template.qr8060 .qr-info p {
  margin: 2px 0;
}

.action-buttons {
  padding: 16px;
  border-top: 1px solid #e6e6e6;
  display: flex;
  justify-content: center;
  gap: 12px;
}

/* 响应式调整 */
@media screen and (max-width: 992px) {
  .el-container {
    flex-direction: column;
    height: auto;
  }

  .el-aside {
    width: 100% !important;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #e6e6e6;
  }

  .preview-content {
    padding: 10px;
  }
}
</style>
