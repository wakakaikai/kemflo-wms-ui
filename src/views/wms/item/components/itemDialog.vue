<template>
  <el-dialog v-model="visible" :title="title" width="70%" append-to-body>
    <el-card>
      <template #header>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true">
          <el-form-item label="物料" prop="item">
            <el-input v-model="queryParams.item" placeholder="请输入物料" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="描述" prop="itemDesc">
            <el-input v-model="queryParams.itemDesc" placeholder="请输入描述" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="旧料号" prop="oldItem">
            <el-input v-model="queryParams.oldItem" placeholder="请输入旧料号" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </template>
      <el-table v-loading="loading" :data="itemList" border highlight-current-row @current-change="handleSelectionChange">
        <!-- 单选列（通过高亮行实现） -->
        <el-table-column width="55">
          <template #default="scope">
            <el-radio v-model="selectedRow.id" :label="scope.row?.id" class="radio-no-label">
              <span class="el-radio__label"></span>
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="物料" align="center" prop="item" />
        <el-table-column label="描述" align="center" prop="itemDesc" />
        <el-table-column label="旧料号" align="center" prop="oldItem" />
        <el-table-column label="物料组" align="center" prop="itemGroup" />
        <el-table-column label="计量单位" align="center" prop="unit" />
        <el-table-column label="条码正则" align="center" prop="sfcRegular" />
        <el-table-column label="质检检查" align="center" prop="checkEnable">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.checkEnable" />
          </template>
        </el-table-column>
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

<script setup name="Item" lang="ts">
import { listItem } from '@/api/wms/item';
import { ItemVO, ItemQuery, ItemForm } from '@/api/wms/item/types';
import useDialog from '@/hooks/useDialog';
import { StorageLocationForm } from '@/api/wms/storageLocation/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_normal_disable'));

const itemList = ref<ItemVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const itemFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ItemForm = {
  id: undefined,
  item: undefined,
  itemDesc: undefined,
  oldItem: undefined,
  itemGroup: undefined,
  unit: undefined,
  checkEnable: undefined,
  remark: undefined
};
const data = reactive<PageData<ItemForm, ItemQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    item: undefined,
    itemDesc: undefined,
    oldItem: undefined,
    itemGroup: undefined,
    unit: undefined,
    checkEnable: null,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    item: [{ required: true, message: '物料不能为空', trigger: 'blur' }],
    itemDesc: [{ required: true, message: '描述不能为空', trigger: 'blur' }],
    itemGroup: [{ required: true, message: '物料组不能为空', trigger: 'blur' }],
    checkEnable: [{ required: true, message: '质检检查不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);
const emit = defineEmits(['itemSelectCallBack']);
const { title, visible, openDialog, closeDialog } = useDialog({
  title: '选择物料'
});

/** 查询物料列表 */
const getList = async () => {
  loading.value = true;
  const res = await listItem(queryParams.value);
  itemList.value = res.rows;
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
  itemFormRef.value?.resetFields();
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
const selectedRow = ref<ItemForm>(initFormData);
const handleSelectionChange = (selection: any) => {
  selectedRow.value = selection || {};
};

/** 提交按钮 */
const submitForm = () => {
  emit('itemSelectCallBack', selectedRow.value);
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
