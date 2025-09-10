<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mt-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="打包编号" prop="packingCode">
              <el-input v-model="queryParams.packingCode" placeholder="请输入打包编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="栈板编号" prop="palletCode">
              <el-input v-model="queryParams.palletCode" placeholder="请输入栈板编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="目的仓库" prop="warehouseCode">
              <el-input v-model="queryParams.warehouseCode" placeholder="请输入目的仓库" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="操作时间" prop="dateTimeRange">
              <el-date-picker
                v-model="queryParams.dateTimeRange"
                type="datetimerange"
                :shortcuts="shortcuts"
                value-format="YYYY-MM-DD HH:mm:ss"
                range-separator="-"
                start-placeholder="请选择开始日期"
                end-placeholder="请选择结束日期"
                :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <!--    <el-tabs v-model="tabActiveName" @tab-change="changeTab">
      <el-tab-pane label="全部" name="all"> </el-tab-pane>
      <el-tab-pane label="待产线送库" name="waitInStore"> </el-tab-pane>
      <el-tab-pane label="待入库接收" name="pendingInbound"> </el-tab-pane>
      <el-tab-pane label="已驳回" name="warehouseReject"> </el-tab-pane>
      <el-tab-pane label="SAP同步异常" name="warehouseFailed"> </el-tab-pane>
    </el-tabs>-->

    <!-- 打包列表Tab标签页 -->
    <el-tabs v-model="tabActiveName" @tab-change="changeTab">
      <el-tab-pane name="all">
        <template #label>
          <el-badge :value="allCount" class="item" color="#67c23a" :offset="[10, 0]" :max="9999999999">
            <span>全部</span>
          </el-badge>
        </template>
      </el-tab-pane>

      <el-tab-pane name="waitInStore">
        <template #label>
          <el-badge :value="waitInStoreCount" class="item" color="#409EFF" :offset="[10, 0]" :max="9999999999">
            <span>待产线送库</span>
          </el-badge>
        </template>
      </el-tab-pane>

      <el-tab-pane name="pendingInbound">
        <template #label>
          <el-badge :value="pendingInboundCount" class="item" color="#e6a23c" :offset="[10, 0]" :max="9999999999">
            <span>待入库接收</span>
          </el-badge>
        </template>
      </el-tab-pane>

      <el-tab-pane name="warehouseReject">
        <template #label>
          <el-badge :value="warehouseRejectCount" class="item" color="#f56c6c" :offset="[10, 0]" :max="9999999999">
            <span>已退回</span>
          </el-badge>
        </template>
      </el-tab-pane>
      <!--      <el-tab-pane name="warehouseFailed">
        <template #label>
          <el-badge :value="warehouseFailedCount" class="item" color="#f56c6c" :offset="[10, 0]">
            <span>SAP同步异常</span>
          </el-badge>
        </template>
      </el-tab-pane>-->
    </el-tabs>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="24" class="mb8">
          <el-col v-if="tabActiveName == 'all' || tabActiveName == 'waitInStore'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:workOrderSn']" type="primary" plain icon="Plus" @click="handleWorkOrderSn">产品码打包</el-button>
          </el-col>
          <el-col v-if="tabActiveName == 'all' || tabActiveName == 'waitInStore'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:workOrder']" type="primary" plain icon="Plus" @click="handleAdd">新增工单打包</el-button>
          </el-col>
          <el-col v-if="tabActiveName == 'all' || tabActiveName == 'waitInStore'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:workOrder']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改工单打包</el-button>
          </el-col>
          <el-col v-if="tabActiveName == 'all' || tabActiveName == 'waitInStore'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:receiptOrderNo']" type="primary" plain icon="Plus" @click="handleScanAdd">新增入库单打包</el-button>
          </el-col>
          <el-col v-if="tabActiveName == 'all' || tabActiveName == 'waitInStore'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:receiptOrderNo']" type="success" plain icon="Edit" :disabled="single" @click="handleScanUpdate()">修改入库单打包</el-button>
          </el-col>
          <el-col v-if="tabActiveName == 'all' || tabActiveName == 'waitInStore'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>

          <!--          <el-col v-if="tabActiveName == 'waitInStore'" :span="1.5">
            <el-button v-hasPermi="['wms:packing:edit']" type="success" plain icon="ShoppingCart" :disabled="multiple" @click="handleMultiPendingInbound()">送仓</el-button>
          </el-col>-->
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:packing:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="packingList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="expand">
          <template #default="scope">
            <el-table :data="scope.row.packingDetailVoList" style="width: calc(100% - 110px); float: right; margin: 10px 0" empty-text="暂无数据">
              <el-table-column label="序号" align="center" width="60">
                <template #default="{ $index }">
                  {{ $index + 1 }}
                </template>
              </el-table-column>
              <el-table-column label="工单号" align="center" width="130" prop="workOrderNo">
                <template #default="scope">
                  <router-link :to="{ path: '/receiptOrder/packingDetailSn', query: { packingDetailId: scope.row.id } }" class="link-type">
                    <span>{{ scope.row.workOrderNo }}</span>
                  </router-link>
                </template>
              </el-table-column>
              <el-table-column label="标签码" align="center" width="130" prop="sn" />
              <el-table-column label="产品料号" align="center" width="150" prop="item" />
              <el-table-column label="产品描述" align="left" prop="itemDesc" />
              <el-table-column label="计划数量" align="center" width="130" prop="plannedQty" />
              <el-table-column label="打包数量" align="center" width="130" prop="packingQty" />
              <el-table-column label="入库检" prop="checkEnable" width="120" align="center">
                <template #default="scope">
                  <dict-tag :options="wms_work_order_check_enable" :value="scope.row.checkEnable" />
                </template>
              </el-table-column>
              <el-table-column label="备注" align="left" prop="remark" />
            </el-table>
          </template>
        </el-table-column>
        <el-table-column label="打包编号" align="left" prop="packingCode" />
        <el-table-column label="栈板编号" align="left" prop="palletCode" />
        <el-table-column label="目的仓库" align="left" prop="warehouseCode">
          <template #default="scope">
            <span v-if="scope.row.warehouseCode">{{ `${scope.row.warehouseCode} - ${scope.row.warehouseDesc}` }}</span>
            <span v-else></span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <dict-tag :options="wms_packing_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="项次数" align="left" prop="countPackingDetail">
          <template #default="scope">
            <span>{{ (scope.row.packingDetailVoList || []).length }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" />
        <el-table-column label="创建者" align="center" prop="createByName" />
        <el-table-column label="更新时间" align="center" prop="updateTime" />
        <el-table-column label="更新者" align="center" prop="updateByName" />
        <el-table-column label="备注" align="left" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding" fixed="right" width="220">
          <template #default="scope">
            <el-tooltip content="修改" placement="top" v-if="scope.row.packingType == 0 && (scope.row.status == 1 || scope.row.status == 4 || scope.row.status == 5)">
              <el-button v-hasPermi="['wms:packing:workOrder']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改工单打包</el-button>
            </el-tooltip>
            <el-tooltip content="扫码修改" placement="top" v-if="scope.row.packingType == 1 && (scope.row.status == 1 || scope.row.status == 4 || scope.row.status == 5)">
              <el-button v-hasPermi="['wms:packing:receiptOrderNo']" link type="primary" icon="Edit" @click="handleScanUpdate(scope.row)">修改入库单打包</el-button>
            </el-tooltip>
            <el-tooltip content="送仓" placement="top" v-if="scope.row.status == 1 || scope.row.status == 4 || scope.row.status == 5">
              <el-button v-hasPermi="['wms:packing:edit']" link type="success" icon="ShoppingCart" @click="handlePendingInbound(scope.row)">送仓</el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top" v-if="scope.row.status == 1 || scope.row.status == 4 || scope.row.status == 5">
              <el-button v-hasPermi="['wms:packing:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
            </el-tooltip>
            <el-tooltip content="下达标签" placement="top" v-if="scope.row.status == 1 || scope.row.status == 4 || scope.row.status == 5">
              <el-button v-hasPermi="['wms:workOrderSn:add']" link type="primary" icon="Collection" @click="handleGeneratePackingDetailSn(scope.row)">下达标签</el-button>
            </el-tooltip>
            <el-tooltip content="打印" placement="top" v-if="scope.row.status == 1 || scope.row.status == 4 || scope.row.status == 5">
              <el-button v-hasPermi="['wms:workOrderSn:print']" link type="primary" :icon="Printer" @click="handlePrintDialog(scope.row)">打印标签</el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 添加或修改打包记录对话框 -->
    <PackingDialog ref="packingRef" @packingCallBack="packingCallBack" />

    <!-- 添加或修改扫码标签方式打包记录对话框 -->
    <PackingScanDialog ref="packingScanRef" @packingCallBack="packingCallBack" />

    <!-- 送仓对话框 -->
    <el-dialog v-model="visible" :title="title" width="60%" append-to-body>
      <el-form ref="packingFormRef" :model="form" :rules="rules" label-width="120px">
        <el-row>
          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="打包编号">
              <el-text> {{ form.packingCode }}</el-text>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="栈板编号">
              <el-text> {{ form.palletCode }}</el-text>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="目的仓库" prop="warehouseCode">
              <el-select v-model="form.warehouseCode" placeholder="请选择目的仓库" clearable filterable>
                <el-option v-for="warehouse in warehouseLocationList" :key="warehouse.code" :label="`${warehouse.code}-${warehouse.name}`" :value="warehouse.code" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="visible = false">取 消</el-button>
          <el-button :loading="buttonLoading" type="primary" @click="submitInbound">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 打印入库标签对话框 -->
    <el-dialog title="打印入库标签" v-model="printDialogVisible" width="600px" append-to-body>
      <!--      <el-alert title="请选择打印模板并确认打印" type="info" show-icon />-->
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
            <div v-if="currentTemplate === 'receiptOrderTemplate9784'" :class="['production-receipt', getPaperSizeClass(currentTemplate)]" ref="printPreviewContent">
              <div class="receipt-header">
                <div class="company-name-container">
                  <span class="company-name">{{ previewWorkOrderInfo.companyName }}</span>
                </div>
              </div>
              <hr class="top-hr" />
              <div class="receipt-body">
                <div class="content-section">
                  <!-- 工单号码占一行 -->
                  <div class="info-row full-row">
                    <label>工单号码</label>
                    <span class="work-order-content">
                      <span>{{ previewWorkOrderInfo.workOrderNo }}</span>
                      <span class="version-text">V{{ previewWorkOrderInfo.version }}</span>
                    </span>
                  </div>

                  <!-- 产品品号占一行 -->
                  <div class="info-row full-row">
                    <label>产品品号</label>
                    <span>{{ previewWorkOrderInfo.material }}</span>
                  </div>
                  <div class="info-row product-description">
                    <label>产品描述</label>
                    <span>{{ previewWorkOrderInfo.materialDesc }}</span>
                  </div>
                  <!-- 其他字段与二维码同行 -->
                  <div class="info-with-qr">
                    <div class="info-column">
                      <div class="info-row">
                        <label>入库数量</label>
                        <span>{{ formattedQty(previewWorkOrderInfo.qty) }} {{ previewWorkOrderInfo.unit }}</span>
                        <span>{{ previewWorkOrderInfo.remark }}</span>
                      </div>
                      <div class="info-row">
                        <label>生产日期</label>
                        <span>{{ previewWorkOrderInfo.productDate }}</span>
                      </div>
                      <div class="info-row">
                        <label>生产线别</label>
                        <span>{{ previewWorkOrderInfo.productLine }}</span>
                      </div>
                      <div class="info-row">
                        <label>操&nbsp;&nbsp;作 员</label>
                        <span>{{ previewWorkOrderInfo.operator }}</span>
                      </div>
                      <div class="info-row">
                        <label>检&nbsp;&nbsp;验 员</label>
                        <span>{{ previewWorkOrderInfo.inspector }}</span>
                      </div>
                    </div>
                    <div class="qr-section">
                      <div class="qr-info">
                        <p>{{ previewWorkOrderInfo.sn }}</p>
                      </div>
                      <canvas ref="previewQrCodeCanvas"></canvas>
                    </div>
                  </div>
                </div>
              </div>
              <hr class="bottom-hr" />
            </div>

            <!-- 工业二维码模板预览 (80×60mm) -->
            <div v-else-if="currentTemplate === 'qr8060'" class="qr-template qr8060 size8060" ref="printPreviewContent">
              <div class="qr-container">
                <canvas ref="previewQrCodeCanvas8060"></canvas>
                <div class="qr-info">
                  <p>{{ previewWorkOrderInfo.workOrderNo }}</p>
                  <p>{{ previewWorkOrderInfo.sn }}</p>
                  <p>{{ previewWorkOrderInfo.qty }} PCS</p>
                </div>
              </div>
            </div>

            <!-- 工业二维码模板预览 (50×60mm) -->
            <div v-else-if="currentTemplate === 'qr5060'" class="qr-template qr5060 size5060" ref="printPreviewContent">
              <div class="qr-container">
                <canvas ref="previewQrCodeCanvas5060"></canvas>
                <div class="qr-info">
                  <p>{{ previewWorkOrderInfo.workOrderNo }}</p>
                  <p>{{ previewWorkOrderInfo.sn }}</p>
                  <p>{{ previewWorkOrderInfo.qty }} PCS</p>
                </div>
              </div>
            </div>

            <!-- 工业二维码模板预览 (30×40mm) -->
            <div v-else-if="currentTemplate === 'qr3040'" class="qr-template qr3040 size3040" ref="printPreviewContent">
              <div class="qr-container">
                <canvas ref="previewQrCodeCanvas3040"></canvas>
                <div class="qr-info">
                  <p>{{ previewWorkOrderInfo.workOrderNo }}</p>
                  <p>{{ previewWorkOrderInfo.sn }}</p>
                  <p>{{ previewWorkOrderInfo.qty }} PCS</p>
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

<script setup name="Packing" lang="ts">
import { listDeptDataPackingDetail, delPacking, inBoundPending, generatePackingDetailSn } from '@/api/wms/packing';
import { PackingVO, PackingQuery, PackingForm } from '@/api/wms/packing/types';
import PackingDialog from '@/views/wms/packing/components/packingDialog.vue';
import PackingScanDialog from '@/views/wms/packing/components/packingScanDialog.vue';
import { nextTick, onMounted, ref, watch } from 'vue';
import { Picture, Printer } from '@element-plus/icons-vue';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { ElMessage } from 'element-plus';
import { WarehouseLocationVO } from '@/api/wms/warehouseLocation/types';
import { listWarehouseLocation } from '@/api/wms/warehouseLocation';
import useDialog from '@/hooks/useDialog';
import { WorkOrderSnVO } from '@/api/wms/workOrderSn/types';
import { getUserProfile } from '@/api/system/user';
const packingRef = ref<InstanceType<typeof PackingDialog>>();
const packingScanRef = ref<InstanceType<typeof PackingScanDialog>>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_packing_status, wms_work_order_check_enable } = toRefs<any>(proxy?.useDict('wms_packing_status', 'wms_work_order_check_enable'));

const tabActiveName = ref('all');
const packingList = ref<PackingVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const selectedPackingList = ref<PackingVO[]>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const allCount = ref(0);
const waitInStoreCount = ref(0);
const pendingInboundCount = ref(0);
const warehouseRejectCount = ref(0);
const warehouseFailedCount = ref(0);

const buttonLoading = ref(false);
const queryFormRef = ref<ElFormInstance>();
const packingFormRef = ref<ElFormInstance>();
const shortcuts = [
  {
    text: '今天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate());
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '昨天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近两天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近三天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 2);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近一周',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近一月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近三月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  }
];
const initFormData: PackingForm = {
  id: undefined,
  packingCode: undefined,
  palletCode: undefined,
  warehouseCode: undefined,
  status: undefined,
  remark: undefined,
  packingDetailBoList: undefined
};

const data = reactive<PageData<PackingForm, PackingQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    packingCode: undefined,
    palletCode: undefined,
    warehouseCode: undefined,
    status: undefined,
    packingDetailBoList: [],
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    palletCode: [{ required: true, message: '栈板编号不能为空', trigger: 'blur' }],
    warehouseCode: [{ required: true, message: '仓库不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询打包记录列表 */
const getList = async () => {
  loading.value = true;
  queryParams.value.status = null;
  if (tabActiveName.value == 'all') {
    queryParams.value.status = null;
  } else if (tabActiveName.value == 'waitInStore') {
    queryParams.value.status = 1;
  } else if (tabActiveName.value == 'pendingInbound') {
    queryParams.value.status = 2;
  } else if (tabActiveName.value == 'warehouseReject') {
    queryParams.value.status = 4;
  } else if (tabActiveName.value == 'warehouseFailed') {
    queryParams.value.status = 5;
  }
  const res = await listDeptDataPackingDetail(queryParams.value);
  packingList.value = res.rows;
  total.value = res.total;
  if (tabActiveName.value == 'all') {
    allCount.value = res.total;
  } else if (tabActiveName.value == 'waitInStore') {
    waitInStoreCount.value = res.total;
  } else if (tabActiveName.value == 'pendingInbound') {
    pendingInboundCount.value = res.total;
  } else if (tabActiveName.value == 'warehouseReject') {
    warehouseRejectCount.value = res.total;
  } else if (tabActiveName.value == 'warehouseFailed') {
    warehouseFailedCount.value = res.total;
  }
  loading.value = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  packingFormRef.value?.resetFields();
};
const changeTab = (activeName: any) => {
  handleQuery();
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
const handleSelectionChange = (selection: PackingVO[]) => {
  ids.value = selection.map((item) => item.id);
  selectedPackingList.value = selection;
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 打包记录详情按钮操作 */

const handleWorkOrderSn = () => {
  proxy.$router.push({
    path: `/receiptOrder/productPacking`,
    query: {}
  });
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  packingRef.value.title = '新增打包记录';
  packingRef.value.openDialog();
  packingRef.value?.initPackingDialog(null);
};

/** 扫码新增按钮操作 */
const handleScanAdd = () => {
  reset();
  packingScanRef.value.title = '扫码新增打包记录';
  packingScanRef.value.openDialog();
  packingScanRef.value?.initPackingDialog(null);
};

/** 修改按钮操作 */
const handleUpdate = (row?: PackingVO) => {
  const _id = row?.id || ids.value[0];
  packingRef.value.title = '修改打包记录';
  packingRef.value.openDialog();
  packingRef.value?.initPackingDialog(_id);
};

/** 扫码修改按钮操作 */
const handleScanUpdate = (row?: PackingVO) => {
  const _id = row?.id || ids.value[0];
  packingScanRef.value.title = '扫码修改打包记录';
  packingScanRef.value.openDialog();
  packingScanRef.value?.initPackingDialog(_id);
};

/** 删除按钮操作 */
const handleDelete = async (row?: PackingVO) => {
  const _ids = row?.id || ids.value;
  const _packingCode = row?.packingCode || selectedPackingList.value;
  await proxy?.$modal.confirm('确认是否删除打包记录编号为"' + _packingCode + '"的数据项？').finally(() => (loading.value = false));
  await delPacking(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};
/** 打包详情生成标签操作 */
const handleGeneratePackingDetailSn = async (row?: PackingVO) => {
  const _packingCode = row?.packingCode || selectedPackingList.value;
  await proxy?.$modal.confirm('确认是否生成打包记录编号为"' + _packingCode + '"的标签？').finally(() => (loading.value = false));
  // await delPacking(_ids);
  await generatePackingDetailSn(row);
  proxy?.$modal.msgSuccess('生成成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/packing/export',
    {
      ...queryParams.value
    },
    `packing_${new Date().getTime()}.xlsx`
  );
};

/** 送仓按钮操作 */
const handleMultiPendingInbound = async (row?: PackingVO) => {
  const _ids = row?.id || ids.value;
  visible.value = true;
  await getWarehouseList();
  form.value = row;
};
/** 送仓按钮操作 */
const handlePendingInbound = async (row?: PackingVO) => {
  const _ids = row?.id || ids.value;
  visible.value = true;
  await getWarehouseList();
  form.value = row;
};
const { title, visible, openDialog, closeDialog } = useDialog({
  title: '送仓'
});
const warehouseLocationList = ref<WarehouseLocationVO[]>([]);
/** 查询仓位信息列表 */
const getWarehouseList = async () => {
  const res = await listWarehouseLocation({
    parentId: 0
  });
  warehouseLocationList.value = res.data;
};
const submitInbound = () => {
  packingFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await inBoundPending({
          id: form.value.id,
          warehouseCode: form.value.warehouseCode,
          palletCode: form.value.palletCode,
          packingCode: form.value.packingCode
        }).finally(() => (buttonLoading.value = false));
      }
      visible.value = false;
      proxy?.$modal.msgSuccess('送仓成功');
      await getList();
    }
  });
};

const packingCallBack = () => {
  getList();
};

// 打印相关引用
const printDialogVisible = ref(false);
const printLoading = ref(false);
const selectedRecords = ref<WorkOrderSnVO[]>([]);
const currentTemplate = ref('receiptOrderTemplate9784');

const previewQrCodeCanvas = ref<HTMLCanvasElement | null>(null);
const previewQrCodeCanvas8060 = ref<HTMLCanvasElement | null>(null);
const previewQrCodeCanvas5060 = ref<HTMLCanvasElement | null>(null);
const previewQrCodeCanvas3040 = ref<HTMLCanvasElement | null>(null);
const printPreviewContent = ref<HTMLElement | null>(null);

// 预览用的记录数据
const previewWorkOrderInfo = ref({
  companyName: '溢泰（南京）环保科技有限公司',
  workOrderNo: '',
  sn: '',
  material: '',
  materialDesc: '',
  qty: null,
  unit: 'PCS',
  productDate: '',
  productLine: '',
  operator: '',
  inspector: '',
  version: 1,
  remark: ''
});

// 打印模板选项 - 启用所有模板选项
const printTemplates = ref([{ value: 'receiptOrderTemplate9784', label: '生产入库单模板(97×84mm)' }]);

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

// 显示打印对话框
const handlePrintDialog = (row?: PackingVO) => {
  selectedRecords.value = row.packingDetailVoList;
  if (selectedRecords.value.length === 0) {
    proxy?.$modal.msgWarning('请至少选择一条记录进行打印');
    return;
  }
  printDialogVisible.value = true;
  console.log('row', row);
  // 使用第一条记录作为预览数据
  const record = selectedRecords.value[0];
  console.log('record', record);
  previewWorkOrderInfo.value = {
    companyName: record.workOrderSnVo.companyName || '',
    workOrderNo: record.workOrderNo || '',
    sn: record.sn || '',
    material: record.item || '',
    materialDesc: record.itemDesc || '',
    qty: record.packingQty || 0,
    unit: record.unit,
    productDate: record.workOrderSnVo.productDate ? proxy?.parseTime(record.workOrderSnVo.productDate, '{y}-{m}-{d}') : '',
    productLine: record.workOrderSnVo.productLine || '',
    operator: previewWorkOrderInfo.value.operator,
    inspector: '',
    version: record.workOrderSnVo.version || 1,
    remark: record.workOrderSnVo.remark || ''
  };

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
    case 'receiptOrderTemplate9784':
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
    case 'receiptOrderTemplate9784':
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

  const content = previewWorkOrderInfo.value.sn;
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
    case 'receiptOrderTemplate9784':
      qrCanvasRef = previewQrCodeCanvas.value;
      qrSize = 100;
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
      previewWorkOrderInfo.value = {
        companyName: record.workOrderSnVo.companyName || '',
        workOrderNo: record.workOrderNo || '',
        sn: record.sn || '',
        material: record.item || '',
        materialDesc: record.itemDesc || '',
        qty: record.packingQty || 0,
        unit: record.unit,
        productDate: record.workOrderSnVo.productDate ? proxy?.parseTime(record.workOrderSnVo.productDate, '{y}-{m}-{d}') : '',
        productLine: record.workOrderSnVo.productLine || '',
        operator: previewWorkOrderInfo.value.operator,
        inspector: '',
        version: record.workOrderSnVo.version || 1,
        remark: record.workOrderSnVo.remark || ''
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
  previewWorkOrderInfo.value.operator = res.data.user.nickName;
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
