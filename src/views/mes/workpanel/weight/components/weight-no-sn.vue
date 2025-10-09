<template>
  <div class="serial-debugger">
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
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>称重采集</span>
          <el-tag :type="isConnected ? 'success' : 'info'" size="small">
            {{ isConnected ? `已连接` : '未连接' }}
          </el-tag>
          <div class="dc-btn-group">
            <el-button :type="isConnected ? 'success' : 'info'" size="small" @click="handleConnect" :loading="connecting">
              {{ isConnected ? '关闭串口' : '打开串口' }}
            </el-button>
            <el-button size="small" @click="getDataCollectionByShopOrder"> 刷新 </el-button>
            <el-button color="#10b981" class="text-white" size="small" @click="submitForm" :loading="loading"> <span class="truncate">手动上传</span> </el-button>
          </div>
        </div>
      </template>

      <el-form ref="queryFormRef" :model="workOrderQueryParams" :rules="workOrderRules" label-width="auto">
        <el-row :gutter="24">
          <el-col :lg="8" :md="8" :sm="24">
            <el-form-item label="工单号码" prop="shopOrder">
              <el-input ref="workOrderInputRef" v-model="workOrderQueryParams.shopOrder" placeholder="请输入工单号码">
                <template #append>
                  <el-button icon="Search" @click="openShopOrderDialog" />
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :lg="5" :md="5" :sm="24">
            <el-form-item label="产品料号:" prop="plannedItem">
              <el-button class="dashed-blue-btn w-[100%]" size="small">
                {{ workOrderQueryParams.plannedItem || '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="11" :md="11" :sm="24">
            <el-form-item label="产品描述:" prop="itemDesc">
              <el-button class="dashed-blue-btn w-[100%] text-ellipsis" size="small">
                {{ workOrderQueryParams.itemDesc || '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="8" :md="8" :sm="24">
            <el-form-item label="数据收集组:" prop="dcGroup">
              <el-button class="dashed-blue-btn w-[100%]" size="small">
                {{ workOrderQueryParams.dcGroup || '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="5" :md="5" :sm="24">
            <el-form-item label="产品总数:" prop="qtyToBuild">
              <el-button class="dashed-blue-btn w-[100%]" size="small">
                {{ workOrderQueryParams.qtyToBuild ? parseFloat(workOrderQueryParams.qtyToBuild) : '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="5" :md="5" :sm="24" :offset="0">
            <el-form-item label="已称重产品数:" prop="doneWeightQty">
              <el-button class="dashed-blue-btn w-[100%]" size="small">
                {{ workOrderQueryParams.doneWeightQty || '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="5" :md="5" :sm="24">
            <el-form-item label="已称重箱数:" prop="doneBoxQty">
              <el-button class="dashed-blue-btn w-[100%]" size="small">
                {{ workOrderQueryParams.doneBoxQty || '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="4" :md="4" :sm="24">
            <el-form-item label="重量:" prop="actualWeight">
              <el-button class="dashed-blue-btn w-[100%]" size="small">
                {{ `${workOrderQueryParams.actualWeight || ''} ${workOrderQueryParams.weightUnit || ''}` }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="4" :md="4" :sm="24">
            <el-form-item label="下限:" prop="itemDesc">
              <el-button class="dashed-blue-btn w-[100%]" size="small">
                {{ workOrderQueryParams.lowLimit || '' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :lg="4" :md="4" :sm="24">
            <el-form-item label="上限:" prop="itemDesc">
              <el-button class="dashed-blue-btn w-[100%]" size="small">
                {{ workOrderQueryParams.hightLimit || '' }}
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
          <!--          <el-col :lg="5" :md="5" :sm="24">
            <el-form-item label="参数:" prop="dcParameter">
              <el-button class="dashed-blue-btn w-[100%]" size="small">
                {{ workOrderQueryParams.dcParameter || '' }}
              </el-button>
            </el-form-item>
          </el-col>-->
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

      <el-table :data="paginatedHistoryData" style="width: 100%" size="small" max-height="300">
        <el-table-column prop="timestamp" label="时间" />
        <el-table-column label="类型">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'send' ? 'primary' : 'success'">
              {{ scope.row.type === 'send' ? '发送' : '接收' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="data" label="数据内容" />
        <el-table-column label="上传状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
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
    <ShopOrderDialog ref="shopOrderDialogRef" @shop-order-call-back="shopOrderCallBack" />
    <OperationDialog ref="operationDialogRef" @operation-call-back="operationCallBack" />
    <ResourceDialog ref="resourceDialogRef" @resource-call-back="resourceCallBack" />
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { ShopOrderForm, ShopOrderQuery, ShopOrderVO } from '@/api/mes/shopOrder/types';
import type { OperationObj, ResourceObj } from '@/components/common-type';
import ShopOrderDialog from '@/views/mes/workpanel/components/shopOrderDialog.vue';
import ResourceDialog from '@/views/mes/workpanel/components/resourceDialog.vue';
import OperationDialog from '@/views/mes/workpanel/components/operationDialog.vue';
import { Close, Cpu, Operation } from '@element-plus/icons-vue';
import { queryDataCollectionByShopOrder, saveShopOrderWeightNoSn, getShopOrderWeightNoSnInfo } from '@/api/mes/workpanel';
import { parseTime } from '@/utils/ruoyi';
import { v4 as uuidv4 } from 'uuid';
// 获取路由参数
const { currentRoute } = useRouter();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const operationDialogRef = ref<InstanceType<typeof OperationDialog>>();
const resourceDialogRef = ref<InstanceType<typeof ResourceDialog>>();
const shopOrderDialogRef = ref<InstanceType<typeof ShopOrderDialog>>();
// 历史数据表格
const historyData = ref<
  Array<{
    timestamp: string;
    uuid: string;
    type: 'send' | 'receive';
    data: string;
    status: 'pending' | 'success' | 'failed';
  }>
>([]);

// 表格分页
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 定义类型
interface SerialPortForm {
  portName: string;
  portDesc: string;
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: string;
  flowControl: string;
}

interface SerialPortQuery {
  pageNum: number;
  pageSize: number;
  portName?: string;
  portDesc?: string;
  baudRate?: number;
}

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
  shopOrderDialogRef.value.initShopOrderDialog({
    resource: podConfig.value.resource
  });
  shopOrderDialogRef.value.openDialog();
};
const getDataCollectionByShopOrder = () => {
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
// 工序对话框
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

// 资源对话框
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
// 初始化表单数据
const initFormData: SerialPortForm = {
  portName: '',
  portDesc: '',
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  flowControl: 'none'
};

const data = reactive<PageData<SerialPortForm, SerialPortQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    portName: '',
    portDesc: '',
    baudRate: 9600
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

// 可用串口列表
const serialPortVoList = ref<SerialPortForm[]>([]);
// 常用波特率列表
const baudRates = [
  110, 300, 600, 1200, 2400, 4800, 6000, 7200, 9600, 14400, 19200, 28800, 38400, 57600, 76800, 115200, 230400, 250000, 256000, 460800, 500000, 576000, 921600, 1000000, 1500000, 2000000, 3000000,
  6000000, 12000000
];

// 发送数据相关
const sendText = ref('');
const sendOptions = ref({
  autoClear: true,
  hexMode: false,
  addNewline: true
});

// 接收数据相关
const receivedText = ref('');
const receivedBytes = ref(0);
const receiveOptions = ref({
  autoScroll: true
});

// 连接状态
const isConnected = ref(false);
const connecting = ref(false);

// Web Serial API相关引用
const serialPort = ref<any | null>(null);
let reader: ReadableStreamBYOBReader | null = null;
let writer: WritableStreamDefaultWriter | null = null;
let keepReading = false;

// 数据缓冲区
let dataBuffer: number[] = [];

// 初始化加载
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

  // 解绑所有的串口连接
  disconnect();

  // 检查浏览器是否支持Web Serial API
  if (!('serial' in navigator)) {
    ElMessage.error('当前浏览器不支持Web Serial API，请使用Chrome 89+或Edge 89+浏览器');
  }

  // 监听连接状态变化
  navigator.serial?.addEventListener('connect', handleSerialConnect);
  navigator.serial?.addEventListener('disconnect', handleSerialDisconnect);
});

// 组件卸载前关闭连接并撤销权限
onBeforeUnmount(async () => {
  navigator.serial?.removeEventListener('connect', handleSerialConnect);
  navigator.serial?.removeEventListener('disconnect', handleSerialDisconnect);
  // 断开串口连接
  await disconnect();

  // 撤销对串行端口的访问权限
  if (serialPort.value && 'forget' in serialPort.value) {
    try {
      await serialPort.value.forget();
      console.log('串行端口访问权限已撤销');
    } catch (error) {
      console.error('撤销串行端口权限时出错:', error);
    }
  }
});

// 处理串口连接事件
const handleSerialConnect = (event: Event) => {
  ElMessage.success('检测到串口设备连接');
  refreshSerialPortVoList();
};

// 处理串口断开事件
const handleSerialDisconnect = (event: Event) => {
  if (isConnected.value) {
    disconnect();
    ElMessage.warning('串口设备已断开');
  }
};

// 刷新串口列表
const refreshSerialPortVoList = async () => {
  try {
    // Web Serial API不提供列出所有可用端口的功能
    // 用户需要通过requestPort手动选择
    ElMessage.info('请点击"打开串口"按钮选择串口设备');
    serialPortVoList.value = []; // 清空列表
  } catch (error) {
    ElMessage.error('获取串口列表失败');
  }
};

// 连接/断开串口
const handleConnect = async () => {
  if (isConnected.value) {
    await disconnect();
  } else {
    await connect();
  }
};

// 获取端口显示名称
const getPortDisplayName = (port: any) => {
  // 尝试获取串口的真实名称
  let name = port.path || '未知端口';

  // 尝试获取更多信息
  const info = port.getInfo();

  // 对于虚拟串口和蓝牙设备，尝试获取更多描述信息
  if (port.productName) {
    name = `${port.productName} (${port.path})`;
  } else if (info.usbVendorId && info.usbProductId) {
    name = `USB设备 (0x${info.usbVendorId.toString(16)}:0x${info.usbProductId.toString(16)})`;
  }

  return name;
};

// 连接串口
const connect = async () => {
  connecting.value = true;

  try {
    // 请求串口权限
    serialPort.value = await navigator.serial.requestPort();

    // 获取端口信息并设置端口名称
    form.value.portName = getPortDisplayName(serialPort.value);

    // 打开串口连接，设置缓冲区大小
    const bufferSize = 1024; // 1kB
    await serialPort.value.open({
      baudRate: form.value.baudRate,
      dataBits: form.value.dataBits as 8 | 7 | 6 | 5,
      stopBits: form.value.stopBits as 1 | 2,
      parity: form.value.parity as 'none' | 'even' | 'odd',
      flowControl: form.value.flowControl as 'none' | 'hardware',
      bufferSize: bufferSize
    });

    isConnected.value = true;
    keepReading = true;
    dataBuffer = []; // 清空数据缓冲区

    // 启动数据读取
    readSerialData();
    ElMessage.success('串口连接成功');
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      ElMessage.warning('未选择串口设备');
    } else {
      ElMessage.error('串口连接失败: ' + (error.message || error));
    }
  } finally {
    connecting.value = false;
  }
};

// 发送数据到后台
const submitForm = async () => {
  try {
    if (!podConfig.value.operation) {
      proxy?.$modal.msgError('请选择对应的工序');
      return;
    }
    if (!podConfig.value.resource) {
      proxy?.$modal.msgError('请选择对应的资源');
      return;
    }
    if (!workOrderQueryParams.value.shopOrder) {
      proxy?.$modal.msgError('请选择需要采集数据的工单号');
      return;
    }
    if ((boxQtyOptions.value || []).length == 0) {
      proxy?.$modal.msgError('未获取到数据收集组，请联系QE维护资料');
      return;
    }
    if (!workOrderQueryParams.value.actualWeight) {
      proxy?.$modal.msgError('未获取到重量数据，请检查上传是否正常');
      return;
    }

    // 比较重量是否在范围内
    const actualWeight = parseFloat(workOrderQueryParams.value.actualWeight);
    const lowLimit = parseFloat(workOrderQueryParams.value.lowLimit);
    const highLimit = parseFloat(workOrderQueryParams.value.hightLimit);

    if (!isNaN(actualWeight) && !isNaN(lowLimit) && !isNaN(highLimit)) {
      if (actualWeight < lowLimit || actualWeight > highLimit) {
        proxy?.$modal.msgWarning(`重量${actualWeight}超出范围[${lowLimit}~${highLimit}]`);
        return;
      }
    }
    loading.value = true;
    const curUUId = workOrderQueryParams.value.uuid;
    saveShopOrderWeightNoSn({
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
    }).then((res: any) => {
      if (res.code === 200) {
        proxy?.$modal.msgSuccess('数据上传成功');
        // 更新historyData.value中uuid为curUUId的status为success
        historyData.value = historyData.value.map((item: any) => {
          if (item.uuid === curUUId) {
            item.status = 'success';
          }
          return item;
        });
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
        proxy?.$modal.msgError(res.msg);
      }
      loading.value = false;
    });
  } catch (error) {
    loading.value = false;
    console.error('发送数据到后台失败:', error);
  }
};

// 处理数据包
const processDataPacket = (packet: string) => {
  // 将完整数据包添加到显示区域（历史数据）
  receivedText.value = packet;
  receivedBytes.value = packet.length;

  // 添加到历史数据表格
  const uuid = uuidv4();
  historyData.value.push({
    timestamp: parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}'),
    uuid: uuid,
    type: 'receive',
    data: packet.trim(),
    status: 'pending'
  });
  // 更新分页总数
  pagination.value.total = historyData.value.length;

  // 处理称重数据
  let processedWeight = '';
  let unit = '';
  // 去除首尾空格
  const trimmedData = packet.trim();

  if (trimmedData.startsWith('=')) {
    // 老式称重，需要反转
    const reversedStr = trimmedData.split('').reverse().join('');
    processedWeight = reversedStr.replace(/[=+\s]/g, '');
  } else {
    // 新式称重
    processedWeight = trimmedData.replace(/[a-z\s]/g, '');
    unit = trimmedData.replace(/[^a-zA-Z]/g, '');
  }

  // 设置处理后的重量值
  // 处理浮点数，去除末尾无效的0
  if (processedWeight && !isNaN(Number(processedWeight))) {
    // 转换为数字后再转回字符串，自动去除末尾无效的0
    processedWeight = parseFloat(processedWeight).toString();
  }

  // 设置处理后的重量值
  workOrderQueryParams.value.actualWeight = processedWeight;
  workOrderQueryParams.value.weightUnit = unit;
  workOrderQueryParams.value.uuid = uuid;

  // 自动滚动
  if (receiveOptions.value.autoScroll) {
    nextTick(() => {
      const textareas = document.querySelectorAll('.el-textarea__inner');
      if (textareas.length > 0) {
        const textarea = textareas[textareas.length - 1] as HTMLTextAreaElement;
        textarea.scrollTop = textarea.scrollHeight;
      }
    });
  }
};

// 读取串口数据 - 使用BYOB模式读取
const readSerialData = async () => {
  if (!serialPort.value || !serialPort.value.readable) {
    return;
  }

  try {
    // 获取BYOB读取器
    reader = serialPort.value.readable.getReader({ mode: 'byob' });

    // 设置缓冲区大小
    const bufferSize = 1024; // 1kB
    let buffer = new ArrayBuffer(bufferSize);

    while (keepReading) {
      try {
        const { value, done } = await reader.read(new Uint8Array(buffer));
        if (done) {
          break;
        }

        // 更新缓冲区
        buffer = value.buffer;
        // 将新数据追加到数据缓冲区
        dataBuffer.push(...value);

        // 检查缓冲区是否以 \r\n 结尾 (0x0d 0x0a)
        if (dataBuffer.length >= 2 && dataBuffer[dataBuffer.length - 2] === 0x0d && dataBuffer[dataBuffer.length - 1] === 0x0a) {
          // 将缓冲区数据转换为字符串
          const textDecoder = new TextDecoder();
          const packet = textDecoder.decode(new Uint8Array(dataBuffer));

          // 处理完整的数据包
          processDataPacket(packet);

          // 清空缓冲区
          dataBuffer = [];
        }
        // 检查缓冲区是否以 }结束的
        if (dataBuffer.length >= 1 && dataBuffer[dataBuffer.length - 1] === 0x7d) {
          // 将缓冲区数据转换为字符串
          const textDecoder = new TextDecoder();
          const packet = textDecoder.decode(new Uint8Array(dataBuffer));
          processDataPacket(packet);
          dataBuffer = [];
        }
      } catch (error) {
        // 处理报错
        if (keepReading) {
          console.error('读取串口数据时发生错误:', error);
        }
        break;
      }
    }
  } catch (error: any) {
    if (keepReading) {
      ElMessage.error('读取串口数据出错: ' + (error.message || error));
    }
  } finally {
    // 释放读取器锁
    if (reader) {
      try {
        reader.releaseLock();
      } catch (e) {
        // 忽略释放锁时的错误
      }
      reader = null;
    }
  }
};

// 断开串口连接
const disconnect = async () => {
  keepReading = false;

  try {
    // 停止读取
    if (reader) {
      try {
        await reader.cancel();
      } catch (e) {
        // 忽略取消错误
      }
      try {
        // 再次检查reader是否仍然存在，因为在await reader.cancel()期间可能已经变为null
        if (reader) {
          reader.releaseLock();
        }
      } catch (e) {
        // 忽略释放锁时的错误
      }
      reader = null;
    }

    // 释放写入器
    if (writer) {
      try {
        await writer.close();
      } catch (e) {
        // 忽略关闭错误
      }
      try {
        // 同样添加保护性检查
        if (writer) {
          writer.releaseLock();
        }
      } catch (e) {
        // 忽略释放锁时的错误
      }
      writer = null;
    }

    // 关闭串口
    if (serialPort.value && serialPort.value.readable) {
      await serialPort.value.close();
    }

    isConnected.value = false;
    serialPort.value = null;
    dataBuffer = []; // 清空数据缓冲区

    ElMessage.info('串口已断开');
  } catch (error: any) {
    ElMessage.error('断开串口失败: ' + (error.message || error));
  }
};

// 清空接收数据
const clearReceivedData = () => {
  receivedText.value = '';
  receivedBytes.value = 0;
};

// 保存接收数据到文件
const saveReceivedData = () => {
  if (!receivedText.value) {
    ElMessage.warning('没有可保存的数据');
    return;
  }

  const blob = new Blob([receivedText.value], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `serial_data_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  ElMessage.success('数据保存成功');
};

// 计算分页后的数据
const paginatedHistoryData = computed(() => {
  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  return historyData.value.slice().reverse().slice(start, end);
});

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '待上传';
    case 'success':
      return '成功';
    case 'failed':
      return '失败';
    default:
      return '未知';
  }
};

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'success':
      return 'success';
    case 'failed':
      return 'danger';
    default:
      return 'info';
  }
};

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
};
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
