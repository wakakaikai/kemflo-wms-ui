<template>
  <div class="serial-debugger weight-pack-container">
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
                  <el-button class="dashed-blue-btn min-w-[120px]" size="small">
                    {{ podConfig.operation || '' }}
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
        <el-form-item label="条码" label-width="80px" class="barcode-form-item">
          <el-input ref="sfcInputRef" v-model="sfcInput" placeholder="请扫描或输入产品条码后回车" clearable class="barcode-input-sn" @keydown.tab.prevent="handleSfcEnter" @keydown.enter.prevent="handleSfcEnter" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>包装称重采集</span>
          <el-tag :type="isConnected ? 'success' : 'info'" size="small">
            {{ isConnected ? '已连接' : '未连接' }}
          </el-tag>
          <div class="dc-btn-group">
            <el-button :type="isConnected ? 'danger' : 'info'" size="small" @click="handleConnect" :loading="connecting">
              {{ isConnected ? '关闭串口' : '打开串口' }}
            </el-button>
            <el-button size="small" @click="clearFormData">清空</el-button>
            <label class="mode-chip" :class="{ 'is-on': scanBeforeWeight }">
              <el-checkbox v-model="scanBeforeWeight" />
              <span class="mode-chip-flow">
                <span class="mode-chip-n">1</span>
                <span>扫码</span>
                <span class="mode-chip-arrow">→</span>
                <span class="mode-chip-n">2</span>
                <span>称重</span>
              </span>
            </label>
          </div>
        </div>
      </template>

      <el-steps v-show="steps.length" :active="stepActive" finish-status="success" class="py-2">
        <el-step v-for="item in steps" :key="item.stepId" :title="item.operation" :description="item.operationDesc" />
      </el-steps>

      <el-form ref="queryFormRef" :model="formData" label-width="auto">
        <el-row :gutter="24">
          <el-col :lg="6" :md="8" :sm="24">
            <el-form-item label="工单号" prop="shopOrder">
              <el-button class="dashed-blue-btn w-[100%]" title="点击复制" @click="copyText(formData.shopOrder)">
                {{ formData.shopOrder || '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="6" :md="8" :sm="24">
            <el-form-item label="产品编码" prop="item">
              <el-button class="dashed-blue-btn w-[100%]" title="点击复制" @click="copyText(formData.item)">
                {{ formData.item || '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="8" :sm="24">
            <el-form-item label="产品描述" prop="itemDesc">
              <el-button class="dashed-blue-btn w-[100%] text-ellipsis" title="点击复制" @click="copyText(formData.itemDesc)">
                {{ formData.itemDesc || '' }}
              </el-button>
            </el-form-item>
          </el-col>

          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="条码" prop="sfc">
              <el-button class="dashed-blue-btn highlight-field w-[100%]" title="点击复制" @click="copyText(formData.sfc)">
                {{ formData.sfc || '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="收集组" prop="dcGroup">
              <el-button class="dashed-blue-btn w-[100%]" title="点击复制" @click="copyText(formData.dcGroup)">
                {{ formData.dcGroup || '' }}
              </el-button>
            </el-form-item>
          </el-col>

          <el-col :lg="8" :md="8" :sm="24">
            <el-form-item label="重量" prop="actualWeight">
              <el-button class="dashed-blue-btn highlight-field w-[100%]" title="点击复制" @click="copyText(formData.actualWeight)">
                <strong>{{ formData.actualWeight || '' }}</strong>
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="8" :md="8" :sm="24">
            <el-form-item label="下限" prop="lowLimit">
              <el-button class="dashed-blue-btn w-[100%]" title="点击复制" @click="copyText(formData.lowLimit)">
                {{ formData.lowLimit !== undefined && formData.lowLimit !== null && formData.lowLimit !== '' ? parseFloat(formData.lowLimit) : '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="8" :md="8" :sm="24">
            <el-form-item label="上限" prop="hightLimit">
              <el-button class="dashed-blue-btn w-[100%]" title="点击复制" @click="copyText(formData.hightLimit)">
                {{ formData.hightLimit !== undefined && formData.hightLimit !== null && formData.hightLimit !== '' ? parseFloat(formData.hightLimit) : '' }}
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
        <el-table-column prop="timestamp" label="时间" min-width="160" />
        <el-table-column prop="sfc" label="条码" min-width="140" />
        <el-table-column prop="item" label="产品编码" min-width="120" />
        <el-table-column prop="itemDesc" label="物料描述" min-width="150" />
        <el-table-column prop="actualWeight" label="重量" min-width="90" />
        <el-table-column prop="lowLimit" label="下限" min-width="80" />
        <el-table-column prop="hightLimit" label="上限" min-width="80" />
        <el-table-column label="结果" min-width="80">
          <template #default="scope">
            <el-tag :type="scope.row.result === 'PASS' ? 'success' : scope.row.result === 'FAIL' ? 'danger' : 'warning'">
              {{ scope.row.result === 'PASS' ? '成功' : scope.row.result === 'FAIL' ? '失败' : scope.row.result }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination v-model:current-page="pagination.currentPage" v-model:page-size="pagination.pageSize" :page-sizes="[10, 20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange" @current-change="handleCurrentChange" style="margin-top: 10px; justify-content: flex-end" />
    </el-card>

    <ResourceDialog ref="resourceDialogRef" @resource-call-back="resourceCallBack" />
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import type { OperationObj, ResourceObj } from '@/components/common-type';
import ResourceDialog from '@/views/mes/workpanel/components/resourceDialog.vue';
import { Bell, Close, Cpu, Operation } from '@element-plus/icons-vue';
import { queryDataCollectionBySfc, querySfcQueueInfo, querySfcProcessList, dataCollectPassSfc } from '@/api/mes/workpanel';
import { buildDataCollectPassPayload, formatWeightValue, findWeightDcParameter } from '@/api/mes/workpanel/dataCollection/weight-pass';
import { parseTime } from '@/utils/ruoyi';
import { copyText } from '@/utils/copy';
import { weightHistoryDB } from '@/utils/indexedDB';
import { v4 as uuidv4 } from 'uuid';
import { audioPlayer } from '@/utils/audioPlayer';
import { useSerialPort } from '@/hooks/useSerialPort';

const { currentRoute } = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const resourceDialogRef = ref<InstanceType<typeof ResourceDialog>>();
const sfcInputRef = ref();
const queryFormRef = ref<ElFormInstance>();

const resultMessage = ref('');
const resultStatus = ref(false);
const loading = ref(false);
const scanBeforeWeight = ref(true);
const sfcInput = ref('');
const podConfig = ref<{ [key: string]: any }>({});
/** 重量超范围失败后保留页面；收到新重量时用于清空条码信息 */
let pendingRangeFail = false;
/** 防止串口连续上报同一条码+重量时反复自动提交 */
let lastAutoSubmitKey = '';

const steps = ref<any[]>([]);
const stepActive = ref(0);

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
  uuid?: string;
  itemBo?: string;
  itemGroupBo?: string;
  dcParameterBoList?: any[];
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
  itemDesc: string;
  item: string;
}

const historyData = ref<HistoryRow[]>([]);

const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

/** 历史数据本地数据库：按路由隔离，仅保留近 7 天（IndexedDB） */
const HISTORY_DAYS = 7;

/** 过滤出近 HISTORY_DAYS 天的记录 */
const filterHistoryByDays = (list: HistoryRow[]) => {
  const cutoff = Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000;
  return (list || []).filter((row: HistoryRow) => {
    const time = row.timestamp ? new Date(String(row.timestamp).replace(/-/g, '/')).getTime() : 0;
    return Number.isFinite(time) && time >= cutoff;
  });
};

const historyStoreKey = () => currentRoute.value.fullPath;

const loadHistoryFromDb = async () => {
  try {
    const list = (await weightHistoryDB.get<HistoryRow[]>(historyStoreKey())) || [];
    return filterHistoryByDays(list);
  } catch (e) {
    return [];
  }
};

const saveHistoryToDb = () => {
  try {
    void weightHistoryDB.set(historyStoreKey(), filterHistoryByDays(historyData.value));
  } catch (e) {
    // ignore
  }
};

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
  pendingRangeFail = false;
  lastAutoSubmitKey = '';
  formData.value = {};
  steps.value = [];
  stepActive.value = 0;
  sfcInput.value = '';
  resultMessage.value = '';
  resultStatus.value = false;
  focusSfcInput();
};

const RESOURCE_TYPE = 'WGT-PACK';

const openResourceDialog = () => {
  resourceDialogRef.value.openDialog({ resourceType: RESOURCE_TYPE });
};

const resourceCallBack = (data: any) => {
  podConfig.value.resource = data.resrce;
  podConfig.value.resourceDesc = data.description;
  saveResourceToLocalStorage({
    resource: data.resrce,
    resourceDesc: data.description,
    resourceType: RESOURCE_TYPE
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

const SCAN_PACK_WEIGHT_KEY = 'workPanelPackWeight';
const loadScanBeforeWeight = () => {
  try {
    const cache = JSON.parse(localStorage.getItem(SCAN_PACK_WEIGHT_KEY) || '{}');
    if (typeof cache[currentRoute.value.fullPath] === 'boolean') {
      scanBeforeWeight.value = cache[currentRoute.value.fullPath];
    }
  } catch (e) {
    // ignore
  }
};
const saveScanBeforeWeight = () => {
  const cache = JSON.parse(localStorage.getItem(SCAN_PACK_WEIGHT_KEY) || '{}');
  cache[currentRoute.value.fullPath] = scanBeforeWeight.value;
  localStorage.setItem(SCAN_PACK_WEIGHT_KEY, JSON.stringify(cache));
};
watch(scanBeforeWeight, () => {
  saveScanBeforeWeight();
  // 开关切换时清空真实重量，避免模式切换后沿用旧读数
  formData.value.actualWeight = undefined;
  formData.value.weightUnit = undefined;
  lastAutoSubmitKey = '';
  if (resultMessage.value === '请先扫描条码再称重') {
    resultMessage.value = '';
    resultStatus.value = true;
  }
});

const isApiSuccess = (res: any) => res?.code === 200 || res?.success === true;

/** 扫描条码后查询工单信息与数据收集组 */
const handleSfcEnter = async () => {
  const sfc = (sfcInput.value || '').trim();
  sfcInput.value = sfc;
  resultMessage.value = '';
  resultStatus.value = true;
  pendingRangeFail = false;
  lastAutoSubmitKey = '';
  // 开始新的扫描：清空上次条码的排队步骤与采集属性，避免残留旧值
  steps.value = [];
  stepActive.value = 0;
  // 先扫码后称重：扫描新条码时自动清空上次重量，等待重新称重
  if (scanBeforeWeight.value) {
    formData.value.actualWeight = undefined;
    formData.value.weightUnit = undefined;
  }
  formData.value.sfc = undefined;
  formData.value.shopOrder = undefined;
  formData.value.item = undefined;
  formData.value.itemDesc = undefined;
  formData.value.dcGroup = undefined;
  formData.value.dcGroupRevision = undefined;
  formData.value.lowLimit = undefined;
  formData.value.hightLimit = undefined;
  formData.value.dcParameterBoList = [];
  formData.value.uuid = undefined;
  formData.value.itemBo = undefined;
  formData.value.itemGroupBo = undefined;

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
    const queueRes: any = await querySfcQueueInfo({ sfc }).catch((e) => {
      resultMessage.value = e?.msg || e?.message || '条码查询失败';
      resultStatus.value = false;
      warnVoice();
    });
    const [processListRes, dcRes]: any[] = await Promise.all([querySfcProcessList({ sfc }).catch(() => null), queryDataCollectionBySfc({ sfc, operation: podConfig.value.operation, resource: podConfig.value.resource }).catch(() => null)]);

    const queueOk = !!queueRes && isApiSuccess(queueRes);
    const queueInfo = queueOk ? queueRes.data || {} : {};
    const dcOk = !!dcRes && isApiSuccess(dcRes);

    // 有结果后先都赋值：队列头部（工单号/产品编码/产品描述/条码）
    formData.value.sfc = queueInfo.sfc || sfc;
    formData.value.shopOrder = queueInfo.shopOrder;
    formData.value.item = queueInfo.item;
    formData.value.itemDesc = queueInfo.itemDesc;
    const keepWeight = !scanBeforeWeight.value && !!formData.value.actualWeight;
    if (!keepWeight) {
      formData.value.actualWeight = undefined;
      formData.value.weightUnit = undefined;
    }
    formData.value.uuid = undefined;

    // 工艺路线排队步骤（接口异常时保持空）
    steps.value = processListRes?.data || [];
    let stepIndex = steps.value.findIndex((item: any) => parseInt(item.qtyInQueue) === 1);
    if (stepIndex === -1) {
      stepIndex = steps.value.length;
    }
    stepActive.value = stepIndex;

    // 数据收集参数（成功才赋值，失败保持空）
    if (dcOk) {
      formData.value.itemBo = dcRes.data?.itemBo;
      formData.value.itemGroupBo = dcRes.data?.itemGroupBo;

      const detailList: any[] = [];
      const responseList = dcRes.data?.dcGroupVoList || [];
      responseList.forEach((group: any) => {
        (group.dcParameterVoList || []).forEach((item: any) => {
          detailList.push({
            ...item,
            firstDescription: group.description,
            dcGroupRevision: item.dcGroupRevision || group.revision
          });
        });
      });

      const weightParam = detailList.length ? detailList.find((item) => item.dataType === 'N') || detailList[0] : undefined;
      if (weightParam) {
        formData.value.dcGroup = weightParam.dcGroup || (weightParam.dcGroupAndRevision || '').split('/')[0] || '';
        formData.value.dcGroupRevision = weightParam.dcGroupRevision;
        formData.value.lowLimit = weightParam.minValue;
        formData.value.hightLimit = weightParam.maxValue;
        formData.value.dcParameterBoList = detailList;
        formData.value.weightUnit = weightParam.units || '';
      } else {
        formData.value.dcParameterBoList = [];
      }
    }

    if (queueInfo.status === 'DONE') {
      resultMessage.value = '条码已完工';
      resultStatus.value = false;
      warnVoice();
      return;
    }

    if (queueInfo.operation && podConfig.value.operation && queueInfo.operation !== podConfig.value.operation) {
      const queueOpDesc = queueInfo.operationDesc ? `（${queueInfo.operationDesc}）` : '';
      const currentOp = podConfig.value.operation;
      const currentOpDesc = podConfig.value.operationDesc ? `(${podConfig.value.operationDesc})` : '';
      resultMessage.value = `条码${formData.value.sfc || sfc}当前排队工序为：${queueInfo.operation}${queueOpDesc}，与当前工序${currentOp}${currentOpDesc}不一致`;
      resultStatus.value = false;
      warnVoice();
      return;
    }

    if (!dcRes) {
      resultMessage.value = '数据收集组查询异常，请检查数据收集参数';
      resultStatus.value = false;
      warnVoice();
      return;
    }
    if (!dcOk) {
      resultMessage.value = dcRes?.msg || dcRes?.message || '数据收集组查询失败';
      resultStatus.value = false;
      warnVoice();
      return;
    }
    if (!(formData.value.dcParameterBoList || []).length) {
      resultMessage.value = '数据收集参数列表为空，请联系QE维护资料';
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
    itemDesc: formData.value.itemDesc || '',
    item: formData.value.item || ''
  });
  pagination.value.total = historyData.value.length;
  saveHistoryToDb();
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

  const actualWeight = parseFloat(String(formData.value.actualWeight));
  const lowLimit = parseFloat(String(formData.value.lowLimit));
  const highLimit = parseFloat(String(formData.value.hightLimit));

  if (!isNaN(actualWeight) && !isNaN(lowLimit) && !isNaN(highLimit)) {
    if (actualWeight < lowLimit || actualWeight > highLimit) {
      resultMessage.value = `条码${formData.value.sfc || ''} 重量${actualWeight}超出范围[${lowLimit}~${highLimit}]`;
      resultStatus.value = false;
      pendingRangeFail = true;
      return false;
    }
  }
  return true;
};

/** 清空条码及相关列表属性（超范围后收到新重量时调用） */
const clearBarcodeInfo = () => {
  formData.value.sfc = undefined;
  formData.value.shopOrder = undefined;
  formData.value.item = undefined;
  formData.value.itemDesc = undefined;
  formData.value.dcGroup = undefined;
  formData.value.dcGroupRevision = undefined;
  formData.value.lowLimit = undefined;
  formData.value.hightLimit = undefined;
  formData.value.dcParameterBoList = [];
  formData.value.uuid = undefined;
  formData.value.itemBo = undefined;
  formData.value.itemGroupBo = undefined;
  steps.value = [];
  stepActive.value = 0;
  sfcInput.value = '';
};

const resetAfterCycle = (clearForm = true) => {
  const msg = resultMessage.value;
  const status = resultStatus.value;
  if (clearForm) {
    // 仅提交成功后清空页面属性；失败时保留供比对数量
    pendingRangeFail = false;
    lastAutoSubmitKey = '';
    formData.value = {};
    steps.value = [];
    stepActive.value = 0;
  }
  // 失败时保留页面属性；串口同读数仍会更新重量，但不重复自动提交
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
    // 校验失败保留页面属性，方便比对数量
    resetAfterCycle(false);
    focusSfcInput();
    return;
  }

  submitting = true;
  loading.value = true;
  try {
    const sourceList = formData.value.dcParameterBoList || [];
    const weightDetail = findWeightDcParameter(sourceList);
    const weightValue = formatWeightValue(formData.value.actualWeight);
    const detailList = sourceList.map((item: any) => ({
      ...item,
      actualValue: item === weightDetail || item.handle === weightDetail?.handle ? weightValue : item.actualValue
    }));

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
      resetAfterCycle(false);
      return;
    }

    const res: any = await dataCollectPassSfc(payload);

    if (isApiSuccess(res)) {
      pushHistory('PASS');
      resultStatus.value = true;
      resultMessage.value = `条码${formData.value.sfc || ''}${res.msg || res.message || '数据上传成功'}`;
      successVoice();
      resetAfterCycle(true);
    } else {
      pushHistory('FAIL');
      resultMessage.value = `条码${formData.value.sfc || ''}${res.msg || res.message || '数据上传失败'}`;
      resultStatus.value = false;
      warnVoice();
      resetAfterCycle(false);
    }
  } catch (error: any) {
    pushHistory('FAIL');
    resultMessage.value = error?.message || '数据上传失败';
    resultStatus.value = false;
    warnVoice();
    resetAfterCycle(false);
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
    processedWeight = parseFloat(processedWeight).toString();
  }

  // 超范围失败后：仅当收到与当前不同的新重量时，才清空条码列表信息
  if (pendingRangeFail && String(processedWeight) !== String(formData.value.actualWeight ?? '')) {
    pendingRangeFail = false;
    clearBarcodeInfo();
    lastAutoSubmitKey = '';
  }

  if (scanBeforeWeight.value && !formData.value.sfc) {
    // 先扫码再称重开启时收到重量：清空残留读数，避免未扫码却展示重量
    formData.value.actualWeight = undefined;
    formData.value.weightUnit = undefined;
    const msg = '请先扫描条码再称重';
    if (resultMessage.value !== msg) {
      resultMessage.value = msg;
      resultStatus.value = false;
      warnVoice();
    }
    return;
  }

  // 每次串口数据都更新实际重量
  formData.value.actualWeight = processedWeight;
  formData.value.weightUnit = unit || formData.value.weightUnit;
  formData.value.uuid = uuidv4();

  if (formData.value.sfc && processedWeight) {
    const submitKey = `${formData.value.sfc}::${processedWeight}`;
    // 同一条码+同一重量不重复自动提交（串口可能连续上报）
    if (submitKey !== lastAutoSubmitKey) {
      lastAutoSubmitKey = submitKey;
      submitForm(true);
    }
  }
};

const { isConnected, connecting, handleConnect, disconnect, checkBrowserSupport, setupListeners, teardownListeners } = useSerialPort(processDataPacket);

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
  void weightHistoryDB.remove(historyStoreKey());
};

onMounted(() => {
  const routerPath = currentRoute.value.fullPath;
  const lastSegment = routerPath.split('/').pop();
  const resOperationObj = getOperationFromLocalStorage();
  if (!resOperationObj) {
    if (lastSegment === 'WGT-PACK' || lastSegment === 'weight-pack') {
      saveOperationToLocalStorage({
        operation: 'WGT-PACK',
        operationDesc: '包装称重'
      });
    }
  }

  findPodConfig();
  loadScanBeforeWeight();
  loadHistoryFromDb().then((list) => {
    historyData.value = list;
    pagination.value.total = list.length;
  });
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
  user-select: text !important;
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

.dc-btn-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.mode-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  margin-left: 4px;
  padding: 0 10px 0 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
  cursor: pointer;
  user-select: none;
  color: var(--el-text-color-regular);
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.mode-chip.is-on {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #1d4ed8;
}

.mode-chip-flow {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
}

.mode-chip-n {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  background: #e5e7eb;
  color: #4b5563;
}

.mode-chip.is-on .mode-chip-n {
  background: #3b82f6;
  color: #fff;
}

.mode-chip-arrow {
  margin: 0 2px;
  color: #9ca3af;
}

.mode-chip.is-on .mode-chip-arrow {
  color: #60a5fa;
}

.mode-chip :deep(.el-checkbox) {
  height: auto;
  margin-right: 0;
}

.mode-chip :deep(.el-checkbox__label) {
  display: none;
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
