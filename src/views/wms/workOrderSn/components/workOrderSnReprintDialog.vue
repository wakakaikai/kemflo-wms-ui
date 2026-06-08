<template>
  <el-dialog title="补打印设置" v-model="visible" width="600px" append-to-body @close="handleClose">
    <el-alert title="请选择打印模板并确认打印" type="info" show-icon />
    <div style="margin-top: 15px">
      <el-form>
        <el-form-item label="打印模板">
          <el-select v-model="currentTemplate" placeholder="请选择打印模板" style="width: 100%" @change="handleTemplateChange">
            <el-option v-for="template in printTemplates" :key="template.value" :label="template.label" :value="template.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="打印记录">
          <div>
            选中的记录数量: <strong>{{ selectedRecords.length }}</strong> 条
          </div>
        </el-form-item>
      </el-form>
    </div>

    <!-- 打印预览区域 -->
    <div class="print-preview-container" v-if="selectedRecords.length > 0">
      <div class="preview-content-wrapper">
        <div class="preview-content">
          <!-- 生产入库单模板预览 -->
          <div v-if="currentTemplate === 'receiptOrderTemplate'" :class="['production-receipt', getPaperSizeClass(currentTemplate)]" ref="printPreviewContent">
            <div class="receipt-header">
              <div class="company-name-container">
                <span class="company-name">半成品、成品入库单</span>
              </div>
            </div>
            <hr class="top-hr" />
            <div class="receipt-body">
              <div class="content-section">
                <div class="info-row full-row">
                  <label>工单号码</label>
                  <span class="work-order-content">
                    <span>{{ workOrderInfo.workOrderNo }}</span>
                    <span class="version-text">V{{ workOrderInfo.version }}</span>
                  </span>
                </div>
                <div class="info-row full-row">
                  <label>产品品号</label>
                  <span>{{ workOrderInfo.material }}</span>
                </div>
                <div class="info-row product-description">
                  <label>产品描述</label>
                  <span>{{ workOrderInfo.materialDesc }}</span>
                </div>
                <div class="info-with-qr">
                  <div class="info-column">
                    <div class="info-row">
                      <label>入库数量</label>
                      <span>{{ formattedQty(workOrderInfo.qty) }} {{ workOrderInfo.unit }}</span>
                      <span>{{ workOrderInfo.remark }}</span>
                    </div>
                    <div class="info-row">
                      <label>生产日期</label>
                      <span>{{ workOrderInfo.productDate }}</span>
                    </div>
                    <div class="info-row">
                      <label>生产线别</label>
                      <span>{{ workOrderInfo.productLine }}</span>
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
                    <div class="qr-info">
                      <p>{{ workOrderInfo.sn }}</p>
                    </div>
                    <canvas ref="previewQrCodeCanvas9784"></canvas>
                  </div>
                </div>
              </div>
            </div>
            <hr class="bottom-hr" />
          </div>

          <!-- 生产入库单模板97*84-2 -->
          <div v-if="currentTemplate === 'receiptOrderTemplate2'" :class="['size9784-2']" ref="printPreviewContent">
            <div class="receipt-header">
              <div class="company-name-container">
                <span class="company-name">半成品、成品入库单</span>
                <span>第{{ workOrderInfo.sequence }}张/共{{ workOrderInfo.printTotal }}张</span>
              </div>
            </div>
            <hr class="top-hr" />
            <div class="receipt-body">
              <div class="content-section">
                <div class="info-row">
                  <label>工单号码</label>
                  <span class="work-order-content">
                    <span class="work-order-main">
                      <span class="work-order-no">{{ workOrderInfo.workOrderNo }}</span>
                      <span class="sfc-content">{{ workOrderInfo.sn }}</span>
                    </span>
                    <span class="version-text">V{{ workOrderInfo.version }}</span>
                  </span>
                </div>
                <div class="info-with-qr">
                  <div class="info-column">
                    <div class="info-row">
                      <label>客户订单</label>
                      <span class="work-order-content">
                        <span>{{ workOrderInfo.salesOrderNo }}</span>
                      </span>
                    </div>
                    <div class="info-row">
                      <label>交&nbsp;货&nbsp;日</label>
                      <span class="work-order-content">
                        <span>{{ parseTime(workOrderInfo.soDeliveryDate, '{y}-{m}-{d}') }}</span>
                      </span>
                    </div>
                    <div class="info-row">
                      <label>工单数量</label>
                      <span class="work-order-content">
                        <span>{{ Number(workOrderInfo.plannedQty) }}&nbsp;{{ workOrderInfo.unit }}</span>
                      </span>
                    </div>
                    <div class="info-row">
                      <label>产品品号</label>
                      <span>{{ workOrderInfo.material }}</span>
                    </div>
                  </div>
                  <div class="info-column">
                    <div class="qr-section horizontal-qr">
                      <canvas ref="previewQrCodeCanvas97842" v-if="workOrderInfo.sn" />
                      <div v-else style="width: 80px"></div>
                      <div class="qr-info border-qty">
                        <div style="display: flex; flex-direction: column; justify-content: center; height: 100%">
                          <p style="margin: 0; padding: 0">本卡数量</p>
                          <p style="margin: 20px 0 0 0; padding: 0">{{ Number(workOrderInfo.qty) }} {{ workOrderInfo.unit }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="info-row product-description">
                  <label>产品描述</label>
                  <span>{{ workOrderInfo.materialDesc }}</span>
                </div>
                <hr class="split-line" />
                <div class="info-with-qr">
                  <div class="info-column">
                    <div class="info-row">
                      <label>当前制程</label>
                      <span class="span-content-hidden">{{ workOrderInfo.curProcess }}</span>
                    </div>
                    <div class="info-row">
                      <label>生产线别</label>
                      <span>{{ workOrderInfo.productLine }}</span>
                    </div>
                    <div class="info-row">
                      <label>预计开工</label>
                      <span>{{ parseTime(workOrderInfo.plannedStartDate) }}</span>
                    </div>
                    <div class="info-row">
                      <label>预计完工</label>
                      <span>{{ parseTime(workOrderInfo.plannedEndDate) }}</span>
                    </div>
                  </div>
                  <div class="info-column">
                    <div class="info-row">
                      <label>标准产能</label>
                      <span class="standard-capacity-main">
                        <span class="standard-capacity">{{ workOrderInfo.standardPersonCapacity ? Number(workOrderInfo.standardPersonCapacity) : '' }}PCS/H</span>
                        <span class="standard-person">{{ workOrderInfo.standardPersonNumber ? Number(workOrderInfo.standardPersonNumber) : '' }}人</span>
                      </span>
                    </div>
                    <div class="info-row">
                      <label>实际产能</label>
                      <span>{{ workOrderInfo.actualCapacity }}</span>
                    </div>
                    <div class="info-row">
                      <label>实际开工</label>
                      <span>{{ workOrderInfo.actualStartTime }}</span>
                    </div>
                    <div class="info-row">
                      <label>实际完工</label>
                      <span>{{ workOrderInfo.actualEndTime }}</span>
                    </div>
                  </div>
                </div>
                <hr class="split-line" />
                <div class="info-with-qr">
                  <div class="info-column">
                    <div class="info-row">
                      <label>前一制程</label>
                      <span>{{ formatPreviousOrderNo(workOrderInfo.previousOrderNo) }} {{ workOrderInfo.previousWorkCenter }}</span>
                    </div>
                    <div class="info-row">
                      <label>下一制程</label>
                      <span>{{ formatPreviousOrderNo(workOrderInfo.nextOrderNo) }} {{ workOrderInfo.nextWorkCenter }}</span>
                    </div>
                  </div>
                  <div class="info-column">
                    <div class="info-row">
                      <label>完工时间</label>
                      <span>{{ workOrderInfo.previousEndDate }}</span>
                    </div>
                    <div class="info-row">
                      <label>预计开工</label>
                      <span>{{ parseTime(workOrderInfo.nextPlannedStartDate) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <hr class="bottom-hr" />
            <div class="receipt-bottom">
              <div class="bottom-info-row">
                <div class="bottom-item operator-item">
                  <span class="bottom-label">操作员</span>
                  <span class="bottom-value">{{ workOrderInfo.operator }}</span>
                </div>
                <div class="bottom-item inspector-item">
                  <span class="bottom-label">检验员</span>
                  <span class="bottom-value">{{ workOrderInfo.inspector }}</span>
                </div>
                <div class="bottom-item date-item">
                  <span class="bottom-label">制表日期</span>
                  <span class="bottom-value">{{ workOrderInfo.makeDate }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 生产入库单模板97*84-3 -->
          <div v-if="currentTemplate === 'receiptOrderTemplate3'" :class="['size9784-3']" ref="printPreviewContent">
            <div class="receipt-header">
              <div class="company-name-container">
                <span class="company-name">半成品、成品入库单</span>
              </div>
            </div>
            <hr class="top-hr" />
            <div class="receipt-body">
              <div class="content-section">
                <div class="info-row full-row">
                  <label>工单号码</label>
                  <span class="work-order-content">
                    <span>{{ workOrderInfo.workOrderNo }}</span>
                    <span class="version-text">V{{ workOrderInfo.version }}</span>
                  </span>
                </div>
                <div class="info-row">
                  <label>客户订单</label>
                  <span>{{ workOrderInfo.salesOrderNo }}</span>
                </div>
                <div class="info-row">
                  <label>交&nbsp;货&nbsp;日</label>
                  <span>{{ parseTime(workOrderInfo.soDeliveryDate, '{y}-{m}-{d}') }}</span>
                </div>
                <div class="info-row full-row">
                  <label>产品品号</label>
                  <span>{{ workOrderInfo.material }}</span>
                </div>
                <div class="info-row product-description">
                  <label>产品描述</label>
                  <span>{{ workOrderInfo.materialDesc }}</span>
                </div>
                <div class="info-with-qr">
                  <div class="info-column">
                    <div class="info-row">
                      <label>工单数量</label>
                      <span>{{ Number(workOrderInfo.plannedQty) }}&nbsp;{{ workOrderInfo.unit }}</span>
                    </div>
                    <div class="info-row">
                      <label>入库数量</label>
                      <span>{{ workOrderInfo.qty }} {{ workOrderInfo.unit }}</span>
                      <span>{{ workOrderInfo.remark }}</span>
                    </div>
                    <div class="info-row">
                      <label>生产日期</label>
                      <span>{{ workOrderInfo.productDate }}</span>
                    </div>
                    <div class="info-row">
                      <label>生产线别</label>
                      <span>{{ workOrderInfo.productLine }}</span>
                    </div>
                    <div class="info-row">
                      <label>批次号码</label>
                      <span></span>
                    </div>
                  </div>
                  <div class="qr-section">
                    <div class="qr-info">
                      <span>{{ workOrderInfo.sfcContent }}</span>
                    </div>
                    <canvas ref="previewQrCodeCanvas97843" v-if="workOrderInfo.sn"></canvas>
                  </div>
                </div>
                <hr class="split-line" />
                <div class="info-with-qr">
                  <div class="info-column">
                    <div class="info-row">
                      <label>下一制程</label>
                      <span>{{ formatPreviousOrderNo(workOrderInfo.nextOrderNo) }} {{ workOrderInfo.nextWorkCenter }}</span>
                    </div>
                  </div>
                  <div class="info-column">
                    <div class="info-row">
                      <label>预计开工</label>
                      <span>{{ parseTime(workOrderInfo.nextPlannedStartDate) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <hr class="bottom-hr" />
            <div class="receipt-bottom">
              <div class="bottom-info-row">
                <div class="bottom-item operator-item">
                  <span class="bottom-label">操作员</span>
                  <span class="bottom-value">{{ workOrderInfo.operator }}</span>
                </div>
                <div class="bottom-item inspector-item">
                  <span class="bottom-label">检验员</span>
                  <span class="bottom-value">{{ workOrderInfo.inspector }}</span>
                </div>
                <div class="bottom-item date-item">
                  <span class="bottom-label">制表日期</span>
                  <span class="bottom-value">{{ workOrderInfo.makeDate }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 工业二维码模板预览 (80×60mm) -->
          <div v-else-if="currentTemplate === 'qr8060'" class="qr-template qr8060 size8060" ref="printPreviewContent">
            <div class="qr-container">
              <canvas ref="previewQrCodeCanvas8060"></canvas>
              <div class="qr-info">
                <p>{{ workOrderInfo.workOrderNo }}</p>
                <p>{{ workOrderInfo.sn }}</p>
                <p>{{ workOrderInfo.qty }} {{ workOrderInfo.unit }}</p>
              </div>
            </div>
          </div>

          <!-- 工业二维码模板预览 (50×60mm) -->
          <div v-else-if="currentTemplate === 'qr5060'" class="qr-template qr5060 size5060" ref="printPreviewContent">
            <div class="qr-container">
              <canvas ref="previewQrCodeCanvas5060"></canvas>
              <div class="qr-info">
                <p>{{ workOrderInfo.workOrderNo }}</p>
                <p>{{ workOrderInfo.sn }}</p>
                <p>{{ workOrderInfo.qty }} {{ workOrderInfo.unit }}</p>
              </div>
            </div>
          </div>

          <!-- 工业二维码模板预览 (30×40mm) -->
          <div v-else-if="currentTemplate === 'qr3040'" class="qr-template qr3040 size3040" ref="printPreviewContent">
            <div class="qr-container">
              <canvas ref="previewQrCodeCanvas3040"></canvas>
              <div class="qr-info">
                <p>{{ workOrderInfo.workOrderNo }}</p>
                <p>{{ workOrderInfo.sn }}</p>
                <p>{{ workOrderInfo.qty }} {{ workOrderInfo.unit }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取 消</el-button>
        <el-button :loading="printLoading" type="primary" @click="handleBatchPrint">确定打印</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { parseTime } from '@/utils/ruoyi';
import { getUserProfile } from '@/api/system/user';
import type { WorkOrderSnVO } from '@/api/wms/workOrderSn/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const props = defineProps<{
  modelValue: boolean;
  selectedRecords: WorkOrderSnVO[];
}>();

const emit = defineEmits(['update:modelValue', 'print-success']);

const visible = ref(false);
const printLoading = ref(false);
const currentTemplate = ref('receiptOrderTemplate3');
const operator = ref('');

const previewQrCodeCanvas = ref<HTMLCanvasElement | null>(null);
const previewQrCodeCanvas9784 = ref<HTMLCanvasElement | null>(null);
const previewQrCodeCanvas97842 = ref<HTMLCanvasElement | null>(null);
const previewQrCodeCanvas97843 = ref<HTMLCanvasElement | null>(null);
const previewQrCodeCanvas8060 = ref<HTMLCanvasElement | null>(null);
const previewQrCodeCanvas5060 = ref<HTMLCanvasElement | null>(null);
const previewQrCodeCanvas3040 = ref<HTMLCanvasElement | null>(null);
const printPreviewContent = ref<HTMLElement | null>(null);

const workOrderInfo = ref({
  companyName: '溢泰（南京）环保科技有限公司',
  workOrderNo: '',
  salesOrderNo: '',
  soDeliveryDate: '',
  curProcess: '',
  plannedStartDate: '',
  plannedEndDate: '',
  previousOrderNo: '',
  previousWorkCenter: '',
  nextOrderNo: '',
  nextWorkCenter: '',
  nextPlannedStartDate: '',
  standardPersonCapacity: '',
  standardPersonNumber: '',
  actualCapacity: '',
  actualStartTime: '',
  actualEndTime: '',
  previousEndDate: '',
  sfcContent: '',
  material: '',
  materialDesc: '',
  qty: null,
  plannedQty: null,
  unit: 'PCS',
  productDate: '',
  makeDate: '',
  productLine: '',
  operator: '',
  inspector: '',
  version: 1,
  remark: '',
  printPageNum: 1,
  printTotal: 1,
  sequence: undefined as number | undefined
});

const printTemplates = ref([
  // { value: 'receiptOrderTemplate', label: '生产入库单模板1(97×84mm)' },
  // { value: 'receiptOrderTemplate2', label: '生产入库单模板2(97×84mm)' },
  { value: 'receiptOrderTemplate3', label: '生产入库单模板3(97×84mm)' }
]);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val && props.selectedRecords.length > 0) {
      initPreviewData();
    }
  }
);

watch(visible, (val) => {
  emit('update:modelValue', val);
});

watch(
  () => props.selectedRecords,
  () => {
    if (props.selectedRecords.length > 0) {
      nextTick(() => {
        generatePreviewQRCode();
      });
    }
  },
  { deep: true }
);

const initPreviewData = () => {
  const record = props.selectedRecords[0];
  workOrderInfo.value = { ...record.wmsWorkOrderVo, ...record };
  workOrderInfo.value.sfcContent = record.sn;
  workOrderInfo.value.material = record.item;
  workOrderInfo.value.materialDesc = record.itemDesc;
  workOrderInfo.value.productDate = record.productDate ? proxy?.parseTime(record.productDate, '{y}-{m}-{d}') : '';
  workOrderInfo.value.makeDate = parseTime(new Date(), '{y}-{m}-{d}');
  workOrderInfo.value.operator = operator.value;

  nextTick(() => {
    generatePreviewQRCode();
  });
};

const handleTemplateChange = () => {
  nextTick(() => {
    generatePreviewQRCode();
  });
};

const getPaperSizeClass = (template: string) => {
  switch (template) {
    case 'qr5060':
      return 'size5060';
    case 'qr3040':
      return 'size3040';
    case 'qr8060':
      return 'size8060';
    case 'receiptOrderTemplate':
      return 'size9784';
    case 'receiptOrderTemplate2':
      return 'size9784-2';
    case 'receiptOrderTemplate3':
      return 'size9784-3';
    default:
      return 'size9784';
  }
};

const generatePreviewQRCode = () => {
  if (props.selectedRecords.length === 0) return;

  const content = workOrderInfo.value.sn;
  if (!content) return;

  let qrCanvasRef = null;
  let qrSize = 100;

  switch (currentTemplate.value) {
    case 'qr8060':
      qrCanvasRef = previewQrCodeCanvas8060.value;
      qrSize = 180;
      break;
    case 'qr5060':
      qrCanvasRef = previewQrCodeCanvas5060.value;
      qrSize = 150;
      break;
    case 'qr3040':
      qrCanvasRef = previewQrCodeCanvas3040.value;
      qrSize = 120;
      break;
    case 'receiptOrderTemplate':
      qrCanvasRef = previewQrCodeCanvas9784.value;
      qrSize = 100;
      break;
    case 'receiptOrderTemplate2':
      qrCanvasRef = previewQrCodeCanvas97842.value;
      qrSize = 80;
      break;
    case 'receiptOrderTemplate3':
      qrCanvasRef = previewQrCodeCanvas97843.value;
      qrSize = 80;
      break;
    default:
      qrCanvasRef = previewQrCodeCanvas.value;
      qrSize = 100;
  }

  if (qrCanvasRef) {
    QRCode.toCanvas(qrCanvasRef, content, {
      width: qrSize,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    });
  }
};

const formatPreviousOrderNo = (orderNo) => {
  if (orderNo && orderNo.length >= 3 && orderNo.substring(0, 3) === '000') {
    return orderNo.substring(3);
  }
  return orderNo;
};

const formattedQty = (qty: number | string | null | undefined): string => {
  if (qty === null || qty === undefined || qty === '') {
    return '';
  }
  const num = Number(qty);
  if (isNaN(num)) {
    return '';
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  }).format(num);
};

const getPrintStyles = (template: string) => {
  switch (template) {
    case 'qr3040':
      return `
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
    case 'qr5060':
      return `
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
    case 'qr8060':
      return `
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
    case 'receiptOrderTemplate':
    case 'receiptOrderTemplate2':
    case 'receiptOrderTemplate3':
    default:
      return `
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
  }
};

const handleBatchPrint = async () => {
  if (props.selectedRecords.length === 0) {
    proxy?.$modal.msgWarning('没有可打印的记录');
    return;
  }

  printLoading.value = true;
  try {
    let printContentHTML = '';
    for (let i = 0; i < props.selectedRecords.length; i++) {
      const record = props.selectedRecords[i];

      workOrderInfo.value = { ...record.wmsWorkOrderVo, ...record };
      workOrderInfo.value.sfcContent = record.sn;
      workOrderInfo.value.material = record.item;
      workOrderInfo.value.materialDesc = record.itemDesc;
      workOrderInfo.value.productDate = record.productDate ? proxy?.parseTime(record.productDate, '{y}-{m}-{d}') : '';
      workOrderInfo.value.makeDate = parseTime(new Date(), '{y}-{m}-{d}');
      workOrderInfo.value.operator = operator.value;

      await nextTick();
      generatePreviewQRCode();
      await nextTick();

      const canvas = await html2canvas(printPreviewContent.value, {
        scale: 2,
        logging: false,
        useCORS: true,
        scrollX: 0,
        scrollY: 0
      });

      printContentHTML += `
        <div style="page-break-after: ${i < props.selectedRecords.length - 1 ? 'always' : 'auto'};">
          <img src="${canvas.toDataURL('image/png')}" style="width:100%; height:100%;" />
        </div>
      `;
    }

    await nextTick();
    generatePreviewQRCode();

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>批量打印预览</title>
            <style>
              ${getPrintStyles(currentTemplate.value)}
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

    emit('print-success');
    visible.value = false;
  } catch (error) {
    console.error('打印失败:', error);
    proxy?.$modal.msgError('打印失败，请重试');
  } finally {
    printLoading.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
};

const getUser = async () => {
  const res = await getUserProfile();
  operator.value = res.data.user.nickName;
};

onMounted(() => {
  workOrderInfo.value.makeDate = parseTime(new Date(), '{y}-{m}-{d}');
  getUser();
});
</script>

<style lang="scss" scoped>
.preview-content {
  flex: 1;
  padding: 16px 30px;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.production-receipt {
  width: 100%;
  padding: 5px;
  box-sizing: border-box;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  justify-content: center;
}

.product-description span {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thermal-size {
  width: 80mm;
  height: 60mm;
  font-size: 10px;
}

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
  overflow: hidden;
  box-sizing: border-box;
}

.size9784 .receipt-header {
  margin: 0 3mm;
}

.size9784 .receipt-body {
  margin: 0 3mm;
}

.size9784 .company-name {
  font-size: 18px;
  font-weight: bold;
}

.size9784 .info-row label {
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
  margin: 6px 3mm 6px 3mm;
  height: 2px;
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.company-name-container {
  text-align: center;
  width: 100%;
}

.company-name {
  font-size: 14px;
  font-weight: bold;
  display: block;
}

.receipt-body {
  display: flex;
  flex-direction: row;
}

.content-section {
  flex: 3;
}

.info-row {
  display: flex;
  margin-bottom: 5px;
}

.info-row label {
  width: 18mm;
  font-weight: bold;
  flex-shrink: 0;
  font-size: 12px;
  margin-right: 1mm;
}

.info-row span {
  flex: 1;
  word-break: break-all;
  font-size: 12px;
  line-height: 1.4;
}

.qr-section .qr-info {
  text-align: center;
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: bold;
}

.qr-section .qr-info p {
  margin: 0;
  padding: 0;
  word-break: break-all;
}

.qr-section {
  flex: 1.3;
  padding-left: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.qr-section canvas {
  width: 100%;
  height: auto;
  max-width: 100%;
  max-height: 100%;
}

.top-hr,
.bottom-hr {
  margin: 5px 0;
  border: none;
  height: 2px;
  background-color: #000;
  width: calc(100% - 6mm);
}

.top-hr {
  margin-top: 10px;
}

.bottom-hr {
  margin-bottom: 10px;
}

.info-with-qr {
  display: flex;
  flex-direction: row;
}

.info-column {
  flex: 2;
}

.info-row.full-row {
  display: flex;
  align-items: center;
  position: relative;
}

.info-row.full-row label {
  width: auto;
  display: inline-block;
  margin-right: 20px;
  flex-shrink: 0;
}

.info-row.full-row span {
  display: inline-block;
}

.work-order-content {
  flex: 1;
  position: relative;
  font-size: 12px;
}

.version-text {
  position: absolute;
  right: 0;
  font-weight: bold;
  white-space: nowrap;
}

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

.size9784-2 {
  width: 97mm;
  height: 84mm;
  font-size: 13px;
  padding: 10px 5px;
  overflow: hidden;
  box-sizing: border-box;

  .top-hr,
  .bottom-hr {
    margin: 2px 0;
    border: none;
    height: 2px;
    background-color: #000;
    width: 100%;
  }

  .split-line {
    margin: 2px 0;
    border: none;
    height: 1px;
    background-color: #000;
    width: 100%;
  }

  .receipt-header {
    margin: 0 3mm;
  }

  .receipt-body {
    margin: 0 3mm;
  }

  .receipt-bottom {
    margin: 0 3mm;
    line-height: 15px;

    .bottom-info-row {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      width: 100%;
    }

    .bottom-item {
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    .operator-item {
      flex: 2;
    }

    .inspector-item {
      flex: 2;
    }

    .date-item {
      flex: 2.5;
    }

    .bottom-label {
      font-weight: bold;
      margin-right: 5px;
      white-space: nowrap;
    }

    .bottom-value {
      flex: 1;
      text-align: center;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .company-name-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .company-name {
    font-size: 17px;
    font-weight: bold;
  }

  .info-row {
    line-height: 15px;
  }

  .info-row label {
    width: 13mm;
    text-align-last: justify;
    font-weight: bold;
    flex-shrink: 0;
    font-size: 12px;
    margin-right: 1mm;
  }

  .span-content-hidden {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .info-row span {
    font-size: 12px;
    line-height: 15px;
  }

  .qr-section canvas {
    max-width: 90%;
    max-height: 90%;
  }

  .horizontal-qr {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    min-height: 80px;
    margin: 0 -4px;
  }

  .horizontal-qr .qr-info {
    margin-bottom: 0;
    margin-left: 10px;
  }

  .border-qty {
    border: 1px solid #000;
    height: 80px;
    width: 80px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    border-radius: 10px;
  }

  .info-row {
    display: flex;
    margin-bottom: 1px;
  }

  .work-order-content {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
  }

  .work-order-main {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .work-order-no {
    font-weight: normal;
    flex: 11;
  }

  .sfc-content {
    font-weight: normal;
    flex: 20;
  }

  .standard-capacity-main {
    display: flex;
    gap: 5px;
  }

  .standard-capacity {
    flex: 2;
  }

  .standard-person {
    flex: 1;
  }

  .version-text {
    font-weight: bold;
    white-space: nowrap;
    flex-shrink: 0;
  }
}

.size9784-3 {
  width: 97mm;
  height: 84mm;
  font-size: 13px;
  padding: 10px 5px;

  .receipt-header {
    margin: 0 3mm;
  }

  .receipt-body {
    margin: 0 3mm;
    display: flex;
    flex-direction: row;
  }

  .content-section {
    flex: 3;
  }

  .receipt-bottom {
    margin: 0 3mm;
    line-height: 15px;

    .bottom-info-row {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      width: 100%;
    }

    .bottom-item {
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    .operator-item {
      flex: 2;
    }

    .inspector-item {
      flex: 2;
    }

    .date-item {
      flex: 2.5;
    }

    .bottom-label {
      font-weight: bold;
      margin-right: 5px;
      white-space: nowrap;
    }

    .bottom-value {
      flex: 1;
      text-align: center;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .qr-section canvas {
    max-width: 90%;
    max-height: 90%;
  }

  .top-hr,
  .bottom-hr {
    margin: 6px 3mm 6px 3mm;
    height: 2px;
  }

  .receipt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
  }

  .company-name-container {
    text-align: center;
    width: 100%;
  }

  .company-name {
    font-size: 14px;
    font-weight: bold;
    display: block;
  }

  .qr-section {
    flex: 1.5;
    padding-left: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }

  .qr-section canvas {
    width: 100%;
    height: auto;
    max-width: 100%;
    max-height: 100%;
  }

  .info-row {
    line-height: 15px;
    margin-bottom: 2px;
  }

  .info-row label {
    width: 13mm;
    text-align-last: justify;
    font-weight: bold;
    flex-shrink: 0;
    font-size: 12px;
    margin-right: 1mm;
  }

  .span-content-hidden {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .info-row span {
    font-size: 12px;
    line-height: 15px;
  }

  .split-line {
    margin: 5px 0;
    border: none;
    height: 1px;
    background-color: #000;
    width: 100%;
  }
}

@media screen and (max-width: 992px) {
  .preview-content {
    padding: 10px;
  }
}
</style>
