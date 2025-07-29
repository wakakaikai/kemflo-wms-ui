<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="组织代码" prop="orgCode">
              <el-input v-model="queryParams.orgCode" placeholder="请输入组织代码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="部门ID" prop="departmentId">
              <el-input v-model="queryParams.departmentId" placeholder="请输入部门ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="部门描述" prop="departmentName">
              <el-input v-model="queryParams.departmentName" placeholder="请输入部门描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="角色ID" prop="roleId">
              <el-input v-model="queryParams.roleId" placeholder="请输入角色ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="部门id" prop="deptId">
              <el-input v-model="queryParams.deptId" placeholder="请输入部门id" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['system:hrDeptRole:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['system:hrDeptRole:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['system:hrDeptRole:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['system:hrDeptRole:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="hrDeptRoleList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />
        <el-table-column label="组织代码" align="center" prop="orgCode" />
        <el-table-column label="部门ID" align="center" prop="departmentId" />
        <el-table-column label="部门描述" align="center" prop="departmentName" />
        <el-table-column label="角色ID" align="center" prop="roleId" />
        <el-table-column label="部门id" align="center" prop="deptId" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:hrDeptRole:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:hrDeptRole:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改HR部门角色同步对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="hrDeptRoleFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="组织代码" prop="orgCode">
          <el-input v-model="form.orgCode" placeholder="请输入组织代码" />
        </el-form-item>
        <el-form-item label="部门ID" prop="departmentId">
          <el-input v-model="form.departmentId" placeholder="请输入部门ID" />
        </el-form-item>
        <el-form-item label="部门描述" prop="departmentName">
          <el-input v-model="form.departmentName" placeholder="请输入部门描述" />
        </el-form-item>
        <el-form-item label="角色ID" prop="roleId">
          <el-input v-model="form.roleId" placeholder="请输入角色ID" />
        </el-form-item>
        <el-form-item label="部门id" prop="deptId">
          <el-input v-model="form.deptId" placeholder="请输入部门id" />
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

<script setup name="HrDeptRole" lang="ts">
import { listHrDeptRole, getHrDeptRole, delHrDeptRole, addHrDeptRole, updateHrDeptRole } from '@/api/system/hrDeptRole';
import { HrDeptRoleVO, HrDeptRoleQuery, HrDeptRoleForm } from '@/api/system/hrDeptRole/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const hrDeptRoleList = ref<HrDeptRoleVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const hrDeptRoleFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: HrDeptRoleForm = {
  id: undefined,
  orgCode: undefined,
  departmentId: undefined,
  departmentName: undefined,
  roleId: undefined,
  deptId: undefined,
  remark: undefined
};
const data = reactive<PageData<HrDeptRoleForm, HrDeptRoleQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    orgCode: undefined,
    departmentId: undefined,
    departmentName: undefined,
    roleId: undefined,
    deptId: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    orgCode: [{ required: true, message: '组织代码不能为空', trigger: 'blur' }],
    departmentId: [{ required: true, message: '部门ID不能为空', trigger: 'blur' }],
    departmentName: [{ required: true, message: '部门描述不能为空', trigger: 'blur' }],
    roleId: [{ required: true, message: '角色ID不能为空', trigger: 'blur' }],
    deptId: [{ required: true, message: '部门id不能为空', trigger: 'blur' }],
    remark: [{ required: true, message: '备注不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询HR部门角色同步列表 */
const getList = async () => {
  loading.value = true;
  const res = await listHrDeptRole(queryParams.value);
  hrDeptRoleList.value = res.rows;
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
  hrDeptRoleFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: HrDeptRoleVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加HR部门角色同步';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: HrDeptRoleVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getHrDeptRole(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改HR部门角色同步';
};

/** 提交按钮 */
const submitForm = () => {
  hrDeptRoleFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateHrDeptRole(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addHrDeptRole(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: HrDeptRoleVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除HR部门角色同步编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delHrDeptRole(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'system/hrDeptRole/export',
    {
      ...queryParams.value
    },
    `hrDeptRole_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
