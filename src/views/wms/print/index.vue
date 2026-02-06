<template>
  <div class="print-container">
    <el-container>
      <!-- 左侧菜单区域 -->
      <el-aside width="320px" class="sidebar">
        <div class="menu-section">
          <!--          <h4>选择打印数据</h4>-->
          <el-tabs v-model="activeTab" class="print-tabs">
            <el-tab-pane label="内容打印" name="content">
              <el-radio-group v-model="currentTemplate" class="template-list">
                <!--                <el-radio value="receiptOrderTemplate">生产入库单模板1(97×84mm)</el-radio>-->
                <!--                <el-radio label="receiptOrderTemplate2">生产入库单模板2(97×84mm)</el-radio>-->
                <el-radio label="receiptOrderTemplate3">生产入库单模板3(97×84mm)</el-radio>
                <!--                <el-radio value="designA4">工业设计+A4/A5纸</el-radio>-->
                <!--                <el-radio value="qr8060">工业二维码(80×60mm)</el-radio>-->
                <!--                <el-radio value="qr5060">工业二维码(50×60mm)</el-radio>-->
                <!--                <el-radio value="qr3040">工业二维码(30×40mm)</el-radio>-->
              </el-radio-group>
            </el-tab-pane>
            <!--            <el-tab-pane label="Excel模板打印" name="excel">
              <el-radio-group v-model="selectedExcelTemplate" class="template-list">
                <el-radio label="qrExcel">工业二维码.xlsx</el-radio>
                <el-radio label="listExcel">工业列表.xlsx</el-radio>
                <el-radio label="materialExcel">用料清单.xlsx</el-radio>
              </el-radio-group>
            </el-tab-pane>-->
          </el-tabs>
        </div>

        <div class="menu-section">
          <h4>打印设置</h4>

          <!-- 工单信息输入 -->
          <el-form label-position="top" ref="queryFormRef" :rules="rules" :model="workOrderInfo">
            <!--            <el-form-item label="公司名称" prop="companyName">
              &lt;!&ndash;              <el-input v-model="workOrderInfo.companyName" placeholder="请输入公司名称" />&ndash;&gt;
              <el-select v-model="workOrderInfo.companyName" placeholder="请选择公司名称">
                <el-option v-for="dict in wms_company_name" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>-->
            <el-form-item label="工单号码" prop="workOrderNo">
              <el-input ref="workOrderInputRef" v-model="workOrderInfo.workOrderNo" placeholder="请输入工单号码" @keydown.tab.prevent="keyDownTab" @keydown.enter.prevent="keyDownTab">
                <template #append>
                  <el-button icon="Search" @click="showWorkOrderDialog" />
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="入库数量" prop="qty">
              <el-input-number ref="qtyInputRef" v-model="workOrderInfo.qty" :precision="3" style="width: 100%" />
            </el-form-item>
            <el-form-item label="条码内容" prop="sfcContent">
              <el-input v-model="workOrderInfo.sfcContent" placeholder="请输入条码内容" />
            </el-form-item>
            <el-form-item label="生产日期" prop="productDate">
              <el-date-picker
                v-model="workOrderInfo.productDate"
                type="date"
                placeholder="请选择生产日期"
                value-format="YYYY-MM-DD"
                clearable
                :disabled-date="disabledFutureDate"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="生产线体" prop="productLine">
              <el-input v-model="workOrderInfo.productLine" placeholder="请输入生产线体" />
            </el-form-item>
            <el-form-item v-if="currentTemplate == 'receiptOrderTemplate2'" label="实际开工" prop="actualStartTime">
              <el-date-picker
                v-model="workOrderInfo.actualStartTime"
                type="datetime"
                placeholder="请选择生产日期"
                value-format="YYYY-MM-DD HH:mm:ss"
                clearable
                :disabled-date="disabledFutureDate"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item v-if="currentTemplate == 'receiptOrderTemplate2'" label="实际完工" prop="actualEndTime">
              <el-date-picker
                v-model="workOrderInfo.actualEndTime"
                type="datetime"
                placeholder="请选择生产日期"
                value-format="YYYY-MM-DD HH:mm:ss"
                clearable
                :disabled-date="disabledFutureDate"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item v-if="currentTemplate == 'receiptOrderTemplate'" label="备注:10*6+1*3(10整箱*6PCS 1尾箱*3PCS)" prop="remark">
              <el-input v-model="workOrderInfo.remark" placeholder="请输入备注信息" />
            </el-form-item>

            <!--            <el-form-item label="操作员">
              <el-input v-model="workOrderInfo.operator" placeholder="请输入操作员" />
            </el-form-item>
            <el-form-item label="检验员">
              <el-input v-model="workOrderInfo.inspector" placeholder="请输入检验员" />
            </el-form-item>-->
          </el-form>
        </div>

        <div class="action-buttons">
          <el-button type="primary" @click="immediatelyPrint" class="print-btn">
            <el-icon><Printer /></el-icon>
            测试打印
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
            <h3>打印预览</h3>
            <div class="preview-controls">
              <div>纸张大小</div>
              <el-select v-model="paperSize" class="paper-size-select" @change="handlePaperSizeChange">
                <el-option v-for="size in printTemplates" :key="size.value" :label="size.label" :value="size.value" />
              </el-select>
              <div>打印张数</div>
              <el-input-number v-model="copies" :min="1" :max="9999" label="打印份数" class="copies-input" />
            </div>
          </div>

          <div class="preview-content">
            <!-- 生产入库单模板97*84 -->
            <div v-if="currentTemplate === 'receiptOrderTemplate'" :class="['production-receipt', getPaperSizeClass()]" ref="printContent">
              <div class="receipt-header">
                <div class="company-name-container">
                  <!-- <span class="company-name">{{ workOrderInfo.companyName }}</span>-->
                  <span class="company-name">半成品、成品入库单</span>
                </div>
              </div>
              <hr class="top-hr" />
              <div class="receipt-body">
                <div class="content-section">
                  <!-- 工单号码占一行 -->
                  <div class="info-row full-row">
                    <label>工单号码</label>
                    <span class="work-order-content">
                      <span>{{ workOrderInfo.workOrderNo }}</span>
                      <span class="version-text">V{{ workOrderInfo.version }}</span>
                    </span>
                  </div>
                  <!-- 产品品号占一行 -->
                  <div class="info-row full-row">
                    <label>产品品号</label>
                    <span>{{ workOrderInfo.material }}</span>
                  </div>
                  <div class="info-row product-description">
                    <label>产品描述</label>
                    <span>{{ workOrderInfo.materialDesc }}</span>
                  </div>
                  <!-- 其他字段与二维码同行 -->
                  <div class="info-with-qr">
                    <div class="info-column">
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
                        <p>{{ workOrderInfo.sfcContent }}</p>
                      </div>
                      <canvas ref="qrcodeCanvas"></canvas>
                    </div>
                  </div>
                </div>
              </div>
              <hr class="bottom-hr" />
            </div>

            <!-- 生产入库单模板97*84-2 -->
            <div v-if="currentTemplate === 'receiptOrderTemplate2'" :class="['size9784-2']" ref="printContent">
              <div class="receipt-header">
                <div class="company-name-container">
                  <!-- <span class="company-name">{{ workOrderInfo.companyName }}</span>-->
                  <span class="company-name">半成品、成品入库单</span>
                  <span>第{{ workOrderInfo.sequence || 1 }}张/共{{ workOrderInfo.printTotal || 1 }}张</span>
                </div>
              </div>
              <hr class="top-hr" />
              <div class="receipt-body">
                <div class="content-section">
                  <!-- 工单号码 -->
                  <div class="info-row">
                    <label>工单号码</label>
                    <span class="work-order-content">
                      <span class="work-order-main">
                        <span class="work-order-no">{{ workOrderInfo.workOrderNo }}</span>
                        <span class="sfc-content">{{ workOrderInfo.sfcContent }}</span>
                      </span>
                      <span class="version-text">V{{ workOrderInfo.version }}</span>
                    </span>
                  </div>
                  <div class="info-with-qr">
                    <div class="info-column">
                      <!-- 客户订单-->
                      <div class="info-row">
                        <label>客户订单</label>
                        <span>{{ workOrderInfo.salesOrderNo }}</span>
                      </div>
                      <!-- 订单交货日期-->
                      <div class="info-row">
                        <label>交&nbsp;货&nbsp;日</label>
                        <span>{{ parseTime(workOrderInfo.soDeliveryDate, '{y}-{m}-{d}') }}</span>
                      </div>
                      <!-- 工单数量-->
                      <div class="info-row">
                        <label>工单数量</label>
                        <span>{{ Number(workOrderInfo.plannedQty) }}&nbsp;{{ workOrderInfo.unit }}</span>
                      </div>
                      <!-- 产品品号 -->
                      <div class="info-row">
                        <label>产品品号</label>
                        <span>{{ workOrderInfo.material }}</span>
                      </div>
                    </div>
                    <div class="info-column">
                      <div class="qr-section horizontal-qr">
                        <div class="qr-content-wrapper">
                          <canvas ref="qrcodeCanvas" v-if="workOrderInfo.sfcContent"></canvas>
                          <div v-else style="width: 80px"></div>
                        </div>
                        <!-- 本卡数量等信息 -->
                        <div class="qr-info border-qty">
                          <div style="display: flex; flex-direction: column; justify-content: center; height: 100%">
                            <p style="margin: 0; padding: 0">本卡数量</p>
                            <p style="margin: 20px 0 0 0; padding: 0">{{ workOrderInfo.qty }} {{ workOrderInfo.unit }}</p>
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
                  <!-- 产能信息 -->
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
                  <!-- 制程信息 -->
                  <div class="info-with-qr">
                    <div class="info-column">
                      <div class="info-row">
                        <label style="font-size: 12px">前一制程</label>
                        <span>{{ formatPreviousOrderNo(workOrderInfo.previousOrderNo) }} {{ workOrderInfo.previousWorkCenter }}</span>
                      </div>
                      <div class="info-row">
                        <label style="font-size: 12px">下一制程</label>
                        <span>{{ formatPreviousOrderNo(workOrderInfo.nextOrderNo) }} {{ workOrderInfo.nextWorkCenter }}</span>
                      </div>
                    </div>
                    <div class="info-column">
                      <div class="info-row">
                        <label style="font-size: 12px">完工时间</label>
                        <span>{{ workOrderInfo.previousEndDate }}</span>
                      </div>
                      <div class="info-row">
                        <label style="font-size: 12px">预计开工</label>
                        <span>{{ parseTime(workOrderInfo.nextPlannedStartDate) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <hr class="bottom-hr" />
              <!-- 卡片底部内容 -->
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
            <div v-if="currentTemplate === 'receiptOrderTemplate3'" :class="['size9784-3']" ref="printContent">
              <div class="receipt-header">
                <div class="company-name-container">
                  <!-- <span class="company-name">{{ workOrderInfo.companyName }}</span>-->
                  <span class="company-name">半成品、成品入库单</span>
                </div>
              </div>
              <hr class="top-hr" />
              <div class="receipt-body">
                <div class="content-section">
                  <!-- 工单号码占一行 -->
                  <div class="info-row full-row">
                    <label>工单号码</label>
                    <span class="work-order-content">
                      <span>{{ workOrderInfo.workOrderNo }}</span>
                      <span class="version-text">V{{ workOrderInfo.version }}</span>
                    </span>
                  </div>
                  <!-- 客户订单-->
                  <div class="info-row">
                    <label>客户订单</label>
                    <span>{{ workOrderInfo.salesOrderNo }}</span>
                  </div>
                  <!-- 订单交货日期-->
                  <div class="info-row">
                    <label>交&nbsp;货&nbsp;日</label>
                    <span>{{ parseTime(workOrderInfo.soDeliveryDate, '{y}-{m}-{d}') }}</span>
                  </div>
                  <!-- 产品品号占一行 -->
                  <div class="info-row full-row">
                    <label>产品品号</label>
                    <span>{{ workOrderInfo.material }}</span>
                  </div>
                  <div class="info-row product-description">
                    <label>产品描述</label>
                    <span>{{ workOrderInfo.materialDesc }}</span>
                  </div>
                  <!-- 其他字段与二维码同行 -->
                  <div class="info-with-qr">
                    <div class="info-column">
                      <!-- 工单数量-->
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
                      <canvas ref="qrcodeCanvas" v-if="workOrderInfo.sfcContent"></canvas>
                      <div v-else style="width: 80px"></div>
                    </div>
                  </div>
                  <hr class="split-line" />

                  <!-- 制程信息 -->
                  <div class="info-with-qr">
                    <div class="info-column">
                      <div class="info-row">
                        <label style="font-size: 12px">下一制程</label>
                        <span style="font-size: 12px">{{ formatPreviousOrderNo(workOrderInfo.nextOrderNo) }} {{ workOrderInfo.nextWorkCenter }}</span>
                      </div>
                    </div>
                    <div class="info-column">
                      <div class="info-row">
                        <label style="font-size: 12px">预计开工</label>
                        <span style="font-size: 12px">{{ parseTime(workOrderInfo.nextPlannedStartDate) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <hr class="bottom-hr" />
              <!-- 卡片底部内容 -->
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

            <!-- 工业二维码(80×60mm)模板 -->
            <div v-else-if="currentTemplate === 'qr8060'" class="qr-template qr8060" ref="printContent">
              <div class="qr-container">
                <canvas ref="qrCanvas8060"></canvas>
                <div class="qr-info">
                  <p>{{ workOrderInfo.workOrderNo }}</p>
                  <p>{{ workOrderInfo.material }}</p>
                  <p>{{ workOrderInfo.qty }} {{ workOrderInfo.unit }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <!--            <el-button type="primary" @click="generateSerialNumber" :icon="Printer">演示效果图</el-button>-->
            <!--            <el-button type="primary" @click="generateSerialNumbers" :icon="Printer">查询工单已下达条码</el-button>-->
            <el-button v-hasPermi="['wms:workOrderSn:add']" @click="handlePrint" color="#626aef" :icon="Printer">下达打印</el-button>
            <!--            <el-button type="primary" @click="handlePrintCurrent" :icon="Printer">立即打印</el-button>-->
            <el-button @click="handleExportImage" :icon="Picture">导出图片</el-button>

            <!--            <el-button @click="handleExportExcel" :icon="Document" v-if="printType === 'excel'">导出Excel</el-button>-->
          </div>
        </div>
      </el-main>
    </el-container>
    <!-- 工单选择对话框 -->
    <work-order-dialog ref="workOrderDialogRef" @workOrderCallBack="workOrderCallBack" />
  </div>
</template>

<script setup lang="ts" name="print">
import { nextTick, onMounted, ref, watch } from 'vue';
import { Picture, Printer } from '@element-plus/icons-vue';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { ElMessage } from 'element-plus';
import { generateWorkOrderSn } from '@/api/wms/workOrderSn';
import { listWorkOrder } from '@/api/wms/workOrder';
import { WorkOrderSnForm, WorkOrderSnQuery } from '@/api/wms/workOrderSn/types';
import { getUserProfile } from '@/api/system/user';
import { parseTime } from '@/utils/ruoyi';
import WorkOrderDialog from '@/views/wms/print/components/workOrderDialog.vue';

const workOrderDialogRef = ref<InstanceType<typeof WorkOrderDialog>>();
const queryFormRef = ref<ElFormInstance>();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_company_name } = toRefs<any>(proxy?.useDict('wms_company_name'));

const initFormData: WorkOrderSnForm = {
  id: undefined,
  workOrderNo: undefined,
  sn: undefined,
  qty: undefined,
  remark: undefined
};
const data = reactive<PageData<WorkOrderSnForm, WorkOrderSnQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    workOrderNo: undefined,
    sn: undefined,
    qty: undefined,
    params: {}
  },
  rules: {
    workOrderNo: [{ required: true, message: '工单号不能为空', trigger: 'blur' }],
    qty: [{ required: true, message: '入库数量不能为空', trigger: 'blur' }],
    productDate: [{ required: true, message: '生产日期不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);
const activeTab = ref('content');
const currentTemplate = ref('receiptOrderTemplate3'); // 默认选中生产入库单模板
const selectedExcelTemplate = ref('qrExcel');

const paperSize = ref('9784'); // 默认纸张大小设置为97×84mm
// 打印份数
const copies = ref(1);
// 添加序列号列表状态
const serialNumbers = ref<string[]>([]);
const isBatchPrinting = ref(false);
const printTemplates = ref([
  // { value: 'A4', label: 'A4 (210×297mm)' },
  // { value: 'A5', label: 'A5 (148×210mm)' },
  // { value: '3040', label: '30×40mm' },
  // { value: '5060', label: '50×60mm' },
  // { value: '8060', label: '80×60mm' },
  { value: '9784', label: '97×84mm' }
]);

// 工单信息
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
  remark: ''
});

/** 查询工单信息列表 */
const workOrderInputRef = ref<HTMLInputElement | null>(null);
const qtyInputRef = ref<HTMLInputElement | null>(null);
const keyDownTab = async () => {
  workOrderInfo.value.workOrderNo = workOrderInfo.value.workOrderNo.trim();
  await nextTick(() => {
    if (workOrderInputRef.value) {
      workOrderInputRef.value.focus();
      workOrderInputRef.value.select();
    }
  });
  const res = await listWorkOrder({
    pageNum: 1,
    pageSize: 10,
    workOrderNo: workOrderInfo.value.workOrderNo
  });

  if ((res.rows || []).length == 1) {
    const workOrderNoInfo = res.rows[0] || { workOrderNo: '', item: '', itemDesc: '', productLine: '' };
    workOrderInfo.value = { ...workOrderInfo.value, ...workOrderNoInfo };
    workOrderInfo.value.material = workOrderNoInfo.item;
    workOrderInfo.value.materialDesc = workOrderNoInfo.itemDesc;
    workOrderInfo.value.productLine = workOrderNoInfo.productLine;
    workOrderInfo.value.plannedQty = Number(workOrderNoInfo.plannedQty);
    workOrderInfo.value.unit = workOrderNoInfo.unit;
    workOrderInfo.value.previousOrderNo = workOrderNoInfo.previousOrderNo;
    workOrderInfo.value.previousWorkCenter = workOrderNoInfo.previousWorkCenter;
    workOrderInfo.value.nextOrderNo = workOrderNoInfo.nextOrderNo;
    workOrderInfo.value.nextWorkCenter = workOrderNoInfo.nextWorkCenter;
    workOrderInfo.value.nextPlannedStartDate = workOrderNoInfo.nextPlannedStartDate;
    nextTick(() => {
      qtyInputRef.value?.focus();
    });
  } else if ((res.rows || []).length == 0) {
    proxy?.$modal.msgError('工单记录不存在');
  } else if ((res.rows || []).length > 1) {
    proxy?.$modal.msgError('工单记录存在多条');
  }
};

// 显示工单选择对话框
const showWorkOrderDialog = () => {
  workOrderDialogRef.value.openDialog();
};

const workOrderCallBack = (workOrderNoInfo: any) => {
  workOrderInfo.value = { ...workOrderInfo.value, ...workOrderNoInfo };
  workOrderInfo.value.workOrderNo = workOrderNoInfo.workOrderNo;
  workOrderInfo.value.material = workOrderNoInfo.item;
  workOrderInfo.value.materialDesc = workOrderNoInfo.itemDesc;
  workOrderInfo.value.productLine = workOrderNoInfo.productLine;
  workOrderInfo.value.unit = workOrderNoInfo.unit;
  workOrderInfo.value.plannedQty = Number(workOrderNoInfo.plannedQty);
  workOrderInfo.value.previousOrderNo = workOrderNoInfo.previousOrderNo;
  workOrderInfo.value.previousWorkCenter = workOrderNoInfo.previousWorkCenter;
  workOrderInfo.value.nextOrderNo = workOrderNoInfo.nextOrderNo;
  workOrderInfo.value.nextWorkCenter = workOrderNoInfo.nextWorkCenter;
  workOrderInfo.value.nextPlannedStartDate = workOrderNoInfo.nextPlannedStartDate;
  workOrderInfo.value.remark = '';
};

// 格式化前一工序单号，如果前三位是"000"则去掉
const formatPreviousOrderNo = (orderNo) => {
  if (orderNo && orderNo.length >= 3 && orderNo.substring(0, 3) === '000') {
    return orderNo.substring(3);
  }
  return orderNo;
};

// 禁用未来的时间
const disabledFutureDate = (time: Date) => {
  // 获取当前时间，并将毫秒设为0以确保精确到秒
  const now = new Date();
  // 加上指定秒数（默认3秒）
  now.setSeconds(now.getSeconds() + 3);
  now.setMilliseconds(0);

  // 禁止选择当前时间之后的日期
  return time.getTime() > now.getTime();
};
// DOM引用
const qrcodeCanvas = ref(null);
const qrCanvas5060 = ref(null);
const qrCanvas8060 = ref(null);
const printContent = ref(null);

// 根据选择的纸张大小返回对应的CSS类名
const getPaperSizeClass = () => {
  switch (paperSize.value) {
    case '9784':
      return 'size9784';
    case '5060':
      return 'size5060';
    case '3040':
      return 'size3040';
    case '8060':
      return 'size8060';
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
  const content = workOrderInfo.value.sfcContent;
  if (!content) return;
  if (qrcodeCanvas.value) {
    // 根据纸张大小调整二维码尺寸
    let qrSize = 120;
    if (paperSize.value === '5060') qrSize = 150;
    if (paperSize.value === '8060') qrSize = 180;
    if (paperSize.value === '9784') qrSize = 80;
    if (paperSize.value === '9784-2') qrSize = 80;
    if (paperSize.value === '9784-3') qrSize = 80;
    if (currentTemplate.value === 'receiptOrderTemplate' && paperSize.value === '9784') qrSize = 100;

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
// 生成序列号列表
const generateSerialNumbers = async () => {
  const res: any = await generateWorkOrderSn({
    companyName: workOrderInfo.value.companyName,
    productLine: workOrderInfo.value.productLine,
    productDate: workOrderInfo.value.productDate + ' 00:00:00',
    workOrderNo: workOrderInfo.value.workOrderNo,
    qty: workOrderInfo.value.qty,
    continuousQty: copies.value,
    remark: workOrderInfo.value.remark
  });
  return res.data || [];
};

const generateSerialNumber = () => {
  workOrderInfo.value.companyName = '溢泰（南京）环保科技有限公司';
  workOrderInfo.value.workOrderNo = '000170000312';
  workOrderInfo.value.sfcContent = 'SCRK-20250801-0001';
  workOrderInfo.value.material = 'A02000600004';
  workOrderInfo.value.materialDesc = 'BSH嵌入式饮水机，博世AV Pro黑色款，型号WBB8060C1C';
  workOrderInfo.value.qty = 1;
  workOrderInfo.value.productDate = '2025-08-01';
  workOrderInfo.value.productLine = 'YS0028-1';
  workOrderInfo.value.version = 1;
};
// 打印当前预览内容
const handlePrintCurrent = async () => {
  if (!printContent.value) return;

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
      // 根据纸张大小设置打印页面尺寸
      let printStyles = '';
      switch (paperSize.value) {
        case '9784-2':
        case '9784-3':
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
            <img src="${canvas.toDataURL('image/png')}" style="width:100%; height:100%;"  alt=""/>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  } catch (error) {
    console.error('打印失败:', error);
  }
};
const immediatelyPrint = async () => {
  if (!printContent.value) return;
  queryFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      try {
        // 生成序列号列表
        const snList = [workOrderInfo.value.sfcContent];

        let printContentHTML = '';

        // 为每个序列号生成一个打印页面
        for (let i = 0; i < snList.length; i++) {
          // 临时更新二维码内容
          // const originalSfcContent = workOrderInfo.value.sfcContent;
          workOrderInfo.value.sfcContent = snList[i];

          // 重新生成二维码
          await nextTick();
          generateQRCode();
          await nextTick(); // 确保二维码渲染完成

          // 生成截图
          const canvas = await html2canvas(printContent.value, {
            scale: 2,
            logging: false,
            useCORS: true,
            scrollX: 0,
            scrollY: 0
          });

          printContentHTML += `        <div style="page-break-after: ${i < snList.length - 1 ? 'always' : 'auto'};"><img src="${canvas.toDataURL('image/png')}" style="width:100%; height:100%;" /></div>`;

          // 恢复原始内容
          // workOrderInfo.value.sfcContent = originalSfcContent;
        }

        // 重新生成原始二维码
        await nextTick();
        generateQRCode();

        const printWindow = window.open('', '_blank');
        if (printWindow) {
          // 根据纸张大小设置打印页面尺寸
          let printStyles = '';
          switch (paperSize.value) {
            case '9784-2':
            case '9784-3':
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
            <title>批量打印预览</title>
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
      }
    }
  });
};
// 打印处理支持连续打印不同二维码
const handlePrint = async () => {
  if (!printContent.value) return;
  queryFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      try {
        // 生成序列号列表
        const snList = await generateSerialNumbers();

        let printContentHTML = '';

        // 为每个序列号生成一个打印页面
        for (let i = 0; i < snList.length; i++) {
          // 临时更新二维码内容
          // const originalSfcContent = workOrderInfo.value.sfcContent;
          workOrderInfo.value.sfcContent = snList[i].sn;
          workOrderInfo.value.sequence = snList[i].sequence;
          workOrderInfo.value.printTotal = snList[i].printTotal;

          // 重新生成二维码
          await nextTick();
          generateQRCode();
          await nextTick(); // 确保二维码渲染完成

          // 生成截图
          const canvas = await html2canvas(printContent.value, {
            scale: 2,
            logging: false,
            useCORS: true,
            scrollX: 0,
            scrollY: 0
          });

          printContentHTML += `<div style="page-break-after: ${i < snList.length - 1 ? 'always' : 'auto'};"><img src="${canvas.toDataURL('image/png')}" style="width:100%; height:100%;" /></div>`;

          // 恢复原始内容
          // workOrderInfo.value.sfcContent = originalSfcContent;
        }

        // 重新生成原始二维码
        await nextTick();
        generateQRCode();

        const printWindow = window.open('', '_blank');
        if (printWindow) {
          // 根据纸张大小设置打印页面尺寸
          let printStyles = '';
          switch (paperSize.value) {
            case '9784-2':
            case '9784-3':
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
                <title>批量打印预览</title>
                <style>
                  ${printStyles}              @media print {
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
                ${printContentHTML}          </body>
            </html>
      `);
          printWindow.document.close();
        }
      } catch (error) {
        console.error('打印失败:', error);
      }
    }
  });
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
const getUser = async () => {
  const res = await getUserProfile();
  workOrderInfo.value.operator = res.data.user.nickName;
};
// 初始化
onMounted(() => {
  workOrderInfo.value.productDate = parseTime(new Date(), '{y}-{m}-{d}');
  workOrderInfo.value.makeDate = parseTime(new Date(), '{y}-{m}-{d}');
  getUser();
  generateQRCode();
  const tenantId = localStorage.getItem('tenantId');
  if (tenantId === '000001') {
    workOrderInfo.value.companyName = '亿泰精密工业（南京）有限公司';
  }
});
</script>

<style scoped>
.print-container {
  height: calc(100vh - 200px);
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
  /* 添加以下样式使内容居中 */
  justify-content: center;
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
.size9784-2 {
  width: 97mm;
  height: 84mm;
  font-size: 13px;
}

.size9784-3 {
  width: 97mm;
  height: 84mm;
  font-size: 13px;
}

/* 适配97×84mm尺寸的内容样式 */
.size9784 {
  .receipt-header {
    margin: 0 3mm;
  }

  .receipt-body {
    margin: 0 3mm;
  }

  .company-name {
    font-size: 18px;
    font-weight: bold;
  }

  .info-row label {
    font-size: 13px;
    margin-right: 1mm;
  }

  .info-row span {
    font-size: 13px;
    line-height: 1.5;
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
    margin: 0 3mm;
  }

  .content-section {
    flex: 3;
  }

  /* 调整二维码和工单号的整体布局 */
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
}

.info-with-qr {
  display: flex;
  flex-direction: row;
}

.info-column {
  flex: 2;
}

.work-order-content {
  flex: 1;
  position: relative;
  font-size: 12px;
}

.info-row {
  display: flex;
  margin-bottom: 5px;
  label {
    width: 18mm;
    font-weight: bold;
    flex-shrink: 0;
    font-size: 12px;
    margin-right: 1mm;
  }

  span {
    flex: 1;
    word-break: break-all;
    font-size: 12px;
    line-height: 1.4;
  }

  .full-row {
    display: flex;
    align-items: center;
    position: relative;
  }

  .full-row label {
    width: auto;
    display: inline-block;
    margin-right: 20px;
    flex-shrink: 0;
  }

  .full-row span {
    display: inline-block;
  }
}

/* 横线样式 */
.top-hr,
.bottom-hr {
  margin: 5px 0;
  border: none;
  height: 2px;
  background-color: #000;
  width: calc(100% - 6mm);
}

.version-text {
  position: absolute;
  right: 0;
  font-weight: bold;
  white-space: nowrap;
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

/* 适配97×84-2尺寸的内容样式 */
.size9784-2 {
  width: 97mm;
  height: 84mm;
  font-size: 13px;
  padding: 10px 5px;
  /* 添加以下属性来确保内容不会超出容器 */
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
    max-width: 100%;
    max-height: 100%;
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
    gap: 10px;
  }

  .work-order-no {
    font-weight: normal;
    flex: 1;
  }

  .sfc-content {
    font-weight: normal;
    flex: 2;
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

/* 适配97×84-3尺寸的内容样式 */
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
    margin: 4px 3mm 4px 3mm;
    height: 2px;
  }

  .receipt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
  }

  /* 公司名称容器 */
  .company-name-container {
    text-align: center;
    width: 100%;
  }

  .company-name {
    font-size: 14px;
    font-weight: bold;
    display: block;
  }

  /* 调整二维码和工单号的整体布局 */
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
  .qr-section canvas {
    max-width: 100%;
    max-height: 100%;
  }
  .split-line {
    margin: 5px 0;
    border: none;
    height: 1px;
    background-color: #000;
    width: 100%;
  }
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
