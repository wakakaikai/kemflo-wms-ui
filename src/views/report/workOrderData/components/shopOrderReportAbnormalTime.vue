<template>
  <div class="p-2">
    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:shopOrderReportAbnormalTime:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="shopOrderReportAbnormalTimeList" >
        <el-table-column label="工作中心" align="center" prop="workCenter" />
        <el-table-column label="工单号" align="center" prop="shopOrder" />
        <el-table-column label="停机开始时间" align="center" prop="shutdownStartTime" width="180" />
        <el-table-column label="停机结束时间" align="center" prop="shutdownEndTime" width="180" />
        <el-table-column label="停机原因" align="center" prop="shutdownReason">
          <template #default="scope">
            <dict-tag :options="mes_shutdown_reason" :value="scope.row.shutdownReason" />
          </template>
        </el-table-column>
        <el-table-column label="停机时长" align="center" prop="shutdownDuration" />
        <el-table-column label="有效停机时长" align="center" prop="effectiveShutdownDuration" />
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { listShopOrderReportAbnormalTime } from '@/api/mes/shopOrderReportAbnormalTime';
import { ShopOrderReportAbnormalTimeVO, ShopOrderReportAbnormalTimeQuery, ShopOrderReportAbnormalTimeForm } from '@/api/mes/shopOrderReportAbnormalTime/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { mes_shutdown_reason } = toRefs<any>(proxy?.useDict('mes_shutdown_reason'));

const shopOrderReportAbnormalTimeList = ref<ShopOrderReportAbnormalTimeVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const shopOrderReportAbnormalTimeFormRef = ref<ElFormInstance>();

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

const initFormData: ShopOrderReportAbnormalTimeForm = {
  id: undefined,
  reportId: undefined,
  workCenter: undefined,
  shopOrder: undefined,
  shutdownStartTime: undefined,
  shutdownEndTime: undefined,
  abnormalClass: undefined,
  abnormalType: undefined,
  shutdownReason: undefined,
  abnormalId: undefined,
  shutdownDuration: undefined,
  effectiveShutdownDuration: undefined
};
const data = reactive<PageData<ShopOrderReportAbnormalTimeForm, ShopOrderReportAbnormalTimeQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 30,
    reportId: undefined,
    workCenter: undefined,
    shopOrder: undefined,
    shutdownStartTime: undefined,
    shutdownEndTime: undefined,
    abnormalClass: undefined,
    abnormalType: undefined,
    shutdownReason: undefined,
    abnormalId: undefined,
    shutdownDuration: undefined,
    effectiveShutdownDuration: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '记录唯一ID不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询工单报工异常时间明细列表 */
const getList = async () => {
  loading.value = true;
  if (props.reportId) {
    queryParams.value.reportId = props.reportId;
  }
  const res = await listShopOrderReportAbnormalTime(queryParams.value);
  shopOrderReportAbnormalTimeList.value = res.rows;
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
  shopOrderReportAbnormalTimeFormRef.value?.resetFields();
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

/** 多选框选中数据 */
const handleSelectionChange = (selection: ShopOrderReportAbnormalTimeVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'mes/shopOrderReportAbnormalTime/export',
    {
      ...queryParams.value
    },
    `shopOrderReportAbnormalTime_${new Date().getTime()}.xlsx`
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
onMounted(() => {
  getList();
});
</script>
