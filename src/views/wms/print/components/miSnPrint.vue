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
                  <el-button icon="Refresh" text @click="refreshPrinterList" title="刷新打印机"> </el-button>
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
                  <el-button icon="Refresh" text @click="refreshPapers" title="刷新纸张"> </el-button>
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
              <HistoryInput v-model="queryParams.shopOrder" :config="shopOrderConfig" placeholder="请输入工单号码" @keyup.enter="getShopOrderList">
                <template #append>
                  <el-button icon="Search" @click="showShopOrderDialog" />
                </template>
              </HistoryInput>
            </el-form-item>

            <!-- 序列号(SN) -->
            <!--            <el-form-item label="条码" prop="sfc">
              <el-input v-model="queryParams.sfc" placeholder="请输入条码" />
            </el-form-item>-->

            <!-- 打印份数 -->
            <!--            <el-form-item label="打印份数">
              <el-input-number v-model="copies" :min="1" :max="9999" style="width: 100%" />
            </el-form-item>-->
          </el-form>
        </div>

        <div class="action-buttons">
          <el-button v-hasPermi="['mes:shopOrderSfc:list']" type="primary" icon="Search" @click="getShopOrderSfcList">
            搜索
            <el-tooltip content="搜索工单条码" placement="top">
              <el-icon class="ml-1"><QuestionFilled /></el-icon>
            </el-tooltip>
          </el-button>
          <el-button :loading="printLoading" v-hasPermi="['mes:print:miSn']" color="#626aef" icon="Printer" @click="handlePrint"> 打印 </el-button>
        </div>
        <div class="action-buttons">

          <el-button :loading="printLoading" v-hasPermi="['mes:print:miSn']" color="#626aef" icon="Printer" @click="handleExportImage"> 导出 </el-button>
          <el-button :loading="printLoading" v-hasPermi="['mes:print:miSn']" color="#626aef" icon="Printer" @click="handlePreview"> 预览 </el-button>
        </div>
      </el-aside>

      <!-- 右侧预览区域 -->
      <el-main class="preview-area">
        <!-- 标签区域 -->
        <div class="preview-container">
          <div class="preview-header">
            <h4>MI标签预览 (35×12mm)</h4>
          </div>
          <div class="preview-content">
            <!-- MI标签模板 -->
            <div class="preview-content-sn">
              <div class="mi-print-sn-template" ref="printContent">
                <!-- 主体内容 -->
                <div class="label-body">
                  <!-- 标签顶部：生产日期 -->
                  <div class="product-date-section">
                    <span>生产日期: {{ workOrderInfo.productDate }}</span>
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
                        <span class="sn-label">SN:&nbsp;</span>
                        <span class="sn-value">{{ queryParams.sfc }}</span>
                      </div>

                      <!-- SKU信息 -->
                      <div class="sku-section">
                        <span class="sku-label">SKU:&nbsp;</span>
                        <span class="sku-value">{{ workOrderInfo.sku }}</span>
                      </div>
                    </div>

                    <!-- 右侧维修凭证框 -->
                    <div class="right-section">
                      <div class="maintenance-box">
                        <div class="maintenance-text text-content">维修凭证</div>
                        <div class="maintenance-text">请勿撕毁</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 预览信息 -->
            <div class="preview-info">
              <el-descriptions :column="2" size="small" border>
                <el-descriptions-item label="标签尺寸">35mm × 12mm</el-descriptions-item>
                <el-descriptions-item label="打印份数">{{ copies }} 份</el-descriptions-item>
                <el-descriptions-item label="当前缩放">200%</el-descriptions-item>
                <el-descriptions-item label="当前打印机" :span="2">{{ selectedPrinter || '未选择' }}</el-descriptions-item>
                <el-descriptions-item label="工单号码">{{ queryParams.shopOrder }}</el-descriptions-item>
                <el-descriptions-item label="料号">{{ queryParams.plannedItem }}</el-descriptions-item>
                <el-descriptions-item label="计划数量">{{ queryParams.qtyToBuild }}</el-descriptions-item>
                <el-descriptions-item label="已下达数量">{{ queryParams.qtyReleased }}</el-descriptions-item>
                <el-descriptions-item label="产品描述" :span="2" class="product-desc" width="150px">
                  {{ queryParams.itemDesc }}
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
import { ref, watch, onMounted, nextTick } from 'vue';
import { listShopOrderSfc } from '@/api/mes/shopOrderSfc';
import { ShopOrderSfcVO, ShopOrderSfcQuery, ShopOrderSfcForm } from '@/api/mes/shopOrderSfc/types';
import { savePrintHistory } from '@/api/mes/shopOrderSfcPrintHistory';
import ShopOrderDialog from '@/views/mes/workpanel/components/shopOrderDialog.vue';
import { listShopOrder } from '@/api/mes/shopOrder';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import { HttpStatus } from '@/enums/RespEnum';
import HistoryInput from '@/components/HistoryInput/index.vue';
import { HistoryConfig } from '@/types/history';
import { QuestionFilled } from '@element-plus/icons-vue';

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
// 条形码SVG引用
const barcodeSvg = ref(null);

const initFormData: ShopOrderSfcForm = {
  id: undefined,
  shopOrderBo: undefined,
  shopOrder: undefined,
  sfcBo: undefined,
  sfc: undefined,
  qty: undefined,
  batchId: undefined
};
const data = reactive<PageData<ShopOrderSfcForm, ShopOrderSfcQuery>>({
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
const printContent = ref(null);

/** 查询工单下达的条码列表 */
const getShopOrderSfcList = async () => {
  if (!queryParams.value.shopOrder) {
    return;
  }
  cancelAll();
  loading.value = true;
  queryParams.value.enableNormalPrint = true;
  queryParams.value.sfc = '';
  const res = await listShopOrderSfc(queryParams.value);
  shopOrderSfcList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: ShopOrderSfcVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
  selectedShopOrderSfcList.value = selection;
  queryParams.value.sfc = selection.length > 0 ? selection[0].sfc : '';
};

// 生成条形码（使用JSBarcode）
const generateBarcode = () => {
  const content = queryParams.value.sfc;
  if (!content || !barcodeSvg.value) return;

  // 清空之前的条形码
  barcodeSvg.value.innerHTML = '';

  try {
    // 使用JsBarcode生成条形码
    JsBarcode(barcodeSvg.value, content, {
      format: 'CODE128', // 使用CODE128格式，适合字母数字混合
      displayValue: false, // 显示文本值
      height: 28, // 条形码高度
      width: 1, // 条形码条宽
      margin: 0 // 边距
    });
  } catch (error) {
    console.error('条形码生成失败:', error);
  }
};

// 监听工单信息变化
watch(
  queryParams,
  () => {
    nextTick(generateBarcode);
  },
  { deep: true }
);
const podConfig = ref<{ [key: string]: any }>({});

// 显示工单选择对话框
const showShopOrderDialog = () => {
  podConfig.value.statusList = ['NEW', 'RELEASABLE', 'RELEASED', 'ACTIVE'];
  podConfig.value.shopOrderTypeList = ['PRODUCTION', 'PRODUCTION-ZZ', 'REWORK', 'REWORK-CJ'];
  shopOrderDialogRef.value.openDialog();
};
// 弹框回调
const shopOrderCallBack = (data: any) => {
  queryParams.value = data;
  workOrderInfo.value.sku = data.sku;
  getShopOrderSfcList();
};

// 全选
const selectAll = () => {
  multipleTableRef.value.toggleAllSelection();
};

// 反选
const cancelAll = () => {
  multipleTableRef.value.clearSelection(); // 清空选择
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
      console.error('Lodop实例获取失败');
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
  if (selectedShopOrderSfcList.value.length === 0) {
    proxy.$modal.msgWarning('请先选择工单条码');
    return;
  }
  printLoading.value = true;
  try {
    const res = await savePrintHistory({ shopOrderSfcBoList: selectedShopOrderSfcList.value, printType: 1 });
    if (res.code !== HttpStatus.SUCCESS) {
      printLoading.value = false;
      return;
    }
    // 初始化打印任务
    LODOP.PRINT_INIT('MI生产标签');

    // 设置打印机
    LODOP.SET_PRINTER_INDEX(selectedPrinter.value);

    // 如果选择了纸张，则设置纸张类型
    if (selectedPaper.value) {
      LODOP.SET_PRINT_PAGESIZE(1, '', '', selectedPaper.value);
    } else {
      // 设置默认纸张大小
      LODOP.SET_PRINT_PAGESIZE(0, 0, 0, '35mm 12mm'); // 设置纸张大小
    }

    // 优先处理选中的条码列表
    if (selectedShopOrderSfcList.value.length > 0) {
      for (let i = 0; i < selectedShopOrderSfcList.value.length; i++) {
        const selectedSfc = selectedShopOrderSfcList.value[i].sfc;
        if (selectedSfc) {
          // 临时更新条码内容
          queryParams.value.sfc = selectedSfc;

          // 重新生成条形码
          await nextTick();
          generateBarcode();
          await nextTick(); // 确保条形码渲染完成

          // 生成截图
          const canvas = await html2canvas(printContent.value, {
            scale: 2,
            logging: false,
            useCORS: true,
            scrollX: 0,
            scrollY: 0
          });

          // 添加打印内容
          LODOP.ADD_PRINT_IMAGE(0, 0, '100%', '100%', canvas.toDataURL('image/png'));
          // 按原图比例(不变形)缩放模式
          LODOP.SET_PRINT_STYLEA(0, 'Stretch', 2);
          if (i < ids.value.length - 1) {
            LODOP.NEWPAGE();
          }
        }
      }
    } else {
      // 如果没有选中的条码，只打印当前输入的条码
      // 生成条形码
      await nextTick();
      generateBarcode();

      // 生成截图
      const canvas = await html2canvas(printContent.value, {
        scale: 2,
        logging: false,
        useCORS: true,
        scrollX: 0,
        scrollY: 0
      });

      // 添加打印内容，根据copies值重复打印
      for (let i = 0; i < copies.value; i++) {
        LODOP.ADD_PRINT_IMAGE(0, 0, '100%', '100%', canvas.toDataURL('image/png'));
        if (i < copies.value - 1) {
          LODOP.NEWPAGE();
        }
      }
    }
    // 直接打印
    LODOP.PRINT();
    printLoading.value = false;
    proxy.$modal.msgSuccess('打印任务已发送');
  } catch (error) {
    proxy.$modal.msgError('打印失败: ' + (error as Error).message);
  } finally {
    printLoading.value = false;
  }
};

// 导出图片功能
const handleExportImage = async () => {
  // 生成条形码
  await nextTick();
  generateBarcode();

  // 使用html2canvas将标签转换为图片
  const printElement = document.querySelector('.mi-print-sn-template') as HTMLElement;
  if (!printElement) {
    proxy.$modal.msgError('找不到要导出的标签元素');
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
    link.download = `MI标签_${queryParams.value.sfc}_${new Date().getTime()}.png`;
    link.click();

    proxy.$modal.msgSuccess('图片导出成功');
  } catch (error) {
    proxy.$modal.msgError('导出图片失败: ' + (error as Error).message);
  }
};

const handlePreview = async () => {
  const LODOP = getLodop();
  if (!LODOP) {
    proxy.$modal.msgError('未检测到Lodop打印服务，请安装Lodop插件');
    return;
  }
  if (!workOrderInfo.value.sku) {
    proxy.$modal.msgWarning('请先确认工单所属物料的SKU资料是否维护');
    return;
  }
  if (selectedShopOrderSfcList.value.length === 0) {
    proxy.$modal.msgWarning('请先选择工单条码');
    return;
  }
  printLoading.value = true;
  try {
    const res = await savePrintHistory({ shopOrderSfcBoList: selectedShopOrderSfcList.value, printType: 1 });
    if (res.code !== HttpStatus.SUCCESS) {
      printLoading.value = false;
      return;
    }
    // 初始化打印任务
    LODOP.PRINT_INIT('MI生产标签');

    // 设置打印机
    LODOP.SET_PRINTER_INDEX(selectedPrinter.value);

    // 如果选择了纸张，则设置纸张类型
    if (selectedPaper.value) {
      LODOP.SET_PRINT_PAGESIZE(1, '', '', selectedPaper.value);
    } else {
      // 设置默认纸张大小
      LODOP.SET_PRINT_PAGESIZE(0, 0, 0, '35mm 12mm'); // 设置纸张大小
    }

    // 优先处理选中的条码列表
    if (selectedShopOrderSfcList.value.length > 0) {
      for (let i = 0; i < selectedShopOrderSfcList.value.length; i++) {
        const selectedSfc = selectedShopOrderSfcList.value[i].sfc;
        if (selectedSfc) {
          // 临时更新条码内容
          queryParams.value.sfc = selectedSfc;

          // 重新生成条形码
          await nextTick();
          generateBarcode();
          await nextTick(); // 确保条形码渲染完成

          // 生成截图
          const canvas = await html2canvas(printContent.value, {
            scale: 2,
            logging: false,
            useCORS: true,
            scrollX: 0,
            scrollY: 0
          });

          // 添加打印内容
          LODOP.ADD_PRINT_IMAGE(0, 0, '100%', '100%', canvas.toDataURL('image/png'));
          // 按原图比例(不变形)缩放模式
          LODOP.SET_PRINT_STYLEA(0, 'Stretch', 2);
          if (i < ids.value.length - 1) {
            LODOP.NEWPAGE();
          }
        }
      }
    } else {
      // 如果没有选中的条码，只打印当前输入的条码
      // 生成条形码
      await nextTick();
      generateBarcode();

      // 生成截图
      const canvas = await html2canvas(printContent.value, {
        scale: 2,
        logging: false,
        useCORS: true,
        scrollX: 0,
        scrollY: 0
      });

      // 添加打印内容，根据copies值重复打印
      for (let i = 0; i < copies.value; i++) {
        LODOP.ADD_PRINT_IMAGE(0, 0, '100%', '100%', canvas.toDataURL('image/png'));
        if (i < copies.value - 1) {
          LODOP.NEWPAGE();
        }
      }
    }
    // 显示预览
    LODOP.PREVIEW();
    printLoading.value = false;
    proxy.$modal.msgSuccess('打印任务已发送');
  } catch (error) {
    proxy.$modal.msgError('打印失败: ' + (error as Error).message);
  } finally {
    printLoading.value = false;
  }
};

const clearPrintInfo = () => {
  workOrderInfo.value.sku = '';
  queryParams.value = {};
  // 清空条码列表
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
    queryParams.value = res.rows[0];
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

.print-btn,
.export-btn {
  width: 100%;
  margin-bottom: 10px;
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
  max-height: 160px;
}

.preview-content-sn {
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
  margin-top: 10px;
}

.btn-span {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* MI标签模板样式 */
.mi-print-sn-template {
  width: 35mm;
  height: 12mm;
  padding: 1mm 1.5mm;
  background: white;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.product-date-section {
  display: flex;
  justify-content: flex-start;
  font-family: 'MiSans VF Regular', sans-serif;
  font-size: 4.5pt;
  line-height: 2mm;
  height: 2mm;
}

.label-barcode {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 4.2mm;
}

.barcode {
  height: 5mm !important;
  width: 100%;
  font-family: 'MiSans VF Regular', sans-serif;
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
  font-family: 'MiSans VF Regular', sans-serif;
  font-size: 4pt;
}

.content-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex: 1;
  height: 4mm;
}

.left-section {
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
  padding: 0.2mm;
  font-family: 'MiSans VF Demibold', sans-serif;
}

.maintenance-text {
  line-height: 1.4mm;
  font-size: 4pt;
  font-family: '宋体', serif;
}

.text-content {
  margin-bottom: 1px;
}

.sn-section,
.sku-section {
  display: flex;
  font-family: 'MiSans VF Regular', sans-serif;
  font-size: 4.5pt;
  line-height: 2mm;
}

/* 屏幕显示时放大200% */
@media screen {
  .mi-print-sn-template {
    transform: scale(2); /* 放大200%用于屏幕预览 */
  }
}
</style>
