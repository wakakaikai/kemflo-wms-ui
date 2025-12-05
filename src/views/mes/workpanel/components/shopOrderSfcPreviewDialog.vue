<template>
  <div>
    <el-dialog v-model="visible" :title="title" width="480px" append-to-body>
      <el-form ref="queryFormRef" :model="queryParams" label-width="auto" class="text-center">
        <el-row :gutter="24">
          <el-col :lg="24" :md="24" :sm="24" :offset="1">
            <el-form-item label="条码样例" prop="sfc">
              <span class="sn-content">{{ queryParams.sfc }} </span>
            </el-form-item>
          </el-col>
          <el-col :lg="24" :md="24" :sm="24" :offset="1">
            <el-form-item label="单个数量" prop="qty">
              <span class="sn-qty">{{ queryParams.qty ? parseFloat(queryParams.qty) : '' }} </span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import useDialog from '@/hooks/useDialog';
import { releaseShopOrderSfc } from '@/api/mes/shopOrder';
import { SfcPreviewVO } from '@/api/mes/shopOrder/types';

const loading = ref(true);
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const queryFormRef = ref<ElFormInstance>();

const initFormData: SfcPreviewVO = {
  shopOrder: undefined,
  qty: undefined,
  releaseQty: undefined,
  sfc: undefined,
  sample: undefined
};
const data = reactive<PageData<SfcPreviewVO, SfcPreviewVO>>({
  form: { ...initFormData },
  queryParams: {
    shopOrder: undefined,
    qty: undefined,
    releaseQty: undefined,
    sfc: undefined,
    sample: undefined
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

const { title, visible, openDialog, closeDialog } = useDialog({
  title: '条码预览'
});

const initSfcPreviewDialog = async (shopOrder: string) => {
  queryParams.value.shopOrder = shopOrder;
  loading.value = true;
  const parmas: SfcPreviewVO = {
    shopOrder: queryParams.value.shopOrder,
    releaseQty: 1,
    sample: true
  };
  const res: any = await releaseShopOrderSfc(parmas).finally(() => (loading.value = false));
  if (res.data?.sfcVoList) {
    queryParams.value = { ...queryParams.value, ...res?.data?.sfcVoList[0] };
  }
};

const submitForm = () => {
  queryFormRef.value.validate((valid) => {
    if (valid) {
      proxy.$emit('sfcPreviewCallBack', true);
      closeDialog();
    }
  });
};
onMounted(async () => {});

defineExpose({
  openDialog,
  closeDialog,
  initSfcPreviewDialog
});
</script>

<style scoped>
.sn-qty {
  color: #1e62ea;
  font-size: 20px;
}
.sn-content {
  color: #f00;
  font-size: 20px;
  direction: ltr;
  text-align: left;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-family: inherit;
  line-height: 1.5;
}
</style>
