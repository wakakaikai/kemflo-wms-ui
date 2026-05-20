<template>
  <div class="mes-report-detail">
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <!-- 员工上线情况 -->
      <el-tab-pane label="员工打卡明细" name="employee">
        <template #label>
          <span class="tab-label">
            <el-icon><User /></el-icon>
            员工打卡明细
            <el-badge :value="employeeTotal" :max="999" class="tab-badge" v-if="employeeTotal > 0" />
          </span>
        </template>
        <div v-if="activeTab === 'employee'" class="tab-content-wrapper">
          <ShopOrderReportEmployee ref="employeeRef" :report-id="reportId" :shop-order="shopOrder" @update:total="handleEmployeeTotal" />
        </div>
      </el-tab-pane>

      <!-- 异常工时明细 -->
      <el-tab-pane label="异常时间明细" name="abnormal">
        <template #label>
          <span class="tab-label">
            <el-icon><Warning /></el-icon>
            异常时间明细
            <el-badge :value="abnormalTotal" :max="999" class="tab-badge" v-if="abnormalTotal > 0" />
          </span>
        </template>
        <div v-if="activeTab === 'abnormal'" class="tab-content-wrapper">
          <ShopOrderReportAbnormalTime ref="abnormalRef" :report-id="reportId" :shop-order="shopOrder" @update:total="handleAbnormalTotal" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { User, Warning } from '@element-plus/icons-vue';
import ShopOrderReportEmployee from './shopOrderReportEmployee.vue';
import ShopOrderReportAbnormalTime from './shopOrderReportAbnormalTime.vue';
import type { TabsPaneContext } from 'element-plus';

const router = useRouter();
const route = useRoute();

// 定义 Props
interface Props {
  reportId?: string | number;
  shopOrder?: string;
  showHeader?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  reportId: '',
  shopOrder: '',
  showHeader: true
});

// Tab 激活状态
const activeTab = ref('employee');

// 子组件引用
const employeeRef = ref();
const abnormalRef = ref();

// 统计数据
const employeeTotal = ref(0);
const abnormalTotal = ref(0);

// 处理员工总数更新
const handleEmployeeTotal = (total: number) => {
  employeeTotal.value = total;
};

// 处理异常总数更新
const handleAbnormalTotal = (total: number) => {
  abnormalTotal.value = total;
};

const handleTabClick = (tab: TabsPaneContext) => {
  console.log('切换到:', tab.paneName);
};

const goBack = () => {
  router.back();
};

// 监听路由参数变化（支持路由传参）
watch(
  () => route.params.reportId,
  (newVal) => {
    if (newVal && !props.reportId) {
      // 如果 props 没有传入，则使用路由参数
      console.log('从路由获取 reportId:', newVal);
    }
  },
  { immediate: true }
);

watch(
  () => route.query.shopOrder,
  (newVal) => {
    if (newVal && !props.shopOrder) {
      console.log('从路由获取 shopOrder:', newVal);
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.mes-report-detail {
  width: 100%;
  height: 100%;
  padding: 16px;

  .detail-header {
    margin-bottom: 16px;

    .page-title {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
    }

    .page-subtitle {
      font-size: 14px;
      color: #909399;
      margin-left: 8px;
    }
  }

  :deep(.el-tabs) {
    height: calc(100vh - 180px);

    .el-tabs__content {
      padding: 0;
      overflow: visible;
      height: calc(100% - 55px);
    }

    .el-tab-pane {
      height: 100%;
      overflow-y: auto;
    }
  }

  .tab-content-wrapper {
    height: 100%;
    overflow: hidden;
  }

  .tab-label {
    display: flex;
    align-items: center;
    gap: 6px;
    position: relative;

    .el-icon {
      font-size: 16px;
    }

    .tab-badge {
      position: absolute;
      top: -8px;
      right: -12px;

      :deep(.el-badge__content) {
        transform: translateY(0) scale(0.8);
      }
    }
  }
}
</style>
