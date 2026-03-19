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
                  <el-icon><Refresh /></el-icon>
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
                <el-button text @click="refreshPapers" icon="Refresh" title="刷新所有设置"> </el-button>
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
            <!--              <el-input v-model="queryParams.shopOrder" placeholder="请输入工单号码">
              <template #append>
                <el-button icon="Search" @click="showShopOrderDialog" />
              </template>
            </el-input>-->
            <HistoryInput v-model="workOrderInfo.shopOrder" :config="shopOrderConfig" placeholder="请输入工单号码" @keyup.enter="getShopOrderList">
              <template #append>
                <el-button icon="Search" @click="showShopOrderDialog" />
              </template>
            </HistoryInput>
          </el-form-item>

          <!-- 扫描条码输入 -->
          <el-form-item label="扫描条码">
            <el-input v-model="scanInput" placeholder="请扫描条码" @keydown.enter.prevent="handleScanEnter" ref="scanInputRef" autofocus clearable>
              <template #append>
                <el-button icon="CameraFilled" @click="simulateScan" title="模拟扫描" />
              </template>
            </el-input>
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
              <h3>MI即扫即打预览</h3>
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
                      <span class="project-info">{{ workOrderInfo.productDesc }}</span>
                      <span class="color-info">颜色：{{ workOrderInfo.color }}</span>
                    </div>

                    <!-- 条形码区域 -->
                    <div class="barcode-section">
                      <svg ref="snBarcodeSvg" class="barcode"></svg>
                    </div>

                    <!-- SN和SKU信息 -->
                    <div class="info-section">
                      <div class="sn-sku-row">
                        <span class="sn-value">SN:&nbsp;{{ workOrderInfo.sfcContent }}</span>
                        <span class="sku-value">SKU:&nbsp;{{ workOrderInfo.sku }}</span>
                      </div>
                    </div>

                    <!-- 69码区域 -->
                    <div class="sixty-nine-barcode-section">
                      <svg ref="sixtyNineBarcodeSvg" class="sixty-nine-barcode"></svg>
                    </div>

                    <div class="content-row">
                      <!-- 生产日期 -->
                      <div class="left-section">
                        <div class="date-section">
                          <span class="date-value">生产日期: {{ workOrderInfo.productDate }}</span>
                        </div>
                      </div>

                      <!-- 合格证标识 -->
                      <div class="right-section">
                        <div class="certification">
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
import { ref, nextTick, onMounted } from 'vue';
import html2canvas from 'html2canvas';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
import { listShopOrder } from '@/api/mes/shopOrder';
import JsBarcode from 'jsbarcode';
import { getLodop } from '@/utils/LodopFuncs';
import { savePrintHistory } from '@/api/mes/shopOrderSfcPrintHistory';
import { HttpStatus } from '@/enums/RespEnum';
import HistoryInput from '@/components/HistoryInput/index.vue';
import ShopOrderDialog from '@/views/mes/workpanel/components/shopOrderDialog.vue';
import { HistoryConfig } from '@/types/history';

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
      proxy.$modal.msgError('工单号' + queryParams.value.shopOrder + '资料不存在');
      return;
    }
    if (res.total > 1) {
      proxy.$modal.msgError('工单号' + queryParams.value.shopOrder + '存在多笔资料');
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
    // 方法1：使用GET_PRINTER_COUNT和GET_PRINTER_NAME
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
      height: 30,
      width: 1.2,
      margin: 0
    });
  } catch (error) {
    console.error('条形码生成失败:', error);
  }
};

// 生成69码
const generateSixtyNineBarcode = () => {
  const content = workOrderInfo.value.ean;
  sixtyNineBarcodeSvg.value.innerHTML = '';
  if (!content || !sixtyNineBarcodeSvg.value) {
    return;
  }
  try {
    JsBarcode(sixtyNineBarcodeSvg.value, content, {
      format: 'EAN13',
      displayValue: true,
      height: 120,
      width: 9,
      fontSize: 70,
      textAlign: 'center',
      textMargin: 5
    });
  } catch (error) {
    console.error('69码生成失败:', error);
  }
};

// 处理扫描输入回车事件
const handleScanEnter = async () => {
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
  await handlePrint();
};

// 模拟扫描
const simulateScan = () => {
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  scanInput.value = `76054/BQAPNF5Z50${randomNum}`;
  handleScanEnter();
};

// 打印预览
const handlePrintPreview = async () => {
  const LODOP = getLodop();
  if (!LODOP) {
    proxy.$modal.msgError('未检测到Lodop打印服务，请安装Lodop插件');
    return;
  }

  if (!selectedPrinter.value) {
    proxy.$modal.msgError('请先选择打印机');
    return;
  }

  if (!workOrderInfo.value.sfcContent) {
    proxy.$modal.msgError('请先输入序列号或扫描条码');
    return;
  }

  printing.value = true;
  try {
    // 生成条形码
    await nextTick();
    generateBarcode();
    generateSixtyNineBarcode();

    // 生成截图
    const canvas = await html2canvas(printContent.value!, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    // 初始化打印任务
    LODOP.PRINT_INIT('MI即扫即打');

    // 设置打印机
    LODOP.SET_PRINTER_INDEX(selectedPrinter.value);

    // 如果选择了纸张，则设置纸张类型
    if (selectedPaper.value) {
      LODOP.SET_PRINT_PAGESIZE(1, '', '', selectedPaper.value);
    } else {
      // 设置默认纸张大小
      LODOP.SET_PRINT_PAGESIZE(0, 0, 0, '47mm 30mm'); // 设置纸张大小
    }

    // 添加打印内容
    for (let i = 0; i < copies.value; i++) {
      LODOP.ADD_PRINT_IMAGE(0, 0, '100%', '100%', canvas.toDataURL('image/png'));
      if (i < copies.value - 1) {
        LODOP.NEWPAGE();
      }
    }

    // 参考lodop样例设置预览窗口，使用更大更合适的预览窗口
    // LODOP.SET_SHOW_MODE('LANDSCAPE_DEF_ROTATED', true); // 设置横向打印默认旋转
    // 打印后自动关闭预览
    LODOP.SET_PRINT_MODE('AUTO_CLOSE_PREWINDOW', 1);
    // 设置预览窗口大小为800x600
    LODOP.SET_PREVIEW_WINDOW(1, 0, 1, 800, 600, '打印预览');
    // 去除背景滚动线
    LODOP.SET_SHOW_MODE('HIDE_PAPER_BOARD', 1);
    //按原图比例(不变形)缩放模式
    LODOP.SET_PRINT_STYLEA(0, 'Stretch', 2);
    // 显示预览
    LODOP.PREVIEW();
    proxy.$modal.msgSuccess('打印预览已打开');
  } catch (error: any) {
    proxy.$modal.msgError('打印预览失败: ' + (error as Error).message);
  } finally {
    printing.value = false;
  }
};

// 直接打印
const handlePrint = async () => {
  const LODOP = getLodop();
  if (!LODOP) {
    proxy.$modal.msgError('未检测到Lodop打印服务，请安装Lodop插件');
    return;
  }

  if (!selectedPrinter.value) {
    proxy.$modal.msgError('请先选择打印机');
    return;
  }

  if (!workOrderInfo.value.sfcContent) {
    proxy.$modal.msgError('请先输入序列号或扫描条码');
    return;
  }
  printing.value = true;
  const res = await savePrintHistory({
    shopOrderSfcBoList: [
      {
        shopOrder: workOrderInfo.value.shopOrder,
        sfc: workOrderInfo.value.sfcContent
      }
    ],
    printType: 2
  });
  if (res.code !== HttpStatus.SUCCESS) {
    printLoading.value = false;
    return;
  }
  try {
    // 生成条形码
    // await nextTick();
    // generateBarcode();

    // 生成截图
    const canvas = await html2canvas(printContent.value!, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    // 初始化打印任务
    LODOP.PRINT_INIT('MI标签打印');

    // 设置打印机
    LODOP.SET_PRINTER_INDEX(selectedPrinter.value);

    // 如果选择了纸张，则设置纸张类型
    if (selectedPaper.value) {
      LODOP.SET_PRINT_PAGESIZE(1, '', '', selectedPaper.value);
    } else {
      // 设置默认纸张大小
      LODOP.SET_PRINT_PAGESIZE(0, 0, 0, '47mm 30mm'); // 设置纸张大小
    }

    // 添加打印内容
    for (let i = 0; i < copies.value; i++) {
      // 添加打印内容
      LODOP.ADD_PRINT_IMAGE(0, 0, '100%', '100%', canvas.toDataURL('image/png'));
      //按原图比例(不变形)缩放模式
      LODOP.SET_PRINT_STYLEA(0, 'Stretch', 2);
      if (i < copies.value - 1) {
        LODOP.NEWPAGE();
      }
    }

    // 直接打印
    LODOP.PRINT();

    proxy.$modal.msgSuccess('打印任务已发送');
  } catch (error: any) {
    proxy.$modal.msgError('打印失败: ' + (error as Error).message);
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
  font-weight: 600;
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
  background:
    linear-gradient(45deg, #f5f5f5 25%, transparent 25%), linear-gradient(-45deg, #f5f5f5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f5f5f5 75%),
    linear-gradient(-45deg, transparent 75%, #f5f5f5 75%);
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
  font-weight: 600;
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
  font-weight: 500;
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
  padding: 2mm 2mm;
  background: white;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  position: relative;
  border: 1px solid #e6e6e6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.top-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 3mm;
  font-family: 'MiSans Regular', 'MiSans VF', Helvetica, Arial, sans-serif;
  font-size: 5pt;
  font-weight: bold;
  margin-bottom: 0.5mm;
}

.barcode-section {
  display: flex;
  justify-content: center;
  align-items: center;
}

.barcode {
  font-family: 'MiSans Regular', 'MiSans VF', Helvetica, Arial, sans-serif;
  font-size: 4pt;
  width: 100%;
  height: 5mm !important;
}

.sixty-nine-barcode-section {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.sixty-nine-barcode {
  font-family: 'MiSans Regular', 'MiSans VF', Helvetica, Arial, sans-serif;
  font-size: 10pt;
  height: 10mm;
  width: 100%;
}

.info-section {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5mm;
  height: 2mm;
  font-family: 'MiSans Regular', 'MiSans VF', Helvetica, Arial, sans-serif;
  font-size: 4.5pt;
  font-weight: bold;
}

.sn-sku-row {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
}

.content-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex: 1;
  height: 3mm;
  margin-top: 1mm;
}

.left-section {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.right-section {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}

.date-section {
  display: flex;
  justify-content: flex-start;
}

.date-value {
  font-weight: bold;
  font-family: 'MiSans VF', 'MiSans Regular', Helvetica, Arial, sans-serif;
  font-size: 5pt;
  height: 3mm;
  line-height: 3mm;
}

.certification {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 3mm;
  line-height: 3mm;
  font-size: 5pt;
  font-weight: bold;
  border: 0.8pt solid black;
  padding: 0 0.5mm;
  font-family: 'MiSans VF', 'MiSans Regular', Helvetica, Arial, sans-serif;
  border-radius: 1px;
}

.cert-text {
  line-height: 3mm;
}

/* 屏幕显示时放大200% */
@media screen {
  .mi-print-sn-template {
    transform: scale(2);
    /*    transform-origin: top center;*/
  }
}
</style>
