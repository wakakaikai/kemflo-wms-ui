<template>
  <div class="serial-debugger weight-no-sn-container">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="true" class="mb-[10px]">
        <!-- 工序资源展示区域 -->
        <el-card shadow="hover">
          <div class="flex items-center">
            <!-- 工序资源展示区 -->
            <div class="flex-1 flex items-center gap-6 flex-wrap">
              <!-- 工序区块 -->
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

              <!-- 资源区块 -->
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
    <el-card shadow="hover" class="weight-form-card">
      <template #header>
        <div class="card-header">
          <span>称重采集</span>
          <el-tag :type="isConnected ? 'success' : 'info'" size="small">
            {{ isConnected ? `已连接` : '未连接' }}
          </el-tag>
          <div class="dc-btn-group">
            <div class="serial-debugger" tabindex="0" @keydown.enter="submitForm"></div>
            <el-button :type="isConnected ? 'success' : 'info'" size="small" @click="handleConnect" :loading="connecting">
              {{ isConnected ? '关闭串口' : '打开串口' }}
            </el-button>
            <el-button size="small" @click="getDataCollectionByShopOrder"> 刷新 </el-button>
            <el-button color="#10b981" class="text-white" size="small" @click="submitForm" :loading="loading"> <span class="truncate">手动提交</span> </el-button>
            <el-checkbox v-model="autoUpload">自动上传</el-checkbox>
          </div>
        </div>
      </template>

      <el-form ref="queryFormRef" :model="workOrderQueryParams" :rules="workOrderRules" label-width="auto">
        <el-row :gutter="24">
          <el-col :lg="8" :md="8" :sm="24">
            <el-form-item label="工单号码" prop="shopOrder">
              <HistoryInput ref="workOrderInputRef" v-model.trim="workOrderQueryParams.shopOrder" :config="shopOrderConfig" placeholder="请输入工单号码">
                <template #append>
                  <el-button icon="Search" @click="openShopOrderDialog" />
                </template>
              </HistoryInput>
            </el-form-item>
          </el-col>
          <el-col :lg="5" :md="5" :sm="24">
            <el-form-item label="产品料号:" prop="plannedItem">
              <el-button class="dashed-blue-btn w-[100%]">
                {{ workOrderQueryParams.plannedItem || '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="11" :md="11" :sm="24">
            <el-form-item label="产品描述:" prop="itemDesc">
              <el-button class="dashed-blue-btn w-[100%] text-ellipsis">
                {{ workOrderQueryParams.itemDesc || '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="8" :md="8" :sm="24">
            <el-form-item label="数据收集组:" prop="dcGroup">
              <el-button class="dashed-blue-btn w-[100%]">
                {{ workOrderQueryParams.dcGroup || '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="5" :md="5" :sm="24">
            <el-form-item label="产品总数:" prop="qtyToBuild">
              <el-button class="dashed-blue-btn w-[100%]">
                {{ workOrderQueryParams.qtyToBuild ? parseFloat(workOrderQueryParams.qtyToBuild) : '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="5" :md="5" :sm="24" :offset="0">
            <el-form-item label="已称重产品数:" prop="doneWeightQty">
              <el-button class="dashed-blue-btn w-[100%]">
                {{ workOrderQueryParams.doneWeightQty || '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="5" :md="5" :sm="24" :offset="1">
            <el-form-item label="已称重箱数:" prop="doneBoxQty">
              <el-button class="dashed-blue-btn w-[100%]">
                {{ workOrderQueryParams.doneBoxQty || '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="8" :md="8" :sm="24">
            <el-form-item label="重量:" prop="actualWeight">
              <el-button class="dashed-blue-btn w-[100%]">
                <strong> {{ `${workOrderQueryParams.actualWeight || ''} ${workOrderQueryParams.weightUnit || ''}` }}</strong>
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="5" :md="5" :sm="24">
            <el-form-item label="下限:" prop="itemDesc">
              <el-button class="dashed-blue-btn w-[100%]">
                {{ workOrderQueryParams.lowLimit ? parseFloat(workOrderQueryParams.lowLimit) : '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="5" :md="5" :sm="24">
            <el-form-item label="上限:" prop="itemDesc">
              <el-button class="dashed-blue-btn w-[100%]">
                {{ workOrderQueryParams.hightLimit ? parseFloat(workOrderQueryParams.hightLimit) : '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="5" :md="5" :sm="24" :offset="1">
            <el-form-item label="装箱数量:" prop="boxQty">
              <el-select v-model="workOrderQueryParams.boxQty" @change="handleBoxQtyChange">
                <el-option v-for="(option, index) in boxQtyOptions" :key="option.value" :label="option.label" :value="index" />
              </el-select>
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
            <el-button type="info" size="small" @click="clearHistoryData"> 清空历史 </el-button>
          </div>
        </div>
      </template>

      <el-table :data="paginatedHistoryData" style="width: 100%" size="small" max-height="300" border>
        <el-table-column prop="timestamp" label="时间" min-width="160" />
        <el-table-column prop="shopOrder" label="工单号" min-width="140" />
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

      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 10px; justify-content: flex-end"
      />
    </el-card>

    <!-- 弹框 -->
    <ShopOrderDialog ref="shopOrderDialogRef" :podConfig="podConfig" @shop-order-call-back="shopOrderCallBack" />
    <ResourceDialog ref="resourceDialogRef" @resource-call-back="resourceCallBack" />
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { ShopOrderForm, ShopOrderQuery, ShopOrderVO } from '@/api/mes/shopOrder/types';
import type { OperationObj, ResourceObj } from '@/components/common-type';
import ShopOrderDialog from '@/views/mes/workpanel/components/shopOrderDialog.vue';
import ResourceDialog from '@/views/mes/workpanel/components/resourceDialog.vue';
import { Close, Cpu, Operation, Bell } from '@element-plus/icons-vue';
import { queryDataCollectionByShopOrder, saveShopOrderWeightNoSn, getShopOrderWeightNoSnInfo } from '@/api/mes/workpanel';
import { parseTime } from '@/utils/ruoyi';
import { weightHistoryDB } from '@/utils/indexedDB';
import { v4 as uuidv4 } from 'uuid';
import { audioPlayer } from '@/utils/audioPlayer';
import { useSerialPort } from '@/hooks/useSerialPort';
import HistoryInput from '@/components/HistoryInput/index.vue';
import type { HistoryConfig } from '@/types/history';

const { currentRoute } = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const resourceDialogRef = ref<InstanceType<typeof ResourceDialog>>();
const shopOrderDialogRef = ref<InstanceType<typeof ShopOrderDialog>>();
const workOrderInputRef = ref<InstanceType<typeof HistoryInput>>();

const shopOrderConfig: HistoryConfig = {
  key: 'shopOrder',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'weight-no-sn',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

const resultMessage = ref('');
const resultStatus = ref(false);

interface HistoryRow {
  timestamp: string;
  uuid: string;
  shopOrder: string;
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

const pushHistory = (result: HistoryRow['result']) => {
  const uuid = workOrderQueryParams.value.uuid || uuidv4();
  historyData.value.push({
    timestamp: parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}'),
    uuid,
    shopOrder: workOrderQueryParams.value.shopOrder || '',
    actualWeight: workOrderQueryParams.value.actualWeight || '',
    lowLimit: workOrderQueryParams.value.lowLimit ?? '',
    hightLimit: workOrderQueryParams.value.hightLimit ?? '',
    result,
    itemDesc: workOrderQueryParams.value.itemDesc || '',
    item: workOrderQueryParams.value.plannedItem || ''
  });
  pagination.value.total = historyData.value.length;
  saveHistoryToDb();
  return uuid;
};

interface PageData<T, Q> {
  form: T;
  queryParams: Q;
  rules: any;
}
// 添加箱数选项状态
const boxQtyOptions = ref<Array<{ label: string; value: string }>>([]);
const loading = ref(false);
const total = ref(0);
const queryFormRef = ref<ElFormInstance>();
const podConfig = ref<{ [key: string]: any }>({});
const initWorkOrderFormData: ShopOrderForm = {
  id: undefined,
  handle: undefined,
  shopOrder: undefined,
  status: undefined,
  statusDesc: undefined,
  shopOrderType: undefined,
  priority: undefined,
  plannedWorkCenterBo: undefined,
  plannedItemBo: undefined,
  plannedBomBo: undefined,
  plannedRouterBo: undefined,
  itemBo: undefined,
  bomBo: undefined,
  routerBo: undefined,
  releaseQty: undefined,
  qtyToBuild: undefined,
  qtyReleased: undefined,
  plannedStartDate: undefined,
  plannedCompDate: undefined,
  releasedDate: undefined,
  qtyDone: undefined,
  qtyScrapped: undefined,
  actualStartDate: undefined,
  actualCompDate: undefined,
  customer: undefined,
  customerOrder: undefined,
  overDeliveryTolerance: undefined,
  considerScrap: undefined,
  remark: undefined
};
const shopOrderData = reactive<PageData<ShopOrderForm, ShopOrderQuery>>({
  workOrderForm: { ...initWorkOrderFormData },
  workOrderQueryParams: {
    pageNum: 1,
    pageSize: 10,
    handle: undefined,
    shopOrder: undefined,
    status: undefined,
    shopOrderType: undefined,
    priority: undefined,
    plannedWorkCenterBo: undefined,
    plannedItemBo: undefined,
    plannedBomBo: undefined,
    plannedRouterBo: undefined,
    itemBo: undefined,
    bomBo: undefined,
    routerBo: undefined,
    qtyToBuild: undefined,
    qtyReleased: undefined,
    plannedStartDate: undefined,
    plannedCompDate: undefined,
    releasedDate: undefined,
    qtyDone: undefined,
    qtyScrapped: undefined,
    actualStartDate: undefined,
    actualCompDate: undefined,
    customer: undefined,
    customerOrder: undefined,
    overDeliveryTolerance: undefined,
    considerScrap: undefined,
    params: {}
  },
  workOrderRules: {}
});
const { workOrderQueryParams, workOrderForm, workOrderRules } = toRefs(shopOrderData);
// 工单对话框
const openShopOrderDialog = () => {
  shopOrderDialogRef.value.openDialog();
};
const getDataCollectionByShopOrder = () => {
  workOrderInputRef.value?.saveHistory();
  queryDataCollectionByShopOrder({
    shopOrder: workOrderQueryParams.value.shopOrder,
    operation: podConfig.value.operation,
    resource: podConfig.value.resource
  })
    .then((res) => {
      // 提取 QUANTITY 字段值作为下拉选项
      const quantityValues: Array<{ label: string; value: string; dcGroup: string; dcParameter: string; minValue: string; maxValue: string }> = [];

      if (res.data.dcGroupVoList && res.data.dcGroupVoList.length > 0) {
        const dataCollectionList = res.data.dcGroupVoList[0].dcParameterVoList;
        dataCollectionList.forEach((detail) => {
          if (detail.extFieldsVoList) {
            const quantityField = detail.extFieldsVoList.find((field) => field.attribute === 'QUANTITY');
            if (quantityField && quantityField.value) {
              const value = quantityField.value;
              quantityValues.push({
                dcGroupBo: detail.dcGroupBo,
                dcGroup: detail.dcGroup,
                dcParameterBo: detail.handle,
                dcParameter: detail.dcParameter,
                minValue: detail.minValue,
                maxValue: detail.maxValue,
                label: `${detail.dcParameter}(${value})`,
                value: value
              });
            }
          }
        });
      }

      // 设置下拉选项
      boxQtyOptions.value = quantityValues;

      // 如果有选项，默认选中第一个
      if (quantityValues.length > 0 && !workOrderQueryParams.value.boxQty) {
        workOrderQueryParams.value.boxQty = quantityValues[0].value;
        workOrderQueryParams.value.dcGroupBo = quantityValues[0].dcGroupBo;
        workOrderQueryParams.value.dcGroup = quantityValues[0].dcGroup;
        workOrderQueryParams.value.dcParameterBo = quantityValues[0].dcParameterBo;
        workOrderQueryParams.value.dcParameter = quantityValues[0].dcParameter;
        workOrderQueryParams.value.lowLimit = quantityValues[0].minValue;
        workOrderQueryParams.value.hightLimit = quantityValues[0].maxValue;
        workOrderQueryParams.value.dcParameter = quantityValues[0].dcParameter;
      }
    })
    .finally(() => shopOrderDialogRef.value.closeDialog());
};
const shopOrderCallBack = (data: any) => {
  workOrderQueryParams.value = data;
  nextTick(() => workOrderInputRef.value?.saveHistory());
  getDataCollectionByShopOrder();
  if (workOrderQueryParams.value.shopOrder) {
    getShopOrderWeightNoSnInfo({
      shopOrder: workOrderQueryParams.value.shopOrder
    }).then((response: any) => {
      if (response.code === 200) {
        workOrderQueryParams.value.doneWeightQty = response.data.doneWeightQty ? parseFloat(response.data.doneWeightQty) : 0;
        workOrderQueryParams.value.doneBoxQty = response.data.doneBoxQty ? parseFloat(response.data.doneBoxQty) : 0;
      }
    });
  }
};

const handleBoxQtyChange = (selectedIndex: number) => {
  if (selectedIndex !== undefined && selectedIndex >= 0 && boxQtyOptions.value[selectedIndex]) {
    const selectedOption = boxQtyOptions.value[selectedIndex];
    workOrderQueryParams.value.boxQty = selectedOption.value;
    workOrderQueryParams.value.dcGroupBo = selectedOption.dcGroupBo;
    workOrderQueryParams.value.dcGroup = selectedOption.dcGroup;
    workOrderQueryParams.value.dcParameterBo = selectedOption.dcParameterBo;
    workOrderQueryParams.value.dcParameter = selectedOption.dcParameter;
    workOrderQueryParams.value.lowLimit = selectedOption.minValue;
    workOrderQueryParams.value.hightLimit = selectedOption.maxValue;
    workOrderQueryParams.value.dcParameter = selectedOption.dcParameter;
  }
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

const clearSelection = (type) => {
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
// 资源缓存操作
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

// 工序缓存操作
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

const warnVoice = () => audioPlayer.playWarning();
const successVoice = () => audioPlayer.playSuccess();

const AUTO_UPLOAD_KEY = 'workPanelNoSnAutoUpload';
const AUTO_UPLOAD_BURST_MSG = '电子秤出现连续上传，请联系资讯调试电子秤稳定发送重量';
const autoUpload = ref(false);
const autoUploadTimes: number[] = [];

const loadAutoUpload = () => {
  try {
    const cache = JSON.parse(localStorage.getItem(AUTO_UPLOAD_KEY) || '{}');
    if (typeof cache[currentRoute.value.fullPath] === 'boolean') {
      autoUpload.value = cache[currentRoute.value.fullPath];
    }
  } catch (e) {
    // ignore
  }
};

const saveAutoUpload = () => {
  const cache = JSON.parse(localStorage.getItem(AUTO_UPLOAD_KEY) || '{}');
  cache[currentRoute.value.fullPath] = autoUpload.value;
  localStorage.setItem(AUTO_UPLOAD_KEY, JSON.stringify(cache));
};

watch(autoUpload, () => {
  saveAutoUpload();
  autoUploadTimes.length = 0;
});

const isAutoUploadBurst = () => {
  const now = Date.now();
  autoUploadTimes.push(now);
  const recent = autoUploadTimes.filter((t) => now - t <= 1000);
  autoUploadTimes.length = 0;
  autoUploadTimes.push(...recent);
  return recent.length > 2;
};

const handleAutoUploadBurst = () => {
  autoUpload.value = false;
  autoUploadTimes.length = 0;
  resultMessage.value = AUTO_UPLOAD_BURST_MSG;
  resultStatus.value = false;
  warnVoice();
  ElMessage.error(AUTO_UPLOAD_BURST_MSG);
};

// 全局键盘事件处理函数
const handleGlobalKeyDown = (event: KeyboardEvent) => {
  // 检查是否按下了 Enter 和 Tab 键
  if (event.key === 'Enter' || event.key === 'Tab') {
    event.preventDefault();
    submitForm();
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (currentRoute.value.name === 'WGT-NO-SN' || currentRoute.value.path.includes('WGT-NO-SN')) {
    handleGlobalKeyDown(event);
  }
};

const submitForm = async () => {
  if (loading.value) {
    return;
  }
  resultStatus.value = true;
  resultMessage.value = '';
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
  if (!workOrderQueryParams.value.shopOrder) {
    resultMessage.value = '请选择需要采集数据的工单号';
    resultStatus.value = false;
    warnVoice();
    return;
  }
  if ((boxQtyOptions.value || []).length == 0) {
    resultMessage.value = '未获取到数据收集组，请联系QE维护资料';
    resultStatus.value = false;
    warnVoice();
    return;
  }
  if (!workOrderQueryParams.value.actualWeight) {
    resultMessage.value = '未获取到重量数据，请检查电子秤是否正常';
    resultStatus.value = false;
    warnVoice();
    return;
  }

  const actualWeight = parseFloat(workOrderQueryParams.value.actualWeight);
  const lowLimit = parseFloat(workOrderQueryParams.value.lowLimit);
  const highLimit = parseFloat(workOrderQueryParams.value.hightLimit);

  if (!isNaN(actualWeight) && !isNaN(lowLimit) && !isNaN(highLimit)) {
    if (actualWeight < lowLimit || actualWeight > highLimit) {
      resultMessage.value = `重量${actualWeight}超出范围[${lowLimit}~${highLimit}]`;
      resultStatus.value = false;
      warnVoice();
      return;
    }
  }

  loading.value = true;
  try {
    const res: any = await saveShopOrderWeightNoSn({
      shopOrder: workOrderQueryParams.value.shopOrder,
      operation: podConfig.value.operation,
      resource: podConfig.value.resource,
      qty: workOrderQueryParams.value.boxQty,
      dcParameterBoList: [
        {
          handle: workOrderQueryParams.value.dcParameterBo,
          dcGroupBo: workOrderQueryParams.value.dcGroupBo,
          dcParameterBo: workOrderQueryParams.value.dcParameterBo,
          dcParameter: workOrderQueryParams.value.dcParameter,
          actualValue: workOrderQueryParams.value.actualWeight,
          units: workOrderQueryParams.value.weightUnit
        }
      ]
    });
    if (res.code === 200) {
      pushHistory('PASS');
      resultStatus.value = true;
      resultMessage.value = '数据上传成功';
      successVoice();
      workOrderQueryParams.value.actualWeight = null;
      workOrderQueryParams.value.weightUnit = null;
      getShopOrderWeightNoSnInfo({
        shopOrder: workOrderQueryParams.value.shopOrder
      }).then((response: any) => {
        if (response.code === 200) {
          workOrderQueryParams.value.doneWeightQty = response.data.doneWeightQty ? parseFloat(response.data.doneWeightQty) : 0;
          workOrderQueryParams.value.doneBoxQty = response.data.doneBoxQty ? parseFloat(response.data.doneBoxQty) : 0;
        }
      });
    } else {
      pushHistory('FAIL');
      resultMessage.value = res.msg;
      resultStatus.value = false;
      warnVoice();
    }
  } catch (error: any) {
    pushHistory('FAIL');
    resultMessage.value = error?.message || '数据上传失败';
    resultStatus.value = false;
    warnVoice();
    console.error('发送数据到后台失败:', error);
  } finally {
    loading.value = false;
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

  workOrderQueryParams.value.actualWeight = processedWeight;
  workOrderQueryParams.value.weightUnit = unit || workOrderQueryParams.value.weightUnit;
  workOrderQueryParams.value.uuid = uuidv4();

  if (autoUpload.value && processedWeight && !isNaN(Number(processedWeight))) {
    if (isAutoUploadBurst()) {
      handleAutoUploadBurst();
    } else if (!loading.value) {
      submitForm();
    }
  }
};

const { isConnected, connecting, handleConnect, disconnect, checkBrowserSupport, setupListeners, teardownListeners } = useSerialPort(processDataPacket);

const paginatedHistoryData = computed(() => {
  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  return historyData.value.slice().reverse().slice(start, end);
});
// 分页大小改变
const handleSizeChange = (val: number) => {
  pagination.value.pageSize = val;
  pagination.value.currentPage = 1;
};

// 当前页改变
const handleCurrentChange = (val: number) => {
  pagination.value.currentPage = val;
};

// 清空历史数据
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
    if (lastSegment === 'WGT-NO-SN') {
      saveOperationToLocalStorage({
        operation: 'WGT-NO-SN',
        operationDesc: '无条码称重'
      });
    }
    if (lastSegment === 'TEST-SAFETY') {
      saveOperationToLocalStorage({
        operation: 'TEST-SAFETY',
        operationDesc: '安规测试'
      });
    }
  }

  findPodConfig();
  loadAutoUpload();
  loadHistoryFromDb().then((list) => {
    historyData.value = list;
    pagination.value.total = list.length;
  });
  disconnect(true);
  checkBrowserSupport();
  setupListeners();
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(async () => {
  await teardownListeners();
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.dashed-blue-btn.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 解决工单号历史记录被卡片遮挡 */
.weight-form-card {
  position: relative;
  z-index: 10;
  overflow: visible !important;
}

.weight-form-card :deep(.el-card__header),
.weight-form-card :deep(.el-card__body) {
  overflow: visible !important;
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
.serial-debugger {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.send-options {
  margin-top: 10px;
  display: flex;
  gap: 15px;
}

.receive-info {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-textarea {
  font-family: monospace;
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
</style>
