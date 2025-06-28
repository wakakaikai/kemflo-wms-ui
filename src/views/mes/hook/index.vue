<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="数据行索引" prop="handle">
              <el-input v-model="queryParams.handle" placeholder="请输入数据行索引" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="关联点" prop="hookPoint">
              <el-input v-model="queryParams.hookPoint" placeholder="请输入关联点" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="关联对象行号" prop="contextGbo">
              <el-input v-model="queryParams.contextGbo" placeholder="请输入关联对象行号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="顺序号" prop="sequence">
              <el-input v-model="queryParams.sequence" placeholder="请输入顺序号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="是否启用" prop="enabled">
              <el-input v-model="queryParams.enabled" placeholder="请输入是否启用" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="用户参数" prop="userArgument">
              <el-input v-model="queryParams.userArgument" placeholder="请输入用户参数" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="作业行号" prop="activityBo">
              <el-input v-model="queryParams.activityBo" placeholder="请输入作业行号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="记录创建者ID" prop="createUserId">
              <el-input v-model="queryParams.createUserId" placeholder="请输入记录创建者ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="记录创建者" prop="creator">
              <el-input v-model="queryParams.creator" placeholder="请输入记录创建者" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="记录最后更新者ID" prop="modifyUserId">
              <el-input v-model="queryParams.modifyUserId" placeholder="请输入记录最后更新者ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="记录最后更新者" prop="updater">
              <el-input v-model="queryParams.updater" placeholder="请输入记录最后更新者" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="记录最后更新时间" prop="modifyTime">
              <el-date-picker clearable
                v-model="queryParams.modifyTime"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择记录最后更新时间"
              />
            </el-form-item>
            <el-form-item label="删除标记" prop="deleteFlag">
              <el-input v-model="queryParams.deleteFlag" placeholder="请输入删除标记" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="锁版本" prop="auditDataVersion">
              <el-input v-model="queryParams.auditDataVersion" placeholder="请输入锁版本" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="数据归属组织id" prop="secBuId">
              <el-input v-model="queryParams.secBuId" placeholder="请输入数据归属组织id" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="数据归属雇员id" prop="secUserId">
              <el-input v-model="queryParams.secUserId" placeholder="请输入数据归属雇员id" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="数据归属公司id" prop="secOuId">
              <el-input v-model="queryParams.secOuId" placeholder="请输入数据归属公司id" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="所属组织ID" prop="belongOrgId">
              <el-input v-model="queryParams.belongOrgId" placeholder="请输入所属组织ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="租户组织ID" prop="tenantOrgId">
              <el-input v-model="queryParams.tenantOrgId" placeholder="请输入租户组织ID" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:hook:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:hook:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:hook:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:hook:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="hookList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="记录唯一ID" align="center" prop="id" v-if="true" />
        <el-table-column label="数据行索引" align="center" prop="handle" />
        <el-table-column label="关联点" align="center" prop="hookPoint" />
        <el-table-column label="关联对象行号" align="center" prop="contextGbo" />
        <el-table-column label="顺序号" align="center" prop="sequence" />
        <el-table-column label="是否启用" align="center" prop="enabled" />
        <el-table-column label="用户参数" align="center" prop="userArgument" />
        <el-table-column label="作业行号" align="center" prop="activityBo" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="记录创建者ID" align="center" prop="createUserId" />
        <el-table-column label="记录创建者" align="center" prop="creator" />
        <el-table-column label="记录最后更新者ID" align="center" prop="modifyUserId" />
        <el-table-column label="记录最后更新者" align="center" prop="updater" />
        <el-table-column label="记录最后更新时间" align="center" prop="modifyTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.modifyTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="删除标记" align="center" prop="deleteFlag" />
        <el-table-column label="锁版本" align="center" prop="auditDataVersion" />
        <el-table-column label="数据归属组织id" align="center" prop="secBuId" />
        <el-table-column label="数据归属雇员id" align="center" prop="secUserId" />
        <el-table-column label="数据归属公司id" align="center" prop="secOuId" />
        <el-table-column label="所属组织ID" align="center" prop="belongOrgId" />
        <el-table-column label="租户组织ID" align="center" prop="tenantOrgId" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:hook:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:hook:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改Hook关联对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="hookFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="数据行索引" prop="handle">
          <el-input v-model="form.handle" placeholder="请输入数据行索引" />
        </el-form-item>
        <el-form-item label="关联点" prop="hookPoint">
          <el-input v-model="form.hookPoint" placeholder="请输入关联点" />
        </el-form-item>
        <el-form-item label="关联对象行号" prop="contextGbo">
          <el-input v-model="form.contextGbo" placeholder="请输入关联对象行号" />
        </el-form-item>
        <el-form-item label="顺序号" prop="sequence">
          <el-input v-model="form.sequence" placeholder="请输入顺序号" />
        </el-form-item>
        <el-form-item label="是否启用" prop="enabled">
          <el-input v-model="form.enabled" placeholder="请输入是否启用" />
        </el-form-item>
        <el-form-item label="用户参数" prop="userArgument">
          <el-input v-model="form.userArgument" placeholder="请输入用户参数" />
        </el-form-item>
        <el-form-item label="作业行号" prop="activityBo">
          <el-input v-model="form.activityBo" placeholder="请输入作业行号" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="记录创建者ID" prop="createUserId">
          <el-input v-model="form.createUserId" placeholder="请输入记录创建者ID" />
        </el-form-item>
        <el-form-item label="记录创建者" prop="creator">
          <el-input v-model="form.creator" placeholder="请输入记录创建者" />
        </el-form-item>
        <el-form-item label="记录最后更新者ID" prop="modifyUserId">
          <el-input v-model="form.modifyUserId" placeholder="请输入记录最后更新者ID" />
        </el-form-item>
        <el-form-item label="记录最后更新者" prop="updater">
          <el-input v-model="form.updater" placeholder="请输入记录最后更新者" />
        </el-form-item>
        <el-form-item label="记录最后更新时间" prop="modifyTime">
          <el-date-picker clearable
            v-model="form.modifyTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择记录最后更新时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="删除标记" prop="deleteFlag">
          <el-input v-model="form.deleteFlag" placeholder="请输入删除标记" />
        </el-form-item>
        <el-form-item label="锁版本" prop="auditDataVersion">
          <el-input v-model="form.auditDataVersion" placeholder="请输入锁版本" />
        </el-form-item>
        <el-form-item label="数据归属组织id" prop="secBuId">
          <el-input v-model="form.secBuId" placeholder="请输入数据归属组织id" />
        </el-form-item>
        <el-form-item label="数据归属雇员id" prop="secUserId">
          <el-input v-model="form.secUserId" placeholder="请输入数据归属雇员id" />
        </el-form-item>
        <el-form-item label="数据归属公司id" prop="secOuId">
          <el-input v-model="form.secOuId" placeholder="请输入数据归属公司id" />
        </el-form-item>
        <el-form-item label="所属组织ID" prop="belongOrgId">
          <el-input v-model="form.belongOrgId" placeholder="请输入所属组织ID" />
        </el-form-item>
        <el-form-item label="租户组织ID" prop="tenantOrgId">
          <el-input v-model="form.tenantOrgId" placeholder="请输入租户组织ID" />
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

<script setup name="Hook" lang="ts">
import { listHook, getHook, delHook, addHook, updateHook } from '@/api/mes/hook';
import { HookVO, HookQuery, HookForm } from '@/api/mes/hook/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const hookList = ref<HookVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const hookFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: HookForm = {
  id: undefined,
  handle: undefined,
  hookPoint: undefined,
  contextGbo: undefined,
  sequence: undefined,
  enabled: undefined,
  userArgument: undefined,
  activityBo: undefined,
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
}
const data = reactive<PageData<HookForm, HookQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    handle: undefined,
    hookPoint: undefined,
    contextGbo: undefined,
    sequence: undefined,
    enabled: undefined,
    userArgument: undefined,
    activityBo: undefined,
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
    params: {
    }
  },
  rules: {
    id: [
      { required: true, message: "记录唯一ID不能为空", trigger: "blur" }
    ],
    handle: [
      { required: true, message: "数据行索引不能为空", trigger: "blur" }
    ],
    hookPoint: [
      { required: true, message: "关联点不能为空", trigger: "blur" }
    ],
    contextGbo: [
      { required: true, message: "关联对象行号不能为空", trigger: "blur" }
    ],
    sequence: [
      { required: true, message: "顺序号不能为空", trigger: "blur" }
    ],
    enabled: [
      { required: true, message: "是否启用不能为空", trigger: "blur" }
    ],
    userArgument: [
      { required: true, message: "用户参数不能为空", trigger: "blur" }
    ],
    activityBo: [
      { required: true, message: "作业行号不能为空", trigger: "blur" }
    ],
    remark: [
      { required: true, message: "备注不能为空", trigger: "blur" }
    ],
    createUserId: [
      { required: true, message: "记录创建者ID不能为空", trigger: "blur" }
    ],
    creator: [
      { required: true, message: "记录创建者不能为空", trigger: "blur" }
    ],
    modifyUserId: [
      { required: true, message: "记录最后更新者ID不能为空", trigger: "blur" }
    ],
    updater: [
      { required: true, message: "记录最后更新者不能为空", trigger: "blur" }
    ],
    modifyTime: [
      { required: true, message: "记录最后更新时间不能为空", trigger: "blur" }
    ],
    deleteFlag: [
      { required: true, message: "删除标记不能为空", trigger: "blur" }
    ],
    auditDataVersion: [
      { required: true, message: "锁版本不能为空", trigger: "blur" }
    ],
    secBuId: [
      { required: true, message: "数据归属组织id不能为空", trigger: "blur" }
    ],
    secUserId: [
      { required: true, message: "数据归属雇员id不能为空", trigger: "blur" }
    ],
    secOuId: [
      { required: true, message: "数据归属公司id不能为空", trigger: "blur" }
    ],
    belongOrgId: [
      { required: true, message: "所属组织ID不能为空", trigger: "blur" }
    ],
    tenantOrgId: [
      { required: true, message: "租户组织ID不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询Hook关联列表 */
const getList = async () => {
  loading.value = true;
  const res = await listHook(queryParams.value);
  hookList.value = res.rows;
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
  hookFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: HookVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加Hook关联";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: HookVO) => {
  reset();
  const _id = row?.id || ids.value[0]
  const res = await getHook(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改Hook关联";
}

/** 提交按钮 */
const submitForm = () => {
  hookFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateHook(form.value).finally(() =>  buttonLoading.value = false);
      } else {
        await addHook(form.value).finally(() =>  buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: HookVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除Hook关联编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
  await delHook(_ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('mes/hook/export', {
    ...queryParams.value
  }, `hook_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>
