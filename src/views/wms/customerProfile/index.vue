<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="客户代码" prop="kunnr">
              <el-input v-model="queryParams.kunnr" placeholder="请输入客户代码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="名称" prop="name">
              <el-input v-model="queryParams.name" placeholder="请输入名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="公司" prop="bukrs">
              <el-input v-model="queryParams.bukrs" placeholder="请输入公司" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="地址" prop="address">
              <el-input v-model="queryParams.address" placeholder="请输入地址" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="科目" prop="akont">
              <el-input v-model="queryParams.akont" placeholder="请输入科目" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="付款条件" prop="zterm">
              <el-input v-model="queryParams.zterm" placeholder="请输入付款条件" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="销售地区" prop="bzirk">
              <el-input v-model="queryParams.bzirk" placeholder="请输入销售地区" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="客户组" prop="kdgrp">
              <el-input v-model="queryParams.kdgrp" placeholder="请输入客户组" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="币别" prop="waers">
              <el-input v-model="queryParams.waers" placeholder="请输入币别" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="贸易条件1" prop="inco1">
              <el-input v-model="queryParams.inco1" placeholder="请输入贸易条件1" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="付款条件2" prop="inco2">
              <el-input v-model="queryParams.inco2" placeholder="请输入付款条件2" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="账户分配组" prop="ktgrd">
              <el-input v-model="queryParams.ktgrd" placeholder="请输入账户分配组" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="税分类" prop="taxkd">
              <el-input v-model="queryParams.taxkd" placeholder="请输入税分类" clearable @keyup.enter="handleQuery" />
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
            <el-button v-hasPermi="['wms:customerProfile:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:customerProfile:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:customerProfile:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:customerProfile:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns"  @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table :key="tableKey" v-loading="loading" :data="customerProfileList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="columns[0].visible" label="公司" align="left" prop="bukrs" />
        <el-table-column v-if="columns[1].visible" label="客户代码" width="100" align="center" prop="kunnr" />
        <el-table-column v-if="columns[2].visible" label="名称" width="240" align="left" prop="name" fixed />
        <el-table-column v-if="columns[3].visible" label="地址" width="260" align="left" prop="address" />
        <el-table-column v-if="columns[4].visible" label="国家" align="left" prop="country" />
        <el-table-column v-if="columns[5].visible" label="城市" align="left" prop="city" />
        <el-table-column v-if="columns[6].visible" label="语言" align="left" prop="language" />
        <el-table-column v-if="columns[7].visible" label="电话号码" width="150" align="left" prop="telNumber" />
        <el-table-column v-if="columns[8].visible" label="邮箱地址" width="200" align="left" prop="smtpAddr" />
        <el-table-column v-if="columns[9].visible" label="科目" width="120" align="left" prop="akont" />
        <el-table-column v-if="columns[10].visible" label="付款条件" align="left" prop="zterm" />
        <el-table-column v-if="columns[11].visible" label="销售地区" align="left" prop="bzirk" />
        <el-table-column v-if="columns[12].visible" label="客户组" align="left" prop="kdgrp" />
        <el-table-column v-if="columns[13].visible" label="币别" align="left" prop="waers" />
        <el-table-column v-if="columns[14].visible" label="贸易条件1" width="100" align="left" prop="inco1" />
        <el-table-column v-if="columns[15].visible" label="付款条件2" width="100" align="left" prop="inco2" />
        <el-table-column v-if="columns[16].visible" label="账户分配组" width="100" align="left" prop="ktgrd" />
        <el-table-column v-if="columns[17].visible" label="税分类" align="left" prop="taxkd" />
        <el-table-column label="操作" align="left" class-name="small-padding fixed-width" fixed="right">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['wms:customerProfile:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['wms:customerProfile:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <!-- 添加或修改客户档案对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="600px" append-to-body>
      <el-form ref="customerProfileFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="公司" prop="bukrs">
          <el-input v-model="form.bukrs" placeholder="请输入公司" />
        </el-form-item>
        <el-form-item label="客户代码" prop="kunnr">
          <el-input v-model="form.kunnr" placeholder="请输入客户代码" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="国家" prop="country">
          <el-input v-model="form.country" placeholder="请输入国家" />
        </el-form-item>
        <el-form-item label="城市" prop="city">
          <el-input v-model="form.city" placeholder="请输入城市" />
        </el-form-item>
        <el-form-item label="语言" prop="language">
          <el-input v-model="form.language" placeholder="请输入语言" />
        </el-form-item>
        <el-form-item label="电话号码" prop="telNumber">
          <el-input v-model="form.telNumber" placeholder="请输入电话号码" />
        </el-form-item>
        <el-form-item label="邮箱地址" prop="smtpAddr">
          <el-input v-model="form.smtpAddr" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="科目" prop="akont">
          <el-input v-model="form.akont" placeholder="请输入科目" />
        </el-form-item>
        <el-form-item label="付款条件" prop="zterm">
          <el-input v-model="form.zterm" placeholder="请输入付款条件" />
        </el-form-item>
        <el-form-item label="销售地区" prop="bzirk">
          <el-input v-model="form.bzirk" placeholder="请输入销售地区" />
        </el-form-item>
        <el-form-item label="客户组" prop="kdgrp">
          <el-input v-model="form.kdgrp" placeholder="请输入客户组" />
        </el-form-item>
        <el-form-item label="币别" prop="waers">
          <el-input v-model="form.waers" placeholder="请输入币别" />
        </el-form-item>
        <el-form-item label="贸易条件1" prop="inco1">
          <el-input v-model="form.inco1" placeholder="请输入贸易条件1" />
        </el-form-item>
        <el-form-item label="付款条件2" prop="inco2">
          <el-input v-model="form.inco2" placeholder="请输入付款条件2" />
        </el-form-item>
        <el-form-item label="账户分配组" prop="ktgrd">
          <el-input v-model="form.ktgrd" placeholder="请输入账户分配组" />
        </el-form-item>
        <el-form-item label="税分类" prop="taxkd">
          <el-input v-model="form.taxkd" placeholder="请输入税分类" />
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

<script setup name="CustomerProfile" lang="ts">
import { listCustomerProfile, getCustomerProfile, delCustomerProfile, addCustomerProfile, updateCustomerProfile } from '@/api/wms/customerProfile';
import { CustomerProfileVO, CustomerProfileQuery, CustomerProfileForm } from '@/api/wms/customerProfile/types';
import { TableColumns } from '@/api/types';
import { ref } from 'vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const tableKey = ref(1);
// 创建响应式数组对象
const columns = ref<TableColumns[]>([
  { key: 1, label: '公司', visible: true },
  { key: 2, label: '客户代码', visible: true },
  { key: 3, label: '名称', visible: true },
  { key: 4, label: '地址', visible: true },
  { key: 5, label: '国家', visible: true },
  { key: 6, label: '城市', visible: true },
  { key: 7, label: '语言', visible: true },
  { key: 8, label: '电话号码', visible: true },
  { key: 9, label: '邮箱地址', visible: true },
  { key: 10, label: '科目', visible: true },
  { key: 11, label: '付款条件', visible: true },
  { key: 12, label: '销售地区', visible: true },
  { key: 13, label: '客户组', visible: true },
  { key: 14, label: '币别', visible: true },
  { key: 15, label: '贸易条件1', visible: true },
  { key: 16, label: '付款条件2', visible: true },
  { key: 17, label: '账户分配组', visible: true },
  { key: 18, label: '税分类', visible: true },
]);
watch(
  columns,
  () => {
    tableKey.value = tableKey.value + 1;
  },
  { immediate: true }
);
const customerProfileList = ref<CustomerProfileVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const customerProfileFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: CustomerProfileForm = {
  id: undefined,
  bukrs: undefined,
  kunnr: undefined,
  name: undefined,
  address: undefined,
  country: undefined,
  city: undefined,
  language: undefined,
  telNumber: undefined,
  smtpAddr: undefined,
  akont: undefined,
  zterm: undefined,
  loevm: undefined,
  bzirk: undefined,
  kdgrp: undefined,
  waers: undefined,
  inco1: undefined,
  inco2: undefined,
  ktgrd: undefined,
  taxkd: undefined,
  flag: undefined
};
const data = reactive<PageData<CustomerProfileForm, CustomerProfileQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    id: undefined,
    bukrs: undefined,
    kunnr: undefined,
    name: undefined,
    address: undefined,
    country: undefined,
    city: undefined,
    language: undefined,
    telNumber: undefined,
    smtpAddr: undefined,
    akont: undefined,
    zterm: undefined,
    loevm: undefined,
    bzirk: undefined,
    kdgrp: undefined,
    waers: undefined,
    inco1: undefined,
    inco2: undefined,
    ktgrd: undefined,
    taxkd: undefined,
    flag: undefined,
    params: {}
  },
  rules: {
    bukrs: [{ required: true, message: '公司不能为空', trigger: 'blur' }],
    kunnr: [{ required: true, message: '客户代码不能为空', trigger: 'blur' }],
    name: [{ required: true, message: '名称不能为空', trigger: 'blur' }]
    // address: [{ required: true, message: '地址不能为空', trigger: 'blur' }],
    // country: [{ required: true, message: '国家不能为空', trigger: 'blur' }],
    // city: [{ required: true, message: '城市不能为空', trigger: 'blur' }],
    // language: [{ required: true, message: '语言不能为空', trigger: 'blur' }],
    // telNumber: [{ required: true, message: '电话号码不能为空', trigger: 'blur' }],
    // smtpAddr: [{ required: true, message: '邮箱地址不能为空', trigger: 'blur' }],
    // akont: [{ required: true, message: '科目不能为空', trigger: 'blur' }],
    // zterm: [{ required: true, message: '付款条件不能为空', trigger: 'blur' }],
    // loevm: [{ required: true, message: '删除标识不能为空', trigger: 'blur' }],
    // bzirk: [{ required: true, message: '销售地区不能为空', trigger: 'blur' }],
    // kdgrp: [{ required: true, message: '客户组不能为空', trigger: 'blur' }],
    // waers: [{ required: true, message: '币别不能为空', trigger: 'blur' }],
    // inco1: [{ required: true, message: '贸易条件1不能为空', trigger: 'blur' }],
    // inco2: [{ required: true, message: '付款条件2不能为空', trigger: 'blur' }],
    // ktgrd: [{ required: true, message: '账户分配组不能为空', trigger: 'blur' }],
    // taxkd: [{ required: true, message: '税分类不能为空', trigger: 'blur' }],
    // flag: [{ required: true, message: '标记不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询客户档案列表 */
const getList = async () => {
  loading.value = true;
  const res = await listCustomerProfile(queryParams.value);
  customerProfileList.value = res.rows.map((item) => ({ ...item, id: item.bukrs.concat('-', item.kunnr) }));
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
  customerProfileFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: CustomerProfileVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加客户档案';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: CustomerProfileVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getCustomerProfile(_id);
  Object.assign(form.value, { ...res.data, id: res.data.bukrs.concat('-', res.data.kunnr) });
  dialog.visible = true;
  dialog.title = '修改客户档案';
};

/** 提交按钮 */
const submitForm = () => {
  customerProfileFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateCustomerProfile(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addCustomerProfile(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: CustomerProfileVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除客户档案编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delCustomerProfile(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/customerProfile/export',
    {
      ...queryParams.value
    },
    `customerProfile_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
