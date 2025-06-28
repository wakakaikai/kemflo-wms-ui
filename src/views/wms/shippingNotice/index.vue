<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb8-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="客户代码" prop="customerCode">
              <el-input v-model="queryParams.customerCode" placeholder="请输入客户代码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="客户名称" prop="customerName">
              <el-input v-model="queryParams.customerName" placeholder="请输入客户名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="客户单号" prop="customerNo">
              <el-input v-model="queryParams.customerNo" placeholder="请输入客户单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="发货日期" prop="deliveryTime" style="width: 308px">
              <el-date-picker v-model="queryParams.deliveryTime" clearable type="date" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择发货日期" :shortcuts="shortcuts" />
            </el-form-item>
            <el-form-item label="物料" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入物料" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="旧料号" prop="oldItem">
              <el-input v-model="queryParams.oldItem" placeholder="请输入旧料号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料描述" prop="itemDesc">
              <el-input v-model="queryParams.itemDesc" placeholder="请输入物料描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="statusList" style="width: 308px">
              <el-select v-model="queryParams.statusList" placeholder="请选择状态" clearable multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="5">
                <el-option v-for="dict in wms_shipping_notice_status" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
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
            <el-button v-hasPermi="['wms:shippingNotice:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:shippingNotice:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:shippingNotice:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:shippingNotice:import']" type="info" plain icon="Upload" @click="handleImport">导入</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:shippingNotice:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <el-col :span="1.5">
            <router-link to="/wms/shipping-notice/print">
              <el-button v-hasPermi="['wms:shippingNotice:print']" color="#626aef" plain icon="Printer">打印</el-button>
            </router-link>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table :key="tableKey" v-loading="loading" :data="shippingNoticeList" row-key="id" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="columns[0].visible" label="客户代码" align="left" prop="customerCode" width="100" />
        <el-table-column v-if="columns[1].visible" label="客户名称" align="left" prop="customerName" width="240" />
        <el-table-column v-if="columns[2].visible" label="客户单号" align="left" prop="customerNo" width="120" />
        <el-table-column v-if="columns[3].visible" label="物料" align="left" prop="item" width="150" />
        <el-table-column v-if="columns[4].visible" label="旧料号" align="left" prop="oldItem" width="150" />
        <el-table-column v-if="columns[5].visible" label="物料描述" align="left" prop="itemDesc" width="250" />
        <el-table-column v-if="columns[6].visible" label="发货日期" align="left" prop="deliveryTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.deliveryTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[7].visible" label="目的地" align="left" prop="deliveryDestination" />
        <el-table-column v-if="columns[8].visible" label="出货数量" align="left" prop="qty" />
        <el-table-column v-if="columns[9].visible" label="扫码数量" align="left" prop="scanQty">
          <template #default="scope">
            <router-link :to="'/wms/shipping-notice-detail/index/2/' + scope.row.id" class="link-type">
              <span>{{ scope.row.scanQty }}</span>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[10].visible" label="数量备注" align="left" prop="qtyRemark" />
        <el-table-column v-if="columns[11].visible" label="状态" align="left" prop="status">
          <template #default="scope">
            <dict-tag :options="wms_shipping_notice_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[12].visible" label="备注" align="left" prop="remark" width="200" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['wms:shippingNotice:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['wms:shippingNotice:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <!-- 添加或修改出货通知对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="35%" append-to-body>
      <el-form ref="shippingNoticeFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="客户代码" prop="customerCode">
          <el-input v-model="form.customerCode" placeholder="请输入客户代码" />
        </el-form-item>
        <el-form-item label="客户名称" prop="customerName">
          <el-input v-model="form.customerName" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="客户单号" prop="customerNo">
          <el-input v-model="form.customerNo" placeholder="请输入客户单号" />
        </el-form-item>
        <el-form-item label="发货目的地" prop="deliveryDestination">
          <el-input v-model="form.deliveryDestination" placeholder="请输入发货目的地" />
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
        <el-form-item label="物料" prop="item">
          <el-input v-model="form.item" placeholder="请输入物料" />
        </el-form-item>
        <el-form-item label="旧料号" prop="oldItem">
          <el-input v-model="form.oldItem" placeholder="请输入旧料号" />
        </el-form-item>
        <el-form-item label="物料描述" prop="itemDesc">
          <el-input v-model="form.itemDesc" placeholder="请输入物料描述" />
        </el-form-item>
        <el-form-item label="出货数量" prop="qty">
          <el-input-number v-model="form.qty" :min="0" controls-position="right" placeholder="请输入数量" />
        </el-form-item>
        <el-form-item label="数量备注" prop="qtyRemark">
          <el-input v-model="form.qtyRemark" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" maxlength="255" show-word-limit placeholder="请输入数量备注" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option
              v-for="dict in wms_shipping_notice_status"
              :key="dict.value"
              :label="dict.label"
              :value="parseInt(dict.value)"
              :disabled="(form.id && (dict.value == 2 || dict.value == 3)) || !form.id ? false : true"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" maxlength="1000" show-word-limit placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button :loading="buttonLoading" type="primary" @click="submitForm()">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="upload.open" :title="upload.title" width="400px" append-to-body>
      <el-upload
        ref="uploadRef"
        :limit="1"
        accept=".xlsx, .xls"
        :headers="upload.headers"
        :action="upload.url + '?updateSupport=' + upload.updateSupport"
        :disabled="upload.isUploading"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        :auto-upload="false"
        drag
      >
        <el-icon class="el-icon--upload">
          <i-ep-upload-filled />
        </el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="text-center el-upload__tip">
            <span>仅允许导入xls、xlsx格式文件。</span>
            <el-link type="primary" :underline="false" style="font-size: 12px; vertical-align: baseline" @click="importTemplate">下载模板</el-link>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="upload.open = false">取 消</el-button>
          <el-button type="primary" @click="submitFileForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ShippingNotice" lang="ts">
import { listShippingNotice, getShippingNotice, delShippingNotice, addShippingNotice, updateShippingNotice } from '@/api/wms/shippingNotice';
import { getShippingCustomerNotice } from '@/api/wms/shippingCustomerNotice';
import { ShippingNoticeVO, ShippingNoticeQuery, ShippingNoticeForm } from '@/api/wms/shippingNotice/types';
import { globalHeaders } from '@/utils/request';
import { parseTime } from '@/utils/ruoyi';
import { ref } from 'vue';
import { TableColumns } from '@/api/wms/recCheck/types';

const route = useRoute();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_shipping_notice_status } = toRefs<any>(proxy?.useDict('wms_shipping_notice_status'));
const shippingNoticeList = ref<ShippingNoticeVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
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
const queryFormRef = ref<ElFormInstance>();
const shippingNoticeFormRef = ref<ElFormInstance>();
const uploadRef = ref<ElUploadInstance>();
const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const tableKey = ref(1);
// 创建响应式数组对象
const columns = ref<TableColumns[]>([
  { key: 1, label: '客户代码', visible: true },
  { key: 2, label: '客户名称', visible: true },
  { key: 3, label: '客户单号', visible: true },
  { key: 4, label: '物料', visible: true },
  { key: 5, label: '旧料号', visible: true },
  { key: 6, label: '物料描述', visible: true },
  { key: 7, label: '发货日期', visible: true },
  { key: 8, label: '目的地', visible: true },
  { key: 9, label: '出货数量', visible: true },
  { key: 10, label: '扫码数量', visible: true },
  { key: 11, label: '数量备注', visible: true },
  { key: 12, label: '状态', visible: true },
  { key: 13, label: '备注', visible: true }
]);
watch(
  columns,
  () => {
    tableKey.value = tableKey.value + 1;
  },
  { immediate: true }
);
const initFormData: ShippingNoticeForm = {
  id: undefined,
  shippingCustomerNoticeId: undefined,
  customerCode: undefined,
  customerName: undefined,
  customerNo: undefined,
  shipmentNo: undefined,
  deliveryDestination: undefined,
  deliveryTime: undefined,
  item: undefined,
  oldItem: undefined,
  itemDesc: undefined,
  qty: undefined,
  qtyRemark: undefined,
  statusList: [],
  remark: undefined
};
const data = reactive<PageData<ShippingNoticeForm, ShippingNoticeQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    shippingCustomerNoticeId: undefined,
    customerCode: undefined,
    customerName: undefined,
    customerNo: undefined,
    shipmentNo: undefined,
    deliveryDestination: undefined,
    deliveryTime: undefined,
    item: undefined,
    oldItem: undefined,
    itemDesc: undefined,
    qty: undefined,
    qtyRemark: undefined,
    statusList: undefined,
    params: {}
  },
  rules: {
    // id: [{ required: true, message: '主键不能为空', trigger: 'blur' }],
    // customerCode: [{ required: true, message: '客户代码不能为空', trigger: 'blur' }],
    customerName: [{ required: true, message: '客户名称不能为空', trigger: 'blur' }],
    deliveryTime: [{ required: true, message: '发货日期不能为空', trigger: 'blur' }],
    item: [{ required: true, message: '物料不能为空', trigger: 'blur' }],
    itemDesc: [{ required: true, message: '物料描述不能为空', trigger: 'blur' }]
  }
});

/*** 出货通知导入参数 */
const upload = reactive<ImportOption>({
  // 是否显示弹出层（用户导入）
  open: false,
  // 弹出层标题（用户导入）
  title: '',
  // 是否禁用上传
  isUploading: false,
  // 是否更新已经存在的用户数据
  updateSupport: 0,
  // 设置上传的请求头部
  headers: globalHeaders(),
  // 上传的地址
  url: import.meta.env.VITE_APP_BASE_API + '/wms/shippingNotice/importData'
});
const { queryParams, form, rules } = toRefs(data);

/** 查询出货通知列表 */
const getList = async () => {
  loading.value = true;
  if (queryParams.value.shippingCustomerNoticeId) {
    queryParams.value.deliveryTime = null;
  }
  const res = await listShippingNotice(queryParams.value);
  shippingNoticeList.value = res.rows;
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
  shippingNoticeFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getRouterParams();
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: ShippingNoticeVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = async () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加出货通知';
  if (queryParams.value.shippingCustomerNoticeId) {
    const res = await getShippingCustomerNotice(queryParams.value.shippingCustomerNoticeId);
    form.value.customerCode = res.data.customerCode;
    form.value.customerName = res.data.customerName;
    form.value.deliveryTime = res.data.deliveryTime;
  }
};

/** 修改按钮操作 */
const handleUpdate = async (row?: ShippingNoticeVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getShippingNotice(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改出货通知';
};

/** 提交按钮 */
const submitForm = () => {
  shippingNoticeFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateShippingNotice(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addShippingNotice(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: ShippingNoticeVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除出货计划编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delShippingNotice(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};
/** 导入按钮操作 */
const handleImport = () => {
  upload.title = '出货通知导入';
  upload.open = true;
};
/** 下载模板操作 */
const importTemplate = () => {
  proxy?.download('wms/shippingNotice/importTemplate', {}, `shippingNotice_template_${new Date().getTime()}.xlsx`);
};
/**文件上传中处理 */
const handleFileUploadProgress = () => {
  upload.isUploading = true;
};
/** 文件上传成功处理 */
const handleFileSuccess = (response: any, file: UploadFile) => {
  upload.open = false;
  upload.isUploading = false;
  uploadRef.value?.handleRemove(file);
  ElMessageBox.alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + '</div>', '导入结果', {
    dangerouslyUseHTMLString: true
  });
  getList();
};

/** 提交上传文件 */
function submitFileForm() {
  uploadRef.value?.submit();
}
/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/shippingNotice/export',
    {
      ...queryParams.value
    },
    `shippingNotice_${new Date().getTime()}.xlsx`
  );
};

/** 获取路由数据 */
const getRouterParams = () => {
  if (route.params && (route.params.shippingNoticeId as string)) {
    if (route.params.type === '1') {
      queryParams.value.shippingCustomerNoticeId = route.params.shippingNoticeId;
      form.value.id = route.params.shippingNoticeId;
    }
    if (route.params.type === '2') {
      queryParams.value.shippingCustomerNoticeId = route.params.shippingNoticeId;
      form.value.id = route.params.shippingNoticeId;
    }
  }
};
onMounted(() => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  queryParams.value.deliveryTime = parseTime(date, '{y}-{m}-{d} {h}:{i}:{s}');
  getRouterParams();
  getList();
});
</script>
<style scoped lang="scss">
/** 移动端展示 **/
@media screen and (max-width: 500px) {
  .el-picker-panel__sidebar {
    width: 100%;
  }
  .el-picker-panel {
    width: 400px !important;
  }
  .el-picker-panel__content {
    width: 100%;
  }
  .el-picker-panel__body {
    margin-left: 0 !important;
    display: flex;
    flex-direction: column;
    min-width: auto !important;
  }
  .el-picker-panel__sidebar {
    position: relative;
  }
  .el-picker-panel__body-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}
</style>
