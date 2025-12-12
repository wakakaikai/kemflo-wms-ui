<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="产品料号" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入产品料号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="产品描述" prop="itemDesc">
              <el-input v-model="queryParams.itemDesc" placeholder="请输入产品描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="入库检" prop="checkEnable">
              <el-select v-model="queryParams.checkEnable" placeholder="请选择入库检" clearable>
                <el-option v-for="dict in wms_work_order_check_enable" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="计划开工日期" prop="plannedStartDate">
              <el-date-picker v-model="queryParams.plannedStartDate" clearable type="date" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择计划开工日期" />
            </el-form-item>
            <el-form-item label="计划完工日期" prop="plannedEndDate">
              <el-date-picker v-model="queryParams.plannedEndDate" clearable type="date" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择计划完工日期" />
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
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:workOrder:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:workOrder:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:workOrder:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:workOrder:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:workOrder:print']" color="#626aef" plain icon="Printer" @click="handlePrintWorkOrderCard" :disabled="single">打印工单卡</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="workOrderList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="工单号" align="left" prop="workOrderNo" fixed="left" min-width="130">
          <template #default="scope">
            <router-link :to="'/warehouse/workOrder/detail/' + scope.row.workOrderNo" class="link-type">
              <span>{{ scope.row.workOrderNo }}</span>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column label="产品料号" align="left" prop="item" fixed="left" min-width="150" />
        <el-table-column label="产品描述" align="left" prop="itemDesc" show-overflow-tooltip fixed="left" min-width="300" />
        <el-table-column label="入库检" align="center" prop="checkEnable">
          <template #default="scope">
            <dict-tag :options="wms_work_order_check_enable" :value="scope.row.checkEnable" />
          </template>
        </el-table-column>
        <el-table-column label="计划开工日期" align="center" prop="plannedStartDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.plannedStartDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="计划完工日期" align="center" prop="plannedEndDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.plannedEndDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="计划数量" align="center" prop="plannedQty" />
        <el-table-column label="已交货数量" align="center" prop="deliveredQty" min-width="100" />
        <el-table-column label="单位" align="center" prop="unit" />
        <el-table-column label="创建时间" align="center" prop="createTime" />
        <el-table-column label="创建者" align="center" prop="createByName" />
        <el-table-column label="更新时间" align="center" prop="updateTime" />
        <el-table-column label="更新者" align="center" prop="updateByName" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['wms:workOrder:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['wms:workOrder:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <!-- 添加或修改工单信息对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="workOrderFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="工单号" prop="workOrderNo">
          <el-input v-model="form.workOrderNo" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="产品料号" prop="item">
          <el-input v-model="form.item" placeholder="请输入产品料号" />
        </el-form-item>
        <el-form-item label="产品描述" prop="itemDesc">
          <el-input v-model="form.itemDesc" placeholder="请输入产品描述" />
        </el-form-item>
        <el-form-item label="入库检" prop="checkEnable">
          <el-radio-group v-model="form.checkEnable">
            <el-radio v-for="dict in wms_work_order_check_enable" :key="dict.value" :value="parseInt(dict.value)">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="计划开工日期" prop="plannedStartDate">
          <el-date-picker v-model="form.plannedStartDate" clearable type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择计划开工日期"> </el-date-picker>
        </el-form-item>
        <el-form-item label="计划完工日期" prop="plannedEndDate">
          <el-date-picker v-model="form.plannedEndDate" clearable type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择计划完工日期"> </el-date-picker>
        </el-form-item>
        <el-form-item label="计划数量" prop="plannedQty">
          <el-input v-model="form.plannedQty" placeholder="请输入计划数量" />
        </el-form-item>
        <el-form-item label="已交货数量" prop="deliveredQty">
          <el-input v-model="form.deliveredQty" placeholder="请输入已交货数量" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 打印预览对话框 -->
    <el-dialog title="工单卡打印预览" v-model="printDialog.visible" width="800px" append-to-body>
      <!-- 打印模式选择 -->
      <div class="print-mode-selection">
        <el-form label-width="auto">
          <el-form-item label="打印模式">
            <el-select v-model="currentPrintMode" placeholder="请选择打印模式">
              <el-option v-for="mode in printModes" :key="mode.value" :label="mode.label" :value="mode.value" />
            </el-select>
          </el-form-item>
          <!-- 模式D时显示工序选择列表 -->
          <el-form-item label="选择工序" v-if="currentPrintMode === 'mode4'">
            <el-input v-model="selectedProcessInfo" readonly placeholder="请选择工序">
              <template #append>
                <el-button icon="Search" @click="openWorkOrderProcessDialog" />
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </div>
      <div class="print-preview-container">
        <!-- 模板A -->
        <div class="kanban-template kanban-template-1" v-if="currentTemplate === 'kanbanTemplate1'">
          <div class="kanban-card">
            <!-- 标题区域 -->
            <div class="kanban-header">
              <div class="title">生产看板卡</div>
              <div class="qr-code-container">
                <canvas ref="qrcodeCanvas" v-if="workOrderInfo.workOrderNo"></canvas>
              </div>
              <div class="info-container">
                <div class="date-info">制表日期 {{ workOrderInfo.makeDate }}</div>
                <div class="page-info">第 {{ workOrderInfo.page || 1 }} 张 / 共 {{ workOrderInfo.totalPages || 1 }} 张</div>
              </div>
            </div>

            <!-- 主要信息区域 -->
            <div class="kanban-body">
              <div class="info-row-multiple-column">
                <div class="info-column">
                  <label>工单号码</label>
                  <span>{{ workOrderInfo.workOrderNo }}</span>
                </div>
                <div class="info-column">
                  <label>客户订单</label>
                  <span>{{ workOrderInfo.salesOrderNo }}</span>
                </div>
              </div>

              <div class="info-row-multiple-column">
                <div class="info-column">
                  <label>工单数量</label>
                  <span>{{ Number(workOrderInfo.plannedQty) }}&nbsp;{{ workOrderInfo.unit }}</span>
                </div>
                <div class="info-column">
                  <label>交货日期</label>
                  <span>{{ parseTime(workOrderInfo.soDeliveryDate, '{y}-{m}-{d}') }}</span>
                </div>
              </div>

              <div class="info-row-multiple-column">
                <div class="info-column">
                  <label>产品品号</label>
                  <span>{{ workOrderInfo.item }}</span>
                </div>
                <div class="info-column">
                  <label>看板数量</label>
                  <span>{{ workOrderInfo.plannedQty }}</span>
                </div>
              </div>

              <div class="info-row">
                <label class="label">产品描述</label>
                <span class="value">{{ workOrderInfo.itemDesc }}</span>
              </div>

              <div class="split-line"></div>

              <div class="info-row-multiple-column" :class="{ 'mode4-small-font': currentPrintMode === 'mode4' }">
                <div class="info-column">
                  <label v-if="currentPrintMode == 'mode4'">前制程</label>
                  <label v-else>前一制程</label>
                  <span>{{ formatPreviousOrderNo(workOrderInfo.previousOrderNo) }} {{ workOrderInfo.previousWorkCenter }}</span>
                </div>
                <div class="info-column">
                  <label>完工时间</label>
                  <span>{{ workOrderInfo.previousEndDate }}</span>
                </div>
              </div>

              <div class="info-row-multiple-column" :class="{ 'mode4-small-font': currentPrintMode === 'mode4' }">
                <div class="info-column">
                  <label v-if="currentPrintMode == 'mode4'">下制程</label>
                  <label v-else>下一制程</label>
                  <span>{{ formatPreviousOrderNo(workOrderInfo.nextOrderNo) }} {{ workOrderInfo.nextWorkCenter }}</span>
                </div>
                <div class="info-column">
                  <label>预计开工</label>
                  <span>{{ parseTime(workOrderInfo.nextPlannedStartDate, '{y}-{m}-{d}') }}</span>
                </div>
              </div>
              <div class="split-line" />
            </div>

            <!-- 工序表格 -->
            <div class="process-table">
              <table>
                <thead>
                  <tr>
                    <th>工序</th>
                    <th colspan="4">标准时产能</th>
                    <th>预计开工</th>
                    <th>预计完工</th>
                    <th>操作员</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{{ workOrderProcessInfo.process }}</td>
                    <td>{{ workOrderProcessInfo.standardCapacity ? Number(workOrderProcessInfo.standardCapacity) : '' }}</td>
                    <td>PCS/H</td>
                    <td>{{ workOrderProcessInfo.personNumber ? Number(workOrderProcessInfo.personNumber) : '' }}</td>
                    <td>人</td>
                    <td>{{ formatDateToMonthDay(workOrderInfo.plannedStartDate) }}</td>
                    <td>{{ formatDateToMonthDay(workOrderInfo.plannedEndDate) }}</td>
                    <td rowspan="3"></td>
                  </tr>
                  <tr>
                    <td>{{ workOrderProcessInfo.workCenter }}</td>
                    <td colspan="4">数量</td>
                    <td>实际开工</td>
                    <td>实际完工</td>
                  </tr>
                  <tr>
                    <td class="desc-hidden">{{ workOrderProcessInfo.processShortDesc }}</td>
                    <!--   <td colspan="4">{{ Number(workOrderInfo.plannedQty) }}</td>  -->
                    <td colspan="4"></td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 模板B -->
        <div class="kanban-template kanban-template-2" v-if="currentTemplate === 'kanbanTemplate2'">
          <div class="kanban-card">
            <!-- 标题区域 -->
            <div class="kanban-header">
              <div class="title">生产看板卡</div>
              <div class="qr-code-container">
                <canvas ref="qrcodeCanvas" v-if="workOrderInfo.workOrderNo"></canvas>
              </div>
              <div class="info-container">
                <div class="date-info">制表日期 {{ workOrderInfo.makeDate }}</div>
                <div class="page-info">第 {{ workOrderInfo.page || 1 }} 张 / 共 {{ workOrderInfo.totalPages || 1 }} 张</div>
              </div>
            </div>

            <!-- 主要信息区域 -->
            <div class="kanban-body">
              <div class="info-row-multiple-column">
                <div class="info-column">
                  <label>工单号码</label>
                  <span>{{ workOrderInfo.workOrderNo }}</span>
                </div>
                <div class="info-column">
                  <label>看板数量</label>
                  <span>{{ Number(workOrderInfo.plannedQty) }} PCS</span>
                </div>
              </div>
              <div class="split-line" />

              <!-- 工序表格 -->
              <div class="process-table">
                <table>
                  <!-- 循环生成表头和数据 -->
                  <template v-for="(process, index) in oneCycleWorkOrderProcessList" :key="index">
                    <thead>
                      <tr>
                        <th>工序</th>
                        <th colspan="4">标准时产能</th>
                        <th>预计开工</th>
                        <th>预计完工</th>
                        <th>操作员</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{{ process.process }}</td>
                        <td>{{ Number(process.standardCapacity) }}</td>
                        <td>PCS/H</td>
                        <td>{{ process.personNumber ? Number(process.personNumber) : '' }}</td>
                        <td>人</td>
                        <td>{{ formatDateToMonthDay(workOrderInfo.plannedStartDate) }}</td>
                        <td>{{ formatDateToMonthDay(workOrderInfo.plannedEndDate) }}</td>
                        <td rowspan="3"></td>
                      </tr>
                      <tr>
                        <td>{{ process.workCenter }}</td>
                        <td colspan="4">数量</td>
                        <td>实际开工</td>
                        <td>实际完工</td>
                      </tr>
                      <tr>
                        <td class="desc-hidden">{{ process.processShortDesc }}</td>
                        <!-- <td colspan="4">{{ Number(workOrderInfo.plannedQty) }}</td>  -->
                        <td colspan="4"></td>
                        <td></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </template>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelPrint">取 消</el-button>
          <el-button :loading="printLoading" type="primary" @click="handleBatchPrint">确定打印</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 工序选择弹窗 -->
    <work-order-process-dialog ref="workOrderProcessDialogRef" :work-order-no="selectedRecords[0]?.workOrderNo" @workOrderProcessSelectCallBack="workOrderProcessSelectCallBack" />
  </div>
</template>

<script setup name="WorkOrder" lang="ts">
import WorkOrderProcessDialog from '@/views/wms/workOrderProcess/components/workOrderProcessDialog.vue';
import { listWorkOrder, getWorkOrder, delWorkOrder, addWorkOrder, updateWorkOrder } from '@/api/wms/workOrder';
import { WorkOrderVO, WorkOrderQuery, WorkOrderForm } from '@/api/wms/workOrder/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_work_order_check_enable } = toRefs<any>(proxy?.useDict('wms_work_order_check_enable'));
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { nextTick, ref } from 'vue';
import { parseTime } from '@/utils/ruoyi';
import { WorkOrderProcessVO } from '@/api/wms/workOrderProcess/types';
import { listWorkOrderProcess } from '@/api/wms/workOrderProcess';

const workOrderList = ref<WorkOrderVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const workOrderFormRef = ref<ElFormInstance>();

// 添加打印相关变量
const printLoading = ref(false);
const selectedRecords = ref<WorkOrderVO[]>([]);
const qrcodeCanvas = ref(null);

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const printDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: WorkOrderForm = {
  id: undefined,
  workOrderNo: undefined,
  item: undefined,
  itemDesc: undefined,
  checkEnable: undefined,
  plannedStartDate: undefined,
  plannedEndDate: undefined,
  plannedQty: undefined,
  deliveredQty: undefined,
  waitStockQty: undefined,
  remark: undefined
};
const data = reactive<PageData<WorkOrderForm, WorkOrderQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    workOrderNo: undefined,
    item: undefined,
    itemDesc: undefined,
    checkEnable: undefined,
    plannedStartDate: undefined,
    plannedEndDate: undefined,
    plannedQty: undefined,
    deliveredQty: undefined,
    waitStockQty: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    workOrderNo: [{ required: true, message: '工单号不能为空', trigger: 'blur' }],
    item: [{ required: true, message: '产品料号不能为空', trigger: 'blur' }],
    itemDesc: [{ required: true, message: '产品描述不能为空', trigger: 'blur' }],
    checkEnable: [{ required: true, message: '入库检不能为空', trigger: 'change' }],
    plannedStartDate: [{ required: true, message: '计划开工日期不能为空', trigger: 'blur' }],
    plannedEndDate: [{ required: true, message: '计划完工日期不能为空', trigger: 'blur' }],
    plannedQty: [{ required: true, message: '计划数量不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

// 工单信息
const workOrderInfo = ref({});
const workOrderProcessInfo = ref({});

const workOrderProcessList = ref<WorkOrderProcessVO[]>([]);
const oneCycleWorkOrderProcessList = ref<WorkOrderProcessVO[]>([]);

/** 查询工单信息列表 */
const getList = async () => {
  loading.value = true;
  const res = await listWorkOrder(queryParams.value);
  workOrderList.value = res.rows;
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
  nextTick(() => {
    workOrderFormRef.value?.resetFields();
  });
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
const handleSelectionChange = (selection: WorkOrderVO[]) => {
  ids.value = selection.map((item) => item.id);
  selectedRecords.value = selection;
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加工单信息';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: WorkOrderVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getWorkOrder(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工单信息';
};

/** 提交按钮 */
const submitForm = () => {
  workOrderFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateWorkOrder(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addWorkOrder(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: WorkOrderVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工单信息编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delWorkOrder(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/workOrder/export',
    {
      ...queryParams.value
    },
    `workOrder_${new Date().getTime()}.xlsx`
  );
};

// 格式化前一工序单号，如果前三位是"000"则去掉
const formatPreviousOrderNo = (orderNo) => {
  if (orderNo && orderNo.length >= 3 && orderNo.substring(0, 3) === '000') {
    return orderNo.substring(3);
  }
  return orderNo;
};

// 格式化日期为月日和时间格式
const formatDateToMonthDay = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ''; // 无效日期

  // const year = date.getFullYear().toString().slice(-2); // 取年份后两位
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  // return `${year}-${month}-${day} ${hours}:${minutes}`;
  return `${month}-${day} ${hours}:${minutes}`;
};

const generateQRCode = () => {
  if (selectedRecords.value.length === 0) return;

  const content = selectedRecords.value[0]?.workOrderNo || '';
  if (!content) return;
  const qrSize = 35;

  if (qrcodeCanvas.value) {
    QRCode.toCanvas(qrcodeCanvas.value, content, {
      width: qrSize,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    });
  }
};

/** 查询工单工序列表 */
const getWorkOrderProcessList = async () => {
  loading.value = true;
  queryParams.value.workOrderNo = selectedRecords.value[0]?.workOrderNo;
  const res = await listWorkOrderProcess(queryParams.value);

  // 过滤controlCode以PP或ZP开头的工序
  workOrderProcessList.value = res.rows.filter((process) => process.controlCode && (process.controlCode.startsWith('PP') || process.controlCode.startsWith('ZP'))) || [];

  // 如果有工序数据，则计算标准产能
  if (workOrderProcessList.value.length > 0) {
    workOrderProcessInfo.value = workOrderProcessList.value[0];

    // 为每个工序计算标准产能: 基础数量 / (排程时间 / 60)
    workOrderProcessList.value.forEach((process) => {
      if (process.baseQty != null && process.schedulingTime != null && process.schedulingTime > 0) {
        // 标准产能 = 基础数量 * 60 / 排程时间
        process.standardCapacity = Math.floor((process.baseQty * 60) / process.schedulingTime);
      }
    });
  }

  total.value = res.total;
  loading.value = false;
};
// 打印模式选项
const printModes = ref([
  { value: 'mode1', label: '模式A：首工序使用模板A' },
  { value: 'mode2', label: '模式B：末工序使用模板A' },
  { value: 'mode3', label: '模式C：首工序使用模板A，其余工序使用模板B' },
  { value: 'mode4', label: '模式D：选中的首道工序使用模板A，其余工序使用模板B' }
]);

// 当前打印模式
const currentTemplate = ref('kanbanTemplate1');
const currentPrintMode = ref('mode1');
// 监听打印模式变化，更新预览内容
watch(currentPrintMode, (newMode) => {
  updatePreviewTemplate();
});
// 更新预览模板
const updatePreviewTemplate = () => {
  // 根据打印模式和工序数量决定使用哪个模板
  if (workOrderProcessList.value.length > 0) {
    switch (currentPrintMode.value) {
      case 'mode1':
        // 模式A：所有工序使用模板A（只打印一张）
        currentTemplate.value = 'kanbanTemplate1';
        break;
      case 'mode2':
        // 模式B：末工序使用模板A（只打印一张）
        currentTemplate.value = 'kanbanTemplate1';
        // 显示末工序信息 - 只考虑controlCode以PP或ZP开头的工序
        if (workOrderProcessList.value.length > 0) {
          // 过滤出controlCode以PP或ZP开头的工序
          const filteredProcesses = workOrderProcessList.value.filter((process) => process.controlCode && (process.controlCode.startsWith('PP') || process.controlCode.startsWith('ZP')));

          // 如果有过滤结果，取最后一道工序；否则取全部工序中的最后一道
          if (filteredProcesses.length > 0) {
            workOrderProcessInfo.value = filteredProcesses[filteredProcesses.length - 1];
          } else {
            workOrderProcessInfo.value = workOrderProcessList.value[workOrderProcessList.value.length - 1];
          }
        }
        break;
      case 'mode3':
        // 模式C：首工序使用模板A，其余工序使用模板B
        currentTemplate.value = 'kanbanTemplate1';
        // 默认显示首工序
        if (workOrderProcessList.value.length > 0) {
          workOrderProcessInfo.value = workOrderProcessList.value[0];
        }
        break;
      case 'mode4':
        // 模式D：选中的首道工序使用模板A，其余工序使用模板B
        currentTemplate.value = 'kanbanTemplate1';
        // 显示选中的工序信息
        if (selectedProcessList.value.length > 0) {
          // 如果没有选择工序，默认使用第一个工序
          workOrderProcessInfo.value = selectedProcessList.value[0];
        }
        break;
      default:
        currentTemplate.value = 'kanbanTemplate1';
    }
  } else {
    currentTemplate.value = 'kanbanTemplate1';
  }
};
// 打印方法
const handlePrintWorkOrderCard = () => {
  if (selectedRecords.value.length === 0) {
    proxy?.$modal.msgWarning('请至少选择一条记录进行打印');
    return;
  }
  getWorkOrderProcessList();

  // 默认使用模式A
  currentPrintMode.value = 'mode1';

  printDialog.visible = true;

  // 构建看板卡数据
  workOrderInfo.value = selectedRecords.value[0];
  workOrderInfo.value.productDate = parseTime(new Date(), '{y}-{m}-{d}');
  workOrderInfo.value.makeDate = parseTime(new Date(), '{y}-{m}-{d}');

  nextTick(() => {
    generateQRCode();
  });
};
// 关闭打印工单卡弹框
const cancelPrint = () => {
  printDialog.visible = false;
  printLoading.value = false; // 同时重置加载状态
};

// 批量打印处理
const handleBatchPrint = async () => {
  if (selectedRecords.value.length === 0) {
    proxy?.$modal.msgWarning('没有可打印的记录');
    return;
  }

  // 检查模式D是否选择了工序
  if (currentPrintMode.value === 'mode4' && !selectedProcessInfo.value) {
    proxy?.$modal.msgWarning('请选择要打印的工序');
    return;
  }

  printLoading.value = true;
  try {
    let printContentHTML = '';

    // 为每个选中的记录生成打印页面
    for (let i = 0; i < selectedRecords.value.length; i++) {
      const record = selectedRecords.value[i];

      // 构建当前记录的打印数据
      workOrderInfo.value = record;
      workOrderInfo.value.productDate = parseTime(new Date(), '{y}-{m}-{d}');
      workOrderInfo.value.makeDate = parseTime(new Date(), '{y}-{m}-{d}');

      // 获取工序列表
      await getWorkOrderProcessList();

      // 计算总页数
      let totalPages = 1;
      if (currentPrintMode.value === 'mode3' && workOrderProcessList.value.length > 1) {
        // 模式C: 首工序1页 + 其余工序每2道工序1页
        totalPages = 1 + Math.ceil((workOrderProcessList.value.length - 1) / 2);
      }

      // 根据不同打印模式处理
      switch (currentPrintMode.value) {
        case 'mode1':
          // 模式A：所有工序使用模板A（只打印一张）
          currentTemplate.value = 'kanbanTemplate1';
          workOrderProcessInfo.value = workOrderProcessList.value[0]; // 使用首工序信息

          // 设置页码信息
          workOrderInfo.value.page = 1;
          workOrderInfo.value.totalPages = 1;

          // 重新生成二维码
          await nextTick();
          generateQRCode();
          await nextTick();

          // 生成截图
          const canvas1 = await html2canvas(document.querySelector('.print-preview-container'), {
            scale: 2,
            logging: false,
            useCORS: true,
            scrollX: 0,
            scrollY: 0
          });

          printContentHTML += `<div style="page-break-after: ${i < selectedRecords.value.length - 1 ? 'always' : 'auto'};">
            <img src="${canvas1.toDataURL('image/png')}" style="width:100%; height:100%;" />
          </div>`;
          break;

        case 'mode2':
          // 模式B：末工序使用模板A（只打印一张）
          currentTemplate.value = 'kanbanTemplate1';
          // 使用末工序信息
          if (workOrderProcessList.value.length > 0) {
            workOrderProcessInfo.value = workOrderProcessList.value[workOrderProcessList.value.length - 1];
          }

          // 设置页码信息
          workOrderInfo.value.page = 1;
          workOrderInfo.value.totalPages = 1;

          // 重新生成二维码
          await nextTick();
          generateQRCode();
          await nextTick();

          // 生成截图
          const canvas2 = await html2canvas(document.querySelector('.print-preview-container'), {
            scale: 2,
            logging: false,
            useCORS: true,
            scrollX: 0,
            scrollY: 0
          });

          printContentHTML += `<div style="page-break-after: ${i < selectedRecords.value.length - 1 ? 'always' : 'auto'};">
            <img src="${canvas2.toDataURL('image/png')}" style="width:100%; height:100%;" />
          </div>`;
          break;

        case 'mode3':
          // 模式C：首工序使用模板A，其余工序使用模板B
          // 首工序使用A模板打印一张 其他工序，每两道使用模板B打印一张
          let currentPage = 1;

          for (let j = 0; j < workOrderProcessList.value.length; j++) {
            if (j === 0) {
              // 首工序使用模板A
              currentTemplate.value = 'kanbanTemplate1';
              workOrderProcessInfo.value = workOrderProcessList.value[j];

              // 设置页码信息
              workOrderInfo.value.page = currentPage++;
              workOrderInfo.value.totalPages = totalPages;

              // 重新生成二维码
              await nextTick();
              generateQRCode();
              await nextTick();

              // 生成截图
              const canvas3 = await html2canvas(document.querySelector('.print-preview-container'), {
                scale: 2,
                logging: false,
                useCORS: true,
                scrollX: 0,
                scrollY: 0
              });

              printContentHTML += `<div style="page-break-after: ${workOrderProcessList.value.length > 1 ? 'always' : i < selectedRecords.value.length - 1 ? 'always' : 'auto'};">
                <img src="${canvas3.toDataURL('image/png')}" style="width:100%; height:100%;" />
              </div>`;
            } else {
              // 其余工序使用模板B，每两张工序打印一张
              if ((j - 1) % 2 === 0) {
                // 收集最多两个工序用于模板B显示
                const processesForPage = [];
                processesForPage.push(workOrderProcessList.value[j]); // 当前工序

                // 如果还有下一个工序，则也加入
                if (j + 1 < workOrderProcessList.value.length) {
                  processesForPage.push(workOrderProcessList.value[j + 1]);
                }

                // 设置模板B并更新数据
                currentTemplate.value = 'kanbanTemplate2';
                // 重要：更新模板B中使用的工序列表
                oneCycleWorkOrderProcessList.value = processesForPage;

                // 设置页码信息
                workOrderInfo.value.page = currentPage++;
                workOrderInfo.value.totalPages = totalPages;

                // 重新生成二维码
                await nextTick();
                generateQRCode();
                await nextTick();

                // 生成截图
                const canvas3 = await html2canvas(document.querySelector('.print-preview-container'), {
                  scale: 2,
                  logging: false,
                  useCORS: true,
                  scrollX: 0,
                  scrollY: 0
                });

                printContentHTML += `<div style="page-break-after: ${j + 2 < workOrderProcessList.value.length || i < selectedRecords.value.length - 1 ? 'always' : 'auto'};">
                  <img src="${canvas3.toDataURL('image/png')}" style="width:100%; height:100%;" />
                </div>`;
              }
            }
          }
          // 恢复完整的工序列表，以便处理下一条记录
          await getWorkOrderProcessList();
          break;

        case 'mode4':
          // 模式D：选中的首道工序使用模板A，其余工序使用模板B
          // 首工序使用A模板打印一张 其他工序，每两道使用模板B打印一张
          let mode4CurrentPage = 1;

          // 计算总页数：首工序1页 + 其余工序每2道工序1页
          let mode4TotalPages = 1;
          if (selectedProcessList.value.length > 1) {
            mode4TotalPages = 1 + Math.ceil((selectedProcessList.value.length - 1) / 2);
          }

          for (let j = 0; j < selectedProcessList.value.length; j++) {
            if (j === 0) {
              // 首工序使用模板A
              currentTemplate.value = 'kanbanTemplate1';
              workOrderProcessInfo.value = selectedProcessList.value[j];

              // 设置页码信息
              workOrderInfo.value.page = mode4CurrentPage++;
              workOrderInfo.value.totalPages = mode4TotalPages;

              // 重新生成二维码
              await nextTick();
              generateQRCode();
              await nextTick();

              // 生成截图
              const canvas4 = await html2canvas(document.querySelector('.print-preview-container'), {
                scale: 2,
                logging: false,
                useCORS: true,
                scrollX: 0,
                scrollY: 0
              });

              printContentHTML += `<div style="page-break-after: ${selectedProcessList.value.length > 1 ? 'always' : i < selectedRecords.value.length - 1 ? 'always' : 'auto'};">
                <img src="${canvas4.toDataURL('image/png')}" style="width:100%; height:100%;" />
              </div>`;
            } else {
              // 其余工序使用模板B，每两张工序打印一张
              if ((j - 1) % 2 === 0) {
                // 收集最多两个工序用于模板B显示
                const processesForPage = [];
                processesForPage.push(selectedProcessList.value[j]); // 当前工序

                // 如果还有下一个工序，则也加入
                if (j + 1 < selectedProcessList.value.length) {
                  processesForPage.push(selectedProcessList.value[j + 1]);
                }

                // 设置模板B并更新数据
                currentTemplate.value = 'kanbanTemplate2';
                // 重要：更新模板B中使用的工序列表
                oneCycleWorkOrderProcessList.value = processesForPage;

                // 设置页码信息
                workOrderInfo.value.page = mode4CurrentPage++;
                workOrderInfo.value.totalPages = mode4TotalPages;

                // 重新生成二维码
                await nextTick();
                generateQRCode();
                await nextTick();

                // 生成截图
                const canvas4 = await html2canvas(document.querySelector('.print-preview-container'), {
                  scale: 2,
                  logging: false,
                  useCORS: true,
                  scrollX: 0,
                  scrollY: 0
                });

                printContentHTML += `<div style="page-break-after: ${j + 2 < selectedProcessList.value.length || i < selectedRecords.value.length - 1 ? 'always' : 'auto'};">
                  <img src="${canvas4.toDataURL('image/png')}" style="width:100%; height:100%;" />
                </div>`;
              }
            }
          }
          break;
      }
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>工单卡打印预览</title>
            <style>              @page {
                size: 97mm 84mm;
                margin: 0;
              }
              body {
                width: 97mm;
                height: 84mm;
                margin: 0;
                padding: 0;
              }
              img {
                width: 100%;
                height: 100%;
                max-width: 100%;
                max-height: 100%;
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
    proxy?.$modal.msgError('打印失败，请重试');
  } finally {
    printLoading.value = false;
    printDialog.visible = false;
  }
};

// 工序选择相关
const workOrderProcessDialogRef = ref(null);
const selectedProcessList = ref<WorkOrderProcessVO[]>([]);
const selectedProcessInfo = ref<any>('');
// 打开工序选择弹窗
const openWorkOrderProcessDialog = () => {
  selectedProcessList.value = [];
  selectedProcessInfo.value = '';
  if (!selectedRecords.value[0]?.workOrderNo) {
    proxy?.$modal.msgWarning('请先选择一条工单记录');
    return;
  }
  workOrderProcessDialogRef.value?.openDialog();
};

// 工序选择回调
const workOrderProcessSelectCallBack = (data: WorkOrderProcessVO[]) => {
  // 按照工序号升序排序
  data.sort((a: any, b: any) => a.process - b.process);
  selectedProcessList.value = data;
  selectedProcessInfo.value = selectedProcessList.value.map((item) => `${item.process}`).join(',');

  workOrderInfo.value.previousOrderNo = selectedProcessList.value[0].previousProcessNode;
  workOrderInfo.value.previousWorkCenter = selectedProcessList.value[0].previousWorkCenter;
  workOrderInfo.value.previousEndDate = selectedProcessList.value[0].previousEndDate;


  const lastIndex = selectedProcessList.value.length - 1;
  workOrderInfo.value.nextOrderNo = selectedProcessList.value[lastIndex].nextProcessNode;
  workOrderInfo.value.nextWorkCenter = selectedProcessList.value[lastIndex].nextWorkCenter;
  workOrderInfo.value.nextPlannedStartDate = selectedProcessList.value[lastIndex].nextPlannedStartDate;

  // 更新预览
  updatePreviewTemplate();
};

onMounted(() => {
  getList();
});
</script>
<style lang="scss" scoped>
/* 打印模式选择区域 */
.print-mode-selection {
  padding: 10px;
  border-radius: 4px;
}

/* 打印预览容器 */
.print-preview-container {
  width: 97mm;
  height: 84mm;
  font-size: 14px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
}

/* 模板A样式 */
.kanban-template-1 {
  width: 100%;
  height: 100%;
  padding: 10px;
  .kanban-card {
    background-color: white;
    margin-bottom: 10px;
  }

  /* 确保所有卡片使用相同的样式 */
  .kanban-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #000;
    height: 10mm;
    margin-bottom: 3px;
  }

  .title {
    font-size: 16px;
    font-weight: bold;
    color: #000;
    flex: 1;
    text-align: left;
    flex-shrink: 0;
  }

  .qr-code-container {
    width: 35px;
    height: 35px;
    margin: 0 10px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .info-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex-shrink: 0;
  }

  .date-info,
  .page-info {
    font-size: 12px;
    color: #000;
    margin-bottom: 5px;
    text-align: left;
  }

  .kanban-body {
    padding: 0;
    color: #000;
  }

  .info-row-multiple-column {
    display: flex;
    flex-direction: row;
    color: #000;
    line-height: 15px;
  }

  .info-row-multiple-column.mode4-small-font {
    .info-column {
      span {
        font-size: 11px;
      }
    }
  }

  .info-column {
    flex: 2;
    label {
      font-weight: bold;
      flex-shrink: 0;
    }
    span {
      flex: 1;
      word-break: break-all;
      font-size: 12px;
      line-height: 15px;
      margin-left: 2px;
    }
  }

  .info-row {
    display: flex;
    line-height: 15px;
    label {
      font-weight: bold;
      flex-shrink: 0;
    }

    span {
      flex: 1;
      word-break: break-all;
      margin-left: 2px;
    }
  }

  .split-line {
    border: none;
    height: 1px;
    background-color: #000;
    width: 100%;
    margin: 5px 0;
  }

  .process-table {
    padding: 0;
  }

  .process-table table {
    width: 100%;
    border-collapse: collapse; /* 合并边框 */
    font-size: 12px;
    border: 1px solid #000;
  }

  .process-table th,
  .process-table td {
    border: 1px solid #000;
    padding: 2px 2px;
    text-align: center;
  }

  .process-table th:first-child,
  .process-table td:first-child {
    width: 55px;
    line-height: 20px;
  }

  .process-table th:nth-child(6),
  .process-table td:nth-child(6) {
    width: 60px;
  }

  .process-table th:nth-child(7),
  .process-table td:nth-child(7) {
    width: 60px;
  }

  .process-table th:last-child,
  .process-table td:last-child {
    width: 55px;
  }
  .desc-hidden {
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* 限制行数 */
    -webkit-box-orient: vertical;
    line-height: 15px !important;
    text-align: left;
    font-size: 12px;
  }

  /* 确保表格单元格有足够的高度 */
  .process-table td {
    min-height: 25px;
  }
}

/* 模板B样式 */
.kanban-template-2 {
  width: 100%;
  height: 100%;
  padding: 10px;
  font-size: 14px;

  .kanban-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    border-bottom: 1px solid #000;
    height: 10mm;
    padding-bottom: 5px;
  }

  .title {
    font-size: 16px;
    font-weight: bold;
    color: #000;
    flex: 1;
    text-align: left;
    flex-shrink: 0;
  }

  .qr-code-container {
    width: 40px;
    height: 40px;
    margin: 0 10px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .info-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex-shrink: 0;
  }

  .date-info,
  .page-info {
    font-size: 12px;
    color: #000;
    margin-bottom: 2px;
    text-align: left;
  }

  .kanban-body {
    padding: 0;
    color: #000;
  }

  .info-row-multiple-column {
    display: flex;
    flex-direction: row;
    color: #000;
    line-height: 15px;
  }

  .info-column {
    flex: 2;
    label {
      font-weight: bold;
      flex-shrink: 0;
    }
    span {
      flex: 1;
      word-break: break-all;
      font-size: 12px;
      line-height: 15px;
      margin-left: 2px;
    }
  }

  .split-line {
    border: none;
    height: 1px;
    background-color: #000;
    width: 100%;
    margin: 5px 0;
  }

  .process-table {
    padding: 0;
  }

  .process-table table {
    width: 100%;
    border-collapse: collapse; /* 合并边框 */
    font-size: 12px;
    border: 1px solid #000;
    line-height: 15px;
  }

  .process-table th,
  .process-table td {
    border: 1px solid #000;
    text-align: center;
  }

  .process-table th:first-child,
  .process-table td:first-child {
    width: 55px;
  }

  .process-table th:nth-child(6),
  .process-table td:nth-child(6) {
    width: 60px;
  }

  .process-table th:nth-child(7),
  .process-table td:nth-child(7) {
    width: 60px;
  }

  .process-table th:last-child,
  .process-table td:last-child {
    width: 55px;
  }

  .desc-hidden {
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* 限制行数 */
    -webkit-box-orient: vertical;
    line-height: 15px !important;
    text-align: left;
    font-size: 12px;
  }

  /* 确保表格单元格有足够的高度 */
  .process-table td {
    min-height: 25px;
  }
}
</style>
