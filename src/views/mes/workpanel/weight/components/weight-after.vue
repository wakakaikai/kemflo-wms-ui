<template>
  <div class="serial-debugger weight-after-container">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="true" class="mb-[10px]">
        <el-card shadow="hover">
          <div class="flex items-center">
            <div class="flex-1 flex items-center gap-6 flex-wrap">
              <div class="flex items-center group">
                <div class="flex items-center min-w-[80px]">
                  <span class="text-red-500 mr-1.5">*</span>
                  <span class="text-sm font-medium text-gray-600 flex items-center min-w-[40px]">
                    <el-icon class="mr-1.5 text-purple-500"><Operation /></el-icon>
                    工序:
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <el-button @click="openOperationDialog" class="dashed-blue-btn min-w-[120px]" size="small">
                    {{ podConfig.operation || '点击选择工序' }}
                  </el-button>
                  <el-button v-if="podConfig.operation" @click="clearSelection('operation')" text size="small" class="!text-gray-400 hover:!text-red-500">
                    <el-icon>
                      <Close />
                    </el-icon>
                  </el-button>
                </div>
              </div>

              <div class="flex items-center group">
                <div class="flex items-center min-w-[80px]">
                  <span class="text-red-500 mr-1.5">*</span>
                  <span class="text-sm font-medium text-gray-600 flex items-center">
                    <el-icon class="mr-1.5 text-blue-500"><Cpu /></el-icon>
                    资源:
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <el-button @click="openResourceDialog" class="dashed-blue-btn min-w-[120px]" size="small">
                    {{ podConfig.resource || '点击选择资源' }}
                  </el-button>
                  <el-button v-if="podConfig.resource" @click="clearSelection('resource')" text size="small" class="!text-gray-400 hover:!text-red-500">
                    <el-icon>
                      <Close />
                    </el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </transition>

    <el-card shadow="hover" class="mb-[10px] barcode-input-card">
      <el-form @submit.prevent>
        <el-form-item label="条码输入" label-width="80px" class="barcode-form-item">
          <el-input ref="sfcInputRef" v-model="sfcInput" placeholder="请扫描或输入产品条码后回车" clearable class="barcode-input-sn" @keydown.tab.prevent="handleSfcEnter" @keydown.enter.prevent="handleSfcEnter" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>测试后称重采集</span>
          <el-tag :type="isConnected ? 'success' : 'info'" size="small">
            {{ isConnected ? `已连接` : '未连接' }}
          </el-tag>
          <div class="dc-btn-group">
            <el-button :type="isConnected ? 'success' : 'info'" size="small" @click="handleConnect" :loading="connecting">
              {{ isConnected ? '关闭串口' : '打开串口' }}
            </el-button>
            <div class="scan-mode-switch">
              <span class="scan-mode-label">先扫码再称重</span>
              <el-switch v-model="scanBeforeWeight" />
            </div>
            <el-button size="small" @click="clearFormData">清空</el-button>
          </div>
        </div>
      </template>

      <el-form ref="queryFormRef" :model="formData" label-width="auto">
        <el-row :gutter="24">
          <el-col :lg="6" :md="8" :sm="24">
            <el-form-item label="工单" prop="shopOrder">
              <el-button class="dashed-blue-btn w-[100%]">
                {{ formData.shopOrder || '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="6" :md="8" :sm="24">
            <el-form-item label="产品" prop="item">
              <el-button class="dashed-blue-btn w-[100%]">
                {{ formData.item || '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="8" :sm="24">
            <el-form-item label="产品描述" prop="itemDesc">
              <el-button class="dashed-blue-btn w-[100%] text-ellipsis">
                {{ formData.itemDesc || '' }}
              </el-button>
            </el-form-item>
          </el-col>

          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="条码" prop="sfc">
              <el-button class="dashed-blue-btn highlight-field w-[100%]">
                {{ formData.sfc || '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="收集组" prop="dcGroup">
              <el-button class="dashed-blue-btn w-[100%]">
                {{ formData.dcGroup || '' }}
              </el-button>
            </el-form-item>
          </el-col>

          <el-col :lg="8" :md="8" :sm="24">
            <el-form-item label="重量" prop="actualWeight">
              <el-button class="dashed-blue-btn highlight-field w-[100%]">
                <strong>{{ formData.actualWeight || '' }}</strong>
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="8" :md="8" :sm="24">
            <el-form-item label="下限" prop="lowLimit">
              <el-button class="dashed-blue-btn w-[100%]">
                {{ formatNumber(formData.lowLimit) }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="8" :md="8" :sm="24">
            <el-form-item label="上限" prop="hightLimit">
              <el-button class="dashed-blue-btn w-[100%]">
                {{ formatNumber(formData.hightLimit) }}
              </el-button>
            </el-form-item>
          </el-col>

          <el-col :lg="6" :md="6" :sm="24">
            <el-form-item label="测试前重" prop="beforeWeight">
              <el-button class="dashed-blue-btn w-[100%]">
                {{ formatNumber(formData.beforeWeight) }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="6" :md="6" :sm="24">
            <el-form-item label="残水值" prop="residualWater">
              <el-button class="dashed-blue-btn highlight-field w-[100%]">
                <strong>{{ formatNumber(formData.residualWater) }}</strong>
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="6" :md="6" :sm="24">
            <el-form-item label="下限" prop="residualLowLimit">
              <el-button class="dashed-blue-btn w-[100%]">
                {{ formatNumber(formData.residualLowLimit) }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="6" :md="6" :sm="24">
            <el-form-item label="上限" prop="residualHighLimit">
              <el-button class="dashed-blue-btn w-[100%]">
                {{ formatNumber(formData.residualHighLimit) }}
              </el-button>
            </el-form-item>
          </el-col>


          <el-col :lg="24" :md="24" :sm="24">
            <div v-if="resultMessage">
              <el-alert show-icon center :title="resultMessage" :type="resultStatus ? 'success' : 'error'" :closable="false">
                <template #icon>
                  <Bell />
                </template>
              </el-alert>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card shadow="never" class="mt-2">
      <template #header>
        <div class="card-header">
          <span>历史数据</span>
          <div>
            <el-button type="info" size="small" @click="clearHistoryData">清空历史</el-button>
          </div>
        </div>
      </template>

      <el-table :data="paginatedHistoryData" style="width: 100%" size="small" max-height="300" border>
        <el-table-column prop="sfc" label="条码" min-width="140" />
        <el-table-column prop="actualWeight" label="重量" min-width="90" />
        <el-table-column prop="lowLimit" label="下限" min-width="80" />
        <el-table-column prop="hightLimit" label="上限" min-width="80" />
        <el-table-column label="结果" min-width="90">
          <template #default="scope">
            <el-tag :type="scope.row.result === 'PASS' ? 'success' : scope.row.result === 'FAIL' ? 'danger' : 'warning'">
              {{ scope.row.result }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="时间" min-width="160" />
        <el-table-column prop="item" label="产品" min-width="120" />
      </el-table>

      <el-pagination v-model:current-page="pagination.currentPage" v-model:page-size="pagination.pageSize" :page-sizes="[10, 20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange" @current-change="handleCurrentChange" style="margin-top: 10px; justify-content: flex-end" />
    </el-card>

    <OperationDialog ref="operationDialogRef" @operation-call-back="operationCallBack" />
    <ResourceDialog ref="resourceDialogRef" @resource-call-back="resourceCallBack" />
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import type { OperationObj, ResourceObj } from '@/components/common-type';
import ResourceDialog from '@/views/mes/workpanel/components/resourceDialog.vue';
import OperationDialog from '@/views/mes/workpanel/components/operationDialog.vue';
import { Bell, Close, Cpu, Operation } from '@element-plus/icons-vue';
import { queryDataCollectionBySfc, querySfcQueueInfo, dataCollectPassSfc } from '@/api/mes/workpanel';
import {
  buildDataCollectPassPayload,
  formatWeightValue,
  findWeightDcParameter,
  findResidualDcParameter
} from '@/api/mes/workpanel/dataCollection/weight-pass';
import { parseTime } from '@/utils/ruoyi';
import { v4 as uuidv4 } from 'uuid';
import { audioPlayer } from '@/utils/audioPlayer';
import { useSerialPort } from '@/hooks/useSerialPort';

const { currentRoute } = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const operationDialogRef = ref<InstanceType<typeof OperationDialog>>();
const resourceDialogRef = ref<InstanceType<typeof ResourceDialog>>();
const sfcInputRef = ref();
const queryFormRef = ref<ElFormInstance>();

const resultMessage = ref('');
const resultStatus = ref(false);
const loading = ref(false);
const scanBeforeWeight = ref(true);
const sfcInput = ref('');
const podConfig = ref<{ [key: string]: any }>({});

interface FormData {
  sfc?: string;
  shopOrder?: string;
  item?: string;
  itemDesc?: string;
  dcGroup?: string;
  dcGroupRevision?: string;
  actualWeight?: string;
  weightUnit?: string;
  lowLimit?: string | number;
  hightLimit?: string | number;
  beforeWeight?: string | number;
  residualWater?: string | number;
  residualLowLimit?: string | number;
  residualHighLimit?: string | number;
  uuid?: string;
  itemBo?: string;
  itemGroupBo?: string;
  weightParam?: any;
  residualParam?: any;
  dcParameterBoList?: any[];
}

const formatNumber = (val: string | number | undefined | null) => {
  return formatWeightValue(val);
};

const extractDcDetailList = (dcRes: any) => {
  const detailList: any[] = [];
  const dcGroupVoList = dcRes.data?.dcGroupVoList || [];
  dcGroupVoList.forEach((group: any) => {
    (group.dcParameterVoList || []).forEach((item: any) => {
      detailList.push({
        ...item,
        dcGroup: group.dcGroup || item.dcGroup,
        dcGroupRevision: item.dcGroupRevision || group.revision,
        firstDescription: group.description
      });
    });
  });
  return detailList;
};

const calcResidualWater = () => {
  const before = parseFloat(String(formData.value.beforeWeight));
  const after = parseFloat(String(formData.value.actualWeight));
  if (isNaN(before) || isNaN(after)) {
    formData.value.residualWater = undefined;
    return;
  }
  // 残水值 = 测试前重 - 测试后重
  formData.value.residualWater = formatWeightValue(before - after);
}

const formData = ref<FormData>({});

interface HistoryRow {
  timestamp: string;
  uuid: string;
  sfc: string;
  actualWeight: string;
  lowLimit: string | number;
  hightLimit: string | number;
  result: 'PASS' | 'FAIL' | 'PENDING';
  item: string;
}

const historyData = ref<HistoryRow[]>([]);

const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

let submitting = false;

const warnVoice = () => audioPlayer.playWarning();
const successVoice = () => audioPlayer.playSuccess();

const focusSfcInput = async () => {
  await nextTick();
  const input = sfcInputRef.value;
  if (input?.focus) {
    input.focus();
    input.select?.();
  }
};

const clearFormData = () => {
  formData.value = {};
  sfcInput.value = '';
  resultMessage.value = '';
  resultStatus.value = false;
  focusSfcInput();
};

const openOperationDialog = () => {
  operationDialogRef.value.openDialog();
};

const operationCallBack = (data: any) => {
  podConfig.value.operation = data.operation;
  podConfig.value.operationDesc = data.description;
  saveOperationToLocalStorage({
    operation: data.operation,
    operationDesc: data.description
  });
};

const openResourceDialog = () => {
  resourceDialogRef.value.openDialog();
};

const resourceCallBack = (data: any) => {
  podConfig.value.resource = data.resrce;
  podConfig.value.resourceDesc = data.description;
  saveResourceToLocalStorage({
    resource: data.resrce,
    resourceDesc: data.description
  });
};

const clearSelection = (type: string) => {
  podConfig.value[type] = '';
  switch (type) {
    case 'resource':
      removeResourceInLocalStorage();
      break;
    case 'operation':
      removeOperationInLocalStorage();
      break;
  }
};

const findPodConfig = () => {
  const resourceCacheObj = getResourceFromLocalStorage();
  if (resourceCacheObj) {
    const { resource, resourceDesc } = resourceCacheObj;
    podConfig.value.resource = resource;
    podConfig.value.resourceDesc = resourceDesc;
  }

  const resOperationObj = getOperationFromLocalStorage();
  if (resOperationObj) {
    const { operation, operationDesc } = resOperationObj;
    podConfig.value.operation = operation;
    podConfig.value.operationDesc = operationDesc;
  }
};

const saveResourceToLocalStorage = (resourceObj: ResourceObj) => {
  const localResource = localStorage.getItem('workPanelResource');
  const preObj = JSON.parse(localResource || '{}');
  const currentObj = {
    ...preObj,
    [currentRoute.value.fullPath]: resourceObj
  };
  localStorage.setItem('workPanelResource', JSON.stringify(currentObj));
};

const getResourceFromLocalStorage = () => {
  const localResource = localStorage.getItem('workPanelResource');
  return localResource ? JSON.parse(localResource)[currentRoute.value.fullPath] : null;
};

const removeResourceInLocalStorage = () => {
  saveResourceToLocalStorage(null);
};

const saveOperationToLocalStorage = (operationObj: OperationObj) => {
  const localOperation = localStorage.getItem('workPanelOperation');
  const preObj = JSON.parse(localOperation || '{}');
  const currentObj = {
    ...preObj,
    [currentRoute.value.fullPath]: operationObj
  };
  localStorage.setItem('workPanelOperation', JSON.stringify(currentObj));
};

const getOperationFromLocalStorage = () => {
  const localOperation = localStorage.getItem('workPanelOperation');
  return localOperation ? JSON.parse(localOperation)[currentRoute.value.fullPath] : null;
};

const removeOperationInLocalStorage = () => {
  saveOperationToLocalStorage(null);
};

const SCAN_BEFORE_WEIGHT_KEY = 'workPanelScanBeforeWeight';
const loadScanBeforeWeight = () => {
  try {
    const cache = JSON.parse(localStorage.getItem(SCAN_BEFORE_WEIGHT_KEY) || '{}');
    if (typeof cache[currentRoute.value.fullPath] === 'boolean') {
      scanBeforeWeight.value = cache[currentRoute.value.fullPath];
    }
  } catch (e) {
    // ignore
  }
};
const saveScanBeforeWeight = () => {
  const cache = JSON.parse(localStorage.getItem(SCAN_BEFORE_WEIGHT_KEY) || '{}');
  cache[currentRoute.value.fullPath] = scanBeforeWeight.value;
  localStorage.setItem(SCAN_BEFORE_WEIGHT_KEY, JSON.stringify(cache));
};
watch(scanBeforeWeight, () => {
  saveScanBeforeWeight();
});

const isApiSuccess = (res: any) => res?.code === 200 || res?.success === true;

/** 扫描条码后查询工单信息与数据收集组 */
const handleSfcEnter = async () => {
  const sfc = (sfcInput.value || '').trim();
  sfcInput.value = sfc;
  resultMessage.value = '';
  resultStatus.value = true;

  if (!podConfig.value.operation) {
    resultMessage.value = '请选择对应的工序';
    resultStatus.value = false;
    warnVoice();
    return;
  }
  if (!podConfig.value.resource) {
    resultMessage.value = '请选择对应的资源';
    resultStatus.value = false;
    warnVoice();
    return;
  }
  if (!sfc) {
    resultMessage.value = '请输入产品条码';
    resultStatus.value = false;
    warnVoice();
    return;
  }

  loading.value = true;
  try {
    const queueRes: any = await querySfcQueueInfo({ sfc });
    if (!isApiSuccess(queueRes)) {
      resultMessage.value = queueRes?.msg || queueRes?.message || '条码查询失败';
      resultStatus.value = false;
      warnVoice();
      return;
    }

    const queueInfo = queueRes.data || {};
    formData.value.sfc = queueInfo.sfc || sfc;
    formData.value.shopOrder = queueInfo.shopOrder;
    formData.value.item = queueInfo.item;
    formData.value.itemDesc = queueInfo.itemDesc;
    const keepWeight = !scanBeforeWeight.value && !!formData.value.actualWeight;
    if (!keepWeight) {
      formData.value.actualWeight = undefined;
      formData.value.weightUnit = undefined;
      formData.value.residualWater = undefined;
    }
    formData.value.beforeWeight = undefined;
    formData.value.uuid = undefined;

    if (queueInfo.operation && podConfig.value.operation && queueInfo.operation !== podConfig.value.operation) {
      const queueOpDesc = queueInfo.operationDesc ? `（${queueInfo.operationDesc}）` : '';
      const currentOp = podConfig.value.operation;
      const currentOpDesc = podConfig.value.operationDesc ? `(${podConfig.value.operationDesc})` : '';
      resultMessage.value = `条码${formData.value.sfc || sfc}当前排队工序为：${queueInfo.operation}${queueOpDesc}，与当前工序${currentOp}${currentOpDesc}不一致`;
      resultStatus.value = false;
      warnVoice();
      return;
    }

    const dcRes: any = await queryDataCollectionBySfc({
      sfc: formData.value.sfc,
      operation: podConfig.value.operation,
      resource: podConfig.value.resource
    });

    if (!isApiSuccess(dcRes)) {
      resultMessage.value = dcRes?.msg || dcRes?.message || '数据收集组查询失败';
      resultStatus.value = false;
      warnVoice();
      return;
    }

    formData.value.itemBo = dcRes.data?.itemBo;
    formData.value.itemGroupBo = dcRes.data?.itemGroupBo;

    const detailList = extractDcDetailList(dcRes);

    if (detailList.length === 0) {
      resultMessage.value = '数据收集参数列表为空，请联系QE维护资料';
      resultStatus.value = false;
      formData.value.dcGroup = undefined;
      formData.value.lowLimit = undefined;
      formData.value.hightLimit = undefined;
      formData.value.residualLowLimit = undefined;
      formData.value.residualHighLimit = undefined;
      formData.value.dcParameterBoList = [];
      warnVoice();
      return;
    }

    const weightParam = findWeightDcParameter(detailList);
    const residualParam = findResidualDcParameter(detailList);

    formData.value.weightParam = weightParam;
    formData.value.residualParam = residualParam;
    formData.value.dcGroup = weightParam.dcGroup || (weightParam.dcGroupAndRevision || '').split('/')[0] || '';
    formData.value.dcGroupRevision = weightParam.dcGroupRevision;
    formData.value.lowLimit = weightParam.minValue;
    formData.value.hightLimit = weightParam.maxValue;
    formData.value.residualLowLimit = residualParam?.minValue;
    formData.value.residualHighLimit = residualParam?.maxValue;
    formData.value.dcParameterBoList = detailList;
    formData.value.weightUnit = weightParam.units || '';

    // 测试前重量由后端在 WGT-AF 查询时一并返回
    const beforeWeight = dcRes.data?.beforeWeight;
    formData.value.beforeWeight =
      beforeWeight === null || beforeWeight === undefined || beforeWeight === '' ? undefined : formatWeightValue(beforeWeight);

    if (formData.value.beforeWeight === undefined || formData.value.beforeWeight === null || formData.value.beforeWeight === '') {
      resultMessage.value = '未获取到测试前重量，请确认已完成测试前称重';
      resultStatus.value = false;
      warnVoice();
      return;
    }

    sfcInput.value = '';
    if (formData.value.actualWeight) {
      resultMessage.value = '条码校验成功，正在上传';
      resultStatus.value = true;
      await submitForm(true);
    } else {
      resultMessage.value = '';
      resultStatus.value = true;
    }
  } catch (error: any) {
    resultMessage.value = error?.message || '条码处理失败';
    resultStatus.value = false;
    warnVoice();
  } finally {
    loading.value = false;
    focusSfcInput();
  }
};

const pushHistory = (result: HistoryRow['result']) => {
  const uuid = formData.value.uuid || uuidv4();
  historyData.value.push({
    timestamp: parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}'),
    uuid,
    sfc: formData.value.sfc || '',
    actualWeight: formData.value.actualWeight || '',
    lowLimit: formData.value.lowLimit ?? '',
    hightLimit: formData.value.hightLimit ?? '',
    result,
    item: formData.value.item || ''
  });
  pagination.value.total = historyData.value.length;
  return uuid;
};

const validateBeforeSubmit = () => {
  resultStatus.value = true;
  resultMessage.value = '';

  if (!podConfig.value.operation) {
    resultMessage.value = '请选择对应的工序';
    resultStatus.value = false;
    return false;
  }
  if (!podConfig.value.resource) {
    resultMessage.value = '请选择对应的资源';
    resultStatus.value = false;
    return false;
  }
  if (!formData.value.sfc) {
    resultMessage.value = '请先扫描产品条码';
    resultStatus.value = false;
    return false;
  }
  if (!(formData.value.dcParameterBoList || []).length) {
    resultMessage.value = '未获取到数据收集组，请联系QE维护资料';
    resultStatus.value = false;
    return false;
  }
  if (!formData.value.actualWeight) {
    resultMessage.value = '未获取到重量数据，请检查电子秤是否正常';
    resultStatus.value = false;
    return false;
  }
  if (formData.value.beforeWeight === undefined || formData.value.beforeWeight === null || formData.value.beforeWeight === '') {
    resultMessage.value = '未获取到测试前重量，请确认已完成测试前称重';
    resultStatus.value = false;
    return false;
  }

  calcResidualWater();

  const actualWeight = parseFloat(String(formData.value.actualWeight));
  const lowLimit = parseFloat(String(formData.value.lowLimit));
  const highLimit = parseFloat(String(formData.value.hightLimit));

  if (!isNaN(actualWeight) && !isNaN(lowLimit) && !isNaN(highLimit)) {
    if (actualWeight < lowLimit || actualWeight > highLimit) {
      resultMessage.value = `重量${actualWeight}超出范围[${lowLimit}~${highLimit}]`;
      resultStatus.value = false;
      return false;
    }
  }

  const residualWater = parseFloat(String(formData.value.residualWater));
  const residualLow = parseFloat(String(formData.value.residualLowLimit));
  const residualHigh = parseFloat(String(formData.value.residualHighLimit));
  if (!isNaN(residualWater) && !isNaN(residualLow) && !isNaN(residualHigh)) {
    if (residualWater < residualLow || residualWater > residualHigh) {
      resultMessage.value = `残水值${residualWater}超出范围[${residualLow}~${residualHigh}]`;
      resultStatus.value = false;
      return false;
    }
  }
  return true;
};

const resetAfterCycle = () => {
  const msg = resultMessage.value;
  const status = resultStatus.value;
  formData.value = {};
  sfcInput.value = '';
  resultMessage.value = msg;
  resultStatus.value = status;
};

const submitForm = async (auto = false) => {
  if (submitting) {
    return;
  }
  if (!validateBeforeSubmit()) {
    pushHistory('FAIL');
    warnVoice();
    // 避免电子秤连续上报导致重复判定
    resetAfterCycle();
    focusSfcInput();
    return;
  }

  submitting = true;
  loading.value = true;
  try {
    calcResidualWater();
    const sourceList = formData.value.dcParameterBoList || [];
    const weightDetail = formData.value.weightParam || findWeightDcParameter(sourceList);
    const residualDetail = formData.value.residualParam;
    const weightValue = formatWeightValue(formData.value.actualWeight);
    const residualValue = formatWeightValue(formData.value.residualWater);
    const detailList = sourceList.map((item: any) => {
      let actualValue = item.actualValue;
      if (item === weightDetail || item.handle === weightDetail?.handle) {
        actualValue = weightValue;
      } else if (residualDetail && (item === residualDetail || item.handle === residualDetail?.handle)) {
        actualValue = residualValue;
      }
      return {
        ...item,
        actualValue
      };
    });

    const payload = buildDataCollectPassPayload(
      {
        sfc: formData.value.sfc,
        shopOrder: formData.value.shopOrder,
        operation: podConfig.value.operation,
        resource: podConfig.value.resource,
        itemBo: formData.value.itemBo,
        itemGroupBo: formData.value.itemGroupBo
      },
      detailList
    );
    if (!(payload.dcParameterBoList || []).length) {
      resultMessage.value = '数据收集参数实际值不能为空';
      resultStatus.value = false;
      pushHistory('FAIL');
      warnVoice();
      resetAfterCycle();
      return;
    }

    const res: any = await dataCollectPassSfc(payload);

    if (isApiSuccess(res)) {
      pushHistory('PASS');
      resultStatus.value = true;
      resultMessage.value = res.msg || res.message || '数据上传成功';
      successVoice();
      resetAfterCycle();
    } else {
      pushHistory('FAIL');
      resultMessage.value = res.msg || res.message || '数据上传失败';
      resultStatus.value = false;
      warnVoice();
      resetAfterCycle();
    }
  } catch (error: any) {
    pushHistory('FAIL');
    resultMessage.value = error?.message || '数据上传失败';
    resultStatus.value = false;
    warnVoice();
    resetAfterCycle();
  } finally {
    loading.value = false;
    submitting = false;
    focusSfcInput();
  }
};

const processDataPacket = (packet: string) => {
  let processedWeight = '';
  let unit = '';
  const trimmedData = packet.trim();

  if (trimmedData.startsWith('=')) {
    const reversedStr = trimmedData.split('').reverse().join('');
    processedWeight = reversedStr.replace(/[=+\s]/g, '');
  } else {
    processedWeight = trimmedData.replace(/[a-z\s]/g, '');
    unit = trimmedData.replace(/[^a-zA-Z]/g, '');
  }

  if (processedWeight && !isNaN(Number(processedWeight))) {
    processedWeight = formatWeightValue(processedWeight);
  }

  if (scanBeforeWeight.value && !formData.value.sfc) {
    resultMessage.value = '请先扫描条码再称重';
    resultStatus.value = false;
    warnVoice();
    return;
  }

  formData.value.actualWeight = processedWeight;
  formData.value.weightUnit = unit || formData.value.weightUnit;
  formData.value.uuid = uuidv4();
  calcResidualWater();

  if (formData.value.sfc && processedWeight) {
    submitForm(true);
  }
};

const { isConnected, connecting, handleConnect, disconnect, checkBrowserSupport, setupListeners, teardownListeners } =
  useSerialPort(processDataPacket);

const paginatedHistoryData = computed(() => {
  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  return historyData.value.slice().reverse().slice(start, end);
});

const handleSizeChange = (val: number) => {
  pagination.value.pageSize = val;
  pagination.value.currentPage = 1;
};

const handleCurrentChange = (val: number) => {
  pagination.value.currentPage = val;
};

const clearHistoryData = () => {
  historyData.value = [];
  pagination.value.total = 0;
  pagination.value.currentPage = 1;
};

onMounted(() => {
  const routerPath = currentRoute.value.fullPath;
  const lastSegment = routerPath.split('/').pop();
  const resOperationObj = getOperationFromLocalStorage();
  if (!resOperationObj) {
    if (lastSegment === 'WGT-AF' || lastSegment === 'weight-after') {
      saveOperationToLocalStorage({
        operation: 'WGT-AF',
        operationDesc: '功能测试后称重'
      });
    }
  }

  findPodConfig();
  loadScanBeforeWeight();
  disconnect(true);
  checkBrowserSupport();
  setupListeners();
  focusSfcInput();
});

onBeforeUnmount(async () => {
  await teardownListeners();
});
</script>

<style scoped>
.dashed-blue-btn.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dashed-blue-btn {
  border: 1px dashed #3b82f6 !important;
  color: #3b82f6 !important;
  background-color: rgba(59, 130, 246, 0.05) !important;
  justify-content: flex-start;
}

.dashed-blue-btn:hover {
  border-color: #2563eb !important;
  color: #2563eb !important;
  background-color: rgba(59, 130, 246, 0.1) !important;
}

.highlight-field {
  background-color: #fff8dc !important;
  border-color: #e6c35c !important;
  color: #92400e !important;
}

.serial-debugger {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.scan-mode-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 8px;
}
.scan-mode-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}
.dc-btn-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
}

.text-white {
  color: white !important;
}

.barcode-input :deep(.el-input__wrapper) {
  min-height: 42px;
  background-color: #fff8dc;
}

.barcode-input-sn :deep(.el-input__wrapper) {
  min-height: 42px;
}

.barcode-input-card :deep(.barcode-form-item.el-form-item) {
  margin-bottom: 0;
}
</style>
