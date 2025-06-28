<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="客户代码" prop="customerCode">
              <el-input v-model="queryParams.customerCode" placeholder="请输入客户代码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="客户名称" prop="customerName">
              <el-input v-model="queryParams.customerName" placeholder="请输入客户名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="条码" prop="sfc">
              <el-input v-model="queryParams.sfc" placeholder="请输入条码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入物料" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料描述" prop="itemDesc">
              <el-input v-model="queryParams.itemDesc" placeholder="请输入物料描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="目的地" prop="shipmentDestination">
              <el-input v-model="queryParams.shipmentDestination" placeholder="请输入目的地" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <DictRadio v-model="queryParams.status" :radio-data="wms_shipping_detail_status" :show-all="'all'" size="small" @change="handleQuery"></DictRadio>
            </el-form-item>
            <el-form-item label="扫码时间" prop="dateTimeRange">
              <el-date-picker
                v-model="queryParams.dateTimeRange"
                type="datetimerange"
                :shortcuts="shortcuts"
                value-format="YYYY-MM-DD HH:mm:ss"
                range-separator="-"
                start-placeholder="请选择开始日期"
                end-placeholder="请选择结束日期"
                :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:shippingDetail:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:shippingDetail:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:shippingDetail:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:shippingDetail:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>

          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @query-table="getList"></right-toolbar>
          <el-badge :value="total" :max="99999999" color="green" class="ml10 mr20">
            <el-button circle icon="Document" />
          </el-badge>
        </el-row>
      </template>

      <el-table :key="tableKey" v-loading="loading" :data="shippingDetailList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="columns[0].visible" label="客户代码" width="110" align="left" prop="customerCode" />
        <el-table-column v-if="columns[1].visible" label="客户名称" width="240" align="left" prop="customerName" />
        <el-table-column v-if="columns[2].visible" label="条码" width="260" align="left" prop="sfc" />
        <el-table-column v-if="columns[3].visible" label="扫码时间" align="left" prop="dateTime" width="180" />
        <el-table-column label="状态" align="left" prop="status">
          <template #default="scope">
            <dict-tag :options="wms_shipping_detail_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[4].visible" label="工单号" align="left" prop="shopOrder" width="140" />
        <el-table-column v-if="columns[5].visible" label="物料" align="left" prop="item" width="120" />
        <el-table-column v-if="columns[6].visible" label="物料描述" align="left" prop="itemDesc" width="250" />
        <el-table-column v-if="columns[7].visible" label="客户订单号" align="left" prop="customerNo" width="120" />
        <el-table-column v-if="columns[8].visible" label="目的地" align="left" prop="shipmentDestination" />
        <el-table-column v-if="columns[9].visible" label="备注" align="left" prop="remark" width="200" />
        <el-table-column label="操作" align="left" class-name="small-padding fixed-width" fixed="right">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['wms:shippingDetail:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['wms:shippingDetail:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <!-- 添加或修改出货明细对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="35%" append-to-body>
      <el-form ref="shippingDetailFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="条码" prop="sfc" style="width: 100%">
          <el-input v-model="form.sfc" placeholder="请输入条码" @keydown.enter.prevent="keyDownTab" />
        </el-form-item>
        <el-form-item v-if="form.id" label="扫码时间" prop="dateTime">
          <el-date-picker v-model="form.dateTime" clearable type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择扫码时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="客户代码" prop="customerCode">
          <el-input v-model="form.customerCode" placeholder="请输入客户代码" />
        </el-form-item>
        <el-form-item label="客户名称" prop="customerName">
          <el-input v-model="form.customerName" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="客户订单号" prop="customerNo">
          <el-input v-model="form.customerNo" placeholder="请输入客户订单号" />
        </el-form-item>
        <el-form-item label="目的地" prop="shipmentDestination">
          <el-input v-model="form.shipmentDestination" placeholder="请输入出货目的地" />
        </el-form-item>
        <el-form-item label="物料" prop="item">
          <el-input v-model="form.item" placeholder="请输入物料" />
        </el-form-item>
        <el-form-item label="物料描述" prop="itemDesc">
          <el-input v-model="form.itemDesc" placeholder="请输入物料描述" />
        </el-form-item>
        <el-form-item v-if="form.id" label="工单号" prop="shopOrder">
          <el-input v-model="form.shopOrder" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" maxlength="255" show-word-limit placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button :loading="buttonLoading" type="primary" @click="submitForm(0)">保 存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ShippingDetail" lang="ts">
import { listShippingDetail, getShippingDetail, delShippingDetail, addShippingDetail, updateShippingDetail } from '@/api/wms/shippingDetail';
import { getShippingNotice } from '@/api/wms/shippingNotice';
import { getShippingCustomerNotice } from '@/api/wms/shippingCustomerNotice';
import { ShippingDetailVO, ShippingDetailQuery, ShippingDetailForm } from '@/api/wms/shippingDetail/types';
import { TableColumns } from '@/api/types';
import { ref } from 'vue';
const route = useRoute();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_shipping_detail_status } = toRefs<any>(proxy?.useDict('wms_shipping_detail_status'));
const shippingDetailList = ref<ShippingDetailVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const multipleValues = ref<ShippingDetailVO[]>([]);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const shippingDetailFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const tableKey = ref(1);
// 创建响应式数组对象
const columns = ref<TableColumns[]>([
  { key: 1, label: '客户代码', visible: true },
  { key: 2, label: '客户名称', visible: true },
  { key: 3, label: '条码', visible: true },
  { key: 4, label: '扫码时间', visible: true },
  { key: 5, label: '工单号', visible: true },
  { key: 6, label: '物料', visible: true },
  { key: 7, label: '物料描述', visible: true },
  { key: 8, label: '客户订单号', visible: true },
  { key: 9, label: '目的地', visible: true },
  { key: 10, label: '备注', visible: true }
]);
watch(
  columns,
  () => {
    tableKey.value = tableKey.value + 1;
  },
  { immediate: true }
);
const initFormData: ShippingDetailForm = {
  id: undefined,
  shippingCustomerNoticeId: undefined,
  shippingNoticeId: undefined,
  customerCode: undefined,
  customerName: undefined,
  customerNo: undefined,
  shipmentNo: undefined,
  shipmentDestination: undefined,
  item: undefined,
  itemDesc: undefined,
  sfc: undefined,
  dateTime: undefined,
  dateTimeRange: undefined,
  shopOrder: undefined,
  remark: undefined
};
const data = reactive<PageData<ShippingDetailForm, ShippingDetailQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    shippingCustomerNoticeId: undefined,
    shippingNoticeId: undefined,
    customerCode: undefined,
    customerName: undefined,
    customerNo: undefined,
    shipmentNo: undefined,
    shipmentDestination: undefined,
    item: undefined,
    itemDesc: undefined,
    sfc: undefined,
    status: null,
    dateTime: undefined,
    dateTimeRange: [],
    shopOrder: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '主键不能为空', trigger: 'blur' }],
    customerCode: [{ required: true, message: '客户代码不能为空', trigger: 'blur' }],
    customerName: [{ required: true, message: '客户名称不能为空', trigger: 'blur' }],
    sfc: [{ required: true, message: '条码不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);
const shortcuts = [
  {
    text: '今天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate());
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '昨天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近两天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近三天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 2);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近一周',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近一月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近三月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  }
];
/** 查询出货明细列表 */
const getList = async () => {
  loading.value = true;
  const res = await listShippingDetail(queryParams.value);
  shippingDetailList.value = res.rows;
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
  shippingDetailFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: ShippingDetailVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
  multipleValues.value = selection;
};

/** 新增按钮操作 */
const handleAdd = async () => {
  reset();
  getRouterParams();
  form.value.id = null;
  form.value.remark = '';
  dialog.visible = true;
  dialog.title = '添加出货明细';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: ShippingDetailVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getShippingDetail(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改出货明细';
};

/** 提交按钮 */
const submitForm = (ignoreError: number) => {
  shippingDetailFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      form.value.ignoreError = ignoreError;
      if (form.value.id) {
        await updateShippingDetail(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addShippingDetail(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};
const keyDownTab = async () => {
  shippingDetailFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (!form.value.id) {
        await addShippingDetail(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
    }
  });
};
/** 删除按钮操作 */
const handleDelete = async (row?: ShippingDetailVO) => {
  const _ids = row?.id || ids.value;
  const sfcList = multipleValues.value.map((item) => item.sfc);
  await proxy?.$modal.confirm('是否确认删除条码为" ' + sfcList + ' "的数据项？').finally(() => (loading.value = false));
  await delShippingDetail(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/shippingDetail/export',
    {
      ...queryParams.value
    },
    `shippingDetail_${new Date().getTime()}.xlsx`
  );
};
/** 获取路由数据 */
const getRouterParams = async () => {
  if (route.params && (route.params.shippingNoticeId as string)) {
    if (route.params.type === '1') {
      queryParams.value.shippingCustomerNoticeId = route.params.shippingNoticeId;
      form.value.shippingCustomerNoticeId = route.params.shippingNoticeId;
      const res = await getShippingCustomerNotice(queryParams.value.shippingCustomerNoticeId);
      form.value.customerCode = res.data.customerCode;
      form.value.customerName = res.data.customerName;
    }
    if (route.params.type === '2') {
      queryParams.value.shippingNoticeId = route.params.shippingNoticeId;
      form.value.shippingNoticeId = route.params.shippingNoticeId;
      const res = await getShippingNotice(queryParams.value.shippingNoticeId);
      form.value.customerCode = res.data.customerCode;
      form.value.customerName = res.data.customerName;
      form.value.customerNo = res.data.customerNo;
      form.value.shipmentDestination = res.data.shipmentDestination;
      form.value.item = res.data.item;
      form.value.itemDesc = res.data.itemDesc;
    }
  }
};
onMounted(() => {
  getRouterParams();
  getList();
});
</script>
<style lang="scss" scoped>
.el-popper.is-customized {
  /* Set padding to ensure the height is 32px */
  padding: 6px 12px;
  background: linear-gradient(90deg, rgb(159, 229, 151), rgb(204, 229, 129));
}

.el-popper.is-customized .el-popper__arrow::before {
  background: linear-gradient(45deg, #b2e68d, #bce689);
  right: 0;
}
</style>
