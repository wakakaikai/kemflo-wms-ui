<template>
  <div class="print-container">
    <el-container>
      <!-- 左侧菜单区域 -->
      <el-aside width="320px" class="sidebar">
        <div class="menu-section">
          <h4>打印设置</h4>

          <el-form label-position="top" :model="workOrderInfo" :rules="rules" ref="settingFormRef">
            <!-- 工单号码 -->
            <el-form-item label="工单号码" prop="workOrderNo">
              <el-input v-model="workOrderInfo.workOrderNo" placeholder="请输入工单号码">
                <template #append>
                  <el-button icon="Search" @click="showWorkOrderDialog" />
                </template>
              </el-input>
            </el-form-item>

            <!-- 序列号(SN) -->
            <el-form-item label="序列号(SN)" prop="sfcContent">
              <el-input v-model="workOrderInfo.sfcContent" placeholder="请输入序列号" />
            </el-form-item>

            <!-- 打印份数 -->
            <el-form-item label="打印份数">
              <el-input-number v-model="copies" :min="1" :max="9999" style="width: 100%" />
            </el-form-item>
          </el-form>
        </div>

        <div class="action-buttons">
          <el-button type="primary" @click="handlePrint" class="print-btn">
            <el-icon><Printer /></el-icon>
            打印
          </el-button>
          <el-button @click="handleExportImage" class="export-btn">
            <el-icon><Picture /></el-icon>
            导出图片
          </el-button>
        </div>
      </el-aside>

      <!-- 主内容预览区域 -->
      <el-main class="preview-area">
        <div class="preview-container">
          <div class="preview-header">
            <h3>MI标签预览 (35×12mm)</h3>
          </div>

          <div class="preview-content">
            <!-- MI标签模板 -->
            <div class="mi-print-sn-template" ref="printContent">
              <!-- 主体内容 -->
              <div class="label-body">
                <!-- 标签顶部：生产日期 -->
                <div class="product-date-section">
                  <span class="production-date">生产日期: {{ workOrderInfo.productDate }}</span>
                </div>
                <!--条形码 -->
                <div class="label-barcode">
                  <svg ref="barcodeSvg" class="barcode"></svg>
                </div>

                <div class="content-row">
                  <!-- 左侧SN和SKU信息 -->
                  <div class="left-section">
                    <!-- 序列号(SN) -->
                    <div class="sn-section">
                      <span class="sn-label">SN:</span>
                      <span class="sn-value">{{ workOrderInfo.sfcContent }}</span>
                    </div>

                    <!-- SKU信息 -->
                    <div class="sku-section">
                      <span class="sku-label">SKU:</span>
                      <span class="sku-value">{{ workOrderInfo.sku }}</span>
                    </div>
                  </div>

                  <!-- 右侧维修凭证框 -->
                  <div class="right-section">
                    <div class="maintenance-box">
                      <div class="maintenance-text">维修凭证</div>
                      <div class="maintenance-text">请勿撕毁</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-main>
    </el-container>

    <!-- 工单选择对话框 -->
    <work-order-dialog ref="workOrderDialogRef" @workOrderCallBack="workOrderCallBack" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
import { Printer, Picture } from '@element-plus/icons-vue';
import html2canvas from 'html2canvas';
import { ElMessage } from 'element-plus';
import WorkOrderDialog from '@/views/wms/print/components/workOrderDialog.vue';
import JsBarcode from 'jsbarcode';
const workOrderDialogRef = ref<InstanceType<typeof WorkOrderDialog>>();
const settingFormRef = ref<ElFormInstance>();

// 工单信息
const workOrderInfo = ref({
  material: '',
  workOrderNo: '',
  productDate: '',
  sfcContent: '76054/BQAPNF5Z500001',
  sku: 'BHR07SBCN',
  materialDesc: ''
});

const copies = ref(1);
const rules = {
  material: [{ required: true, message: '物料料号不能为空', trigger: 'blur' }],
  productDate: [{ required: true, message: '生产日期不能为空', trigger: 'blur' }]
};

// 条形码SVG引用
const barcodeSvg = ref(null);
const printContent = ref(null);

// 生成条形码（使用JSBarcode）
const generateBarcode = () => {
  const content = workOrderInfo.value.sfcContent;
  if (!content || !barcodeSvg.value) return;

  // 清空之前的条形码
  barcodeSvg.value.innerHTML = '';

  try {
    // 使用JsBarcode生成条形码
    JsBarcode(barcodeSvg.value, content, {
      format: 'CODE128', // 使用CODE128格式，适合字母数字混合
      displayValue: false, // 显示文本值
      height: 27, // 条形码高度
      width: 1, // 条形码条宽
      margin: 0 // 边距
    });
  } catch (error) {
    console.error('条形码生成失败:', error);
  }
};

// 监听工单信息变化
watch(
  workOrderInfo,
  () => {
    nextTick(generateBarcode);
  },
  { deep: true }
);

// 显示工单选择对话框
const showWorkOrderDialog = () => {
  workOrderDialogRef.value.openDialog();
};

const workOrderCallBack = (workOrderNoInfo: any) => {
  workOrderInfo.value.workOrderNo = workOrderNoInfo;
};

// 处理打印功能
const handlePrint = async () => {
  const valid = await settingFormRef.value.validate().catch(() => false);
  if (!valid) {
    ElMessage.error('请填写必填字段');
    return;
  }

  // 验证条形码内容是否存在
  if (!workOrderInfo.value.sfcContent) {
    ElMessage.error('请先输入序列号');
    return;
  }

  // 生成条形码
  await nextTick();
  generateBarcode();

  try {
    // 生成当前内容的截图
    const canvas = await html2canvas(printContent.value, {
      scale: 2,
      logging: false,
      useCORS: true,
      scrollX: 0,
      scrollY: 0
    });

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // 设置打印页面尺寸为35mm × 12mm
      const printStyles = `
        @page {
          size: 35mm 12mm;
          margin: 0;
        }
        body {
          width: 35mm;
          height: 12mm;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      `;

      let printContentHTML = '';
      // 根据打印份数生成多个页面
      for (let i = 0; i < copies.value; i++) {
        printContentHTML += `<div style="page-break-after: ${i < copies.value - 1 ? 'always' : 'auto'};"><img src="${canvas.toDataURL('image/png')}" style="width:100%; height:100%;" alt=""/></div>`;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>打印预览</title>
            <style>
              ${printStyles}
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
    ElMessage.error('打印失败: ' + (error as Error).message);
  }
};

// 导出图片功能
const handleExportImage = async () => {
  const valid = await settingFormRef.value.validate().catch(() => false);
  if (!valid) {
    ElMessage.error('请填写必填字段');
    return;
  }

  if (!workOrderInfo.value.sfcContent) {
    ElMessage.error('请先输入序列号');
    return;
  }

  // 生成条形码
  await nextTick();
  generateBarcode();

  // 使用html2canvas将标签转换为图片
  const printElement = document.querySelector('.mi-print-sn-template') as HTMLElement;
  if (!printElement) {
    ElMessage.error('找不到要导出的标签元素');
    return;
  }

  try {
    const canvas = await html2canvas(printElement, {
      backgroundColor: '#fff',
      scale: 2, // 提高清晰度
      useCORS: true,
      allowTaint: true
    });

    // 将canvas转换为图片并下载
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `MI标签_${workOrderInfo.value.sfcContent}_${new Date().getTime()}.png`;
    link.click();

    ElMessage.success('图片导出成功');
  } catch (error) {
    console.error('导出图片失败:', error);
    ElMessage.error('导出图片失败: ' + (error as Error).message);
  }
};

// 页面加载完成后初始化
onMounted(() => {
  // 获取年份两位的月份
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  workOrderInfo.value.productDate = `${year}.${month}`;
});
</script>

<style scoped>
.print-container {
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
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

.action-buttons {
  padding: 16px;
  border-top: 1px solid #e6e6e6;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.print-btn,
.export-btn {
  width: 100%;
  margin-bottom: 10px;
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

.preview-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* MI标签模板样式 */
.mi-print-sn-template {
  width: 35mm;
  height: 12mm;
  /*  border: 1px solid #dcdfe6;*/
  padding: 3px 4px;
  background: white;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.product-date-section {
  display: flex;
  justify-content: flex-start;
  font-weight: bold;
  font-family: 'MiSans Regular', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 5pt;
  line-height: 1.5mm;
}

.label-barcode {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 5mm; /* 限制高度为5mm */
  font-family: 'MiSans Regular', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 4pt;
}

.barcode {
  height: 5mm !important;
  width: 100%;
  font-family: 'MiSans Regular', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 4pt;
}

.label-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.label-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  font-family: 'MiSans Regular', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 4pt;
  font-weight: bold;
}

.content-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex: 1;
}

.left-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.right-section {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}

.maintenance-box {
  border: 0.5pt solid black;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 4pt;
  font-weight: bold;
}

.maintenance-text {
  font-size: 3.5pt;
  line-height: 1.3mm;
  padding: 1px;
}
.sn-section,
.sku-section {
  display: flex;
  font-family: 'MiSans Regular', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 5pt;
  font-weight: bold;
  line-height: 2mm;
}

/* 屏幕显示时放大200% */
@media screen {
  .mi-print-sn-template {
    transform: scale(2); /* 放大200%用于屏幕预览 */
    transform-origin: top center; /* 从顶部中心缩放 */
    border: 1px solid #dcdfe6;
  }
}

/* 打印样式 */
@media print {
  .mi-print-sn-template {
    transform: none !important; /* 移除缩放 */
    border: none !important; /* 移除边框 */
  }
}
</style>
