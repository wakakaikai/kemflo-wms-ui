<template>
  <div class="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
    <div class="flex flex-col space-y-4">
      <!-- 物料呼叫 (蓝色) -->
      <el-button type="primary" class="call-btn material-call relative ml-[11px]" @click="handleMaterialCall">
        <el-icon class="mr-1">
          <Box />
        </el-icon>
        物料
        <div class="indicator-bar"></div>
      </el-button>

      <!-- 设备呼叫 (橙色) -->
      <el-button type="warning" class="call-btn equipment-call relative" @click="handleEquipmentCall">
        <el-icon class="mr-1">
          <Setting />
        </el-icon>
        设备
        <div class="indicator-bar"></div>
      </el-button>

      <!-- 品质呼叫 (红色+金色图标) -->
      <el-button type="danger" class="call-btn quality-call relative" @click="handleQualityCall">
        <el-icon class="mr-1">
          <Medal />
        </el-icon>
        品质
        <div class="indicator-bar"></div>
      </el-button>

      <!-- 其他呼叫 (紫色) -->
      <el-button class="call-btn other-call relative bg-purple-500 hover:bg-purple-600 text-white" @click="handleOtherCall">
        <el-icon class="mr-1">
          <MoreFilled />
        </el-icon>
        其他
        <div class="indicator-bar"></div>
      </el-button>

      <!-- 取消按钮 (使用独特灰色) -->
<!--      <el-button class="call-btn cancel-call relative bg-gray-500 hover:bg-gray-600 text-white" @click="handleCancel">
        <el-icon class="mr-1">
          <Close />
        </el-icon>
        取消
        <div class="indicator-bar"></div>
      </el-button>-->
    </div>
  </div>
</template>

<script setup lang="ts">
import { Box, Setting, Medal, MoreFilled, Close } from '@element-plus/icons-vue';
import * as services from '@/api/mes/workpanel';
const emit = defineEmits(['material-call', 'equipment-call', 'quality-call', 'other-call', 'cancel']);

const handleMaterialCall = () => {
  services.sendMesWebSocket({
    sessionKeys: [1, '1831986097686552578'],
    message: JSON.stringify({
      'title': '物料呼叫',
      'content': 'SA0081生产线需要物料补给',
      'category': 'alert',
      'priority': 3,
      'line': 'SA0081',
      'material': 'XYZ-123'
    })
  });
  emit('material-call');
};

const handleEquipmentCall = () => {
  services.sendMesWebSocket({
    sessionKeys: [1, '1831986097686552578'],
    message: JSON.stringify({
      'title': '设备呼叫',
      'content': 'SA0081安规设备故障',
      'category': 'alert',
      'priority': 3,
      'line': 'SA0081',
      'material': ''
    })
  });
  emit('equipment-call');
};

const handleQualityCall = () => {
  services.sendMesWebSocket({
    sessionKeys: [1, '1831986097686552578'],
    message: '品质呼叫'
  });
  emit('quality-call');
  // 处理品质呼叫逻辑
};

const handleOtherCall = () => {
  services.sendMesWebSocket({
    sessionKeys: [1, '1831986097686552578'],
    message: '其他呼叫'
  });
  emit('other-call');
};

const handleCancel = () => {
  services.sendMesWebSocket({
    sessionKeys: [1, '1831986097686552578'],
    message: '取消呼叫'
  });
  emit('cancel');
  // 处理取消逻辑
};
</script>

<style scoped>
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
</style>
