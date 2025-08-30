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
            <el-form-item label="发货日期" prop="deliveryTime">
              <el-date-picker v-model="queryParams.deliveryTime" clearable type="date" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择发货日期" :shortcuts="shortcuts" />
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
            <el-button v-hasPermi="['wms:shippingCustomerNotice:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:shippingCustomerNotice:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:shippingCustomerNotice:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:shippingCustomerNotice:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="shippingCustomerNoticeList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="客户代码" align="center" prop="customerCode" />
        <el-table-column label="客户名称" align="left" prop="customerName">
          <template #default="scope">
            <router-link :to="'/wms/shipping-notice/index/1/' + scope.row.id" class="link-type">
              <span>{{ scope.row.customerName }}</span>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column label="发货日期" align="center" prop="deliveryTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.deliveryTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="计划总数量" align="center" prop="totalQty" />
        <el-table-column label="扫码总数量" align="center" prop="scanQty">
          <template #default="scope">
            <router-link :to="'/wms/shipping-notice-detail/index/1/' + scope.row.id" class="link-type">
              <span>{{ scope.row.scanQty }}</span>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['wms:shippingCustomerNotice:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-divider direction="vertical" />
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['wms:shippingCustomerNotice:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
            <el-divider direction="vertical" />
            <el-tooltip content="生产数据" placement="top">
              <el-button v-hasPermi="['report:mesProductData:list']" link type="primary" icon="Tools" @click="handleQueryProductData(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <!-- 添加或修改客户出货通知对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="shippingCustomerNoticeFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="客户代码" prop="customerCode">
          <el-input v-model="form.customerCode" placeholder="请输入客户代码" />
        </el-form-item>
        <el-form-item label="客户名称" prop="customerName">
          <el-input v-model="form.customerName" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="发货日期" prop="deliveryTime">
          <el-date-picker
            v-model="form.deliveryTime"
            clearable
            type="date"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择发货日期"
            :shortcuts="shortcuts"
            style="width: 100% !important"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="计划总数量" prop="totalQty">
          <el-input-number v-model="form.totalQty" :min="0" controls-position="right" placeholder="请输入总数量" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ShippingCustomerNotice" lang="ts">
import {
  listShippingCustomerNotice,
  getShippingCustomerNotice,
  delShippingCustomerNotice,
  addShippingCustomerNotice,
  updateShippingCustomerNotice
} from '@/api/wms/shippingCustomerNotice';
import { ShippingCustomerNoticeVO, ShippingCustomerNoticeQuery, ShippingCustomerNoticeForm } from '@/api/wms/shippingCustomerNotice/types';
import { parseTime } from '@/utils/ruoyi';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const shippingCustomerNoticeList = ref<ShippingCustomerNoticeVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const shippingCustomerNoticeFormRef = ref<ElFormInstance>();
const shortcuts = [
  {
    text: '前天',
    value: () => {
      const date = new Date();
      date.setTime(date.getTime() - 3600 * 1000 * 48);
      return date;
    }
  },
  {
    text: '昨天',
    value: () => {
      const date = new Date();
      date.setTime(date.getTime() - 3600 * 1000 * 24);
      return date;
    }
  },
  {
    text: '今天',
    value: new Date()
  },
  {
    text: '明天',
    value: () => {
      const date = new Date();
      date.setTime(date.getTime() + 3600 * 1000 * 24);
      return date;
    }
  },
  {
    text: '后天',
    value: () => {
      const date = new Date();
      date.setTime(date.getTime() + 3600 * 1000 * 48);
      return date;
    }
  }
];
const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ShippingCustomerNoticeForm = {
  id: undefined,
  customerCode: undefined,
  customerName: undefined,
  deliveryTime: undefined,
  totalQty: undefined
};
const data = reactive<PageData<ShippingCustomerNoticeForm, ShippingCustomerNoticeQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    customerCode: undefined,
    customerName: undefined,
    deliveryTime: undefined,
    totalQty: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '主键不能为空', trigger: 'blur' }],
    customerCode: [{ required: true, message: '客户代码不能为空', trigger: 'blur' }],
    customerName: [{ required: true, message: '客户名称不能为空', trigger: 'blur' }],
    deliveryTime: [{ required: true, message: '发货日期不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询客户出货通知列表 */
const getList = async () => {
  loading.value = true;
  const res = await listShippingCustomerNotice(queryParams.value);
  shippingCustomerNoticeList.value = res.rows;
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
  shippingCustomerNoticeFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: ShippingCustomerNoticeVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加客户出货通知';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: ShippingCustomerNoticeVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getShippingCustomerNotice(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改客户出货通知';
};

/** 提交按钮 */
const submitForm = () => {
  shippingCustomerNoticeFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateShippingCustomerNotice(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addShippingCustomerNotice(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: ShippingCustomerNoticeVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除客户出货通知编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delShippingCustomerNotice(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};
/** 跳转MES生产数据导出页面 */
const handleQueryProductData = async (row?: ShippingCustomerNoticeVO) => {
  proxy.$router.push({
    path: `/report/mesProductData`,
    query: {
      shippingCustomerNoticeId: row?.id
    }
  });
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/shippingCustomerNotice/export',
    {
      ...queryParams.value
    },
    `shippingCustomerNotice_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  queryParams.value.deliveryTime = parseTime(date, '{y}-{m}-{d} {h}:{i}:{s}');
  getList();
});
</script>
