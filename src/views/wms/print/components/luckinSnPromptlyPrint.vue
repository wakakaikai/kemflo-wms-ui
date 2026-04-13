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
          <!--          <el-form-item label="选择纸张">
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
          </el-form-item>-->

          <!-- 工单号码 -->
          <el-form-item label="工单号码" prop="shopOrder">
            <el-input v-model="workOrderInfo.shopOrder" placeholder="请输入工单号码" readonly clearable>
              <template #append>
                <el-button icon="Search" @click="showShopOrderDialog" />
              </template>
            </el-input>
          </el-form-item>

          <!-- 扫描条码输入 -->
          <el-form-item label="扫描条码">
            <el-input ref="scanInputRef" v-model="scanInput" placeholder="请扫描条码" @keydown.enter.prevent="keyDownTab" @keydown.tab.prevent="keyDownTab" autofocus clearable />
          </el-form-item>

          <!-- 打印份数 -->
          <!--          <el-form-item label="打印份数">
            <el-input-number v-model="copies" :min="1" :max="9999" controls-position="right" style="width: 100%" />
          </el-form-item>-->

          <!-- 操作按钮 -->
          <!--          <div class="action-buttons">
            <el-button type="primary" @click="handlePrintPreview" :loading="loading" :disabled="!selectedPrinter">
              <el-icon><View /></el-icon>
              打印预览
            </el-button>
            <el-button type="success" @click="handlePrint" :loading="loading" :disabled="!selectedPrinter">
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
              <h4>瑞幸即扫即打预览(30mm*20mm)</h4>
            </div>
          </div>
          <!-- 标签模板 -->
          <div class="preview-content">
            <div class="preview-wrapper">
              <div class="luckin-print-sn-template" ref="printContent">
                <div class="sn-row">
                  <canvas ref="previewQrCodeCanvas"></canvas>
                  <div class="sn-content">{{ workOrderInfo.sfc }}</div>
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
      </el-main>
    </el-container>

    <!-- 工单选择对话框 -->
    <ShopOrderDialog ref="shopOrderDialogRef" :podConfig="podConfig" @shop-order-call-back="shopOrderCallBack" />
  </div>
</template>
<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
import { listShopOrder } from '@/api/mes/shopOrder';
import { getLodop } from '@/utils/LodopFuncs';
import { addShopOrderSfcPrintHistory, listShopOrderSfcPrintHistory } from '@/api/mes/shopOrderSfcPrintHistory';
import { HttpStatus } from '@/enums/RespEnum';
import HistoryInput from '@/components/HistoryInput/index.vue';
import ShopOrderDialog from '@/views/mes/workpanel/components/shopOrderDialog.vue';
import { HistoryConfig } from '@/types/history';
import QRCode from 'qrcode';

const settingFormRef = ref();
const shopOrderDialogRef = ref<InstanceType<typeof ShopOrderDialog>>();
const scanInputRef = ref<HTMLInputElement | null>(null);

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
  shopOrder: '',
  sfc: '74E9D86CAFE4'
});

const previewQrCodeCanvas = ref<HTMLCanvasElement | null>(null);

const podConfig = ref<{ [key: string]: any }>({});

// 用户输入
const scanInput = ref('');
const loading = ref(false);
// 扫描历史
const scanHistory = ref<Array<{ content: string; time: string }>>([]);

// 验证规则
const rules = {
  shopOrder: [{ required: true, message: '工单号码不能为空', trigger: 'blur' }],
  sfc: [{ required: true, message: '条码不能为空', trigger: 'blur' }]
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
  // 自动聚焦到扫描输入框
  scanInputRef.value?.focus();
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
    } catch (error) {}
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

// 生成二维码
const generateBarcode = () => {
  const content = workOrderInfo.value.sfc;
  if (!content || !previewQrCodeCanvas.value) return;

  // 生成二维码
  QRCode.toCanvas(previewQrCodeCanvas.value, content, {
    errorCorrectionLevel: 'H',
    width: 40,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' }
  });
};

// 处理扫描输入回车事件
const keyDownTab = async () => {
  if (!scanInput.value.trim()) return;

  if (!workOrderInfo.value.shopOrder) {
    proxy.$modal.msgWarning('请先选择工单号');
    return;
  }

  workOrderInfo.value.sfc = scanInput.value.trim();
  scanInput.value = '';

  // 添加到扫描历史
  const now = new Date();
  const timeString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  scanHistory.value.unshift({
    content: workOrderInfo.value.sfc,
    time: timeString
  });

  await nextTick();
  await generateBarcode();

  try {
    loading.value = true;
    const res = await addShopOrderSfcPrintHistory({
      shopOrder: workOrderInfo.value.shopOrder,
      sfc: workOrderInfo.value.sfc,
      type: 2
    });
    if (res.code !== HttpStatus.SUCCESS) {
      loading.value = false;
      return;
    }
    const LODOP = getLodop();
    if (!LODOP) {
      proxy.$modal.msgError('未检测到Lodop打印服务，请安装Lodop插件');
      return;
    }

    // 初始化打印任务
    LODOP.PRINT_INIT('瑞幸');
    // 设置打印机
    LODOP.SET_PRINTER_INDEX(selectedPrinter.value);

    // 如果选择了纸张，则设置纸张类型
    if (selectedPaper.value) {
      LODOP.SET_PRINT_PAGESIZE(1, '', '', selectedPaper.value);
    } else {
      // 设置默认纸张大小
      LODOP.SET_PRINT_PAGESIZE(0, 0, 0, '30mm 20mm'); // 设置纸张大小
    }

    // 设置默认字体
    LODOP.ADD_PRINT_BARCODE('2.01mm', '9.5mm', '12.99mm', '12.99mm', 'QRCode', `${workOrderInfo.value.sfc}`);
    LODOP.ADD_PRINT_TEXT('14mm', '3.81mm', '30mm', '5mm', `${workOrderInfo.value.sfc}`);
    LODOP.SET_PRINT_STYLEA(0, 'FontName', 'Arial');

    // ========== 预览或打印 ==========
    // LODOP.PRINT_DESIGN(); // 设计模式，调试时使用
    // LODOP.PREVIEW(); // 预览
    LODOP.PRINT(); // 直接打印
  } finally {
    loading.value = false;
  }
};

// 初始化
onMounted(() => {
  nextTick(() => {
    generateBarcode();
    // 获取打印机列表
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
  overflow: hidden;
}

.sidebar {
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
  padding: 10px;
  overflow-y: auto;
  height: 100%;
}

.card-header span {
  font-weight: 600;
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
  overflow: hidden;
}

.preview-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #e6e6e6;
  flex-shrink: 0;
  background-color: #fafbfc;
}

.header-left h4 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.preview-content {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.preview-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px;
  background:
    linear-gradient(45deg, #f5f5f5 25%, transparent 25%), linear-gradient(-45deg, #f5f5f5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f5f5f5 75%),
    linear-gradient(-45deg, transparent 75%, #f5f5f5 75%);
  background-size: 20px 20px;
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0px;
  border-radius: 8px;
}

/* 标签模板样式 */
.luckin-print-sn-template {
  width: 30mm;
  height: 20mm;
  padding: 2mm;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  position: relative;
  border: 1px solid #dcdfe6;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  flex-shrink: 0;
}

.sn-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
}

.sn-row canvas {
  display: block;
  width: 100%;
  height: 100%;
  flex-shrink: 0;
  object-fit: contain;
}

.sn-content {
  flex: 1;
  font-size: 12px;
  text-align: left;
  max-width: 24mm;
}

/* 历史扫码记录 */
.scan-history-panel {
  flex: 1;
  min-height: 0;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-header {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  background-color: #fafbfc;
  flex-shrink: 0;
}

.history-header h4 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  max-height: calc(100vh - 350px);
}

.history-item {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  border-radius: 4px;
  margin-bottom: 2px;
}

.history-item:hover {
  background-color: #f5f7fa;
}

.history-content {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  word-break: break-all;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  flex-shrink: 0;
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.no-history {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 20px 0;
}

@media screen {
  .luckin-print-sn-template {
    transform: scale(1); /* 放大200%用于屏幕预览 */
  }
}
</style>
