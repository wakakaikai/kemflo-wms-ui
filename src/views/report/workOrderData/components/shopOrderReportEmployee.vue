<template>
  <div class="p-2">
    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:shopOrderReportEmployee:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="shopOrderReportEmployeeList" :height="tableHeight" >
        <!--        <el-table-column label="报工ID" align="center" prop="reportId" />-->
        <el-table-column label="工作中心" align="center" prop="workCenter" />
        <el-table-column label="工单号" align="center" prop="shopOrder" />
        <el-table-column label="员工工号" align="center" prop="employeeId" />
        <el-table-column label="员工姓名" align="center" prop="employeeName" />
        <el-table-column label="上线时间" align="center" prop="onLineTime" width="180" />
        <el-table-column label="下线时间" align="center" prop="offLineTime" width="180" />
        <!--        <el-table-column label="员工上线ID" align="center" prop="employeeBindingId" />-->
        <el-table-column label="出勤时长" align="center" prop="duration" />
        <el-table-column label="有效时长" align="center" prop="effectiveDuration" />
        <el-table-column label="操作时长" align="center" prop="operationDuration" />
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { listShopOrderReportEmployee } from '@/api/mes/shopOrderReportEmployee';
import { ShopOrderReportEmployeeVO, ShopOrderReportEmployeeQuery, ShopOrderReportEmployeeForm } from '@/api/mes/shopOrderReportEmployee/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const shopOrderReportEmployeeList = ref<ShopOrderReportEmployeeVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const shopOrderReportEmployeeFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
// 定义 Props
interface Props {
  reportId?: string | number;
  shopOrder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  reportId: '',
  shopOrder: ''
});

// 定义 Emits
const emit = defineEmits<{
  'update:total': [value: number];
}>();

const initFormData: ShopOrderReportEmployeeForm = {
  id: undefined,
  reportId: undefined,
  workCenter: undefined,
  shopOrder: undefined,
  employeeId: undefined,
  employeeName: undefined,
  onLineTime: undefined,
  offLineTime: undefined,
  employeeBindingId: undefined,
  duration: undefined,
  effectiveDuration: undefined,
  belongOrgId: undefined,
  tenantOrgId: undefined,
  remark: undefined,
  createUserId: undefined,
  creator: undefined,
  modifyUserId: undefined,
  updater: undefined,
  modifyTime: undefined,
  deleteFlag: undefined,
  auditDataVersion: undefined,
  secBuId: undefined,
  secUserId: undefined,
  secOuId: undefined,
  operationDuration: undefined
};
const data = reactive<PageData<ShopOrderReportEmployeeForm, ShopOrderReportEmployeeQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 30,
    reportId: undefined,
    workCenter: undefined,
    shopOrder: undefined,
    employeeId: undefined,
    employeeName: undefined,
    onLineTime: undefined,
    offLineTime: undefined,
    employeeBindingId: undefined,
    duration: undefined,
    effectiveDuration: undefined,
    belongOrgId: undefined,
    tenantOrgId: undefined,
    createUserId: undefined,
    creator: undefined,
    modifyUserId: undefined,
    updater: undefined,
    modifyTime: undefined,
    deleteFlag: undefined,
    auditDataVersion: undefined,
    secBuId: undefined,
    secUserId: undefined,
    secOuId: undefined,
    operationDuration: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

// 动态表格高度
const tableHeight = ref<number>(350);

// 计算表格高度
const calcTableHeight = () => {
  // 窗口高度 - 页面其他占位高度（根据你的页面自行调整）
  const clientHeight = document.documentElement.clientHeight;
  // 减去：搜索表单 + 按钮栏 + 分页 + 间距等（自行调整）
  const subtractHeight = 480;
  let height = clientHeight - subtractHeight;

  // 最小高度限制（避免表格太矮）
  if (height < 300) height = 300;
  tableHeight.value = height;
};

/** 查询工单报工员工在线明细列表 */
const getList = async () => {
  loading.value = true;
  if (props.reportId) {
    queryParams.value.reportId = props.reportId;
  }
  const res = await listShopOrderReportEmployee(queryParams.value);
  shopOrderReportEmployeeList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  shopOrderReportEmployeeFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'mes/shopOrderReportEmployee/export',
    {
      ...queryParams.value
    },
    `shopOrderReportEmployee_${new Date().getTime()}.xlsx`
  );
};

// 监听 props 变化，自动重新查询
watch(
  () => [props.reportId],
  () => {
    getList();
  },
  { immediate: true }
);

// 监听窗口变化
let resizeTimer: NodeJS.Timeout | null = null;
const handleResize = () => {
  // 防抖
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    calcTableHeight();
  }, 100);
};

onMounted(() => {
  getList();
  calcTableHeight();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (resizeTimer) clearTimeout(resizeTimer);
});
</script>
