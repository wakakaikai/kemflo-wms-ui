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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:customer:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:customer:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:customer:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:customer:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="customerList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="客户代码" align="center" prop="customerCode" />
        <el-table-column label="客户名称" align="center" prop="customerName" />
        <el-table-column label="国家代码" align="center" prop="countryCode" />
        <el-table-column label="国家名称" align="center" prop="countryName" />
        <el-table-column label="语言" align="center" prop="language" />
        <el-table-column label="地址" align="center" prop="address" />
        <el-table-column label="城市" align="center" prop="city" />
        <el-table-column label="地区" align="center" prop="region" />
        <el-table-column label="邮政编码" align="center" prop="postalCode" />
        <el-table-column label="联系人" align="center" prop="contactPerson" />
        <el-table-column label="电话" align="center" prop="phone" />
        <el-table-column label="传真" align="center" prop="fax" />
        <el-table-column label="分机号" align="center" prop="extension" />
        <el-table-column label="电子邮件" align="center" prop="email" />
        <el-table-column label="状态：1-有效 0-无效" align="center" prop="status" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:customer:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:customer:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改客户档案对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="customerFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="客户代码" prop="customerCode">
          <el-input v-model="form.customerCode" placeholder="请输入客户代码" />
        </el-form-item>
        <el-form-item label="客户名称" prop="customerName">
          <el-input v-model="form.customerName" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="国家代码" prop="countryCode">
          <el-input v-model="form.countryCode" placeholder="请输入国家代码" />
        </el-form-item>
        <el-form-item label="国家名称" prop="countryName">
          <el-input v-model="form.countryName" placeholder="请输入国家名称" />
        </el-form-item>
        <el-form-item label="语言" prop="language">
          <el-input v-model="form.language" placeholder="请输入语言" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="城市" prop="city">
          <el-input v-model="form.city" placeholder="请输入城市" />
        </el-form-item>
        <el-form-item label="地区" prop="region">
          <el-input v-model="form.region" placeholder="请输入地区" />
        </el-form-item>
        <el-form-item label="邮政编码" prop="postalCode">
          <el-input v-model="form.postalCode" placeholder="请输入邮政编码" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="form.contactPerson" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="传真" prop="fax">
          <el-input v-model="form.fax" placeholder="请输入传真" />
        </el-form-item>
        <el-form-item label="分机号" prop="extension">
          <el-input v-model="form.extension" placeholder="请输入分机号" />
        </el-form-item>
        <el-form-item label="电子邮件" prop="email">
          <el-input v-model="form.email" placeholder="请输入电子邮件" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Customer" lang="ts">
import { listCustomer, getCustomer, delCustomer, addCustomer, updateCustomer } from '@/api/wms/customer';
import { CustomerVO, CustomerQuery, CustomerForm } from '@/api/wms/customer/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const customerList = ref<CustomerVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const customerFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: CustomerForm = {
  id: undefined,
  customerCode: undefined,
  customerName: undefined,
  countryCode: undefined,
  countryName: undefined,
  language: undefined,
  address: undefined,
  city: undefined,
  region: undefined,
  postalCode: undefined,
  contactPerson: undefined,
  phone: undefined,
  fax: undefined,
  extension: undefined,
  email: undefined,
  status: undefined,
  remark: undefined,
}
const data = reactive<PageData<CustomerForm, CustomerQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    customerCode: undefined,
    customerName: undefined,
    countryCode: undefined,
    countryName: undefined,
    language: undefined,
    address: undefined,
    city: undefined,
    region: undefined,
    postalCode: undefined,
    contactPerson: undefined,
    phone: undefined,
    fax: undefined,
    extension: undefined,
    email: undefined,
    status: undefined,
    params: {
    }
  },
  rules: {
    id: [
      { required: true, message: "唯一ID不能为空", trigger: "blur" }
    ],
    customerCode: [
      { required: true, message: "客户代码不能为空", trigger: "blur" }
    ],
    status: [
      { required: true, message: "状态：1-有效 0-无效不能为空", trigger: "change" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询客户档案列表 */
const getList = async () => {
  loading.value = true;
  const res = await listCustomer(queryParams.value);
  customerList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
}

/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  customerFormRef.value?.resetFields();
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
}

/** 多选框选中数据 */
const handleSelectionChange = (selection: CustomerVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加客户档案";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: CustomerVO) => {
  reset();
  const _id = row?.id || ids.value[0]
  const res = await getCustomer(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改客户档案";
}

/** 提交按钮 */
const submitForm = () => {
  customerFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateCustomer(form.value).finally(() =>  buttonLoading.value = false);
      } else {
        await addCustomer(form.value).finally(() =>  buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: CustomerVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除客户档案编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
  await delCustomer(_ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('wms/customer/export', {
    ...queryParams.value
  }, `customer_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>
