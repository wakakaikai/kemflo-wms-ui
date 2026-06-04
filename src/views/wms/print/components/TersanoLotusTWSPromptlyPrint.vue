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

          <!-- 操作按钮 -->
        </el-form>
      </el-aside>

      <!-- 主内容预览区域 -->
      <el-main class="preview-area">
        <div class="preview-container">
          <div class="preview-header">
            <div class="header-left">
              <h4>Tersano Lotus TWS 即扫即打预览(50mm*25mm)</h4>
            </div>
          </div>
          <!-- 标签模板 -->
          <div class="preview-content">
            <div class="preview-wrapper">
              <div class="tersano-print-sn-template" ref="printContent">
                <!-- 标签预览 -->
                <div class="label-item">
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
import ShopOrderDialog from '@/views/mes/workpanel/components/shopOrderDialog.vue';
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
  sfc: '30002042'
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
    const defaultPrinterName = LODOP.GET_PRINTER_NAME(-1);

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

    LODOP.PRINT_INIT('获取纸张列表');
    LODOP.SET_PRINTER_INDEX(printerName);

    const selectElement = document.createElement('select');
    selectElement.id = 'tempPaperSelect';
    selectElement.style.display = 'none';
    document.body.appendChild(selectElement);

    selectElement.innerHTML = '';

    try {
      LODOP.Create_PageSize_List(selectElement, printerName);

      const papers: Array<{ value: string; label: string }> = [];

      for (let i = 0; i < selectElement.options.length; i++) {
        const option = selectElement.options[i];
        papers.push({
          value: option.value,
          label: option.text
        });
      }

      console.log(`获取到 ${printerName} 的纸张列表:`, papers);

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
  refreshPapers();
};

// 纸张变更事件
const onPaperChange = () => {
  console.log('纸张已更改:', selectedPaper.value);
};

// 生成条形码
const generateBarcode = () => {
  const content = workOrderInfo.value.sfc;
  if (!content || !previewQrCodeCanvas.value) return;

  try {
    JsBarcode(previewQrCodeCanvas.value, content, {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: false,
      margin: 0,
      background: '#ffffff',
      lineColor: '#000000'
    });
  } catch (error) {
    console.error('生成条形码失败:', error);
  }
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
    LODOP.PRINT_INIT('Tersano Lotus TWS');
    // 设置打印机
    LODOP.SET_PRINTER_INDEX(selectedPrinter.value);

    // 如果选择了纸张，则设置纸张类型
    if (selectedPaper.value) {
      LODOP.SET_PRINT_PAGESIZE(1, '', '', selectedPaper.value);
    } else {
      // 设置默认纸张大小 50mm * 25mm
      LODOP.SET_PRINT_PAGESIZE(0, 0, 0, '50mm 25mm');
    }

    // 生成条形码图片
    const tempCanvas = document.createElement('canvas');
    JsBarcode(tempCanvas, workOrderInfo.value.sfc, {
      format: 'CODE128',
      displayValue: false,
      height: 50,
      width: 2,
      margin: 0
    });

    // 使用for循环打印2张标签
    const labelCount = 2;
    for (let i = 0; i < labelCount; i++) {
      // 如果不是第一页，添加新页
      if (i > 0) {
        LODOP.NEWPAGE();
      }

      // 使用图片方式打印条形码
      LODOP.ADD_PRINT_IMAGE('5.01mm', '5.4mm', '40mm', '12.01mm', tempCanvas.toDataURL('image/png'));
      LODOP.SET_PRINT_STYLEA(0, 'Stretch', 1); // 扩展缩放模式
      LODOP.ADD_PRINT_TEXT('17.99mm', '15mm', '40mm', '6.01mm', `${workOrderInfo.value.sfc}`);
      LODOP.SET_PRINT_STYLEA(0, 'FontName', 'Arial');
      LODOP.SET_PRINT_STYLEA(0, 'FontSize', 12);
      LODOP.SET_PRINT_STYLEA(0, 'Bold', 1);
    }

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
.tersano-print-sn-template {
  width: 50mm;
  height: 25mm;
  /*  padding: 2mm;*/
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 2mm;
  box-sizing: border-box;
  position: relative;
  border: 1px solid #dcdfe6;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  flex-shrink: 0;
}

.label-item {
  width: 50mm;
  height: 25mm;
  padding: 2mm;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2mm;
  box-sizing: border-box;
  border: 1px dashed #dcdfe6;
  position: relative;
}

.label-item canvas {
  display: block;
  width: 46mm;
  height: 10mm;
  flex-shrink: 0;
  object-fit: contain;
}

.sn-content {
  font-size: 10px;
  text-align: center;
  max-width: 46mm;
  word-break: break-all;
  font-family: Arial, sans-serif;
  font-weight: bold;
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
  .tersano-print-sn-template {
    transform: scale(1);
  }
}
</style>
