<template>
  <div class="p-2">
    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:packingDetailSn:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="packingDetailSnList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="工单号" align="center" prop="workOrderNo" />
        <el-table-column label="条码" align="center" prop="sn" />
        <el-table-column label="数量" align="center" prop="qty" />
        <el-table-column label="生产日期" align="center" prop="productDate" width="180" />
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup name="PackingDetailSn" lang="ts">
import { listPackingDetailSn } from '@/api/wms/packingDetailSn';
import { PackingDetailSnVO, PackingDetailSnQuery, PackingDetailSnForm } from '@/api/wms/packingDetailSn/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const packingDetailSnList = ref<PackingDetailSnVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const packingDetailSnFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: PackingDetailSnForm = {
  id: undefined,
  packingDetailId: undefined,
  workOrderNo: undefined,
  sn: undefined,
  qty: undefined,
  productDate: undefined,
  remark: undefined
};
const data = reactive<PageData<PackingDetailSnForm, PackingDetailSnQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    packingDetailId: undefined,
    workOrderNo: undefined,
    sn: undefined,
    qty: undefined,
    productDate: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

/** 查询打包产品条码明细列表 */
const getList = async () => {
  loading.value = true;
  const res = await listPackingDetailSn(queryParams.value);
  packingDetailSnList.value = res.rows;
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
  packingDetailSnFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: PackingDetailSnVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/packingDetailSn/export',
    {
      ...queryParams.value
    },
    `packingDetailSn_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  if (route.params && route.query.packingDetailId) {
    queryParams.value.packingDetailId = route.query.packingDetailId;
    form.value.packingDetailId = route.query.packingDetailId;
  }
  getList();
});
</script>
