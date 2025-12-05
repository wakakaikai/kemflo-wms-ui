<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="工号" prop="userName">
              <el-input v-model="queryParams.userName" placeholder="请输入工号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="姓名" prop="nickName">
              <el-input v-model="queryParams.nickName" placeholder="请输入姓名" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="收藏类型" prop="collectionType">
              <el-select v-model="queryParams.collectionType" placeholder="请选择收藏类型" clearable>
                <el-option v-for="dict in wms_user_collect_type" :key="dict.value" :label="dict.label" :value="dict.value" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:userCollections:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:userCollections:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:userCollections:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:userCollections:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="userCollectionsList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="工号" align="center" prop="userName" />
        <el-table-column label="姓名" align="center" prop="nickName" />
        <el-table-column label="收藏类型" align="center" prop="collectionType">
          <template #default="scope">
            <dict-tag :options="wms_user_collect_type" :value="scope.row.collectionType" />
          </template>
        </el-table-column>
        <el-table-column label="显示排序" align="center" prop="sequence" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:userCollections:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:userCollections:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改用户收藏对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="userCollectionsFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="工号" prop="userName">
          <el-input v-model="form.userName" placeholder="请输入工号" />
        </el-form-item>
        <el-form-item label="收藏类型" prop="collectionType">
          <el-select v-model="form.collectionType" placeholder="请选择收藏类型">
            <el-option v-for="dict in wms_user_collect_type" :key="dict.value" :label="dict.label" :value="parseInt(dict.value)"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="显示排序" prop="sequence">
          <el-input-number v-model="form.sequence" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
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

<script setup name="UserCollections" lang="ts">
import { listUserCollections, getUserCollections, delUserCollections, addUserCollections, updateUserCollections } from '@/api/wms/userCollections';
import { UserCollectionsVO, UserCollectionsQuery, UserCollectionsForm } from '@/api/wms/userCollections/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_user_collect_type } = toRefs<any>(proxy?.useDict('wms_user_collect_type'));

const userCollectionsList = ref<UserCollectionsVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const userCollectionsFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: UserCollectionsForm = {
  id: undefined,
  userId: undefined,
  userName: undefined,
  nickName: undefined,
  collectionType: 1,
  sequence: 1,
  remark: undefined
};
const data = reactive<PageData<UserCollectionsForm, UserCollectionsQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    userId: undefined,
    userName: undefined,
    nickName: undefined,
    collectionType: undefined,
    sequence: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    userName: [{ required: true, message: '工号不能为空', trigger: 'blur' }],
    collectionType: [{ required: true, message: '收藏类型不能为空', trigger: 'change' }],
    sequence: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询用户收藏列表 */
const getList = async () => {
  loading.value = true;
  const res = await listUserCollections(queryParams.value);
  userCollectionsList.value = res.rows;
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
  userCollectionsFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: UserCollectionsVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加用户收藏';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: UserCollectionsVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getUserCollections(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改用户收藏';
};

/** 提交按钮 */
const submitForm = () => {
  userCollectionsFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateUserCollections(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addUserCollections(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: UserCollectionsVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除用户收藏编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delUserCollections(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/userCollections/export',
    {
      ...queryParams.value
    },
    `userCollections_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
