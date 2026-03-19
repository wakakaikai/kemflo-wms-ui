<template>
  <div>
    <el-dialog v-model="visible" :title="title" width="500px" append-to-body @opened="handleOpenDialog">
      <el-form ref="printCountFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="基本信息">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="工单号">{{ form.shopOrder }}</el-descriptions-item>
            <el-descriptions-item label="条码个数">{{ props.selectedShopOrderSfcList.length }}</el-descriptions-item>
          </el-descriptions>
        </el-form-item>
        <el-form-item label="打印类型" prop="printType">
          <el-select v-model="form.printType" filterable placeholder="请选择打印类型" style="width: 100%">
            <el-option v-for="item in printTypeList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="增加次数" prop="reprintQuantity">
          <el-input-number v-model="form.reprintQuantity" :min="1" :max="999" placeholder="请输入要增加的打印次数" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm" :loading="buttonLoading">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ShopOrderSfcReprintAuthorizeHistoryForm, ShopOrderSfcReprintAuthorizeHistoryQuery } from '@/api/mes/shopOrderSfcReprintAuthorizeHistory/types';
import useDialog from '@/hooks/useDialog';
import { addPrintCount } from '@/api/mes/shopOrderSfcReprintAuthorizeHistory';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const props = defineProps({
  selectedShopOrderSfcList: {
    type: Array,
    required: false,
    default: () => []
  }
});

const { title, visible, openDialog, closeDialog } = useDialog({
  title: '打印授权'
});

const printTypeList = ref<any[]>([
  { value: 1, label: '普通标签' },
  { value: 2, label: '即扫即打标签' }
]);

const emit = defineEmits(['confirm']);
const initFormData: ShopOrderSfcReprintAuthorizeHistoryForm = {
  id: undefined,
  traceId: undefined,
  shopOrder: undefined,
  sfc: undefined,
  dateTime: undefined,
  reprintQuantity: undefined,
  printType: undefined,
  creator: undefined,
  updater: undefined,
  modifyTime: undefined,
  tenantOrgId: undefined,
  belongOrgId: undefined,
  deleteFlag: undefined
};
const data = reactive<PageData<ShopOrderSfcReprintAuthorizeHistoryForm, ShopOrderSfcReprintAuthorizeHistoryQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    traceId: undefined,
    shopOrder: undefined,
    sfc: undefined,
    dateTime: undefined,
    reprintQuantity: null,
    printType: 2,
    creator: undefined,
    updater: undefined,
    modifyTime: undefined,
    tenantOrgId: undefined,
    belongOrgId: undefined,
    deleteFlag: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    shopOrder: [{ required: true, message: '工单号不能为空', trigger: 'blur' }],
    reprintQuantity: [{ required: true, message: '增加次数不能为空', trigger: 'blur' }],
    printType: [{ required: true, message: '打印类型不能为空', trigger: 'blur' }],
    remark: [{ required: true, message: '备注信息不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const buttonLoading = ref(false);
const printCountFormRef = ref<ElFormInstance>();

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  printCountFormRef.value?.resetFields();
};

/** 取消按钮 */
const cancel = () => {
  reset();
  closeDialog();
};
// 确认
const submitForm = async () => {
  printCountFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      await addPrintCount(form.value).finally(() => (buttonLoading.value = false));
      emit('confirm', { ...form });
      proxy?.$modal.msgSuccess('操作成功');
      closeDialog();
    }
  });
};
const handleOpenDialog = () => {
  form.value.shopOrder = props.selectedShopOrderSfcList[0].shopOrder || '';
  form.value.shopOrderSfcBoList = props.selectedShopOrderSfcList;
  form.value.printType = 2;
};
onMounted(() => {});

// 暴露方法给父组件
defineExpose({
  openDialog,
  closeDialog
});
</script>

<style scoped>
.dialog-footer {
  text-align: right;
  padding-top: 20px;
}
</style>
