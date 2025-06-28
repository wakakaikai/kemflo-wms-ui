<template>
  <div class="p-2">
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

              <!-- 工作中心区块 -->
              <div class="flex items-center group">
                <div class="flex items-center min-w-[80px]">
                  <span class="text-sm font-medium text-gray-600 flex items-center min-w-[95px]">
                    <el-icon class="mr-1.5 text-green-500"><HomeFilled /></el-icon>
                    工作中心:
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <el-button @click="openWorkCenterDialog" class="dashed-blue-btn min-w-[120px]" size="small">
                    {{ podConfig.workCenter || '点击选择工作中心' }}
                  </el-button>
                  <el-button v-if="podConfig.workCenter" @click="clearSelection('workCenter')" text size="small" class="!text-gray-400 hover:!text-red-500">
                    <el-icon>
                      <Close />
                    </el-icon>
                  </el-button>
                </div>
              </div>

              <!-- 工单号区块 -->
              <div class="flex items-center group">
                <div class="flex items-center min-w-[80px]">
                  <span class="text-sm font-medium text-gray-600 flex items-center min-w-[80px]">
                    <el-icon class="mr-1.5 text-orange-500"><Document /></el-icon>
                    工单号:
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <el-button @click="openShopOrderDialog" class="dashed-blue-btn min-w-[120px]" size="small">
                    {{ podConfig.shopOrder || '点击选择工单号' }}
                  </el-button>
                  <el-button v-if="podConfig.shopOrder" @click="clearSelection('shopOrder')" text size="small" class="!text-gray-400 hover:!text-red-500">
                    <el-icon>
                      <Close />
                    </el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center mt-[10px] py-4 px-0 bg-gray-50 rounded-lg transition-all duration-300">
            <div class="flex flex-1 md:flex-none ml-[10px]">
              <!-- 工单下达 -->
              <el-button type="primary" class="min-w-[100px] flex-1 md:flex-none" @click="handleReleaseShopOrder">
                <el-icon class="mr-1">
                  <DocumentAdd />
                </el-icon>
                <span class="truncate">工单下达</span>
              </el-button>

              <!-- 员工状态 -->
              <div class="flex flex-1 md:flex-none ml-[10px]">
                <el-button color="#10b981" class="min-w-[100px] text-white flex-1" @click="handleStaffOnline">
                  <el-icon class="mr-1">
                    <User />
                  </el-icon>
                  <span class="truncate">员工上线</span>
                </el-button>

                <el-button color="#ef4444" class="min-w-[100px] text-white flex-1" @click="handleStaffOffline">
                  <el-icon class="mr-1">
                    <UserFilled />
                  </el-icon>
                  <span class="truncate">员工下线</span>
                </el-button>
              </div>

              <!-- 生产流程 -->
              <div class="flex flex-1 md:flex-none ml-[10px]">
                <el-button color="#3b82f6" class="min-w-[100px] text-white flex-1" @click="handleWorkStart">
                  <el-icon class="mr-1">
                    <VideoPlay />
                  </el-icon>
                  <span class="truncate">开工登记</span>
                </el-button>

                <el-button color="#22c55e" class="min-w-[100px] text-white flex-1" @click="handleWorkComplete">
                  <el-icon class="mr-1">
                    <CircleCheck />
                  </el-icon>
                  <span class="truncate">完工汇报</span>
                </el-button>
              </div>

              <!-- 异常处理 -->
              <div class="flex w-full md:w-auto ml-[10px]">
                <el-button color="#f59e0b" class="min-w-[120px] text-white flex-1 md:flex-none" @click="handleOrderException">
                  <el-icon class="mr-1">
                    <Warning />
                  </el-icon>
                  <span class="truncate">工单异常</span>
                </el-button>

                <el-button color="#dc2626" class="min-w-[120px] text-white flex-1 md:flex-none" @click="handleLineException">
                  <el-icon class="mr-1">
                    <CloseBold />
                  </el-icon>
                  <span class="truncate">线体异常</span>
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never" class="mt-[10px]">
      <template #header>
        <div class="card-header">
          <span>查看详情</span>
        </div>
      </template>
      <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleTabClick">
        <el-tab-pane label="工单下达情况" name="releaseWorkOrder">工单下达</el-tab-pane>
        <el-tab-pane label="员工上线情况" name="onlineEmployee">员工上线情况</el-tab-pane>
        <el-tab-pane label="开工情况" name="startRecord">开工情况</el-tab-pane>
        <el-tab-pane label="异常工时登记明细" name="workOrderAbnormal">工单异常工时登记</el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 弹框 -->
    <OperationDialog ref="operationDialogRef" @operation-call-back="operationCallBack" />
    <ResourceDialog ref="resourceDialogRef" @resource-call-back="resourceCallBack" />
    <WorkCenterDialog ref="workCenterDialogRef" @work-center-call-back="workCenterCallBack" />
    <ShopOrderDialog ref="shopOrderDialogRef" @shop-order-call-back="shopOrderCallBack" />
    <ReleaseShopOrderDialog ref="releaseShopOrderDialogRef" @release-shop-order-call-back="releaseShopOrderCallBack" />

    <!-- 固定在右侧的呼叫按钮组 -->
    <AbnormalCall @material-call="handleMaterialCall" @equipment-call="handleEquipmentCall" @quality-call="handleQualityCall" @other-call="handleOtherCall" @cancel="handleCancel"></AbnormalCall>
  </div>
</template>

<script setup lang="ts">
import {
  DocumentAdd,
  User,
  UserFilled,
  Clock,
  CircleCheckFilled,
  WarningFilled,
  Operation,
  Cpu,
  HomeFilled,
  Document,
  Close,
  CircleCheck,
  Warning,
  CloseBold,
  VideoPlay,
  Medal
} from '@element-plus/icons-vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
import type { TabsPaneContext } from 'element-plus';
import { useRouter } from 'vue-router';

import type { OperationObj, ResourceObj, ShopOrderObj, WorkCenterObj } from '@/components/common-type';

const props = defineProps({
  id: {
    required: true,
    type: String
  }
});

import OperationDialog from '@/views/mes/workpanel/components/operationDialog.vue';
import ResourceDialog from '@/views/mes/workpanel/components/resourceDialog.vue';
import WorkCenterDialog from '@/views/mes/workpanel/components/workCenterDialog.vue';
import ShopOrderDialog from '@/views/mes/workpanel/components/shopOrderDialog.vue';
import ReleaseShopOrderDialog from '@/views/mes/workpanel/components/releaseShopOrderDialog.vue';
import AbnormalCall from '@/views/mes/workpanel/components/abnormalCall.vue';

const operationDialogRef = ref<InstanceType<typeof OperationDialog>>();
const resourceDialogRef = ref<InstanceType<typeof ResourceDialog>>();
const workCenterDialogRef = ref<InstanceType<typeof WorkCenterDialog>>();
const shopOrderDialogRef = ref<InstanceType<typeof ShopOrderDialog>>();
const releaseShopOrderDialogRef = ref<InstanceType<typeof ReleaseShopOrderDialog>>();

const podConfig = ref<{ [key: string]: any }>({});
const activeName = ref('orderIssue');
const menuOptions = ref([
  {
    label: '工单下达',
    value: 'orderIssue',
    icon: DocumentAdd,
    color: 'primary'
  },
  {
    label: '员工上线',
    value: 'staffOnline',
    icon: User,
    color: 'success'
  },
  {
    label: '员工下线',
    value: 'staffOffline',
    icon: UserFilled,
    color: 'danger'
  },
  {
    label: '开工登记',
    value: 'workStart',
    icon: Clock,
    color: 'primary'
  },
  {
    label: '完工汇报',
    value: 'workComplete',
    icon: CircleCheckFilled,
    color: 'success'
  },
  {
    label: '工单异常',
    value: 'orderException',
    icon: WarningFilled,
    color: 'warning'
  },
  {
    label: '线体异常',
    value: 'lineException',
    icon: CloseBold,
    color: 'danger'
  }
]);
const handleTabClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event);
};
// 获取路由参数
const { currentRoute } = useRouter();
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

// 工作中心对话框
const openWorkCenterDialog = () => {
  workCenterDialogRef.value.openDialog();
};
const workCenterCallBack = (data: any) => {
  podConfig.value.workCenter = data.workCenter;
  podConfig.value.workCenterDesc = data.description;
  saveWorkCenterToLocalStorage({
    workCenter: data.workCenter,
    workCenterDesc: data.description
  });
};

// 工单对话框
const openShopOrderDialog = () => {
  shopOrderDialogRef.value.openDialog();
};

const shopOrderCallBack = (data: any) => {
  podConfig.value.shopOrder = data.shopOrder;
  podConfig.value.shopOrderDesc = data.itemDesc;
  saveShopOrderToLocalStorage({
    shopOrder: data.shopOrder,
    shopOrderDesc: data.itemDesc
  });
};

// 工单下达对话框
const handleReleaseShopOrder = () => {
  releaseShopOrderDialogRef.value.openDialog();
};
const releaseShopOrderCallBack = (data: any) => {
  console.log('工单下达成功');
};
const clearSelection = (type) => {
  podConfig.value[type] = '';
  console.log(type);
  switch (type) {
    case 'resource':
      removeResourceInLocalStorage();
      break;
    case 'operation':
      removeOperationInLocalStorage();
      break;
    case 'workCenter':
      removeWorkCenterInLocalStorage();
      break;
    case 'shopOrder':
      removeShopOrderInLocalStorage();
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

  const workCenterObj = getWorkCenterFromLocalStorage();
  if (workCenterObj) {
    const { workCenter, workCenterDesc } = workCenterObj;
    podConfig.value.workCenter = workCenter;
    podConfig.value.workCenterDesc = workCenterDesc;
  }

  const shopOrderObj = getShopOrderFromLocalStorage();
  if (shopOrderObj) {
    const { shopOrder, shopOrderDesc } = shopOrderObj;
    podConfig.value.shopOrder = shopOrder;
    podConfig.value.shopOrderDesc = shopOrderDesc;
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

// 工作中心缓存操作
const saveWorkCenterToLocalStorage = (workCenterObj: WorkCenterObj) => {
  const localOperation = localStorage.getItem('workPanelWorkCenter');
  const preObj = JSON.parse(localOperation || '{}');
  const currentObj = {
    ...preObj,
    [currentRoute.value.fullPath]: workCenterObj
  };
  localStorage.setItem('workPanelWorkCenter', JSON.stringify(currentObj));
};

const getWorkCenterFromLocalStorage = () => {
  const localOperation = localStorage.getItem('workPanelWorkCenter');
  return localOperation ? JSON.parse(localOperation)[currentRoute.value.fullPath] : null;
};

const removeWorkCenterInLocalStorage = () => {
  saveWorkCenterToLocalStorage(null);
};

// 工单缓存操作
const saveShopOrderToLocalStorage = (shopOrderObj: ShopOrderObj) => {
  const localOperation = localStorage.getItem('workPanelShopOrder');
  const preObj = JSON.parse(localOperation || '{}');
  const currentObj = {
    ...preObj,
    [currentRoute.value.fullPath]: shopOrderObj
  };
  localStorage.setItem('workPanelShopOrder', JSON.stringify(currentObj));
};

const getShopOrderFromLocalStorage = () => {
  const localOperation = localStorage.getItem('workPanelShopOrder');
  return localOperation ? JSON.parse(localOperation)[currentRoute.value.fullPath] : null;
};

const removeShopOrderInLocalStorage = () => {
  saveShopOrderToLocalStorage(null);
};

const handleMaterialCall = () => {
  console.log('物料呼叫');
  // 处理物料呼叫逻辑
};

const handleEquipmentCall = () => {
  console.log('设备呼叫');
  // 处理设备呼叫逻辑
};

const handleQualityCall = () => {
  console.log('品质呼叫');
  // 处理品质呼叫逻辑
};

const handleOtherCall = () => {
  console.log('其他呼叫');
  // 处理其他呼叫逻辑
};

const handleCancel = () => {
  console.log('取消');
  // 处理取消逻辑
};

onMounted(() => {
  findPodConfig();
});
</script>

<style scoped>
.white-text {
  color: white !important;
}

:deep(.el-segmented-item) {
  padding: 12px 16px;
}

.dashed-blue-btn {
  border: 1px dashed #3b82f6 !important;
  color: #3b82f6 !important;
  background-color: rgba(59, 130, 246, 0.05) !important;
}

.dashed-blue-btn:hover {
  border-color: #2563eb !important;
  color: #2563eb !important;
  background-color: rgba(59, 130, 246, 0.1) !important;
}

/**异常呼叫 */
/* 基础按钮样式 */
.call-btn {
  width: 120px;
  height: 50px;
  border-radius: 25px !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border: none !important;
}

/* 指示条样式 */
.indicator-bar {
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 30px;
  background: currentColor;
  border-radius: 2px;
  opacity: 0.8;
  transition: all 0.3s ease;
}

/* 悬停效果 */
.call-btn:hover {
  transform: translateX(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.call-btn:hover .indicator-bar {
  right: -8px;
  opacity: 1;
}

/* 各按钮颜色配置 */
.material-call {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  color: white !important;
}

.material-call:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8) !important; /* 深蓝 */
  box-shadow: 0 6px 12px rgba(59, 130, 246, 0.25);
}

.equipment-call {
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  color: white !important;
}

.equipment-call:hover {
  background: linear-gradient(135deg, #d97706, #b45309) !important; /* 深橙 */
  box-shadow: 0 6px 12px rgba(245, 158, 11, 0.25);
}

.quality-call {
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
  color: white !important;
}

.quality-call:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c) !important; /* 深红 */
  box-shadow: 0 6px 12px rgba(239, 68, 68, 0.25);
}

.other-call {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed) !important;
  color: white !important;
}

.other-call:hover {
  background: linear-gradient(135deg, #7c3aed, #6d28d9) !important;
}

.cancel-call {
  background: linear-gradient(135deg, #94a3b8, #64748b) !important;
  color: white !important;
}

.cancel-call:hover {
  background: linear-gradient(135deg, #64748b, #475569) !important;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .call-btn {
    width: 100px;
    height: 44px;
    font-size: 14px;
  }

  .indicator-bar {
    height: 24px;
  }
}

.text-white {
  color: white !important;
}
</style>
