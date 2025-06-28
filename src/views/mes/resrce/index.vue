<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="资源" prop="resrce">
              <el-input v-model="queryParams.resrce" placeholder="请输入资源" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="资源描述" prop="description">
              <el-input v-model="queryParams.description" placeholder="请输入资源描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="设置状态" prop="setupState">
              <el-input v-model="queryParams.setupState" placeholder="请输入设置状态" clearable @keyup.enter="handleQuery" />
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
            <el-button v-hasPermi="['wms:resrce:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:resrce:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:resrce:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['wms:resrce:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="resrceList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="资源" align="left" prop="resrce" width="200" />
        <el-table-column label="资源描述" align="left" prop="description" width="300" />
        <el-table-column label="状态" align="center" prop="status" />
        <el-table-column label="设置状态" align="center" prop="setupState" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="创建者" align="center" prop="creator" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="180" />
        <el-table-column label="更新者" align="center" prop="updater" />
        <el-table-column label="更新时间" align="center" prop="modifyTime" width="180" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['wms:resrce:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['wms:resrce:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <!-- 添加或修改资源对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="resrceFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="数据行索引" prop="handle">
          <el-input v-model="form.handle" placeholder="请输入数据行索引" />
        </el-form-item>
        <el-form-item label="资源" prop="resrce">
          <el-input v-model="form.resrce" placeholder="请输入资源" />
        </el-form-item>
        <el-form-item label="资源描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入资源描述" />
        </el-form-item>
        <el-form-item label="流程资源" prop="processResource">
          <el-input v-model="form.processResource" placeholder="请输入流程资源" />
        </el-form-item>
        <el-form-item label="有效期自" prop="validFrom">
          <el-date-picker v-model="form.validFrom" clearable type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择有效期自"> </el-date-picker>
        </el-form-item>
        <el-form-item label="有效期至" prop="validTo">
          <el-date-picker v-model="form.validTo" clearable type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择有效期至"> </el-date-picker>
        </el-form-item>
        <el-form-item label="设置状态" prop="setupState">
          <el-input v-model="form.setupState" placeholder="请输入设置状态" />
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

<script setup name="Resrce" lang="ts">
import { listResrce, getResrce, delResrce, addResrce, updateResrce } from '@/api/mes/resrce';
import { ResrceVO, ResrceQuery, ResrceForm } from '@/api/mes/resrce/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const resrceList = ref<ResrceVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const resrceFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ResrceForm = {
  id: undefined,
  handle: undefined,
  resrce: undefined,
  description: undefined,
  status: undefined,
  processResource: undefined,
  validFrom: undefined,
  validTo: undefined,
  setupState: undefined,
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
const data = reactive<PageData<ResrceForm, ResrceQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    handle: undefined,
    resrce: undefined,
    description: undefined,
    status: undefined,
    processResource: undefined,
    validFrom: undefined,
    validTo: undefined,
    setupState: undefined,
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
    tenantOrgId: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '记录唯一ID不能为空', trigger: 'blur' }],
    handle: [{ required: true, message: '数据行索引不能为空', trigger: 'blur' }],
    resrce: [{ required: true, message: '资源不能为空', trigger: 'blur' }],
    description: [{ required: true, message: '资源描述不能为空', trigger: 'blur' }],
    status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
    processResource: [{ required: true, message: '流程资源不能为空', trigger: 'blur' }],
    validFrom: [{ required: true, message: '有效期自不能为空', trigger: 'blur' }],
    validTo: [{ required: true, message: '有效期至不能为空', trigger: 'blur' }],
    setupState: [{ required: true, message: '设置状态不能为空', trigger: 'blur' }],
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
    belongOrgId: [{ required: true, message: '所属组织ID不能为空', trigger: 'blur' }],
    tenantOrgId: [{ required: true, message: '租户组织ID不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询资源列表 */
const getList = async () => {
  loading.value = true;
  const res = await listResrce(queryParams.value);
  resrceList.value = res.rows;
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
  resrceFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: ResrceVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加资源';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: ResrceVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getResrce(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改资源';
};

/** 提交按钮 */
const submitForm = () => {
  resrceFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateResrce(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addResrce(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: ResrceVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除资源编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delResrce(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/resrce/export',
    {
      ...queryParams.value
    },
    `resrce_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
