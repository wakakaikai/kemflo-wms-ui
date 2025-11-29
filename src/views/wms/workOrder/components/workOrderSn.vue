<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="条码" prop="sn">
              <el-input v-model="queryParams.sn" placeholder="请输入条码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="生产线别" prop="productLine">
              <el-input v-model="queryParams.productLine" placeholder="请输入生产线别" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="生产日期" prop="productDate">
              <el-date-picker clearable v-model="queryParams.productDate" type="date" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择生产日期" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <!--          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:workOrderSn:add']">新增</el-button>
          </el-col>-->
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:workOrderSn:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:workOrderSn:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:workOrderSn:export']">导出</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:workOrderSn:print']" color="#626aef" plain icon="Printer" @click="handlePrintDialog" :disabled="multiple">补打印</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="workOrderSnList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="公司名称" align="center" prop="companyName" />
        <el-table-column label="栈板号" align="center" prop="palletCode" />
        <el-table-column label="打包号" align="center" prop="packingCode" />
        <el-table-column label="工单号" align="center" prop="workOrderNo" />
        <el-table-column label="标签码" align="center" prop="sn" />
        <el-table-column label="版本" align="center" prop="version">
          <template #default="scope">
            <el-tag v-if="scope.row.version" type="success">V{{ scope.row.version }}</el-tag>
            <el-tag v-else>--</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数量" align="center" prop="qty" />
        <el-table-column label="产品品号" align="center" prop="item" />
        <el-table-column label="产品描述" align="center" prop="itemDesc" />
        <el-table-column label="生产线别" align="center" prop="productLine" />
        <el-table-column label="生产日期" align="center" prop="productDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.productDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:workOrderSn:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:workOrderSn:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 添加或修改工单条码对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="workOrderSnFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="公司名称" prop="companyName">
          <span>{{ form.companyName }}</span>
        </el-form-item>
        <el-form-item label="工单号" prop="workOrderNo">
          <span>{{ form.workOrderNo }}</span>
        </el-form-item>
        <el-form-item label="标签码" prop="sn">
          <span>{{ form.sn }}</span>
        </el-form-item>
        <el-form-item label="数量" prop="qty">
          <el-input-number v-model="form.qty" :precision="3" :max="form.plannedQty" placeholder="请输入数量" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <span>10*6+1*3(10整箱*6PCS 1尾箱*3PCS)</span>
          <el-input v-model="form.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 补打印确认对话框 -->
    <el-dialog title="补打印设置" v-model="printDialogVisible" width="600px" append-to-body>
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
                  <span class="company-name">{{ workOrderInfo.companyName }}</span>
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
                  <span class="company-name">{{ workOrderInfo.companyName }}</span>
                  <!--                  <span>第{{ workOrderInfo.printPageNum }}张/共{{ workOrderInfo.printTotal }}张</span>-->
                  <span>第1张/共1张</span>
                </div>
              </div>
              <hr class="top-hr" />
              <div class="receipt-body">
                <div class="content-section">
                  <!-- 工单号码占一行 -->
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
                      <!-- 客户订单-->
                      <div class="info-row">
                        <label>客户订单</label>
                        <span class="work-order-content">
                          <span>{{ workOrderInfo.salesOrderNo }}</span>
                        </span>
                      </div>
                      <!-- 订单交货日期-->
                      <div class="info-row">
                        <label>交&nbsp;货&nbsp;日</label>
                        <span class="work-order-content">
                          <span>{{ parseTime(workOrderInfo.soDeliveryDate, '{y}-{m}-{d}') }}</span>
                        </span>
                      </div>
                      <!-- 工单数量-->
                      <div class="info-row">
                        <label>工单数量</label>
                        <span class="work-order-content">
                          <span>{{ Number(workOrderInfo.plannedQty) }}&nbsp;{{ workOrderInfo.unit }}</span>
                        </span>
                      </div>
                      <!-- 产品品号 -->
                      <div class="info-row">
                        <label>产品品号</label>
                        <span>{{ workOrderInfo.material }}</span>
                      </div>
                    </div>
                    <div class="info-column">
                      <div class="qr-section horizontal-qr">
                        <canvas ref="previewQrCodeCanvas97842" v-if="workOrderInfo.sn" />
                        <div v-else style="width: 80px"></div>
                        <!-- 本卡数量等信息 -->
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
                        <span>{{ parseTime(workOrderInfo.plannedStartDate, '{y}-{m}-{d}') }}</span>
                      </div>
                      <div class="info-row">
                        <label>预计完工</label>
                        <span>{{ parseTime(workOrderInfo.plannedEndDate, '{y}-{m}-{d}') }}</span>
                      </div>
                    </div>
                    <div class="info-column">
                      <div class="info-row">
                        <label>标准产能</label>
                        <span style="display: inline-flex; gap: 10px">
                          <span>{{ workOrderInfo.standardCapacity ? Number(workOrderInfo.standardCapacity) : '    ' }}PCS/H</span>
                          <span>{{ workOrderInfo.standardPersonNumber ? Number(workOrderInfo.standardPersonNumber) : '    ' }}人</span>
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
                        <span>{{ parseTime(workOrderInfo.nextPlannedStartDate, '{y}-{m}-{d}') }}</span>
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
          <el-button @click="printDialogVisible = false">取 消</el-button>
          <el-button :loading="printLoading" type="primary" @click="handleBatchPrint">确定打印</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="WorkOrderSn" lang="ts">
import { listWorkOrderSn, getWorkOrderSn, delWorkOrderSn, addWorkOrderSn, updateWorkOrderSn } from '@/api/wms/workOrderSn';
import { WorkOrderSnVO, WorkOrderSnQuery, WorkOrderSnForm } from '@/api/wms/workOrderSn/types';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { nextTick, ref } from 'vue';
import { getUserProfile } from '@/api/system/user';
import { parseTime } from '@/utils/ruoyi';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_company_name } = toRefs<any>(proxy?.useDict('wms_company_name'));

const workOrderSnList = ref<WorkOrderSnVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const workOrderSnFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const props = defineProps({
  workOrderNo: {
    type: String,
    required: true
  }
});

// 打印相关引用
const printDialogVisible = ref(false);
const printLoading = ref(false);
const selectedRecords = ref<WorkOrderSnVO[]>([]);
const currentTemplate = ref('receiptOrderTemplate');
const operator = ref('');

const previewQrCodeCanvas = ref<HTMLCanvasElement | null>(null);
const previewQrCodeCanvas9784 = ref<HTMLCanvasElement | null>(null);
const previewQrCodeCanvas97842 = ref<HTMLCanvasElement | null>(null);
const previewQrCodeCanvas8060 = ref<HTMLCanvasElement | null>(null);
const previewQrCodeCanvas5060 = ref<HTMLCanvasElement | null>(null);
const previewQrCodeCanvas3040 = ref<HTMLCanvasElement | null>(null);
const printPreviewContent = ref<HTMLElement | null>(null);

// 预览用的记录数据
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
  standardCapacity: '',
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
});

// 打印模板选项 - 启用所有模板选项
const printTemplates = ref([
  { value: 'receiptOrderTemplate', label: '生产入库单模板(97×84mm)' },
  { value: 'receiptOrderTemplate2', label: '生产入库单模板(97×84mm)' }
]);

const initFormData: WorkOrderSnForm = {
  id: undefined,
  companyName: undefined,
  workOrderNo: undefined,
  sn: undefined,
  qty: undefined,
  sequence: undefined,
  productLine: undefined,
  productDate: undefined,
  status: undefined,
  remark: undefined
};
const data = reactive<PageData<WorkOrderSnForm, WorkOrderSnQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    companyName: undefined,
    workOrderNo: undefined,
    sn: undefined,
    qty: undefined,
    sequence: undefined,
    productLine: undefined,
    productDate: undefined,
    status: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    qty: [{ required: true, message: '数量不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);
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
const formattedQty = (qty: number | string | null | undefined): string => {
  if (qty === null || qty === undefined || qty === '') {
    return '';
  }

  const num = Number(qty);
  if (isNaN(num)) {
    return '';
  }

  // 使用 Intl.NumberFormat 来格式化数字
  // 自动去除末尾无用的0
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3 // 根据需要调整最大小数位数
  }).format(num);
};
/** 查询工单条码列表 */
const getList = async () => {
  loading.value = true;
  queryParams.value.workOrderNo = props.workOrderNo;
  const res = await listWorkOrderSn(queryParams.value);
  workOrderSnList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  workOrderSnFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: WorkOrderSnVO[]) => {
  ids.value = selection.map((item) => item.id);
  selectedRecords.value = selection;
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加工单条码';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: WorkOrderSnVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getWorkOrderSn(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工单条码';
};

/** 提交按钮 */
const submitForm = () => {
  workOrderSnFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateWorkOrderSn(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addWorkOrderSn(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: WorkOrderSnVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工单条码编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delWorkOrderSn(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/workOrderSn/export',
    {
      ...queryParams.value
    },
    `workOrderSn_${new Date().getTime()}.xlsx`
  );
};

// 显示打印对话框
const handlePrintDialog = () => {
  if (selectedRecords.value.length === 0) {
    proxy?.$modal.msgWarning('请至少选择一条记录进行打印');
    return;
  }
  printDialogVisible.value = true;
  // 使用第一条记录作为预览数据
  const record = selectedRecords.value[0];
  workOrderInfo.value = { ...record.wmsWorkOrderVo, ...record };
  workOrderInfo.value.sn = record.sn;
  workOrderInfo.value.sfcContent = record.sn;
  workOrderInfo.value.material = record.item;
  workOrderInfo.value.materialDesc = record.itemDesc;
  workOrderInfo.value.productDate = record.productDate ? proxy?.parseTime(record.productDate, '{y}-{m}-{d}') : '';
  workOrderInfo.value.operator = operator.value;

  nextTick(() => {
    generatePreviewQRCode();
  });
};


// 模板切换处理
const handleTemplateChange = () => {
  nextTick(() => {
    generatePreviewQRCode();
  });
};
// 根据选择的模板返回对应的CSS类名
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
    default:
      return 'size9784';
  }
};

// 根据模板获取纸张尺寸样式
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

// 生成预览二维码
const generatePreviewQRCode = () => {
  if (selectedRecords.value.length === 0) return;

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

// 执行批量打印操作
const handleBatchPrint = async () => {
  if (selectedRecords.value.length === 0) {
    proxy?.$modal.msgWarning('没有可打印的记录');
    return;
  }

  printLoading.value = true;
  try {
    let printContentHTML = '';
    // 为每个序列号生成一个打印页面
    for (let i = 0; i < selectedRecords.value.length; i++) {
      const record = selectedRecords.value[i];

      // 构建当前记录的打印数据
      workOrderInfo.value = {
        companyName: record.companyName || '溢泰（南京）环保科技有限公司',
        workOrderNo: record.workOrderNo || '',
        material: record.item || '',
        materialDesc: record.itemDesc || '',
        sn: record.sn || '',
        qty: record.qty || 0,
        unit: 'PCS',
        productDate: record.productDate ? proxy?.parseTime(record.productDate, '{y}-{m}-{d}') : '',
        productLine: record.productLine || '',
        operator: workOrderInfo.value.operator || '',
        inspector: '',
        version: record.version || 1,
        remark: record.remark || ''
      };

      // 重新生成二维码
      await nextTick();
      generatePreviewQRCode();
      await nextTick(); // 确保二维码渲染完成

      // 生成截图
      const canvas = await html2canvas(printPreviewContent.value, {
        scale: 2,
        logging: false,
        useCORS: true,
        scrollX: 0,
        scrollY: 0
      });

      printContentHTML += `        <div style="page-break-after: ${i < selectedRecords.value.length - 1 ? 'always' : 'auto'};">
          <img src="${canvas.toDataURL('image/png')}" style="width:100%; height:100%;" />
        </div>
      `;

      // 恢复原始内容
      // workOrderInfo.value.sfcContent = originalSfcContent;
    }

    // 重新生成原始二维码
    await nextTick();
    generatePreviewQRCode();

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // 根据纸张大小设置打印页面尺寸
      printWindow.document.write(`        <html>
          <head>
            <title>批量打印预览</title>
            <style>
              ${getPrintStyles(currentTemplate.value)}              @media print {
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
    proxy?.$modal.msgError('打印失败，请重试');
  } finally {
    printLoading.value = false;
    printDialogVisible.value = false;
  }
};

// 监听选中记录变化，更新预览
watch(selectedRecords, () => {
  if (selectedRecords.value.length > 0) {
    nextTick(() => {
      generatePreviewQRCode();
    });
  }
});
const getUser = async () => {
  const res = await getUserProfile();
  operator.value = res.data.user.nickName;
};

onMounted(() => {
  getUser();
  getList();
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
/* 适配97×84mm尺寸的内容样式 */
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
  /*  width: 22mm;*/
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
  margin-right: 1mm; /* 增加标签与内容的间距 */
}

.info-row span {
  flex: 1;
  word-break: break-all;
  font-size: 12px; /* 增大内容字体 */
  line-height: 1.4; /* 增加行高 */
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

/* 横线样式 */
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

/* 新增样式 */
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

/* 适配97×84-2mm尺寸的内容样式 */
.size9784-2 {
  width: 97mm;
  height: 84mm;
  font-size: 13px;
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
    border: none;
    height: 1px;
    background-color: #000;
    width: 100%;
  }
  .receipt-header {
    margin: 0 1.5mm;
  }

  .receipt-body {
    margin: 0 1.5mm;
  }

  .receipt-bottom {
    margin: 0 1.5mm;
    line-height: 18px;
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
    font-size: 17px; /* 增大公司名称字体 */
    font-weight: bold;
  }
  .info-row {
    line-height: 18px;
  }
  .info-row label {
    width: 13mm; /* 增加标签宽度 */
    text-align-last: justify;
    font-weight: bold;
    flex-shrink: 0;
    font-size: 12px; /* 增大标签字体 */
    margin-right: 1mm; /* 增加标签与内容的间距 */
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
    line-height: 1.5;
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

  .qr-info-column {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .qr-section-placeholder {
    flex: 1;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
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

  .version-text {
    font-weight: bold;
    white-space: nowrap;
    flex-shrink: 0;
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
