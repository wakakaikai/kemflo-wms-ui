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
            </div>
          </div>

          <div class="flex flex-wrap items-center mt-[10px] py-4 px-0 bg-gray-50 rounded-lg transition-all duration-300">
            <div class="flex flex-1 md:flex-none ml-[10px]">
              <el-button color="#10b981" class="min-w-[100px] text-white flex-1" @click="handleDataCollection">
                <el-icon class="mr-1 text-white">
                  <User />
                </el-icon>
                <span class="truncate">测试记录</span>
              </el-button>

              <el-button color="#ef4444" class="min-w-[100px] text-white flex-1">
                <el-icon class="mr-1 text-white">
                  <UserFilled />
                </el-icon>
                <span class="truncate">不合格记录选择</span>
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </transition>

    <!-- 固定在右侧的呼叫按钮组 -->
    <ContactUs @material-call="handleMaterialCall" @equipment-call="handleEquipmentCall" @quality-call="handleQualityCall" @other-call="handleOtherCall" @cancel="handleCancel"></ContactUs>

    <!-- 弹框 -->
    <OperationDialog ref="operationDialogRef" @operation-call-back="operationCallBack" />
    <ResourceDialog ref="resourceDialogRef" @resource-call-back="resourceCallBack" />
    <DataCollectionDialog ref="dataCollectionDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { Close, Cpu, Operation, User, UserFilled } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

import type { OperationObj, ResourceObj } from '@/components/common-type';

import OperationDialog from '@/views/mes/workpanel/components/operationDialog.vue';
import ResourceDialog from '@/views/mes/workpanel/components/resourceDialog.vue';
import DataCollectionDialog from '@/views//mes/workpanel/dataCollection/components/dataCollectionDialog.vue';

import ContactUs from '@/views/mes/workpanel/components/contact-us.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const operationDialogRef = ref<InstanceType<typeof OperationDialog>>();
const resourceDialogRef = ref<InstanceType<typeof ResourceDialog>>();
const dataCollectionDialogRef = ref<InstanceType<typeof DataCollectionDialog>>();

const podConfig = ref<{ [key: string]: any }>({});

// 获取路由参数
const { currentRoute } = useRouter();

const handleDataCollection = () => {
  dataCollectionDialogRef.value.openDialog();
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

const keyDownTab = async () => {
  form.value.sfc = form.value.sfc.trim();
  // await querySfcInfo();
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
  const routerPath = currentRoute.value.fullPath;
  const lastSegment = routerPath.split('/').pop();
  const resOperationObj = getOperationFromLocalStorage();
  if (!resOperationObj) {
    if (lastSegment === 'TEST-FUNC') {
      saveOperationToLocalStorage({
        operation: 'TEST-FUNC',
        operationDesc: '功能测试'
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
});
</script>

<style scoped>
.el-card__body {
  padding: 10px !important;
}

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

/* 在全局样式中添加 */
.text-white {
  color: white !important;
}
</style>
