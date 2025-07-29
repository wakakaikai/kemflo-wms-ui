<template>
  <div class="heihu-print-system">
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
                <!-- 新增选项 -->
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
            <div v-if="currentTemplate === 'productionReceipt'" class="production-receipt thermal-size" ref="printContent">
              <div class="receipt-header">
                <div class="company-name-container">
                  <span class="company-name">{{ workOrderInfo.companyName }}</span>
<!--                  <hr class="company-name-hr" />-->
                </div>
                <!--                <span class="title">生产入库单</span>
                    <span class="mr-number">MR(P) - {{ workOrderInfo.mrNumber }}</span>-->
              </div>
              <hr class="top-hr" />
              <!-- 工单号上方横线 -->
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
                    <label>操作员</label>
                    <span>{{ workOrderInfo.operator }}</span>
                  </div>
                  <div class="info-row">
                    <label>检验员</label>
                    <span>{{ workOrderInfo.inspector }}</span>
                  </div>
                </div>
                <div class="qr-section">
                  <canvas ref="qrcodeCanvas"></canvas>
                </div>
              </div>
              <hr class="bottom-hr" />
              <!-- 检验员下方横线 -->
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
<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { Printer, Picture, Document } from '@element-plus/icons-vue';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { ElMessage } from 'element-plus';

const activeTab = ref('content');
const currentTemplate = ref('designA4');
const selectedExcelTemplate = ref('qrExcel');

const paperSize = ref('A4');
const copies = ref(1);
const availablePaperSizes = ref([
  { value: 'A4', label: 'A4 (210×297mm)' },
  { value: 'A5', label: 'A5 (148×210mm)' },
  { value: '5060', label: '50×60mm' },
  { value: '3040', label: '30×40mm' },
  { value: '8060', label: '80×60mm' } // 新增选项
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
const qrCanvas8060 = ref(null); // 新增引用
const printContent = ref(null);

// 生成二维码
const generateQRCode = () => {
  if (!qrcodeCanvas.value && !qrCanvas5060.value && !qrCanvas8060.value) return;

  const content = `工单号码:${workOrderInfo.value.workOrderNo}, 产品品号:${workOrderInfo.value.productCode}, 入库数量:${workOrderInfo.value.stockInQuantity}, 生产日期:${workOrderInfo.value.productionDate}`;

  if (qrcodeCanvas.value) {
    QRCode.toCanvas(qrcodeCanvas.value, content, {
      width: 120, // 调整二维码大小
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
      useCORS: true
    });

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      let printContentHTML = '';
      for (let i = 0; i < copies.value; i++) {
        printContentHTML += `
          <div style="page-break-after: ${i < copies.value - 1 ? 'always' : 'auto'};">
            <img src="${canvas.toDataURL('image/png')}" style="width:100%;" />
          </div>
        `;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>打印预览</title>
            <style>
              @media print {
                body { margin: 0; padding: 0; }
                img { max-width: 100%; height: auto; }
              }
            </style>
          </head>
          <body onload="window.print(); setTimeout(() => window.close(), 1000);">
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
.heihu-print-system {
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
}
/* 产品描述最多显示3行 */
.product-description span {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* 热敏纸尺寸 (80×60mm) */
.thermal-size {
  width: 80mm;
  height: 60mm;
  font-size: 10px;
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

/* 公司名称容器 */
.company-name-container {
  text-align: center; /* 公司名称居中 */
  width: 100%; /* 占满整个宽度 */
}

.company-name {
  font-size: 12px;
  font-weight: bold;
  display: block; /* 确保公司名称独占一行 */
}

/* 公司名称下的横线 */
.company-name-hr {
  margin: 2px 0; /* 调整横线与公司名称之间的间距 */
  border: none;
  height: 1px; /* 横线粗细 */
  background-color: #000; /* 横线颜色 */
  width: 100%; /* 横线贯穿整个标签内容 */
}

.receipt-header .title,
.receipt-header .mr-number {
  font-size: 12px;
  font-weight: bold;
}

.receipt-body {
  display: flex;
  flex-direction: row; /* 左右布局 */
}

.content-section {
  flex: 5; /* 左侧内容区域占比3/4 */
  padding-right: 5px;
  /* border-right: 1px solid #ddd; */
}

.info-row {
  display: flex;
  margin-bottom: 3px;
}

.info-row label {
  width: 13mm;
  font-weight: bold;
}

.info-row span {
  flex: 1;
  word-break: break-all; /* 允许换行 */
}

.qr-section {
  flex: 1; /* 右侧二维码区域占比1/4 */
  padding-left: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-section canvas {
  width: 40%; /* 进一步缩小二维码大小 */
  height: auto;
}

/* 横线样式 */
.top-hr,
.bottom-hr {
  margin: 5px 0; /* 调整横线与内容之间的间距 */
  border: none;
  height: 2px; /* 加粗横线 */
  background-color: #000; /* 横线颜色 */
  width: 100%; /* 横线贯穿整个标签内容 */
}

.top-hr {
  margin-top: 10px; /* 调整顶部横线位置 */
}

.bottom-hr {
  margin-bottom: 10px; /* 调整底部横线位置 */
}

/* 热敏纸尺寸 (80×60mm) */
.thermal-size {
  width: 80mm;
  height: 60mm;
  font-size: 10px;
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.receipt-header .company-name,
.receipt-header .title,
.receipt-header .mr-number {
  font-size: 12px;
  font-weight: bold;
}

.receipt-body {
  display: flex;
  flex-direction: row; /* 左右布局 */
}

.content-section {
  flex: 5; /* 左侧内容区域占比3/4 */
  padding-right: 5px;
  /* border-right: 1px solid #ddd; */
}

.info-row {
  display: flex;
  margin-bottom: 3px;
}

.info-row label {
  width: 13mm;
  font-weight: bold;
}

.info-row span {
  flex: 1;
  word-break: break-all; /* 允许换行 */
}

.qr-section {
  flex: 1; /* 右侧二维码区域占比1/4 */
  padding-left: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-section canvas {
  width: 40%; /* 进一步缩小二维码大小 */
  height: auto;
}

/* 横线样式 */
.top-hr,
.bottom-hr {
  margin: 5px 0; /* 调整横线与内容之间的间距 */
  border: none;
  height: 2px; /* 加粗横线 */
  background-color: #000; /* 横线颜色 */
  width: 100%; /* 横线贯穿整个标签内容 */
}

.top-hr {
  margin-top: 10px; /* 调整顶部横线位置 */
}

.bottom-hr {
  margin-bottom: 10px; /* 调整底部横线位置 */
}

.receipt-bo

/* 热敏纸尺寸 (80×60mm) */
.thermal-size {
  width: 80mm;
  height: 60mm;
  font-size: 10px;
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.receipt-header .company-name,
.receipt-header .title,
.receipt-header .mr-number {
  font-size: 12px;
  font-weight: bold;
}

.receipt-body {
  display: flex;
  flex-direction: row; /* 左右布局 */
}

.content-section {
  flex: 5; /* 左侧内容区域占比3/4 */
  padding-right: 5px;
  /* border-right: 1px solid #ddd; */
}

.info-row {
  display: flex;
  margin-bottom: 3px;
}

.info-row label {
  width: 13mm;
  font-weight: bold;
}

.info-row span {
  flex: 1;
  word-break: break-all; /* 允许换行 */
}

.qr-section {
  flex: 1; /* 右侧二维码区域占比1/4 */
  padding-left: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-section canvas {
  width: 50%; /* 二维码大小调整为容器宽度的50% */
  height: auto;
}

/* 横线样式 */
hr {
  margin: 5px 0; /* 调整横线与内容之间的间距 */
  border: none;
  height: 1px;
  background-color: #000; /* 横线颜色 */
  width: 100%; /* 横线贯穿整个标签内容 */
}

.receipt-body::before,
.receipt-body::after {
  content: '';
  flex: 1; /* 确保横线贯穿整个标签内容 */
}

/* 热敏纸尺寸 (80×60mm) */
.thermal-size {
  width: 80mm;
  height: 60mm;
  font-size: 10px;
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.receipt-header .company-name,
.receipt-header .title,
.receipt-header .mr-number {
  font-size: 12px;
  font-weight: bold;
}

.receipt-body {
  display: flex;
  flex-direction: row; /* 左右布局 */
}

.content-section {
  flex: 0 0 45mm; /* 固定左侧内容宽度 */
  padding-right: 5px;
  /*  border-right: 1px solid #ddd;*/
}

.info-row {
  display: flex;
  margin-bottom: 3px;
}

.info-row label {
  width: 13mm;
  font-weight: bold;
}

.info-row span {
  flex: 1;
  word-break: break-all; /* 允许换行 */
}

.qr-section {
  flex: 0 0 30mm; /* 固定二维码宽度 */
  padding-left: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-section canvas {
  width: 100%;
  height: auto;
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

  .work-order-card {
    width: 100%;
    min-height: auto;
    transform-origin: top left;
  }
}
</style>
