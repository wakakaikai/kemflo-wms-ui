<template>
  <div class="app-container outbound-bind-page">
    <el-card shadow="never" class="create-card">
      <template #header>
        <div class="create-header">
          <div class="title-group">
            <div class="title-icon title-icon-primary">
              <svg-icon icon-class="menu-pallet-outbound-bind" />
            </div>
            <div>
              <div class="page-title">栈板出货绑定</div>
              <div class="page-subtitle">导入智米配货单后，从下方记录打开任务，扫描栈板完成确认与标签打印</div>
            </div>
          </div>
          <div class="flow-steps">
            <el-button v-hasPermi="['wms:palletOutboundBind:import']" type="primary" icon="Upload" class="create-button flow-import-button" @click="handleImport">导入配货单</el-button>
            <div class="flow-step is-active"><span>1</span>导入配货单</div>
            <i></i>
            <div class="flow-step" :class="{ 'is-active': activeBind }"><span>2</span>扫描绑定</div>
            <i></i>
            <div class="flow-step" :class="{ 'is-active': activeBind?.status === STATUS_CONFIRMED }"><span>3</span>确认打印</div>
          </div>
        </div>
      </template>
    </el-card>

    <div v-if="activeBind" class="workspace-grid">
      <el-card shadow="never" class="binding-card">
        <template #header>
          <div class="card-header binding-title-header">
            <div class="title-group compact">
              <div class="title-icon title-icon-success">
                <el-icon>
                  <Box />
                </el-icon>
              </div>
              <div>
                <div class="card-title">当前绑定任务</div>
                <div class="card-subtitle">
                  <span class="warehouse-name-text">{{ activeBind.destWarehouseName }}</span
                  ><span class="dot-divider">·</span>{{ sourceTypeLabel(activeBind.sourceType) }}
                </div>
              </div>
            </div>
            <div class="binding-header-actions">
              <!--              <el-button v-if="canEditDestWarehouse" link type="primary" @click="openDestWarehouseDialog(activeBind)">修改目的仓</el-button>-->
              <el-tag :type="statusMeta.type">{{ statusMeta.label }}</el-tag>
            </div>
          </div>
        </template>

        <div class="stat-row">
          <div class="stat-item">
            <div class="stat-icon qty-stat">
              <el-icon>
                <Goods />
              </el-icon>
            </div>
            <div>
              <span>出货数量</span><strong>{{ activeBind.qty ?? 0 }}</strong>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon pallet-stat">
              <el-icon>
                <Box />
              </el-icon>
            </div>
            <div>
              <span>已绑定栈板</span><strong>{{ activeBind.palletCount || 0 }}<small> 托</small></strong>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon sn-stat">
              <el-icon>
                <Tickets />
              </el-icon>
            </div>
            <div>
              <span>已绑定 SN</span><strong>{{ activeBind.snCount || 0 }}<small> 个</small></strong>
            </div>
          </div>
          <div class="stat-item shipping-no">
            <div class="stat-icon shipping-stat">
              <el-icon>
                <Document />
              </el-icon>
            </div>
            <div>
              <span>系统出货号</span><strong>{{ activeBind.shippingNo }}</strong>
            </div>
          </div>
        </div>

        <div class="scan-panel">
          <div class="scan-panel-header">
            <div class="scan-title">
              <el-icon>
                <Aim />
              </el-icon>
              <span>扫描栈板</span>
            </div>
            <div class="scan-tip">支持扫码枪 Enter / Tab 自动提交</div>
          </div>
          <div class="scan-row">
            <el-input ref="palletInputRef" v-model="palletNo" size="large" clearable :disabled="!editable" :placeholder="scanPlaceholder" @keydown="handlePalletScanKeydown">
              <template #prefix>
                <el-icon>
                  <Aim />
                </el-icon>
              </template>
            </el-input>
            <el-button type="primary" size="large" icon="Link" :disabled="!editable" :loading="binding" @click="handleBindPallet">绑定栈板</el-button>
            <el-button type="success" size="large" icon="CircleCheck" :disabled="!editable || !activeBind.palletCount" @click="handleConfirm">确认绑定</el-button>
          </div>
        </div>

        <div v-if="resultMessage" class="bind-result-hint">
          <el-alert show-icon center :title="resultMessage" :type="resultStatus ? 'success' : 'error'">
            <template #icon>
              <Bell />
            </template>
          </el-alert>
        </div>

        <div class="section-heading">
          <div>
            <el-icon>
              <List />
            </el-icon>
            <span>已绑定栈板明细</span>
          </div>
        </div>
        <el-table class="detail-table" :data="activeBind.detailList || []" border stripe row-key="id" empty-text="请扫描栈板号进行绑定" highlight-current-row :row-class-name="detailRowClassName" @row-click="selectPreviewDetail">
          <el-table-column prop="sequence" label="序号" width="80" align="center" />
          <el-table-column prop="palletNo" label="栈板号" min-width="190" />
          <el-table-column prop="materialCode" label="物料编码" min-width="130" />
          <el-table-column prop="materialDesc" label="物料描述" min-width="180" show-overflow-tooltip />
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template #default="scope">
              <el-button link type="primary" :disabled="!isPrintAllowed || !scope.row.palletNo" @click.stop="printSingleLabel(scope.row)">打印</el-button>
              <el-button link type="danger" :disabled="!canUnbindPallet" @click.stop="handleRemovePallet(scope.row.palletNo)">解绑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="never" class="preview-card">
        <template #header>
          <div class="card-header preview-header">
            <div class="title-group compact">
              <div class="title-icon title-icon-warning">
                <el-icon>
                  <Printer />
                </el-icon>
              </div>
              <div>
                <div class="card-title">标签预览</div>
                <div class="card-subtitle">
                  97 × 84 mm
                  <span v-if="previewDetail">（{{ previewIndexText }}）</span>
                </div>
              </div>
            </div>
            <div class="preview-actions">
              <el-button icon="Printer" :disabled="!canPrintSingle" @click="printPreviewLabel">打印当前</el-button>
              <el-button type="primary" icon="Printer" :disabled="!canPrintAll" @click="printAllLabels">打印全部</el-button>
            </div>
          </div>
        </template>

        <el-alert v-if="printAlertMessage" type="warning" :title="printAlertMessage" show-icon closable class="print-hint" @close="printAlertMessage = ''" />
        <div class="label-stage">
          <div class="outbound-label">
            <img :src="miLogo" class="mi-logo" alt="MI" />
            <canvas ref="qrCanvasRef" class="qr-code"></canvas>
            <div class="destination">
              <div class="destination-title">目的仓：</div>
              <div class="destination-line">
                <div class="destination-name">{{ activeBind.destWarehouseName }}</div>
                <div class="label-index">{{ previewIndexText }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="qr-payload-box">
          <div class="qr-payload-label">
            <el-icon>
              <FullScreen />
            </el-icon>
            二维码内容
          </div>
          <div class="qr-payload-value">{{ qrPayload || '请先绑定栈板' }}</div>
        </div>
      </el-card>
    </div>

    <div v-else class="empty-workspace">
      <div class="empty-illustration">
        <el-icon>
          <Box />
        </el-icon>
      </div>
      <div class="empty-title">尚未打开绑定任务</div>
      <div class="empty-description">请先导入智米配货单，再从下方绑定记录中打开任务</div>
    </div>

    <el-card shadow="never" class="history-card">
      <template #header>
        <div class="card-header">
          <div class="title-group compact">
            <div class="title-icon title-icon-info">
              <el-icon>
                <Clock />
              </el-icon>
            </div>
            <div>
              <div class="card-title">绑定记录查询</div>
              <div class="card-subtitle">查询历史出货绑定，展开记录可查看并维护栈板明细</div>
            </div>
          </div>
        </div>
      </template>

      <div class="history-filter-panel">
        <el-form :model="historyQueryParams" :inline="true" class="history-query-form" label-width="auto" @submit.prevent>
          <el-form-item label="出货号">
            <el-input v-model="historyQueryParams.shippingNo" clearable placeholder="出货号/智米发货单号" style="width: 230px" @keyup.enter="handleHistoryQuery" />
          </el-form-item>
          <el-form-item label="计划号">
            <el-input v-model="historyQueryParams.planNo" clearable placeholder="请输入计划号" style="width: 180px" @keyup.enter="handleHistoryQuery" />
          </el-form-item>
          <el-form-item label="客户物料编码">
            <el-input v-model="historyQueryParams.customerItemCode" clearable placeholder="请输入客户物料编码" style="width: 180px" @keyup.enter="handleHistoryQuery" />
          </el-form-item>
          <el-form-item label="采购订单">
            <el-input v-model="historyQueryParams.purchaseOrderNo" clearable placeholder="请输入采购订单" style="width: 180px" @keyup.enter="handleHistoryQuery" />
          </el-form-item>
          <el-form-item label="栈板号">
            <el-input v-model="historyQueryParams.palletNo" clearable placeholder="请输入明细栈板号" style="width: 230px" @keyup.enter="handleHistoryQuery" />
          </el-form-item>
          <el-form-item label="目的仓">
            <DestWarehouseSelectDialog v-model:warehouse-code="historyQueryParams.destWarehouseCode" v-model:warehouse-name="historyWarehousePickerName" :warehouse-options="warehouseOptions" placeholder="请选择目的仓" clearable field-width="340px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="historyQueryParams.status" clearable placeholder="全部" style="width: 110px">
              <el-option v-for="item in bindStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" :loading="historyLoading" @click="handleHistoryQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetHistoryQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table v-loading="historyLoading" :data="historyRows" border stripe row-key="id">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="history-expand-panel">
              <el-table :data="row.detailList || []" border size="small" empty-text="暂无栈板明细">
                <el-table-column prop="sequence" label="序号" width="70" align="center" />
                <el-table-column prop="palletNo" label="栈板号" width="160" />
                <el-table-column prop="materialCode" label="物料编码" width="160" />
                <el-table-column prop="materialDesc" label="物料描述" min-width="180" show-overflow-tooltip />
                <el-table-column label="操作" width="90" align="center">
                  <template #default="scope">
                    <el-button link type="danger" :disabled="!canUnbindHistoryRow(row)" @click="handleHistoryUnbind(row, scope.row.palletNo)">解绑</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="shippingNo" label="出货号" min-width="160" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template #default="scope">
            <el-tag :type="getStatusMeta(scope.row.status).type">{{ getStatusMeta(scope.row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <!--        <el-table-column prop="planNo" label="计划号" min-width="120" show-overflow-tooltip />-->
        <el-table-column prop="customerItemCode" label="客户物料编码" min-width="120" show-overflow-tooltip />
        <el-table-column prop="productId" label="商品ID" min-width="80" show-overflow-tooltip />
        <el-table-column prop="purchaseOrderNo" label="采购订单" min-width="110" show-overflow-tooltip />
        <el-table-column prop="qty" label="出货数量" width="80" align="center" />
        <el-table-column prop="snCount" label="绑定数量" width="80" align="center" />
        <el-table-column prop="destWarehouseName" label="收货仓库" min-width="160" show-overflow-tooltip />
        <el-table-column prop="receiveProvince" label="收货省" width="90" show-overflow-tooltip />
        <!--        <el-table-column prop="receiveCity" label="收货市" width="100" show-overflow-tooltip />-->
        <!--        <el-table-column prop="palletCount" label="栈板数" width="80" align="center" />-->
        <!--       <el-table-column label="确认时间" prop="confirmTime" width="170" align="center" />
       <el-table-column label="创建时间" prop="createTime" width="170" align="center" />
               <el-table-column label="创建人" prop="createByName" width="100" align="center" />-->
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openBind(scope.row.id)">绑定</el-button>
            <!--            <el-button v-if="canUnbindHistoryRow(scope.row)" link type="primary" @click="openDestWarehouseDialog(scope.row)">修改</el-button>-->
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="historyTotal > 0" v-model:page="historyQueryParams.pageNum" v-model:limit="historyQueryParams.pageSize" :total="historyTotal" @pagination="loadHistory" />
    </el-card>

    <el-dialog v-model="confirmDialogVisible" title="确认出货绑定" width="520px" destroy-on-close @closed="resetConfirmForm">
      <el-alert type="info" show-icon :closable="false" class="confirm-dialog-tip" title="请核对目的仓与栈板数量，可在此修改目的仓后再确认。" />
      <div class="confirm-dialog-meta">
        <div>出货号：{{ confirmForm.shippingNo }}</div>
        <div>已绑定栈板：{{ confirmForm.palletCount }} 托 · SN {{ confirmForm.snCount }}</div>
      </div>
      <el-form label-width="88px">
        <el-form-item label="目的仓" required>
          <DestWarehouseSelectDialog v-model:warehouse-code="confirmForm.destWarehouseCode" v-model:warehouse-name="confirmForm.destWarehouseName" :warehouse-options="warehouseOptions" field-width="100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="confirmSaving" @click="submitConfirm">确认提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="destWarehouseDialogVisible" title="修改目的仓" width="480px" destroy-on-close @closed="resetDestWarehouseForm">
      <div v-if="destWarehouseForm.shippingNo" class="dest-dialog-shipping-no">出货号：{{ destWarehouseForm.shippingNo }}</div>
      <el-form label-width="88px">
        <el-form-item label="目的仓" required>
          <DestWarehouseSelectDialog v-model:warehouse-code="destWarehouseForm.destWarehouseCode" v-model:warehouse-name="destWarehouseForm.destWarehouseName" :warehouse-options="warehouseOptions" field-width="100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="destWarehouseDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="destWarehouseSaving" @click="submitDestWarehouse">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="upload.open" :title="upload.title" width="420px" append-to-body>
      <el-upload ref="uploadRef" :limit="1" accept=".xlsx, .xls" :headers="upload.headers" :action="upload.url + '?updateSupport=' + upload.updateSupport" :disabled="upload.isUploading" :on-progress="handleFileUploadProgress" :on-success="handleFileSuccess" :auto-upload="false" drag>
        <el-icon class="el-icon--upload">
          <i-ep-upload-filled />
        </el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="text-center el-upload__tip">
            <div class="el-upload__tip">
              <el-checkbox v-model="upload.updateSupport" />
              是否更新已存在的出货号
            </div>
            <span>仅允许导入 xls、xlsx 格式文件。</span>
            <el-link type="primary" :underline="false" style="font-size: 12px; vertical-align: baseline" @click="importTemplate">下载模板</el-link>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="upload.open = false">取 消</el-button>
          <el-button type="primary" @click="submitFileForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="PalletOutboundBind" lang="ts">
import type { ComponentInternalInstance } from 'vue';
import { computed, getCurrentInstance, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { Aim, Bell, Box, Clock, Document, FullScreen, Goods, List, Printer, Tickets } from '@element-plus/icons-vue';
import type { UploadFile } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import QRCode from 'qrcode';
import { getDicts } from '@/api/system/dict/data';
import type { DictDataVO } from '@/api/system/dict/data/types';
import { bindOutboundPalletMi, confirmPalletOutboundBind, getPalletOutboundBind, listPalletOutboundBind, removeOutboundPallet, updatePalletOutboundBindDestWarehouse } from '@/api/wms/palletOutboundBind';
import { PALLET_OUTBOUND_BIND_SOURCE_MES, PALLET_OUTBOUND_BIND_SOURCE_WMS, type PalletOutboundBindDetailVO, type PalletOutboundBindQuery, type PalletOutboundBindVO } from '@/api/wms/palletOutboundBind/types';
import miLogo from '@/assets/logo/milogo.jpg';
import { audioPlayer } from '@/utils/audioPlayer';
import { globalHeaders } from '@/utils/request';
import DestWarehouseSelectDialog from './components/DestWarehouseSelectDialog.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const STATUS_CONFIRMED = 2;
const LABEL_WIDTH_MM = 97;
const LABEL_HEIGHT_MM = 84;
const bindStatusOptions = [
  { label: '草稿', value: 0 },
  { label: '绑定中', value: 1 },
  { label: '已确认', value: 2 },
  { label: '已取消', value: 3 }
];
const DICT_TYPE = 'wms_mi_shipping_destination_warehouse';

const warehouseOptions = ref<DictDataVO[]>([]);
const activeBind = ref<PalletOutboundBindVO>();
const historyRows = ref<PalletOutboundBindVO[]>([]);
const historyTotal = ref(0);
const historyWarehousePickerName = ref('');
const historyQueryParams = reactive<PalletOutboundBindQuery>({
  pageNum: 1,
  pageSize: 20,
  orderByColumn: 'shippingNo',
  isAsc: 'desc',
  shippingNo: '',
  planNo: '',
  customerItemCode: '',
  purchaseOrderNo: '',
  destWarehouseCode: '',
  destWarehouseName: '',
  sourceType: undefined,
  status: undefined,
  palletNo: ''
});
const uploadRef = ref<ElUploadInstance>();
const upload = reactive<ImportOption>({
  open: false,
  title: '',
  isUploading: false,
  updateSupport: 0,
  headers: globalHeaders(),
  url: import.meta.env.VITE_APP_BASE_API + '/wms/palletOutboundBind/importData'
});
const palletNo = ref('');
const binding = ref(false);
const historyLoading = ref(false);
const palletInputRef = ref();
const qrCanvasRef = ref<HTMLCanvasElement>();
/** 标签预览选中的明细（默认最新绑定的一行） */
const previewDetailId = ref<string | number>();
const printAlertMessage = ref('');
const resultMessage = ref('');
const resultStatus = ref(false);

const sourceTypeLabel = (sourceType?: number) => {
  if (sourceType === PALLET_OUTBOUND_BIND_SOURCE_WMS) return 'WMS栈板';
  if (sourceType === PALLET_OUTBOUND_BIND_SOURCE_MES) return 'MES栈板';
  return '-';
};

const scanPlaceholder = computed(() => (activeBind.value?.sourceType === PALLET_OUTBOUND_BIND_SOURCE_WMS ? '扫描或输入 WMS 栈板编号，按 Enter 绑定' : '扫描或输入 MES 栈板号，按 Enter 绑定'));

const getStatusMeta = (status: number) => {
  const map: Record<number, { label: string; type: 'info' | 'primary' | 'success' | 'danger' }> = {
    0: { label: '草稿', type: 'info' },
    1: { label: '绑定中', type: 'primary' },
    2: { label: '已确认', type: 'success' },
    3: { label: '已取消', type: 'danger' }
  };
  return map[status] || { label: '未知', type: 'info' as const };
};

const statusMeta = computed(() => getStatusMeta(activeBind.value?.status ?? 0));
const editable = computed(() => [0, 1].includes(activeBind.value?.status ?? -1));
const canUnbindPallet = computed(() => {
  const status = activeBind.value?.status;
  return status != null && status !== 3;
});
const canEditDestWarehouse = computed(() => canUnbindPallet.value);
const isPrintAllowed = computed(() => activeBind.value?.status === STATUS_CONFIRMED);

const destWarehouseDialogVisible = ref(false);
const destWarehouseSaving = ref(false);
const destWarehouseForm = reactive({
  id: undefined as string | number | undefined,
  shippingNo: '',
  destWarehouseCode: '',
  destWarehouseName: ''
});

const confirmDialogVisible = ref(false);
const confirmSaving = ref(false);
const confirmForm = reactive({
  id: undefined as string | number | undefined,
  shippingNo: '',
  palletCount: 0,
  snCount: 0,
  destWarehouseCode: '',
  destWarehouseName: ''
});

const canUnbindHistoryRow = (row: PalletOutboundBindVO) => row.status !== 3;

const previewDetail = computed(() => {
  const list = activeBind.value?.detailList || [];
  if (!list.length) return undefined;
  if (previewDetailId.value != null) {
    const hit = list.find((item) => item.id === previewDetailId.value);
    if (hit) return hit;
  }
  return list[list.length - 1];
});

const previewIndexText = computed(() => {
  const total = activeBind.value?.palletCount || 0;
  const seq = previewDetail.value?.sequence ?? 1;
  return total > 0 ? `${total}-${seq}` : '-';
});

/** 当前绑定任务全部栈板号，英文逗号分隔（按 sequence 排序）；预览与打印共用 */
const buildBindQrPayload = (bind?: PalletOutboundBindVO) => {
  const list = bind?.detailList || [];
  return list
    .slice()
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
    .map((item) => item.palletNo?.trim())
    .filter((no): no is string => Boolean(no))
    .join(',');
};

const qrPayload = computed(() => buildBindQrPayload(activeBind.value));
const canPrintSingle = computed(() => Boolean(isPrintAllowed.value && activeBind.value?.destWarehouseName && previewDetail.value?.palletNo));
const canPrintAll = computed(() => Boolean(isPrintAllowed.value && activeBind.value?.destWarehouseName && (activeBind.value?.detailList?.length || 0) > 0));

/** 绑定接口失败时 axios 拦截器多为 Error(msg)，部分场景为字符串 */
const extractApiMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error !== 'error') {
    return error;
  }
  if (error && typeof error === 'object' && 'msg' in error && typeof (error as { msg: string }).msg === 'string') {
    return (error as { msg: string }).msg;
  }
  return '';
};

const handlePalletScanKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' && event.key !== 'Tab') return;
  event.preventDefault();
  if (binding.value || !editable.value) return;
  void handleBindPallet();
};

const guardPrint = (): boolean => {
  if (isPrintAllowed.value) {
    printAlertMessage.value = '';
    return true;
  }
  printAlertMessage.value = '出货绑定状态为「已确认」后才可打印标签，请先点击「确认」完成绑定。';
  return false;
};

const syncPreviewSelection = () => {
  const list = activeBind.value?.detailList || [];
  if (!list.length) {
    previewDetailId.value = undefined;
    return;
  }
  if (previewDetailId.value == null || !list.some((item) => item.id === previewDetailId.value)) {
    previewDetailId.value = list[list.length - 1]?.id;
  }
};

const selectPreviewDetail = (row: PalletOutboundBindDetailVO) => {
  previewDetailId.value = row.id;
};

const detailRowClassName = ({ row }: { row: PalletOutboundBindDetailVO }) => (row.id === previewDetailId.value ? 'preview-row' : '');

const resetDestWarehouseForm = () => {
  destWarehouseForm.id = undefined;
  destWarehouseForm.shippingNo = '';
  destWarehouseForm.destWarehouseCode = '';
  destWarehouseForm.destWarehouseName = '';
};

const openDestWarehouseDialog = (row: PalletOutboundBindVO) => {
  if (row.status === 3) return;
  destWarehouseForm.id = row.id;
  destWarehouseForm.shippingNo = row.shippingNo || '';
  destWarehouseForm.destWarehouseCode = row.destWarehouseCode || '';
  destWarehouseForm.destWarehouseName = row.destWarehouseName || '';
  destWarehouseDialogVisible.value = true;
};

const submitDestWarehouse = async () => {
  if (!destWarehouseForm.id || !destWarehouseForm.destWarehouseCode || !destWarehouseForm.destWarehouseName) {
    ElMessage.warning('请选择目的仓');
    return;
  }
  destWarehouseSaving.value = true;
  try {
    const res = await updatePalletOutboundBindDestWarehouse(destWarehouseForm.id, destWarehouseForm.destWarehouseCode, destWarehouseForm.destWarehouseName);
    const vo = res.data;
    if (activeBind.value?.id === vo.id) {
      activeBind.value = vo;
    }
    syncHistoryRowAndDetails(vo);
    destWarehouseDialogVisible.value = false;
    ElMessage.success('目的仓已更新');
    await loadHistory();
  } finally {
    destWarehouseSaving.value = false;
  }
};

const loadWarehouseOptions = async () => {
  const res = await getDicts(DICT_TYPE);
  warehouseOptions.value = (res.data || []).slice().sort((a: DictDataVO, b: DictDataVO) => Number(a.dictSort) - Number(b.dictSort));
};

const buildHistoryQuery = (): PalletOutboundBindQuery => {
  const query: PalletOutboundBindQuery = {
    pageNum: historyQueryParams.pageNum,
    pageSize: historyQueryParams.pageSize,
    orderByColumn: historyQueryParams.orderByColumn || 'shippingNo',
    isAsc: historyQueryParams.isAsc || 'desc',
    shippingNo: historyQueryParams.shippingNo || undefined,
    planNo: historyQueryParams.planNo || undefined,
    customerItemCode: historyQueryParams.customerItemCode || undefined,
    purchaseOrderNo: historyQueryParams.purchaseOrderNo || undefined,
    destWarehouseCode: historyQueryParams.destWarehouseCode || undefined,
    destWarehouseName: historyQueryParams.destWarehouseName || undefined,
    sourceType: historyQueryParams.sourceType,
    status: historyQueryParams.status,
    palletNo: historyQueryParams.palletNo || undefined
  };
  return query;
};

const loadHistory = async () => {
  historyLoading.value = true;
  try {
    const res = await listPalletOutboundBind(buildHistoryQuery());
    historyRows.value = res.rows || [];
    historyTotal.value = res.total || 0;
  } finally {
    historyLoading.value = false;
  }
};

const handleHistoryQuery = () => {
  historyQueryParams.pageNum = 1;
  void loadHistory();
};

const resetHistoryQuery = () => {
  historyQueryParams.pageNum = 1;
  historyQueryParams.pageSize = 20;
  historyQueryParams.orderByColumn = 'shippingNo';
  historyQueryParams.isAsc = 'desc';
  historyQueryParams.shippingNo = '';
  historyQueryParams.planNo = '';
  historyQueryParams.customerItemCode = '';
  historyQueryParams.purchaseOrderNo = '';
  historyQueryParams.destWarehouseCode = '';
  historyQueryParams.destWarehouseName = '';
  historyWarehousePickerName.value = '';
  historyQueryParams.sourceType = undefined;
  historyQueryParams.status = undefined;
  historyQueryParams.palletNo = '';
  void loadHistory();
};

const handleImport = () => {
  upload.title = '智米配货单导入';
  upload.open = true;
};

const importTemplate = () => {
  proxy?.download('wms/palletOutboundBind/importTemplate', {}, `智米配货单详情_template_${new Date().getTime()}.xlsx`);
};

const handleFileUploadProgress = () => {
  upload.isUploading = true;
};

const handleFileSuccess = async (response: any, file: UploadFile) => {
  upload.open = false;
  upload.isUploading = false;
  uploadRef.value?.handleRemove(file);
  ElMessageBox.alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + '</div>', '导入结果', {
    dangerouslyUseHTMLString: true
  });
  await Promise.all([loadWarehouseOptions(), loadHistory()]);
};

const submitFileForm = () => {
  uploadRef.value?.submit();
};

const syncHistoryRowAndDetails = (vo: PalletOutboundBindVO) => {
  const index = historyRows.value.findIndex((item) => item.id === vo.id);
  if (index >= 0) {
    historyRows.value[index] = { ...historyRows.value[index], ...vo, detailList: vo.detailList || [] };
  }
};

const doRemovePallet = async (bindId: string | number, palletNoValue: string) => {
  await ElMessageBox.confirm(`确认解绑栈板 ${palletNoValue}？`, '解绑栈板', { type: 'warning' });
  const res = await removeOutboundPallet(bindId, palletNoValue);
  return res.data;
};

const handleHistoryUnbind = async (row: PalletOutboundBindVO, palletNoValue: string) => {
  if (!canUnbindHistoryRow(row) || !palletNoValue) return;
  const vo = await doRemovePallet(row.id, palletNoValue);
  syncHistoryRowAndDetails(vo);
  if (activeBind.value?.id === row.id) {
    activeBind.value = vo;
    syncPreviewSelection();
    if (!isPrintAllowed.value) {
      printAlertMessage.value = '已解绑栈板，请重新确认后再打印标签。';
    }
  }
  ElMessage.success('栈板已解绑');
  await loadHistory();
};

const handleBindPallet = async () => {
  const value = palletNo.value.trim();
  if (!activeBind.value || !value || !editable.value || binding.value) return;
  binding.value = true;
  resultMessage.value = '';
  try {
    const res = await bindOutboundPalletMi(activeBind.value.id, value);
    activeBind.value = res.data;
    syncPreviewSelection();
    palletNo.value = '';
    audioPlayer.playSuccess();
    resultStatus.value = true;
    resultMessage.value = res.msg || '';
    await loadHistory();
  } catch (error) {
    audioPlayer.playWarning();
    const msg = extractApiMessage(error);
    if (msg) {
      resultStatus.value = false;
      resultMessage.value = msg;
    }
  } finally {
    binding.value = false;
    await nextTick();
    palletInputRef.value?.focus();
  }
};

const handleRemovePallet = async (value: string) => {
  if (!activeBind.value || !canUnbindPallet.value) return;
  const vo = await doRemovePallet(activeBind.value.id, value);
  activeBind.value = vo;
  syncPreviewSelection();
  syncHistoryRowAndDetails(vo);
  if (!isPrintAllowed.value) {
    printAlertMessage.value = '已解绑栈板，请重新确认后再打印标签。';
  }
  ElMessage.success('栈板已解绑');
  await loadHistory();
};

const resetConfirmForm = () => {
  confirmForm.id = undefined;
  confirmForm.shippingNo = '';
  confirmForm.palletCount = 0;
  confirmForm.snCount = 0;
  confirmForm.destWarehouseCode = '';
  confirmForm.destWarehouseName = '';
};

const handleConfirm = () => {
  if (!activeBind.value || !activeBind.value.palletCount) return;
  confirmForm.id = activeBind.value.id;
  confirmForm.shippingNo = activeBind.value.shippingNo || '';
  confirmForm.palletCount = activeBind.value.palletCount || 0;
  confirmForm.snCount = activeBind.value.snCount || 0;
  confirmForm.destWarehouseCode = activeBind.value.destWarehouseCode || '';
  confirmForm.destWarehouseName = activeBind.value.destWarehouseName || '';
  confirmDialogVisible.value = true;
};

const submitConfirm = async () => {
  if (!confirmForm.id || !confirmForm.destWarehouseCode || !confirmForm.destWarehouseName) {
    ElMessage.warning('请选择目的仓');
    return;
  }
  confirmSaving.value = true;
  try {
    const res = await confirmPalletOutboundBind(confirmForm.id, confirmForm.destWarehouseCode, confirmForm.destWarehouseName);
    activeBind.value = res.data;
    syncHistoryRowAndDetails(res.data);
    printAlertMessage.value = '';
    confirmDialogVisible.value = false;
    ElMessage.success('出货绑定已确认');
    await loadHistory();
  } finally {
    confirmSaving.value = false;
  }
};

const openBind = async (id: string | number) => {
  const res = await getPalletOutboundBind(id);
  activeBind.value = res.data;
  syncPreviewSelection();
  await nextTick();
  if (editable.value) palletInputRef.value?.focus();
};

watch(
  () => activeBind.value?.detailList,
  () => syncPreviewSelection(),
  { deep: true }
);

const renderQrCode = async () => {
  await nextTick();
  if (!qrCanvasRef.value) return;
  if (!qrPayload.value) {
    const context = qrCanvasRef.value.getContext('2d');
    context?.clearRect(0, 0, qrCanvasRef.value.width, qrCanvasRef.value.height);
    return;
  }
  await QRCode.toCanvas(qrCanvasRef.value, qrPayload.value, { width: 154, margin: 0, errorCorrectionLevel: 'L' });
};

watch(qrPayload, () => void renderQrCode(), { immediate: true });
watch(
  () => activeBind.value?.detailList,
  () => void renderQrCode(),
  { deep: true }
);

const escapeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

type LabelPrintItem = { qrContent: string; indexText: string };

const labelIndexText = (detail: PalletOutboundBindDetailVO) => {
  const total = activeBind.value?.palletCount || 0;
  const seq = detail.sequence ?? 1;
  return `${total}-${seq}`;
};

const openPrintWindow = async (items: LabelPrintItem[]) => {
  if (!guardPrint()) return;
  if (!activeBind.value?.destWarehouseName || !items.length) {
    printAlertMessage.value = '请先绑定至少一个栈板后再打印。';
    return;
  }
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    ElMessage.error('打印窗口被拦截，请允许弹窗后重试');
    return;
  }
  try {
    const warehouseName = escapeHtml(activeBind.value.destWarehouseName);
    const pages = await Promise.all(
      items.map(async (item) => {
        const qrDataUrl = await QRCode.toDataURL(item.qrContent, { width: 220, margin: 0, errorCorrectionLevel: 'L' });
        return `
      <section class="print-page">
        <div class="label">
          <img class="logo" src="${miLogo}" alt="MI" />
          <img class="qr" src="${qrDataUrl}" alt="栈板二维码" />
          <div class="destination">
            <div class="title">目的仓：</div>
            <div class="line"><span class="name">${warehouseName}</span><span class="index">${escapeHtml(item.indexText)}</span></div>
          </div>
        </div>
      </section>`;
      })
    );
    printWindow.document.write(`<!doctype html><html><head><meta charset="UTF-8"><title>栈板出货标签</title><style>
      @page{size:${LABEL_WIDTH_MM}mm ${LABEL_HEIGHT_MM}mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff}
      .print-page{width:${LABEL_WIDTH_MM}mm;height:${LABEL_HEIGHT_MM}mm;overflow:hidden;break-after:page;page-break-after:always}
      .print-page:last-child{break-after:auto;page-break-after:auto}.label{position:relative;width:100%;height:100%;font-family:Arial,"Microsoft YaHei",sans-serif;color:#000;background:#fff}
      .logo{position:absolute;top:9mm;left:9mm;width:17mm;height:17mm;border-radius:5mm;object-fit:cover}.qr{position:absolute;top:8mm;right:8mm;width:31mm;height:31mm}
      .destination{position:absolute;left:10mm;right:8mm;bottom:10mm}.title,.name{font-family:黑体,SimHei,sans-serif;font-size:36px;font-weight:bold;line-height:1.15}.line{display:flex;align-items:last baseline;justify-content:space-between;gap:4mm;margin-top:2mm}
      .name{flex:1;line-height:1.12;word-break:break-all}.index{flex:none;font-size:7mm;line-height:1;white-space:nowrap;align-self:last baseline}
    </style></head><body>${pages.join('')}<script>window.onload=function(){window.onafterprint=function(){window.close()};window.focus();window.print()}<\/script></body></html>`);
    printWindow.document.close();
  } catch {
    printWindow.close();
    ElMessage.error('二维码生成失败');
  }
};

const printSingleLabel = async (detail: PalletOutboundBindDetailVO) => {
  if (!detail.palletNo || !qrPayload.value) return;
  selectPreviewDetail(detail);
  await openPrintWindow([{ qrContent: qrPayload.value, indexText: labelIndexText(detail) }]);
};

const printPreviewLabel = async () => {
  if (!previewDetail.value?.palletNo) return;
  await printSingleLabel(previewDetail.value);
};

const printAllLabels = async () => {
  const qrContent = qrPayload.value;
  if (!qrContent) return;
  const details = activeBind.value?.detailList || [];
  const items = details.filter((item) => item.palletNo).map((item) => ({ qrContent, indexText: labelIndexText(item) }));
  await openPrintWindow(items);
};

onMounted(async () => {
  await Promise.all([loadWarehouseOptions(), loadHistory()]);
});
</script>

<style scoped>
.outbound-bind-page {
  --page-blue: var(--el-color-primary);
  --soft-blue: var(--el-color-primary-light-9);
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100vh - 84px);
  padding: 18px;
  background: radial-gradient(circle at 96% 0%, var(--el-color-primary-light-9) 0, transparent 320px), var(--el-bg-color-page);
}

.create-card,
.binding-card,
.preview-card,
.history-card {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgb(31 45 61 / 5%);
}

.create-card {
  position: relative;
}

.create-card :deep(.el-card__header),
.binding-card :deep(.el-card__header),
.preview-card :deep(.el-card__header),
.history-card :deep(.el-card__header) {
  padding: 16px 20px;
  background: linear-gradient(180deg, var(--el-bg-color), var(--el-fill-color-extra-light));
}

.create-card :deep(.el-card__body),
.binding-card :deep(.el-card__body),
.preview-card :deep(.el-card__body),
.history-card :deep(.el-card__body) {
  padding: 18px 20px 20px;
}

.create-header,
.card-header,
.title-group,
.flow-steps,
.flow-step,
.section-heading > div,
.scan-title,
.qr-payload-label {
  display: flex;
  align-items: center;
}

.create-header,
.card-header {
  justify-content: space-between;
  gap: 18px;
}

.title-group {
  min-width: 0;
  gap: 12px;
}

.title-group.compact {
  gap: 10px;
}

.title-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  font-size: 22px;
  border-radius: 12px;
}

.title-group.compact .title-icon {
  width: 38px;
  height: 38px;
  font-size: 19px;
  border-radius: 10px;
}

.title-icon-primary {
  color: #fff;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  box-shadow: 0 7px 16px var(--el-color-primary-light-7);
}

.title-icon-success {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.title-icon-warning {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

.title-icon-info {
  color: var(--el-color-primary);
  background: var(--soft-blue);
}

.page-title {
  color: var(--el-text-color-primary);
  font-size: 21px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.page-subtitle,
.card-subtitle {
  margin-top: 5px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.flow-steps {
  flex: none;
  gap: 8px;
}

.flow-import-button {
  margin-right: 4px;
}

.flow-steps > i {
  width: 28px;
  height: 1px;
  background: var(--el-border-color);
}

.flow-step {
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  white-space: nowrap;
}

.flow-step span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 23px;
  height: 23px;
  border: 1px solid var(--el-border-color);
  border-radius: 50%;
  background: var(--el-bg-color);
}

.flow-step.is-active {
  color: var(--el-color-primary);
  font-weight: 600;
}

.flow-step.is-active span {
  color: #fff;
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  box-shadow: 0 0 0 4px var(--el-color-primary-light-9);
}

.create-form-panel {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
}

.create-form-tip {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 7px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.create-form-tip .el-icon {
  color: var(--el-color-primary);
  font-size: 17px;
}

.create-button {
  min-width: 132px;
  box-shadow: 0 5px 12px var(--el-color-primary-light-7);
}

.history-query-form {
  margin-bottom: -18px;
}

.history-expand-panel {
  margin: 4px 12px 8px 46px;
  padding: 12px;
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
}

.binding-header-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
}

.dest-dialog-shipping-no {
  margin-bottom: 14px;
  padding: 10px 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  border-radius: 7px;
  background: var(--el-fill-color-light);
}

.confirm-dialog-tip {
  margin-bottom: 12px;
}

.confirm-dialog-meta {
  margin-bottom: 16px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  border-radius: 7px;
  background: var(--el-fill-color-light);
}

.card-title {
  font-size: 17px;
  font-weight: 650;
  color: var(--el-text-color-primary);
}

.warehouse-name-text {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.dot-divider {
  margin: 0 6px;
}

.preview-actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
}

.print-hint {
  margin-bottom: 12px;
}

.binding-card :deep(tr.preview-row > td) {
  background-color: var(--el-color-primary-light-9) !important;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(650px, 1fr) 430px;
  gap: 16px;
  align-items: start;
}

.preview-card {
  position: sticky;
  top: 10px;
}

.stat-row {
  display: grid;
  grid-template-columns: 170px 170px 170px minmax(200px, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 78px;
  padding: 13px 15px;
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 11px;
  background: linear-gradient(145deg, var(--el-bg-color), var(--el-fill-color-extra-light));
}

.stat-item span {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stat-item strong {
  display: block;
  margin-top: 4px;
  color: var(--el-text-color-primary);
  font-size: 23px;
  line-height: 1;
}

.stat-item strong small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 400;
}

.stat-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  font-size: 21px;
  border-radius: 10px;
}

.qty-stat {
  color: var(--el-color-info);
  background: var(--el-color-info-light-9);
}

.pallet-stat {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.sn-stat {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.shipping-stat {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

.shipping-no strong {
  font-size: 16px;
  word-break: break-all;
}

.scan-panel {
  margin-bottom: 16px;
  padding: 14px;
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 11px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-bg-color));
}

.scan-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.scan-title {
  gap: 7px;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.scan-title .el-icon {
  color: var(--el-color-primary);
  font-size: 17px;
}

.scan-tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.scan-row {
  display: flex;
  gap: 10px;
}

.scan-row .el-input {
  flex: 1;
}

.scan-row :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
}

.bind-result-hint {
  margin-bottom: 14px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 2px 0 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.section-heading > div {
  gap: 7px;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.section-heading .el-icon {
  color: var(--el-color-primary);
}

.detail-table {
  overflow: hidden;
  border-radius: 8px;
}

.detail-table :deep(th.el-table__cell),
.history-card :deep(th.el-table__cell) {
  color: var(--el-text-color-regular);
  font-weight: 600;
  background: var(--el-fill-color-light) !important;
}

.label-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 10px;
  overflow: auto;
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 10px;
  background-color: #eef1f6;
  background-image: linear-gradient(45deg, rgb(255 255 255 / 55%) 25%, transparent 25%), linear-gradient(-45deg, rgb(255 255 255 / 55%) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgb(255 255 255 / 55%) 75%), linear-gradient(-45deg, transparent 75%, rgb(255 255 255 / 55%) 75%);
  background-position:
    0 0,
    0 6px,
    6px -6px,
    -6px 0;
  background-size: 12px 12px;
}

.outbound-label {
  position: relative;
  width: 97mm;
  height: 84mm;
  flex: none;
  background: #fff;
  color: #000;
  border: 1px solid #edf0f5;
  box-shadow: 0 12px 28px rgb(31 45 61 / 16%);
  font-family: Arial, 'Microsoft YaHei', sans-serif;
}

.mi-logo {
  position: absolute;
  top: 9mm;
  left: 9mm;
  width: 17mm;
  height: 17mm;
  border-radius: 5mm;
  object-fit: cover;
}

.qr-code {
  position: absolute;
  top: 8mm;
  right: 8mm;
  width: 31mm !important;
  height: 31mm !important;
}

.destination {
  position: absolute;
  left: 10mm;
  right: 8mm;
  bottom: 10mm;
}

.destination-title {
  font-family: 黑体, SimHei, sans-serif;
  font-size: 36px;
  font-weight: bold;
  line-height: 1.15;
}

.destination-line {
  display: flex;
  align-items: last baseline;
  justify-content: space-between;
  gap: 4mm;
  margin-top: 2mm;
}

.destination-name {
  flex: 1;
  font-family: 黑体, SimHei, sans-serif;
  font-size: 36px;
  font-weight: bold;
  line-height: 1.12;
  word-break: break-all;
}

.label-index {
  flex: none;
  font-size: 7mm;
  line-height: 1;
  white-space: nowrap;
  align-self: last baseline;
}

.qr-payload-box {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
}

.qr-payload-label {
  gap: 6px;
  margin-bottom: 5px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.qr-payload-value {
  min-height: 18px;
  color: var(--el-text-color-primary);
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}

.history-card {
  margin-bottom: 12px;
}

.history-filter-panel {
  margin-bottom: 14px;
  padding: 14px 14px 0;
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 9px;
  background: var(--el-fill-color-extra-light);
}

.empty-workspace {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 190px;
  padding: 28px;
  border: 1px dashed var(--el-border-color);
  border-radius: 14px;
  background: color-mix(in srgb, var(--el-bg-color) 88%, transparent);
}

.empty-illustration {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  color: var(--el-color-primary);
  font-size: 29px;
  border-radius: 18px;
  background: var(--el-color-primary-light-9);
}

.empty-title {
  margin-top: 13px;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.empty-description {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

@media (max-width: 1380px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }

  .preview-card {
    position: static;
    max-width: 480px;
  }
}

@media (max-width: 980px) {
  .outbound-bind-page {
    padding: 12px;
  }

  .create-header,
  .create-form-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .flow-steps {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .stat-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .shipping-no {
    grid-column: 1/-1;
  }

  .scan-row {
    flex-wrap: wrap;
  }

  .scan-row .el-input {
    flex-basis: 100%;
  }
}
</style>
