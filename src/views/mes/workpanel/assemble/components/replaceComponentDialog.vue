<script setup lang="ts">
import useDialog from '@/hooks/useDialog';
import { nextTick, onMounted, reactive, ref } from 'vue';
import { AssembleForm, AssembleQuery } from '@/api/mes/workpanel/assemble/types';
import * as services from '@/api/mes/workpanel';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const { title, visible, openDialog, closeDialog } = useDialog({
  title: '替换关键件'
});

const loading = ref(false);
const validateResult = ref<{ [key: string]: any }>({});
const queryFormRef = ref<ElFormInstance>();
const newBomItemSfcRef = ref<HTMLInputElement | null>(null);
const podConfig = ref<{ [key: string]: any }>({});
const initFormData: AssembleForm = {
  sfc: '',
  steps: [],
  stepActive: 0,
  stepName: '',
  bomComponentVo: {},
  bomComponentVoList: [],
  canAssembleComponents: false,
  assembleId: null,
  newBomItemSfc: '',
  itemNeedValid: false,
  itemNeedCheck: false
};
const data = reactive<PageData<AssembleForm, AssembleQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    sfc: '',
    steps: [],
    stepActive: 0,
    stepName: '',
    bomComponentVo: {},
    bomComponentVoList: [],
    canAssembleComponents: false,
    assembleId: null,
    newBomItemSfc: '',
    itemNeedValid: false,
    itemNeedCheck: false
  },
  rules: {
    newBomItemSfc: [{ required: true, message: '关键件条码不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const validateSfc = (value: any): { validateStatus: string; validateMsg: string } => {
  if (value) {
    value = value.replace(/\s/g, '');
    if (value.length > 0) {
      return {
        validateStatus: 'success',
        validateMsg: ''
      };
    }
  }
  return {
    validateStatus: 'error',
    validateMsg: '组件条码不能为空'
  };
};

const checkRepeat = (content: any) => {
  const regex = /^(.+)\1+$/;
  return regex.test(content);
};

const callbackValidate = (validateMsg: any, validateStatus: any, record: any) => {
  validateResult.value.validateMsg = validateMsg;
  validateResult.value.validateStatus = validateStatus;
  return validateStatus;
};

const handleChange = async (record: any) => {
  const sfc = record.newBomItemSfc;
  let { validateMsg, validateStatus } = validateSfc(sfc);
  if (checkRepeat(sfc)) {
    validateMsg = `条码:${sfc}扫码内容重复`;
    validateStatus = 'error';
    return callbackValidate(validateMsg, validateStatus, record);
  }
  debugger;
  if (Number(record.itemSfcLength) > 0 && sfc.length !== record.itemSfcLength) {
    validateMsg = `条码:${sfc}长度:${sfc.length}与设置的长度:${record.itemSfcLength}不匹配`;
    validateStatus = 'error';
    return callbackValidate(validateMsg, validateStatus, record);
  }
  if (record.sfcItemRule) {
    const regex = new RegExp(record.sfcItemRule);
    if (!regex.test(sfc)) {
      validateMsg = `条码:${sfc} 与设置的物料规则:${record.sfcItemRule}不匹配`;
      validateStatus = 'error';
      return callbackValidate(validateMsg, validateStatus, record);
    }
  } else if (record.sfcItemGroupRule) {
    const regex = new RegExp(record.sfcItemGroupRule);
    if (!regex.test(sfc)) {
      validateMsg = `条码:${sfc} 与设置的物料组规则:${record.sfcItemGroupRule}不匹配`;
      validateStatus = 'error';
      return callbackValidate(validateMsg, validateStatus, record);
    }
  }
  return validateStatus;
};

/** 键盘回车事件 */
const keyDownTab = async () => {
  const validateResult = await handleChange(form.value);
  if (validateResult == 'error') return;
  submitForm();
};

/** 取消按钮 */
const cancel = () => {
  queryFormRef.value?.resetFields();
  loading.value = false;
  validateResult.value = {};
  visible.value = false;
};

/** 提交按钮 */
const submitForm = () => {
  queryFormRef.value.validate(async (valid) => {
    if (valid) {
      form.value.newBomItemSfc = form.value.newBomItemSfc.trim();
      const params = {
        operation: podConfig?.value.operation,
        resource: podConfig?.value.resource,
        sfc: form.value.sfc,
        assembleId: form.value.assembleId,
        newComponentSfc: form.value.newBomItemSfc,
        itemNeedValid: form.value.itemNeedValid,
        itemNeedCheck: form.value.itemNeedCheck,
        activityId: ''
      };
      loading.value = true;
      const res: any = await services.replaceSfcBomComponent(params).finally(() => (loading.value = false));
      if (res.success) {
        proxy?.$modal.msgSuccess('替换关键件成功');
        proxy.$emit('replaceComponentCallBack', null);

        form.value.newBomItemSfc = '';
        closeDialog();
      } else {
        validateResult.value = res.data;
      }
    }
  });
};
const handleDialogOpened = () => {
  if (newBomItemSfcRef.value) {
    newBomItemSfcRef.value.focus();
  }
};

onMounted(async () => {});
defineExpose({
  openDialog(params: { podConfig: any; rowRecord: any }) {
    visible.value = true;
    loading.value = false;
    podConfig.value = params.podConfig;
    form.value = params.rowRecord;
    validateResult.value = {};
  },
  closeDialog
});
</script>

<template>
  <el-dialog v-model="visible" :title="title" width="70%" append-to-body @opened="handleDialogOpened">
    <el-form v-loading="loading" ref="queryFormRef" :model="form" :rules="rules" label-width="120px" class="optimized-form">
      <el-row :gutter="20">
        <el-col :lg="12" :md="12" :xs="24">
          <el-form-item label="工序：">
            <el-text class="form-text">{{ podConfig.operation }}</el-text>
          </el-form-item>
        </el-col>
        <el-col :lg="12" :md="12" :xs="24">
          <el-form-item label="资源：">
            <el-text class="form-text">{{ podConfig.resource }}</el-text>
          </el-form-item>
        </el-col>
        <el-col :lg="12" :md="12" :xs="24">
          <el-form-item label="物料：">
            <el-text class="form-text">{{ form.bomItem }}</el-text>
          </el-form-item>
        </el-col>

        <el-col :lg="12" :md="12" :xs="24">
          <el-form-item label="描述：">
            <el-text class="form-text">{{ form.bomItemDesc }}</el-text>
          </el-form-item>
        </el-col>
        <el-col :lg="12" :md="12" :xs="24">
          <el-form-item label="产品条码：">
            <el-text class="form-text">{{ form.sfc }}</el-text>
          </el-form-item>
        </el-col>
        <el-col :lg="12" :md="12" :xs="24">
          <el-form-item label="原组件条码：" class="form-item-content deleting-notice">
            <el-text class="form-text deleting-notice">{{ form.bomItemSfc }}</el-text>
          </el-form-item>
        </el-col>
        <el-col :lg="12" :md="12" :xs="24">
          <el-form-item label="物料正则：" class="form-item-content deleting-notice">
            <el-text class="form-text deleting-notice">{{ form.sfcItemRule }}</el-text>
          </el-form-item>
        </el-col>

        <el-col :lg="12" :md="12" :xs="24">
          <el-form-item
            label="替换组件条码："
            prop="newBomItemSfc"
            :error="validateResult.validateMsg"
            :class="['dynamic-error-item', { 'has-error': !!validateResult.validateMsg }]"
            :style="{ '--error-height': validateResult.validateMsg ? `${Math.ceil(validateResult.validateMsg.length / 30) * 15}px` : '0' }"
          >
            <el-input ref="newBomItemSfcRef" v-model="form.newBomItemSfc" placeholder="请输入替换组件条码" @keydown.tab.prevent="keyDownTab" @keydown.enter.prevent="keyDownTab" clearable />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="cancel">取 消</el-button>
      <el-button type="primary" @click="submitForm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.deleting-notice {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dynamic-error-item {
  position: relative;
  margin-bottom: var(--error-height, 0);
  transition: margin-bottom 0.2s;
}

.dynamic-error-item .el-form-item__error {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  font-size: 16px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 120px;
  overflow-y: auto;
  box-sizing: border-box;
  background: #fff;
  z-index: 10;
}
</style>
