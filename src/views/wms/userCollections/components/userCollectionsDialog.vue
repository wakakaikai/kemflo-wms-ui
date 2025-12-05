<template>
  <el-dialog v-model="visible" :title="title" width="70%" append-to-body>
    <el-card>
      <template #header>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto" class="mt-[18px]">
          <el-row>
            <el-col :lg="8" :md="8" :sm="24">
              <el-form-item label="工号" prop="userName">
                <el-input v-model="queryParams.userName" placeholder="请输入工号" clearable @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :lg="8" :md="8" :sm="24">
              <el-form-item label="姓名" prop="nickName">
                <el-input v-model="queryParams.nickName" placeholder="请输入姓名" clearable @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :lg="8" :md="8" :sm="24">
              <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </template>

      <el-table v-loading="loading" :data="userCollectionsList" border highlight-current-row @current-change="handleSelectionChange">
        <!-- 单选列（通过高亮行实现） -->
        <el-table-column width="55">
          <template #default="scope">
            <el-radio v-model="selectedRow.id" :label="scope.row?.id" class="radio-no-label">
              <span class="el-radio__label"></span>
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="工号" align="center" prop="userName" />
        <el-table-column label="姓名" align="center" prop="nickName" />
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="UserCollectionsDialog" lang="ts">
import useDialog from '@/hooks/useDialog';
import { listUserCollections } from '@/api/wms/userCollections';
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
    collectionType: 1,
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

const { title, visible, openDialog, closeDialog } = useDialog({
  title: '选择收藏用户'
});

const emit = defineEmits(['userCollectionsCallBack']);
/** 查询用户收藏列表 */
const getList = async () => {
  loading.value = true;
  const res = await listUserCollections(queryParams.value);
  userCollectionsList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  queryFormRef.value?.resetFields();
};

/** 取消按钮 */
const cancel = () => {
  reset();
  closeDialog();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 多选框选中数据 */
const selectedRow = ref<UserCollectionsForm>(initFormData);
const handleSelectionChange = (val: any) => {
  selectedRow.value = val || {};
};

/** 提交按钮 */
const submitForm = () => {
  emit('userCollectionsCallBack', selectedRow.value);
  closeDialog();
};

onMounted(() => {
  getList();
});
defineExpose({
  openDialog,
  closeDialog,
  handleQuery
});
</script>

<style lang="scss" scoped>
.radio-no-label {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -12px;
  .el-radio__label {
    display: none;
  }
}
</style>
