<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="报工ID" prop="reportId">
              <el-input v-model="queryParams.reportId" placeholder="请输入报工ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工作中心" prop="workCenter">
              <el-input v-model="queryParams.workCenter" placeholder="请输入工作中心" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号" prop="shopOrder">
              <el-input v-model="queryParams.shopOrder" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="员工工号" prop="employeeId">
              <el-input v-model="queryParams.employeeId" placeholder="请输入员工工号" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:shopOrderReportEmployee:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:shopOrderReportEmployee:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:shopOrderReportEmployee:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:shopOrderReportEmployee:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="shopOrderReportEmployeeList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="报工ID" align="center" prop="reportId" />
        <el-table-column label="工作中心" align="center" prop="workCenter" />
        <el-table-column label="工单号" align="center" prop="shopOrder" />
        <el-table-column label="员工工号" align="center" prop="employeeId" />
        <el-table-column label="员工姓名" align="center" prop="employeeName" />
        <el-table-column label="上线时间" align="center" prop="onLineTime" width="180" />
        <el-table-column label="下线时间" align="center" prop="offLineTime" width="180" />
        <el-table-column label="出勤时长" align="center" prop="duration" />
        <el-table-column label="有效时长" align="center" prop="effectiveDuration" />
        <el-table-column label="操作时长" align="center" prop="operationDuration" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:shopOrderReportEmployee:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:shopOrderReportEmployee:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改工单报工员工在线明细对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="shopOrderReportEmployeeFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="报工ID" prop="reportId">
          <el-input v-model="form.reportId" placeholder="请输入报工ID" />
        </el-form-item>
        <el-form-item label="工作中心" prop="workCenter">
          <el-input v-model="form.workCenter" placeholder="请输入工作中心" />
        </el-form-item>
        <el-form-item label="工单号" prop="shopOrder">
          <el-input v-model="form.shopOrder" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="员工工号" prop="employeeId">
          <el-input v-model="form.employeeId" placeholder="请输入员工工号" />
        </el-form-item>
        <el-form-item label="员工姓名" prop="employeeName">
          <el-input v-model="form.employeeName" placeholder="请输入员工姓名" />
        </el-form-item>

        <el-form-item label="员工上线ID" prop="employeeBindingId">
          <el-input v-model="form.employeeBindingId" placeholder="请输入员工上线ID" />
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

<script setup name="ShopOrderReportEmployee" lang="ts">
import { listShopOrderReportEmployee, getShopOrderReportEmployee, delShopOrderReportEmployee, addShopOrderReportEmployee, updateShopOrderReportEmployee } from '@/api/mes/shopOrderReportEmployee';
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
    pageSize: 10,
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
  rules: {
    id: [{ required: true, message: '记录唯一ID不能为空', trigger: 'blur' }],
    reportId: [{ required: true, message: '报工ID不能为空', trigger: 'blur' }],
    workCenter: [{ required: true, message: '工作中心不能为空', trigger: 'blur' }],
    shopOrder: [{ required: true, message: '工单号不能为空', trigger: 'blur' }],
    employeeId: [{ required: true, message: '员工工号不能为空', trigger: 'blur' }],
    employeeName: [{ required: true, message: '员工姓名不能为空', trigger: 'blur' }],
    onLineTime: [{ required: true, message: '上线时间不能为空', trigger: 'blur' }],
    offLineTime: [{ required: true, message: '下线时间不能为空', trigger: 'blur' }],
    employeeBindingId: [{ required: true, message: '员工上线ID不能为空', trigger: 'blur' }],
    duration: [{ required: true, message: '出勤时长不能为空', trigger: 'blur' }],
    effectiveDuration: [{ required: true, message: '有效时长不能为空', trigger: 'blur' }],
    belongOrgId: [{ required: true, message: '所属组织ID不能为空', trigger: 'blur' }],
    tenantOrgId: [{ required: true, message: '租户组织ID不能为空', trigger: 'blur' }],
    remark: [{ required: true, message: '备注不能为空', trigger: 'blur' }],
    createUserId: [{ required: true, message: '记录创建者ID不能为空', trigger: 'blur' }],
    creator: [{ required: true, message: '记录创建者不能为空', trigger: 'blur' }],
    modifyUserId: [{ required: true, message: '记录最后更新者ID不能为空', trigger: 'blur' }],
    updater: [{ required: true, message: '记录最后更新者不能为空', trigger: 'blur' }],
    modifyTime: [{ required: true, message: '记录最后更新时间不能为空', trigger: 'blur' }],
    deleteFlag: [{ required: true, message: '删除标记不能为空', trigger: 'blur' }],
    auditDataVersion: [{ required: true, message: '锁版本不能为空', trigger: 'blur' }],
    secBuId: [{ required: true, message: '数据归属组织id不能为空', trigger: 'blur' }],
    secUserId: [{ required: true, message: '数据归属雇员id不能为空', trigger: 'blur' }],
    secOuId: [{ required: true, message: '数据归属公司id不能为空', trigger: 'blur' }],
    operationDuration: [{ required: true, message: '操作时长不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询工单报工员工在线明细列表 */
const getList = async () => {
  loading.value = true;
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

/** 多选框选中数据 */
const handleSelectionChange = (selection: ShopOrderReportEmployeeVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加工单报工员工在线明细';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: ShopOrderReportEmployeeVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getShopOrderReportEmployee(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工单报工员工在线明细';
};

/** 提交按钮 */
const submitForm = () => {
  shopOrderReportEmployeeFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateShopOrderReportEmployee(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addShopOrderReportEmployee(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: ShopOrderReportEmployeeVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工单报工员工在线明细编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delShopOrderReportEmployee(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
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

onMounted(() => {
  getList();
});
</script>
