<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="true" class="mb-[10px]">
        <el-card shadow="hover">
          <div class="flex items-center">
            <div class="flex-1 flex items-center gap-6 flex-wrap">
              <!-- 工作岗位区块 -->
              <div class="flex items-center group">
                <div class="flex items-center min-w-[80px]">
                  <span class="text-red-500 mr-1.5">*</span>
                  <span class="text-sm font-medium text-gray-600 flex items-center min-w-[95px]">
                    <el-icon class="mr-1.5 text-purple-500"><Operation /></el-icon>
                    工作岗位:
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <el-button @click="openWorkStationDialog" class="dashed-blue-btn min-w-[120px]" size="small">
                    {{ podConfig.resourceType || '点击选择工作岗位' }}
                  </el-button>
                  <el-button v-if="podConfig.resourceType" @click="clearSelection('abnormalCallSite')" text size="small" class="!text-gray-400 hover:!text-red-500">
                    <el-icon>
                      <Close />
                    </el-icon>
                  </el-button>
                </div>
              </div>

              <!-- 工作中心区块 -->
              <div class="flex items-center group">
                <div class="flex items-center min-w-[80px]">
                  <span class="text-red-500 mr-1.5">*</span>
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
            </div>
          </div>

          <div class="flex flex-wrap items-center mt-[10px] py-4 px-0 bg-gray-50">
            <div class="flex flex-1 md:flex-none ml-[10px]">
              <!-- 物料呼叫 (蓝色) -->
              <el-button type="primary" class="call-btn material-call relative ml-[11px]" @click="confirmMaterialCall">
                <el-icon class="mr-1">
                  <Box />
                </el-icon>
                物料
                <div class="indicator-bar"></div>
              </el-button>

              <!-- 设备呼叫 (橙色) -->
              <el-button type="warning" class="call-btn equipment-call relative" @click="confirmEquipmentCall">
                <div class="lang-select--style mr-1">
                  <svg-icon icon-class="equipment" />
                </div>
                设备
                <div class="indicator-bar"></div>
              </el-button>

              <!-- 品质呼叫 (红色+金色图标) -->
              <el-button type="danger" class="call-btn quality-call relative" @click="confirmQualityCall">
                <div class="lang-select--style mr-1">
                  <svg-icon icon-class="quality" />
                </div>
                品质
                <div class="indicator-bar"></div>
              </el-button>

              <!-- 其他呼叫 (紫色) -->
              <el-button class="call-btn other-call relative bg-purple-500 hover:bg-purple-600 text-white" @click="confirmOtherCall">
                <div class="lang-select--style mr-1">
                  <svg-icon icon-class="other" />
                </div>
                其他
                <div class="indicator-bar"></div>
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </transition>
    <!-- 弹框 -->
    <WorkStationDialog ref="workStationRef" @work-station-call-back="workStationCallBack" />
    <WorkCenterDialog ref="workCenterDialogRef" @work-center-call-back="workCenterCallBack" />
    <AbnormalCallDialog ref="abnormalCallDialogRef" :podConfig="podConfig" @abnormal-call-call-back="abnormalCallCallBack" />

    <!-- 工作中心 -->
    <el-card shadow="never" class="mt-[10px] work-order-card">
      <div class="process-steps">
        <div
          v-for="(workStation, index) in workStationAbnormalCallList"
          :key="workStation.id"
          class="process-step"
          :class="{
            'step-selected': workStation.resourceType === podConfig.resourceType,
            'step-warning': (workStation.messageVoList || []).length > 0
          }"
          @click="handleSelectedWorkStation(workStation)"
        >
          <div class="step-index">
            <el-icon v-if="(workStation.messageVoList || []).length > 0" class="warning-icon">
              <svg-icon icon-class="alarm" />
            </el-icon>
            <span v-else>{{ index + 1 }}</span>
          </div>

          <!--          <div class="step-index">
            <el-icon v-if="(workStation.messageVoList || []).length > 0" class="warning-icon">
              <svg-icon icon-class="alarm" />
              <span class="badge">{{ workStation.messageVoList.length }}</span>
            </el-icon>
            <span v-else>{{ index + 1 }}</span>
          </div>-->

          <div class="step-content">
            <div class="step-name">
              <div>{{ workStation.description }}</div>
              <div>{{ workStation.messageSummaryTitle ? workStation.messageSummaryTitle.replace(/,/g, ' ') : '' }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Operation, HomeFilled, Close, Medal, Box, MoreFilled, Setting } from '@element-plus/icons-vue';

import { ResourceTypeVO } from '@/api/mes/resourceType/types';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
import { useRouter } from 'vue-router';
const loading = ref(false);
import { ResourceTypeObj, WorkCenterObj } from '@/components/common-type';
import { ref } from 'vue';
import { addMessage, queryWorkCenterAbnormalCallList } from '@/api/mes/message';

const props = defineProps({
  id: {
    required: true,
    type: String
  }
});

import WorkStationDialog from '@/views/mes/notice/abnormalCall/components/workStationDialog.vue';
import WorkCenterDialog from '@/views/mes/workpanel/components/workCenterDialog.vue';
import AbnormalCallDialog from '@/views/mes/notice/abnormalCall/components/abnormalCallDialog.vue';
import SvgIcon from '@/components/SvgIcon/index.vue';

const workStationRef = ref<InstanceType<typeof WorkStationDialog>>();
const workCenterDialogRef = ref<InstanceType<typeof WorkCenterDialog>>();
const abnormalCallDialogRef = ref<InstanceType<typeof AbnormalCallDialog>>();

const podConfig = ref<{ [key: string]: any }>({});

const resourceTypeList = ref<ResourceTypeVO[]>([]);
const workStationAbnormalCallList = ref<ResourceTypeVO[]>([]);

const handleSelectedWorkStation = (workStation: any) => {
  podConfig.value.resourceType = workStation.resourceType;
  podConfig.value.resourceTypeDesc = workStation.description;
  saveWorkStationToLocalStorage({
    resourceType: workStation.resourceType,
    resourceTypeDesc: workStation.description
  });
  if (workStation.messageVoList && workStation.messageVoList.length > 0) {
    openAbnormalCallDialog();
  }
};

// 获取路由参数
const { currentRoute } = useRouter();

/** 查询异常呼叫工位列表 */
const queryWorkCenterAbnormalCall = async () => {
  loading.value = true;
  const res = await queryWorkCenterAbnormalCallList({ workCenter: podConfig.value.workCenter });
  workStationAbnormalCallList.value = res.data;
  loading.value = false;
};

// 工位对话框
const openWorkStationDialog = () => {
  workStationRef.value.openDialog();
};

const workStationCallBack = (data: any) => {
  podConfig.value.resourceType = data.resourceType;
  podConfig.value.resourceTypeDesc = data.description;
  saveWorkStationToLocalStorage({
    resourceType: data.resourceType,
    resourceTypeDesc: data.description
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
  queryWorkCenterAbnormalCall();
};

// 工作中心对话框
const openAbnormalCallDialog = () => {
  abnormalCallDialogRef.value.openDialog();
};
const abnormalCallCallBack = (data: any) => {
  queryWorkCenterAbnormalCall();
};

const clearSelection = (type) => {
  podConfig.value[type] = '';
  switch (type) {
    case 'workStation':
      removeWorkStationInLocalStorage();
      break;
    case 'workCenter':
      removeWorkCenterInLocalStorage();
      break;
  }
};
const findPodConfig = () => {
  const resourceTypeObj = getWorkStationFromLocalStorage();
  if (resourceTypeObj) {
    const { resourceType, resourceTypeDesc } = resourceTypeObj;
    podConfig.value.resourceType = resourceType;
    podConfig.value.resourceTypeDesc = resourceTypeDesc;
  }

  const workCenterObj = getWorkCenterFromLocalStorage();
  if (workCenterObj) {
    const { workCenter, workCenterDesc } = workCenterObj;
    podConfig.value.workCenter = workCenter;
    podConfig.value.workCenterDesc = workCenterDesc;
  }
};

// 工位缓存操作
const saveWorkStationToLocalStorage = (resourceTypeObj: ResourceTypeObj) => {
  const localResourceType = localStorage.getItem('workPanelWorkStation');
  const preObj = JSON.parse(localResourceType || '{}');
  const currentObj = {
    ...preObj,
    [currentRoute.value.fullPath]: resourceTypeObj
  };
  localStorage.setItem('workPanelWorkStation', JSON.stringify(currentObj));
};

const getWorkStationFromLocalStorage = () => {
  const localResourceType = localStorage.getItem('workPanelWorkStation');
  return localResourceType ? JSON.parse(localResourceType)[currentRoute.value.fullPath] : null;
};

const removeWorkStationInLocalStorage = () => {
  saveWorkStationToLocalStorage(null);
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

// 物料呼叫确认
const confirmMaterialCall = () => {
  if (!podConfig.value.workCenter) {
    proxy.$modal.msgWarning('请选择工作中心');
    return;
  }
  if (!podConfig.value.resourceType) {
    proxy.$modal.msgWarning('请选择工位');
    return;
  }
  ElMessageBox({
    title: '物料呼叫',
    message: h('div', null, [
      h('p', null, [
        h('span', { innerHTML: '线体：', style: 'font-size: 18px; line-height: 40px;' }), // 使用 innerHTML 确保 HTML 实体解析
        h('span', { style: 'color: #3b82f6; font-size: 18px; font-weight: bold' }, podConfig.value.workCenter)
      ]),
      h('p', null, [
        h('span', { innerHTML: '岗位：', style: 'font-size: 18px; line-height: 40px;' }), // 使用 innerHTML 和 HTML 实体
        h('span', { style: 'color: #3b82f6; font-size: 18px;font-weight: bold' }, `${podConfig.value.resourceType}(${podConfig.value.resourceTypeDesc})`)
      ])
    ]),
    center: true,
    showCancelButton: true,
    showConfirmButton: true,
    showClose: true,
    closeOnClickModal: false, // 点击遮罩层不关闭
    closeOnPressEscape: false, // 按ESC键不关闭
    confirmButtonText: '呼叫',
    cancelButtonText: '取消',
    dangerouslyUseHTMLString: true, // 必须设置为 true
    beforeClose: (action, instance, done) => {
      if (action === 'confirm') {
        instance.confirmButtonLoading = true;
        handleMaterialCall().finally(() => {
          instance.confirmButtonLoading = false;
          done();
        });
      } else {
        done();
      }
    }
  }).catch(() => {
    // 取消操作
  });
};

// 设备呼叫确认
const confirmEquipmentCall = () => {
  ElMessageBox({
    title: '设备呼叫',
    message: h('div', null, [
      h('p', null, [
        h('span', { innerHTML: '线体：', style: 'font-size: 18px; line-height: 40px;' }), // 使用 innerHTML 确保 HTML 实体解析
        h('span', { style: 'color: #f59e0b; font-size: 18px;font-weight: bold' }, podConfig.value.workCenter)
      ]),
      h('p', null, [
        h('span', { innerHTML: '岗位：', style: 'font-size: 18px; line-height: 40px;' }), // 使用 innerHTML 和 HTML 实体
        h('span', { style: 'color: #f59e0b;font-size: 18px; font-weight: bold' }, `${podConfig.value.resourceType}(${podConfig.value.resourceTypeDesc})`)
      ])
    ]),
    center: true,
    showCancelButton: true,
    showConfirmButton: true,
    showClose: true,
    closeOnClickModal: false, // 点击遮罩层不关闭
    closeOnPressEscape: false, // 按ESC键不关闭
    confirmButtonText: '呼叫',
    cancelButtonText: '取消',
    dangerouslyUseHTMLString: true, // 必须设置为 true
    beforeClose: (action, instance, done) => {
      if (action === 'confirm') {
        instance.confirmButtonLoading = true;
        handleEquipmentCall().finally(() => {
          instance.confirmButtonLoading = false;
          done();
        });
      } else {
        done();
      }
    }
  }).catch(() => {
    // 取消操作
  });
};

// 品质呼叫确认
const confirmQualityCall = () => {
  ElMessageBox({
    title: '品质呼叫',
    message: h('div', null, [
      h('p', null, [
        h('span', { innerHTML: '线体：', style: 'font-size: 18px; line-height: 40px;' }), // 使用 innerHTML 确保 HTML 实体解析
        h('span', { style: 'color: #ef4444;font-size: 18px; font-weight: bold' }, podConfig.value.workCenter)
      ]),
      h('p', null, [
        h('span', { innerHTML: '岗位：', style: 'font-size: 18px; line-height: 40px;' }), // 使用 innerHTML 和 HTML 实体
        h('span', { style: 'color: #ef4444; font-size: 18px;font-weight: bold' }, `${podConfig.value.resourceType}(${podConfig.value.resourceTypeDesc})`)
      ])
    ]),
    center: true,
    showCancelButton: true,
    showConfirmButton: true,
    showClose: true,
    closeOnClickModal: false, // 点击遮罩层不关闭
    closeOnPressEscape: false, // 按ESC键不关闭
    confirmButtonText: '呼叫',
    cancelButtonText: '取消',
    dangerouslyUseHTMLString: true, // 必须设置为 true
    beforeClose: (action, instance, done) => {
      if (action === 'confirm') {
        instance.confirmButtonLoading = true;
        handleQualityCall().finally(() => {
          instance.confirmButtonLoading = false;
          done();
        });
      } else {
        done();
      }
    }
  }).catch(() => {
    // 取消操作
  });
};

// 其他呼叫确认
const confirmOtherCall = () => {
  ElMessageBox({
    title: '其他呼叫',
    message: h('div', null, [
      h('p', null, [
        h('span', { innerHTML: '线体：', style: 'font-size: 18px; line-height: 40px;' }), // 使用 innerHTML 确保 HTML 实体解析
        h('span', { style: 'color: #8b5cf6; font-size: 18px;font-weight: bold' }, podConfig.value.workCenter)
      ]),
      h('p', null, [
        h('span', { innerHTML: '岗位：', style: 'font-size: 18px; line-height: 40px;' }), // 使用 innerHTML 和 HTML 实体
        h('span', { style: 'color: #8b5cf6;font-size: 18px; font-weight: bold' }, `${podConfig.value.resourceType}(${podConfig.value.resourceTypeDesc})`)
      ])
    ]),
    center: true,
    showCancelButton: true,
    showConfirmButton: true,
    showClose: true,
    closeOnClickModal: false, // 点击遮罩层不关闭
    closeOnPressEscape: false, // 按ESC键不关闭
    confirmButtonText: '呼叫',
    cancelButtonText: '取消',
    dangerouslyUseHTMLString: true, // 必须设置为 true
    beforeClose: (action, instance, done) => {
      if (action === 'confirm') {
        instance.confirmButtonLoading = true;
        handleOtherCall().finally(() => {
          instance.confirmButtonLoading = false;
          done();
        });
      } else {
        done();
      }
    }
  }).catch(() => {
    // 取消操作
  });
};

const handleMaterialCall = async () => {
  await addMessage({
    workCenter: podConfig.value.workCenter,
    workStation: podConfig.value.resourceType,
    workStationDesc: podConfig.value.resourceTypeDesc,
    title: '物料呼叫',
    content: '线体' + podConfig.value.workCenter + '在工作岗位' + podConfig.value.resourceTypeDesc + '呼叫物料问题',
    messageType: 1,
    priority: 2,
    status: 1
  });
  await queryWorkCenterAbnormalCall();
};

const handleEquipmentCall = async () => {
  await addMessage({
    workCenter: podConfig.value.workCenter,
    workStation: podConfig.value.resourceType,
    workStationDesc: podConfig.value.resourceTypeDesc,
    title: '设备呼叫',
    content: '线体' + podConfig.value.workCenter + '在工作岗位' + podConfig.value.resourceTypeDesc + '呼叫设备问题',
    messageType: 1,
    priority: 3,
    status: 1
  });
  await queryWorkCenterAbnormalCall();
};

const handleQualityCall = async () => {
  await addMessage({
    workCenter: podConfig.value.workCenter,
    workStation: podConfig.value.resourceType,
    workStationDesc: podConfig.value.resourceTypeDesc,
    title: '品质呼叫',
    content: '线体' + podConfig.value.workCenter + '在工作岗位' + podConfig.value.resourceTypeDesc + '呼叫品质问题',
    messageType: 1,
    priority: 4,
    status: 1
  });
  await queryWorkCenterAbnormalCall();
};

const handleOtherCall = async () => {
  await addMessage({
    workCenter: podConfig.value.workCenter,
    workStation: podConfig.value.resourceType,
    workStationDesc: podConfig.value.resourceTypeDesc,
    title: '其他呼叫',
    content: '线体' + podConfig.value.workCenter + '在工作岗位' + podConfig.value.resourceTypeDesc + '呼叫生产问题',
    messageType: 1,
    priority: 1,
    status: 1
  });
  await queryWorkCenterAbnormalCall();
};

const handleCancel = () => {
  console.log('取消');
  // 处理取消逻辑
};

onMounted(() => {
  findPodConfig();
  queryWorkCenterAbnormalCall();
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
  transform: translate(2px);
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

.work-order-card {
  background-color: #f8fafc;
  border-radius: 8px;
}

.process-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-start;
  align-items: stretch; /* 确保所有卡片高度一致 */
}

.process-step {
  /* 移除固定宽度 */
  width: auto;
  min-width: 240px; /* 设置最小宽度 */
  flex: 1; /* 允许卡片弹性增长 */
  max-width: calc(20%); /* 仍然限制最大宽度 */

  max-height: 150px;
  min-height: 100px;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #556682;
  border: 1px solid #475569;
  box-sizing: border-box;
  flex-grow: 0;
  flex-shrink: 0;
}

.step-name {
  white-space: pre-line; /* 保留换行符并正常换行 */
  overflow: hidden;
  text-overflow: ellipsis; /* 文字过长时显示省略号 */
  color: white !important;
  font-size: 20px;
  width: 100%; /* 确保宽度填充 */
}

/*
.process-step:hover {
  border-color: #cbd5e1;
  background-color: #f1f5f9;
}
*/

.step-selected {
  border-color: #409eff;
  background-color: #0b317e;
  box-shadow: 0 0 0 1px #3b82f6;
}

.step-selected .step-index {
  background-color: #3b82f6;
  color: white;
}

.step-index {
  position: relative;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-weight: 500;
  color: #64748b;
  background-color: #e2e8f0;
  font-size: 12px;
}

.step-content {
  flex: 1;
}

.step-name {
  text-align: center;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 2px;
}

.step-status {
  font-size: 12px;
  color: #64748b;
}

/* 状态颜色 */
.step-status[status='completed'] {
  color: #10b981;
}

.step-status[status='processing'] {
  color: #3b82f6;
}

.step-status[status='pending'] {
  color: #64748b;
}

/* 异常状态样式 */
.step-warning {
  border: 2px solid #f56c6c;
  animation: pulse 1.5s infinite ease-in-out;
  position: relative;
  background: linear-gradient(45deg, #b91c1c, #ef4444) !important;
}

.step-warning .step-index {
  background-color: #ff0b4d;
  color: white;
  animation: blink 1.5s infinite;
}

.warning-icon {
  position: relative;
  font-size: 16px;
  animation: blink 1.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.7);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(245, 108, 108, 0);
    transform: scale(1.02);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0);
    transform: scale(1);
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .step-warning {
    border-width: 1px;
  }

  .warning-icon {
    font-size: 14px;
  }
}
</style>
