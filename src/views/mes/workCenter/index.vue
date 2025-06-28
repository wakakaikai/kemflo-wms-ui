<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" label-width="auto" :inline="true">
            <el-form-item label="工作中心" prop="workCenter">
              <el-input v-model="queryParams.workCenter" placeholder="请输入工作中心" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="描述" prop="description">
              <el-input v-model="queryParams.description" placeholder="请输入描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工作中心分类" prop="wcCategory">
              <el-input v-model="queryParams.wcCategory" placeholder="请输入工作中心分类" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:workCenter:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:workCenter:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:workCenter:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:workCenter:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="workCenterList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="工作中心" align="center" prop="workCenter" />
        <el-table-column label="描述" align="center" prop="description" />
        <el-table-column label="状态" align="center" prop="status" />
        <el-table-column label="工作中心分类" align="center" prop="wcCategory" />
        <el-table-column label="末级工作中心" align="center" prop="isLastWorkCenter" />
        <el-table-column label="ERP工作中心" align="center" prop="isErpWorkCenter" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="创建者" align="center" prop="creator" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="180" />
        <el-table-column label="更新者" align="center" prop="updater" />
        <el-table-column label="更新时间" align="center" prop="modifyTime" width="180" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:workCenter:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:workCenter:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改工作中心档案对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="workCenterFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="数据行索引" prop="handle">
          <el-input v-model="form.handle" placeholder="请输入数据行索引" />
        </el-form-item>
        <el-form-item label="工作中心" prop="workCenter">
          <el-input v-model="form.workCenter" placeholder="请输入工作中心" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="工作中心分类" prop="wcCategory">
          <el-input v-model="form.wcCategory" placeholder="请输入工作中心分类" />
        </el-form-item>
        <el-form-item label="工艺路线" prop="routerBo">
          <el-input v-model="form.routerBo" placeholder="请输入工艺路线" />
        </el-form-item>
        <el-form-item label="是否末级工作中心, true|false" prop="isLastWorkCenter">
          <el-input v-model="form.isLastWorkCenter" placeholder="请输入是否末级工作中心, true|false" />
        </el-form-item>
        <el-form-item label="是否ERP工作中心, true|false" prop="isErpWorkCenter">
          <el-input v-model="form.isErpWorkCenter" placeholder="请输入是否ERP工作中心, true|false" />
        </el-form-item>
        <el-form-item label="ERP工作中心" prop="erpWorkCenter">
          <el-input v-model="form.erpWorkCenter" placeholder="请输入ERP工作中心" />
        </el-form-item>
        <el-form-item label="生产供应区" prop="productionSupplyArea">
          <el-input v-model="form.productionSupplyArea" placeholder="请输入生产供应区" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
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

<script setup name="WorkCenter" lang="ts">
import { listWorkCenter, getWorkCenter, delWorkCenter, addWorkCenter, updateWorkCenter } from '@/api/mes/workCenter';
import { WorkCenterVO, WorkCenterQuery, WorkCenterForm } from '@/api/mes/workCenter/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const workCenterList = ref<WorkCenterVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const workCenterFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: WorkCenterForm = {
  id: undefined,
  handle: undefined,
  workCenter: undefined,
  description: undefined,
  status: undefined,
  wcCategory: undefined,
  routerBo: undefined,
  isLastWorkCenter: undefined,
  isErpWorkCenter: undefined,
  erpWorkCenter: undefined,
  productionSupplyArea: undefined,
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
  belongOrgId: undefined,
  tenantOrgId: undefined
};
const data = reactive<PageData<WorkCenterForm, WorkCenterQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    handle: undefined,
    workCenter: undefined,
    description: undefined,
    status: undefined,
    wcCategory: undefined,
    routerBo: undefined,
    isLastWorkCenter: undefined,
    isErpWorkCenter: undefined,
    erpWorkCenter: undefined,
    productionSupplyArea: undefined,
    createUserId: undefined,
    creator: undefined,
    modifyUserId: undefined,
    updater: undefined,
    modifyTime: undefined,
    deleteFlag: undefined,
    tenantOrgId: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '记录唯一ID不能为空', trigger: 'blur' }],
    handle: [{ required: true, message: '数据行索引不能为空', trigger: 'blur' }],
    workCenter: [{ required: true, message: '工作中心不能为空', trigger: 'blur' }],
    description: [{ required: true, message: '描述不能为空', trigger: 'blur' }],
    status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
    wcCategory: [{ required: true, message: '工作中心分类不能为空', trigger: 'blur' }],
    isLastWorkCenter: [{ required: true, message: '是否末级工作中心, true|false不能为空', trigger: 'blur' }],
    isErpWorkCenter: [{ required: true, message: '是否ERP工作中心, true|false不能为空', trigger: 'blur' }],
    erpWorkCenter: [{ required: true, message: 'ERP工作中心不能为空', trigger: 'blur' }],
    remark: [{ required: true, message: '备注不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询工作中心档案列表 */
const getList = async () => {
  loading.value = true;
  const res = await listWorkCenter(queryParams.value);
  workCenterList.value = res.rows;
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
  workCenterFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: WorkCenterVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加工作中心档案';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: WorkCenterVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getWorkCenter(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工作中心档案';
};

/** 提交按钮 */
const submitForm = () => {
  workCenterFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateWorkCenter(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addWorkCenter(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: WorkCenterVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工作中心档案编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delWorkCenter(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/workCenter/export',
    {
      ...queryParams.value
    },
    `workCenter_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
