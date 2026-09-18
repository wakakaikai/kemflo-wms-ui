<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="随机数编号" prop="randomCode">
              <el-input v-model="queryParams.randomCode" placeholder="请输入随机数编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="描述" prop="description">
              <el-input v-model="queryParams.description" placeholder="请输入描述" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:nextNumberRandom:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:nextNumberRandom:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:nextNumberRandom:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:nextNumberRandom:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="nextNumberRandomList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="随机数编号" align="center" prop="randomCode" />
        <el-table-column label="描述" align="center" prop="description" />
        <el-table-column label="随机数范围" align="center" prop="letterRange" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="创建者" align="center" prop="creator" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="180" />
        <el-table-column label="更新者" align="center" prop="updater" />
        <el-table-column label="更新时间" align="center" prop="modifyTime" width="180" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:nextNumberRandom:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:nextNumberRandom:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改编号规则随机数对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="nextNumberRandomFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="随机数编号" prop="randomCode">
          <el-input v-model="form.randomCode" placeholder="请输入随机数编号" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="随机数范围" prop="letterRange">
          <el-input v-model="form.letterRange" placeholder="请输入随机数范围" />
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

<script setup name="NextNumberRandom" lang="ts">
import { listNextNumberRandom, getNextNumberRandom, delNextNumberRandom, addNextNumberRandom, updateNextNumberRandom } from '@/api/mes/nextNumberRandom';
import { NextNumberRandomVO, NextNumberRandomQuery, NextNumberRandomForm } from '@/api/mes/nextNumberRandom/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const nextNumberRandomList = ref<NextNumberRandomVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const nextNumberRandomFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: NextNumberRandomForm = {
  id: undefined,
  handle: undefined,
  site: undefined,
  randomCode: undefined,
  description: undefined,
  letterRange: undefined,
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
  secOuId: undefined
};
const data = reactive<PageData<NextNumberRandomForm, NextNumberRandomQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    handle: undefined,
    site: undefined,
    randomCode: undefined,
    description: undefined,
    letterRange: undefined,
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
    params: {}
  },
  rules: {
    id: [{ required: true, message: '记录唯一ID不能为空', trigger: 'blur' }],
    handle: [{ required: true, message: '行号不能为空', trigger: 'blur' }],
    site: [{ required: true, message: '租户ID不能为空', trigger: 'blur' }],
    randomCode: [{ required: true, message: '随机数编号不能为空', trigger: 'blur' }],
    description: [{ required: true, message: '描述不能为空', trigger: 'blur' }],
    letterRange: [{ required: true, message: '随机数范围不能为空', trigger: 'blur' }],
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
    secOuId: [{ required: true, message: '数据归属公司id不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询编号规则随机数列表 */
const getList = async () => {
  loading.value = true;
  const res = await listNextNumberRandom(queryParams.value);
  nextNumberRandomList.value = res.rows;
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
  nextNumberRandomFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: NextNumberRandomVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加编号规则随机数';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: NextNumberRandomVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getNextNumberRandom(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改编号规则随机数';
};

/** 提交按钮 */
const submitForm = () => {
  nextNumberRandomFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateNextNumberRandom(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addNextNumberRandom(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: NextNumberRandomVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除编号规则随机数编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delNextNumberRandom(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'mes/nextNumberRandom/export',
    {
      ...queryParams.value
    },
    `nextNumberRandom_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
